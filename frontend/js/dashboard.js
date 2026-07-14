"use strict";

/*
=========================================================
UNIVERSITY ERP SYSTEM
ADMIN DASHBOARD FRONTEND MODULE

Data source:
- Existing backend REST APIs
- Azure SQL through the backend

No frontend mock arrays or localStorage database records
are used by this file.
=========================================================
*/


/* ------------------------------------------------------
   REQUIRED SHARED CONFIGURATION
------------------------------------------------------ */

if (
    typeof window.fetchWithAuth !== "function" ||
    typeof window.getStoredUser !== "function" ||
    typeof window.getToken !== "function"
) {
    throw new Error(
        "config.js must be loaded before dashboard.js."
    );
}


/* ------------------------------------------------------
   HTML ELEMENTS
------------------------------------------------------ */

const sidebar =
    document.getElementById("sidebar");

const sidebarOverlay =
    document.getElementById("sidebarOverlay");

const mobileMenuButton =
    document.getElementById("mobileMenuButton");

const sidebarCloseButton =
    document.getElementById("sidebarCloseButton");

const sidebarLogoutButton =
    document.getElementById("sidebarLogoutButton");

const topLogoutButton =
    document.getElementById("topLogoutButton");

const sidebarUsername =
    document.getElementById("sidebarUsername");

const sidebarRole =
    document.getElementById("sidebarRole");

const topUsername =
    document.getElementById("topUsername");

const topRole =
    document.getElementById("topRole");

const welcomeHeading =
    document.getElementById("welcomeHeading");

const studentCount =
    document.getElementById("studentCount");

const courseCount =
    document.getElementById("courseCount");

const enrollmentCount =
    document.getElementById("enrollmentCount");

const attendanceRate =
    document.getElementById("attendanceRate");

const academicOverviewBody =
    document.getElementById("academicOverviewBody");

const activityList =
    document.getElementById("activityList");

const dashboardAvatars =
    document.querySelectorAll(
        ".sidebar-user-avatar, .user-profile-avatar"
    );


/* ------------------------------------------------------
   ROLE AND LOGIN PROTECTION
------------------------------------------------------ */

function protectDashboard() {
    const token = getToken();
    const user = getStoredUser();

    if (!token || !user) {
        redirectToLogin();
        return false;
    }

    const role = String(user.role || "")
        .trim()
        .toLowerCase();

    const allowedAdminRoles = [
        "admin",
        "administrator",
        "system admin"
    ];

    if (allowedAdminRoles.includes(role)) {
        return true;
    }

    if (role === "lecturer") {
        window.location.replace(
            "lecturer-dashboard.html"
        );

        return false;
    }

    if (role === "student") {
        window.location.replace(
            "student-dashboard.html"
        );

        return false;
    }

    redirectToLogin();
    return false;
}


/* ------------------------------------------------------
   LOAD LOGGED-IN USER
------------------------------------------------------ */

function loadUserInformation() {
    const user = getStoredUser();

    if (!user) {
        redirectToLogin();
        return;
    }

    const displayName =
        String(user.username || "Administrator");

    const displayRole =
        String(user.role || "Administrator");

    sidebarUsername.textContent =
        displayName;

    sidebarRole.textContent =
        displayRole;

    topUsername.textContent =
        displayName;

    topRole.textContent =
        displayRole;

    welcomeHeading.textContent =
        `Welcome back, ${displayName}`;

    const firstCharacter =
        displayName
            .charAt(0)
            .toUpperCase() || "A";

    dashboardAvatars.forEach((avatar) => {
        avatar.textContent = firstCharacter;
    });
}


/* ------------------------------------------------------
   API RESPONSE HELPER
------------------------------------------------------ */

function getResponseArray(response) {
    if (
        response &&
        Array.isArray(response.data)
    ) {
        return response.data;
    }

    return [];
}


/* ------------------------------------------------------
   ATTENDANCE CALCULATIONS
------------------------------------------------------ */

function getAttendanceStatus(record) {
    return String(
        record.Status ??
        record.status ??
        ""
    )
        .trim()
        .toLowerCase();
}


function calculateAttendancePercentage(records) {
    if (!Array.isArray(records) || records.length === 0) {
        return 0;
    }

    const presentRecords =
        records.filter(
            (record) =>
                getAttendanceStatus(record) ===
                "present"
        );

    return Math.round(
        (
            presentRecords.length /
            records.length
        ) * 100
    );
}


/* ------------------------------------------------------
   LOADING STATES
------------------------------------------------------ */

function showDashboardLoading() {
    studentCount.textContent = "...";
    courseCount.textContent = "...";
    enrollmentCount.textContent = "...";
    attendanceRate.textContent = "...";

    academicOverviewBody.innerHTML = `
        <tr>
            <td colspan="6" class="text-center py-4">
                <span
                    class="spinner-border spinner-border-sm me-2"
                    aria-hidden="true">
                </span>

                Loading academic information...
            </td>
        </tr>
    `;

    activityList.innerHTML = `
        <div class="activity-item">

            <div class="activity-icon student-activity">
                <span
                    class="spinner-border spinner-border-sm"
                    aria-hidden="true">
                </span>
            </div>

            <div class="activity-details">
                <strong>Loading recent activity...</strong>
                <p>
                    Please wait while dashboard data is loaded.
                </p>
            </div>

        </div>
    `;
}


/* ------------------------------------------------------
   SUMMARY CARDS
------------------------------------------------------ */

function renderSummaryCards(
    students,
    courses,
    enrollments,
    attendance
) {
    studentCount.textContent =
        students.length;

    courseCount.textContent =
        courses.length;

    enrollmentCount.textContent =
        enrollments.length;

    const overallAttendance =
        calculateAttendancePercentage(
            attendance
        );

    attendanceRate.textContent =
        `${overallAttendance}%`;
}


/* ------------------------------------------------------
   GET COURSE-SPECIFIC RECORDS
------------------------------------------------------ */

function getCourseId(record) {
    return Number(
        record.CourseID ??
        record.courseId ??
        0
    );
}


function getCourseEnrollments(
    courseId,
    enrollments
) {
    return enrollments.filter(
        (enrollment) =>
            getCourseId(enrollment) ===
            Number(courseId)
    );
}


function getCourseAttendance(
    courseId,
    attendance
) {
    return attendance.filter(
        (record) =>
            getCourseId(record) ===
            Number(courseId)
    );
}


/* ------------------------------------------------------
   ACADEMIC OVERVIEW TABLE
------------------------------------------------------ */

function renderAcademicOverview(
    courses,
    enrollments,
    attendance
) {
    academicOverviewBody.replaceChildren();

    if (courses.length === 0) {
        const row =
            document.createElement("tr");

        const cell =
            document.createElement("td");

        cell.colSpan = 6;
        cell.className =
            "text-center py-4";

        cell.textContent =
            "No course records are available.";

        row.appendChild(cell);
        academicOverviewBody.appendChild(row);

        return;
    }

    courses
        .slice(0, 5)
        .forEach((course) => {
            const courseId =
                Number(
                    course.CourseID ??
                    course.courseId ??
                    0
                );

            const courseCode =
                course.CourseCode ??
                course.courseCode ??
                "N/A";

            const courseName =
                course.CourseName ??
                course.courseName ??
                "Unnamed Course";

            const department =
                course.Department ??
                course.department ??
                "Not specified";

            const courseEnrollments =
                getCourseEnrollments(
                    courseId,
                    enrollments
                );

            const courseAttendance =
                getCourseAttendance(
                    courseId,
                    attendance
                );

            const courseAttendanceRate =
                calculateAttendancePercentage(
                    courseAttendance
                );

            const row =
                document.createElement("tr");

            row.innerHTML = `
                <td>
                    <span class="course-code">
                        ${escapeHTML(courseCode)}
                    </span>
                </td>

                <td>
                    ${escapeHTML(courseName)}
                </td>

                <td>
                    ${escapeHTML(department)}
                </td>

                <td>
                    ${courseEnrollments.length}
                </td>

                <td>
                    ${courseAttendanceRate}%
                </td>

                <td>
                    <span class="status-badge active-status">
                        Available
                    </span>
                </td>
            `;

            academicOverviewBody.appendChild(
                row
            );
        });
}


/* ------------------------------------------------------
   DATE FORMATTING
------------------------------------------------------ */

function getValidDate(value) {
    if (!value) {
        return null;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return date;
}


function formatActivityDate(value) {
    const date = getValidDate(value);

    if (!date) {
        return "Date not available";
    }

    return new Intl.DateTimeFormat(
        undefined,
        {
            year: "numeric",
            month: "short",
            day: "numeric"
        }
    ).format(date);
}


/* ------------------------------------------------------
   BUILD RECENT ACTIVITY
------------------------------------------------------ */

function buildRecentActivities(
    enrollments,
    attendance,
    examinations,
    results
) {
    const activities = [];

    enrollments.forEach((enrollment) => {
        const studentName =
            enrollment.FullName ??
            enrollment.fullName ??
            "A student";

        const courseCode =
            enrollment.CourseCode ??
            enrollment.courseCode ??
            "";

        const courseName =
            enrollment.CourseName ??
            enrollment.courseName ??
            "a course";

        const date =
            enrollment.EnrollmentDate ??
            enrollment.enrollmentDate ??
            null;

        activities.push({
            title: "Course enrollment completed",

            description:
                `${studentName} enrolled in ` +
                `${courseCode} ${courseName}.`,

            date,

            icon:
                "bi bi-person-check-fill",

            styleClass:
                "course-activity"
        });
    });


    attendance.forEach((record) => {
        const studentName =
            record.FullName ??
            record.fullName ??
            "A student";

        const courseCode =
            record.CourseCode ??
            record.courseCode ??
            "a course";

        const status =
            record.Status ??
            record.status ??
            "Recorded";

        const date =
            record.AttendanceDate ??
            record.attendanceDate ??
            null;

        activities.push({
            title: "Attendance recorded",

            description:
                `${studentName} was marked ` +
                `${status} for ${courseCode}.`,

            date,

            icon:
                "bi bi-calendar-check",

            styleClass:
                "attendance-activity"
        });
    });


    examinations.forEach((examination) => {
        const examinationName =
            examination.ExaminationName ??
            examination.examinationName ??
            "Examination";

        const courseCode =
            examination.CourseCode ??
            examination.courseCode ??
            "";

        const date =
            examination.ExaminationDate ??
            examination.examinationDate ??
            null;

        activities.push({
            title: "Examination scheduled",

            description:
                `${examinationName} was scheduled ` +
                `for ${courseCode}.`,

            date,

            icon:
                "bi bi-file-earmark-text-fill",

            styleClass:
                "course-activity"
        });
    });


    results.forEach((result) => {
        const studentName =
            result.FullName ??
            result.fullName ??
            "A student";

        const examinationName =
            result.ExaminationName ??
            result.examinationName ??
            "an examination";

        const date =
            result.ExaminationDate ??
            result.examinationDate ??
            null;

        activities.push({
            title: "Result available",

            description:
                `A result is available for ` +
                `${studentName} in ${examinationName}.`,

            date,

            icon:
                "bi bi-bar-chart-fill",

            styleClass:
                "result-activity"
        });
    });


    return activities
        .sort((first, second) => {
            const firstDate =
                getValidDate(first.date);

            const secondDate =
                getValidDate(second.date);

            return (
                (secondDate?.getTime() || 0) -
                (firstDate?.getTime() || 0)
            );
        })
        .slice(0, 4);
}


/* ------------------------------------------------------
   RENDER RECENT ACTIVITY
------------------------------------------------------ */

function renderRecentActivity(
    enrollments,
    attendance,
    examinations,
    results
) {
    const activities =
        buildRecentActivities(
            enrollments,
            attendance,
            examinations,
            results
        );

    activityList.replaceChildren();

    if (activities.length === 0) {
        const emptyActivity =
            document.createElement("div");

        emptyActivity.className =
            "activity-item";

        emptyActivity.innerHTML = `
            <div class="activity-icon student-activity">
                <i class="bi bi-info-circle"></i>
            </div>

            <div class="activity-details">
                <strong>No recent activity</strong>

                <p>
                    No academic activity is available yet.
                </p>
            </div>
        `;

        activityList.appendChild(
            emptyActivity
        );

        return;
    }

    activities.forEach((activity) => {
        const activityItem =
            document.createElement("div");

        activityItem.className =
            "activity-item";

        activityItem.innerHTML = `
            <div
                class="activity-icon
                ${escapeHTML(activity.styleClass)}">

                <i class="${escapeHTML(activity.icon)}"></i>

            </div>

            <div class="activity-details">

                <strong>
                    ${escapeHTML(activity.title)}
                </strong>

                <p>
                    ${escapeHTML(activity.description)}
                </p>

                <span>
                    ${escapeHTML(
            formatActivityDate(
                activity.date
            )
        )}
                </span>

            </div>
        `;

        activityList.appendChild(
            activityItem
        );
    });
}


/* ------------------------------------------------------
   LOAD ALL DASHBOARD DATA
------------------------------------------------------ */

async function loadDashboardData() {
    showDashboardLoading();

    try {
        const [
            studentsResponse,
            coursesResponse,
            enrollmentsResponse,
            attendanceResponse,
            examinationsResponse,
            resultsResponse
        ] = await Promise.all([
            fetchWithAuth("/students"),

            fetchWithAuth("/courses"),

            fetchWithAuth("/enrollments"),

            fetchWithAuth("/attendance"),

            fetchWithAuth("/examinations"),

            fetchWithAuth("/results")
        ]);

        const students =
            getResponseArray(
                studentsResponse
            );

        const courses =
            getResponseArray(
                coursesResponse
            );

        const enrollments =
            getResponseArray(
                enrollmentsResponse
            );

        const attendance =
            getResponseArray(
                attendanceResponse
            );

        const examinations =
            getResponseArray(
                examinationsResponse
            );

        const results =
            getResponseArray(
                resultsResponse
            );

        renderSummaryCards(
            students,
            courses,
            enrollments,
            attendance
        );

        renderAcademicOverview(
            courses,
            enrollments,
            attendance
        );

        renderRecentActivity(
            enrollments,
            attendance,
            examinations,
            results
        );

    } catch (error) {
        console.error(
            "Unable to load dashboard:",
            error
        );

        showDashboardError(
            error.message ||
            "Unable to load dashboard information."
        );
    }
}


/* ------------------------------------------------------
   DASHBOARD ERROR STATE
------------------------------------------------------ */

function showDashboardError(message) {
    studentCount.textContent = "-";
    courseCount.textContent = "-";
    enrollmentCount.textContent = "-";
    attendanceRate.textContent = "-";

    academicOverviewBody.innerHTML = `
        <tr>
            <td
                colspan="6"
                class="text-center py-4 text-danger">

                ${escapeHTML(message)}

            </td>
        </tr>
    `;

    activityList.innerHTML = `
        <div class="activity-item">

            <div class="activity-icon result-activity">
                <i class="bi bi-exclamation-triangle-fill"></i>
            </div>

            <div class="activity-details">

                <strong>
                    Dashboard data could not be loaded
                </strong>

                <p>
                    ${escapeHTML(message)}
                </p>

            </div>

        </div>
    `;
}


/* ------------------------------------------------------
   MOBILE SIDEBAR
------------------------------------------------------ */

function openSidebar() {
    sidebar?.classList.add("show");

    sidebarOverlay?.classList.add("show");

    document.body.style.overflow =
        "hidden";
}


function closeSidebar() {
    sidebar?.classList.remove("show");

    sidebarOverlay?.classList.remove("show");

    document.body.style.overflow =
        "";
}


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


window.addEventListener(
    "resize",
    () => {
        if (window.innerWidth > 900) {
            closeSidebar();
        }
    }
);


/* ------------------------------------------------------
   LOGOUT
------------------------------------------------------ */

function logout() {
    if (
        typeof window.logoutUser ===
        "function"
    ) {
        logoutUser();
        return;
    }

    clearSession();
    window.location.replace(
        "login.html"
    );
}


sidebarLogoutButton?.addEventListener(
    "click",
    logout
);


topLogoutButton?.addEventListener(
    "click",
    logout
);


/* ------------------------------------------------------
   SAFE HTML OUTPUT
------------------------------------------------------ */

function escapeHTML(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* ------------------------------------------------------
   INITIAL PAGE LOAD
------------------------------------------------------ */

document.addEventListener(
    "DOMContentLoaded",
    async () => {
        const dashboardAllowed =
            protectDashboard();

        if (!dashboardAllowed) {
            return;
        }

        loadUserInformation();

        await loadDashboardData();
    }
);