USE [UniversityERP];
GO


IF OBJECT_ID(N'dbo.Users', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Users
    (
        UserID       INT IDENTITY(1,1) NOT NULL,
        Username     NVARCHAR(100) NOT NULL,
        PasswordHash NVARCHAR(255) NOT NULL,
        Role         NVARCHAR(20) NOT NULL,

        CONSTRAINT PK_Users
            PRIMARY KEY (UserID),

        CONSTRAINT UQ_Users_Username
            UNIQUE (Username),

        CONSTRAINT CK_Users_Role
            CHECK (Role IN (N'Admin', N'Lecturer', N'Student'))
    );
END;
GO


IF OBJECT_ID(N'dbo.Students', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Students
    (
        StudentID         INT IDENTITY(1,1) NOT NULL,
        UserID         INT NULL,
        RegistrationNumber NVARCHAR(50) NOT NULL,
        FullName          NVARCHAR(150) NOT NULL,
        Email             NVARCHAR(150) NOT NULL,
        Phone             NVARCHAR(20) NULL,
        Department        NVARCHAR(100) NOT NULL,
        AcademicYear      INT NOT NULL,

        CONSTRAINT PK_Students
            PRIMARY KEY (StudentID),

        CONSTRAINT UQ_Students_RegistrationNumber
            UNIQUE (RegistrationNumber),

        CONSTRAINT UQ_Students_Email
            UNIQUE (Email),

        CONSTRAINT UQ_Students_UserID
            UNIQUE (UserID),

        CONSTRAINT FK_Students_Users
            FOREIGN KEY (UserID)
            REFERENCES dbo.Users(UserID),

        CONSTRAINT CK_Students_AcademicYear
            CHECK (AcademicYear BETWEEN 1 AND 4)
    );
END;
GO


 
IF OBJECT_ID(N'dbo.Courses', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Courses
    (
        CourseID   INT IDENTITY(1,1) NOT NULL,
        CourseCode NVARCHAR(30) NOT NULL,
        CourseName NVARCHAR(150) NOT NULL,
        Credits    INT NOT NULL,
        Department NVARCHAR(100) NOT NULL,

        CONSTRAINT PK_Courses
            PRIMARY KEY (CourseID),

        CONSTRAINT UQ_Courses_CourseCode
            UNIQUE (CourseCode),

        CONSTRAINT CK_Courses_Credits
            CHECK (Credits BETWEEN 1 AND 6)
    );
END;
GO


  
IF OBJECT_ID(N'dbo.Lecturers', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Lecturers
    (
        LecturerID     INT IDENTITY(1,1) NOT NULL,
        UserID         INT NOT NULL,
        EmployeeNumber NVARCHAR(50) NOT NULL,
        FullName       NVARCHAR(150) NOT NULL,
        Email          NVARCHAR(150) NOT NULL,
        Department     NVARCHAR(100) NOT NULL,

        CONSTRAINT PK_Lecturers
            PRIMARY KEY (LecturerID),

        CONSTRAINT UQ_Lecturers_EmployeeNumber
            UNIQUE (EmployeeNumber),

        CONSTRAINT UQ_Lecturers_Email
            UNIQUE (Email),

        CONSTRAINT FK_Lecturers_Users
            FOREIGN KEY (UserID)
            REFERENCES dbo.Users(UserID)
    );
END;
GO


IF OBJECT_ID(N'dbo.LecturerCourses', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.LecturerCourses
    (
        LecturerCourseID INT IDENTITY(1,1) NOT NULL,
        LecturerID       INT NOT NULL,
        CourseID         INT NOT NULL,

        CONSTRAINT PK_LecturerCourses
            PRIMARY KEY (LecturerCourseID),

        CONSTRAINT FK_LecturerCourses_Lecturers
            FOREIGN KEY (LecturerID)
            REFERENCES dbo.Lecturers(LecturerID),

        CONSTRAINT FK_LecturerCourses_Courses
            FOREIGN KEY (CourseID)
            REFERENCES dbo.Courses(CourseID),

        CONSTRAINT UQ_LecturerCourses_LecturerCourse
            UNIQUE (LecturerID, CourseID)
    );
END;
GO


IF OBJECT_ID(N'dbo.Enrollments', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Enrollments
    (
        EnrollmentID   INT IDENTITY(1,1) NOT NULL,
        StudentID      INT NOT NULL,
        CourseID       INT NOT NULL,
        EnrollmentDate DATE NOT NULL
            CONSTRAINT DF_Enrollments_EnrollmentDate
            DEFAULT (CONVERT(DATE, GETDATE())),

        CONSTRAINT PK_Enrollments
            PRIMARY KEY (EnrollmentID),

        CONSTRAINT FK_Enrollments_Students
            FOREIGN KEY (StudentID)
            REFERENCES dbo.Students(StudentID),

        CONSTRAINT FK_Enrollments_Courses
            FOREIGN KEY (CourseID)
            REFERENCES dbo.Courses(CourseID),

        CONSTRAINT UQ_Enrollments_StudentCourse
            UNIQUE (StudentID, CourseID)
    );
END;
GO


IF OBJECT_ID(N'dbo.Attendance', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Attendance
    (
        AttendanceID   INT IDENTITY(1,1) NOT NULL,
        StudentID      INT NOT NULL,
        CourseID       INT NOT NULL,
        AttendanceDate DATE NOT NULL,
        Status         NVARCHAR(20) NOT NULL,

        CONSTRAINT PK_Attendance
            PRIMARY KEY (AttendanceID),

        CONSTRAINT FK_Attendance_Students
            FOREIGN KEY (StudentID)
            REFERENCES dbo.Students(StudentID),

        CONSTRAINT FK_Attendance_Courses
            FOREIGN KEY (CourseID)
            REFERENCES dbo.Courses(CourseID),

        CONSTRAINT CK_Attendance_Status
            CHECK (Status IN (N'Present', N'Absent', N'Late')),

        CONSTRAINT UQ_Attendance_StudentCourseDate
            UNIQUE (StudentID, CourseID, AttendanceDate)
    );
END;
GO


IF OBJECT_ID(N'dbo.Examinations', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Examinations
    (
        ExaminationID   INT IDENTITY(1,1) NOT NULL,
        CourseID         INT NOT NULL,
        ExaminationName  NVARCHAR(100) NOT NULL,
        ExaminationDate  DATE NOT NULL,

        CONSTRAINT PK_Examinations
            PRIMARY KEY (ExaminationID),

        CONSTRAINT FK_Examinations_Courses
            FOREIGN KEY (CourseID)
            REFERENCES dbo.Courses(CourseID),

        CONSTRAINT UQ_Examinations_CourseNameDate
            UNIQUE (CourseID, ExaminationName, ExaminationDate)
    );
END;
GO


IF OBJECT_ID(N'dbo.Results', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Results
    (
        ResultID      INT IDENTITY(1,1) NOT NULL,
        ExaminationID INT NOT NULL,
        StudentID     INT NOT NULL,
        Marks         DECIMAL(5,2) NOT NULL,
        Grade         NVARCHAR(5) NOT NULL,

        CONSTRAINT PK_Results
            PRIMARY KEY (ResultID),

        CONSTRAINT FK_Results_Examinations
            FOREIGN KEY (ExaminationID)
            REFERENCES dbo.Examinations(ExaminationID),

        CONSTRAINT FK_Results_Students
            FOREIGN KEY (StudentID)
            REFERENCES dbo.Students(StudentID),

        CONSTRAINT CK_Results_Marks
            CHECK (Marks BETWEEN 0 AND 100),

        CONSTRAINT CK_Results_Grade
            CHECK (Grade IN (N'A+', N'A', N'B', N'C', N'D', N'F')),

        CONSTRAINT UQ_Results_StudentExamination
            UNIQUE (StudentID, ExaminationID)
    );
END;
GO
