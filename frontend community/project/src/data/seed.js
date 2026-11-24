export const USERS = {
  Admin: { name: 'Aarav Reddy', initials: 'AR', email: 'admin@edupulse.school', greeting: 'Aarav', role: 'Admin' },
  Teacher: { name: 'Shreya Malhotra', initials: 'SM', email: 'teacher@edupulse.school', greeting: 'Shreya', role: 'Teacher' },
  Accounts: { name: 'Neha Iyer', initials: 'NI', email: 'accounts@edupulse.school', greeting: 'Neha', role: 'Accounts' },
  Student: { name: 'Aditi Sharma', initials: 'AS', email: 'student@edupulse.school', greeting: 'Aditi', role: 'Student' },
};

export const NAV_BY_ROLE = {
  Admin: ['dashboard', 'attendance', 'fees', 'students', 'teachers', 'timetable', 'transport', 'announcements', 'analytics', 'feedback', 'notifications', 'settings'],
  Teacher: ['dashboard', 'attendance', 'students', 'timetable', 'announcements', 'analytics', 'feedback', 'notifications'],
  Accounts: ['dashboard', 'fees', 'students', 'transport', 'analytics', 'notifications'],
  Student: ['dashboard', 'attendance', 'fees', 'timetable', 'transport', 'announcements', 'feedback', 'notifications'],
};

export function createSeed() {
  return {
    settings: { minAttendance: 75, teacherCanEdit: true },
    students: [
      { id: 'ST001', name: 'Aditi Sharma', klass: 'VI-A', guardian: 'Meera Sharma', attendance: 94, present: 47, absent: 2, late: 1, working: 50, feeTotal: 18500, feePaid: 18500, due: 0, dueDate: '15 Sep 2026', status: 'Paid', health: 'Good', transport: 'Approved', route: 'Route B', months: [91, 89, 92, 90, 88, 93, 94, 92, 94] },
      { id: 'ST002', name: 'Kabir Verma', klass: 'VIII-C', guardian: 'Raj Verma', attendance: 68, present: 34, absent: 12, late: 4, working: 50, feeTotal: 19800, feePaid: 7000, due: 12800, dueDate: '05 Sep 2026', status: 'Overdue', health: 'Needs Attention', transport: 'None', route: '', months: [74, 72, 70, 69, 71, 68, 67, 66, 68] },
      { id: 'ST003', name: 'Riya Nair', klass: 'VII-B', guardian: 'Anita Nair', attendance: 72, present: 36, absent: 10, late: 4, working: 50, feeTotal: 18500, feePaid: 18500, due: 0, dueDate: '12 Sep 2026', status: 'Paid', health: 'Average', transport: 'Pending', route: 'Route A', months: [78, 76, 75, 74, 73, 72, 71, 72, 72] },
      { id: 'ST004', name: 'Arjun Mehta', klass: 'IX-A', guardian: 'Sanjay Mehta', attendance: 91, present: 45, absent: 3, late: 2, working: 50, feeTotal: 21000, feePaid: 21000, due: 0, dueDate: '18 Sep 2026', status: 'Paid', health: 'Good', transport: 'Approved', route: 'Route C', months: [88, 89, 90, 90, 91, 92, 90, 91, 91] },
      { id: 'ST005', name: 'Ishaan Patel', klass: 'VI-A', guardian: 'Kavita Patel', attendance: 81, present: 40, absent: 7, late: 3, working: 50, feeTotal: 18500, feePaid: 10000, due: 8500, dueDate: '20 Sep 2026', status: 'Pending', health: 'Average', transport: 'None', route: '', months: [80, 82, 79, 81, 80, 83, 82, 81, 81] },
      { id: 'ST006', name: 'Vihaan Kapoor', klass: 'VI-A', guardian: 'Neeraj Kapoor', attendance: 89, present: 44, absent: 4, late: 2, working: 50, feeTotal: 18500, feePaid: 18500, due: 0, dueDate: '20 Sep 2026', status: 'Paid', health: 'Good', transport: 'Approved', route: 'Route B', months: [87, 88, 89, 90, 88, 91, 90, 89, 89] },
      { id: 'ST007', name: 'Myra Joshi', klass: 'VI-A', guardian: 'Priya Joshi', attendance: 92, present: 46, absent: 3, late: 1, working: 50, feeTotal: 18500, feePaid: 18500, due: 0, dueDate: '20 Sep 2026', status: 'Paid', health: 'Good', transport: 'None', route: '', months: [90, 91, 92, 91, 93, 92, 94, 92, 92] },
      { id: 'ST008', name: 'Reyansh Gupta', klass: 'VI-A', guardian: 'Manoj Gupta', attendance: 76, present: 38, absent: 9, late: 3, working: 50, feeTotal: 18500, feePaid: 12000, due: 6500, dueDate: '20 Sep 2026', status: 'Pending', health: 'Average', transport: 'Approved', route: 'Route A', months: [79, 78, 77, 76, 78, 75, 74, 76, 76] },
      { id: 'ST009', name: 'Sara Khan', klass: 'VI-A', guardian: 'Farah Khan', attendance: 96, present: 48, absent: 1, late: 1, working: 50, feeTotal: 18500, feePaid: 18500, due: 0, dueDate: '20 Sep 2026', status: 'Paid', health: 'Good', transport: 'Approved', route: 'Route C', months: [94, 95, 96, 95, 97, 96, 98, 96, 96] },
      { id: 'ST010', name: 'Dhruv Singh', klass: 'VI-A', guardian: 'Puneet Singh', attendance: 84, present: 42, absent: 6, late: 2, working: 50, feeTotal: 18500, feePaid: 15000, due: 3500, dueDate: '20 Sep 2026', status: 'Pending', health: 'Average', transport: 'None', route: '', months: [82, 83, 84, 85, 83, 86, 84, 83, 84] },
      { id: 'ST011', name: 'Anaya Iyer', klass: 'VII-B', guardian: 'Lakshmi Iyer', attendance: 88, present: 44, absent: 4, late: 2, working: 50, feeTotal: 18500, feePaid: 18500, due: 0, dueDate: '12 Sep 2026', status: 'Paid', health: 'Good', transport: 'Approved', route: 'Route A', months: [86, 87, 88, 89, 88, 90, 89, 88, 88] },
      { id: 'ST012', name: 'Vivaan Shah', klass: 'VIII-C', guardian: 'Alok Shah', attendance: 79, present: 39, absent: 8, late: 3, working: 50, feeTotal: 19800, feePaid: 19800, due: 0, dueDate: '05 Sep 2026', status: 'Paid', health: 'Good', transport: 'Approved', route: 'Route B', months: [80, 79, 81, 78, 80, 79, 78, 80, 79] },
    ],
    teachers: [
      { id: 'T01', name: 'Shreya Malhotra', subject: 'Mathematics', klass: 'VI-A' },
      { id: 'T02', name: 'Rohit Kapoor', subject: 'Science', klass: 'VIII-C' },
      { id: 'T03', name: 'Ananya Nair', subject: 'English', klass: 'VII-B' },
    ],
    classes: [
      { name: 'VI-A', students: 32, subject: 'Maths', rate: 96 },
      { name: 'VII-B', students: 29, subject: 'English', rate: 82 },
      { name: 'VIII-C', students: 31, subject: 'Physics', rate: 68 },
      { name: 'IX-A', students: 34, subject: 'Biology', rate: 91 },
    ],
    calendar: { 1: 'present', 2: 'late', 3: 'present', 4: 'absent', 5: 'present', 6: 'present', 7: 'holiday', 8: 'present', 9: 'present', 10: 'late', 11: 'present', 12: 'absent' },
    marks: {},
    pendingSync: [],
    payments: [
      { id: 'P1', date: '12 Sep 2026', student: 'Aditi Sharma', amount: 18500, info: 'Term 1 tuition', method: 'UPI', status: 'Successful', txn: 'EDU-88421' },
      { id: 'P2', date: '11 Sep 2026', student: 'Kabir Verma', amount: 7000, info: 'Partial tuition', method: 'Card', status: 'Successful', txn: 'EDU-88390' },
      { id: 'P3', date: '10 Sep 2026', student: 'Riya Nair', amount: 18500, info: 'Term 1 tuition', method: 'Net banking', status: 'Unsuccessful', txn: 'EDU-88311' },
    ],
    feedback: [
      { student: 'Aditi Sharma', subject: 'Mathematics', teacher: 'Shreya Malhotra', month: 'September', academic: 'Excellent', participation: 'High', behaviour: 'Respectful', strengths: 'Problem solving', improve: 'Speed drills', remarks: 'Keep up the consistent effort.' },
    ],
    announcements: [
      { type: 'Exam', title: 'Science term exam', detail: 'Class IX · 24 September 2026', status: 'Published' },
      { type: 'Event', title: 'Annual sports day', detail: 'All classes · 4 October 2026', status: 'Scheduled' },
      { type: 'Half day', title: 'Teacher development day', detail: 'School closes at 12:30 PM on 18 September', status: 'Parents notified' },
    ],
    notifications: [
      { title: 'Exam schedule updated', meta: 'Class IX · 8 min ago', tone: 'green' },
      { title: 'Fee reminder generated', meta: 'Accounts · 2 hrs ago', tone: 'orange' },
      { title: 'Low attendance warning', meta: '37 students flagged', tone: 'blue' },
      { title: 'Parent SMS alert sent', meta: 'Absent students · 17 min ago', tone: 'red' },
    ],
    collection: [
      { month: 'Jun', regular: 5.8, late: 0.3, transport: 1.1 },
      { month: 'Jul', regular: 6.2, late: 0.4, transport: 1.2 },
      { month: 'Aug', regular: 6.8, late: 0.4, transport: 1.3 },
      { month: 'Sep', regular: 7.1, late: 0.4, transport: 1.4 },
    ],
    schoolTrend: [
      { month: 'Jan', school: 78, required: 75 },
      { month: 'Feb', school: 80, required: 75 },
      { month: 'Mar', school: 83, required: 75 },
      { month: 'Apr', school: 84, required: 75 },
      { month: 'May', school: 85, required: 75 },
      { month: 'Jun', school: 84, required: 75 },
      { month: 'Jul', school: 86, required: 75 },
      { month: 'Aug', school: 88, required: 75 },
      { month: 'Sep', school: 86, required: 75 },
    ],
  };
}

export function daysToTarget(student, minAttendance) {
  const need = minAttendance / 100;
  if (student.present / student.working >= need) return 0;
  let extra = 0;
  while ((student.present + extra) / (student.working + extra) < need && extra < 200) extra += 1;
  return extra;
}

export function prediction(student, minAttendance) {
  return {
    nextAbsent: ((student.present / (student.working + 1)) * 100).toFixed(1),
    nextPresent: (((student.present + 1) / (student.working + 1)) * 100).toFixed(1),
    days: daysToTarget(student, minAttendance),
  };
}
