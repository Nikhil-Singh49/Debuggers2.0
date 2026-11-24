import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useSchool } from '../context/SchoolContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import api from '../api/client.js';
import { queueAttendance, syncPendingAttendance } from '../api/offlineAttendance.js';
import {
  createClassQrSession,
  getStudentQrAttendance,
  localDateKey,
  saveStudentQrAttendance,
  validateClassQr,
} from '../api/demoQrAttendance.js';
import { createSeed, daysToTarget, prediction } from '../data/seed.js';
import { TIMETABLE_CLASS, TIMETABLE_DAYS, TIMETABLE_SCHEDULE } from '../data/timetable.js';
import QrAttendanceScanner from '../components/QrAttendanceScanner.jsx';
import Modal, { Badge, SkeletonLoader, AttendanceProgressRing } from '../components/ui.jsx';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

function todayName() {
  const name = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(new Date());
  return TIMETABLE_DAYS.includes(name) ? name : 'Monday';
}

export default function Attendance() {
  const { user } = useAuth();
  const { data, refresh, setData } = useSchool();
  const toast = useToast();
  const [marks, setMarks] = useState({});
  const [graphStudent, setGraphStudent] = useState(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedDay, setSelectedDay] = useState(todayName);
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [teacherQr, setTeacherQr] = useState(null);
  const [qrScannerOpen, setQrScannerOpen] = useState(false);
  const [studentQrMark, setStudentQrMark] = useState(null);
  const [qrScannerError, setQrScannerError] = useState('');
  const [analyticsStudentId, setAnalyticsStudentId] = useState('');

  const min = data?.settings.minAttendance ?? 75;
  const me = data?.students[0];
  const pred = me ? prediction(me, min) : null;
  const studentClass = me?.klass;
  const teacherSlots = user.role === 'Teacher'
    ? (TIMETABLE_SCHEDULE[selectedDay] || [])
      .filter((slot) => slot.teacher === user.name)
      .map((slot) => ({ ...slot, className: TIMETABLE_CLASS }))
    : [];
  const selectedSlot = teacherSlots.find((slot) => slot.id === selectedSlotId) || teacherSlots[0] || null;

  useEffect(() => {
    if (user.role !== 'Student' || !user.id || !studentClass) return;
    try {
      const today = localDateKey();
      const records = getStudentQrAttendance(user.id);
      setStudentQrMark(records.find((record) => record.date === today && record.className === studentClass) || null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not load QR attendance';
      setQrScannerError(message);
      toast(message);
    }
  }, [studentClass, toast, user.id, user.role]);

  const handleStudentQrScan = useCallback((rawValue) => {
    try {
      const session = validateClassQr(rawValue, { expectedClass: studentClass });
      const record = saveStudentQrAttendance(user.id, session);
      setStudentQrMark(record);
      setQrScannerOpen(false);
      setQrScannerError('');
      toast(`Demo attendance recorded for ${session.className}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not record QR attendance';
      setQrScannerError(message);
      setQrScannerOpen(false);
      toast(message);
    }
  }, [studentClass, toast, user.id]);

  const handleScannerError = useCallback((error) => {
    const message = error?.name === 'NotAllowedError'
      ? 'Allow camera access to scan the class QR code.'
      : 'Could not start the QR scanner. Check camera access and try again.';
    setQrScannerError(message);
    setQrScannerOpen(false);
    toast(message);
  }, [toast]);

  const showTeacherQr = async () => {
    if (!selectedSlot) {
      toast('No timetable slot is assigned to you for this day.');
      return;
    }
    try {
      const { default: QRCode } = await import('qrcode');
      const session = createClassQrSession({
        className: selectedSlot.className,
        slotId: selectedSlot.id,
        subject: selectedSlot.subject,
      });
      const image = await QRCode.toDataURL(JSON.stringify(session), {
        width: 280,
        margin: 2,
        errorCorrectionLevel: 'M',
      });
      setTeacherQr({ image, session });
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Could not create class QR code');
    }
  };

  if (!data || !me) return <SkeletonLoader count={3} />;

  const saveAttendance = async () => {
    if (user.role === 'Teacher' && !selectedSlot) {
      toast('Select an assigned timetable slot before marking attendance.');
      return;
    }
    const markEntries = Object.entries(marks);
    if (markEntries.length === 0) {
      toast('Please mark at least one student before saving.');
      return;
    }

    setSaving(true);
    const date = localDateKey();
    const entries = markEntries.map(([id, status]) => {
      const [klass, student] = id.split('|');
      return { klass, student, status, date };
    });

    try {
      if (!navigator.onLine) {
        const pendingSync = queueAttendance(entries);
        setData((current) => ({ ...current, pendingSync }));
        toast('⚡ Stored offline — will auto-sync when reconnected');
        return;
      }
      await api.post('/attendance', { entries });
      toast('✓ Attendance saved successfully');
      refresh();
    } catch (err) {
      const message = err?.response?.data?.message ||
        err?.response?.data?.error?.message ||
        'Error saving attendance records';
      toast(message);
    } finally {
      setSaving(false);
    }
  };

  // Student view
  if (user.role === 'Student') {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="grid gap-6 md:grid-cols-3 items-center">
          <article className="card flex justify-center items-center">
            <AttendanceProgressRing current={me.attendance} target={min} size={160} />
          </article>

          <article className="card space-y-3">
            <span className="eyebrow">Attendance Target Policy</span>
            <div>
              <strong className="block text-2xl font-bold text-ink">{min}% Required</strong>
              <p className="text-xs text-muted mt-1">
                {pred.days ? `Attend next ${pred.days} working days to reach threshold` : '✅ Current attendance satisfies policy requirement'}
              </p>
            </div>
            <div className="pt-2 border-t border-line text-xs space-y-1">
              <div className="flex justify-between">
                <span>Present Days:</span>
                <strong className="text-green">{me.present} Days</strong>
              </div>
              <div className="flex justify-between">
                <span>Absent Days:</span>
                <strong className="text-red">{me.absent} Days</strong>
              </div>
              <div className="flex justify-between">
                <span>Late Arrivals:</span>
                <strong className="text-orange">{me.late} Days</strong>
              </div>
            </div>
          </article>

          <article className="card space-y-3">
            <span className="eyebrow">Real What-If Impact</span>
            <h3 className="font-display text-base font-bold text-ink">Upcoming Day Prediction</h3>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-green-soft border border-green/20 flex justify-between items-center">
                <span>If Present Tomorrow:</span>
                <strong className="text-green text-sm font-bold">{pred.nextPresent}%</strong>
              </div>
              <div className="p-2.5 rounded-xl bg-red-soft border border-red/20 flex justify-between items-center">
                <span>If Absent Tomorrow:</span>
                <strong className="text-red text-sm font-bold">{pred.nextAbsent}%</strong>
              </div>
              <p className="text-[11px] text-muted pt-1">
                Calculated dynamically from total {me.working} registered working days.
              </p>
            </div>
          </article>
        </div>

        <article className="card space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="eyebrow">QR Check-in</span>
              <h2 className="font-display text-lg font-bold text-ink">Scan your class code</h2>
              <p className="mt-1 text-xs text-muted">
                Ask your teacher to display a current {studentClass} attendance QR code.
              </p>
            </div>
            {studentQrMark && <Badge status="present">Checked in today</Badge>}
          </div>

          {studentQrMark ? (
            <div className="rounded-2xl border border-green/20 bg-green-soft p-4 text-sm text-green-900">
              <strong>{studentQrMark.subject} · {studentQrMark.className}</strong>
              <span className="mt-1 block text-xs">
                Demo check-in recorded at {new Date(studentQrMark.checkedInAt).toLocaleTimeString()}.
              </span>
            </div>
          ) : qrScannerOpen ? (
            <div className="space-y-3">
              <QrAttendanceScanner onScan={handleStudentQrScan} onError={handleScannerError} />
              <button className="btn-outline px-3 py-2 text-xs font-semibold" onClick={() => setQrScannerOpen(false)}>
                Stop scanner
              </button>
            </div>
          ) : (
            <button
              className="btn-primary px-4 py-2.5 text-xs font-bold"
              onClick={() => {
                setQrScannerError('');
                setQrScannerOpen(true);
              }}
            >
              Open camera scanner
            </button>
          )}

          {qrScannerError && <p role="alert" className="text-xs text-red-700">{qrScannerError}</p>}
          <p className="text-[11px] text-muted">
            Demo only: check-ins are saved on this browser and are not sent to the teacher’s attendance roster.
          </p>
        </article>
      </div>
    );
  }

  const seedStudents = createSeed().students;
  const rosterStudents = [...data.students];
  seedStudents.forEach((seedStudent) => {
    if (!rosterStudents.some((student) => student.id === seedStudent.id)) {
      rosterStudents.push(seedStudent);
    }
  });

  const filteredStudents = rosterStudents.filter((student) => (
    (user.role !== 'Teacher' || (selectedSlot && student.klass === selectedSlot.className)) &&
    (student.name.toLowerCase().includes(search.toLowerCase()) ||
      student.klass.toLowerCase().includes(search.toLowerCase()))
  ));

  const lowStudents = rosterStudents.filter((s) => s.attendance < min);
  const analyticsStudent = filteredStudents.find((student) => student.id === analyticsStudentId)
    || filteredStudents[0]
    || rosterStudents[0];
  const calendarDate = new Date();
  const calendarYear = calendarDate.getFullYear();
  const calendarMonth = calendarDate.getMonth();
  const calendarMonthName = calendarDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const calendarDays = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const calendarLeadingDays = new Date(calendarYear, calendarMonth, 1).getDay();
  const classStudents = analyticsStudent
    ? rosterStudents.filter((student) => student.klass === analyticsStudent.klass)
    : [];
  const classAverage = classStudents.length
    ? Math.round(classStudents.reduce((sum, student) => sum + student.attendance, 0) / classStudents.length)
    : 0;
  const analyticsPrediction = analyticsStudent ? prediction(analyticsStudent, min) : null;
  const studentTrend = analyticsStudent?.months.map((value, index) => ({
    month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'][index],
    student: value,
    required: min,
  })) || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Offline Sync Banner */}
      <div className={`rounded-2xl border p-4 transition-colors ${
        !navigator.onLine 
          ? 'border-red-200 bg-red-soft text-red-900' 
          : data.pendingSync.length > 0 
            ? 'border-amber-200 bg-orange-soft text-amber-900' 
            : 'border-lime-200 bg-green-soft text-lime-900'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-base">
              {!navigator.onLine ? '🔴' : data.pendingSync.length > 0 ? '⚡' : '🟢'}
            </span>
            <div>
              <strong className="font-bold">
                {!navigator.onLine 
                  ? 'Offline Mode Active' 
                  : data.pendingSync.length > 0 
                    ? `${data.pendingSync.length} Attendance Entries Pending Sync` 
                    : 'System Connected & Synced'}
              </strong>
              <span className="block text-[11px] opacity-85">
                Marks taken while offline are saved safely in local storage and will push automatically.
              </span>
            </div>
          </div>
          {data.pendingSync.length > 0 && navigator.onLine && (
            <button 
              onClick={async () => {
                try {
                  await syncPendingAttendance();
                  toast('Sync complete!');
                  refresh();
                } catch (error) {
                  toast(error.response?.data?.error?.message || 'Attendance sync failed');
                }
              }}
              className="btn-touch px-3 py-1.5 rounded-xl bg-amber-500 text-white font-bold text-xs shadow-xs"
            >
              Sync Now ↻
            </button>
          )}
        </div>
      </div>

      {user.role === 'Teacher' && (
        <article className="card space-y-4">
          <div>
            <span className="eyebrow">Timetable session</span>
            <h2 className="font-display text-lg font-bold text-ink">Choose a lesson to take attendance</h2>
            <p className="mt-1 text-xs text-muted">The roster is limited to the selected timetable class.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-[0.7fr_1.3fr_auto]">
            <select
              className="input"
              value={selectedDay}
              onChange={(event) => {
                setSelectedDay(event.target.value);
                setSelectedSlotId('');
                setMarks({});
                setTeacherQr(null);
              }}
            >
              {TIMETABLE_DAYS.map((day) => <option key={day} value={day}>{day}</option>)}
            </select>
            <select
              className="input"
              value={selectedSlot?.id || ''}
              disabled={!teacherSlots.length}
              onChange={(event) => {
                setSelectedSlotId(event.target.value);
                setMarks({});
                setTeacherQr(null);
              }}
            >
              {!teacherSlots.length && <option value="">No assigned lessons</option>}
              {teacherSlots.map((slot) => (
                <option key={slot.id} value={slot.id}>
                  {slot.time} · {slot.subject} · {slot.className}
                </option>
              ))}
            </select>
            <button
              disabled={!selectedSlot}
              onClick={showTeacherQr}
              className="btn-outline px-4 py-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-50"
            >
              Show class QR
            </button>
          </div>
          {selectedSlot && (
            <p className="rounded-xl bg-blue-50 px-3 py-2 text-xs text-blue-800">
              {selectedSlot.subject} · {selectedSlot.className} · {selectedSlot.room} · {selectedSlot.time}
            </p>
          )}
        </article>
      )}

      {/* Main Register */}
      <article className="card">
        <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-line pb-4">
          <div>
            <span className="eyebrow">Class Register</span>
            <h2 className="font-display text-xl font-bold text-ink">
              Mark Attendance — {new Date().toLocaleDateString('en-IN')}
            </h2>
            {user.role === 'Teacher' && selectedSlot && (
              <p className="mt-1 text-xs text-muted">{selectedSlot.subject} · {selectedSlot.className}</p>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <input 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter student or section..."
              className="input h-10 text-xs w-full sm:w-48"
            />
            <button 
              disabled={saving || (user.role === 'Teacher' && !selectedSlot)}
              onClick={saveAttendance}
              className="btn-primary whitespace-nowrap"
            >
              {saving ? 'Saving...' : 'Save Attendance'}
            </button>
          </div>
        </div>

        <div className="divide-y divide-line">
          {filteredStudents.map((s) => {
            const key = `${s.klass}|${s.name}`;
            const current = marks[key];

            return (
              <div key={s.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-3 gap-3">
                <div>
                  <strong className="block text-sm font-bold text-ink">{s.name}</strong>
                  <span className="text-xs text-muted">{s.klass} · Current Rate: {s.attendance}%</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {[
                    { id: 'present', label: 'Present', color: 'btn-touch border font-bold text-xs rounded-xl px-3 bg-green-soft text-green border-green/30' },
                    { id: 'absent', label: 'Absent', color: 'btn-touch border font-bold text-xs rounded-xl px-3 bg-red-soft text-red border-red/30' },
                    { id: 'late', label: 'Late', color: 'btn-touch border font-bold text-xs rounded-xl px-3 bg-orange-soft text-orange border-orange/30' },
                  ].map((st) => {
                    const isSelected = current === st.id;
                    return (
                      <button 
                        key={st.id} 
                        onClick={() => setMarks((m) => ({ ...m, [key]: st.id }))}
                        className={`min-h-[44px] min-w-[70px] rounded-xl px-3 text-xs font-bold transition-all border ${
                          isSelected 
                            ? st.color 
                            : 'border-line bg-white text-muted hover:bg-slate-50'
                        }`}
                      >
                        {st.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </article>

      {analyticsStudent && (
        <>
          <article className="card space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="eyebrow">Attendance Calendar</span>
                <h2 className="font-display text-lg font-bold text-ink">
                  {analyticsStudent.name} — {calendarMonthName}
                </h2>
              </div>
              <select
                className="input h-10 w-full text-xs sm:w-64"
                value={analyticsStudent.id}
                onChange={(event) => setAnalyticsStudentId(event.target.value)}
                aria-label="Choose a student"
              >
                {filteredStudents.map((student) => (
                  <option key={student.id} value={student.id}>{student.name}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap gap-3 text-[11px] font-semibold">
              <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-green-500" />Present</span>
              <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-red-500" />Absent</span>
              <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-amber-400" />Late</span>
              <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-slate-400" />Holiday</span>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="py-1 text-[10px] font-bold uppercase text-muted">{day}</div>
              ))}
              {Array.from({ length: calendarLeadingDays }).map((_, index) => (
                <div key={`blank-${index}`} />
              ))}
              {Array.from({ length: calendarDays }, (_, index) => {
                const day = index + 1;
                const date = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const markKey = `${analyticsStudent.klass}|${analyticsStudent.name}|${date}`;
                const savedStatus = data.marks?.[markKey];
                const status = savedStatus || data.calendar?.[day] || 'present';
                const styles = {
                  present: 'border-green-200 bg-green-soft text-green-800',
                  absent: 'border-red-200 bg-red-soft text-red-800',
                  late: 'border-amber-200 bg-orange-soft text-amber-800',
                  holiday: 'border-slate-200 bg-slate-100 text-slate-600',
                };
                return (
                  <div
                    key={day}
                    className={`aspect-square min-h-9 rounded-lg border p-1 text-xs font-bold ${styles[status] || styles.present}`}
                    title={`${day} ${calendarMonthName}: ${status}`}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
          </article>

          <article className="card space-y-4">
            <div>
              <span className="eyebrow">Attendance Analytics</span>
              <h2 className="font-display text-lg font-bold text-ink">
                {analyticsStudent.name} — Performance
              </h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-line bg-slate-50 p-4">
                <span className="text-[11px] font-bold uppercase text-muted">Student Rate</span>
                <strong className="mt-1 block text-2xl text-ink">{analyticsStudent.attendance}%</strong>
              </div>
              <div className="rounded-2xl border border-blue-100 bg-blue-soft p-4">
                <span className="text-[11px] font-bold uppercase text-muted">Class Average</span>
                <strong className="mt-1 block text-2xl text-blue">{classAverage}%</strong>
              </div>
              <div className="rounded-2xl border border-green-100 bg-green-soft p-4">
                <span className="text-[11px] font-bold uppercase text-muted">Required Minimum</span>
                <strong className="mt-1 block text-2xl text-green">{min}%</strong>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.6fr_0.7fr]">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={studentTrend}>
                    <CartesianGrid stroke="#edf0f5" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                    <YAxis domain={[50, 100]} stroke="#94a3b8" fontSize={11} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="student" name="Student" stroke="#2563EB" strokeWidth={3} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="required" name={`Required ${min}%`} stroke="#84CC16" strokeDasharray="6 4" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col justify-center rounded-2xl border border-amber-200 bg-orange-soft p-5">
                <span className="eyebrow">Prediction</span>
                <strong className="mt-2 text-3xl font-bold text-amber-900">
                  {analyticsPrediction?.days || 0}
                </strong>
                <span className="mt-1 text-sm font-bold text-amber-900">
                  working days needed
                </span>
                <p className="mt-2 text-xs text-amber-800">
                  {analyticsStudent.attendance >= min
                    ? `Already meets the ${min}% required attendance.`
                    : `Consecutive working days may raise this student to at least ${min}%.`}
                </p>
              </div>
            </div>
          </article>
        </>
      )}

      {/* Low Attendance Roster */}
      <article className="card">
        <div className="mb-4">
          <span className="eyebrow">Risk Alerts</span>
          <h2 className="font-display text-lg font-bold text-ink">Students Below {min}% Minimum</h2>
        </div>

        <div className="divide-y divide-line">
          {lowStudents.map((s) => (
            <div key={s.id} className="flex items-center justify-between py-3">
              <div>
                <strong className="block text-xs font-bold text-ink">{s.name} ({s.klass})</strong>
                <span className="text-xs text-muted">
                  {s.attendance}% Attendance · Needs {daysToTarget(s, min)} working days to reach {min}%
                </span>
              </div>
              <button 
                onClick={() => setGraphStudent(s)}
                className="btn-outline px-3 py-1.5 text-xs text-blue font-bold rounded-xl"
              >
                View Trend Graph →
              </button>
            </div>
          ))}
        </div>
      </article>

      {teacherQr && (
        <Modal title="Class Attendance QR" onClose={() => setTeacherQr(null)}>
          <div className="space-y-4 text-center">
            <p className="text-sm font-bold text-ink">
              {teacherQr.session.subject} · {teacherQr.session.className}
            </p>
            <img src={teacherQr.image} alt="Class attendance QR code" className="mx-auto w-64 rounded-xl border border-line p-2" />
            <p className="text-xs text-muted">
              This demo code expires at {new Date(teacherQr.session.expiresAt).toLocaleTimeString()}.
              Students scan it from their own devices.
            </p>
            <p className="text-[11px] text-amber-800">
              Demo check-ins are stored only on each student’s device and do not update this register.
            </p>
          </div>
        </Modal>
      )}

      {/* Graph Modal */}
      {graphStudent && (
        <Modal title={`Attendance Trend — ${graphStudent.name}`} onClose={() => setGraphStudent(null)}>
          <div className="space-y-4">
            <p className="text-xs text-muted">
              Monthly breakdown for section {graphStudent.klass}. Current rate: <strong>{graphStudent.attendance}%</strong>
            </p>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={graphStudent.months.map((v, i) => ({ month: `Month ${i+1}`, value: v }))}>
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                  <YAxis domain={[50, 100]} stroke="#94a3b8" fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#2563EB" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

