const KEY = 'edupulseSchool';

import { createSeed, USERS } from '../data/seed.js';

function load() {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved) {
      const savedStore = JSON.parse(saved);
      const seed = createSeed();
      const savedStudentIds = new Set((savedStore.students || []).map((student) => student.id));
      const mergedStudents = [
        ...(savedStore.students || []),
        ...seed.students.filter((student) => !savedStudentIds.has(student.id)),
      ];
      return { ...seed, ...savedStore, students: mergedStudents };
    }
  } catch {
    localStorage.removeItem(KEY);
  }
  return createSeed();
}

function save(store) {
  localStorage.setItem(KEY, JSON.stringify(store));
}

function ok(data, status = 200) {
  return Promise.resolve({ data, status, statusText: 'OK', headers: {}, config: {} });
}

function fail(message, status = 400) {
  return Promise.reject({ response: { status, data: { message } } });
}

export function mockAdapter(config) {
  const store = load();
  const method = (config.method || 'get').toLowerCase();
  const url = config.url.replace(config.baseURL || '', '');
  const body = typeof config.data === 'string' ? JSON.parse(config.data || '{}') : config.data || {};
  const delay = (result) => new Promise((resolve, reject) => {
    setTimeout(() => result.then(resolve, reject), 180);
  });

  const route = `${method} ${url.split('?')[0]}`;

  const handlers = {
    'post /auth/login'() {
      const role = body.role || 'Admin';
      const user = USERS[role];
      if (!user) return fail('Unknown role');
      if (
        body.email?.trim().toLowerCase() !== user.email.toLowerCase() ||
        !['Demo@2026', 'password'].includes(body.password)
      ) {
        return fail('Invalid demo email or password. Use the selected role email and password Demo@2026.', 401);
      }
      const token = btoa(JSON.stringify({ role, email: user.email }));
      return ok({ token, user });
    },
    'get /dashboard'() {
      return ok({
        settings: store.settings,
        students: store.students,
        classes: store.classes,
        calendar: store.calendar,
        marks: store.marks,
        pendingSync: store.pendingSync,
        notifications: store.notifications,
        announcements: store.announcements,
        payments: store.payments,
        collection: store.collection,
        schoolTrend: store.schoolTrend,
        teachers: store.teachers,
        feedback: store.feedback,
      });
    },
    'get /students'() {
      return ok(store.students);
    },
    'post /students'() {
      store.students.push({
        ...body,
        attendance: 100,
        present: 0,
        absent: 0,
        late: 0,
        working: 1,
        feeTotal: Number(body.feeTotal || 18500),
        feePaid: 0,
        due: Number(body.feeTotal || 18500),
        dueDate: '30 Sep 2026',
        status: 'Pending',
        health: 'Average',
        transport: 'None',
        route: '',
        months: [100, 100, 100, 100, 100, 100, 100, 100, 100],
      });
      save(store);
      return ok(store.students);
    },
    'delete /students'() {
      store.students = store.students.filter((s) => s.id !== body.id);
      save(store);
      return ok(store.students);
    },
    'get /teachers'() {
      return ok(store.teachers);
    },
    'post /teachers'() {
      store.teachers.push({ id: `T${String(store.teachers.length + 1).padStart(2, '0')}`, ...body });
      save(store);
      return ok(store.teachers);
    },
    'post /attendance'() {
      const entries = body.entries || [];
      const online = typeof navigator === 'undefined' ? true : navigator.onLine;
      entries.forEach((entry) => {
        const markKey = `${entry.klass}|${entry.student}|${entry.date || ''}`;
        if (online) store.marks[markKey] = entry.status;
        else {
          const exists = store.pendingSync.find((item) => (
            item.klass === entry.klass &&
            item.student === entry.student &&
            item.date === entry.date
          ));
          if (exists) Object.assign(exists, entry);
          else store.pendingSync.push(entry);
        }
        if (entry.status === 'absent') {
          store.notifications.unshift({ title: `${entry.student} marked absent`, meta: 'Parent alert queued · just now', tone: 'red' });
        }
      });
      save(store);
      return ok({ marks: store.marks, pendingSync: store.pendingSync, online });
    },
    'post /attendance/sync'() {
      store.pendingSync.forEach((entry) => {
        store.marks[entry.id] = entry.status;
      });
      const count = store.pendingSync.length;
      store.pendingSync = [];
      save(store);
      return ok({ count, pendingSync: [] });
    },
    'post /payments'() {
      const student = store.students.find((s) => s.name === body.student);
      if (!student) return fail('Student not found');
      const payment = {
        id: `P${Date.now()}`,
        date: '12 Sep 2026',
        student: student.name,
        amount: Number(body.amount),
        info: body.info,
        method: body.method,
        status: 'Successful',
        txn: `EDU-${Math.floor(Math.random() * 90000 + 10000)}`,
      };
      store.payments.unshift(payment);
      student.feePaid += payment.amount;
      student.due = Math.max(0, student.feeTotal - student.feePaid);
      student.status = student.due === 0 ? 'Paid' : 'Pending';
      save(store);
      return ok({ payment, students: store.students, payments: store.payments });
    },
    'post /feedback'() {
      const duplicate = store.feedback.find((f) => f.student === body.student && f.month === 'September');
      if (duplicate && !store.settings.teacherCanEdit) return fail('Feedback already submitted for this month');
      store.feedback = store.feedback.filter((f) => !(f.student === body.student && f.month === 'September'));
      store.feedback.push({ ...body, month: 'September', teacher: 'Shreya Malhotra', subject: 'Mathematics' });
      store.notifications.unshift({ title: `Monthly feedback for ${body.student}`, meta: 'Visible to parents · just now', tone: 'green' });
      save(store);
      return ok(store.feedback);
    },
    'post /announcements'() {
      store.announcements.unshift({ ...body, status: 'Published' });
      store.notifications.unshift({ title: body.title, meta: `${body.type} · just now`, tone: 'green' });
      save(store);
      return ok(store.announcements);
    },
    'post /notifications'() {
      store.notifications.unshift({ title: body.title, meta: body.meta || 'Admin · just now', tone: body.tone || 'blue' });
      save(store);
      return ok(store.notifications);
    },
    'put /settings'() {
      store.settings = { ...store.settings, ...body };
      save(store);
      return ok(store.settings);
    },
    'post /transport'() {
      const student = store.students.find((s) => s.name === body.student);
      if (!student) return fail('Student not found');
      student.transport = body.transport;
      student.route = body.route || student.route;
      save(store);
      return ok(store.students);
    },
  };

  const exact = handlers[route];
  if (exact) return delay(exact());
  if (method === 'delete' && url.startsWith('/students/')) {
    const id = url.split('/').pop();
    store.students = store.students.filter((s) => s.id !== id);
    save(store);
    return delay(ok(store.students));
  }
  return delay(fail(`No mock for ${route}`, 404));
}
