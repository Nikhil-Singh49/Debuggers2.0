import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext.jsx';
import { useSchool } from '../context/SchoolContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import api from '../api/client.js';
import Modal from '../components/ui.jsx';
import { ADITI_DEMO_FEEDBACK } from '../data/studentDemoContent.js';

export default function Feedback() {
  const { user } = useAuth();
  const { data, refresh } = useSchool();
  const toast = useToast();
  const [target, setTarget] = useState(null);
  const { register, handleSubmit, reset } = useForm();
  if (!data) return null;
  const studentFeedback = user.role === 'Student'
    ? data.feedback.filter((f) => f.student === user.name)
    : data.feedback;
  const showingDemo = user.role === 'Student'
    && user.name === 'Aditi Sharma'
    && studentFeedback.length === 0;
  const list = showingDemo ? ADITI_DEMO_FEEDBACK : studentFeedback;
  const submit = async (values) => {
    try {
      await api.post('/feedback', { ...values, student: target });
      reset(); setTarget(null); toast('Feedback submitted'); refresh();
    } catch (e) {
      toast(e.response?.data?.error?.message || 'Could not submit');
    }
  };
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-xl font-bold text-ink">Student Feedback</h2>
        <p className="text-xs text-muted">Teacher feedback shared with you.</p>
        {showingDemo && (
          <p className="mt-1 text-xs font-medium text-amber-700">
            Demo example only — this is not an official teacher evaluation.
          </p>
        )}
      </div>
      {user.role === 'Teacher' && data.students.map((s) => (
        <div key={s.id} className="card flex items-center justify-between text-xs">
          <span>{s.name} · September</span>
          {data.feedback.some((f) => f.student === s.name) ? <span className="text-green">Submitted</span> : <button className="btn-primary" onClick={() => setTarget(s.name)}>Add</button>}
        </div>
      ))}
      {list.map((f) => (
        <article key={f.id ?? `${f.student}-${f.subject}`} className="card text-xs">
          <div className="flex items-center justify-between gap-3">
            <b>{f.student} · {f.subject}</b>
            {showingDemo && <span className="tag bg-amber-50 text-amber-700">Demo</span>}
          </div>
          <p className="mt-2 text-muted">
            {f.month} {f.year} · Academic {f.academic} · Participation {f.participation} · Behaviour {f.behaviour}
            <br />Strengths: {f.strengths} · Improve: {f.improve}
            <br />{f.remarks}
          </p>
        </article>
      ))}
      {user.role === 'Student' && list.length === 0 && (
        <div className="card text-xs text-muted">No teacher feedback has been shared with you yet.</div>
      )}
      {target && <Modal title={`Feedback · ${target}`} onClose={() => setTarget(null)}><form className="space-y-2" onSubmit={handleSubmit(submit)}><input className="input" placeholder="Academic" {...register('academic', { required: true })} /><input className="input" placeholder="Participation" {...register('participation', { required: true })} /><input className="input" placeholder="Behaviour" {...register('behaviour', { required: true })} /><input className="input" placeholder="Strengths" {...register('strengths', { required: true })} /><input className="input" placeholder="Areas to improve" {...register('improve', { required: true })} /><textarea className="input h-20 py-2" {...register('remarks', { required: true })} /><button className="btn-primary w-full">Submit</button></form></Modal>}
    </div>
  );
}
