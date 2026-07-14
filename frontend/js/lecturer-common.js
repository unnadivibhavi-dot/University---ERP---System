"use strict";

/*
 * University ERP - Lecturer Common Functions
 *
 * This file contains shared functions used by all Lecturer pages.
 */

/* =========================================================
   Page initialization
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    initializeLecturerLayout();
});

/* =========================================================
   Lecturer page protection
========================================================= */

function protectLecturerPage() {
    if (
        typeof LECTURER_CONFIG !== "undefined" &&
        LECTURER_CONFIG.USE_MOCK_DATA === true
    ) {
        prepareMockLecturerSession();
        return true;
    }

    const token =
        localStorage.getItem("token") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem(
            LECTURER_CONFIG.STORAGE_KEYS.AUTH_TOKEN
        );

    const currentUser = getCurrentUser();

    if (!token || !currentUser) {
        window.location.href = LECTURER_CONFIG.PAGES.LOGIN;
        return false;
    }

    const role = String(currentUser.role || "").toLowerCase();

    if (role !== "lecturer") {
        showMessage(
            "You do not have permission to access the Lecturer Portal.",
            "error"
        );

        setTimeout(() => {
            window.location.href = LECTURER_CONFIG.PAGES.LOGIN;
        }, 1200);

        return false;
    }

    return true;
}

/* =========================================================
   Mock Lecturer session
========================================================= */

function prepareMockLecturerSession() {
    if (typeof LECTURER_MOCK_DATA === "undefined") {
        return;
    }

    const existingUser = getCurrentUser();

    if (!existingUser) {
        const mockUser = {
            userId: LECTURER_MOCK_DATA.lecturer.userId,
            lecturerId: LECTURER_MOCK_DATA.lecturer.lecturerId,
            fullName: LECTURER_MOCK_DATA.lecturer.fullName,
            role: "Lecturer"
        };

        setLocalStorageData(
            LECTURER_CONFIG.STORAGE_KEYS.CURRENT_USER,
            mockUser
        );
    }

    const existingLecturer = getLocalStorageData(
        LECTURER_CONFIG.STORAGE_KEYS.LECTURER_PROFILE,
        null
    );

    if (!existingLecturer) {
        setLocalStorageData(
            LECTURER_CONFIG.STORAGE_KEYS.LECTURER_PROFILE,
            LECTURER_MOCK_DATA.lecturer
        );
    }

    initializeMockDataStorage();
}

function initializeMockDataStorage() {
    if (typeof LECTURER_MOCK_DATA === "undefined") {
        return;
    }

    initializeStorageIfEmpty(
        LECTURER_CONFIG.STORAGE_KEYS.LECTURER_COURSES,
        LECTURER_MOCK_DATA.courses
    );

    initializeStorageIfEmpty(
        LECTURER_CONFIG.STORAGE_KEYS.COURSE_STUDENTS,
        LECTURER_MOCK_DATA.students
    );

    initializeStorageIfEmpty(
        LECTURER_CONFIG.STORAGE_KEYS.ATTENDANCE,
        LECTURER_MOCK_DATA.attendance
    );

    initializeStorageIfEmpty(
        LECTURER_CONFIG.STORAGE_KEYS.EXAMINATIONS,
        LECTURER_MOCK_DATA.examinations
    );

    initializeStorageIfEmpty(
        LECTURER_CONFIG.STORAGE_KEYS.RESULTS,
        LECTURER_MOCK_DATA.results
    );
}

function initializeStorageIfEmpty(storageKey, defaultValue) {
    const existingValue = localStorage.getItem(storageKey);

    if (existingValue === null) {
        setLocalStorageData(storageKey, defaultValue);
    }
}

/* =========================================================
   Layout initialization
========================================================= */

function initializeLecturerLayout() {
    initializeSidebar();
    initializeLogout();
    displayCurrentDate();
    displayLecturerHeaderInformation();
}

/* =========================================================
   Sidebar controls
========================================================= */

function initializeSidebar() {
    const menuButton = document.getElementById("menuButton");
    const sidebar = document.getElementById("sidebar");
    const sidebarOverlay = document.getElementById("sidebarOverlay");

    if (!menuButton || !sidebar || !sidebarOverlay) {
        return;
    }

    menuButton.addEventListener("click", () => {
        const isOpen = sidebar.classList.contains("open");

        if (isOpen) {
            closeSidebar();
        } else {
            openSidebar();
        }
    });

    sidebarOverlay.addEventListener("click", closeSidebar);

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeSidebar();
        }
    });

    window.addEventListener("resize", () => {
        if (window.innerWidth > 900) {
            closeSidebar();
        }
    });
}

function openSidebar() {
    const menuButton = document.getElementById("menuButton");
    const sidebar = document.getElementById("sidebar");
    const sidebarOverlay = document.getElementById("sidebarOverlay");

    if (!sidebar || !sidebarOverlay) {
        return;
    }

    sidebar.classList.add("open");
    sidebarOverlay.hidden = false;

    if (menuButton) {
        menuButton.setAttribute("aria-expanded", "true");
    }

    document.body.style.overflow = "hidden";
}

function closeSidebar() {
    const menuButton = document.getElementById("menuButton");
    const sidebar = document.getElementById("sidebar");
    const sidebarOverlay = document.getElementById("sidebarOverlay");

    if (!sidebar || !sidebarOverlay) {
        return;
    }

    sidebar.classList.remove("open");
    sidebarOverlay.hidden = true;

    if (menuButton) {
        menuButton.setAttribute("aria-expanded", "false");
    }

    document.body.style.overflow = "";
}

/* =========================================================
   Lecturer profile information
========================================================= */

function getLecturerProfile() {
    if (
        typeof LECTURER_CONFIG !== "undefined" &&
        LECTURER_CONFIG.USE_MOCK_DATA === true
    ) {
        return getLocalStorageData(
            LECTURER_CONFIG.STORAGE_KEYS.LECTURER_PROFILE,
            LECTURER_MOCK_DATA.lecturer
        );
    }

    return getLocalStorageData(
        LECTURER_CONFIG.STORAGE_KEYS.LECTURER_PROFILE,
        null
    );
}

function displayLecturerHeaderInformation() {
    if (typeof LECTURER_CONFIG === "undefined") {
        return;
    }

    prepareMockLecturerSession();

    const lecturer = getLecturerProfile();

    if (!lecturer) {
        return;
    }

    setElementText(
        "headerLecturerName",
        lecturer.fullName || "Lecturer"
    );

    setElementText(
        "headerLecturerDepartment",
        lecturer.department || "Department"
    );

    setElementText(
        "lecturerName",
        lecturer.fullName || "Lecturer"
    );

    setElementText(
        "lecturerDepartment",
        lecturer.department || "Department"
    );

    setElementText(
        "welcomeLecturerName",
        lecturer.fullName || "Lecturer"
    );

    const initials = getInitials(lecturer.fullName);

    setElementText(
        "lecturerInitials",
        initials || "LE"
    );
}

function getInitials(fullName) {
    if (!fullName) {
        return "LE";
    }

    const cleanedName = String(fullName)
        .replace(/\b(Dr|Prof|Mr|Mrs|Ms)\.?\s*/gi, "")
        .trim();

    const nameParts = cleanedName
        .split(/\s+/)
        .filter(Boolean);

    if (nameParts.length === 0) {
        return "LE";
    }

    if (nameParts.length === 1) {
        return nameParts[0]
            .substring(0, 2)
            .toUpperCase();
    }

    return (
        nameParts[0].charAt(0) +
        nameParts[nameParts.length - 1].charAt(0)
    ).toUpperCase();
}

/* =========================================================
   Current user
========================================================= */

function getCurrentUser() {
    if (typeof LECTURER_CONFIG === "undefined") {
        return null;
    }

    const possibleUserKeys = [
        "user",
        "loggedUser",
        LECTURER_CONFIG.STORAGE_KEYS.CURRENT_USER
    ];

    for (const key of possibleUserKeys) {
        const user = getLocalStorageData(key, null);

        if (user) {
            return user;
        }
    }

    return null;
}

/* =========================================================
   Logout
========================================================= */

function initializeLogout() {
    const logoutButton = document.getElementById("logoutButton");

    if (!logoutButton) {
        return;
    }

    logoutButton.addEventListener("click", handleLecturerLogout);
}

function handleLecturerLogout() {
    const confirmed = window.confirm(
        "Are you sure you want to log out?"
    );

    if (!confirmed) {
        return;
    }

    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    localStorage.removeItem("loggedUser");
    localStorage.removeItem("isLoggedIn");

    localStorage.removeItem(
        LECTURER_CONFIG.STORAGE_KEYS.AUTH_TOKEN
    );

    localStorage.removeItem(
        LECTURER_CONFIG.STORAGE_KEYS.CURRENT_USER
    );

    localStorage.removeItem(
        LECTURER_CONFIG.STORAGE_KEYS.LECTURER_PROFILE
    );

    window.location.href = LECTURER_CONFIG.PAGES.LOGIN;
}
/* =========================================================
   Date functions
========================================================= */

function displayCurrentDate() {
    const currentDateElement = document.getElementById("currentDate");

    if (!currentDateElement) {
        return;
    }

    currentDateElement.textContent =
        new Intl.DateTimeFormat("en-GB", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        }).format(new Date());
}

function formatLecturerDate(dateValue) {
    if (!dateValue) {
        return "Not available";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
        return "Invalid date";
    }

    return new Intl.DateTimeFormat("en-GB", {
        year: "numeric",
        month: "short",
        day: "numeric"
    }).format(date);
}

/* =========================================================
   Message functions
========================================================= */

function showMessage(message, type = "success", duration = 4000) {
    const messageElement =
        document.getElementById("dashboardMessage") ||
        document.getElementById("pageMessage");

    if (!messageElement) {
        console.log(`${type.toUpperCase()}: ${message}`);
        return;
    }

    messageElement.textContent = message;
    messageElement.className = `message ${type}`;
    messageElement.hidden = false;

    if (duration > 0) {
        window.setTimeout(() => {
            hideMessage();
        }, duration);
    }
}

function hideMessage() {
    const messageElement =
        document.getElementById("dashboardMessage") ||
        document.getElementById("pageMessage");

    if (!messageElement) {
        return;
    }

    messageElement.hidden = true;
    messageElement.textContent = "";
    messageElement.className = "message";
}

/* =========================================================
   Loading functions
========================================================= */

function showLoading(
    loadingElementId = "dashboardLoading",
    contentElementId = "dashboardMainContent"
) {
    const loadingElement =
        document.getElementById(loadingElementId);

    const contentElement =
        document.getElementById(contentElementId);

    if (loadingElement) {
        loadingElement.hidden = false;
    }

    if (contentElement) {
        contentElement.hidden = true;
    }
}

function hideLoading(
    loadingElementId = "dashboardLoading",
    contentElementId = "dashboardMainContent"
) {
    const loadingElement =
        document.getElementById(loadingElementId);

    const contentElement =
        document.getElementById(contentElementId);

    if (loadingElement) {
        loadingElement.hidden = true;
    }

    if (contentElement) {
        contentElement.hidden = false;
    }
}

/* =========================================================
   LocalStorage functions
========================================================= */

function getLocalStorageData(storageKey, fallbackValue = null) {
    try {
        const storedValue = localStorage.getItem(storageKey);

        if (storedValue === null) {
            return fallbackValue;
        }

        return JSON.parse(storedValue);
    } catch (error) {
        console.error(
            `Unable to read localStorage key: ${storageKey}`,
            error
        );

        return fallbackValue;
    }
}

function setLocalStorageData(storageKey, value) {
    try {
        localStorage.setItem(
            storageKey,
            JSON.stringify(value)
        );

        return true;
    } catch (error) {
        console.error(
            `Unable to save localStorage key: ${storageKey}`,
            error
        );

        return false;
    }
}

function removeLocalStorageData(storageKey) {
    localStorage.removeItem(storageKey);
}

/* =========================================================
   Utility functions
========================================================= */

function setElementText(elementId, value) {
    const element = document.getElementById(elementId);

    if (element) {
        element.textContent = String(value ?? "");
    }
}

function escapeLecturerHtml(value) {
    const temporaryElement = document.createElement("div");

    temporaryElement.textContent = String(value ?? "");

    return temporaryElement.innerHTML;
}

function getUrlParameter(parameterName) {
    const parameters = new URLSearchParams(
        window.location.search
    );

    return parameters.get(parameterName);
}

function calculateGrade(marks, totalMarks) {
    const numericMarks = Number(marks);
    const numericTotalMarks = Number(totalMarks);

    if (
        Number.isNaN(numericMarks) ||
        Number.isNaN(numericTotalMarks) ||
        numericTotalMarks <= 0
    ) {
        return "";
    }

    const percentage =
        (numericMarks / numericTotalMarks) * 100;

    const boundary =
        LECTURER_CONFIG.GRADE_BOUNDARIES.find(
            (item) =>
                percentage >= item.minimumPercentage
        );

    return boundary ? boundary.grade : "F";
}