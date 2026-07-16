"use strict";

/*
 * University ERP - Lecturer Module Configuration
 *
 * USE_MOCK_DATA = true
 * The Lecturer module uses local mock data and localStorage.
 *
 * USE_MOCK_DATA = false
 * The Lecturer module sends requests to the real backend API.
 */

const LECTURER_CONFIG = Object.freeze({
    USE_MOCK_DATA: true,

    API_BASE_URL: "https://university-erp-api-eduportal.azurewebsites.net/api",

    STORAGE_KEYS: Object.freeze({
        AUTH_TOKEN: "universityErpAuthToken",
        CURRENT_USER: "universityErpCurrentUser",
        LECTURER_PROFILE: "universityErpLecturerProfile",
        LECTURER_COURSES: "universityErpLecturerCourses",
        COURSE_STUDENTS: "universityErpCourseStudents",
        ATTENDANCE: "universityErpLecturerAttendance",
        EXAMINATIONS: "universityErpLecturerExaminations",
        RESULTS: "universityErpLecturerResults"
    }),

    PAGES: Object.freeze({
        LOGIN: "login.html",
        DASHBOARD: "lecturer-dashboard.html",
        COURSES: "lecturer-courses.html",
        STUDENTS: "lecturer-students.html",
        ATTENDANCE: "lecturer-attendance.html",
        EXAMINATIONS: "lecturer-examinations.html",
        RESULTS: "lecturer-results.html"
    }),

    API_ROUTES: Object.freeze({
        LECTURER_COURSES: "/lecturer/courses",

        courseStudents(courseId) {
            return `/lecturer/courses/${encodeURIComponent(
                courseId
            )}/students`;
        },

        LECTURER_ATTENDANCE: "/lecturer/attendance",
        LECTURER_EXAMINATIONS: "/lecturer/examinations",
        LECTURER_RESULTS: "/lecturer/results",

        lecturerResultById(resultId) {
            return `/lecturer/results/${encodeURIComponent(
                resultId
            )}`;
        }
    }),

    ATTENDANCE_STATUSES: Object.freeze([
        "Present",
        "Absent",
        "Late"
    ]),

    GRADE_BOUNDARIES: Object.freeze([
        {
            minimumPercentage: 85,
            grade: "A+"
        },
        {
            minimumPercentage: 75,
            grade: "A"
        },
        {
            minimumPercentage: 65,
            grade: "B"
        },
        {
            minimumPercentage: 55,
            grade: "C"
        },
        {
            minimumPercentage: 45,
            grade: "D"
        },
        {
            minimumPercentage: 0,
            grade: "F"
        }
    ])
});
