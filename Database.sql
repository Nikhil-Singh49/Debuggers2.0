CREATE DATABASE SchoolManagement;
GO
USE SchoolManagement;
GO

-- 1 Users
CREATE TABLE users
(
    user_id INT IDENTITY(1,1) PRIMARY KEY,

    username VARCHAR(50) NOT NULL UNIQUE,

    password VARCHAR(255) NOT NULL,

    role VARCHAR(20) NOT NULL
        CHECK (role IN ('student', 'teacher', 'admin', 'accounts')),

    status VARCHAR(20) NOT NULL
        CHECK (status IN ('active', 'inactive'))
);

-- 2 Teachers
CREATE TABLE teachers
(
    teacher_id INT IDENTITY(1,1) PRIMARY KEY,

    user_id INT NOT NULL UNIQUE,

    teacher_name VARCHAR(100) NOT NULL,

    email VARCHAR(100) NOT NULL UNIQUE,

    phone VARCHAR(15) NOT NULL,

    joining_date DATE NOT NULL,

    status VARCHAR(20) NOT NULL
        CHECK (status IN ('Active', 'Inactive')),

    CONSTRAINT FK_teachers_users
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
);

-- 3 Classes
CREATE TABLE classes
(
    class_id INT IDENTITY(1,1) PRIMARY KEY,

    class_name VARCHAR(20) NOT NULL,

    section VARCHAR(10) NOT NULL,

    class_teacher_id INT NULL,

    CONSTRAINT UQ_classes_class_section
        UNIQUE (class_name, section),

    CONSTRAINT FK_classes_teachers
        FOREIGN KEY (class_teacher_id)
        REFERENCES teachers(teacher_id)
);

-- 4 Students
CREATE TABLE students
(
    student_id INT IDENTITY(1,1) PRIMARY KEY,

    user_id INT NOT NULL,

    name VARCHAR(100) NOT NULL,

    roll_no INT NOT NULL,

    class_id INT NOT NULL,

    date_of_birth DATE NOT NULL,

    gender VARCHAR(10) NOT NULL
        CHECK (gender IN ('Male', 'Female', 'Other')),

    parent_name VARCHAR(100) NOT NULL,

    parent_contact VARCHAR(15) NOT NULL,

    address VARCHAR(255) NULL,

    admission_date DATE NOT NULL,

    status VARCHAR(20) NOT NULL
        CHECK (status IN ('Active', 'Inactive')),

    CONSTRAINT UQ_students_user
        UNIQUE (user_id),

    CONSTRAINT UQ_students_class_roll
        UNIQUE (class_id, roll_no),

    CONSTRAINT FK_students_users
        FOREIGN KEY (user_id)
        REFERENCES users(user_id),

    CONSTRAINT FK_students_classes
        FOREIGN KEY (class_id)
        REFERENCES classes(class_id)
);

--5 Subjects
CREATE TABLE subjects
(
    subject_id INT IDENTITY(1,1) PRIMARY KEY,

    subject_name VARCHAR(100) NOT NULL,

    status VARCHAR(20) NOT NULL
        CHECK (status IN ('Active', 'Inactive')),

    CONSTRAINT UQ_subjects_name
        UNIQUE (subject_name)
);

--6  Academic Years
CREATE TABLE academic_years
(
    academic_year_id INT IDENTITY(1,1) PRIMARY KEY,

    year_name VARCHAR(20) NOT NULL,

    start_date DATE NOT NULL,

    end_date DATE NOT NULL,

    status VARCHAR(20) NOT NULL
        CHECK (status IN ('Active', 'Inactive')),

    CONSTRAINT UQ_academic_years_name
        UNIQUE (year_name),

    CONSTRAINT CK_academic_years_dates
        CHECK (end_date > start_date)
);

-- 7 Class Subjects
CREATE TABLE class_subjects
(
    class_subject_id INT IDENTITY(1,1) PRIMARY KEY,

    class_id INT NOT NULL,

    subject_id INT NOT NULL,

    CONSTRAINT UQ_class_subjects
        UNIQUE (class_id, subject_id),

    CONSTRAINT FK_class_subjects_classes
        FOREIGN KEY (class_id)
        REFERENCES classes(class_id),

    CONSTRAINT FK_class_subjects_subjects
        FOREIGN KEY (subject_id)
        REFERENCES subjects(subject_id)
);

--8 TimeTable
CREATE TABLE timetable
(
    timetable_id INT IDENTITY(1,1) PRIMARY KEY,

    class_subject_id INT NOT NULL,

    teacher_id INT NOT NULL,

    day VARCHAR(10) NOT NULL
        CHECK (day IN
        ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday')),

    start_time TIME NOT NULL,

    end_time TIME NOT NULL,

    CONSTRAINT CK_timetable_time
        CHECK (end_time > start_time),

    CONSTRAINT FK_timetable_class_subject
        FOREIGN KEY (class_subject_id)
        REFERENCES class_subjects(class_subject_id),

    CONSTRAINT FK_timetable_teacher
        FOREIGN KEY (teacher_id)
        REFERENCES teachers(teacher_id)
);

--9 Attendance
CREATE TABLE attendance
(
    attendance_id INT IDENTITY(1,1) PRIMARY KEY,

    student_id INT NOT NULL,

    date DATE NOT NULL,

    status VARCHAR(10) NOT NULL
        CHECK (status IN ('Present', 'Absent', 'Late')),

    marked_by INT NOT NULL,

    CONSTRAINT UQ_attendance_student_date
        UNIQUE (student_id, date),

    CONSTRAINT FK_attendance_students
        FOREIGN KEY (student_id)
        REFERENCES students(student_id),

    CONSTRAINT FK_attendance_teachers
        FOREIGN KEY (marked_by)
        REFERENCES teachers(teacher_id)
);

-- 10 Notifications
CREATE TABLE notifications
(
    notification_id INT IDENTITY(1,1) PRIMARY KEY,

    user_id INT NOT NULL,

    title VARCHAR(150) NOT NULL,

    message VARCHAR(500) NOT NULL,

    type VARCHAR(20) NOT NULL
        CHECK (type IN ('Attendance', 'Fee', 'Announcement', 'General')),

    is_read BIT NOT NULL DEFAULT 0,

    notification_date DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT FK_notifications_users
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
);

-- 11 Monthly Feedback
CREATE TABLE monthly_feedback
(
    feedback_id INT IDENTITY(1,1) PRIMARY KEY,

    student_id INT NOT NULL,

    teacher_id INT NOT NULL,

    subject_id INT NOT NULL,

    month INT NOT NULL
        CHECK (month BETWEEN 1 AND 12),

    year INT NOT NULL,

    feedback VARCHAR(1000) NOT NULL,

    feedback_date DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT UQ_monthly_feedback
        UNIQUE (student_id, subject_id, month, year),

    CONSTRAINT FK_feedback_students
        FOREIGN KEY (student_id)
        REFERENCES students(student_id),

    CONSTRAINT FK_feedback_teachers
        FOREIGN KEY (teacher_id)
        REFERENCES teachers(teacher_id),

    CONSTRAINT FK_feedback_subjects
        FOREIGN KEY (subject_id)
        REFERENCES subjects(subject_id)
);

-- 12 Announcements
CREATE TABLE announcements
(
    announcement_id INT IDENTITY(1,1) PRIMARY KEY,

    title VARCHAR(150) NOT NULL,

    message VARCHAR(1000) NOT NULL,

    created_by INT NOT NULL,

    announcement_date DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

    status VARCHAR(20) NOT NULL
        CHECK (status IN ('Active', 'Inactive')),

    CONSTRAINT FK_announcements_users
        FOREIGN KEY (created_by)
        REFERENCES users(user_id)
);

--13 Fee Structures
CREATE TABLE fee_structure
(
    fee_structure_id INT IDENTITY(1,1) PRIMARY KEY,

    class_id INT NOT NULL,

    academic_year_id INT NOT NULL,

    fee_type VARCHAR(30) NOT NULL
        CHECK (fee_type IN
        ('Tuition', 'Exam', 'Annual', 'Transport', 'Library')),

    amount DECIMAL(10,2) NOT NULL
        CHECK (amount > 0),

    due_date DATE NOT NULL,

    CONSTRAINT UQ_fee_structure
        UNIQUE (class_id, academic_year_id, fee_type),

    CONSTRAINT FK_fee_structure_classes
        FOREIGN KEY (class_id)
        REFERENCES classes(class_id),

    CONSTRAINT FK_fee_structure_academic_years
        FOREIGN KEY (academic_year_id)
        REFERENCES academic_years(academic_year_id)
);

-- 14 Payments
CREATE TABLE payments
(
    payment_id INT IDENTITY(1,1) PRIMARY KEY,

    student_id INT NOT NULL,

    fee_structure_id INT NOT NULL,

    amount DECIMAL(10,2) NOT NULL
        CHECK (amount > 0),

    payment_date DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

    payment_method VARCHAR(20) NOT NULL
        CHECK (payment_method IN ('Cash', 'UPI', 'Card', 'Online')),

    status VARCHAR(20) NOT NULL
        CHECK (status IN ('Successful', 'Pending', 'Unsuccessful')),

    transaction_id VARCHAR(100) NULL,

    CONSTRAINT FK_payments_students
        FOREIGN KEY (student_id)
        REFERENCES students(student_id),

    CONSTRAINT FK_payments_fee_structure
        FOREIGN KEY (fee_structure_id)
        REFERENCES fee_structure(fee_structure_id)
);

-- 15 Transport
CREATE TABLE transport
(
    transport_id INT IDENTITY(1,1) PRIMARY KEY,

    route_name VARCHAR(100) NOT NULL,

    vehicle_number VARCHAR(20) NOT NULL,

    driver_name VARCHAR(100) NOT NULL,

    driver_contact VARCHAR(15) NOT NULL,

    pickup_point VARCHAR(150) NOT NULL,

    pickup_time TIME NOT NULL,

    drop_point VARCHAR(150) NOT NULL,

    drop_time TIME NOT NULL,

    fee DECIMAL(10,2) NOT NULL
        CHECK (fee > 0),

    status VARCHAR(20) NOT NULL
        CHECK (status IN ('Active', 'Inactive')),

    CONSTRAINT UQ_transport_vehicle
        UNIQUE (vehicle_number),

    CONSTRAINT CK_transport_time
        CHECK (drop_time > pickup_time)
);

-- 16 Transport Applications
CREATE TABLE transport_applications
(
    application_id INT IDENTITY(1,1) PRIMARY KEY,

    student_id INT NOT NULL,

    transport_id INT NOT NULL,

    application_date DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),

    status VARCHAR(20) NOT NULL
        CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Withdrawn')),

    withdrawal_date DATE NULL,

    CONSTRAINT FK_transport_applications_students
        FOREIGN KEY (student_id)
        REFERENCES students(student_id),

    CONSTRAINT FK_transport_applications_transport
        FOREIGN KEY (transport_id)
        REFERENCES transport(transport_id)
);

--17 Fee Remainders
CREATE TABLE fee_reminders
(
    reminder_id INT IDENTITY(1,1) PRIMARY KEY,

    student_id INT NOT NULL,

    fee_structure_id INT NOT NULL,

    reminder_date DATE NOT NULL,

    reminder_type VARCHAR(20) NOT NULL
        CHECK (reminder_type IN ('7_days_before', '1_day_before', 'overdue')),

    status VARCHAR(20) NOT NULL
        CHECK (status IN ('Sent', 'Failed')),

    CONSTRAINT UQ_fee_reminders
        UNIQUE (student_id, fee_structure_id, reminder_date, reminder_type),

    CONSTRAINT FK_fee_reminders_students
        FOREIGN KEY (student_id)
        REFERENCES students(student_id),

    CONSTRAINT FK_fee_reminders_fee_structure
        FOREIGN KEY (fee_structure_id)
        REFERENCES fee_structure(fee_structure_id)
);

--18 Early Warning
CREATE TABLE early_warning
(
    warning_id INT IDENTITY(1,1) PRIMARY KEY,

    student_id INT NOT NULL,

    risk_level VARCHAR(20) NOT NULL
        CHECK (risk_level IN ('Low', 'Needs Attention', 'High Risk')),

    reason VARCHAR(1000) NOT NULL,

    warning_date DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

    status VARCHAR(20) NOT NULL
        CHECK (status IN ('Active', 'Resolved')),

    CONSTRAINT FK_early_warning_students
        FOREIGN KEY (student_id)
        REFERENCES students(student_id)
);

--19 School Settings
CREATE TABLE school_settings
(
    setting_id INT IDENTITY(1,1) PRIMARY KEY,

    setting_name VARCHAR(100) NOT NULL,

    setting_value VARCHAR(255) NOT NULL,

    updated_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

    CONSTRAINT UQ_school_settings_name
        UNIQUE (setting_name)
);
--20 Sms Logs
CREATE TABLE sms_logs
(
    sms_id INT IDENTITY(1,1) PRIMARY KEY,

    student_id INT NOT NULL,

    message VARCHAR(500) NOT NULL,

    sms_type VARCHAR(20) NOT NULL
        CHECK (sms_type IN ('Attendance', 'Fee', 'General')),

    sent_date DATETIME2 NOT NULL DEFAULT SYSDATETIME(),

    status VARCHAR(20) NOT NULL
        CHECK (status IN ('Sent', 'Failed')),

    CONSTRAINT FK_sms_logs_students
        FOREIGN KEY (student_id)
        REFERENCES students(student_id)
);

-- 21 Student Class History 
CREATE TABLE student_class_history
(
    history_id INT IDENTITY(1,1) PRIMARY KEY,

    student_id INT NOT NULL,

    class_id INT NOT NULL,

    academic_year_id INT NOT NULL,

    CONSTRAINT UQ_student_class_history
        UNIQUE (student_id, academic_year_id),

    CONSTRAINT FK_history_students
        FOREIGN KEY (student_id)
        REFERENCES students(student_id),

    CONSTRAINT FK_history_classes
        FOREIGN KEY (class_id)
        REFERENCES classes(class_id),

    CONSTRAINT FK_history_academic_years
        FOREIGN KEY (academic_year_id)
        REFERENCES academic_years(academic_year_id)
);
