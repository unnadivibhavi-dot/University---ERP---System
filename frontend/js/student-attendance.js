"use strict";

/*
---------------------------------------------------
University ERP
Student Attendance Page

Uses existing backend endpoints:

GET /api/student-portal/profile
GET /api/student-portal/attendance
---------------------------------------------------
*/


/* ==================================================
   PAGE STATE
================================================== */

let attendanceRecords = [];
let filteredRecords = [];
let currentStudent = null;


/* ==================================================
   HTML ELEMENTS
================================================== */

const attendanceGrid =
    document.getElementById("attendanceGrid");

const attendanceSearch =
    document.getElementById("attendanceSearch");

const attendanceFilter =
    document.getElementById("attendanceFilter");

const clearFilterButton =
    document.getElementById("clearFilterButton");

const emptyState =
    document.getElementById("emptyState");

const loadingOverlay =
    document.getElementById("loadingOverlay");

const overallAttendance =
    document.getElementById("overallAttendance");

const presentCount =
    document.getElementById("presentCount");

const absentCount =
    document.getElementById("absentCount");

const totalClasses =
    document.getElementById("totalClasses");

const attendanceWarning =
    document.getElementById("attendanceWarning");

const studentSidebar =
    document.getElementById("studentSidebar");

const sidebarOverlay =
    document.getElementById("sidebarOverlay");

const menuButton =
    document.getElementById("menuButton");

const sidebarCloseButton =
    document.getElementById("sidebarCloseButton");

const logoutButton =
    document.getElementById("logoutButton");

const confirmLogoutButton =
    document.getElementById("confirmLogoutButton");

const currentDateElement =
    document.getElementById("currentDate");

const sidebarAvatar =
    document.getElementById("sidebarAvatar");

const topAvatar =
    document.getElementById("topAvatar");

const sidebarStudentName =
    document.getElementById("sidebarStudentName");

const topStudentName =
    document.getElementById("topStudentName");

const sidebarStudentId =
    document.getElementById("sidebarStudentId");

const topStudentId =
    document.getElementById("topStudentId");


/* ==================================================
   SHARED CONFIGURATION CHECK
================================================== */

if (typeof window.fetchWithAuth !== "function") {
    throw new Error(
        "config.js is missing. Load config.js before student-attendance.js."
    );
}


/* ==================================================
   PAGE INITIALIZATION
================================================== */

document.addEventListener(
    "DOMContentLoaded",
    initializeAttendancePage
);

async function initializeAttendancePage() {
    displayDate();
    initializeSidebar();
    initializeFilters();
    initializeLogout();

    try {
        showLoading();

        const [
            profileResponse,
            attendanceResponse
        ] = await Promise.all([
            fetchWithAuth(
                "/student-portal/profile"
            ),

            fetchWithAuth(
                "/student-portal/attendance"
            )
        ]);

        currentStudent =
            normalizeStudent(
                profileResponse?.data
            );

        const rawAttendanceRecords =
            Array.isArray(attendanceResponse?.data)
                ? attendanceResponse.data
                : [];

        attendanceRecords =
            aggregateAttendanceByCourse(
                rawAttendanceRecords
            );

        filteredRecords = [
            ...attendanceRecords
        ];

        displayStudent(
            currentStudent
        );

        updateSummary();

        renderAttendance(
            filteredRecords
        );

    } catch (error) {
        console.error(
            "Student attendance error:",
            error
        );

        renderAttendance([]);

        window.alert(
            error.message ||
            "Unable to load attendance records."
        );
    } finally {
        hideLoading();
    }
}


/* ==================================================
   NORMALIZE STUDENT PROFILE
================================================== */

function normalizeStudent(profile = {}) {
    const fullName =
        String(
            profile.FullName ||
            profile.fullName ||
            "Student"
        ).trim();

    const nameParts =
        fullName.split(/\s+/);

    const firstName =
        nameParts.shift() ||
        "Student";

    const lastName =
        nameParts.join(" ");

    return {
        studentId:
            profile.StudentID ??
            profile.studentId ??
            null,

        registrationNumber:
            profile.RegistrationNumber ||
            profile.registrationNumber ||
            "Not available",

        firstName,

        lastName
    };
}


/* ==================================================
   GROUP ATTENDANCE BY COURSE
================================================== */

function aggregateAttendanceByCourse(
    records
) {
    const groupedCourses =
        new Map();

    records.forEach((record) => {
        const courseId =
            Number(
                record.CourseID ??
                record.courseId
            );

        const courseCode =
            record.CourseCode ||
            record.courseCode ||
            "N/A";

        const courseName =
            record.CourseName ||
            record.courseName ||
            "Unnamed Course";

        const key =
            Number.isFinite(courseId)
                ? String(courseId)
                : courseCode;

        if (!groupedCourses.has(key)) {
            groupedCourses.set(
                key,
                {
                    courseId,
                    courseCode,
                    courseName,
                    totalClasses: 0,
                    present: 0,
                    absent: 0,
                    late: 0
                }
            );
        }

        const courseRecord =
            groupedCourses.get(key);

        const status =
            String(
                record.Status ||
                record.status ||
                ""
            )
                .trim()
                .toLowerCase();

        courseRecord.totalClasses += 1;

        if (status === "present") {
            courseRecord.present += 1;
        } else if (status === "late") {
            /*
            A late student attended the class,
            so it counts as present for percentage.
            */

            courseRecord.present += 1;
            courseRecord.late += 1;
        } else {
            courseRecord.absent += 1;
        }
    });

    return Array.from(
        groupedCourses.values()
    ).sort((firstCourse, secondCourse) => {
        return firstCourse.courseCode.localeCompare(
            secondCourse.courseCode
        );
    });
}


/* ==================================================
   DISPLAY STUDENT INFORMATION
================================================== */

function displayStudent(student) {
    const firstName =
        student?.firstName ||
        "Student";

    const lastName =
        student?.lastName ||
        "";

    const fullName =
        `${firstName} ${lastName}`.trim();

    const registrationNumber =
        student?.registrationNumber ||
        "Not available";

    const initials =
        createInitials(
            firstName,
            lastName
        );

    setText(
        sidebarAvatar,
        initials
    );

    setText(
        topAvatar,
        initials
    );

    setText(
        sidebarStudentName,
        fullName
    );

    setText(
        topStudentName,
        fullName
    );

    setText(
        sidebarStudentId,
        registrationNumber
    );

    setText(
        topStudentId,
        registrationNumber
    );
}


/* ==================================================
   CURRENT DATE
================================================== */

function displayDate() {
    if (!currentDateElement) {
        return;
    }

    currentDateElement.textContent =
        new Date().toLocaleDateString(
            "en-US",
            {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric"
            }
        );
}
