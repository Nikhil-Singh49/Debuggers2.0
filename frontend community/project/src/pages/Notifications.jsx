import { useSchool } from '../context/SchoolContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import api from '../api/client.js';
import { Badge, SkeletonLoader } from '../components/ui.jsx';

export default function Notifications() {
  const { data, refresh } = useSchool();
  const { user } = useAuth();
  const toast = useToast();

  if (!data) return <SkeletonLoader count={3} />;

  const broadcastNotice = async () => {
    await api.post('/notifications', { title: 'Exam schedule updated for Class IX', tone: 'green' });
    toast('✓ Notification broadcasted');
    refresh();
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-ink">Notifications & Activity Feed</h2>
          <p className="text-xs text-muted">Real-time alerts, attendance notifications, and fee reminders.</p>
        </div>

        {user.role === 'Admin' && (
          <button onClick={broadcastNotice} className="btn-primary">
            + Broadcast Notification
          </button>
        )}
      </div>

      <article className="card divide-y divide-line">
        {data.notifications.map((n, i) => (
          <div key={i} className="py-3.5 flex items-start justify-between gap-3 hover:bg-slate-50/50 transition-colors rounded-xl px-2">
            <div className="flex items-start gap-3">
              <span className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl font-bold text-xs ${
                n.tone === 'red' ? 'bg-red-soft text-red' :
                n.tone === 'orange' ? 'bg-orange-soft text-orange' :
                n.tone === 'green' ? 'bg-green-soft text-green' :
                'bg-blue-soft text-blue'
              }`}>
                {n.tone === 'red' ? '!' : '♢'}
              </span>
              <div>
                <strong className="block text-xs font-bold text-ink">{n.title}</strong>
                <span className="text-[11px] text-muted">{n.meta}</span>
              </div>
            </div>

            <Badge status={n.tone === 'red' ? 'absent' : n.tone === 'orange' ? 'late' : 'present'}>
              System Alert
            </Badge>
          </div>
        ))}
      </article>
    </div>
  );
}

