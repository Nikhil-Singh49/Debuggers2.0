import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useAuth } from '../context/AuthContext.jsx';
import { useSchool } from '../context/SchoolContext.jsx';

export default function Analytics() {
  const { user } = useAuth();
  const { data } = useSchool();
  if (!data) return null;
  const min = data.settings.minAttendance;
  const low = data.students.filter((s) => s.attendance < min);
  if (user.role === 'Accounts') {
    return (
      <div className="grid gap-3 lg:grid-cols-2">
        <article className="card h-80"><span className="eyebrow">Dashboard totals</span><h2 className="font-display text-lg">Collection mix</h2><ResponsiveContainer width="100%" height="85%"><BarChart data={data.collection}><CartesianGrid stroke="#edf0f5" /><XAxis dataKey="month" /><YAxis /><Tooltip /><Legend /><Bar dataKey="regular" fill="#2563EB" /><Bar dataKey="late" fill="#84CC16" /><Bar dataKey="transport" fill="#4D7C0F" /></BarChart></ResponsiveContainer></article>
        <article className="card"><span className="tag bg-blue-soft text-blue">✦ AI</span><h2 className="mt-2 font-display text-lg">Fee insights</h2><p className="mt-3 text-xs text-muted">{low.length} students overlap with weak attendance. {data.students.filter((s) => s.status === 'Overdue').length} accounts are overdue. Collection rose from ₹8.1L in August to ₹8.9L in September.</p></article>
      </div>
    );
  }
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <article className="card h-80"><h2 className="font-display text-lg">Attendance trend</h2><ResponsiveContainer width="100%" height="85%"><LineChart data={data.schoolTrend}><CartesianGrid stroke="#edf0f5" /><XAxis dataKey="month" /><YAxis domain={[60, 100]} /><Tooltip /><Line dataKey="school" stroke="#2563EB" strokeWidth={3} /><Line dataKey="required" stroke="#84CC16" strokeDasharray="5 5" /></LineChart></ResponsiveContainer></article>
      <article className="card"><span className="tag bg-blue-soft text-blue">✦ AI</span><h2 className="mt-2 font-display text-lg">Attendance insights</h2><p className="mt-3 text-xs text-muted">Overall class attendance is 86%. {low.length} students are below {min}%. Lowest day is Monday. Highest day is Wednesday. {low.map((s) => s.name).join(', ') || 'Nobody'} currently needs attention.</p></article>
    </div>
  );
}
