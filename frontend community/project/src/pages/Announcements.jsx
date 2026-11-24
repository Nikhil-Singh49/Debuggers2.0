import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext.jsx';
import { useSchool } from '../context/SchoolContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import api from '../api/client.js';
import Modal, { Badge, SkeletonLoader } from '../components/ui.jsx';
import { STUDENT_DEMO_ANNOUNCEMENTS } from '../data/studentDemoContent.js';

export default function Announcements() {
  const { user } = useAuth();
  const { data, refresh } = useSchool();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset } = useForm({ defaultValues: { type: 'Exam' } });

  if (!data) return <SkeletonLoader count={3} />;

  const showingDemo = user.role === 'Student' && data.announcements.length === 0;
  const announcements = showingDemo ? STUDENT_DEMO_ANNOUNCEMENTS : data.announcements;

  const publishAnnouncement = async (values) => {
    await api.post('/announcements', values);
    reset();
    setOpen(false);
    toast('✓ Announcement published to all parents & students');
    refresh();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-ink">School Announcements</h2>
          <p className="text-xs text-muted">Official circulars, exam dates, and event notifications.</p>
          {showingDemo && (
            <p className="mt-1 text-xs font-medium text-amber-700">
              Demo examples only — these are not official school notices.
            </p>
          )}
        </div>

        {user.role === 'Admin' && (
          <button onClick={() => setOpen(true)} className="btn-primary">
            + Publish Announcement
          </button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {announcements.map((a, idx) => (
          <article key={a.id ?? idx} className="card space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="tag bg-blue-soft text-blue font-bold">
                  {a.type}
                </span>
                <div className="flex items-center gap-2">
                  {showingDemo && <span className="tag bg-amber-50 text-amber-700">Demo</span>}
                  <Badge status={a.status === 'Published' ? 'present' : 'pending'}>
                    {a.status || 'Active'}
                  </Badge>
                </div>
              </div>

              <h3 className="mt-3 font-display text-base font-bold text-ink leading-snug">{a.title}</h3>
              <p className="mt-1.5 text-xs text-muted leading-relaxed">{a.detail}</p>
            </div>

            <div className="pt-3 border-t border-line text-[10px] text-muted font-medium flex justify-between">
              <span>{showingDemo ? 'Sample content' : 'Target: All Students'}</span>
              <span>{showingDemo ? 'Demo only' : 'Published just now'}</span>
            </div>
          </article>
        ))}
      </div>

      {open && (
        <Modal title="Publish New Announcement" onClose={() => setOpen(false)}>
          <form className="space-y-4" onSubmit={handleSubmit(publishAnnouncement)}>
            <div>
              <label className="block text-xs font-bold text-ink mb-1">Announcement Type</label>
              <select className="input" {...register('type')}>
                <option value="Exam">Exam Schedule</option>
                <option value="Event">School Event</option>
                <option value="Holiday">Holiday Declaration</option>
                <option value="Half day">Half Day Notice</option>
                <option value="General">General Notice</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink mb-1">Title</label>
              <input className="input" placeholder="e.g. Mid-Term Science Examination Schedule" {...register('title', { required: true })} />
            </div>

            <div>
              <label className="block text-xs font-bold text-ink mb-1">Details & Description</label>
              <textarea 
                className="input min-h-[96px] py-2 text-xs" 
                placeholder="Provide detailed instructions or guidelines for students and parents..." 
                {...register('detail', { required: true })} 
              />
            </div>

            <button className="btn-primary w-full py-3 text-sm font-bold">
              Broadcast Circular →
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

