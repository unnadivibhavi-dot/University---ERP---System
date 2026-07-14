"use strict";

/*
---------------------------------------------------
University ERP
Student Dashboard Frontend

Uses these existing backend endpoints:

GET /api/student-portal/dashboard
GET /api/student-portal/profile
GET /api/student-portal/attendance
GET /api/student-portal/examinations
GET /api/student-portal/results
---------------------------------------------------
*/


/* =====================================
   HTML ELEMENTS
===================================== */

const studentSidebar =
    document.getElementById("studentSidebar");

const sidebarOverlay =
    document.getElementById("sidebarOverlay");

const mobileMenuButton =
    document.getElementById("mobileMenuButton");

const sidebarCloseButton =
    document.getElementById("sidebarCloseButton");

const currentDateElement =
    document.getElementById("currentDate");

const loadingOverlay =
    document.getElementById("loadingOverlay");

const dashboardError =
    document.getElementById("dashboardError");

const dashboardErrorMessage =
    document.getElementById("dashboardErrorMessage");

const sidebarStudentAvatar =
    document.getElementById("sidebarStudentAvatar");

const sidebarStudentName =
    document.getElementById("sidebarStudentName");

const sidebarStudentId =
    document.getElementById("sidebarStudentId");

const topStudentAvatar =
    document.getElementById("topStudentAvatar");

const topStudentName =
    document.getElementById("topStudentName");

const topStudentId =
    document.getElementById("topStudentId");

const welcomeStudentName =
    document.getElementById("welcomeStudentName");

const studentProgramme =
    document.getElementById("studentProgramme");

const studentSemester =
    document.getElementById("studentSemester");

const enrolledCoursesCount =
    document.getElementById("enrolledCoursesCount");

const attendancePercentage =
    document.getElementById("attendancePercentage");

const attendanceStatus =
    document.getElementById("attendanceStatus");

const upcomingExamCount =
    document.getElementById("upcomingExamCount");

const currentGpa =
    document.getElementById("currentGpa");

const scheduleList =
    document.getElementById("scheduleList");

const scheduleEmptyState =
    document.getElementById("scheduleEmptyState");

const examinationList =
    document.getElementById("examinationList");

const examinationEmptyState =
    document.getElementById("examinationEmptyState");

const resultsTableBody =
    document.getElementById("resultsTableBody");

const resultsEmptyState =
    document.getElementById("resultsEmptyState");

const profileStudentId =
    document.getElementById("profileStudentId");

const profileStudentName =
    document.getElementById("profileStudentName");

const profileProgramme =
    document.getElementById("profileProgramme");

const profileSemester =
    document.getElementById("profileSemester");

const sidebarLogoutButton =
    document.getElementById("sidebarLogoutButton");

const topLogoutButton =
    document.getElementById("topLogoutButton");

const confirmLogoutButton =
    document.getElementById("confirmLogoutButton");

const viewProfileButton =
    document.getElementById("viewProfileButton");

const profileNavigationLink =
    document.getElementById("profileNavigationLink");


/* =====================================
   CONFIGURATION CHECK
===================================== */

if (typeof window.fetchWithAuth !== "function") {
    throw new Error(
        "config.js is missing. Load config.js before student-dashboard.js."
    );
}


/* =====================================
   PAGE INITIALIZATION
===================================== */

document.addEventListener(
    "DOMContentLoaded",
    initializeDashboard
);

async function initializeDashboard() {
    displayCurrentDate();
    initializeSidebar();
    initializeLogout();
    initializeProfileNavigation();

    try {
        showLoading();
        hideError();

        const dashboardData =
            await fetchStudentDashboardData();

        renderDashboard(dashboardData);
    } catch (error) {
        console.error(
            "Student Dashboard error:",
            error
        );

        showError(
            error.message ||
            "Unable to load Student Dashboard."
        );

        renderEmptyDashboard();
    } finally {
        hideLoading();
    }
}


/* =====================================
   LOAD REAL BACKEND DATA
===================================== */

async function fetchStudentDashboardData() {
    const [
        dashboardResponse,
        profileResponse,
        attendanceResponse,
        examinationsResponse,
        resultsResponse
    ] = await Promise.all([
        fetchWithAuth(
            "/student-portal/dashboard"
        ),

        fetchWithAuth(
            "/student-portal/profile"
        ),

        fetchWithAuth(
            "/student-portal/attendance"
        ),

        fetchWithAuth(
            "/student-portal/examinations"
        ),

        fetchWithAuth(
            "/student-portal/results"
        )
    ]);

    const dashboard =
        dashboardResponse?.data || {};

    const profile =
        profileResponse?.data || {};

    const attendance =
        Array.isArray(attendanceResponse?.data)
            ? attendanceResponse.data
            : [];

    const examinations =
        Array.isArray(examinationsResponse?.data)
            ? examinationsResponse.data
            : [];

    const results =
        Array.isArray(resultsResponse?.data)
            ? resultsResponse.data
            : [];

    return {
        student: normalizeStudent(profile),

        summary: {
            enrolledCourses:
                Number(dashboard.totalCourses) || 0,

            attendancePercentage:
                calculateAttendancePercentage(
                    attendance
                ),

            upcomingExams:
                Number(
                    dashboard.upcomingExaminations
                ) || 0,

            currentGpa:
                calculateGpa(results)
        },

        /*
        The existing backend does not currently provide
        lecture times, lecturers or classroom locations.
        Therefore, the dashboard correctly shows the
        empty schedule state instead of fake data.
        */

        todaySchedule: [],

        upcomingExaminations:
            normalizeExaminations(examinations),

        recentResults:
            normalizeResults(results)
    };
}


/* =====================================
   NORMALIZE BACKEND DATA
===================================== */

function normalizeStudent(profile) {
    const fullName =
        String(
            profile.FullName ||
            profile.fullName ||
            "Student"
        ).trim();

    const nameParts =
        fullName.split(/\s+/);

    const firstName =
        nameParts.shift() || "Student";

    const lastName =
        nameParts.join(" ");

    const academicYear =
        profile.AcademicYear ??
        profile.academicYear;

    return {
        studentId:
            profile.RegistrationNumber ||
            profile.registrationNumber ||
            "Not available",

        firstName,

        lastName,

        programme:
            profile.Department ||
            profile.department ||
            "Not available",

        semester:
            academicYear
                ? `Academic Year ${academicYear}`
                : "Not available"
    };
}

function normalizeExaminations(examinations) {
    const currentDate =
        new Date();

    currentDate.setHours(
        0,
        0,
        0,
        0
    );

    return examinations
        .filter((examination) => {
            const date =
                new Date(
                    examination.ExaminationDate ||
                    examination.examinationDate
                );

            return (
                !Number.isNaN(date.getTime()) &&
                date >= currentDate
            );
        })
        .map((examination) => ({
            courseCode:
                examination.CourseCode ||
                examination.courseCode ||
                "",

            courseName:
                examination.CourseName ||
                examination.courseName ||
                "Course",

            examType:
                examination.ExaminationName ||
                examination.examinationName ||
                "Examination",

            date:
                examination.ExaminationDate ||
                examination.examinationDate,

            /*
            These fields are not currently stored by
            the existing backend.
            */

            time: "Time not available",
            location: "Location not available"
        }))
        .sort((first, second) => {
            return (
                new Date(first.date) -
                new Date(second.date)
            );
        });
}

function normalizeResults(results) {
    return results
        .map((result) => {
            const marks =
                Number(
                    result.Marks ??
                    result.marks
                ) || 0;

            return {
                courseCode:
                    result.CourseCode ||
                    result.courseCode ||
                    "",

                courseName:
                    result.CourseName ||
                    result.courseName ||
                    "Course",

                marks,

                grade:
                    result.Grade ||
                    result.grade ||
                    "N/A",

                status:
                    marks >= 40
                        ? "Pass"
                        : "Fail",

                examinationDate:
                    result.ExaminationDate ||
                    result.examinationDate
            };
        })
        .sort((first, second) => {
            return (
                new Date(
                    second.examinationDate || 0
                ) -
                new Date(
                    first.examinationDate || 0
                )
            );
        })
        .slice(0, 4);
}


/* =====================================
   CALCULATE SUMMARY VALUES
===================================== */

function calculateAttendancePercentage(records) {
    if (records.length === 0) {
        return 0;
    }

    const attendedRecords =
        records.filter((record) => {
            const status =
                String(
                    record.Status ||
                    record.status ||
                    ""
                ).toLowerCase();

            return (
                status === "present" ||
                status === "late"
            );
        }).length;

    return Math.round(
        (
            attendedRecords /
            records.length
        ) * 100
    );
}

function calculateGpa(results) {
    if (results.length === 0) {
        return 0;
    }

    const gradePoints = {
        "A+": 4.0,
        "A": 4.0,
        "A-": 3.7,
        "B+": 3.3,
        "B": 3.0,
        "B-": 2.7,
        "C+": 2.3,
        "C": 2.0,
        "C-": 1.7,
        "D+": 1.3,
        "D": 1.0,
        "F": 0
    };

    const points =
        results
            .map((result) => {
                const grade =
                    String(
                        result.Grade ||
                        result.grade ||
                        ""
                    ).toUpperCase();

                return gradePoints[grade];
            })
            .filter((point) => {
                return Number.isFinite(point);
            });

    if (points.length === 0) {
        return 0;
    }

    const total =
        points.reduce(
            (sum, point) => sum + point,
            0
        );

    return total / points.length;
}


/* =====================================
   RENDER COMPLETE DASHBOARD
===================================== */

function renderDashboard(data) {
    renderStudentInformation(
        data.student
    );

    renderSummary(
        data.summary
    );

    renderSchedule(
        data.todaySchedule
    );

    renderExaminations(
        data.upcomingExaminations
    );

    renderResults(
        data.recentResults
    );
}

function renderEmptyDashboard() {
    renderSchedule([]);
    renderExaminations([]);
    renderResults([]);
}


/* =====================================
   CURRENT DATE
===================================== */

function displayCurrentDate() {
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


/* =====================================
   STUDENT INFORMATION
===================================== */

function renderStudentInformation(student) {
    const firstName =
        student.firstName ||
        "Student";

    const lastName =
        student.lastName ||
        "";

    const fullName =
        `${firstName} ${lastName}`.trim();

    const studentId =
        student.studentId ||
        "Not available";

    const programme =
        student.programme ||
        "Not available";

    const semester =
        student.semester ||
        "Not available";

    const initials =
        createInitials(
            firstName,
            lastName
        );

    setText(
        sidebarStudentAvatar,
        initials
    );

    setText(
        topStudentAvatar,
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
        studentId
    );

    setText(
        topStudentId,
        studentId
    );

    setText(
        welcomeStudentName,
        firstName
    );

    setText(
        studentProgramme,
        programme
    );

    setText(
        studentSemester,
        semester
    );

    setText(
        profileStudentId,
        studentId
    );

    setText(
        profileStudentName,
        fullName
    );

    setText(
        profileProgramme,
        programme
    );

    setText(
        profileSemester,
        semester
    );
}


/* =====================================
   SUMMARY CARDS
===================================== */

function renderSummary(summary) {
    const enrolledCourses =
        Number(
            summary.enrolledCourses
        ) || 0;

    const attendance =
        Math.max(
            0,
            Math.min(
                100,
                Number(
                    summary.attendancePercentage
                ) || 0
            )
        );

    const upcomingExams =
        Number(
            summary.upcomingExams
        ) || 0;

    const gpa =
        Number(
            summary.currentGpa
        ) || 0;

    setText(
        enrolledCoursesCount,
        enrolledCourses
    );

    setText(
        attendancePercentage,
        `${attendance}%`
    );

    setText(
        upcomingExamCount,
        upcomingExams
    );

    setText(
        currentGpa,
        gpa.toFixed(2)
    );

    updateAttendanceStatus(
        attendance
    );
}

function updateAttendanceStatus(percentage) {
    if (!attendanceStatus) {
        return;
    }

    if (percentage >= 80) {
        attendanceStatus.textContent =
            "Good attendance record";

        attendanceStatus.style.color =
            "#16a34a";

        return;
    }

    if (percentage >= 70) {
        attendanceStatus.textContent =
            "Attendance needs attention";

        attendanceStatus.style.color =
            "#d97706";

        return;
    }

    attendanceStatus.textContent =
        percentage === 0
            ? "No attendance records available"
            : "Low attendance warning";

    attendanceStatus.style.color =
        percentage === 0
            ? ""
            : "#dc2626";
}


/* =====================================
   TODAY'S SCHEDULE
===================================== */

function renderSchedule(scheduleItems) {
    if (!scheduleList) {
        return;
    }

    scheduleList.replaceChildren();

    if (scheduleItems.length === 0) {
        scheduleEmptyState?.classList
            .remove("d-none");

        return;
    }

    scheduleEmptyState?.classList
        .add("d-none");

    scheduleItems.forEach((schedule) => {
        const scheduleItem =
            document.createElement("div");

        scheduleItem.className =
            "schedule-item";

        scheduleItem.innerHTML = `
            <div class="schedule-time">
                <strong>
                    ${escapeHtml(schedule.startTime)}
                </strong>

                <span>
                    ${escapeHtml(schedule.endTime)}
                </span>
            </div>

            <div class="schedule-course">
                <h3>
                    ${escapeHtml(schedule.courseName)}
                </h3>

                <p>
                    ${escapeHtml(schedule.courseCode)}
                    •
                    ${escapeHtml(schedule.lecturer)}
                </p>
            </div>

            <span class="schedule-location">
                <i class="bi bi-geo-alt-fill"></i>
                ${escapeHtml(schedule.location)}
            </span>
        `;

        scheduleList.appendChild(
            scheduleItem
        );
    });
}


/* =====================================
   UPCOMING EXAMINATIONS
===================================== */

function renderExaminations(examinations) {
    if (!examinationList) {
        return;
    }

    examinationList.replaceChildren();

    if (examinations.length === 0) {
        examinationEmptyState?.classList
            .remove("d-none");

        return;
    }

    examinationEmptyState?.classList
        .add("d-none");

    examinations
        .slice(0, 3)
        .forEach((examination) => {
            const dateInformation =
                formatExaminationDate(
                    examination.date
                );

            const examinationItem =
                document.createElement("div");

            examinationItem.className =
                "examination-item";

            examinationItem.innerHTML = `
                <div class="examination-date">
                    <strong>
                        ${escapeHtml(dateInformation.day)}
                    </strong>

                    <span>
                        ${escapeHtml(dateInformation.month)}
                    </span>
                </div>

                <div class="examination-information">
                    <h3>
                        ${escapeHtml(examination.courseName)}
                    </h3>

                    <p>
                        ${escapeHtml(examination.time)}
                        •
                        ${escapeHtml(examination.location)}
                    </p>
                </div>

                <span class="examination-type">
                    ${escapeHtml(examination.examType)}
                </span>
            `;

            examinationList.appendChild(
                examinationItem
            );
        });
}

function formatExaminationDate(dateValue) {
    const examinationDate =
        new Date(dateValue);

    if (
        Number.isNaN(
            examinationDate.getTime()
        )
    ) {
        return {
            day: "--",
            month: "---"
        };
    }

    return {
        day: String(
            examinationDate.getDate()
        ).padStart(2, "0"),

        month:
            examinationDate.toLocaleDateString(
                "en-US",
                {
                    month: "short"
                }
            )
    };
}


/* =====================================
   RECENT RESULTS
===================================== */

function renderResults(results) {
    if (!resultsTableBody) {
        return;
    }

    resultsTableBody.replaceChildren();

    if (results.length === 0) {
        resultsEmptyState?.classList
            .remove("d-none");

        return;
    }

    resultsEmptyState?.classList
        .add("d-none");

    results.forEach((result) => {
        const tableRow =
            document.createElement("tr");

        const status =
            String(
                result.status ||
                ""
            );

        const statusClass =
            status.toLowerCase() === "pass"
                ? "status-pass"
                : "status-fail";

        tableRow.innerHTML = `
            <td>
                <span class="result-course-name">
                    ${escapeHtml(result.courseName)}
                </span>

                <span class="result-course-code">
                    ${escapeHtml(result.courseCode)}
                </span>
            </td>

            <td>
                ${escapeHtml(result.marks)}%
            </td>

            <td>
                <span class="grade-badge">
                    ${escapeHtml(result.grade)}
                </span>
            </td>

            <td>
                <span class="status-badge ${statusClass}">
                    ${escapeHtml(status)}
                </span>
            </td>
        `;

        resultsTableBody.appendChild(
            tableRow
        );
    });
}


/* =====================================
   PROFILE NAVIGATION
===================================== */

function initializeProfileNavigation() {
    const openProfile =
        function () {
            const profileSection =
                document.getElementById(
                    "studentProfile"
                );

            profileSection?.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

            closeSidebar();
        };

    profileNavigationLink?.addEventListener(
        "click",
        openProfile
    );

    viewProfileButton?.addEventListener(
        "click",
        openProfile
    );
}


/* =====================================
   MOBILE SIDEBAR
===================================== */

function initializeSidebar() {
    mobileMenuButton?.addEventListener(
        "click",
        openSidebar
    );

    sidebarCloseButton?.addEventListener(
        "click",
        closeSidebar
    );

    sidebarOverlay?.addEventListener(
        "click",
        closeSidebar
    );

    document.addEventListener(
        "keydown",
        function (event) {
            if (event.key === "Escape") {
                closeSidebar();
            }
        }
    );

    window.addEventListener(
        "resize",
        function () {
            if (window.innerWidth > 900) {
                closeSidebar();
            }
        }
    );
}

function openSidebar() {
    studentSidebar?.classList.add(
        "open"
    );

    sidebarOverlay?.classList.add(
        "show"
    );

    mobileMenuButton?.setAttribute(
        "aria-expanded",
        "true"
    );

    document.body.style.overflow =
        "hidden";
}

function closeSidebar() {
    studentSidebar?.classList.remove(
        "open"
    );

    sidebarOverlay?.classList.remove(
        "show"
    );

    mobileMenuButton?.setAttribute(
        "aria-expanded",
        "false"
    );

    document.body.style.overflow = "";
}


/* =====================================
   LOGOUT
===================================== */

function initializeLogout() {
    sidebarLogoutButton?.addEventListener(
        "click",
        openLogoutModal
    );

    topLogoutButton?.addEventListener(
        "click",
        openLogoutModal
    );

    confirmLogoutButton?.addEventListener(
        "click",
        logoutStudent
    );
}

function openLogoutModal() {
    const logoutModalElement =
        document.getElementById(
            "logoutModal"
        );

    if (
        !logoutModalElement ||
        typeof bootstrap === "undefined"
    ) {
        logoutStudent();
        return;
    }

    const logoutModal =
        bootstrap.Modal.getOrCreateInstance(
            logoutModalElement
        );

    logoutModal.show();
}

function logoutStudent() {
    if (
        typeof window.clearSession ===
        "function"
    ) {
        window.clearSession();
    } else {
        localStorage.removeItem("token");
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
        localStorage.removeItem("loggedUser");
        localStorage.removeItem("loggedInUser");
        localStorage.removeItem("loggedInStudent");
        localStorage.removeItem("isLoggedIn");
    }

    window.location.replace(
        "login.html"
    );
}


/* =====================================
   LOADING AND ERROR STATES
===================================== */

function showLoading() {
    loadingOverlay?.classList.remove(
        "hidden"
    );
}

function hideLoading() {
    loadingOverlay?.classList.add(
        "hidden"
    );
}

function showError(message) {
    setText(
        dashboardErrorMessage,
        message
    );

    dashboardError?.classList.remove(
        "d-none"
    );
}

function hideError() {
    dashboardError?.classList.add(
        "d-none"
    );
}


/* =====================================
   HELPER FUNCTIONS
===================================== */

function setText(element, value) {
    if (element) {
        element.textContent =
            value === null ||
                value === undefined
                ? ""
                : String(value);
    }
}

function createInitials(
    firstName,
    lastName
) {
    const firstInitial =
        firstName
            ? firstName.charAt(0)
            : "";

    const lastInitial =
        lastName
            ? lastName.charAt(0)
            : "";

    return (
        `${firstInitial}${lastInitial}`
            .toUpperCase() ||
        "ST"
    );
}

function escapeHtml(value) {
    const temporaryElement =
        document.createElement("div");

    temporaryElement.textContent =
        value === null ||
            value === undefined
            ? ""
            : String(value);

    return temporaryElement.innerHTML;
}