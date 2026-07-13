USE [UniversityERP];
GO

SET NOCOUNT ON;
GO


IF NOT EXISTS
(
    SELECT 1
    FROM dbo.Users
    WHERE Username = N'erp.admin'
)
BEGIN
    INSERT INTO dbo.Users
    (
        Username,
        PasswordHash,
        Role
    )
    VALUES
    (
        N'erp.admin',
        N'$2b$10$ZgL.AqFC1Y1grKG5u1u8N.P.0mVyZqonr5cTWydm147Uny4LRbKna',
        N'Admin'
    );
END;

IF NOT EXISTS
(
    SELECT 1
    FROM dbo.Users
    WHERE Username = N'amaya.lecturer'
)
BEGIN
    INSERT INTO dbo.Users
    (
        Username,
        PasswordHash,
        Role
    )
    VALUES
    (
        N'amaya.lecturer',
        N'$2b$10$D0WR6k9Caa0BxBrcoCecy.DRxKQgHn97jx7C4rYCV0nPv/Se6qRy6',
        N'Lecturer'
    );
END;

IF NOT EXISTS
(
    SELECT 1
    FROM dbo.Users
    WHERE Username = N'student.2026001'
)
BEGIN
    INSERT INTO dbo.Users
    (
        Username,
        PasswordHash,
        Role
    )
    VALUES
    (
        N'student.2026001',
        N'$2b$10$Gjsy8pNZVcdKZQDjcwlflewolV8xtyPUxD22TEAL/MDbxba9Qo.xK',
        N'Student'
    );
END;

IF NOT EXISTS
(
    SELECT 1
    FROM dbo.Users
    WHERE Username = N'student.2026002'
)
BEGIN
    INSERT INTO dbo.Users
    (
        Username,
        PasswordHash,
        Role
    )
    VALUES
    (
        N'student.2026002',
        N'$2b$10$6CXyxqM2Vs3T2TlCy2ZkpOE6GCFzfGkcioXgofLyux2DQalSAy./q',
        N'Student'
    );
END;
GO


DECLARE @LecturerUserID INT;

SELECT @LecturerUserID = UserID
FROM dbo.Users
WHERE Username = N'amaya.lecturer';

IF NOT EXISTS
(
    SELECT 1
    FROM dbo.Lecturers
    WHERE EmployeeNumber = N'LEC-2026-001'
)
BEGIN
    INSERT INTO dbo.Lecturers
    (
        UserID,
        EmployeeNumber,
        FullName,
        Email,
        Department
    )
    VALUES
    (
        @LecturerUserID,
        N'LEC-2026-001',
        N'Dr. Amaya Perera',
        N'amaya.perera@example.edu',
        N'Computer Science'
    );
END;
GO


IF NOT EXISTS
(
    SELECT 1
    FROM dbo.Students
    WHERE RegistrationNumber = N'UNI-2026-001'
)
BEGIN
    INSERT INTO dbo.Students
    (
        UserID,
        RegistrationNumber,
        FullName,
        Email,
        Phone,
        Department,
        AcademicYear
    )
    VALUES
    (
        (SELECT UserID FROM dbo.Users WHERE Username = N'student.2026001'),
        N'UNI-2026-001',
        N'Nethmi Silva',
        N'nethmi.silva@example.edu',
        N'+94 77 555 0101',
        N'Computer Science',
        1
    );
END;

IF NOT EXISTS
(
    SELECT 1
    FROM dbo.Students
    WHERE RegistrationNumber = N'UNI-2026-002'
)
BEGIN
    INSERT INTO dbo.Students
    (
        UserID,
        RegistrationNumber,
        FullName,
        Email,
        Phone,
        Department,
        AcademicYear
    )
    VALUES
    (
        (SELECT UserID FROM dbo.Users WHERE Username = N'student.2026002'),
        N'UNI-2026-002',
        N'Kavindu Fernando',
        N'kavindu.fernando@example.edu',
        N'+94 77 555 0102',
        N'Computer Science',
        1
    );
END;
GO


IF NOT EXISTS
(
    SELECT 1
    FROM dbo.Courses
    WHERE CourseCode = N'CS101'
)
BEGIN
    INSERT INTO dbo.Courses
    (
        CourseCode,
        CourseName,
        Credits,
        Department
    )
    VALUES
    (
        N'CS101',
        N'Introduction to Programming',
        4,
        N'Computer Science'
    );
END;

IF NOT EXISTS
(
    SELECT 1
    FROM dbo.Courses
    WHERE CourseCode = N'CS102'
)
BEGIN
    INSERT INTO dbo.Courses
    (
        CourseCode,
        CourseName,
        Credits,
        Department
    )
    VALUES
    (
        N'CS102',
        N'Database Fundamentals',
        3,
        N'Computer Science'
    );
END;
GO


DECLARE @LecturerID INT;
DECLARE @CourseCS101ID INT;
DECLARE @CourseCS102ID INT;

SELECT @LecturerID = LecturerID
FROM dbo.Lecturers
WHERE EmployeeNumber = N'LEC-2026-001';

SELECT @CourseCS101ID = CourseID
FROM dbo.Courses
WHERE CourseCode = N'CS101';

SELECT @CourseCS102ID = CourseID
FROM dbo.Courses
WHERE CourseCode = N'CS102';

IF NOT EXISTS
(
    SELECT 1
    FROM dbo.LecturerCourses
    WHERE LecturerID = @LecturerID
      AND CourseID = @CourseCS101ID
)
BEGIN
    INSERT INTO dbo.LecturerCourses
    (
        LecturerID,
        CourseID
    )
    VALUES
    (
        @LecturerID,
        @CourseCS101ID
    );
END;

IF NOT EXISTS
(
    SELECT 1
    FROM dbo.LecturerCourses
    WHERE LecturerID = @LecturerID
      AND CourseID = @CourseCS102ID
)
BEGIN
    INSERT INTO dbo.LecturerCourses
    (
        LecturerID,
        CourseID
    )
    VALUES
    (
        @LecturerID,
        @CourseCS102ID
    );
END;
GO


DECLARE @StudentOneID INT;
DECLARE @StudentTwoID INT;
DECLARE @EnrollmentCourseOneID INT;
DECLARE @EnrollmentCourseTwoID INT;

SELECT @StudentOneID = StudentID
FROM dbo.Students
WHERE RegistrationNumber = N'UNI-2026-001';

SELECT @StudentTwoID = StudentID
FROM dbo.Students
WHERE RegistrationNumber = N'UNI-2026-002';

SELECT @EnrollmentCourseOneID = CourseID
FROM dbo.Courses
WHERE CourseCode = N'CS101';

SELECT @EnrollmentCourseTwoID = CourseID
FROM dbo.Courses
WHERE CourseCode = N'CS102';

IF NOT EXISTS
(
    SELECT 1 FROM dbo.Enrollments
    WHERE StudentID = @StudentOneID
      AND CourseID = @EnrollmentCourseOneID
)
BEGIN
    INSERT INTO dbo.Enrollments
        (StudentID, CourseID, EnrollmentDate)
    VALUES
        (@StudentOneID, @EnrollmentCourseOneID, '2026-06-15');
END;

IF NOT EXISTS
(
    SELECT 1 FROM dbo.Enrollments
    WHERE StudentID = @StudentOneID
      AND CourseID = @EnrollmentCourseTwoID
)
BEGIN
    INSERT INTO dbo.Enrollments
        (StudentID, CourseID, EnrollmentDate)
    VALUES
        (@StudentOneID, @EnrollmentCourseTwoID, '2026-06-15');
END;

IF NOT EXISTS
(
    SELECT 1 FROM dbo.Enrollments
    WHERE StudentID = @StudentTwoID
      AND CourseID = @EnrollmentCourseOneID
)
BEGIN
    INSERT INTO dbo.Enrollments
        (StudentID, CourseID, EnrollmentDate)
    VALUES
        (@StudentTwoID, @EnrollmentCourseOneID, '2026-06-16');
END;

IF NOT EXISTS
(
    SELECT 1 FROM dbo.Enrollments
    WHERE StudentID = @StudentTwoID
      AND CourseID = @EnrollmentCourseTwoID
)
BEGIN
    INSERT INTO dbo.Enrollments
        (StudentID, CourseID, EnrollmentDate)
    VALUES
        (@StudentTwoID, @EnrollmentCourseTwoID, '2026-06-16');
END;
GO


DECLARE @AttendanceStudentOneID INT;
DECLARE @AttendanceStudentTwoID INT;
DECLARE @AttendanceCourseOneID INT;
DECLARE @AttendanceCourseTwoID INT;

SELECT @AttendanceStudentOneID = StudentID FROM dbo.Students WHERE RegistrationNumber = N'UNI-2026-001';
SELECT @AttendanceStudentTwoID = StudentID FROM dbo.Students WHERE RegistrationNumber = N'UNI-2026-002';
SELECT @AttendanceCourseOneID = CourseID FROM dbo.Courses WHERE CourseCode = N'CS101';
SELECT @AttendanceCourseTwoID = CourseID FROM dbo.Courses WHERE CourseCode = N'CS102';

IF NOT EXISTS
(
    SELECT 1 FROM dbo.Attendance
    WHERE StudentID = @AttendanceStudentOneID
      AND CourseID = @AttendanceCourseOneID
      AND AttendanceDate = '2026-07-06'
)
BEGIN
    INSERT INTO dbo.Attendance
        (StudentID, CourseID, AttendanceDate, Status)
    VALUES
        (@AttendanceStudentOneID, @AttendanceCourseOneID, '2026-07-06', N'Present');
END;

IF NOT EXISTS
(
    SELECT 1 FROM dbo.Attendance
    WHERE StudentID = @AttendanceStudentTwoID
      AND CourseID = @AttendanceCourseOneID
      AND AttendanceDate = '2026-07-06'
)
BEGIN
    INSERT INTO dbo.Attendance
        (StudentID, CourseID, AttendanceDate, Status)
    VALUES
        (@AttendanceStudentTwoID, @AttendanceCourseOneID, '2026-07-06', N'Late');
END;

IF NOT EXISTS
(
    SELECT 1 FROM dbo.Attendance
    WHERE StudentID = @AttendanceStudentOneID
      AND CourseID = @AttendanceCourseTwoID
      AND AttendanceDate = '2026-07-07'
)
BEGIN
    INSERT INTO dbo.Attendance
        (StudentID, CourseID, AttendanceDate, Status)
    VALUES
        (@AttendanceStudentOneID, @AttendanceCourseTwoID, '2026-07-07', N'Present');
END;

IF NOT EXISTS
(
    SELECT 1 FROM dbo.Attendance
    WHERE StudentID = @AttendanceStudentTwoID
      AND CourseID = @AttendanceCourseTwoID
      AND AttendanceDate = '2026-07-07'
)
BEGIN
    INSERT INTO dbo.Attendance
        (StudentID, CourseID, AttendanceDate, Status)
    VALUES
        (@AttendanceStudentTwoID, @AttendanceCourseTwoID, '2026-07-07', N'Absent');
END;
GO


DECLARE @ExamCourseOneID INT;
DECLARE @ExamCourseTwoID INT;

SELECT @ExamCourseOneID = CourseID FROM dbo.Courses WHERE CourseCode = N'CS101';
SELECT @ExamCourseTwoID = CourseID FROM dbo.Courses WHERE CourseCode = N'CS102';

IF NOT EXISTS
(
    SELECT 1 FROM dbo.Examinations
    WHERE CourseID = @ExamCourseOneID
      AND ExaminationName = N'Programming Midterm'
      AND ExaminationDate = '2026-08-10'
)
BEGIN
    INSERT INTO dbo.Examinations
        (CourseID, ExaminationName, ExaminationDate)
    VALUES
        (@ExamCourseOneID, N'Programming Midterm', '2026-08-10');
END;

IF NOT EXISTS
(
    SELECT 1 FROM dbo.Examinations
    WHERE CourseID = @ExamCourseTwoID
      AND ExaminationName = N'Database Midterm'
      AND ExaminationDate = '2026-08-12'
)
BEGIN
    INSERT INTO dbo.Examinations
        (CourseID, ExaminationName, ExaminationDate)
    VALUES
        (@ExamCourseTwoID, N'Database Midterm', '2026-08-12');
END;
GO


DECLARE @ResultStudentOneID INT;
DECLARE @ResultStudentTwoID INT;
DECLARE @ProgrammingExamID INT;
DECLARE @DatabaseExamID INT;

SELECT @ResultStudentOneID = StudentID FROM dbo.Students WHERE RegistrationNumber = N'UNI-2026-001';
SELECT @ResultStudentTwoID = StudentID FROM dbo.Students WHERE RegistrationNumber = N'UNI-2026-002';

SELECT @ProgrammingExamID = ExaminationID
FROM dbo.Examinations
WHERE CourseID = (SELECT CourseID FROM dbo.Courses WHERE CourseCode = N'CS101')
  AND ExaminationName = N'Programming Midterm'
  AND ExaminationDate = '2026-08-10';

SELECT @DatabaseExamID = ExaminationID
FROM dbo.Examinations
WHERE CourseID = (SELECT CourseID FROM dbo.Courses WHERE CourseCode = N'CS102')
  AND ExaminationName = N'Database Midterm'
  AND ExaminationDate = '2026-08-12';

IF NOT EXISTS
(
    SELECT 1 FROM dbo.Results
    WHERE StudentID = @ResultStudentOneID
      AND ExaminationID = @ProgrammingExamID
)
BEGIN
    INSERT INTO dbo.Results
        (ExaminationID, StudentID, Marks, Grade)
    VALUES
        (@ProgrammingExamID, @ResultStudentOneID, 88.50, N'A+');
END;

IF NOT EXISTS
(
    SELECT 1 FROM dbo.Results
    WHERE StudentID = @ResultStudentTwoID
      AND ExaminationID = @ProgrammingExamID
)
BEGIN
    INSERT INTO dbo.Results
        (ExaminationID, StudentID, Marks, Grade)
    VALUES
        (@ProgrammingExamID, @ResultStudentTwoID, 72.00, N'B');
END;

IF NOT EXISTS
(
    SELECT 1 FROM dbo.Results
    WHERE StudentID = @ResultStudentOneID
      AND ExaminationID = @DatabaseExamID
)
BEGIN
    INSERT INTO dbo.Results
        (ExaminationID, StudentID, Marks, Grade)
    VALUES
        (@DatabaseExamID, @ResultStudentOneID, 79.00, N'A');
END;

IF NOT EXISTS
(
    SELECT 1 FROM dbo.Results
    WHERE StudentID = @ResultStudentTwoID
      AND ExaminationID = @DatabaseExamID
)
BEGIN
    INSERT INTO dbo.Results
        (ExaminationID, StudentID, Marks, Grade)
    VALUES
        (@DatabaseExamID, @ResultStudentTwoID, 58.50, N'C');
END;
GO
