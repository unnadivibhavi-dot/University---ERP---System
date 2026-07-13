"use strict";

/* ==================================================
   UNIVERSITY ERP - STUDENT ENROLLMENT
   Mock-data version with localStorage support
================================================== */

const USE_MOCK_DATA = true;
const API_BASE_URL = "http://localhost:5001/api";

const mockStudent = {
    studentId: "STU2026001",
    firstName: "Vibhavi",
    lastName: "Kahandawaarachchi"
};

const defaultEnrollments = [
    {
        enrollmentId: 1,
        courseId: 1,
        courseCode: "SE2031",
        courseName: "Data Structures and Algorithms",
        description:
            "Learn data structures, algorithms, and problem-solving techniques.",
        semester: "Semester 02",
        credits: 4,
        lecturer: "Dr. N. Perera",
        schedule: "Monday, 8:30 AM - 10:30 AM",
        location: "Lab 03",
        status: "Active",
        canRemove: true
    },
    {
        enrollmentId: 2,
        courseId: 2,
        courseCode: "SE2042",
        courseName: "Database Management Systems",
        description:
            "Study SQL, relational databases, normalization, and database design.",
        semester: "Semester 02",
        credits: 4,
        lecturer: "Ms. A. Silva",
        schedule: "Tuesday, 11:00 AM - 1:00 PM",
        location: "Hall B2",
        status: "Active",
        canRemove: true
    },
    {
        enrollmentId: 3,
        courseId: 7,
        courseCode: "SE2022",
        courseName: "Computer Networks",
        description:
            "Study networking models, protocols, IP addressing, and security.",
        semester: "Semester 01",
        credits: 3,
        lecturer: "Mr. P. De Silva",
        schedule: "Wednesday, 9:00 AM - 11:00 AM",
        location: "Network Lab 01",
        status: "Completed",
        canRemove: false
    }
];

let allEnrollments = [];
let filteredEnrollments = [];
let selectedEnrollmentId = null;

/* ==================================================
   ELEMENTS
================================================== */

const elements = {
    sidebar: document.getElementById("studentSidebar"),
    overlay: document.getElementById("sidebarOverlay"),
    menuButton: document.getElementById("menuButton"),
    closeButton: document.getElementById("sidebarCloseButton"),

    currentDate: document.getElementById("currentDate"),

    sidebarAvatar: document.getElementById("sidebarAvatar"),
    sidebarStudentName:
        document.getElementById("sidebarStudentName"),
    sidebarStudentId:
        document.getElementById("sidebarStudentId"),

    topAvatar: document.getElementById("topAvatar"),
    topStudentName:
        document.getElementById("topStudentName"),
    topStudentId:
        document.getElementById("topStudentId"),

    totalEnrollments:
        document.getElementById("totalEnrollmentsCount"),
    activeEnrollments:
        document.getElementById("activeEnrollmentsCount"),
    totalCredits:
        document.getElementById("totalCreditsCount"),
    visibleEnrollments:
        document.getElementById("visibleEnrollmentCount"),

    searchInput:
        document.getElementById("enrollmentSearchInput"),
    semesterFilter:
        document.getElementById("semesterFilter"),
    statusFilter:
        document.getElementById("statusFilter"),
    clearFiltersButton:
        document.getElementById("clearFiltersButton"),

    enrollmentsGrid:
        document.getElementById("enrollmentsGrid"),
    emptyState:
        document.getElementById("enrollmentsEmptyState"),

    loadingOverlay:
        document.getElementById("loadingOverlay"),

    errorBox:
        document.getElementById("pageError"),
    errorMessage:
        document.getElementById("pageErrorMessage"),

    selectedEnrollmentCourse:
        document.getElementById("selectedEnrollmentCourse"),
    confirmRemoveButton:
        document.getElementById("confirmRemoveButton"),

    logoutButton:
        document.getElementById("logoutButton"),
    topLogoutButton:
        document.getElementById("topLogoutButton"),
    confirmLogoutButton:
        document.getElementById("confirmLogoutButton")
};

/* ==================================================
   INITIALIZATION
================================================== */

document.addEventListener(
    "DOMContentLoaded",
    initializeEnrollmentPage
);

async function initializeEnrollmentPage() {
    displayCurrentDate();
    displayStudentInformation();
    initializeFilters();
    initializeSidebar();
    initializeRemoveEnrollment();
    initializeLogout();

    try {
        showLoading();

        allEnrollments = await loadEnrollments();

        if (!Array.isArray(allEnrollments)) {
            throw new Error(
                "Invalid enrollment data was received."
            );
        }

        filteredEnrollments = [...allEnrollments];

        updateSummary();
        renderEnrollments(filteredEnrollments);
        hideError();
    } catch (error) {
        console.error("Enrollment page error:", error);

        showError(
            error.message ||
            "Unable to load your enrollments."
        );
    } finally {
        hideLoading();
    }
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

function displayStudentInformation() {
    const fullName =
        `${mockStudent.firstName} ${mockStudent.lastName}`.trim();

    const initials =
        `${mockStudent.firstName.charAt(0)}${mockStudent.lastName.charAt(0)}`
            .toUpperCase();

    setText(elements.sidebarAvatar, initials);
    setText(elements.topAvatar, initials);

    setText(elements.sidebarStudentName, fullName);
    setText(elements.topStudentName, fullName);

    setText(
        elements.sidebarStudentId,
        mockStudent.studentId
    );

    setText(
        elements.topStudentId,
        mockStudent.studentId
    );
}

/* ==================================================
   LOAD ENROLLMENTS
================================================== */

async function loadEnrollments() {
    if (USE_MOCK_DATA) {
        return loadMockEnrollments();
    }

    return fetchEnrollmentsFromBackend();
}

function loadMockEnrollments() {
    return new Promise(function (resolve) {
        setTimeout(function () {
            const savedEnrollments =
                readSavedEnrollments();

            if (savedEnrollments === null) {
                const starterData =
                    defaultEnrollments.map(function (item) {
                        return { ...item };
                    });

                saveEnrollments(starterData);
                resolve(starterData);
                return;
            }

            resolve(savedEnrollments);
        }, 500);
    });
}

async function fetchEnrollmentsFromBackend() {
    const token =
        localStorage.getItem("token") ||
        localStorage.getItem("authToken");

    if (!token) {
        throw new Error(
            "Authentication token was not found."
        );
    }

    const response = await fetch(
        `${API_BASE_URL}/student/enrollments`,
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
            "You are not authorized to view this page."
        );
    }

    if (!response.ok) {
        throw new Error(
            "The server could not load your enrollments."
        );
    }

    const result = await response.json();

    return Array.isArray(result)
        ? result
        : result.enrollments;
}

/* ==================================================
   LOCAL STORAGE
================================================== */

function readSavedEnrollments() {
    const savedData =
        localStorage.getItem("studentEnrollments");

    if (savedData === null) {
        return null;
    }

    try {
        const parsedData = JSON.parse(savedData);

        return Array.isArray(parsedData)
            ? parsedData
            : [];
    } catch (error) {
        console.error(
            "Invalid saved enrollment data:",
            error
        );

        return [];
    }
}

function saveEnrollments(enrollments) {
    localStorage.setItem(
        "studentEnrollments",
        JSON.stringify(enrollments)
    );
}

/* ==================================================
   SUMMARY
================================================== */

function updateSummary() {
    const activeEnrollments =
        allEnrollments.filter(function (item) {
            return item.status === "Active";
        });

    const totalCredits =
        activeEnrollments.reduce(
            function (total, item) {
                return (
                    total +
                    Number(item.credits || 0)
                );
            },
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
   FILTERS
================================================== */

function initializeFilters() {
    if (elements.searchInput) {
        elements.searchInput.addEventListener(
            "input",
            applyFilters
        );
    }

    if (elements.semesterFilter) {
        elements.semesterFilter.addEventListener(
            "change",
            applyFilters
        );
    }

    if (elements.statusFilter) {
        elements.statusFilter.addEventListener(
            "change",
            applyFilters
        );
    }

    if (elements.clearFiltersButton) {
        elements.clearFiltersButton.addEventListener(
            "click",
            clearFilters
        );
    }
}

function applyFilters() {
    const searchValue =
        elements.searchInput
            ? elements.searchInput.value
                .trim()
                .toLowerCase()
            : "";

    const semesterValue =
        elements.semesterFilter
            ? elements.semesterFilter.value
            : "";

    const statusValue =
        elements.statusFilter
            ? elements.statusFilter.value
            : "";

    filteredEnrollments =
        allEnrollments.filter(function (item) {
            const courseCode =
                String(item.courseCode || "")
                    .toLowerCase();

            const courseName =
                String(item.courseName || "")
                    .toLowerCase();

            const matchesSearch =
                searchValue === "" ||
                courseCode.includes(searchValue) ||
                courseName.includes(searchValue);

            const matchesSemester =
                semesterValue === "" ||
                item.semester === semesterValue;

            const matchesStatus =
                statusValue === "" ||
                item.status === statusValue;

            return (
                matchesSearch &&
                matchesSemester &&
                matchesStatus
            );
        });

    renderEnrollments(filteredEnrollments);
}

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

    filteredEnrollments = [...allEnrollments];

    renderEnrollments(filteredEnrollments);

    if (elements.searchInput) {
        elements.searchInput.focus();
    }
}

/* ==================================================
   RENDER ENROLLMENTS
================================================== */

function renderEnrollments(enrollments) {
    if (!elements.enrollmentsGrid) {
        return;
    }

    elements.enrollmentsGrid.innerHTML = "";

    setText(
        elements.visibleEnrollments,
        enrollments.length
    );

    if (enrollments.length === 0) {
        if (elements.emptyState) {
            elements.emptyState.classList.remove(
                "d-none"
            );
        }

        return;
    }

    if (elements.emptyState) {
        elements.emptyState.classList.add(
            "d-none"
        );
    }

    enrollments.forEach(function (item) {
        const enrollmentCard =
            createEnrollmentCard(item);

        elements.enrollmentsGrid.appendChild(
            enrollmentCard
        );
    });
}

function createEnrollmentCard(item) {
    const card =
        document.createElement("article");

    card.className = "enrollment-card";

    const statusClass =
        String(item.status || "")
            .toLowerCase() === "completed"
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
            : "Completed"
        }
            </button>

        </div>
    `;

    const viewButton =
        card.querySelector(".view-button");

    const removeButton =
        card.querySelector(".remove-button");

    viewButton.addEventListener(
        "click",
        function () {
            showEnrollmentDetails(item);
        }
    );

    if (item.canRemove) {
        removeButton.addEventListener(
            "click",
            function () {
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
    alert(
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
    if (elements.confirmRemoveButton) {
        elements.confirmRemoveButton.addEventListener(
            "click",
            removeSelectedEnrollment
        );
    }
}

function openRemoveModal(enrollmentId) {
    const selectedEnrollment =
        allEnrollments.find(function (item) {
            return (
                String(item.enrollmentId) ===
                String(enrollmentId)
            );
        });

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

    if (!modalElement) {
        return;
    }

    bootstrap.Modal
        .getOrCreateInstance(modalElement)
        .show();
}

function removeSelectedEnrollment() {
    allEnrollments =
        allEnrollments.filter(function (item) {
            return (
                String(item.enrollmentId) !==
                String(selectedEnrollmentId)
            );
        });

    saveEnrollments(allEnrollments);

    filteredEnrollments =
        allEnrollments.filter(function (item) {
            return true;
        });

    updateSummary();
    applyFilters();

    const modalElement =
        document.getElementById(
            "removeEnrollmentModal"
        );

    if (modalElement) {
        const modal =
            bootstrap.Modal.getInstance(
                modalElement
            );

        if (modal) {
            modal.hide();
        }
    }

    selectedEnrollmentId = null;
}

/* ==================================================
   MOBILE SIDEBAR
================================================== */

function initializeSidebar() {
    if (elements.menuButton) {
        elements.menuButton.addEventListener(
            "click",
            openSidebar
        );
    }

    if (elements.closeButton) {
        elements.closeButton.addEventListener(
            "click",
            closeSidebar
        );
    }

    if (elements.overlay) {
        elements.overlay.addEventListener(
            "click",
            closeSidebar
        );
    }

    document.addEventListener(
        "keydown",
        function (event) {
            if (event.key === "Escape") {
                closeSidebar();
            }
        }
    );
}

function openSidebar() {
    if (elements.sidebar) {
        elements.sidebar.classList.add("open");
    }

    if (elements.overlay) {
        elements.overlay.classList.add("show");
    }

    if (elements.menuButton) {
        elements.menuButton.setAttribute(
            "aria-expanded",
            "true"
        );
    }

    document.body.style.overflow = "hidden";
}

function closeSidebar() {
    if (elements.sidebar) {
        elements.sidebar.classList.remove("open");
    }

    if (elements.overlay) {
        elements.overlay.classList.remove("show");
    }

    if (elements.menuButton) {
        elements.menuButton.setAttribute(
            "aria-expanded",
            "false"
        );
    }

    document.body.style.overflow = "";
}

/* ==================================================
   LOGOUT
================================================== */

function initializeLogout() {
    if (elements.logoutButton) {
        elements.logoutButton.addEventListener(
            "click",
            openLogoutModal
        );
    }

    if (elements.topLogoutButton) {
        elements.topLogoutButton.addEventListener(
            "click",
            openLogoutModal
        );
    }

    if (elements.confirmLogoutButton) {
        elements.confirmLogoutButton.addEventListener(
            "click",
            logoutStudent
        );
    }
}

function openLogoutModal() {
    const modalElement =
        document.getElementById("logoutModal");

    if (!modalElement) {
        return;
    }

    bootstrap.Modal
        .getOrCreateInstance(modalElement)
        .show();
}

function logoutStudent() {
    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    localStorage.removeItem("loggedUser");
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("isLoggedIn");

    window.location.href = "login.html";
}

/* ==================================================
   LOADING AND ERROR STATES
================================================== */

function showLoading() {
    if (elements.loadingOverlay) {
        elements.loadingOverlay
            .classList
            .remove("hidden");
    }
}

function hideLoading() {
    if (elements.loadingOverlay) {
        elements.loadingOverlay
            .classList
            .add("hidden");
    }
}

function showError(message) {
    if (elements.errorMessage) {
        elements.errorMessage.textContent =
            message;
    }

    if (elements.errorBox) {
        elements.errorBox.classList.remove(
            "d-none"
        );
    }
}

function hideError() {
    if (elements.errorBox) {
        elements.errorBox.classList.add(
            "d-none"
        );
    }
}

/* ==================================================
   HELPERS
================================================== */

function setText(element, value) {
    if (element) {
        element.textContent =
            value === null ||
                value === undefined
                ? ""
                : String(value);
    }
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