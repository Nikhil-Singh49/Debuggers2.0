import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, Legend } from 'recharts';
import { useAuth } from '../context/AuthContext.jsx';
import { useSchool } from '../context/SchoolContext.jsx';
import { daysToTarget, prediction } from '../data/seed.js';
import { loadDemoFeeState } from '../api/demoFees.js';
import { Stat, AiCard, Badge, SkeletonLoader } from '../components/ui.jsx';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];

export default function Dashboard() {
  const { user } = useAuth();
  const { data } = useSchool();
  const navigate = useNavigate();
  const [selectedDay, setSelectedDay] = useState(null);
  const [demoDue, setDemoDue] = useState(null);
  const [demoFeeError, setDemoFeeError] = useState('');

  useEffect(() => {
    if (user.role !== 'Student' || user.name !== 'Aditi Sharma') return;
    try {
      const state = loadDemoFeeState();
      setDemoDue(state.fees
        .filter((fee) => fee.status === 'Pending')
        .reduce((total, fee) => total + fee.amount, 0));
    } catch (error) {
      setDemoFeeError(error instanceof Error ? error.message : 'Could not load demo fee balance');
    }
  }, [user.name, user.role]);

  if (!data) return <SkeletonLoader count={4} />;

  const min = data.settings.minAttendance;
  const me = data.students[0];
  const low = data.students.filter((s) => s.attendance < min);

  // 1. STUDENT DASHBOARD
  if (user.role === 'Student') {
    const isAditiStudent = me.name === 'Aditi Sharma';
    const feeDue = isAditiStudent ? demoDue : me.due;
    const pred = prediction(me, min);
    const chartData = me.months.map((v, i) => ({ month: months[i], you: v, classAvg: 88, required: min }));

    return (
      <div className="space-y-6 animate-fade-in">
        {/* Status Alert Banner */}
        <div className={`rounded-2xl border p-4 transition-all ${
          me.attendance < min 
            ? 'border-red-200 bg-red-soft text-red-900' 
            : 'border-lime-200 bg-green-soft text-lime-900'
        }`}>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div>
              <strong className="block text-sm font-bold">
                {me.attendance < min ? '⚠️ Attendance Alert Required' : '🎉 Excellent Attendance Track'}
              </strong>
              <p className="text-xs mt-0.5 opacity-90">
                {me.attendance < min 
                  ? `Your current attendance is ${me.attendance}%. You must attend at least ${pred.days} consecutive working days to hit the ${min}% requirement.`
                  : `Your attendance is ${me.attendance}%, well above the minimum requirement of ${min}%. Keep it up!`}
              </p>
            </div>
            {me.attendance < min && (
              <button onClick={() => navigate('/app/timetable')} className="btn-touch px-3 py-1.5 rounded-xl bg-red text-white text-xs font-bold whitespace-nowrap">
                View Timetable →
              </button>
            )}
          </div>
        </div>

        {/* Core KPI Metrics */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Today's Status" icon="✓" value="Present" note="Marked at 08:42 AM" tone="green" trend="+1.2%" />
          <Stat label="Overall Attendance" icon="%" value={`${me.attendance}%`} note={`Target minimum ${min}%`} tone={me.attendance < min ? 'red' : 'blue'} />
          <Stat
            label="Fee Status"
            icon="₹"
            value={feeDue == null
              ? 'Loading'
              : feeDue ? `₹${feeDue.toLocaleString('en-IN')}` : '₹0 Due'}
            note={feeDue == null ? demoFeeError || 'Loading demo fee balance' : feeDue ? 'Pending' : 'Paid'}
            tone={feeDue == null || feeDue ? 'amber' : 'green'}
          />
          <Stat label="Health Score" icon="♡" value={me.health} note="Academic & Health Rating" tone="violet" />
        </div>

        {/* Charts & AI Warning */}
        <div className="grid gap-6 lg:grid-cols-3">
          <article className="card lg:col-span-2 min-h-[340px]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <span className="eyebrow">Attendance Trend</span>
                <h2 className="font-display text-lg font-bold text-ink">You vs Class Avg vs Target ({min}%)</h2>
              </div>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                  <YAxis domain={[60, 100]} stroke="#94a3b8" fontSize={11} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} />
                  <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
                  <Line type="monotone" name="Your Attendance" dataKey="you" stroke="#2563EB" strokeWidth={3} dot={{ r: 4 }} />
                  <Line type="monotone" name="Class Average" dataKey="classAvg" stroke="#84CC16" strokeWidth={2} strokeDasharray="4 4" />
                  <Line type="monotone" name="Target (75%)" dataKey="required" stroke="#f59e0b" strokeWidth={2} strokeDasharray="2 2" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </article>

          <div className="space-y-6">
            <AiCard
              type={me.attendance < min || (feeDue != null && feeDue > 0) ? 'warning' : 'insight'}
              title="Student AI Early Warning"
              subtitle="Real-time check on attendance & fee status"
              points={[
                `Attendance: ${me.attendance}% (${me.attendance >= min ? 'Sufficient' : 'Needs improvement'})`,
                `Fee Account: ${feeDue == null
                  ? demoFeeError || 'Demo fee balance is loading'
                  : feeDue > 0 ? `₹${feeDue.toLocaleString('en-IN')} pending` : 'Fully Paid'}`,
                `Action: ${me.attendance >= min ? 'Maintain attendance for upcoming exams' : `Attend next ${pred.days} classes`}`
              ]}
              actionText="View Fee Details"
              onAction={() => navigate('/app/fees')}
            />

            <article className="card">
              <span className="eyebrow">Monthly Register</span>
              <h2 className="mb-3 font-display text-base font-bold text-ink">September 2026</h2>
              <div className="grid grid-cols-7 gap-1.5 text-center text-xs">
                {Object.entries(data.calendar).map(([d, status]) => (
                  <button 
                    key={d} 
                    onClick={() => setSelectedDay({ d, status })}
                    className={`h-8 w-8 mx-auto rounded-xl flex items-center justify-center font-bold transition-all ${
                      status === 'present' ? 'bg-green-soft text-green hover:bg-green-100' :
                      status === 'absent' ? 'bg-red-soft text-red hover:bg-red-100' :
                      status === 'late' ? 'bg-orange-soft text-orange hover:bg-orange-100' :
                      'bg-indigo-soft text-indigo'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted text-center font-medium">
                {selectedDay ? `Sep ${selectedDay.d} — Status: ${selectedDay.status.toUpperCase()}` : 'Tap any date to view status'}
              </p>
            </article>
          </div>
        </div>
      </div>
    );
  }

  // 2. TEACHER DASHBOARD
  if (user.role === 'Teacher') {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Fast Attendance Action Card */}
        <div className="card bg-gradient-to-r from-blue to-indigo text-white p-6 relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
            <div>
              <span className="tag bg-white/20 text-white font-semibold">Express Attendance</span>
              <h2 className="font-display text-2xl font-bold mt-1">Ready to mark today's register?</h2>
              <p className="text-xs text-blue-100 mt-1 max-w-md">
                Fast 1-click register marking for assigned section VI-A (Maths). Supports full offline sync.
              </p>
            </div>
            <button 
              onClick={() => navigate('/app/attendance')} 
              className="btn-touch px-5 py-3 rounded-xl bg-white text-blue font-bold text-xs shadow-lg hover:bg-blue-soft transition-all"
            >
              Open Class Register →
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Today's Classes" icon="▦" value="04" note="Next: VI-A Maths at 10:00 AM" tone="blue" />
          <Stat label="Section Attendance" icon="%" value="86%" note="Average for assigned sections" tone="green" />
          <Stat label={`Below ${min}% Threshold`} icon="!" value={low.length} note="Students need follow-up" tone="amber" />
          <Stat label="Sync Queue" icon="↻" value={data.pendingSync.length} note={navigator.onLine ? 'Online' : 'Offline Mode'} tone="violet" />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <article className="card">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <span className="eyebrow">Classes Overview</span>
                <h2 className="font-display text-lg font-bold text-ink">Assigned Sections</h2>
              </div>
              <button onClick={() => navigate('/app/attendance')} className="text-xs font-bold text-blue hover:underline">
                Mark All →
              </button>
            </div>
            <div className="divide-y divide-line">
              {data.classes.map((c) => (
                <div key={c.name} className="flex items-center justify-between py-3">
                  <div>
                    <strong className="block text-sm font-bold text-ink">{c.name}</strong>
                    <span className="text-xs text-muted">{c.students} Students · {c.subject}</span>
                  </div>
                  <Badge status={c.rate < min ? 'absent' : 'present'}>
                    {c.rate}% Attendance
                  </Badge>
                </div>
              ))}
            </div>
          </article>

          <AiCard
            title="Class AI Attendance Insights"
            subtitle="Automated analysis across assigned sections"
            points={[
              `Lowest attendance day detected: Mondays (Average 79.4%)`,
              `${low.length} students are currently below the required ${min}% attendance requirement`,
              `Top absentees requiring parent follow-up: ${low.map((s) => s.name).slice(0, 3).join(', ')}`
            ]}
            actionText="Review At-Risk Roster"
            onAction={() => navigate('/app/students')}
          />
        </div>
      </div>
    );
  }

  // 3. ACCOUNTS DASHBOARD
  if (user.role === 'Accounts') {
    const pendingStudents = data.students.filter((s) => s.status === 'Pending');
    const overdueStudents = data.students.filter((s) => s.status === 'Overdue');

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Collected This Month" icon="₹" value="₹8.9 Lakhs" note="↗ +₹2.1L vs last month" tone="violet" trend="+31%" />
          <Stat label="Pending Accounts" icon="◷" value={pendingStudents.length} note="Awaiting due date" tone="amber" />
          <Stat label="Overdue Fees" icon="!" value={overdueStudents.length} note="Automated SMS active" tone="red" />
          <Stat label="Transport Revenue" icon="▣" value="₹1.4 Lakhs" note="Separate in reports" tone="green" />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <article className="card lg:col-span-2 min-h-[340px]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <span className="eyebrow">Revenue Analytics</span>
                <h2 className="font-display text-lg font-bold text-ink">Monthly Fee Collection Breakdown</h2>
              </div>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.collection}>
                  <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                  <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
                  <Bar name="Regular Tuition (Lakhs)" dataKey="regular" fill="#2563EB" radius={[6, 6, 0, 0]} />
                  <Bar name="Late Fines" dataKey="late" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                  <Bar name="Transport Fee" dataKey="transport" fill="#84CC16" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>

          <AiCard
            title="Accounts AI Fee Insights"
            subtitle="Financial recovery forecast & trends"
            points={[
              `Estimated pending recovery for September: ₹48,500`,
              `${overdueStudents.length} accounts overdue > 10 days`,
              `Highest collection mode: UPI payment gateway (74% volume)`
            ]}
            actionText="Manage Payments"
            onAction={() => navigate('/app/fees')}
          />
        </div>
      </div>
    );
  }

  // 4. ADMIN DASHBOARD
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total Enrolled" icon="♙" value={data.students.length} note="Active student roster" tone="blue" />
        <Stat label="Teaching Staff" icon="♔" value={data.teachers.length} note="Faculty assigned" tone="green" />
        <Stat label="Low Attendance" icon="!" value={low.length} note={`Below ${min}% minimum`} tone="amber" />
        <Stat label="Announcements" icon="◌" value={data.announcements.length} note="Published this term" tone="violet" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <article className="card lg:col-span-2 min-h-[340px]">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <span className="eyebrow">School Overview</span>
              <h2 className="font-display text-lg font-bold text-ink">School Attendance vs Target ({min}%)</h2>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.schoolTrend}>
                <CartesianGrid stroke="#f1f5f9" strokeDasharray="3 3" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                <YAxis domain={[60, 100]} stroke="#94a3b8" fontSize={11} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
                <Line type="monotone" name="School Average" dataKey="school" stroke="#2563EB" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" name="Required Target (75%)" dataKey="required" stroke="#84CC16" strokeWidth={2} strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        <AiCard
          title="Executive AI Insights"
          subtitle="School-wide operational health"
          points={[
            `Average school attendance is 86.2%, matching regional benchmark`,
            `${low.length} students flagged for attendance risk`,
            `Fee collection is on track with 84% paid for Term 1`
          ]}
          actionText="System Settings"
          onAction={() => navigate('/app/settings')}
        />
      </div>

      {/* Low Attendance Roster Table */}
      <article className="card overflow-hidden">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <span className="eyebrow">At-Risk Roster</span>
            <h2 className="font-display text-lg font-bold text-ink">Students Needing Attention</h2>
          </div>
          <button onClick={() => navigate('/app/students')} className="text-xs font-bold text-blue hover:underline">
            View All Students →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-line bg-slate-50/70 text-[11px] uppercase tracking-wider text-muted font-bold">
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Class</th>
                <th className="py-3 px-4">Attendance</th>
                <th className="py-3 px-4">Fee Status</th>
                <th className="py-3 px-4">Days to Hit {min}%</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {low.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-bold text-ink">{s.name}</td>
                  <td className="py-3 px-4 text-muted">{s.klass}</td>
                  <td className="py-3 px-4">
                    <Badge status="absent">{s.attendance}%</Badge>
                  </td>
                  <td className="py-3 px-4">
                    <Badge status={s.status.toLowerCase()}>{s.status}</Badge>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-700">{daysToTarget(s, min)} working days</td>
                  <td className="py-3 px-4 text-right">
                    <button onClick={() => navigate('/app/attendance')} className="btn-outline px-2.5 py-1 text-[11px] rounded-lg">
                      Mark Register
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </div>
  );
}

