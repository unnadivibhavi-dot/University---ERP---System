# University ERP API Contract

## Student Management

GET /api/students
GET /api/students/:id
POST /api/students
PUT /api/students/:id
DELETE /api/students/:id

Student request body:

{
  "registrationNumber": "IT22001",
  "fullName": "Kamal Perera",
  "email": "kamal@example.com",
  "phone": "0771234567",
  "department": "Computing",
  "academicYear": 2
}

## Course Management

GET /api/courses
GET /api/courses/:id
POST /api/courses
PUT /api/courses/:id
DELETE /api/courses/:id

Course request body:

{
  "courseCode": "CS101",
  "courseName": "Programming Fundamentals",
  "credits": 3,
  "department": "Computing"
}

## Course Enrollment

GET /api/enrollments
GET /api/enrollments/:id
POST /api/enrollments
DELETE /api/enrollments/:id

Enrollment request body:

{
  "studentId": 1,
  "courseId": 1
}