import { Router } from 'express';
import { randomInt } from 'node:crypto';
import sql from 'mssql';
import { z } from 'zod';
import { authenticate, authorize } from '../middleware/authenticate.js';
import { ApiError } from '../utils/ApiError.js';

const studentForm = z.object({
    name: z.string().trim().min(1).max(100),
    klass: z.string().trim().min(1).max(60),
    guardian: z.string().trim().min(1).max(100),
});
const attendanceForm = z.object({
    entries: z.array(z.object({
        student: z.string().trim().min(1).max(100),
        klass: z.string().trim().min(1).max(60),
        date: z.string().date(),
        status: z.enum(['present', 'absent', 'late']),
    })).min(1).max(100),
});
const paymentForm = z.object({
    student: z.string().trim().min(1).max(100).optional(),
    amount: z.coerce.number().positive().max(10000000),
    info: z.string().trim().min(1).max(255),
    method: z.enum(['UPI', 'Card', 'Net banking']),
});
const announcementForm = z.object({
    type: z.string().trim().min(1).max(40),
    title: z.string().trim().min(1).max(255),
    detail: z.string().trim().min(1).max(2000),
});
const feedbackForm = z.object({
    student: z.string().trim().min(1).max(100),
    academic: z.string().trim().min(1).max(100),
    participation: z.string().trim().min(1).max(100),
    behaviour: z.string().trim().min(1).max(100),
    strengths: z.string().trim().min(1).max(500),
    improve: z.string().trim().min(1).max(500),
    remarks: z.string().trim().min(1).max(1000),
});
const roleBySetting = z.object({
    minAttendance: z.coerce.number().int().min(0).max(100),
    teacherCanEdit: z.boolean(),
});

const studentSelect = `
    SELECT s.student_id, s.user_id, s.name,
        CONCAT(c.class_name, '-', c.section) AS klass,
        COALESCE(s.parent_name, '') AS guardian,
        COALESCE(a.present, 0) AS present,
        COALESCE(a.absent, 0) AS absent,
        COALESCE(a.late, 0) AS late,
        COALESCE(a.working, 0) AS working,
        COALESCE(a.attendance, 0) AS attendance,
        COALESCE(f.feeTotal, 0) AS feeTotal,
        COALESCE(f.feePaid, 0) AS feePaid,
        f.dueDate,
        COALESCE(tr.transport, 'None') AS transport,
        COALESCE(tr.route, '') AS route
    FROM dbo.students s
    LEFT JOIN dbo.classes c ON c.class_id = s.class_id
    OUTER APPLY (
        SELECT COUNT(*) AS working,
            SUM(CASE WHEN LOWER(status) = 'present' THEN 1 ELSE 0 END) AS present,
            SUM(CASE WHEN LOWER(status) = 'absent' THEN 1 ELSE 0 END) AS absent,
            SUM(CASE WHEN LOWER(status) = 'late' THEN 1 ELSE 0 END) AS late,
            CAST(100.0 * SUM(CASE WHEN LOWER(status) IN ('present', 'late') THEN 1 ELSE 0 END)
                / NULLIF(COUNT(*), 0) AS decimal(5, 1)) AS attendance
        FROM dbo.attendance WHERE student_id = s.student_id
    ) a
    OUTER APPLY (
        SELECT SUM(fs.amount) AS feeTotal, SUM(p.amount) AS feePaid, MIN(fs.due_date) AS dueDate
        FROM dbo.fee_structure fs
        LEFT JOIN dbo.academic_years ay ON ay.academic_year_id = fs.academic_year_id AND ay.status = 'Active'
        OUTER APPLY (
            SELECT SUM(pay.amount) AS amount FROM dbo.payments pay
            WHERE pay.student_id = s.student_id AND pay.fee_structure_id = fs.fee_structure_id
                AND pay.status = 'Successful'
        ) p
        WHERE fs.class_id = s.class_id AND ay.academic_year_id IS NOT NULL
    ) f
    OUTER APPLY (
    SELECT TOP (1)
        CASE WHEN LOWER(app.status) = 'withdrawn' THEN 'None' ELSE app.status END AS transport,
        route.route_name AS route
        FROM dbo.transport_applications app
        LEFT JOIN dbo.transport route ON route.transport_id = app.transport_id
        WHERE app.student_id = s.student_id
        ORDER BY app.application_date DESC, app.application_id DESC
    ) tr
`;

function formatStudent(row) {
    const feeTotal = Number(row.feeTotal);
    const feePaid = Number(row.feePaid);
    const due = Math.max(0, feeTotal - feePaid);
    const dueDate = row.dueDate ? new Date(row.dueDate).toISOString().slice(0, 10) : null;
    const status = due === 0 ? 'Paid' : dueDate && new Date(dueDate) < new Date() ? 'Overdue' : 'Pending';
    const working = Number(row.working);
    const present = Number(row.present);
    const absent = Number(row.absent);
    const late = Number(row.late);
    return {
        id: `ST${String(row.student_id).padStart(3, '0')}`,
        name: row.name,
        klass: row.klass ?? '',
        guardian: row.guardian,
        attendance: Number(row.attendance),
        present,
        absent,
        late,
        working,
        feeTotal,
        feePaid,
        due,
        dueDate,
        status,
        health: 'Average',
        transport: row.transport,
        route: row.route,
        months: [],
    };
}

async function getStudents(pool, userId = null) {
    const request = pool.request();
    let filter = '';
    if (userId != null) {
        request.input('userId', userId);
        filter = ' AND s.user_id = @userId';
    }
    const result = await request.query(`${studentSelect} WHERE s.status = 'Active'${filter} ORDER BY s.name`);
    const students = result.recordset.map(formatStudent);
    if (!students.length) return students;

    const trends = await pool.request().query(`
        SELECT student_id AS studentId, MONTH(date) AS monthNumber,
            CAST(100.0 * SUM(CASE WHEN LOWER(status) IN ('present', 'late') THEN 1 ELSE 0 END)
                / NULLIF(COUNT(*), 0) AS int) AS attendance
        FROM dbo.attendance
        WHERE date >= DATEADD(month, -8, DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1))
        GROUP BY student_id, YEAR(date), MONTH(date)
    `);
    const monthNumbers = Array.from({ length: 9 }, (_, index) => {
        const month = new Date();
        month.setDate(1);
        month.setMonth(month.getMonth() - (8 - index));
        return month.getMonth() + 1;
    });
    const attendanceByStudent = new Map();
    for (const trend of trends.recordset) {
        if (!attendanceByStudent.has(trend.studentId)) attendanceByStudent.set(trend.studentId, new Map());
        attendanceByStudent.get(trend.studentId).set(trend.monthNumber, Number(trend.attendance));
    }
    return students.map((student, index) => {
        const row = result.recordset[index];
        const history = attendanceByStudent.get(row.student_id);
        return { ...student, months: monthNumbers.map((month) => history?.get(month) ?? 0) };
    });
}

async function getPayments(pool, studentUserId = null) {
    const request = pool.request();
    let filter = '';
    if (studentUserId != null) {
        request.input('userId', studentUserId);
        filter = ' AND s.user_id = @userId';
    }
    const result = await request.query(`
            SELECT p.payment_id AS id, p.payment_date AS paymentDate, s.name AS student,
                p.amount, fs.fee_type AS info, p.payment_method AS method, p.status,
                p.transaction_id AS txn
            FROM dbo.payments p
            JOIN dbo.students s ON s.student_id = p.student_id
            LEFT JOIN dbo.fee_structure fs ON fs.fee_structure_id = p.fee_structure_id
            WHERE 1 = 1${filter}
            ORDER BY p.payment_date DESC, p.payment_id DESC
        `);
    return result.recordset.map((row) => ({
        id: String(row.id),
        date: row.paymentDate ? new Date(row.paymentDate).toISOString().slice(0, 10) : '',
        student: row.student,
        amount: Number(row.amount),
        info: row.info ?? '',
        method: row.method,
        status: row.status === 'Successful' ? 'Successful' : 'Unsuccessful',
        txn: row.txn,
    }));
}

async function getSettings(pool) {
    const result = await pool.request().query(`
        SELECT setting_name, setting_value FROM dbo.school_settings
        WHERE setting_name IN ('minAttendance', 'teacherCanEdit')
    `);
    const values = Object.fromEntries(result.recordset.map((row) => [row.setting_name, row.setting_value]));
    return {
        minAttendance: Number(values.minAttendance ?? 75),
        teacherCanEdit: values.teacherCanEdit == null ? true : values.teacherCanEdit.toLowerCase() === 'true',
    };
}

async function getTeachers(pool) {
    const result = await pool.request().query(`
        SELECT t.teacher_id AS id, t.teacher_name AS name,
            COALESCE(sub.subject_name, 'Unassigned') AS subject,
            COALESCE(CONCAT(c.class_name, '-', c.section), 'Unassigned') AS klass
        FROM dbo.teachers t
        OUTER APPLY (
            SELECT TOP (1) subject.subject_name
            FROM dbo.class_subjects cs
            JOIN dbo.subjects subject ON subject.subject_id = cs.subject_id
            JOIN dbo.classes assignedClass ON assignedClass.class_id = cs.class_id
            LEFT JOIN dbo.timetable tt ON tt.class_subject_id = cs.class_subject_id
            WHERE tt.teacher_id = t.teacher_id OR assignedClass.class_teacher_id = t.teacher_id
            ORDER BY CASE WHEN tt.teacher_id = t.teacher_id THEN 0 ELSE 1 END, cs.class_subject_id
        ) sub
        LEFT JOIN dbo.classes c ON c.class_teacher_id = t.teacher_id
        ORDER BY t.teacher_name
    `);
    return result.recordset.map((row) => ({ ...row, id: `T${String(row.id).padStart(2, '0')}` }));
}

async function getDashboard(pool, auth) {
    const isStudent = auth.role === 'Student';
    const students = await getStudents(pool, isStudent ? Number(auth.sub) : null);
    const payments = await getPayments(pool, isStudent ? Number(auth.sub) : null);
    const settings = await getSettings(pool);
    const teachers = await getTeachers(pool);

    const classesResult = await pool.request().query(`
        SELECT CONCAT(c.class_name, '-', c.section) AS name, COUNT(DISTINCT s.student_id) AS students,
            COALESCE(MAX(subject.subject_name), 'Unassigned') AS subject,
            COALESCE(CAST(100.0 * SUM(CASE WHEN LOWER(a.status) IN ('present', 'late') THEN 1 ELSE 0 END)
                / NULLIF(COUNT(a.attendance_id), 0) AS int), 0) AS rate
        FROM dbo.classes c
        LEFT JOIN dbo.students s ON s.class_id = c.class_id
        LEFT JOIN dbo.attendance a ON a.student_id = s.student_id
        OUTER APPLY (
            SELECT TOP (1) sub.subject_name
            FROM dbo.class_subjects cs JOIN dbo.subjects sub ON sub.subject_id = cs.subject_id
            WHERE cs.class_id = c.class_id
        ) subject
        GROUP BY c.class_id, c.class_name, c.section
        ORDER BY c.class_name, c.section
    `);
    const calendarRequest = pool.request();
    let calendarFilter = '';
    if (isStudent) {
        calendarRequest.input('userId', Number(auth.sub));
        calendarFilter = ' AND s.user_id = @userId';
    }
    const calendarResult = await calendarRequest.query(`
            SELECT DAY(a.date) AS day, LOWER(a.status) AS status
            FROM dbo.attendance a
            JOIN dbo.students s ON s.student_id = a.student_id
            WHERE YEAR(a.date) = YEAR(GETDATE()) AND MONTH(a.date) = MONTH(GETDATE())
                ${calendarFilter}
        `);
    const calendar = Object.fromEntries(calendarResult.recordset.map((row) => [row.day, row.status]));

    const announcementsResult = await pool.request().query(`
        SELECT announcement_id AS id, title, message AS detail, status,
            announcement_date AS announcementDate
        FROM dbo.announcements ORDER BY announcement_date DESC, announcement_id DESC
    `);
    const announcements = announcementsResult.recordset.map((row) => ({
        id: row.id,
        title: row.title,
        detail: row.detail,
        type: 'General',
        status: row.status,
    }));

    const notificationsResult = await pool.request()
        .input('userId', Number(auth.sub))
        .query(`
            SELECT notification_id AS id, title, message, type, notification_date AS notificationDate
            FROM dbo.notifications WHERE user_id = @userId
            ORDER BY notification_date DESC, notification_id DESC
        `);
    const notifications = notificationsResult.recordset.map((row) => ({
        id: row.id,
        title: row.title,
        meta: `${row.type} · ${new Date(row.notificationDate).toLocaleString()}`,
        tone: ['red', 'orange', 'green'].includes(row.type?.toLowerCase()) ? row.type.toLowerCase() : 'blue',
    }));

    const feedbackRequest = pool.request();
    let feedbackFilter = '';
    if (isStudent) {
        feedbackRequest.input('userId', Number(auth.sub));
        feedbackFilter = ' AND s.user_id = @userId';
    }
    const feedbackResult = await feedbackRequest.query(`
            SELECT f.feedback_id AS id, s.name AS student, subject.subject_name AS subject,
                teacher.teacher_name AS teacher, f.month, f.year, f.feedback
            FROM dbo.monthly_feedback f
            JOIN dbo.students s ON s.student_id = f.student_id
            LEFT JOIN dbo.teachers teacher ON teacher.teacher_id = f.teacher_id
            LEFT JOIN dbo.subjects subject ON subject.subject_id = f.subject_id
            WHERE 1 = 1${feedbackFilter}
            ORDER BY f.year DESC, f.month DESC, f.feedback_id DESC
        `);
    const feedback = feedbackResult.recordset.map((row) => {
        let details;
        try {
            details = JSON.parse(row.feedback);
        } catch {
            details = { remarks: row.feedback };
        }
        return { ...details, id: row.id, student: row.student, subject: row.subject, teacher: row.teacher, month: String(row.month), year: row.year };
    });

    const collectionResult = await pool.request().query(`
        SELECT FORMAT(p.payment_date, 'MMM') AS month,
            SUM(CASE WHEN fs.fee_type NOT LIKE '%transport%' THEN p.amount ELSE 0 END) / 100000.0 AS regular,
            SUM(CASE WHEN fs.fee_type LIKE '%late%' THEN p.amount ELSE 0 END) / 100000.0 AS late,
            SUM(CASE WHEN fs.fee_type LIKE '%transport%' THEN p.amount ELSE 0 END) / 100000.0 AS transport
        FROM dbo.payments p
        LEFT JOIN dbo.fee_structure fs ON fs.fee_structure_id = p.fee_structure_id
        WHERE p.status = 'Successful' AND p.payment_date >= DATEADD(month, -3, GETDATE())
        GROUP BY YEAR(p.payment_date), MONTH(p.payment_date), FORMAT(p.payment_date, 'MMM')
        ORDER BY YEAR(p.payment_date), MONTH(p.payment_date)
    `);
    const trendResult = await pool.request().query(`
        SELECT FORMAT(a.date, 'MMM') AS month,
            CAST(100.0 * SUM(CASE WHEN LOWER(a.status) IN ('present', 'late') THEN 1 ELSE 0 END)
                / NULLIF(COUNT(*), 0) AS int) AS school,
            MONTH(a.date) AS monthNumber
        FROM dbo.attendance a
        WHERE a.date >= DATEADD(month, -8, DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1))
        GROUP BY YEAR(a.date), MONTH(a.date), FORMAT(a.date, 'MMM')
        ORDER BY YEAR(a.date), MONTH(a.date)
    `);

    return {
        settings,
        students,
        classes: classesResult.recordset.map((row) => ({ ...row, students: Number(row.students), rate: Number(row.rate) })),
        calendar,
        pendingSync: [],
        notifications,
        announcements,
        payments,
        collection: collectionResult.recordset.map((row) => ({
            month: row.month,
            regular: Number(row.regular ?? 0),
            late: Number(row.late ?? 0),
            transport: Number(row.transport ?? 0),
        })),
        schoolTrend: trendResult.recordset.map((row) => ({
            month: row.month,
            school: Number(row.school ?? 0),
            required: settings.minAttendance,
        })),
        teachers,
        feedback,
    };
}

function classParts(value) {
    const match = /^(.+)-([^-]+)$/.exec(value);
    if (!match) throw new ApiError(422, 'INVALID_CLASS', 'Class must use the format "Class-Section"');
    return { className: match[1].trim(), section: match[2].trim() };
}

async function findStudent(pool, name, userId = null) {
    const result = await pool.request()
        .input('name', name)
        .input('userId', userId)
        .query(`
            SELECT TOP (1) student_id AS studentId, class_id AS classId, user_id AS userId, name
            FROM dbo.students WHERE name = @name AND (@userId IS NULL OR user_id = @userId)
        `);
    return result.recordset[0] ?? null;
}

async function addNotification(pool, { title, message, type, userId = null }) {
    if (userId != null) {
        await pool.request()
            .input('userId', userId)
            .input('title', title)
            .input('message', message)
            .input('type', type)
            .query(`
                INSERT INTO dbo.notifications (user_id, title, message, type, is_read, notification_date)
                VALUES (@userId, @title, @message, @type, 0, SYSDATETIME())
            `);
        return;
    }
    await pool.request()
        .input('title', title)
        .input('message', message)
        .input('type', type)
        .query(`
            INSERT INTO dbo.notifications (user_id, title, message, type, is_read, notification_date)
            SELECT user_id, @title, @message, @type, 0, SYSDATETIME()
            FROM dbo.users WHERE status = 'Active'
        `);
}

export function schoolRouter({ env, getPool }) {
    const router = Router();
    router.use(
        [
            '/dashboard',
            '/students',
            '/teachers',
            '/attendance',
            '/payments',
            '/announcements',
            '/notifications',
            '/feedback',
            '/settings',
            '/transport',
        ],
        authenticate(env.JWT_SECRET),
    );

    router.get('/dashboard', async (req, res) => {
        const pool = await getPool();
        res.json(await getDashboard(pool, req.auth));
    });

    router.get('/students', authorize('Admin', 'Teacher', 'Accounts'), async (req, res) => {
        const pool = await getPool();
        res.json(await getStudents(pool));
    });

    router.post('/students', authorize('Admin'), async (req, res) => {
        const body = studentForm.parse(req.body);
        const { className, section } = classParts(body.klass);
        const pool = await getPool();
        const classResult = await pool.request()
            .input('className', className)
            .input('section', section)
            .query('SELECT class_id AS id FROM dbo.classes WHERE class_name = @className AND section = @section');
        const classId = classResult.recordset[0]?.id;
        if (!classId) throw new ApiError(422, 'CLASS_NOT_FOUND', 'The selected class does not exist');
        await pool.request()
            .input('name', body.name)
            .input('classId', classId)
            .input('guardian', body.guardian)
            .query(`
                INSERT INTO dbo.students (name, class_id, parent_name, admission_date, status)
                VALUES (@name, @classId, @guardian, CAST(GETDATE() AS date), 'Active')
            `);
        res.status(201).json(await getStudents(pool));
    });

    router.delete('/students/:id', authorize('Admin'), async (req, res) => {
        const studentId = Number(req.params.id.replace(/^ST/i, ''));
        if (!Number.isSafeInteger(studentId) || studentId < 1) throw new ApiError(422, 'INVALID_STUDENT_ID', 'Student ID is invalid');
        const pool = await getPool();
        const exists = await pool.request().input('studentId', studentId)
            .query('SELECT student_id FROM dbo.students WHERE student_id = @studentId');
        if (!exists.recordset.length) throw new ApiError(404, 'STUDENT_NOT_FOUND', 'Student not found');
        await pool.request().input('studentId', studentId)
            .query("UPDATE dbo.students SET status = 'Inactive' WHERE student_id = @studentId");
        res.json(await getStudents(pool));
    });

    router.get('/teachers', authorize('Admin', 'Teacher', 'Accounts'), async (req, res) => {
        res.json(await getTeachers(await getPool()));
    });

    router.post('/teachers', authorize('Admin'), async (req, res) => {
        const body = z.object({
            name: z.string().trim().min(1).max(100),
            email: z.string().trim().email().max(255),
            subject: z.string().trim().min(1).max(100),
            klass: z.string().trim().min(1).max(60),
        }).parse(req.body);
        const { className, section } = classParts(body.klass);
        const pool = await getPool();
        const transaction = new sql.Transaction(pool);
        await transaction.begin();
        try {
            const classResult = await transaction.request()
                .input('className', className).input('section', section)
                .query('SELECT class_id AS id FROM dbo.classes WHERE class_name = @className AND section = @section');
            const classId = classResult.recordset[0]?.id;
            if (!classId) throw new ApiError(422, 'CLASS_NOT_FOUND', 'The selected class does not exist');
            const subjectResult = await transaction.request().input('subject', body.subject)
                .query('SELECT TOP (1) subject_id AS id FROM dbo.subjects WHERE subject_name = @subject AND status = \'Active\'');
            const subjectId = subjectResult.recordset[0]?.id;
            if (!subjectId) throw new ApiError(422, 'SUBJECT_NOT_FOUND', 'The selected subject does not exist');
            const teacherResult = await transaction.request().input('name', body.name)
                .input('email', body.email)
                .query(`
                    INSERT INTO dbo.teachers (teacher_name, email, joining_date, status)
                    OUTPUT INSERTED.teacher_id AS id
                    VALUES (@name, @email, CAST(GETDATE() AS date), 'Active')
                `);
            const teacherId = teacherResult.recordset[0].id;
            await transaction.request().input('teacherId', teacherId).input('classId', classId)
                .query('UPDATE dbo.classes SET class_teacher_id = @teacherId WHERE class_id = @classId');
            await transaction.request().input('subjectId', subjectId).input('classId', classId)
                .query(`
                    IF NOT EXISTS (SELECT 1 FROM dbo.class_subjects WHERE class_id = @classId AND subject_id = @subjectId)
                        INSERT INTO dbo.class_subjects (class_id, subject_id) VALUES (@classId, @subjectId)
                `);
            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
        res.status(201).json(await getTeachers(pool));
    });

    const saveAttendance = async (req, res) => {
        const { entries } = attendanceForm.parse(req.body);
        const pool = await getPool();
        const transaction = new sql.Transaction(pool);
        await transaction.begin();
        try {
            for (const entry of entries) {
                const { className, section } = classParts(entry.klass);
                const studentResult = await transaction.request()
                    .input('studentName', entry.student)
                    .input('className', className)
                    .input('section', section)
                    .query(`
                        SELECT TOP (1) s.student_id AS id FROM dbo.students s
                        JOIN dbo.classes c ON c.class_id = s.class_id
                        WHERE s.name = @studentName AND c.class_name = @className AND c.section = @section
                    `);
                const studentId = studentResult.recordset[0]?.id;
                if (!studentId) throw new ApiError(404, 'STUDENT_NOT_FOUND', 'An attendance student could not be found');
                await transaction.request()
                    .input('studentId', studentId)
                    .input('date', entry.date)
                    .input('status', entry.status)
                    .input('markedBy', Number(req.auth.sub))
                    .query(`
                        IF EXISTS (SELECT 1 FROM dbo.attendance WHERE student_id = @studentId AND date = @date)
                            UPDATE dbo.attendance SET status = @status, marked_by = @markedBy
                            WHERE student_id = @studentId AND date = @date
                        ELSE
                            INSERT INTO dbo.attendance (student_id, date, status, marked_by)
                            VALUES (@studentId, @date, @status, @markedBy)
                    `);
            }
            await transaction.commit();
        } catch (error) {
            await transaction.rollback();
            throw error;
        }
        res.json({ saved: entries.length, pendingSync: [] });
    };

    router.post('/attendance', authorize('Admin', 'Teacher'), saveAttendance);
    router.post('/attendance/sync', authorize('Admin', 'Teacher'), saveAttendance);

    router.post('/payments', authorize('Admin', 'Accounts', 'Student'), async (req, res) => {
        const body = paymentForm.parse(req.body);
        const pool = await getPool();
        const student = await (req.auth.role === 'Student'
            ? findStudentByUser(pool, Number(req.auth.sub))
            : findStudent(pool, body.student));
        if (!student) throw new ApiError(404, 'STUDENT_NOT_FOUND', 'Student not found');
        const feeResult = await pool.request().input('classId', student.classId)
            .query(`
                SELECT TOP (1) fs.fee_structure_id AS id, fs.fee_type AS info
                FROM dbo.fee_structure fs
                JOIN dbo.academic_years ay ON ay.academic_year_id = fs.academic_year_id
                WHERE fs.class_id = @classId AND ay.status = 'Active'
                ORDER BY fs.due_date DESC
            `);
        const fee = feeResult.recordset[0];
        if (!fee) throw new ApiError(422, 'FEE_STRUCTURE_NOT_FOUND', 'No active fee structure is configured for this class');

        const txn = `EDU-${randomInt(10000, 100000)}`;
        const result = await pool.request()
            .input('studentId', student.studentId)
            .input('feeId', fee.id)
            .input('amount', body.amount)
            .input('method', body.method)
            .input('txn', txn)
            .query(`
                INSERT INTO dbo.payments (student_id, fee_structure_id, amount, payment_date, payment_method, status, transaction_id)
                OUTPUT INSERTED.payment_id AS id, INSERTED.payment_date AS paymentDate
                VALUES (@studentId, @feeId, @amount, SYSDATETIME(), @method, 'Successful', @txn)
            `);
        const row = result.recordset[0];
        res.status(201).json({
            payment: {
                id: String(row.id),
                date: new Date(row.paymentDate).toISOString().slice(0, 10),
                student: student.name,
                amount: body.amount,
                info: body.info || fee.info,
                method: body.method,
                status: 'Successful',
                txn,
            },
            students: await getStudents(pool, req.auth.role === 'Student' ? Number(req.auth.sub) : null),
            payments: await getPayments(pool, req.auth.role === 'Student' ? Number(req.auth.sub) : null),
        });
    });

    router.post('/announcements', authorize('Admin'), async (req, res) => {
        const body = announcementForm.parse(req.body);
        const pool = await getPool();
        await pool.request().input('title', body.title)
            .input('message', `[${body.type}] ${body.detail}`)
            .input('userId', Number(req.auth.sub))
            .query(`
                INSERT INTO dbo.announcements (title, message, created_by, announcement_date, status)
                VALUES (@title, @message, @userId, SYSDATETIME(), 'Published')
            `);
        await addNotification(pool, {
            title: body.title,
            message: `${body.type} · just now`,
            type: 'Announcement',
        });
        res.status(201).json({ success: true });
    });

    router.post('/notifications', authorize('Admin'), async (req, res) => {
        const body = z.object({
            title: z.string().trim().min(1).max(255),
            meta: z.string().trim().max(500).optional(),
            tone: z.enum(['red', 'orange', 'green', 'blue']).optional(),
        }).parse(req.body);
        await addNotification(await getPool(), {
            title: body.title,
            message: body.meta ?? 'Admin',
            type: body.tone ?? 'blue',
        });
        res.status(201).json({ success: true });
    });

    router.post('/feedback', authorize('Teacher'), async (req, res) => {
        const body = feedbackForm.parse(req.body);
        const pool = await getPool();
        const student = await findStudent(pool, body.student);
        if (!student) throw new ApiError(404, 'STUDENT_NOT_FOUND', 'Student not found');
        const teacherResult = await pool.request().input('userId', Number(req.auth.sub))
            .query('SELECT TOP (1) teacher_id AS id FROM dbo.teachers WHERE user_id = @userId');
        const teacherId = teacherResult.recordset[0]?.id;
        if (!teacherId) throw new ApiError(403, 'TEACHER_PROFILE_REQUIRED', 'Your account is not linked to a teacher profile');
        const subjectResult = await pool.request()
            .input('teacherId', teacherId)
            .input('classId', student.classId)
            .query(`
                SELECT TOP (1) cs.subject_id AS id
                FROM dbo.class_subjects cs
                JOIN dbo.classes c ON c.class_id = cs.class_id
                LEFT JOIN dbo.timetable tt ON tt.class_subject_id = cs.class_subject_id
                WHERE cs.class_id = @classId
                    AND (tt.teacher_id = @teacherId OR c.class_teacher_id = @teacherId)
                ORDER BY CASE WHEN tt.teacher_id = @teacherId THEN 0 ELSE 1 END
            `);
        const subjectId = subjectResult.recordset[0]?.id;
        if (!subjectId) throw new ApiError(422, 'SUBJECT_NOT_ASSIGNED', 'No subject is assigned to you for this class');
        const settings = await getSettings(pool);
        const month = new Date().getMonth() + 1;
        const year = new Date().getFullYear();
        const exists = await pool.request()
            .input('studentId', student.studentId)
            .input('teacherId', teacherId)
            .input('subjectId', subjectId)
            .input('month', month)
            .input('year', year)
            .query(`
                SELECT feedback_id AS id FROM dbo.monthly_feedback
                WHERE student_id = @studentId AND teacher_id = @teacherId
                    AND subject_id = @subjectId AND month = @month AND year = @year
            `);
        if (exists.recordset.length && !settings.teacherCanEdit) {
            throw new ApiError(409, 'FEEDBACK_EXISTS', 'Feedback has already been submitted for this month');
        }
        const serialized = JSON.stringify(body);
        if (exists.recordset.length) {
            await pool.request().input('id', exists.recordset[0].id)
                .input('feedback', serialized)
                .query('UPDATE dbo.monthly_feedback SET feedback = @feedback, feedback_date = SYSDATETIME() WHERE feedback_id = @id');
        } else {
            await pool.request()
                .input('studentId', student.studentId)
                .input('teacherId', teacherId)
                .input('subjectId', subjectId)
                .input('month', month)
                .input('year', year)
                .input('feedback', serialized)
                .query(`
                    INSERT INTO dbo.monthly_feedback (student_id, teacher_id, subject_id, month, year, feedback, feedback_date)
                    VALUES (@studentId, @teacherId, @subjectId, @month, @year, @feedback, SYSDATETIME())
                `);
        }
        if (student.userId != null) {
            await addNotification(pool, {
                title: `Monthly feedback for ${body.student}`,
                message: 'Visible to parents',
                type: 'Feedback',
                userId: student.userId,
            });
        }
        res.status(201).json({ success: true });
    });

    router.put('/settings', authorize('Admin'), async (req, res) => {
        const settings = roleBySetting.parse(req.body);
        const pool = await getPool();
        for (const [name, value] of Object.entries(settings)) {
            await pool.request().input('name', name).input('value', String(value))
                .query(`
                    IF EXISTS (SELECT 1 FROM dbo.school_settings WHERE setting_name = @name)
                        UPDATE dbo.school_settings SET setting_value = @value, updated_at = SYSDATETIME()
                        WHERE setting_name = @name
                    ELSE
                        INSERT INTO dbo.school_settings (setting_name, setting_value, updated_at)
                        VALUES (@name, @value, SYSDATETIME())
                `);
        }
        res.json(await getSettings(pool));
    });

    router.post('/transport', async (req, res) => {
        const body = z.object({
            student: z.string().trim().min(1).max(100),
            transport: z.enum(['None', 'Pending', 'Approved']),
            route: z.string().trim().max(100).optional(),
        }).parse(req.body);
        if (req.auth.role !== 'Student' && !['Admin', 'Accounts'].includes(req.auth.role)) {
            throw new ApiError(403, 'FORBIDDEN', 'You do not have permission to change transport');
        }
        const pool = await getPool();
        const student = await (req.auth.role === 'Student'
            ? findStudentByUser(pool, Number(req.auth.sub))
            : findStudent(pool, body.student));
        if (!student) throw new ApiError(404, 'STUDENT_NOT_FOUND', 'Student not found');
        if (req.auth.role === 'Student' && body.transport === 'Approved') {
            throw new ApiError(403, 'FORBIDDEN', 'Students cannot approve transport applications');
        }
        if (body.transport === 'None') {
            await pool.request().input('studentId', student.studentId)
                .query(`
                    UPDATE dbo.transport_applications SET status = 'Withdrawn', withdrawal_date = CAST(GETDATE() AS date)
                    WHERE student_id = @studentId AND status IN ('Pending', 'Approved')
                `);
        } else {
            const routeResult = await pool.request().input('route', body.route ?? '')
                .query('SELECT TOP (1) transport_id AS id FROM dbo.transport WHERE route_name = @route AND status = \'Active\'');
            const transportId = routeResult.recordset[0]?.id;
            if (!transportId) throw new ApiError(422, 'ROUTE_NOT_FOUND', 'The selected transport route does not exist');
            await pool.request()
                .input('studentId', student.studentId)
                .input('transportId', transportId)
                .input('status', body.transport)
                .query(`
                    IF EXISTS (SELECT 1 FROM dbo.transport_applications WHERE student_id = @studentId AND status IN ('Pending', 'Approved'))
                        UPDATE dbo.transport_applications SET transport_id = @transportId, status = @status
                        WHERE student_id = @studentId AND status IN ('Pending', 'Approved')
                    ELSE
                        INSERT INTO dbo.transport_applications (student_id, transport_id, application_date, status)
                        VALUES (@studentId, @transportId, CAST(GETDATE() AS date), @status)
                `);
        }
        res.json(await getStudents(pool, req.auth.role === 'Student' ? Number(req.auth.sub) : null));
    });

    return router;
}

async function findStudentByUser(pool, userId) {
    const result = await pool.request().input('userId', userId)
        .query('SELECT TOP (1) student_id AS studentId, class_id AS classId, name, user_id AS userId FROM dbo.students WHERE user_id = @userId');
    return result.recordset[0] ?? null;
}
