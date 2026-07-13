"use strict";

/*
 * University ERP Student Dashboard
 *
 * This version uses sample frontend data.
 * The sample data can later be replaced with backend API data.
 */

/* =====================================
   CONFIGURATION
===================================== */

const API_BASE_URL = "http://localhost:5001/api";

/*
 * Keep this true while the backend is not ready.
 *
 * Change it to false when the backend API is ready.
 */
const USE_MOCK_DATA = true;

/* =====================================
   SAMPLE DASHBOARD DATA
===================================== */

const mockDashboardData = {
    student: {
        studentId: "STU2026001",
        firstName: "Vibhavi",
        lastName: "Kahandawaarachchi",
        programme: "BSc (Hons) in Software Engineering",
        semester: "Semester 02"
    },

    summary: {
        enrolledCourses: 5,
        attendancePercentage: 87,
        upcomingExams: 3,
        currentGpa: 3.62
    },

    todaySchedule: [
        {
            courseCode: "SE2031",
            courseName: "Data Structures and Algorithms",
            startTime: "08:30 AM",
            endTime: "10:30 AM",
            lecturer: "Dr. N. Perera",
            location: "Lab 03"
        },
        {
            courseCode: "SE2042",
            courseName: "Database Management Systems",
            startTime: "11:00 AM",
            endTime: "01:00 PM",
            lecturer: "Ms. A. Silva",
            location: "Hall B2"
        },
        {
            courseCode: "SE2051",
            courseName: "Human Computer Interaction",
            startTime: "02:00 PM",
            endTime: "04:00 PM",
            lecturer: "Mr. K. Fernando",
            location: "Lab 05"
        }
    ],

    upcomingExaminations: [
        {
            courseCode: "SE2031",
            courseName: "Data Structures and Algorithms",
            examType: "Midterm",
            date: "2026-07-18",
            time: "09:00 AM",
            location: "Examination Hall A"
        },
        {
            courseCode: "SE2042",
            courseName: "Database Management Systems",
            examType: "Practical",
            date: "2026-07-22",
            time: "01:00 PM",
            location: "Computer Lab 02"
        },
        {
            courseCode: "SE2051",
            courseName: "Human Computer Interaction",
            examType: "Final",
            date: "2026-07-29",
            time: "10:00 AM",
            location: "Examination Hall B"
        }
    ],

    recentResults: [
        {
            courseCode: "SE2011",
            courseName: "Object Oriented Programming",
            marks: 82,
            grade: "A",
            status: "Pass"
        },
        {
            courseCode: "SE2022",
            courseName: "Computer Networks",
            marks: 75,
            grade: "A-",
            status: "Pass"
        },
        {
            courseCode: "BM2013",
            courseName: "Business Process Management",
            marks: 68,
            grade: "B+",
            status: "Pass"
        },
        {
            courseCode: "SE2062",
            courseName: "Operating Systems",
            marks: 61,
            grade: "B",
            status: "Pass"
        }
    ]
};

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

    try {
        showLoading();

        const dashboardData =
            await getDashboardData();

        validateDashboardData(dashboardData);
        renderDashboard(dashboardData);

        hideError();
    } catch (error) {
        console.error(
            "Student Dashboard error:",
            error
        );

        showError(
            error.message ||
            "Unable to load Student Dashboard."
        );
    } finally {
        hideLoading();
    }
}

/* =====================================
   LOAD DASHBOARD DATA
===================================== */

async function getDashboardData() {
    if (USE_MOCK_DATA) {
        return loadMockDashboardData();
    }

    return fetchDashboardFromBackend();
}

function loadMockDashboardData() {
    return new Promise(function (resolve) {
        setTimeout(function () {
            resolve(mockDashboardData);
        }, 600);
    });
}

async function fetchDashboardFromBackend() {
    const token =
        localStorage.getItem("token") ||
        localStorage.getItem("authToken");

    if (!token) {
        throw new Error(
            "Authentication token was not found. Please login again."
        );
    }

    const response = await fetch(
        `${API_BASE_URL}/student/dashboard`,
        {
            method: "GET",

            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            }
        }
    );

    if (response.status === 401 ||
        response.status === 403) {
        throw new Error(
            "You are not authorized to access this page."
        );
    }

    if (!response.ok) {
        throw new Error(
            "The server could not load your dashboard information."
        );
    }

    return response.json();
}

/* =====================================
   VALIDATE DATA
===================================== */

function validateDashboardData(data) {
    if (!data || typeof data !== "object") {
        throw new Error(
            "Invalid dashboard information was received."
        );
    }

    if (!data.student) {
        throw new Error(
            "Student profile information is missing."
        );
    }

    if (!data.summary) {
        throw new Error(
            "Student summary information is missing."
        );
    }
}

/* =====================================
   RENDER COMPLETE DASHBOARD
===================================== */

function renderDashboard(data) {
    renderStudentInformation(data.student);
    renderSummary(data.summary);

    renderSchedule(
        Array.isArray(data.todaySchedule)
            ? data.todaySchedule
            : []
    );

    renderExaminations(
        Array.isArray(data.upcomingExaminations)
            ? data.upcomingExaminations
            : []
    );

    renderResults(
        Array.isArray(data.recentResults)
            ? data.recentResults
            : []
    );
}

/* =====================================
   CURRENT DATE
===================================== */

function displayCurrentDate() {
    const currentDate = new Date();

    currentDateElement.textContent =
        currentDate.toLocaleDateString(
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
        student.firstName || "Student";

    const lastName =
        student.lastName || "";

    const fullName =
        `${firstName} ${lastName}`.trim();

    const studentId =
        student.studentId || "Not available";

    const programme =
        student.programme || "Not available";

    const semester =
        student.semester || "Not available";

    const initials =
        createInitials(firstName, lastName);

    sidebarStudentAvatar.textContent = initials;
    topStudentAvatar.textContent = initials;

    sidebarStudentName.textContent = fullName;
    topStudentName.textContent = fullName;

    sidebarStudentId.textContent = studentId;
    topStudentId.textContent = studentId;

    welcomeStudentName.textContent = firstName;

    studentProgramme.textContent = programme;
    studentSemester.textContent = semester;

    profileStudentId.textContent = studentId;
    profileStudentName.textContent = fullName;
    profileProgramme.textContent = programme;
    profileSemester.textContent = semester;
}

/* =====================================
   SUMMARY CARDS
===================================== */

function renderSummary(summary) {
    const enrolledCourses =
        Number(summary.enrolledCourses) || 0;

    const attendance =
        Number(summary.attendancePercentage) || 0;

    const upcomingExams =
        Number(summary.upcomingExams) || 0;

    const gpa =
        Number(summary.currentGpa) || 0;

    enrolledCoursesCount.textContent =
        enrolledCourses;

    attendancePercentage.textContent =
        `${attendance}%`;

    upcomingExamCount.textContent =
        upcomingExams;

    currentGpa.textContent =
        gpa.toFixed(2);

    updateAttendanceStatus(attendance);
}

function updateAttendanceStatus(percentage) {
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
        "Low attendance warning";

    attendanceStatus.style.color =
        "#dc2626";
}

/* =====================================
   TODAY'S SCHEDULE
===================================== */

function renderSchedule(scheduleItems) {
    scheduleList.innerHTML = "";

    if (scheduleItems.length === 0) {
        scheduleEmptyState.classList.remove("d-none");
        return;
    }

    scheduleEmptyState.classList.add("d-none");

    scheduleItems.forEach(function (schedule) {
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

        scheduleList.appendChild(scheduleItem);
    });
}

/* =====================================
   UPCOMING EXAMINATIONS
===================================== */

function renderExaminations(examinations) {
    examinationList.innerHTML = "";

    if (examinations.length === 0) {
        examinationEmptyState
            .classList
            .remove("d-none");

        return;
    }

    examinationEmptyState
        .classList
        .add("d-none");

    examinations
        .slice(0, 3)
        .forEach(function (examination) {
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
        new Date(`${dateValue}T00:00:00`);

    if (Number.isNaN(
        examinationDate.getTime()
    )) {
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
    resultsTableBody.innerHTML = "";

    if (results.length === 0) {
        resultsEmptyState
            .classList
            .remove("d-none");

        return;
    }

    resultsEmptyState
        .classList
        .add("d-none");

    results.forEach(function (result) {
        const tableRow =
            document.createElement("tr");

        const status =
            String(result.status || "");

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
                <span
                    class="status-badge ${statusClass}"
                >
                    ${escapeHtml(status)}
                </span>
            </td>
        `;

        resultsTableBody.appendChild(tableRow);
    });
}

/* =====================================
   MOBILE SIDEBAR
===================================== */

function initializeSidebar() {
    mobileMenuButton.addEventListener(
        "click",
        openSidebar
    );

    sidebarCloseButton.addEventListener(
        "click",
        closeSidebar
    );

    sidebarOverlay.addEventListener(
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
    studentSidebar.classList.add("open");
    sidebarOverlay.classList.add("show");

    mobileMenuButton.setAttribute(
        "aria-expanded",
        "true"
    );

    document.body.style.overflow = "hidden";
}

function closeSidebar() {
    studentSidebar.classList.remove("open");
    sidebarOverlay.classList.remove("show");

    mobileMenuButton.setAttribute(
        "aria-expanded",
        "false"
    );

    document.body.style.overflow = "";
}

/* =====================================
   LOGOUT
===================================== */

function initializeLogout() {
    sidebarLogoutButton.addEventListener(
        "click",
        openLogoutModal
    );

    topLogoutButton.addEventListener(
        "click",
        openLogoutModal
    );

    confirmLogoutButton.addEventListener(
        "click",
        logoutStudent
    );
}

function openLogoutModal() {
    const logoutModalElement =
        document.getElementById("logoutModal");

    const logoutModal =
        bootstrap.Modal.getOrCreateInstance(
            logoutModalElement
        );

    logoutModal.show();
}

function logoutStudent() {
    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    localStorage.removeItem("loggedUser");
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("loggedInStudent");
    localStorage.removeItem("isLoggedIn");

    /*
     * Change login.html below if your login page
     * uses a different filename.
     */
    window.location.href = "login.html";
}

/* =====================================
   LOADING AND ERROR STATES
===================================== */

function showLoading() {
    loadingOverlay.classList.remove("hidden");
}

function hideLoading() {
    loadingOverlay.classList.add("hidden");
}

function showError(message) {
    dashboardErrorMessage.textContent =
        message;

    dashboardError.classList.remove("d-none");
}

function hideError() {
    dashboardError.classList.add("d-none");
}

/* =====================================
   HELPER FUNCTIONS
===================================== */

function createInitials(firstName, lastName) {
    const firstInitial =
        firstName
            ? firstName.charAt(0)
            : "";

    const lastInitial =
        lastName
            ? lastName.charAt(0)
            : "";

    return `${firstInitial}${lastInitial}`
        .toUpperCase() || "ST";
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