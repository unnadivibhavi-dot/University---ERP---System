# University ERP Database Tables

## 1. Users
Stores system login and role information.

## 2. Students
Stores student personal and academic information.

## 3. Courses
Stores university course information.

## 4. Enrollments
Connects students with registered courses.

## 5. Attendance
Stores student attendance records for courses.

## 6. Examinations
Stores examinations related to courses.

## 7. Results
Stores student marks and grades for examinations.

# University ERP Database Structure

## 1. Users

Columns:

- UserID
- Username
- PasswordHash
- Role

Purpose:
Stores login credentials and user roles.

---

## 2. Students

Columns:

- StudentID
- RegistrationNumber
- FullName
- Email
- Phone
- Department
- AcademicYear

Purpose:
Stores student personal and academic information.

---

## 3. Courses

Columns:

- CourseID
- CourseCode
- CourseName
- Credits
- Department

Purpose:
Stores university course information.

---

## 4. Enrollments

Columns:

- EnrollmentID
- StudentID
- CourseID
- EnrollmentDate

Purpose:
Stores student course registrations.

---

## 5. Attendance

Columns:

- AttendanceID
- StudentID
- CourseID
- AttendanceDate
- Status

Purpose:
Stores attendance records for students and courses.

---

## 6. Examinations

Columns:

- ExaminationID
- CourseID
- ExaminationName
- ExaminationDate

Purpose:
Stores examination information related to courses.

---

## 7. Results

Columns:

- ResultID
- ExaminationID
- StudentID
- Marks
- Grade

Purpose:
Stores student marks and grades.

# Primary Keys

## Users
Primary Key: UserID

## Students
Primary Key: StudentID

## Courses
Primary Key: CourseID

## Enrollments
Primary Key: EnrollmentID

## Attendance
Primary Key: AttendanceID

## Examinations
Primary Key: ExaminationID

## Results
Primary Key: ResultID

# Foreign Keys

## Enrollments

- StudentID references Students.StudentID
- CourseID references Courses.CourseID

## Attendance

- StudentID references Students.StudentID
- CourseID references Courses.CourseID

## Examinations

- CourseID references Courses.CourseID

## Results

- StudentID references Students.StudentID
- ExaminationID references Examinations.ExaminationID

# Database Constraints

## Users
- Username: NOT NULL, UNIQUE
- PasswordHash: NOT NULL
- Role: NOT NULL
- Role must be Admin, Lecturer, or Student

## Students
- RegistrationNumber: NOT NULL, UNIQUE
- FullName: NOT NULL
- Email: NOT NULL, UNIQUE
- Department: NOT NULL
- AcademicYear: NOT NULL
- AcademicYear must be between 1 and 4

## Courses
- CourseCode: NOT NULL, UNIQUE
- CourseName: NOT NULL
- Credits: NOT NULL
- Credits must be between 1 and 6
- Department: NOT NULL

## Enrollments
- StudentID: NOT NULL, FOREIGN KEY
- CourseID: NOT NULL, FOREIGN KEY
- EnrollmentDate: NOT NULL, DEFAULT GETDATE()
- StudentID and CourseID combination must be unique

## Attendance
- StudentID: NOT NULL, FOREIGN KEY
- CourseID: NOT NULL, FOREIGN KEY
- AttendanceDate: NOT NULL
- Status: NOT NULL
- Status must be Present, Absent, or Late
- StudentID, CourseID, and AttendanceDate combination must be unique

## Examinations
- CourseID: NOT NULL, FOREIGN KEY
- ExaminationName: NOT NULL
- ExaminationDate: NOT NULL

## Results
- ExaminationID: NOT NULL, FOREIGN KEY
- StudentID: NOT NULL, FOREIGN KEY
- Marks: NOT NULL
- Marks must be between 0 and 100
- Grade: NOT NULL
- StudentID and ExaminationID combination must be unique

