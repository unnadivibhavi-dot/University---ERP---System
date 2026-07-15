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
   PAGE CONFIGURATION
================================================== */

const MINIMUM_ATTENDANCE_PERCENTAGE = 80;


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
            window.fetchWithAuth(
                "/student-portal/profile"
            ),

            window.fetchWithAuth(
                "/student-portal/attendance"
            )
        ]);

        currentStudent =
            normalizeStudent(
                profileResponse?.data
            );

        const rawAttendanceRecords =
            Array.isArray(
                attendanceResponse?.data
            )
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

        attendanceRecords = [];
        filteredRecords = [];

        updateSummary();
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

function aggregateAttendanceByCourse(records) {
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
            A late student attended the class.
            Therefore, it is included in the attendance
            percentage while still being recorded as late.
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
        return String(
            firstCourse.courseCode
        ).localeCompare(
            String(secondCourse.courseCode)
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


/* ==================================================
   SUMMARY
================================================== */

function updateSummary() {
    const summary =
        attendanceRecords.reduce(
            (totals, course) => {
                totals.present +=
                    Number(course.present) || 0;

                totals.absent +=
                    Number(course.absent) || 0;

                totals.totalClasses +=
                    Number(course.totalClasses) || 0;

                return totals;
            },
            {
                present: 0,
                absent: 0,
                totalClasses: 0
            }
        );

    const percentage =
        summary.totalClasses > 0
            ? Math.round(
                (
                    summary.present /
                    summary.totalClasses
                ) * 100
            )
            : 0;

    setText(
        overallAttendance,
        `${percentage}%`
    );

    setText(
        presentCount,
        summary.present
    );

    setText(
        absentCount,
        summary.absent
    );

    setText(
        totalClasses,
        summary.totalClasses
    );

    const hasLowAttendance =
        attendanceRecords.some(
            (course) => {
                return (
                    calculateCoursePercentage(
                        course
                    ) <
                    MINIMUM_ATTENDANCE_PERCENTAGE
                );
            }
        );

    attendanceWarning?.classList.toggle(
        "d-none",
        !hasLowAttendance
    );
}


/* ==================================================
   FILTERS
================================================== */

function initializeFilters() {
    attendanceSearch?.addEventListener(
        "input",
        applyFilters
    );

    attendanceFilter?.addEventListener(
        "change",
        applyFilters
    );

    clearFilterButton?.addEventListener(
        "click",
        clearFilters
    );
}

function applyFilters() {
    const searchValue =
        String(
            attendanceSearch?.value || ""
        )
            .trim()
            .toLowerCase();

    const filterValue =
        String(
            attendanceFilter?.value || ""
        )
            .trim()
            .toLowerCase();

    filteredRecords =
        attendanceRecords.filter(
            (course) => {
                const courseCode =
                    String(
                        course.courseCode || ""
                    ).toLowerCase();

                const courseName =
                    String(
                        course.courseName || ""
                    ).toLowerCase();

                const percentage =
                    calculateCoursePercentage(
                        course
                    );

                const matchesSearch =
                    searchValue === "" ||
                    courseCode.includes(
                        searchValue
                    ) ||
                    courseName.includes(
                        searchValue
                    );

                const matchesLevel =
                    filterValue === "" ||
                    (
                        filterValue === "good" &&
                        percentage >=
                        MINIMUM_ATTENDANCE_PERCENTAGE
                    ) ||
                    (
                        filterValue === "low" &&
                        percentage <
                        MINIMUM_ATTENDANCE_PERCENTAGE
                    );

                return (
                    matchesSearch &&
                    matchesLevel
                );
            }
        );

    renderAttendance(
        filteredRecords
    );
}

function clearFilters() {
    if (attendanceSearch) {
        attendanceSearch.value = "";
    }

    if (attendanceFilter) {
        attendanceFilter.value = "";
    }

    filteredRecords = [
        ...attendanceRecords
    ];

    renderAttendance(
        filteredRecords
    );

    attendanceSearch?.focus();
}


/* ==================================================
   RENDER ATTENDANCE CARDS
================================================== */

function renderAttendance(records) {
    if (!attendanceGrid) {
        return;
    }

    attendanceGrid.replaceChildren();

    if (!Array.isArray(records) ||
        records.length === 0) {

        emptyState?.classList.remove(
            "d-none"
        );

        return;
    }

    emptyState?.classList.add(
        "d-none"
    );

    records.forEach((course) => {
        const card =
            createAttendanceCard(
                course
            );

        attendanceGrid.appendChild(
            card
        );
    });
}

function createAttendanceCard(course) {
    const attendanceCard =
        document.createElement("article");

    attendanceCard.className =
        "attendance-card";

    const percentage =
        calculateCoursePercentage(
            course
        );

    const attendanceLevel =
        percentage >=
            MINIMUM_ATTENDANCE_PERCENTAGE
            ? "good"
            : "low";

    const attendanceLevelText =
        attendanceLevel === "good"
            ? "Good attendance"
            : "Low attendance";

    const safePercentage =
        Math.max(
            0,
            Math.min(
                100,
                percentage
            )
        );

    attendanceCard.innerHTML = `
        <div class="attendance-card-header">
            <span class="course-code">
                ${escapeHtml(course.courseCode)}
            </span>

            <span class="attendance-level ${attendanceLevel}">
                ${escapeHtml(attendanceLevelText)}
            </span>
        </div>

        <h3>
            ${escapeHtml(course.courseName)}
        </h3>

        <div class="attendance-numbers">

            <div class="attendance-number">
                <span>Present</span>

                <strong>
                    ${escapeHtml(course.present)}
                </strong>
            </div>

            <div class="attendance-number">
                <span>Absent</span>

                <strong>
                    ${escapeHtml(course.absent)}
                </strong>
            </div>

            <div class="attendance-number">
                <span>Total</span>

                <strong>
                    ${escapeHtml(course.totalClasses)}
                </strong>
            </div>

        </div>

        <div class="progress-area">

            <div class="progress-top">
                <span>Attendance rate</span>

                <strong>
                    ${safePercentage}%
                </strong>
            </div>

            <div
                class="progress-track"
                role="progressbar"
                aria-label="${escapeHtml(course.courseCode)} attendance"
                aria-valuemin="0"
                aria-valuemax="100"
                aria-valuenow="${safePercentage}"
            >
                <div
                    class="progress-bar-custom"
                    style="width: ${safePercentage}%"
                ></div>
            </div>

        </div>
    `;

    return attendanceCard;
}

function calculateCoursePercentage(course) {
    const total =
        Number(
            course?.totalClasses
        ) || 0;

    const present =
        Number(
            course?.present
        ) || 0;

    if (total <= 0) {
        return 0;
    }

    return Math.round(
        (
            present /
            total
        ) * 100
    );
}


/* ==================================================
   MOBILE SIDEBAR
================================================== */

function initializeSidebar() {
    menuButton?.addEventListener(
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

    menuButton?.setAttribute(
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

    menuButton?.setAttribute(
        "aria-expanded",
        "false"
    );

    document.body.style.overflow = "";
}


/* ==================================================
   LOGOUT
================================================== */

function initializeLogout() {
    logoutButton?.addEventListener(
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

    if (!logoutModalElement) {
        logoutStudent();
        return;
    }

    if (
        typeof bootstrap === "undefined" ||
        !bootstrap.Modal
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
        typeof window.logoutUser ===
        "function"
    ) {
        window.logoutUser();
        return;
    }

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


/* ==================================================
   LOADING STATE
================================================== */

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


/* ==================================================
   HELPER FUNCTIONS
================================================== */

function setText(element, value) {
    if (!element) {
        return;
    }

    element.textContent =
        value === null ||
            value === undefined
            ? ""
            : String(value);
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