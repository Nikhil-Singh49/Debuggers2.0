import api from './client.js';

const KEY = 'edupulsePendingAttendance';

export function readPendingAttendance() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

export function queueAttendance(entries) {
  const pending = new Map(
    readPendingAttendance().map((entry) => [`${entry.klass}|${entry.student}|${entry.date}`, entry]),
  );
  entries.forEach((entry) => pending.set(`${entry.klass}|${entry.student}|${entry.date}`, entry));
  const queued = [...pending.values()];
  localStorage.setItem(KEY, JSON.stringify(queued));
  return queued;
}

export function clearPendingAttendance() {
  localStorage.removeItem(KEY);
}

export async function syncPendingAttendance() {
  const entries = readPendingAttendance();
  if (!entries.length) return 0;
  await api.post('/attendance', { entries });
  clearPendingAttendance();
  return entries.length;
}
