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