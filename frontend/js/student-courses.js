"use strict";

/*
 * University ERP - Available Courses
 *
 * This page currently uses mock data.
 * Later, set USE_MOCK_DATA to false to connect the backend API.
 */

/* ==================================================
   CONFIGURATION
================================================== */

const API_BASE_URL = "http://localhost:5001/api";
const USE_MOCK_DATA = true;

/* ==================================================
   MOCK STUDENT DATA
================================================== */

const mockStudent = {
    studentId: "STU2026001",
    firstName: "Vibhavi",
    lastName: "Kahandawaarachchi"
};

/* ==================================================
   MOCK COURSE DATA
================================================== */

const mockCourses = [
    {
        courseId: 1,
        courseCode: "SE2031",
        courseName: "Data Structures and Algorithms",
        description:
            "Learn data structures, algorithm design, complexity analysis and problem-solving techniques.",
        faculty: "Computing",
        semester: "Semester 02",
        credits: 4,
        lecturer: "Dr. N. Perera",
        schedule: "Monday, 8:30 AM - 10:30 AM",
        location: "Lab 03",
        capacity: 50,
        enrolledStudents: 38,
        enrollmentStatus: "Open",
        isEnrolled: false
    },
    {
        courseId: 2,
        courseCode: "SE2042",
        courseName: "Database Management Systems",
        description:
            "Study relational databases, SQL, normalization, transactions and database design.",
        faculty: "Computing",
        semester: "Semester 02",
        credits: 4,
        lecturer: "Ms. A. Silva",
        schedule: "Tuesday, 11:00 AM - 1:00 PM",
        location: "Hall B2",
        capacity: 45,
        enrolledStudents: 41,
        enrollmentStatus: "Open",
        isEnrolled: true
    },
    {
        courseId: 3,
        courseCode: "SE2051",
        courseName: "Human Computer Interaction",
        description:
            "Explore user-centered design, usability principles, prototyping and accessibility.",
        faculty: "Computing",
        semester: "Semester 02",
        credits: 3,
        lecturer: "Mr. K. Fernando",
        schedule: "Wednesday, 2:00 PM - 4:00 PM",
        location: "Lab 05",
        capacity: 40,
        enrolledStudents: 34,
        enrollmentStatus: "Open",
        isEnrolled: false
    },
    {
        courseId: 4,
        courseCode: "SE2062",
        courseName: "Operating Systems",
        description:
            "Understand processes, memory management, scheduling, file systems and operating-system security.",
        faculty: "Computing",
        semester: "Semester 02",
        credits: 4,
        lecturer: "Dr. S. Jayasinghe",
        schedule: "Thursday, 9:00 AM - 11:00 AM",
        location: "Hall C1",
        capacity: 45,
        enrolledStudents: 45,
        enrollmentStatus: "Closed",
        isEnrolled: false
    },
    {
        courseId: 5,
        courseCode: "BM2013",
        courseName: "Business Process Management",
        description:
            "Learn process modelling, process analysis, improvement and ERP integration.",
        faculty: "Business",
        semester: "Semester 02",
        credits: 3,
        lecturer: "Ms. D. Fernando",
        schedule: "Friday, 10:00 AM - 12:00 PM",
        location: "Hall A3",
        capacity: 60,
        enrolledStudents: 47,
        enrollmentStatus: "Open",
        isEnrolled: false
    },
    {
        courseId: 6,
        courseCode: "EN2011",
        courseName: "Engineering Mathematics",
        description:
            "Develop mathematical knowledge in calculus, matrices and engineering applications.",
        faculty: "Engineering",
        semester: "Semester 01",
        credits: 4,
        lecturer: "Dr. R. Wijesinghe",
        schedule: "Monday, 1:00 PM - 3:00 PM",
        location: "Engineering Hall 02",
        capacity: 55,
        enrolledStudents: 26,
        enrollmentStatus: "Open",
        isEnrolled: false
    },
    {
        courseId: 7,
        courseCode: "SE2022",
        courseName: "Computer Networks",
        description:
            "Study networking models, protocols, IP addressing, routing and network security.",
        faculty: "Computing",
        semester: "Semester 01",
        credits: 3,
        lecturer: "Mr. P. De Silva",
        schedule: "Wednesday, 9:00 AM - 11:00 AM",
        location: "Network Lab 01",
        capacity: 40,
        enrolledStudents: 40,
        enrollmentStatus: "Closed",
        isEnrolled: true
    },
    {
        courseId: 8,
        courseCode: "BM2041",
        courseName: "Principles of Management",
        description:
            "Understand planning, organizing, leadership, decision-making and management control.",
        faculty: "Business",
        semester: "Semester 01",
        credits: 2,
        lecturer: "Ms. H. Perera",
        schedule: "Thursday, 2:00 PM - 4:00 PM",
        location: "Business Hall 01",
        capacity: 70,
        enrolledStudents: 39,
        enrollmentStatus: "Open",
        isEnrolled: false
    }
];

/* ==================================================
   PAGE STATE
================================================== */

let allCourses = [];
let filteredCourses = [];
let selectedCourseId = null;

/* ==================================================
   HTML ELEMENTS
================================================== */

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

const totalCoursesCount =
    document.getElementById("totalCoursesCount");

const openCoursesCount =
    document.getElementById("openCoursesCount");

const enrolledCoursesCount =
    document.getElementById("enrolledCoursesCount");

const visibleCourseCount =
    document.getElementById("visibleCourseCount");

const courseSearchInput =
    document.getElementById("courseSearchInput");

const facultyFilter =
    document.getElementById("facultyFilter");

const semesterFilter =
    document.getElementById("semesterFilter");

const creditFilter =
    document.getElementById("creditFilter");

const clearFiltersButton =
    document.getElementById("clearFiltersButton");

const coursesGrid =
    document.getElementById("coursesGrid");

const coursesEmptyState =
    document.getElementById("coursesEmptyState");

const coursesLoadingOverlay =
    document.getElementById("coursesLoadingOverlay");

const coursesError =
    document.getElementById("coursesError");

const coursesErrorMessage =
    document.getElementById("coursesErrorMessage");

const selectedCourseName =
    document.getElementById("selectedCourseName");

const confirmEnrollmentButton =
    document.getElementById("confirmEnrollmentButton");

const sidebarLogoutButton =
    document.getElementById("sidebarLogoutButton");

const topLogoutButton =
    document.getElementById("topLogoutButton");

const confirmLogoutButton =
    document.getElementById("confirmLogoutButton");

/* ==================================================
   INITIALIZE PAGE
================================================== */

document.addEventListener(
    "DOMContentLoaded",
    initializeCoursesPage
);

async function initializeCoursesPage() {
    displayCurrentDate();
    renderStudentInformation(mockStudent);
    initializeSidebar();
    initializeFilters();
    initializeEnrollment();
    initializeLogout();

    try {
        showLoading();

        allCourses = await loadCourses();

        if (!Array.isArray(allCourses)) {
            throw new Error(
                "Invalid course information was received."
            );
        }

        filteredCourses = [...allCourses];

        updateSummaryCards();
        renderCourses(filteredCourses);
        hideError();
    } catch (error) {
        console.error(
            "Available Courses error:",
            error
        );

        showError(
            error.message ||
            "Unable to load available courses."
        );
    } finally {
        hideLoading();
    }
}

/* ==================================================
   LOAD COURSES
================================================== */

async function loadCourses() {
    if (USE_MOCK_DATA) {
        return loadMockCourses();
    }

    return fetchCoursesFromBackend();
}

function loadMockCourses() {
    return new Promise(function (resolve) {
        setTimeout(function () {
            resolve(
                mockCourses.map(function (course) {
                    return { ...course };
                })
            );
        }, 700);
    });
}

async function fetchCoursesFromBackend() {
    const token =
        localStorage.getItem("token") ||
        localStorage.getItem("authToken");

    if (!token) {
        throw new Error(
            "Authentication token was not found. Please login again."
        );
    }

    const response = await fetch(
        `${API_BASE_URL}/student/courses`,
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
            "You are not authorized to view available courses."
        );
    }

    if (!response.ok) {
        throw new Error(
            "The server could not load available courses."
        );
    }

    const result = await response.json();

    return Array.isArray(result)
        ? result
        : result.courses;
}

/* ==================================================
   STUDENT INFORMATION
================================================== */

function renderStudentInformation(student) {
    const firstName =
        student.firstName || "Student";

    const lastName =
        student.lastName || "";

    const fullName =
        `${firstName} ${lastName}`.trim();

    const studentId =
        student.studentId || "Not available";

    const initials =
        createInitials(firstName, lastName);

    sidebarStudentAvatar.textContent = initials;
    topStudentAvatar.textContent = initials;

    sidebarStudentName.textContent = fullName;
    topStudentName.textContent = fullName;

    sidebarStudentId.textContent = studentId;
    topStudentId.textContent = studentId;
}

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

/* ==================================================
   CURRENT DATE
================================================== */

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

/* ==================================================
   SUMMARY CARDS
================================================== */

function updateSummaryCards() {
    const totalCourses =
        allCourses.length;

    const openCourses =
        allCourses.filter(function (course) {
            return (
                course.enrollmentStatus === "Open" &&
                course.isEnrolled === false
            );
        }).length;

    const enrolledCourses =
        allCourses.filter(function (course) {
            return course.isEnrolled === true;
        }).length;

    totalCoursesCount.textContent =
        totalCourses;

    openCoursesCount.textContent =
        openCourses;

    enrolledCoursesCount.textContent =
        enrolledCourses;
}

/* ==================================================
   COURSE FILTERS
================================================== */

function initializeFilters() {
    courseSearchInput.addEventListener(
        "input",
        filterCourses
    );

    facultyFilter.addEventListener(
        "change",
        filterCourses
    );

    semesterFilter.addEventListener(
        "change",
        filterCourses
    );

    creditFilter.addEventListener(
        "change",
        filterCourses
    );

    clearFiltersButton.addEventListener(
        "click",
        clearFilters
    );
}

function filterCourses() {
    const searchValue =
        courseSearchInput.value
            .trim()
            .toLowerCase();

    const facultyValue =
        facultyFilter.value;

    const semesterValue =
        semesterFilter.value;

    const creditValue =
        creditFilter.value;

    filteredCourses =
        allCourses.filter(function (course) {
            const matchesSearch =
                searchValue === "" ||
                course.courseCode
                    .toLowerCase()
                    .includes(searchValue) ||
                course.courseName
                    .toLowerCase()
                    .includes(searchValue);

            const matchesFaculty =
                facultyValue === "" ||
                course.faculty === facultyValue;

            const matchesSemester =
                semesterValue === "" ||
                course.semester === semesterValue;

            const matchesCredits =
                creditValue === "" ||
                String(course.credits) === creditValue;

            return (
                matchesSearch &&
                matchesFaculty &&
                matchesSemester &&
                matchesCredits
            );
        });

    renderCourses(filteredCourses);
}

function clearFilters() {
    courseSearchInput.value = "";
    facultyFilter.value = "";
    semesterFilter.value = "";
    creditFilter.value = "";

    filteredCourses = [...allCourses];

    renderCourses(filteredCourses);

    courseSearchInput.focus();
}

/* ==================================================
   RENDER COURSE CARDS
================================================== */

function renderCourses(courses) {
    coursesGrid.innerHTML = "";

    visibleCourseCount.textContent =
        courses.length;

    if (courses.length === 0) {
        coursesEmptyState
            .classList
            .remove("d-none");

        return;
    }

    coursesEmptyState
        .classList
        .add("d-none");

    courses.forEach(function (course) {
        const card =
            createCourseCard(course);

        coursesGrid.appendChild(card);
    });
}

function createCourseCard(course) {
    const courseCard =
        document.createElement("article");

    courseCard.className = "course-card";

    const availableSeats =
        Math.max(
            Number(course.capacity) -
            Number(course.enrolledStudents),
            0
        );

    const usedPercentage =
        course.capacity > 0
            ? Math.min(
                Math.round(
                    (
                        course.enrolledStudents /
                        course.capacity
                    ) * 100
                ),
                100
            )
            : 0;

    const displayStatus =
        getCourseDisplayStatus(course);

    const statusClass =
        getCourseStatusClass(course);

    const buttonInformation =
        getEnrollmentButtonInformation(course);

    courseCard.innerHTML = `
        <div class="course-card-header">

            <span class="course-code">
                ${escapeHtml(course.courseCode)}
            </span>

            <span class="course-status ${statusClass}">
                ${escapeHtml(displayStatus)}
            </span>

        </div>

        <h3>
            ${escapeHtml(course.courseName)}
        </h3>

        <p class="course-description">
            ${escapeHtml(course.description)}
        </p>

        <div class="course-details">

            <div class="course-detail">
                <i class="bi bi-building"></i>

                <span>
                    ${escapeHtml(course.faculty)}
                </span>
            </div>

            <div class="course-detail">
                <i class="bi bi-person-video3"></i>

                <span>
                    ${escapeHtml(course.lecturer)}
                </span>
            </div>

            <div class="course-detail">
                <i class="bi bi-calendar3"></i>

                <span>
                    ${escapeHtml(course.schedule)}
                </span>
            </div>

            <div class="course-detail">
                <i class="bi bi-geo-alt-fill"></i>

                <span>
                    ${escapeHtml(course.location)}
                </span>
            </div>

            <div class="course-detail">
                <i class="bi bi-mortarboard-fill"></i>

                <span>
                    ${escapeHtml(course.semester)}
                    •
                    ${escapeHtml(course.credits)} credits
                </span>
            </div>

        </div>

        <div class="course-seats">

            <div class="course-seats-top">

                <span>
                    Available seats
                </span>

                <strong>
                    ${availableSeats} / ${escapeHtml(course.capacity)}
                </strong>

            </div>

            <div
                class="seat-progress"
                aria-label="${usedPercentage}% of seats occupied"
            >
                <div
                    class="seat-progress-bar"
                    style="width: ${usedPercentage}%"
                ></div>
            </div>

        </div>

        <div class="course-card-actions">

            <button
                type="button"
                class="course-details-button"
                data-course-id="${escapeHtml(course.courseId)}"
            >
                <i class="bi bi-info-circle"></i>
                Details
            </button>

            <button
                type="button"
                class="course-enroll-button"
                data-course-id="${escapeHtml(course.courseId)}"
                ${buttonInformation.disabled ? "disabled" : ""}
            >
                <i class="${buttonInformation.icon}"></i>
                ${escapeHtml(buttonInformation.text)}
            </button>

        </div>
    `;

    const detailsButton =
        courseCard.querySelector(
            ".course-details-button"
        );

    const enrollButton =
        courseCard.querySelector(
            ".course-enroll-button"
        );

    detailsButton.addEventListener(
        "click",
        function () {
            showCourseDetails(course.courseId);
        }
    );

    if (!buttonInformation.disabled) {
        enrollButton.addEventListener(
            "click",
            function () {
                openEnrollmentModal(
                    course.courseId
                );
            }
        );
    }

    return courseCard;
}

function getCourseDisplayStatus(course) {
    if (course.isEnrolled) {
        return "Enrolled";
    }

    return course.enrollmentStatus;
}

function getCourseStatusClass(course) {
    if (course.isEnrolled) {
        return "enrolled";
    }

    return course.enrollmentStatus === "Open"
        ? "open"
        : "closed";
}

function getEnrollmentButtonInformation(course) {
    if (course.isEnrolled) {
        return {
            text: "Already Enrolled",
            icon: "bi bi-check-circle-fill",
            disabled: true
        };
    }

    if (course.enrollmentStatus !== "Open") {
        return {
            text: "Enrollment Closed",
            icon: "bi bi-lock-fill",
            disabled: true
        };
    }

    if (
        Number(course.enrolledStudents) >=
        Number(course.capacity)
    ) {
        return {
            text: "Course Full",
            icon: "bi bi-people-fill",
            disabled: true
        };
    }

    return {
        text: "Enroll",
        icon: "bi bi-person-plus-fill",
        disabled: false
    };
}

/* ==================================================
   COURSE DETAILS
================================================== */

function showCourseDetails(courseId) {
    const course =
        allCourses.find(function (item) {
            return item.courseId === courseId;
        });

    if (!course) {
        return;
    }

    const availableSeats =
        Math.max(
            course.capacity -
            course.enrolledStudents,
            0
        );

    alert(
        `${course.courseCode} - ${course.courseName}\n\n` +
        `Faculty: ${course.faculty}\n` +
        `Semester: ${course.semester}\n` +
        `Credits: ${course.credits}\n` +
        `Lecturer: ${course.lecturer}\n` +
        `Schedule: ${course.schedule}\n` +
        `Location: ${course.location}\n` +
        `Available Seats: ${availableSeats}\n\n` +
        `${course.description}`
    );
}

/* ==================================================
   COURSE ENROLLMENT
================================================== */

function initializeEnrollment() {
    confirmEnrollmentButton.addEventListener(
        "click",
        confirmCourseEnrollment
    );
}

function openEnrollmentModal(courseId) {
    const course =
        allCourses.find(function (item) {
            return item.courseId === courseId;
        });

    if (!course) {
        return;
    }

    selectedCourseId = courseId;

    selectedCourseName.textContent =
        `${course.courseCode} - ${course.courseName}`;

    const modalElement =
        document.getElementById(
            "enrollmentConfirmationModal"
        );

    const enrollmentModal =
        bootstrap.Modal.getOrCreateInstance(
            modalElement
        );

    enrollmentModal.show();
}

function confirmCourseEnrollment() {
    const course =
        allCourses.find(function (item) {
            return item.courseId === selectedCourseId;
        });

    if (!course) {
        return;
    }

    if (
        course.isEnrolled ||
        course.enrollmentStatus !== "Open" ||
        course.enrolledStudents >= course.capacity
    ) {
        return;
    }

    course.isEnrolled = true;
    course.enrolledStudents += 1;

    updateSummaryCards();
    filterCourses();

    const modalElement =
        document.getElementById(
            "enrollmentConfirmationModal"
        );

    const enrollmentModal =
        bootstrap.Modal.getInstance(
            modalElement
        );

    if (enrollmentModal) {
        enrollmentModal.hide();
    }

    selectedCourseId = null;

    alert(
        `You have successfully enrolled in ${course.courseCode} - ${course.courseName}.`
    );
}

/* ==================================================
   MOBILE SIDEBAR
================================================== */

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

/* ==================================================
   LOGOUT
================================================== */

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
    const modalElement =
        document.getElementById("logoutModal");

    const logoutModal =
        bootstrap.Modal.getOrCreateInstance(
            modalElement
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

    window.location.href = "login.html";
}

/* ==================================================
   LOADING AND ERROR STATES
================================================== */

function showLoading() {
    coursesLoadingOverlay
        .classList
        .remove("hidden");
}

function hideLoading() {
    coursesLoadingOverlay
        .classList
        .add("hidden");
}

function showError(message) {
    coursesErrorMessage.textContent =
        message;

    coursesError
        .classList
        .remove("d-none");
}

function hideError() {
    coursesError
        .classList
        .add("d-none");
}

/* ==================================================
   SECURITY HELPER
================================================== */

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