import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext.jsx';
import { useSchool } from '../context/SchoolContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import api from '../api/client.js';
import Modal, { Badge, SkeletonLoader } from '../components/ui.jsx';

export default function Students() {
  const { user } = useAuth();
  const { data, refresh } = useSchool();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState('all');

  const { register, handleSubmit, reset } = useForm();
  if (!data) return <SkeletonLoader count={2} />;

  const min = data.settings.minAttendance;

  const addStudent = async (values) => {
    await api.post('/students', values);
    reset();
    setOpen(false);
    toast('✓ New student enrolled successfully');
    refresh();
  };

  const removeStudent = async (id) => {
    await api.delete(`/students/${id}`);
    toast('Student removed');
    refresh();
  };

  const filtered = data.students.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
                          s.klass.toLowerCase().includes(search.toLowerCase()) || 
                          s.id.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (filterTab === 'low') return s.attendance < min;
    if (filterTab === 'overdue') return s.status === 'Overdue';
    if (filterTab === 'regular') return s.attendance >= min;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold text-ink">Student Directory</h2>
          <p className="text-xs text-muted">Manage enrolled students, academic attendance rates, and fee statuses.</p>
        </div>

        {user.role === 'Admin' && (
          <button onClick={() => setOpen(true)} className="btn-primary">
            + Enroll New Student
          </button>
        )}
      </div>

      {/* Filter bar & Search */}
      <div className="card space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { id: 'all', label: 'All Students' },
              { id: 'low', label: `Below ${min}% Attendance` },
              { id: 'overdue', label: 'Overdue Fees' },
              { id: 'regular', label: 'Regular' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterTab(tab.id)}
                className={`btn-touch px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                  filterTab === tab.id
                    ? 'bg-blue text-white shadow-xs'
                    : 'bg-slate-100/80 text-muted hover:bg-slate-200 hover:text-ink'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, ID or section..."
            className="input h-10 text-xs w-full md:w-64"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-line bg-slate-50/70 text-[11px] uppercase tracking-wider text-muted font-bold">
                <th className="py-3 px-4">Student ID</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Section</th>
                <th className="py-3 px-4">Guardian</th>
                <th className="py-3 px-4">Attendance Rate</th>
                <th className="py-3 px-4">Fee Status</th>
                {user.role === 'Admin' && <th className="py-3 px-4 text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-600">{s.id}</td>
                  <td className="py-3 px-4 font-bold text-ink">{s.name}</td>
                  <td className="py-3 px-4 text-muted">{s.klass}</td>
                  <td className="py-3 px-4 text-slate-600">{s.guardian}</td>
                  <td className="py-3 px-4">
                    <Badge status={s.attendance < min ? 'absent' : 'present'}>
                      {s.attendance}%
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <Badge status={s.status.toLowerCase()}>{s.status}</Badge>
                  </td>
                  {user.role === 'Admin' && (
                    <td className="py-3 px-4 text-right">
                      <button onClick={() => removeStudent(s.id)} className="btn-danger px-2.5 py-1 text-[11px] rounded-lg">
                        Remove
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {open && (
        <Modal title="Enroll New Student" onClose={() => setOpen(false)}>
          <form className="space-y-4" onSubmit={handleSubmit(addStudent)}>
            <div>
              <label className="block text-xs font-bold text-ink mb-1">Student Full Name</label>
              <input className="input" placeholder="e.g. Rohan Sharma" {...register('name', { required: true })} />
            </div>

            <div>
              <label className="block text-xs font-bold text-ink mb-1">Student ID Code</label>
              <input className="input" defaultValue={`ST00${data.students.length + 1}`} {...register('id', { required: true })} />
            </div>

            <div>
              <label className="block text-xs font-bold text-ink mb-1">Class Section</label>
              <input className="input" placeholder="e.g. VI-A" {...register('klass', { required: true })} />
            </div>

            <div>
              <label className="block text-xs font-bold text-ink mb-1">Guardian Name</label>
              <input className="input" placeholder="e.g. Suresh Sharma" {...register('guardian', { required: true })} />
            </div>

            <button className="btn-primary w-full py-3 text-sm font-bold">
              Complete Enrollment →
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

