"use strict";

/*
=========================================================
UNIVERSITY ERP SYSTEM
Dashboard Frontend Module

Current data source:
- localStorage
- Sample data

Future data source:
- Backend REST APIs

Planned endpoints:
GET /api/students
GET /api/courses
GET /api/enrollments
GET /api/attendance
=========================================================
*/

/* ------------------------------------------------------
   HTML ELEMENTS
------------------------------------------------------ */

const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");
const mobileMenuButton = document.getElementById("mobileMenuButton");
const sidebarCloseButton = document.getElementById(
    "sidebarCloseButton"
);

const sidebarLogoutButton = document.getElementById(
    "sidebarLogoutButton"
);

const topLogoutButton = document.getElementById(
    "topLogoutButton"
);

const sidebarUsername = document.getElementById(
    "sidebarUsername"
);

const sidebarRole = document.getElementById("sidebarRole");

const topUsername = document.getElementById("topUsername");
const topRole = document.getElementById("topRole");

const welcomeHeading = document.getElementById(
    "welcomeHeading"
);

const studentCount = document.getElementById(
    "studentCount"
);

const courseCount = document.getElementById(
    "courseCount"
);

const enrollmentCount = document.getElementById(
    "enrollmentCount"
);

const attendanceRate = document.getElementById(
    "attendanceRate"
);

const academicOverviewBody = document.getElementById(
    "academicOverviewBody"
);

/* ------------------------------------------------------
   SAMPLE DATA

   This data allows the dashboard to work before
   the backend is connected.
------------------------------------------------------ */

const defaultStudents = [
    {
        studentId: 1,
        registrationNumber: "UGC001",
        fullName: "Nimal Perera",
        email: "nimal@example.com",
        department: "Computing",
        academicYear: 1
    },
    {
        studentId: 2,
        registrationNumber: "UGC002",
        fullName: "Kamal Silva",
        email: "kamal@example.com",
        department: "Business",
        academicYear: 2
    },
    {
        studentId: 3,
        registrationNumber: "UGC003",
        fullName: "Saman Fernando",
        email: "saman@example.com",
        department: "Computing",
        academicYear: 1
    }
];

const defaultCourses = [
    {
        courseId: 1,
        courseCode: "CS101",
        courseName: "Programming Fundamentals",
        credits: 3,
        department: "Computing",
        studentCount: 48,
        attendanceRate: 91,
        status: "Active"
    },
    {
        courseId: 2,
        courseCode: "CS102",
        courseName: "Database Management Systems",
        credits: 3,
        department: "Computing",
        studentCount: 42,
        attendanceRate: 87,
        status: "Active"
    },
    {
        courseId: 3,
        courseCode: "BM101",
        courseName: "Business Management",
        credits: 3,
        department: "Business",
        studentCount: 55,
        attendanceRate: 84,
        status: "Active"
    },
    {
        courseId: 4,
        courseCode: "SE201",
        courseName: "Software Engineering",
        credits: 4,
        department: "Computing",
        studentCount: 39,
        attendanceRate: 89,
        status: "Upcoming"
    }
];

const defaultEnrollments = [
    {
        enrollmentId: 1,
        studentId: 1,
        courseId: 1
    },
    {
        enrollmentId: 2,
        studentId: 1,
        courseId: 2
    },
    {
        enrollmentId: 3,
        studentId: 2,
        courseId: 3
    },
    {
        enrollmentId: 4,
        studentId: 3,
        courseId: 1
    }
];

const defaultAttendance = [
    {
        attendanceId: 1,
        studentId: 1,
        courseId: 1,
        status: "Present"
    },
    {
        attendanceId: 2,
        studentId: 1,
        courseId: 2,
        status: "Present"
    },
    {
        attendanceId: 3,
        studentId: 2,
        courseId: 3,
        status: "Absent"
    },
    {
        attendanceId: 4,
        studentId: 3,
        courseId: 1,
        status: "Present"
    }
];

/* ------------------------------------------------------
   LOCAL STORAGE INITIALIZATION
------------------------------------------------------ */

function initializeLocalStorage() {
    if (!localStorage.getItem("students")) {
        localStorage.setItem(
            "students",
            JSON.stringify(defaultStudents)
        );
    }

    if (!localStorage.getItem("courses")) {
        localStorage.setItem(
            "courses",
            JSON.stringify(defaultCourses)
        );
    }

    if (!localStorage.getItem("enrollments")) {
        localStorage.setItem(
            "enrollments",
            JSON.stringify(defaultEnrollments)
        );
    }

    if (!localStorage.getItem("attendance")) {
        localStorage.setItem(
            "attendance",
            JSON.stringify(defaultAttendance)
        );
    }
}

/* ------------------------------------------------------
   LOGIN PROTECTION
------------------------------------------------------ */

function protectDashboard() {
    const isLoggedIn = localStorage.getItem("isLoggedIn");

    if (isLoggedIn !== "true") {
        window.location.replace("login.html");
    }
}

/* ------------------------------------------------------
   LOAD LOGGED-IN USER
------------------------------------------------------ */

function loadUserInformation() {
    const storedUser = localStorage.getItem("loggedUser");

    let user = {
        username: "Administrator",
        role: "System Admin"
    };

    if (storedUser) {
        try {
            user = JSON.parse(storedUser);
        } catch (error) {
            console.error(
                "Unable to read logged user:",
                error
            );
        }
    }

    const displayName =
        user.username === "admin"
            ? "Administrator"
            : user.username;

    const displayRole =
        user.role || "System Admin";

    sidebarUsername.textContent = displayName;
    sidebarRole.textContent = displayRole;

    topUsername.textContent = displayName;
    topRole.textContent = displayRole;

    welcomeHeading.textContent =
        `Welcome back, ${displayName}`;
}

/* ------------------------------------------------------
   LOAD DASHBOARD DATA
------------------------------------------------------ */

function loadDashboardStatistics() {
    const students = getStoredArray("students");
    const courses = getStoredArray("courses");
    const enrollments = getStoredArray("enrollments");
    const attendance = getStoredArray("attendance");

    studentCount.textContent = students.length;
    courseCount.textContent = courses.length;
    enrollmentCount.textContent = enrollments.length;

    attendanceRate.textContent =
        calculateAttendanceRate(attendance);
}

/* ------------------------------------------------------
   CALCULATE ATTENDANCE RATE
------------------------------------------------------ */

function calculateAttendanceRate(attendanceRecords) {
    if (attendanceRecords.length === 0) {
        return "0%";
    }

    const presentRecords = attendanceRecords.filter(
        (record) =>
            record.status.toLowerCase() === "present"
    );

    const rate = Math.round(
        (presentRecords.length /
            attendanceRecords.length) *
        100
    );

    return `${rate}%`;
}

/* ------------------------------------------------------
   LOAD ACADEMIC OVERVIEW TABLE
------------------------------------------------------ */

function loadAcademicOverview() {
    const courses = getStoredArray("courses");

    academicOverviewBody.innerHTML = "";

    if (courses.length === 0) {
        academicOverviewBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4">
                    No course records are available.
                </td>
            </tr>
        `;

        return;
    }

    courses.slice(0, 5).forEach((course) => {
        const statusClass =
            course.status === "Active"
                ? "active-status"
                : "pending-status";

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>
                <span class="course-code">
                    ${escapeHTML(course.courseCode)}
                </span>
            </td>

            <td>
                ${escapeHTML(course.courseName)}
            </td>

            <td>
                ${escapeHTML(course.department)}
            </td>

            <td>
                ${Number(course.studentCount) || 0}
            </td>

            <td>
                ${Number(course.attendanceRate) || 0}%
            </td>

            <td>
                <span class="status-badge ${statusClass}">
                    ${escapeHTML(course.status)}
                </span>
            </td>
        `;

        academicOverviewBody.appendChild(row);
    });
}

/* ------------------------------------------------------
   MOBILE SIDEBAR
------------------------------------------------------ */

function openSidebar() {
    sidebar.classList.add("show");
    sidebarOverlay.classList.add("show");
    document.body.style.overflow = "hidden";
}

function closeSidebar() {
    sidebar.classList.remove("show");
    sidebarOverlay.classList.remove("show");
    document.body.style.overflow = "";
}

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

window.addEventListener("resize", () => {
    if (window.innerWidth > 900) {
        closeSidebar();
    }
});

/* ------------------------------------------------------
   LOGOUT
------------------------------------------------------ */

function logout() {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("loggedUser");

    window.location.replace("login.html");
}

sidebarLogoutButton.addEventListener(
    "click",
    logout
);

topLogoutButton.addEventListener(
    "click",
    logout
);

/* ------------------------------------------------------
   HELPER FUNCTION: GET LOCAL STORAGE ARRAY
------------------------------------------------------ */

function getStoredArray(key) {
    const storedData = localStorage.getItem(key);

    if (!storedData) {
        return [];
    }

    try {
        const parsedData = JSON.parse(storedData);

        return Array.isArray(parsedData)
            ? parsedData
            : [];
    } catch (error) {
        console.error(
            `Unable to read ${key} from localStorage:`,
            error
        );

        return [];
    }
}

/* ------------------------------------------------------
   HELPER FUNCTION: SAFE HTML OUTPUT
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
   FUTURE BACKEND CONNECTION

   Later, this function can replace localStorage data.

   Planned endpoints:

   GET /api/students
   GET /api/courses
   GET /api/enrollments
   GET /api/attendance
------------------------------------------------------ */

/*
async function loadDashboardFromBackend() {
    const token = localStorage.getItem("token");

    try {
        const [
            studentsResponse,
            coursesResponse,
            enrollmentsResponse,
            attendanceResponse
        ] = await Promise.all([
            fetch("http://localhost:5000/api/students", {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }),

            fetch("http://localhost:5000/api/courses", {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }),

            fetch("http://localhost:5000/api/enrollments", {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }),

            fetch("http://localhost:5000/api/attendance", {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
        ]);

        const students = await studentsResponse.json();
        const courses = await coursesResponse.json();
        const enrollments =
            await enrollmentsResponse.json();
        const attendance =
            await attendanceResponse.json();

        studentCount.textContent = students.length;
        courseCount.textContent = courses.length;
        enrollmentCount.textContent =
            enrollments.length;

        attendanceRate.textContent =
            calculateAttendanceRate(attendance);

    } catch (error) {
        console.error(
            "Unable to load dashboard data:",
            error
        );
    }
}
*/

/* ------------------------------------------------------
   INITIAL PAGE LOAD
------------------------------------------------------ */

document.addEventListener(
    "DOMContentLoaded",
    () => {
        protectDashboard();
        initializeLocalStorage();
        loadUserInformation();
        loadDashboardStatistics();
        loadAcademicOverview();
    }
);