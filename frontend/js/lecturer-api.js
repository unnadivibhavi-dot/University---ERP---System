"use strict";

/*
 * University ERP - Lecturer API Service
 *
 * This file connects Lecturer frontend pages to the backend API.
 * It also normalizes backend SQL field names into frontend field names.
 */

const LecturerAPI = (() => {
    function getApiBaseUrl() {
        if (
            typeof LECTURER_CONFIG !== "undefined" &&
            LECTURER_CONFIG.API_BASE_URL
        ) {
            return LECTURER_CONFIG.API_BASE_URL;
        }

        return "http://localhost:5001/api";
    }

    function getToken() {
        return (
            localStorage.getItem("token") ||
            localStorage.getItem("authToken") ||
            localStorage.getItem("universityErpAuthToken")
        );
    }

    function buildUrl(endpoint) {
        const cleanEndpoint = endpoint.startsWith("/")
            ? endpoint
            : `/${endpoint}`;

        return `${getApiBaseUrl()}${cleanEndpoint}`;
    }

    async function readResponse(response) {
        const text = await response.text();

        if (!text) {
            return {};
        }

        try {
            return JSON.parse(text);
        } catch (error) {
            return {
                message: text
            };
        }
    }

    async function request(endpoint, options = {}) {
        const token = getToken();

        if (!token) {
            throw new Error(
                "Authentication token is missing. Please login again."
            );
        }

        const headers = new Headers(options.headers || {});

        headers.set("Authorization", `Bearer ${token}`);

        if (
            options.body &&
            !(options.body instanceof FormData) &&
            !headers.has("Content-Type")
        ) {
            headers.set("Content-Type", "application/json");
        }

        let response;

        try {
            response = await fetch(buildUrl(endpoint), {
                ...options,
                headers
            });
        } catch (error) {
            throw new Error(
                "Unable to connect to the backend server. Make sure it is running on port 5001."
            );
        }

        const data = await readResponse(response);

        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem("token");
            localStorage.removeItem("authToken");
            localStorage.removeItem("user");
            localStorage.removeItem("loggedUser");
            localStorage.removeItem("isLoggedIn");

            window.location.href = "login.html";

            throw new Error(
                data.message ||
                "Your session expired. Please login again."
            );
        }

        if (!response.ok) {
            throw new Error(
                data.message ||
                data.error ||
                `Request failed with status ${response.status}.`
            );
        }

        return data;
    }

    function pick(object, ...keys) {
        for (const key of keys) {
            if (
                object &&
                object[key] !== undefined &&
                object[key] !== null
            ) {
                return object[key];
            }
        }

        return undefined;
    }

    function extractArray(response, propertyName) {
        if (Array.isArray(response)) {
            return response;
        }

        if (
            response &&
            Array.isArray(response[propertyName])
        ) {
            return response[propertyName];
        }

        if (
            response &&
            response.data &&
            Array.isArray(response.data[propertyName])
        ) {
            return response.data[propertyName];
        }

        if (
            response &&
            Array.isArray(response.data)
        ) {
            return response.data;
        }

        return [];
    }

    function extractObject(response, propertyName) {
        if (
            response &&
            response.data &&
            typeof response.data === "object" &&
            !Array.isArray(response.data)
        ) {
            return response.data;
        }

        if (
            response &&
            response[propertyName] &&
            typeof response[propertyName] === "object"
        ) {
            return response[propertyName];
        }

        return response || {};
    }

    function normalizeLecturer(lecturer) {
        return {
            lecturerId: pick(
                lecturer,
                "lecturerId",
                "LecturerID"
            ),
            userId: pick(
                lecturer,
                "userId",
                "UserID"
            ),
            employeeNumber: pick(
                lecturer,
                "employeeNumber",
                "EmployeeNumber"
            ),
            fullName: pick(
                lecturer,
                "fullName",
                "FullName",
                "name",
                "Name"
            ),
            email: pick(
                lecturer,
                "email",
                "Email"
            ),
            department: pick(
                lecturer,
                "department",
                "Department"
            )
        };
    }

    function normalizeCourse(course) {
        return {
            courseId: pick(
                course,
                "courseId",
                "CourseID",
                "id"
            ),
            courseCode: pick(
                course,
                "courseCode",
                "CourseCode"
            ),
            courseName: pick(
                course,
                "courseName",
                "CourseName"
            ),
            credits: pick(
                course,
                "credits",
                "Credits"
            ),
            department: pick(
                course,
                "department",
                "Department"
            ),
            studentCount: pick(
                course,
                "studentCount",
                "StudentCount",
                "EnrolledStudents",
                "TotalStudents"
            )
        };
    }

    function normalizeStudent(student) {
        return {
            studentId: pick(
                student,
                "studentId",
                "StudentID",
                "id"
            ),
            registrationNumber: pick(
                student,
                "registrationNumber",
                "RegistrationNumber"
            ),
            fullName: pick(
                student,
                "fullName",
                "FullName",
                "name",
                "Name"
            ),
            email: pick(
                student,
                "email",
                "Email"
            ),
            phone: pick(
                student,
                "phone",
                "Phone"
            ),
            department: pick(
                student,
                "department",
                "Department"
            ),
            academicYear: pick(
                student,
                "academicYear",
                "AcademicYear"
            ),
            courseIds: pick(
                student,
                "courseIds",
                "CourseIDs"
            )
        };
    }

    function normalizeSummary(summary) {
        return {
            assignedCourses: pick(
                summary,
                "assignedCourses",
                "AssignedCourses"
            ),
            totalStudents: pick(
                summary,
                "totalStudents",
                "TotalStudents"
            ),
            upcomingExaminations: pick(
                summary,
                "upcomingExaminations",
                "UpcomingExaminations"
            ),
            attendanceRecordsToday: pick(
                summary,
                "attendanceRecordsToday",
                "AttendanceRecordsToday"
            ),

            AssignedCourses: pick(
                summary,
                "AssignedCourses",
                "assignedCourses"
            ),
            TotalStudents: pick(
                summary,
                "TotalStudents",
                "totalStudents"
            ),
            UpcomingExaminations: pick(
                summary,
                "UpcomingExaminations",
                "upcomingExaminations"
            ),
            AttendanceRecordsToday: pick(
                summary,
                "AttendanceRecordsToday",
                "attendanceRecordsToday"
            )
        };
    }

    function normalizeAttendance(record) {
        return {
            attendanceId: pick(
                record,
                "attendanceId",
                "AttendanceID"
            ),
            studentId: pick(
                record,
                "studentId",
                "StudentID"
            ),
            courseId: pick(
                record,
                "courseId",
                "CourseID"
            ),
            attendanceDate: pick(
                record,
                "attendanceDate",
                "AttendanceDate"
            ),
            status: pick(
                record,
                "status",
                "Status"
            )
        };
    }

    function normalizeExamination(examination) {
        return {
            examinationId: pick(
                examination,
                "examinationId",
                "ExaminationID",
                "examId"
            ),
            courseId: pick(
                examination,
                "courseId",
                "CourseID"
            ),
            examName: pick(
                examination,
                "examName",
                "ExaminationName",
                "examinationName"
            ),
            examDate: pick(
                examination,
                "examDate",
                "ExaminationDate",
                "examinationDate"
            ),
            totalMarks: Number(
                pick(
                    examination,
                    "totalMarks",
                    "TotalMarks"
                ) || 100
            )
        };
    }

    function normalizeResult(result) {
        return {
            resultId: pick(
                result,
                "resultId",
                "ResultID"
            ),
            examinationId: pick(
                result,
                "examinationId",
                "ExaminationID",
                "examId"
            ),
            studentId: pick(
                result,
                "studentId",
                "StudentID"
            ),
            studentNumber: pick(
                result,
                "studentNumber",
                "RegistrationNumber",
                "registrationNumber"
            ),
            fullName: pick(
                result,
                "fullName",
                "FullName"
            ),
            courseId: pick(
                result,
                "courseId",
                "CourseID"
            ),
            marks: pick(
                result,
                "marks",
                "Marks"
            ),
            grade: pick(
                result,
                "grade",
                "Grade"
            )
        };
    }

    async function getProfile() {
        const response = await request("/lecturer/profile");

        const lecturer =
            normalizeLecturer(
                extractObject(response, "lecturer")
            );

        return {
            ...response,
            data: lecturer,
            lecturer
        };
    }

    async function getDashboardSummary() {
        const response = await request(
            "/lecturer/dashboard-summary"
        );

        const summary =
            normalizeSummary(
                extractObject(response, "summary")
            );

        return {
            ...response,
            data: summary,
            summary
        };
    }

    async function getCourses() {
        const response = await request("/lecturer/courses");

        const courses = extractArray(response, "courses")
            .map(normalizeCourse);

        return {
            ...response,
            data: courses,
            courses
        };
    }

    async function getCourseStudents(courseId) {
        const response = await request(
            `/lecturer/courses/${encodeURIComponent(courseId)}/students`
        );

        const students = extractArray(response, "students")
            .map(normalizeStudent);

        return {
            ...response,
            data: students,
            students
        };
    }

    async function getAttendance(courseId) {
        const response = await request(
            `/lecturer/attendance/${encodeURIComponent(courseId)}`
        );

        const attendance = extractArray(response, "attendance")
            .map(normalizeAttendance);

        return {
            ...response,
            data: attendance,
            attendance
        };
    }

    async function saveAttendance(payload) {
        return request("/lecturer/attendance", {
            method: "POST",
            body: JSON.stringify(payload)
        });
    }

    async function getExaminations() {
        const response = await request(
            "/lecturer/examinations"
        );

        const examinations =
            extractArray(response, "examinations")
                .map(normalizeExamination);

        return {
            ...response,
            data: examinations,
            examinations
        };
    }

    async function getResults(examinationId) {
        const response = await request(
            `/lecturer/results/${encodeURIComponent(
                examinationId
            )}`
        );

        const results =
            extractArray(response, "results")
                .map(normalizeResult);

        return {
            ...response,
            data: results,
            results
        };
    }

    async function createExamination(payload) {
        const backendPayload = {
            courseId: payload.courseId,
            examinationName:
                payload.examinationName ||
                payload.examName,
            examinationDate:
                payload.examinationDate ||
                payload.examDate,
            totalMarks: payload.totalMarks
        };

        const response = await request(
            "/lecturer/examinations",
            {
                method: "POST",
                body: JSON.stringify(backendPayload)
            }
        );

        return {
            ...response,
            data: normalizeExamination(
                response.data || response.examination || response
            )
        };
    }

    async function createResult(payload) {
        const response = await request("/lecturer/results", {
            method: "POST",
            body: JSON.stringify(payload)
        });

        return {
            ...response,
            data: normalizeResult(
                response.data || response.result || response
            )
        };
    }

    async function updateResult(resultId, payload) {
        const response = await request(
            `/lecturer/results/${encodeURIComponent(resultId)}`,
            {
                method: "PUT",
                body: JSON.stringify(payload)
            }
        );

        return {
            ...response,
            data: normalizeResult(
                response.data || response.result || response
            )
        };
    }

    return Object.freeze({
        getProfile,
        getDashboardSummary,
        getCourses,
        getCourseStudents,
        getAttendance,
        saveAttendance,
        getExaminations,
        getResults,
        createExamination,
        createResult,
        updateResult
    });
})();