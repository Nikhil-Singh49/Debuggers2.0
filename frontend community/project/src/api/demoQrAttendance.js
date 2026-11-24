function storageKey(userId) {
  return `edupulseDemoQrAttendance:${userId}`;
}

export function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function createClassQrSession({ className, slotId, subject, now = Date.now() }) {
  if (!globalThis.crypto?.randomUUID) {
    throw new Error('Secure QR attendance requires a modern browser on HTTPS or localhost.');
  }
  return {
    type: 'edupulse-class-attendance',
    sessionId: globalThis.crypto.randomUUID(),
    className,
    slotId,
    subject,
    date: localDateKey(new Date(now)),
    expiresAt: now + 5 * 60 * 1000,
  };
}

export function validateClassQr(rawValue, { expectedClass, now = Date.now() }) {
  let session;
  try {
    session = JSON.parse(rawValue);
  } catch {
    throw new Error('That QR code is not an EduPulse class attendance code.');
  }

  if (
    session?.type !== 'edupulse-class-attendance' ||
    !session.sessionId ||
    !session.slotId ||
    session.className !== expectedClass
  ) {
    throw new Error('That QR code is not valid for your class.');
  }
  if (session.date !== localDateKey(new Date(now)) || !Number.isFinite(session.expiresAt) || session.expiresAt <= now) {
    throw new Error('That class QR code has expired. Ask your teacher for a new one.');
  }
  return session;
}

export function getStudentQrAttendance(userId) {
  const saved = window.localStorage.getItem(storageKey(userId));
  if (!saved) return [];
  const records = JSON.parse(saved);
  if (!Array.isArray(records)) throw new Error('Saved QR attendance records are invalid.');
  return records;
}

export function saveStudentQrAttendance(userId, session, checkedInAt = new Date()) {
  const records = getStudentQrAttendance(userId);
  if (records.some((record) => record.date === session.date && record.className === session.className)) {
    throw new Error('You have already checked in for this class today.');
  }
  const record = {
    sessionId: session.sessionId,
    date: session.date,
    className: session.className,
    subject: session.subject,
    status: 'Present',
    checkedInAt: checkedInAt.toISOString(),
  };
  window.localStorage.setItem(storageKey(userId), JSON.stringify([...records, record]));
  return record;
}
