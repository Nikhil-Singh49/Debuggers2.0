import { useAuth } from '../context/AuthContext.jsx';
import { useSchool } from '../context/SchoolContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import api from '../api/client.js';
import { Badge, SkeletonLoader } from '../components/ui.jsx';

export default function Transport() {
  const { user } = useAuth();
  const { data, refresh } = useSchool();
  const toast = useToast();

  if (!data) return <SkeletonLoader count={2} />;
  const me = data.students[0];

  const updateTransportStatus = async (payload) => {
    await api.post('/transport', payload);
    toast('✓ Transport status updated');
    refresh();
  };

  if (user.role === 'Student') {
    return (
      <div className="space-y-6 animate-fade-in max-w-xl">
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="eyebrow">School Bus Facility</span>
              <h2 className="font-display text-xl font-bold text-ink">Transport Status</h2>
            </div>
            <Badge status={me.transport === 'Approved' ? 'present' : me.transport === 'Pending' ? 'pending' : 'default'}>
              {me.transport}
            </Badge>
          </div>

          <div className="rounded-xl border border-line bg-slate-50/70 p-4 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-muted">Assigned Route:</span>
              <strong className="text-ink font-bold">{me.route || 'Not assigned'}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">Pickup Point:</span>
              <strong className="text-ink">Central Bus Stop (Gate 3)</strong>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            {me.transport === 'None' ? (
              <button 
                onClick={() => updateTransportStatus({ student: me.name, transport: 'Pending', route: 'Route B' })}
                className="btn-primary flex-1"
              >
                Apply for Bus Pass →
              </button>
            ) : (
              <button 
                onClick={() => updateTransportStatus({ student: me.name, transport: 'None', route: '' })}
                className="btn-outline flex-1 text-red hover:bg-red-soft"
              >
                Withdraw Transport Pass
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="font-display text-xl font-bold text-ink">Bus Route & Transport Management</h2>
        <p className="text-xs text-muted">Review student bus pass applications and route assignments.</p>
      </div>

      <article className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-line bg-slate-50/70 text-[11px] uppercase tracking-wider text-muted font-bold">
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Assigned Route</th>
                <th className="py-3 px-4">Pass Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.students.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-bold text-ink">{s.name} ({s.klass})</td>
                  <td className="py-3 px-4 text-muted">{s.route || 'No Route Assigned'}</td>
                  <td className="py-3 px-4">
                    <Badge status={s.transport === 'Approved' ? 'present' : s.transport === 'Pending' ? 'pending' : 'default'}>
                      {s.transport}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {s.transport === 'Pending' && (
                      <button 
                        onClick={() => updateTransportStatus({ student: s.name, transport: 'Approved', route: s.route || 'Route B' })}
                        className="btn-primary px-3 py-1 text-xs"
                      >
                        Approve Pass ✓
                      </button>
                    )}
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

