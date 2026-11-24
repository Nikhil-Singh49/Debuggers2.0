import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSchool } from '../context/SchoolContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import api from '../api/client.js';
import Modal, { Badge, SkeletonLoader } from '../components/ui.jsx';

export default function Teachers() {
  const { data, refresh } = useSchool();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset } = useForm();

  if (!data) return <SkeletonLoader count={3} />;

  const addTeacher = async (values) => {
    await api.post('/teachers', values);
    reset();
    setOpen(false);
    toast('✓ Faculty member added successfully');
    refresh();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold text-ink">Faculty & Teaching Staff</h2>
          <p className="text-xs text-muted">Manage assigned teachers, subject specializations, and class sections.</p>
        </div>
        <button onClick={() => setOpen(true)} className="btn-primary">
          + Add Faculty Member
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {data.teachers.map((t) => (
          <article key={t.id} className="card space-y-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-soft font-bold text-sm text-indigo">
                {t.name.split(' ').map((n) => n[0]).join('')}
              </span>
              <div>
                <strong className="block text-sm font-bold text-ink">{t.name}</strong>
                <span className="text-xs font-semibold text-blue">{t.subject} Specialist</span>
              </div>
            </div>

            <div className="pt-2 border-t border-line flex justify-between items-center text-xs text-muted">
              <span>Assigned Class:</span>
              <Badge status="default">{t.klass}</Badge>
            </div>
          </article>
        ))}
      </div>

      {open && (
        <Modal title="Add Faculty Member" onClose={() => setOpen(false)}>
          <form className="space-y-4" onSubmit={handleSubmit(addTeacher)}>
            <div>
              <label className="block text-xs font-bold text-ink mb-1">Teacher Name</label>
              <input className="input" placeholder="e.g. Dr. Ramesh Kumar" {...register('name', { required: true })} />
            </div>
            <div>
              <label className="block text-xs font-bold text-ink mb-1">Work Email</label>
              <input type="email" className="input" placeholder="teacher@school.edu" {...register('email', { required: true })} />
            </div>
            <div>
              <label className="block text-xs font-bold text-ink mb-1">Subject Specialization</label>
              <input className="input" placeholder="e.g. Science / Mathematics" {...register('subject', { required: true })} />
            </div>
            <div>
              <label className="block text-xs font-bold text-ink mb-1">Assigned Section</label>
              <input className="input" placeholder="e.g. VIII-C" {...register('klass', { required: true })} />
            </div>

            <button className="btn-primary w-full py-3 text-sm font-bold">
              Save Faculty Profile →
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

