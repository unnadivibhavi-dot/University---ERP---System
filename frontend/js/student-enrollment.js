"use strict";

/*
---------------------------------------------------
University ERP
Student Enrollment Page

Uses existing backend endpoints:

GET    /api/student-portal/profile
GET    /api/student-portal/courses
DELETE /api/enrollments/:enrollmentId
---------------------------------------------------
*/


/* ==================================================
   PAGE STATE
================================================== */

let allEnrollments = [];
let filteredEnrollments = [];
let selectedEnrollmentId = null;
let currentStudent = null;


/* ==================================================
   HTML ELEMENTS
================================================== */

const elements = {
    sidebar:
        document.getElementById(
            "studentSidebar"
        ),

    overlay:
        document.getElementById(
            "sidebarOverlay"
        ),

    menuButton:
        document.getElementById(
            "menuButton"
        ),

    closeButton:
        document.getElementById(
            "sidebarCloseButton"
        ),

    currentDate:
        document.getElementById(
            "currentDate"
        ),

    sidebarAvatar:
        document.getElementById(
            "sidebarAvatar"
        ),

    sidebarStudentName:
        document.getElementById(
            "sidebarStudentName"
        ),

    sidebarStudentId:
        document.getElementById(
            "sidebarStudentId"
        ),

    topAvatar:
        document.getElementById(
            "topAvatar"
        ),

    topStudentName:
        document.getElementById(
            "topStudentName"
        ),

    topStudentId:
        document.getElementById(
            "topStudentId"
        ),

    totalEnrollments:
        document.getElementById(
            "totalEnrollmentsCount"
        ),

    activeEnrollments:
        document.getElementById(
            "activeEnrollmentsCount"
        ),

    totalCredits:
        document.getElementById(
            "totalCreditsCount"
        ),

    visibleEnrollments:
        document.getElementById(
            "visibleEnrollmentCount"
        ),

    searchInput:
        document.getElementById(
            "enrollmentSearchInput"
        ),

    semesterFilter:
        document.getElementById(
            "semesterFilter"
        ),

    statusFilter:
        document.getElementById(
            "statusFilter"
        ),

    clearFiltersButton:
        document.getElementById(
            "clearFiltersButton"
        ),

    enrollmentsGrid:
        document.getElementById(
            "enrollmentsGrid"
        ),

    emptyState:
        document.getElementById(
            "enrollmentsEmptyState"
        ),

    loadingOverlay:
        document.getElementById(
            "loadingOverlay"
        ),

    errorBox:
        document.getElementById(
            "pageError"
        ),

    errorMessage:
        document.getElementById(
            "pageErrorMessage"
        ),

    selectedEnrollmentCourse:
        document.getElementById(
            "selectedEnrollmentCourse"
        ),

    confirmRemoveButton:
        document.getElementById(
            "confirmRemoveButton"
        ),

    logoutButton:
        document.getElementById(
            "logoutButton"
        ),

    topLogoutButton:
        document.getElementById(
            "topLogoutButton"
        ),

    confirmLogoutButton:
        document.getElementById(
            "confirmLogoutButton"
        )
};


/* ==================================================
   SHARED CONFIGURATION CHECK
================================================== */

if (
    typeof window.fetchWithAuth !==
    "function"
) {
    throw new Error(
        "config.js is missing. Load config.js before student-enrollment.js."
    );
}


/* ==================================================
   INITIALIZATION
================================================== */

document.addEventListener(
    "DOMContentLoaded",
    initializeEnrollmentPage
);

async function initializeEnrollmentPage() {
    displayCurrentDate();
    initializeFilters();
    initializeSidebar();
    initializeRemoveEnrollment();
    initializeLogout();

    try {
        showLoading();
        hideError();

        const [
            profileResponse,
            coursesResponse
        ] = await Promise.all([
            fetchWithAuth(
                "/student-portal/profile"
            ),

            fetchWithAuth(
                "/student-portal/courses"
            )
        ]);

        currentStudent =
            normalizeStudent(
                profileResponse?.data
            );

        const rawEnrollments =
            Array.isArray(
                coursesResponse?.data
            )
                ? coursesResponse.data
                : [];

        allEnrollments =
            rawEnrollments.map(
                normalizeEnrollment
            );

        filteredEnrollments = [
            ...allEnrollments
        ];

        displayStudentInformation(
            currentStudent
        );

        populateSemesterFilter(
            allEnrollments
        );

        updateSummary();

        renderEnrollments(
            filteredEnrollments
        );

    } catch (error) {
        console.error(
            "Enrollment page error:",
            error
        );

        showError(
            error.message ||
            "Unable to load your enrollments."
        );

        renderEnrollments([]);
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
   NORMALIZE ENROLLMENT DATA
================================================== */

function normalizeEnrollment(item = {}) {
    const enrollmentDate =
        item.EnrollmentDate ||
        item.enrollmentDate ||
        null;

    return {
        enrollmentId:
            item.EnrollmentID ??
            item.enrollmentId ??
            null,

        courseId:
            item.CourseID ??
            item.courseId ??
            null,

        courseCode:
            item.CourseCode ||
            item.courseCode ||
            "N/A",

        courseName:
            item.CourseName ||
            item.courseName ||
            "Unnamed Course",

        description:
            item.Description ||
            item.description ||
            "Course description is not available.",

        semester:
            item.Semester ||
            item.semester ||
            getSemesterFromDate(
                enrollmentDate
            ),

        credits:
            Number(
                item.Credits ??
                item.credits
            ) || 0,

        lecturer:
            item.LecturerName ||
            item.lecturer ||
            "Not assigned",

        schedule:
            item.Schedule ||
            item.schedule ||
            "Schedule not available",

        location:
            item.Location ||
            item.location ||
            "Location not available",

        status:
            item.Status ||
            item.status ||
            "Active",

        canRemove:
            Boolean(
                item.EnrollmentID ??
                item.enrollmentId
            ),

        enrollmentDate
    };
}


/* ==================================================
   DATE AND STUDENT INFORMATION
================================================== */

function displayCurrentDate() {
    if (!elements.currentDate) {
        return;
    }

    elements.currentDate.textContent =
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

function displayStudentInformation(
    student
) {
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
        elements.sidebarAvatar,
        initials
    );

    setText(
        elements.topAvatar,
        initials
    );

    setText(
        elements.sidebarStudentName,
        fullName
    );

    setText(
        elements.topStudentName,
        fullName
    );

    setText(
        elements.sidebarStudentId,
        registrationNumber
    );

    setText(
        elements.topStudentId,
        registrationNumber
    );
}


/* ==================================================
   SEMESTER FILTER
================================================== */

function populateSemesterFilter(items) {
    if (!elements.semesterFilter) {
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

    elements.semesterFilter.innerHTML =
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

            elements.semesterFilter
                .appendChild(option);
        }
    );
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
   SUMMARY
================================================== */

function updateSummary() {
    const activeEnrollments =
        allEnrollments.filter(
            (item) =>
                String(
                    item.status || ""
                ).toLowerCase() ===
                "active"
        );

    const totalCredits =
        activeEnrollments.reduce(
            (total, item) =>
                total +
                (
                    Number(
                        item.credits
                    ) || 0
                ),
            0
        );

    setText(
        elements.totalEnrollments,
        allEnrollments.length
    );

    setText(
        elements.activeEnrollments,
        activeEnrollments.length
    );

    setText(
        elements.totalCredits,
        totalCredits
    );
}


/* ==================================================
   FILTER INITIALIZATION
================================================== */

function initializeFilters() {
    elements.searchInput?.addEventListener(
        "input",
        applyFilters
    );

    elements.semesterFilter?.addEventListener(
        "change",
        applyFilters
    );

    elements.statusFilter?.addEventListener(
        "change",
        applyFilters
    );

    elements.clearFiltersButton?.addEventListener(
        "click",
        clearFilters
    );
}


/* ==================================================
   APPLY FILTERS
================================================== */

function applyFilters() {
    const searchValue =
        elements.searchInput
            ?.value
            .trim()
            .toLowerCase() || "";

    const semesterValue =
        elements.semesterFilter
            ?.value || "";

    const statusValue =
        elements.statusFilter
            ?.value || "";

    filteredEnrollments =
        allEnrollments.filter(
            (item) => {
                const courseCode =
                    String(
                        item.courseCode || ""
                    ).toLowerCase();

                const courseName =
                    String(
                        item.courseName || ""
                    ).toLowerCase();

                const matchesSearch =
                    searchValue === "" ||
                    courseCode.includes(
                        searchValue
                    ) ||
                    courseName.includes(
                        searchValue
                    );

                const matchesSemester =
                    semesterValue === "" ||
                    item.semester ===
                    semesterValue;

                const matchesStatus =
                    statusValue === "" ||
                    item.status ===
                    statusValue;

                return (
                    matchesSearch &&
                    matchesSemester &&
                    matchesStatus
                );
            }
        );

    renderEnrollments(
        filteredEnrollments
    );
}


/* ==================================================
   CLEAR FILTERS
================================================== */

function clearFilters() {
    if (elements.searchInput) {
        elements.searchInput.value = "";
    }

    if (elements.semesterFilter) {
        elements.semesterFilter.value = "";
    }

    if (elements.statusFilter) {
        elements.statusFilter.value = "";
    }

    filteredEnrollments = [
        ...allEnrollments
    ];

    renderEnrollments(
        filteredEnrollments
    );

    elements.searchInput?.focus();
}


/* ==================================================
   RENDER ENROLLMENTS
================================================== */

function renderEnrollments(
    enrollments
) {
    if (!elements.enrollmentsGrid) {
        return;
    }

    elements.enrollmentsGrid
        .replaceChildren();

    setText(
        elements.visibleEnrollments,
        enrollments.length
    );

    if (enrollments.length === 0) {
        elements.emptyState?.classList
            .remove("d-none");

        return;
    }

    elements.emptyState?.classList
        .add("d-none");

    enrollments.forEach(
        (item) => {
            const enrollmentCard =
                createEnrollmentCard(
                    item
                );

            elements.enrollmentsGrid
                .appendChild(
                    enrollmentCard
                );
        }
    );
}


/* ==================================================
   CREATE ENROLLMENT CARD
================================================== */

function createEnrollmentCard(item) {
    const card =
        document.createElement(
            "article"
        );

    card.className =
        "enrollment-card";

    const statusClass =
        String(
            item.status || ""
        ).toLowerCase() ===
            "completed"
            ? "completed"
            : "active";

    card.innerHTML = `
        <div class="card-header-row">

            <span class="course-code">
                ${escapeHtml(item.courseCode)}
            </span>

            <span class="status-badge ${statusClass}">
                ${escapeHtml(item.status)}
            </span>

        </div>

        <h3>
            ${escapeHtml(item.courseName)}
        </h3>

        <p class="course-description">
            ${escapeHtml(item.description)}
        </p>

        <div class="course-details">

            <div class="course-detail">
                <i class="bi bi-person-video3"></i>

                <span>
                    ${escapeHtml(item.lecturer)}
                </span>
            </div>

            <div class="course-detail">
                <i class="bi bi-calendar3"></i>

                <span>
                    ${escapeHtml(item.schedule)}
                </span>
            </div>

            <div class="course-detail">
                <i class="bi bi-geo-alt-fill"></i>

                <span>
                    ${escapeHtml(item.location)}
                </span>
            </div>

        </div>

        <div class="course-tags">

            <span class="tag">
                ${escapeHtml(item.semester)}
            </span>

            <span class="tag">
                ${escapeHtml(item.credits)} Credits
            </span>

        </div>

        <div class="card-actions">

            <button
                type="button"
                class="view-button"
            >
                <i class="bi bi-eye-fill"></i>
                Details
            </button>

            <button
                type="button"
                class="remove-button"
                ${item.canRemove ? "" : "disabled"}
            >
                <i class="bi bi-trash3-fill"></i>

                ${item.canRemove
            ? "Remove"
            : "Unavailable"
        }
            </button>

        </div>
    `;

    const viewButton =
        card.querySelector(
            ".view-button"
        );

    const removeButton =
        card.querySelector(
            ".remove-button"
        );

    viewButton?.addEventListener(
        "click",
        () => {
            showEnrollmentDetails(
                item
            );
        }
    );

    if (
        removeButton &&
        item.canRemove
    ) {
        removeButton.addEventListener(
            "click",
            () => {
                openRemoveModal(
                    item.enrollmentId
                );
            }
        );
    }

    return card;
}


/* ==================================================
   VIEW DETAILS
================================================== */

function showEnrollmentDetails(item) {
    window.alert(
        `${item.courseCode} - ${item.courseName}\n\n` +
        `Lecturer: ${item.lecturer}\n` +
        `Semester: ${item.semester}\n` +
        `Credits: ${item.credits}\n` +
        `Schedule: ${item.schedule}\n` +
        `Location: ${item.location}\n` +
        `Status: ${item.status}`
    );
}
/* ==================================================
   REMOVE ENROLLMENT
================================================== */

function initializeRemoveEnrollment() {
    elements.confirmRemoveButton?.addEventListener(
        "click",
        removeSelectedEnrollment
    );
}

function openRemoveModal(enrollmentId) {
    const selectedEnrollment =
        allEnrollments.find(
            (item) =>
                String(item.enrollmentId) ===
                String(enrollmentId)
        );

    if (!selectedEnrollment) {
        return;
    }

    selectedEnrollmentId =
        selectedEnrollment.enrollmentId;

    setText(
        elements.selectedEnrollmentCourse,
        `${selectedEnrollment.courseCode} - ${selectedEnrollment.courseName}`
    );

    const modalElement =
        document.getElementById(
            "removeEnrollmentModal"
        );

    if (
        !modalElement ||
        typeof bootstrap === "undefined"
    ) {
        removeSelectedEnrollment();
        return;
    }

    bootstrap.Modal
        .getOrCreateInstance(
            modalElement
        )
        .show();
}

async function removeSelectedEnrollment() {
    if (!selectedEnrollmentId) {
        return;
    }

    if (elements.confirmRemoveButton) {
        elements.confirmRemoveButton.disabled =
            true;

        elements.confirmRemoveButton.innerHTML = `
            <span
                class="spinner-border spinner-border-sm me-2"
                aria-hidden="true"
            ></span>
            Removing...
        `;
    }

    try {
        await fetchWithAuth(
            `/enrollments/${selectedEnrollmentId}`,
            {
                method: "DELETE"
            }
        );

        allEnrollments =
            allEnrollments.filter(
                (item) =>
                    String(item.enrollmentId) !==
                    String(selectedEnrollmentId)
            );

        updateSummary();
        applyFilters();
        closeRemoveModal();

        selectedEnrollmentId = null;
    } catch (error) {
        console.error(
            "Remove enrollment error:",
            error
        );

        window.alert(
            error.message ||
            "Unable to remove this enrollment."
        );
    } finally {
        if (elements.confirmRemoveButton) {
            elements.confirmRemoveButton.disabled =
                false;

            elements.confirmRemoveButton.textContent =
                "Remove";
        }
    }
}

function closeRemoveModal() {
    const modalElement =
        document.getElementById(
            "removeEnrollmentModal"
        );

    if (
        !modalElement ||
        typeof bootstrap === "undefined"
    ) {
        return;
    }

    const modal =
        bootstrap.Modal.getInstance(
            modalElement
        );

    modal?.hide();
}


/* ==================================================
   MOBILE SIDEBAR
================================================== */

function initializeSidebar() {
    elements.menuButton?.addEventListener(
        "click",
        openSidebar
    );

    elements.closeButton?.addEventListener(
        "click",
        closeSidebar
    );

    elements.overlay?.addEventListener(
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
    elements.sidebar?.classList.add(
        "open"
    );

    elements.overlay?.classList.add(
        "show"
    );

    elements.menuButton?.setAttribute(
        "aria-expanded",
        "true"
    );

    document.body.style.overflow =
        "hidden";
}

function closeSidebar() {
    elements.sidebar?.classList.remove(
        "open"
    );

    elements.overlay?.classList.remove(
        "show"
    );

    elements.menuButton?.setAttribute(
        "aria-expanded",
        "false"
    );

    document.body.style.overflow = "";
}


/* ==================================================
   LOGOUT
================================================== */

function initializeLogout() {
    elements.logoutButton?.addEventListener(
        "click",
        openLogoutModal
    );

    elements.topLogoutButton?.addEventListener(
        "click",
        openLogoutModal
    );

    elements.confirmLogoutButton?.addEventListener(
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
        localStorage.removeItem("isLoggedIn");
    }

    window.location.replace(
        "login.html"
    );
}


/* ==================================================
   LOADING AND ERROR STATES
================================================== */

function showLoading() {
    elements.loadingOverlay?.classList
        .remove("hidden");
}

function hideLoading() {
    elements.loadingOverlay?.classList
        .add("hidden");
}

function showError(message) {
    setText(
        elements.errorMessage,
        message
    );

    elements.errorBox?.classList
        .remove("d-none");
}

function hideError() {
    elements.errorBox?.classList
        .add("d-none");
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
        value === null ||
            value === undefined
            ? ""
            : String(value);

    return element.innerHTML;
}