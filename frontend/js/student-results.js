"use strict";

/*
---------------------------------------------------
University ERP
Student Results Page

Uses existing backend endpoints:

GET /api/student-portal/profile
GET /api/student-portal/results
---------------------------------------------------
*/


/* ==================================================
   PAGE STATE
================================================== */

let results = [];
let filteredResults = [];
let currentStudent = null;


/* ==================================================
   HTML ELEMENTS
================================================== */

const resultsTableBody =
    document.getElementById("resultsTableBody");

const resultSearch =
    document.getElementById("resultSearch");

const semesterFilter =
    document.getElementById("semesterFilter");

const statusFilter =
    document.getElementById("statusFilter");

const clearFilterButton =
    document.getElementById("clearFilterButton");

const emptyState =
    document.getElementById("emptyState");

const loadingOverlay =
    document.getElementById("loadingOverlay");

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

const currentGpa =
    document.getElementById("currentGpa");

const passedCount =
    document.getElementById("passedCount");

const failedCount =
    document.getElementById("failedCount");

const totalResultsCount =
    document.getElementById("totalResultsCount");


/* ==================================================
   SHARED CONFIGURATION CHECK
================================================== */

if (typeof window.fetchWithAuth !== "function") {
    throw new Error(
        "config.js is missing. Load config.js before student-results.js."
    );
}


/* ==================================================
   PAGE INITIALIZATION
================================================== */

document.addEventListener(
    "DOMContentLoaded",
    initializeResultsPage
);

async function initializeResultsPage() {
    displayDate();
    initializeFilters();
    initializeSidebar();
    initializeLogout();

    try {
        showLoading();

        const [
            profileResponse,
            resultsResponse
        ] = await Promise.all([
            fetchWithAuth(
                "/student-portal/profile"
            ),

            fetchWithAuth(
                "/student-portal/results"
            )
        ]);

        currentStudent =
            normalizeStudent(
                profileResponse?.data
            );

        const rawResults =
            Array.isArray(resultsResponse?.data)
                ? resultsResponse.data
                : [];

        results =
            rawResults.map(
                normalizeResult
            );

        filteredResults = [
            ...results
        ];

        displayStudent(
            currentStudent
        );

        populateSemesterFilter(
            results
        );

        updateSummary();

        renderResults(
            filteredResults
        );

    } catch (error) {
        console.error(
            "Student results error:",
            error
        );

        renderResults([]);

        window.alert(
            error.message ||
            "Unable to load examination results."
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
        firstName,

        lastName,

        registrationNumber:
            profile.RegistrationNumber ||
            profile.registrationNumber ||
            "Not available"
    };
}


/* ==================================================
   NORMALIZE RESULT DATA
================================================== */

function normalizeResult(result = {}) {
    const marks =
        Number(
            result.Marks ??
            result.marks
        ) || 0;

    const grade =
        String(
            result.Grade ||
            result.grade ||
            "N/A"
        ).toUpperCase();

    const examinationDate =
        result.ExaminationDate ||
        result.examinationDate ||
        null;

    return {
        resultId:
            result.ResultID ??
            result.resultId ??
            null,

        courseCode:
            result.CourseCode ||
            result.courseCode ||
            "N/A",

        courseName:
            result.CourseName ||
            result.courseName ||
            "Unnamed Course",

        credits:
            Number(
                result.Credits ??
                result.credits
            ) || 0,

        marks,

        grade,

        gradePoint:
            getGradePoint(grade),

        status:
            marks >= 40
                ? "Pass"
                : "Fail",

        semester:
            getSemesterFromDate(
                examinationDate
            ),

        examinationDate
    };
}


/* ==================================================
   STUDENT INFORMATION
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
   SEMESTER FILTER
================================================== */

function populateSemesterFilter(items) {
    if (!semesterFilter) {
        return;
    }

    const semesters =
        [
            ...new Set(
                items
                    .map(
                        (item) =>
                            item.semester
                    )
                    .filter(Boolean)
            )
        ];

    semesterFilter.innerHTML =
        '<option value="">All semesters</option>';

    semesters.forEach(
        (semester) => {
            const option =
                document.createElement(
                    "option"
                );

            option.value =
                semester;

            option.textContent =
                semester;

            semesterFilter.appendChild(
                option
            );
        }
    );
}
/* ==================================================
   RESULT SUMMARY
================================================== */

function updateSummary() {
    const passed =
        results.filter(
            (item) =>
                item.status === "Pass"
        ).length;

    const failed =
        results.filter(
            (item) =>
                item.status === "Fail"
        ).length;

    const validGradePoints =
        results.filter(
            (item) =>
                Number.isFinite(
                    item.gradePoint
                )
        );

    const totalGradePoints =
        validGradePoints.reduce(
            (total, item) =>
                total +
                item.gradePoint *
                (
                    item.credits > 0
                        ? item.credits
                        : 1
                ),
            0
        );

    const totalCredits =
        validGradePoints.reduce(
            (total, item) =>
                total +
                (
                    item.credits > 0
                        ? item.credits
                        : 1
                ),
            0
        );

    const gpa =
        totalCredits > 0
            ? totalGradePoints /
            totalCredits
            : 0;

    setText(
        currentGpa,
        gpa.toFixed(2)
    );

    setText(
        passedCount,
        passed
    );

    setText(
        failedCount,
        failed
    );

    setText(
        totalResultsCount,
        results.length
    );
}


/* ==================================================
   FILTER INITIALIZATION
================================================== */

function initializeFilters() {
    resultSearch?.addEventListener(
        "input",
        filterResults
    );

    semesterFilter?.addEventListener(
        "change",
        filterResults
    );

    statusFilter?.addEventListener(
        "change",
        filterResults
    );

    clearFilterButton?.addEventListener(
        "click",
        clearResultFilters
    );
}


/* ==================================================
   FILTER RESULTS
================================================== */

function filterResults() {
    const search =
        resultSearch
            ?.value
            .trim()
            .toLowerCase() || "";

    const semester =
        semesterFilter?.value || "";

    const status =
        statusFilter?.value || "";

    filteredResults =
        results.filter(
            (item) => {
                const matchesSearch =
                    search === "" ||
                    item.courseCode
                        .toLowerCase()
                        .includes(search) ||
                    item.courseName
                        .toLowerCase()
                        .includes(search);

                const matchesSemester =
                    semester === "" ||
                    item.semester ===
                    semester;

                const matchesStatus =
                    status === "" ||
                    item.status ===
                    status;

                return (
                    matchesSearch &&
                    matchesSemester &&
                    matchesStatus
                );
            }
        );

    renderResults(
        filteredResults
    );
}


/* ==================================================
   CLEAR FILTERS
================================================== */

function clearResultFilters() {
    if (resultSearch) {
        resultSearch.value = "";
    }

    if (semesterFilter) {
        semesterFilter.value = "";
    }

    if (statusFilter) {
        statusFilter.value = "";
    }

    filteredResults = [
        ...results
    ];

    renderResults(
        filteredResults
    );

    resultSearch?.focus();
}


/* ==================================================
   RENDER RESULTS
================================================== */

function renderResults(items) {
    if (!resultsTableBody) {
        return;
    }

    resultsTableBody.replaceChildren();

    if (items.length === 0) {
        emptyState?.classList.remove(
            "d-none"
        );

        return;
    }

    emptyState?.classList.add(
        "d-none"
    );

    items.forEach(
        (item) => {
            const row =
                document.createElement(
                    "tr"
                );

            const statusClass =
                item.status === "Pass"
                    ? "status-pass"
                    : "status-fail";

            row.innerHTML = `
                <td>
                    <span class="course-name">
                        ${escapeHtml(item.courseName)}
                    </span>

                    <span class="course-code">
                        ${escapeHtml(item.courseCode)}
                    </span>
                </td>

                <td>
                    ${escapeHtml(item.semester)}
                </td>

                <td>
                    ${escapeHtml(item.credits)}
                </td>

                <td>
                    ${escapeHtml(item.marks)}%
                </td>

                <td>
                    <span class="grade-badge">
                        ${escapeHtml(item.grade)}
                    </span>
                </td>

                <td>
                    <span class="status-badge ${statusClass}">
                        ${escapeHtml(item.status)}
                    </span>
                </td>
            `;

            resultsTableBody.appendChild(
                row
            );
        }
    );
}


/* ==================================================
   GRADE HELPERS
================================================== */

function getGradePoint(grade) {
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

    return gradePoints[grade] ?? 0;
}

function getSemesterFromDate(
    dateValue
) {
    if (!dateValue) {
        return "Not available";
    }

    const date =
        new Date(dateValue);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "Not available";
    }

    const month =
        date.getMonth() + 1;

    return month <= 6
        ? "Semester 01"
        : "Semester 02";
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
        (event) => {
            if (event.key === "Escape") {
                closeSidebar();
            }
        }
    );

    window.addEventListener(
        "resize",
        () => {
            if (window.innerWidth > 900) {
                closeSidebar();
            }
        }
    );
}

function openSidebar() {
    studentSidebar?.classList.add("open");
    sidebarOverlay?.classList.add("show");
    document.body.style.overflow = "hidden";
}

function closeSidebar() {
    studentSidebar?.classList.remove("open");
    sidebarOverlay?.classList.remove("show");
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
    const modalElement =
        document.getElementById(
            "logoutModal"
        );

    if (
        !modalElement ||
        typeof bootstrap === "undefined"
    ) {
        logoutStudent();
        return;
    }

    bootstrap.Modal
        .getOrCreateInstance(
            modalElement
        )
        .show();
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


/* ==================================================
   LOADING
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
   HELPERS
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
    const first =
        firstName
            ? firstName.charAt(0)
            : "";

    const last =
        lastName
            ? lastName.charAt(0)
            : "";

    return (
        `${first}${last}`
            .toUpperCase() ||
        "ST"
    );
}

function escapeHtml(value) {
    const element =
        document.createElement("div");

    element.textContent =
        value === undefined ||
            value === null
            ? ""
            : String(value);

    return element.innerHTML;
}