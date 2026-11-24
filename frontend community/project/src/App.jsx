import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import AppLayout from './layouts/AppLayout.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Attendance from './pages/Attendance.jsx';
import Fees from './pages/Fees.jsx';
import Students from './pages/Students.jsx';
import Teachers from './pages/Teachers.jsx';
import Timetable from './pages/Timetable.jsx';
import Transport from './pages/Transport.jsx';
import Announcements from './pages/Announcements.jsx';
import Analytics from './pages/Analytics.jsx';
import Feedback from './pages/Feedback.jsx';
import Notifications from './pages/Notifications.jsx';
import Settings from './pages/Settings.jsx';

function Guard({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/app/dashboard" replace /> : <Login />} />
      <Route path="/app" element={<Guard><AppLayout /></Guard>}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="fees" element={<Fees />} />
        <Route path="students" element={<Students />} />
        <Route path="teachers" element={<Teachers />} />
        <Route path="timetable" element={<Timetable />} />
        <Route path="transport" element={<Transport />} />
        <Route path="announcements" element={<Announcements />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="feedback" element={<Feedback />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
