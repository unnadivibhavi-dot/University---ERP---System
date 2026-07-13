SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

PRINT N'University ERP migration started.';
GO

IF DB_ID(N'UniversityERP') IS NULL
BEGIN
    PRINT N'Creating database [UniversityERP].';
    CREATE DATABASE [UniversityERP];
END
ELSE PRINT N'Database [UniversityERP] already exists.';
GO

USE [UniversityERP];
GO


IF OBJECT_ID(N'dbo.Users', N'U') IS NULL
BEGIN
    PRINT N'Creating [dbo].[Users].';
    CREATE TABLE dbo.Users
    (
        UserID INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Users PRIMARY KEY,
        Username NVARCHAR(100) NOT NULL CONSTRAINT UQ_Users_Username UNIQUE,
        PasswordHash NVARCHAR(255) NOT NULL,
        Role NVARCHAR(20) NOT NULL,
        CONSTRAINT CK_Users_Role CHECK (Role IN (N'Admin', N'Lecturer', N'Student'))
    );
END
ELSE PRINT N'Table [dbo].[Users] already exists.';
GO

IF OBJECT_ID(N'dbo.Students', N'U') IS NULL
BEGIN
    PRINT N'Creating [dbo].[Students].';
    CREATE TABLE dbo.Students
    (
        StudentID INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Students PRIMARY KEY,
        RegistrationNumber NVARCHAR(50) NOT NULL CONSTRAINT UQ_Students_RegistrationNumber UNIQUE,
        FullName NVARCHAR(150) NOT NULL,
        Email NVARCHAR(150) NOT NULL CONSTRAINT UQ_Students_Email UNIQUE,
        Phone NVARCHAR(20) NULL,
        Department NVARCHAR(100) NOT NULL,
        AcademicYear INT NOT NULL,
        CONSTRAINT CK_Students_AcademicYear CHECK (AcademicYear BETWEEN 1 AND 4)
    );
END
ELSE PRINT N'Table [dbo].[Students] already exists.';
GO

IF OBJECT_ID(N'dbo.Courses', N'U') IS NULL
BEGIN
    PRINT N'Creating [dbo].[Courses].';
    CREATE TABLE dbo.Courses
    (
        CourseID INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Courses PRIMARY KEY,
        CourseCode NVARCHAR(30) NOT NULL CONSTRAINT UQ_Courses_CourseCode UNIQUE,
        CourseName NVARCHAR(150) NOT NULL,
        Credits INT NOT NULL,
        Department NVARCHAR(100) NOT NULL,
        CONSTRAINT CK_Courses_Credits CHECK (Credits BETWEEN 1 AND 6)
    );
END
ELSE PRINT N'Table [dbo].[Courses] already exists.';
GO

IF OBJECT_ID(N'dbo.Enrollments', N'U') IS NULL
BEGIN
    PRINT N'Creating [dbo].[Enrollments].';
    CREATE TABLE dbo.Enrollments
    (
        EnrollmentID INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Enrollments PRIMARY KEY,
        StudentID INT NOT NULL,
        CourseID INT NOT NULL,
        EnrollmentDate DATE NOT NULL CONSTRAINT DF_Enrollments_EnrollmentDate DEFAULT CONVERT(DATE, GETDATE()),
        CONSTRAINT FK_Enrollments_Students FOREIGN KEY (StudentID) REFERENCES dbo.Students(StudentID),
        CONSTRAINT FK_Enrollments_Courses FOREIGN KEY (CourseID) REFERENCES dbo.Courses(CourseID),
        CONSTRAINT UQ_Enrollments_StudentCourse UNIQUE (StudentID, CourseID)
    );
END
ELSE PRINT N'Table [dbo].[Enrollments] already exists.';
GO

IF OBJECT_ID(N'dbo.Attendance', N'U') IS NULL
BEGIN
    PRINT N'Creating [dbo].[Attendance].';
    CREATE TABLE dbo.Attendance
    (
        AttendanceID INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Attendance PRIMARY KEY,
        StudentID INT NOT NULL,
        CourseID INT NOT NULL,
        AttendanceDate DATE NOT NULL,
        Status NVARCHAR(20) NOT NULL,
        CONSTRAINT FK_Attendance_Students FOREIGN KEY (StudentID) REFERENCES dbo.Students(StudentID),
        CONSTRAINT FK_Attendance_Courses FOREIGN KEY (CourseID) REFERENCES dbo.Courses(CourseID),
        CONSTRAINT CK_Attendance_Status CHECK (Status IN (N'Present', N'Absent', N'Late')),
        CONSTRAINT UQ_Attendance_StudentCourseDate UNIQUE (StudentID, CourseID, AttendanceDate)
    );
END
ELSE PRINT N'Table [dbo].[Attendance] already exists.';
GO

IF OBJECT_ID(N'dbo.Examinations', N'U') IS NULL
BEGIN
    PRINT N'Creating [dbo].[Examinations].';
    CREATE TABLE dbo.Examinations
    (
        ExaminationID INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Examinations PRIMARY KEY,
        CourseID INT NOT NULL,
        ExaminationName NVARCHAR(100) NOT NULL,
        ExaminationDate DATE NOT NULL,
        CONSTRAINT FK_Examinations_Courses FOREIGN KEY (CourseID) REFERENCES dbo.Courses(CourseID),
        CONSTRAINT UQ_Examinations_CourseNameDate UNIQUE (CourseID, ExaminationName, ExaminationDate)
    );
END
ELSE PRINT N'Table [dbo].[Examinations] already exists.';
GO

IF OBJECT_ID(N'dbo.Results', N'U') IS NULL
BEGIN
    PRINT N'Creating [dbo].[Results].';
    CREATE TABLE dbo.Results
    (
        ResultID INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Results PRIMARY KEY,
        ExaminationID INT NOT NULL,
        StudentID INT NOT NULL,
        Marks DECIMAL(5,2) NOT NULL,
        Grade NVARCHAR(5) NOT NULL,
        CONSTRAINT FK_Results_Examinations FOREIGN KEY (ExaminationID) REFERENCES dbo.Examinations(ExaminationID),
        CONSTRAINT FK_Results_Students FOREIGN KEY (StudentID) REFERENCES dbo.Students(StudentID),
        CONSTRAINT CK_Results_Marks CHECK (Marks BETWEEN 0 AND 100),
        CONSTRAINT CK_Results_Grade CHECK (Grade IN (N'A+', N'A', N'B', N'C', N'D', N'F')),
        CONSTRAINT UQ_Results_StudentExamination UNIQUE (StudentID, ExaminationID)
    );
END
ELSE PRINT N'Table [dbo].[Results] already exists.';
GO

IF OBJECT_ID(N'dbo.Lecturers', N'U') IS NULL
BEGIN
    PRINT N'Creating [dbo].[Lecturers].';
    CREATE TABLE dbo.Lecturers
    (
        LecturerID INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Lecturers PRIMARY KEY,
        UserID INT NOT NULL,
        EmployeeNumber NVARCHAR(50) NOT NULL CONSTRAINT UQ_Lecturers_EmployeeNumber UNIQUE,
        FullName NVARCHAR(150) NOT NULL,
        Email NVARCHAR(150) NOT NULL CONSTRAINT UQ_Lecturers_Email UNIQUE,
        Department NVARCHAR(100) NOT NULL,
        CONSTRAINT FK_Lecturers_Users FOREIGN KEY (UserID) REFERENCES dbo.Users(UserID)
    );
END
ELSE PRINT N'Table [dbo].[Lecturers] already exists.';
GO

IF OBJECT_ID(N'dbo.LecturerCourses', N'U') IS NULL
BEGIN
    PRINT N'Creating [dbo].[LecturerCourses].';
    CREATE TABLE dbo.LecturerCourses
    (
        LecturerCourseID INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_LecturerCourses PRIMARY KEY,
        LecturerID INT NOT NULL,
        CourseID INT NOT NULL,
        CONSTRAINT FK_LecturerCourses_Lecturers FOREIGN KEY (LecturerID) REFERENCES dbo.Lecturers(LecturerID),
        CONSTRAINT FK_LecturerCourses_Courses FOREIGN KEY (CourseID) REFERENCES dbo.Courses(CourseID),
        CONSTRAINT UQ_LecturerCourses_LecturerCourse UNIQUE (LecturerID, CourseID)
    );
END
ELSE PRINT N'Table [dbo].[LecturerCourses] already exists.';
GO


CREATE TABLE #ExpectedColumns
(
    ID INT IDENTITY(1,1) PRIMARY KEY,
    TableName SYSNAME NOT NULL,
    ColumnName SYSNAME NOT NULL,
    Definition NVARCHAR(500) NOT NULL,
    SafeOnPopulated BIT NOT NULL
);

INSERT #ExpectedColumns (TableName, ColumnName, Definition, SafeOnPopulated)
VALUES
(N'Users',N'UserID',N'INT IDENTITY(1,1) NOT NULL',0),(N'Users',N'Username',N'NVARCHAR(100) NOT NULL',0),(N'Users',N'PasswordHash',N'NVARCHAR(255) NOT NULL',0),(N'Users',N'Role',N'NVARCHAR(20) NOT NULL',0),
(N'Students',N'StudentID',N'INT IDENTITY(1,1) NOT NULL',0),(N'Students',N'RegistrationNumber',N'NVARCHAR(50) NOT NULL',0),(N'Students',N'FullName',N'NVARCHAR(150) NOT NULL',0),(N'Students',N'Email',N'NVARCHAR(150) NOT NULL',0),(N'Students',N'Phone',N'NVARCHAR(20) NULL',1),(N'Students',N'Department',N'NVARCHAR(100) NOT NULL',0),(N'Students',N'AcademicYear',N'INT NOT NULL',0),
(N'Courses',N'CourseID',N'INT IDENTITY(1,1) NOT NULL',0),(N'Courses',N'CourseCode',N'NVARCHAR(30) NOT NULL',0),(N'Courses',N'CourseName',N'NVARCHAR(150) NOT NULL',0),(N'Courses',N'Credits',N'INT NOT NULL',0),(N'Courses',N'Department',N'NVARCHAR(100) NOT NULL',0),
(N'Enrollments',N'EnrollmentID',N'INT IDENTITY(1,1) NOT NULL',0),(N'Enrollments',N'StudentID',N'INT NOT NULL',0),(N'Enrollments',N'CourseID',N'INT NOT NULL',0),(N'Enrollments',N'EnrollmentDate',N'DATE NOT NULL CONSTRAINT DF_Enrollments_EnrollmentDate DEFAULT CONVERT(DATE, GETDATE())',1),
(N'Attendance',N'AttendanceID',N'INT IDENTITY(1,1) NOT NULL',0),(N'Attendance',N'StudentID',N'INT NOT NULL',0),(N'Attendance',N'CourseID',N'INT NOT NULL',0),(N'Attendance',N'AttendanceDate',N'DATE NOT NULL',0),(N'Attendance',N'Status',N'NVARCHAR(20) NOT NULL',0),
(N'Examinations',N'ExaminationID',N'INT IDENTITY(1,1) NOT NULL',0),(N'Examinations',N'CourseID',N'INT NOT NULL',0),(N'Examinations',N'ExaminationName',N'NVARCHAR(100) NOT NULL',0),(N'Examinations',N'ExaminationDate',N'DATE NOT NULL',0),
(N'Results',N'ResultID',N'INT IDENTITY(1,1) NOT NULL',0),(N'Results',N'ExaminationID',N'INT NOT NULL',0),(N'Results',N'StudentID',N'INT NOT NULL',0),(N'Results',N'Marks',N'DECIMAL(5,2) NOT NULL',0),(N'Results',N'Grade',N'NVARCHAR(5) NOT NULL',0),
(N'Lecturers',N'LecturerID',N'INT IDENTITY(1,1) NOT NULL',0),(N'Lecturers',N'UserID',N'INT NOT NULL',0),(N'Lecturers',N'EmployeeNumber',N'NVARCHAR(50) NOT NULL',0),(N'Lecturers',N'FullName',N'NVARCHAR(150) NOT NULL',0),(N'Lecturers',N'Email',N'NVARCHAR(150) NOT NULL',0),(N'Lecturers',N'Department',N'NVARCHAR(100) NOT NULL',0),
(N'LecturerCourses',N'LecturerCourseID',N'INT IDENTITY(1,1) NOT NULL',0),(N'LecturerCourses',N'LecturerID',N'INT NOT NULL',0),(N'LecturerCourses',N'CourseID',N'INT NOT NULL',0);

DECLARE @T SYSNAME, @C SYSNAME, @D NVARCHAR(500), @Safe BIT, @HasRows BIT, @SQL NVARCHAR(MAX), @Unsafe INT = 0;
DECLARE column_cursor CURSOR LOCAL FAST_FORWARD FOR SELECT TableName, ColumnName, Definition, SafeOnPopulated FROM #ExpectedColumns ORDER BY ID;
OPEN column_cursor;
FETCH NEXT FROM column_cursor INTO @T,@C,@D,@Safe;
WHILE @@FETCH_STATUS = 0
BEGIN
    IF COL_LENGTH(N'dbo.' + @T, @C) IS NOT NULL
        PRINT N'Column [dbo].[' + @T + N'].[' + @C + N'] already exists.';
    ELSE
    BEGIN
        SET @HasRows = 0;
        SET @SQL = N'IF EXISTS (SELECT 1 FROM dbo.' + QUOTENAME(@T) + N') SET @Found = 1;';
        EXEC sys.sp_executesql @SQL, N'@Found BIT OUTPUT', @Found=@HasRows OUTPUT;
        IF @HasRows = 0 OR @Safe = 1
        BEGIN
            PRINT N'Adding [dbo].[' + @T + N'].[' + @C + N'].';
            SET @SQL = N'ALTER TABLE dbo.' + QUOTENAME(@T) + N' ADD ' + QUOTENAME(@C) + N' ' + @D + N';';
            EXEC sys.sp_executesql @SQL;
        END
        ELSE
        BEGIN
            SET @Unsafe += 1;
            PRINT N'Cannot safely add required column [dbo].[' + @T + N'].[' + @C + N'] to a populated table without inventing data.';
        END;
    END;
    FETCH NEXT FROM column_cursor INTO @T,@C,@D,@Safe;
END;
CLOSE column_cursor;
DEALLOCATE column_cursor;
DROP TABLE #ExpectedColumns;
IF @Unsafe > 0 THROW 50001, N'Manual backfill is required for missing NOT NULL columns.', 1;
GO


DECLARE @PK TABLE (TableName SYSNAME, ColumnName SYSNAME, ConstraintName SYSNAME);
INSERT @PK VALUES
(N'Users',N'UserID',N'PK_Users'),(N'Students',N'StudentID',N'PK_Students'),(N'Courses',N'CourseID',N'PK_Courses'),
(N'Enrollments',N'EnrollmentID',N'PK_Enrollments'),(N'Attendance',N'AttendanceID',N'PK_Attendance'),
(N'Examinations',N'ExaminationID',N'PK_Examinations'),(N'Results',N'ResultID',N'PK_Results'),
(N'Lecturers',N'LecturerID',N'PK_Lecturers'),(N'LecturerCourses',N'LecturerCourseID',N'PK_LecturerCourses');
DECLARE @PKT SYSNAME,@PKC SYSNAME,@PKN SYSNAME,@PKSQL NVARCHAR(MAX);
DECLARE pk_cursor CURSOR LOCAL FAST_FORWARD FOR SELECT TableName,ColumnName,ConstraintName FROM @PK;
OPEN pk_cursor; FETCH NEXT FROM pk_cursor INTO @PKT,@PKC,@PKN;
WHILE @@FETCH_STATUS=0
BEGIN
    IF NOT EXISTS (SELECT 1 FROM sys.key_constraints WHERE parent_object_id=OBJECT_ID(N'dbo.'+@PKT) AND type=N'PK')
    BEGIN
        PRINT N'Adding primary key ['+@PKN+N'] on [dbo].['+@PKT+N'].';
        SET @PKSQL=N'ALTER TABLE dbo.'+QUOTENAME(@PKT)+N' ADD CONSTRAINT '+QUOTENAME(@PKN)+N' PRIMARY KEY ('+QUOTENAME(@PKC)+N');';
        EXEC sys.sp_executesql @PKSQL;
    END ELSE PRINT N'Primary key for [dbo].['+@PKT+N'] already exists.';
    FETCH NEXT FROM pk_cursor INTO @PKT,@PKC,@PKN;
END
CLOSE pk_cursor; DEALLOCATE pk_cursor;
GO


DECLARE @FK TABLE (ChildTable SYSNAME,ChildColumn SYSNAME,ParentTable SYSNAME,ParentColumn SYSNAME,ConstraintName SYSNAME);
INSERT @FK VALUES
(N'Enrollments',N'StudentID',N'Students',N'StudentID',N'FK_Enrollments_Students'),
(N'Enrollments',N'CourseID',N'Courses',N'CourseID',N'FK_Enrollments_Courses'),
(N'Attendance',N'StudentID',N'Students',N'StudentID',N'FK_Attendance_Students'),
(N'Attendance',N'CourseID',N'Courses',N'CourseID',N'FK_Attendance_Courses'),
(N'Examinations',N'CourseID',N'Courses',N'CourseID',N'FK_Examinations_Courses'),
(N'Results',N'ExaminationID',N'Examinations',N'ExaminationID',N'FK_Results_Examinations'),
(N'Results',N'StudentID',N'Students',N'StudentID',N'FK_Results_Students'),
(N'Lecturers',N'UserID',N'Users',N'UserID',N'FK_Lecturers_Users'),
(N'LecturerCourses',N'LecturerID',N'Lecturers',N'LecturerID',N'FK_LecturerCourses_Lecturers'),
(N'LecturerCourses',N'CourseID',N'Courses',N'CourseID',N'FK_LecturerCourses_Courses');
DECLARE @CT SYSNAME,@CC SYSNAME,@PT SYSNAME,@PC SYSNAME,@FN SYSNAME,@Orphan BIT,@FSQL NVARCHAR(MAX);
DECLARE fk_cursor CURSOR LOCAL FAST_FORWARD FOR SELECT ChildTable,ChildColumn,ParentTable,ParentColumn,ConstraintName FROM @FK;
OPEN fk_cursor; FETCH NEXT FROM fk_cursor INTO @CT,@CC,@PT,@PC,@FN;
WHILE @@FETCH_STATUS=0
BEGIN
    IF NOT EXISTS
    (
        SELECT 1 FROM sys.foreign_key_columns f
        WHERE f.parent_object_id=OBJECT_ID(N'dbo.'+@CT) AND COL_NAME(f.parent_object_id,f.parent_column_id)=@CC
          AND f.referenced_object_id=OBJECT_ID(N'dbo.'+@PT) AND COL_NAME(f.referenced_object_id,f.referenced_column_id)=@PC
    )
    BEGIN
        SET @Orphan=0;
        SET @FSQL=N'IF EXISTS (SELECT 1 FROM dbo.'+QUOTENAME(@CT)+N' c LEFT JOIN dbo.'+QUOTENAME(@PT)+N' p ON p.'+QUOTENAME(@PC)+N'=c.'+QUOTENAME(@CC)+N' WHERE p.'+QUOTENAME(@PC)+N' IS NULL) SET @Found=1;';
        EXEC sys.sp_executesql @FSQL,N'@Found BIT OUTPUT',@Found=@Orphan OUTPUT;
        IF @Orphan=1 THROW 50002,N'Cannot add a foreign key because orphaned records exist.',1;
        PRINT N'Adding foreign key ['+@FN+N'].';
        SET @FSQL=N'ALTER TABLE dbo.'+QUOTENAME(@CT)+N' WITH CHECK ADD CONSTRAINT '+QUOTENAME(@FN)+N' FOREIGN KEY ('+QUOTENAME(@CC)+N') REFERENCES dbo.'+QUOTENAME(@PT)+N'('+QUOTENAME(@PC)+N');';
        EXEC sys.sp_executesql @FSQL;
    END ELSE PRINT N'Foreign key ['+@FN+N'] relationship already exists.';
    FETCH NEXT FROM fk_cursor INTO @CT,@CC,@PT,@PC,@FN;
END
CLOSE fk_cursor; DEALLOCATE fk_cursor;
GO


IF OBJECT_ID(N'dbo.CK_Users_Role',N'C') IS NULL
BEGIN
    IF EXISTS(SELECT 1 FROM dbo.Users WHERE Role NOT IN(N'Admin',N'Lecturer',N'Student')) THROW 50003,N'Invalid Users.Role values prevent CK_Users_Role.',1;
    PRINT N'Adding [CK_Users_Role].'; ALTER TABLE dbo.Users WITH CHECK ADD CONSTRAINT CK_Users_Role CHECK(Role IN(N'Admin',N'Lecturer',N'Student'));
END ELSE PRINT N'[CK_Users_Role] already exists.';
GO
IF OBJECT_ID(N'dbo.CK_Students_AcademicYear',N'C') IS NULL
BEGIN
    IF EXISTS(SELECT 1 FROM dbo.Students WHERE AcademicYear NOT BETWEEN 1 AND 4) THROW 50004,N'Invalid AcademicYear values prevent CK_Students_AcademicYear.',1;
    PRINT N'Adding [CK_Students_AcademicYear].'; ALTER TABLE dbo.Students WITH CHECK ADD CONSTRAINT CK_Students_AcademicYear CHECK(AcademicYear BETWEEN 1 AND 4);
END ELSE PRINT N'[CK_Students_AcademicYear] already exists.';
GO
IF OBJECT_ID(N'dbo.CK_Courses_Credits',N'C') IS NULL
BEGIN
    IF EXISTS(SELECT 1 FROM dbo.Courses WHERE Credits NOT BETWEEN 1 AND 6) THROW 50005,N'Invalid Credits values prevent CK_Courses_Credits.',1;
    PRINT N'Adding [CK_Courses_Credits].'; ALTER TABLE dbo.Courses WITH CHECK ADD CONSTRAINT CK_Courses_Credits CHECK(Credits BETWEEN 1 AND 6);
END ELSE PRINT N'[CK_Courses_Credits] already exists.';
GO
IF OBJECT_ID(N'dbo.CK_Attendance_Status',N'C') IS NULL
BEGIN
    IF EXISTS(SELECT 1 FROM dbo.Attendance WHERE Status NOT IN(N'Present',N'Absent',N'Late')) THROW 50006,N'Invalid Status values prevent CK_Attendance_Status.',1;
    PRINT N'Adding [CK_Attendance_Status].'; ALTER TABLE dbo.Attendance WITH CHECK ADD CONSTRAINT CK_Attendance_Status CHECK(Status IN(N'Present',N'Absent',N'Late'));
END ELSE PRINT N'[CK_Attendance_Status] already exists.';
GO
IF OBJECT_ID(N'dbo.CK_Results_Marks',N'C') IS NULL
BEGIN
    IF EXISTS(SELECT 1 FROM dbo.Results WHERE Marks NOT BETWEEN 0 AND 100) THROW 50007,N'Invalid Marks values prevent CK_Results_Marks.',1;
    PRINT N'Adding [CK_Results_Marks].'; ALTER TABLE dbo.Results WITH CHECK ADD CONSTRAINT CK_Results_Marks CHECK(Marks BETWEEN 0 AND 100);
END ELSE PRINT N'[CK_Results_Marks] already exists.';
GO
IF OBJECT_ID(N'dbo.CK_Results_Grade',N'C') IS NULL
BEGIN
    IF EXISTS(SELECT 1 FROM dbo.Results WHERE Grade NOT IN(N'A+',N'A',N'B',N'C',N'D',N'F')) THROW 50008,N'Invalid Grade values prevent CK_Results_Grade.',1;
    PRINT N'Adding [CK_Results_Grade].'; ALTER TABLE dbo.Results WITH CHECK ADD CONSTRAINT CK_Results_Grade CHECK(Grade IN(N'A+',N'A',N'B',N'C',N'D',N'F'));
END ELSE PRINT N'[CK_Results_Grade] already exists.';
GO


DECLARE @UQ TABLE (TableName SYSNAME,ColumnName SYSNAME,ConstraintName SYSNAME);
INSERT @UQ VALUES
(N'Users',N'Username',N'UQ_Users_Username'),
(N'Students',N'RegistrationNumber',N'UQ_Students_RegistrationNumber'),
(N'Students',N'Email',N'UQ_Students_Email'),
(N'Courses',N'CourseCode',N'UQ_Courses_CourseCode'),
(N'Lecturers',N'EmployeeNumber',N'UQ_Lecturers_EmployeeNumber'),
(N'Lecturers',N'Email',N'UQ_Lecturers_Email');
DECLARE @UT SYSNAME,@UC SYSNAME,@UN SYSNAME,@Dup BIT,@USQL NVARCHAR(MAX);
DECLARE uq_cursor CURSOR LOCAL FAST_FORWARD FOR SELECT TableName,ColumnName,ConstraintName FROM @UQ;
OPEN uq_cursor; FETCH NEXT FROM uq_cursor INTO @UT,@UC,@UN;
WHILE @@FETCH_STATUS=0
BEGIN
    IF NOT EXISTS
    (
        SELECT 1 FROM sys.indexes i
        WHERE i.object_id=OBJECT_ID(N'dbo.'+@UT) AND i.is_unique=1
          AND INDEX_COL(N'dbo.'+@UT,i.index_id,1)=@UC
          AND INDEX_COL(N'dbo.'+@UT,i.index_id,2) IS NULL
    )
    BEGIN
        SET @Dup=0;
        SET @USQL=N'IF EXISTS (SELECT '+QUOTENAME(@UC)+N' FROM dbo.'+QUOTENAME(@UT)+N' GROUP BY '+QUOTENAME(@UC)+N' HAVING COUNT(*)>1) SET @Found=1;';
        EXEC sys.sp_executesql @USQL,N'@Found BIT OUTPUT',@Found=@Dup OUTPUT;
        IF @Dup=1 THROW 50014,N'Cannot add a single-column unique constraint because duplicate values exist.',1;
        PRINT N'Adding unique constraint ['+@UN+N'].';
        SET @USQL=N'ALTER TABLE dbo.'+QUOTENAME(@UT)+N' ADD CONSTRAINT '+QUOTENAME(@UN)+N' UNIQUE ('+QUOTENAME(@UC)+N');';
        EXEC sys.sp_executesql @USQL;
    END ELSE PRINT N'Unique rule ['+@UN+N'] already exists.';
    FETCH NEXT FROM uq_cursor INTO @UT,@UC,@UN;
END
CLOSE uq_cursor; DEALLOCATE uq_cursor;
GO


IF NOT EXISTS(SELECT 1 FROM sys.indexes i WHERE i.object_id=OBJECT_ID(N'dbo.Enrollments') AND i.is_unique=1 AND INDEX_COL(N'dbo.Enrollments',i.index_id,1)=N'StudentID' AND INDEX_COL(N'dbo.Enrollments',i.index_id,2)=N'CourseID' AND INDEX_COL(N'dbo.Enrollments',i.index_id,3) IS NULL)
BEGIN
    IF EXISTS(SELECT StudentID,CourseID FROM dbo.Enrollments GROUP BY StudentID,CourseID HAVING COUNT(*)>1) THROW 50009,N'Duplicate enrollments prevent UQ_Enrollments_StudentCourse.',1;
    PRINT N'Adding [UQ_Enrollments_StudentCourse].'; ALTER TABLE dbo.Enrollments ADD CONSTRAINT UQ_Enrollments_StudentCourse UNIQUE(StudentID,CourseID);
END ELSE PRINT N'Enrollment unique rule already exists.';
GO
IF NOT EXISTS(SELECT 1 FROM sys.indexes i WHERE i.object_id=OBJECT_ID(N'dbo.Attendance') AND i.is_unique=1 AND INDEX_COL(N'dbo.Attendance',i.index_id,1)=N'StudentID' AND INDEX_COL(N'dbo.Attendance',i.index_id,2)=N'CourseID' AND INDEX_COL(N'dbo.Attendance',i.index_id,3)=N'AttendanceDate' AND INDEX_COL(N'dbo.Attendance',i.index_id,4) IS NULL)
BEGIN
    IF EXISTS(SELECT StudentID,CourseID,AttendanceDate FROM dbo.Attendance GROUP BY StudentID,CourseID,AttendanceDate HAVING COUNT(*)>1) THROW 50010,N'Duplicate attendance prevents UQ_Attendance_StudentCourseDate.',1;
    PRINT N'Adding [UQ_Attendance_StudentCourseDate].'; ALTER TABLE dbo.Attendance ADD CONSTRAINT UQ_Attendance_StudentCourseDate UNIQUE(StudentID,CourseID,AttendanceDate);
END ELSE PRINT N'Attendance unique rule already exists.';
GO
IF NOT EXISTS(SELECT 1 FROM sys.indexes i WHERE i.object_id=OBJECT_ID(N'dbo.Examinations') AND i.is_unique=1 AND INDEX_COL(N'dbo.Examinations',i.index_id,1)=N'CourseID' AND INDEX_COL(N'dbo.Examinations',i.index_id,2)=N'ExaminationName' AND INDEX_COL(N'dbo.Examinations',i.index_id,3)=N'ExaminationDate' AND INDEX_COL(N'dbo.Examinations',i.index_id,4) IS NULL)
BEGIN
    IF EXISTS(SELECT CourseID,ExaminationName,ExaminationDate FROM dbo.Examinations GROUP BY CourseID,ExaminationName,ExaminationDate HAVING COUNT(*)>1) THROW 50011,N'Duplicate examinations prevent UQ_Examinations_CourseNameDate.',1;
    PRINT N'Adding [UQ_Examinations_CourseNameDate].'; ALTER TABLE dbo.Examinations ADD CONSTRAINT UQ_Examinations_CourseNameDate UNIQUE(CourseID,ExaminationName,ExaminationDate);
END ELSE PRINT N'Examination unique rule already exists.';
GO
IF NOT EXISTS(SELECT 1 FROM sys.indexes i WHERE i.object_id=OBJECT_ID(N'dbo.Results') AND i.is_unique=1 AND INDEX_COL(N'dbo.Results',i.index_id,1)=N'StudentID' AND INDEX_COL(N'dbo.Results',i.index_id,2)=N'ExaminationID' AND INDEX_COL(N'dbo.Results',i.index_id,3) IS NULL)
BEGIN
    IF EXISTS(SELECT StudentID,ExaminationID FROM dbo.Results GROUP BY StudentID,ExaminationID HAVING COUNT(*)>1) THROW 50012,N'Duplicate results prevent UQ_Results_StudentExamination.',1;
    PRINT N'Adding [UQ_Results_StudentExamination].'; ALTER TABLE dbo.Results ADD CONSTRAINT UQ_Results_StudentExamination UNIQUE(StudentID,ExaminationID);
END ELSE PRINT N'Result unique rule already exists.';
GO
IF NOT EXISTS(SELECT 1 FROM sys.indexes i WHERE i.object_id=OBJECT_ID(N'dbo.LecturerCourses') AND i.is_unique=1 AND INDEX_COL(N'dbo.LecturerCourses',i.index_id,1)=N'LecturerID' AND INDEX_COL(N'dbo.LecturerCourses',i.index_id,2)=N'CourseID' AND INDEX_COL(N'dbo.LecturerCourses',i.index_id,3) IS NULL)
BEGIN
    IF EXISTS(SELECT LecturerID,CourseID FROM dbo.LecturerCourses GROUP BY LecturerID,CourseID HAVING COUNT(*)>1) THROW 50013,N'Duplicate lecturer assignments prevent UQ_LecturerCourses_LecturerCourse.',1;
    PRINT N'Adding [UQ_LecturerCourses_LecturerCourse].'; ALTER TABLE dbo.LecturerCourses ADD CONSTRAINT UQ_LecturerCourses_LecturerCourse UNIQUE(LecturerID,CourseID);
END ELSE PRINT N'Lecturer-course unique rule already exists.';
GO


IF NOT EXISTS(SELECT 1 FROM sys.default_constraints dc JOIN sys.columns c ON c.object_id=dc.parent_object_id AND c.column_id=dc.parent_column_id WHERE dc.parent_object_id=OBJECT_ID(N'dbo.Enrollments') AND c.name=N'EnrollmentDate')
BEGIN
    PRINT N'Adding default for [dbo].[Enrollments].[EnrollmentDate].';
    ALTER TABLE dbo.Enrollments ADD CONSTRAINT DF_Enrollments_EnrollmentDate DEFAULT CONVERT(DATE,GETDATE()) FOR EnrollmentDate;
END ELSE PRINT N'EnrollmentDate default already exists.';
GO

IF COL_LENGTH('dbo.Students', 'UserID') IS NULL
BEGIN
    PRINT N'Adding [dbo].[Students].[UserID].';
    ALTER TABLE dbo.Students ADD UserID INT NULL;
END ELSE PRINT N'[dbo].[Students].[UserID] already exists.';
GO

UPDATE dbo.Students
SET UserID = (SELECT UserID FROM dbo.Users WHERE Username = N'student.2026001')
WHERE RegistrationNumber = N'UNI-2026-001'
  AND UserID IS NULL;

UPDATE dbo.Students
SET UserID = (SELECT UserID FROM dbo.Users WHERE Username = N'student.2026002')
WHERE RegistrationNumber = N'UNI-2026-002'
  AND UserID IS NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = N'UQ_Students_UserID' AND object_id = OBJECT_ID(N'dbo.Students'))
BEGIN
    PRINT N'Adding [UQ_Students_UserID].';
    ALTER TABLE dbo.Students ADD CONSTRAINT UQ_Students_UserID UNIQUE(UserID);
END ELSE PRINT N'[UQ_Students_UserID] already exists.';
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = N'FK_Students_Users')
BEGIN
    PRINT N'Adding [FK_Students_Users].';
    ALTER TABLE dbo.Students ADD CONSTRAINT FK_Students_Users FOREIGN KEY(UserID) REFERENCES dbo.Users(UserID);
END ELSE PRINT N'[FK_Students_Users] already exists.';
PRINT N'University ERP migration completed successfully.';
GO
