import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api from '../api/client.js';
import { readPendingAttendance, syncPendingAttendance } from '../api/offlineAttendance.js';
import { useAuth } from './AuthContext.jsx';
import { useToast } from './ToastContext.jsx';

const SchoolContext = createContext(null);

export function SchoolProvider({ children }) {
  const { user } = useAuth();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setData(null);
      return;
    }
    setLoading(true);
    try {
      const { data: payload } = await api.get('/dashboard');
      setData({ ...payload, pendingSync: readPendingAttendance() });
    } catch (error) {
      toast(error.response?.data?.error?.message || 'Could not load school data');
    } finally {
      setLoading(false);
    }
  }, [toast, user]);

  useEffect(() => {
    setData(null);
    refresh();
  }, [refresh]);

  useEffect(() => {
    const onOnline = async () => {
      if (!readPendingAttendance().length) return;
      try {
        await syncPendingAttendance();
        await refresh();
        toast('Offline attendance synced');
      } catch (error) {
        toast(error.response?.data?.error?.message || 'Attendance sync failed; entries remain queued');
      }
    };
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [refresh, toast]);

  return (
    <SchoolContext.Provider value={{ data, loading, refresh, setData }}>
      {children}
    </SchoolContext.Provider>
  );
}

export const useSchool = () => useContext(SchoolContext);
