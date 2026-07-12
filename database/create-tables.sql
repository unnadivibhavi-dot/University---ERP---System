USE UniversityERP;
GO

CREATE TABLE Users (
    UserID INT IDENTITY(1,1) PRIMARY KEY,
    Username NVARCHAR(100) NOT NULL UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL,
    Role NVARCHAR(20) NOT NULL,

    CONSTRAINT CK_Users_Role
        CHECK (Role IN ('Admin', 'Lecturer', 'Student'))
);
GO

CREATE TABLE Students (
    StudentID INT IDENTITY(1,1) PRIMARY KEY,
    RegistrationNumber NVARCHAR(50) NOT NULL UNIQUE,
    FullName NVARCHAR(150) NOT NULL,
    Email NVARCHAR(150) NOT NULL UNIQUE,
    Phone NVARCHAR(20) NULL,
    Department NVARCHAR(100) NOT NULL,
    AcademicYear INT NOT NULL,

    CONSTRAINT CK_Students_AcademicYear
        CHECK (AcademicYear BETWEEN 1 AND 4)
);
GO

CREATE TABLE Courses (
    CourseID INT IDENTITY(1,1) PRIMARY KEY,
    CourseCode NVARCHAR(30) NOT NULL UNIQUE,
    CourseName NVARCHAR(150) NOT NULL,
    Credits INT NOT NULL,
    Department NVARCHAR(100) NOT NULL,

    CONSTRAINT CK_Courses_Credits
        CHECK (Credits BETWEEN 1 AND 6)
);
GO

CREATE TABLE Enrollments (
    EnrollmentID INT IDENTITY(1,1) PRIMARY KEY,
    StudentID INT NOT NULL,
    CourseID INT NOT NULL,
    EnrollmentDate DATE NOT NULL
        CONSTRAINT DF_Enrollments_EnrollmentDate DEFAULT CAST(GETDATE() AS DATE),

    CONSTRAINT FK_Enrollments_Students
        FOREIGN KEY (StudentID)
        REFERENCES Students(StudentID),

    CONSTRAINT FK_Enrollments_Courses
        FOREIGN KEY (CourseID)
        REFERENCES Courses(CourseID),

    CONSTRAINT UQ_Enrollments_StudentCourse
        UNIQUE (StudentID, CourseID)
);
GO

CREATE TABLE Attendance (
    AttendanceID INT IDENTITY(1,1) PRIMARY KEY,
    StudentID INT NOT NULL,
    CourseID INT NOT NULL,
    AttendanceDate DATE NOT NULL,
    Status NVARCHAR(20) NOT NULL,

    CONSTRAINT FK_Attendance_Students
        FOREIGN KEY (StudentID)
        REFERENCES Students(StudentID),

    CONSTRAINT FK_Attendance_Courses
        FOREIGN KEY (CourseID)
        REFERENCES Courses(CourseID),

    CONSTRAINT CK_Attendance_Status
        CHECK (Status IN ('Present', 'Absent', 'Late')),

    CONSTRAINT UQ_Attendance_StudentCourseDate
        UNIQUE (StudentID, CourseID, AttendanceDate)
);
GO

CREATE TABLE Examinations (
    ExaminationID INT IDENTITY(1,1) PRIMARY KEY,
    CourseID INT NOT NULL,
    ExaminationName NVARCHAR(100) NOT NULL,
    ExaminationDate DATE NOT NULL,

    CONSTRAINT FK_Examinations_Courses
        FOREIGN KEY (CourseID)
        REFERENCES Courses(CourseID)
);
GO

CREATE TABLE Results (
    ResultID INT IDENTITY(1,1) PRIMARY KEY,
    ExaminationID INT NOT NULL,
    StudentID INT NOT NULL,
    Marks DECIMAL(5,2) NOT NULL,
    Grade NVARCHAR(5) NOT NULL,

    CONSTRAINT FK_Results_Examinations
        FOREIGN KEY (ExaminationID)
        REFERENCES Examinations(ExaminationID),

    CONSTRAINT FK_Results_Students
        FOREIGN KEY (StudentID)
        REFERENCES Students(StudentID),

    CONSTRAINT CK_Results_Marks
        CHECK (Marks BETWEEN 0 AND 100),

    CONSTRAINT UQ_Results_StudentExamination
        UNIQUE (StudentID, ExaminationID)
);
GO