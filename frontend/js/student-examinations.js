"use strict";

/*
---------------------------------------------------
University ERP
Student Examinations Page

Uses existing backend endpoints:

GET /api/student-portal/profile
GET /api/student-portal/examinations
---------------------------------------------------
*/


/* ==================================================
   PAGE STATE
================================================== */

let examinations = [];
let filteredExams = [];
let currentStudent = null;


/* ==================================================
   HTML ELEMENTS
================================================== */

const examGrid =
    document.getElementById("examGrid");

const examSearch =
    document.getElementById("examSearch");

const examStatusFilter =
    document.getElementById("examStatusFilter");

const examTypeFilter =
    document.getElementById("examTypeFilter");

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

const totalExamCount =
    document.getElementById("totalExamCount");

const upcomingExamCount =
    document.getElementById("upcomingExamCount");

const completedExamCount =
    document.getElementById("completedExamCount");

const modalExamTitle =
    document.getElementById("modalExamTitle");

const modalExamBody =
    document.getElementById("modalExamBody");


/* ==================================================
   SHARED CONFIGURATION CHECK
================================================== */

if (typeof window.fetchWithAuth !== "function") {
    throw new Error(
        "config.js is missing. Load config.js before student-examinations.js."
    );
}


/* ==================================================
   PAGE INITIALIZATION
================================================== */

document.addEventListener(
    "DOMContentLoaded",
    initializeExaminationsPage
);

async function initializeExaminationsPage() {
    displayDate();
    initializeFilters();
    initializeSidebar();
    initializeLogout();

    try {
        showLoading();

        const [
            profileResponse,
            examinationsResponse
        ] = await Promise.all([
            fetchWithAuth(
                "/student-portal/profile"
            ),

            fetchWithAuth(
                "/student-portal/examinations"
            )
        ]);

        currentStudent =
            normalizeStudent(
                profileResponse?.data
            );

        const rawExaminations =
            Array.isArray(examinationsResponse?.data)
                ? examinationsResponse.data
                : [];

        examinations =
            rawExaminations
                .map(normalizeExamination)
                .sort(
                    (firstExam, secondExam) =>
                        new Date(firstExam.date) -
                        new Date(secondExam.date)
                );

        filteredExams = [
            ...examinations
        ];

        displayStudent(
            currentStudent
        );

        populateExamTypeFilter(
            examinations
        );

        updateSummary();

        renderExams(
            filteredExams
        );

    } catch (error) {
        console.error(
            "Student examinations error:",
            error
        );

        renderExams([]);

        window.alert(
            error.message ||
            "Unable to load examinations."
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
   NORMALIZE EXAMINATION DATA
================================================== */

function normalizeExamination(examination = {}) {
    const dateValue =
        examination.ExaminationDate ||
        examination.examinationDate ||
        null;

    const examinationName =
        examination.ExaminationName ||
        examination.examinationName ||
        "Examination";

    return {
        examId:
            examination.ExaminationID ??
            examination.examinationId ??
            null,

        courseCode:
            examination.CourseCode ||
            examination.courseCode ||
            "N/A",

        courseName:
            examination.CourseName ||
            examination.courseName ||
            "Unnamed Course",

        examType:
            examinationName,

        date:
            dateValue,

        status:
            getExamStatus(
                dateValue
            ),

        time:
            examination.ExaminationTime ||
            examination.examinationTime ||
            "Time not available",

        location:
            examination.Location ||
            examination.location ||
            "Location not available",

        instructions:
            examination.Instructions ||
            examination.instructions ||
            "No additional instructions are available."
    };
}


/* ==================================================
   EXAMINATION STATUS
================================================== */

function getExamStatus(dateValue) {
    if (!dateValue) {
        return "Upcoming";
    }

    const examDate =
        new Date(dateValue);

    const today =
        new Date();

    today.setHours(
        0,
        0,
        0,
        0
    );

    examDate.setHours(
        0,
        0,
        0,
        0
    );

    return examDate >= today
        ? "Upcoming"
        : "Completed";
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
   DYNAMIC EXAM TYPE FILTER
================================================== */

function populateExamTypeFilter(items) {
    if (!examTypeFilter) {
        return;
    }

    const examTypes =
        [
            ...new Set(
                items
                    .map(
                        (item) =>
                            item.examType
                    )
                    .filter(Boolean)
            )
        ];

    examTypeFilter.innerHTML =
        '<option value="">All exam types</option>';

    examTypes.forEach(
        (examType) => {
            const option =
                document.createElement(
                    "option"
                );

            option.value =
                examType;

            option.textContent =
                examType;

            examTypeFilter.appendChild(
                option
            );
        }
    );
}
/* ==================================================
   SUMMARY
================================================== */

function updateSummary() {
    const total =
        examinations.length;

    const upcoming =
        examinations.filter(
            (exam) =>
                exam.status === "Upcoming"
        ).length;

    const completed =
        examinations.filter(
            (exam) =>
                exam.status === "Completed"
        ).length;

    setText(
        totalExamCount,
        total
    );

    setText(
        upcomingExamCount,
        upcoming
    );

    setText(
        completedExamCount,
        completed
    );
}


/* ==================================================
   FILTER INITIALIZATION
================================================== */

function initializeFilters() {
    examSearch?.addEventListener(
        "input",
        filterExams
    );

    examStatusFilter?.addEventListener(
        "change",
        filterExams
    );

    examTypeFilter?.addEventListener(
        "change",
        filterExams
    );

    clearFilterButton?.addEventListener(
        "click",
        clearExamFilters
    );
}


/* ==================================================
   FILTER EXAMINATIONS
================================================== */

function filterExams() {
    const search =
        examSearch
            ?.value
            .trim()
            .toLowerCase() || "";

    const status =
        examStatusFilter?.value || "";

    const type =
        examTypeFilter?.value || "";

    filteredExams =
        examinations.filter(
            (exam) => {
                const matchesSearch =
                    search === "" ||
                    exam.courseCode
                        .toLowerCase()
                        .includes(search) ||
                    exam.courseName
                        .toLowerCase()
                        .includes(search);

                const matchesStatus =
                    status === "" ||
                    exam.status ===
                    status;

                const matchesType =
                    type === "" ||
                    exam.examType ===
                    type;

                return (
                    matchesSearch &&
                    matchesStatus &&
                    matchesType
                );
            }
        );

    renderExams(
        filteredExams
    );
}


/* ==================================================
   CLEAR FILTERS
================================================== */

function clearExamFilters() {
    if (examSearch) {
        examSearch.value = "";
    }

    if (examStatusFilter) {
        examStatusFilter.value = "";
    }

    if (examTypeFilter) {
        examTypeFilter.value = "";
    }

    filteredExams = [
        ...examinations
    ];

    renderExams(
        filteredExams
    );

    examSearch?.focus();
}


/* ==================================================
   RENDER EXAMINATION CARDS
================================================== */

function renderExams(exams) {
    if (!examGrid) {
        return;
    }

    examGrid.replaceChildren();

    if (exams.length === 0) {
        emptyState?.classList.remove(
            "d-none"
        );

        return;
    }

    emptyState?.classList.add(
        "d-none"
    );

    exams.forEach(
        (exam) => {
            const card =
                document.createElement(
                    "article"
                );

            card.className =
                "exam-card";

            const statusClass =
                exam.status.toLowerCase();

            card.innerHTML = `
                <div class="exam-card-header">

                    <span class="course-code">
                        ${escapeHtml(exam.courseCode)}
                    </span>

                    <span class="exam-status ${statusClass}">
                        ${escapeHtml(exam.status)}
                    </span>

                </div>

                <h3>
                    ${escapeHtml(exam.courseName)}
                </h3>

                <span class="exam-type">
                    ${escapeHtml(exam.examType)}
                </span>

                <div class="exam-details">

                    <div class="exam-detail">
                        <i class="bi bi-calendar-event"></i>

                        <span>
                            ${escapeHtml(formatDate(exam.date))}
                        </span>
                    </div>

                    <div class="exam-detail">
                        <i class="bi bi-clock-fill"></i>

                        <span>
                            ${escapeHtml(exam.time)}
                        </span>
                    </div>

                    <div class="exam-detail">
                        <i class="bi bi-geo-alt-fill"></i>

                        <span>
                            ${escapeHtml(exam.location)}
                        </span>
                    </div>

                </div>

                <button
                    type="button"
                    data-exam-id="${escapeHtml(exam.examId)}"
                >
                    <i class="bi bi-eye-fill"></i>
                    View Details
                </button>
            `;

            const detailsButton =
                card.querySelector(
                    "button"
                );

            detailsButton?.addEventListener(
                "click",
                () => {
                    showExamDetails(
                        exam.examId
                    );
                }
            );

            examGrid.appendChild(
                card
            );
        }
    );
}


/* ==================================================
   EXAMINATION DETAILS MODAL
================================================== */

function showExamDetails(examId) {
    const exam =
        examinations.find(
            (item) =>
                String(item.examId) ===
                String(examId)
        );

    if (!exam) {
        return;
    }

    setText(
        modalExamTitle,
        `${exam.courseCode} - ${exam.courseName}`
    );

    if (modalExamBody) {
        modalExamBody.innerHTML = `
            <div class="exam-modal-detail">
                <i class="bi bi-file-earmark-text-fill"></i>

                <span>
                    <strong>Type:</strong>
                    ${escapeHtml(exam.examType)}
                </span>
            </div>

            <div class="exam-modal-detail">
                <i class="bi bi-calendar-event"></i>

                <span>
                    <strong>Date:</strong>
                    ${escapeHtml(formatDate(exam.date))}
                </span>
            </div>

            <div class="exam-modal-detail">
                <i class="bi bi-clock-fill"></i>

                <span>
                    <strong>Time:</strong>
                    ${escapeHtml(exam.time)}
                </span>
            </div>

            <div class="exam-modal-detail">
                <i class="bi bi-geo-alt-fill"></i>

                <span>
                    <strong>Location:</strong>
                    ${escapeHtml(exam.location)}
                </span>
            </div>

            <div class="exam-modal-detail">
                <i class="bi bi-info-circle-fill"></i>

                <span>
                    <strong>Status:</strong>
                    ${escapeHtml(exam.status)}
                </span>
            </div>

            <div class="exam-instructions">
                <strong>
                    Important Instructions
                </strong>

                <p class="mb-0 mt-2">
                    ${escapeHtml(exam.instructions)}
                </p>
            </div>
        `;
    }

    const modalElement =
        document.getElementById(
            "examDetailsModal"
        );

    if (
        modalElement &&
        typeof bootstrap !== "undefined"
    ) {
        bootstrap.Modal
            .getOrCreateInstance(
                modalElement
            )
            .show();
    }
}


/* ==================================================
   DATE FORMATTER
================================================== */

function formatDate(dateValue) {
    if (!dateValue) {
        return "Date not available";
    }

    const date =
        new Date(dateValue);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "Date not available";
    }

    return date.toLocaleDateString(
        "en-US",
        {
            year: "numeric",
            month: "long",
            day: "numeric"
        }
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