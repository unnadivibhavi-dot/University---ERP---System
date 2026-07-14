"use strict";

/*
---------------------------------------------------
University ERP
Student Available Courses

Uses existing backend endpoints:

GET  /api/courses
GET  /api/student-portal/profile
GET  /api/student-portal/courses
POST /api/enrollments
---------------------------------------------------
*/


/* ==================================================
   PAGE STATE
================================================== */

let allCourses = [];
let filteredCourses = [];
let enrolledCourseIds = new Set();

let currentStudent = null;
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
   SHARED CONFIGURATION CHECK
================================================== */

if (typeof window.fetchWithAuth !== "function") {
    throw new Error(
        "config.js is missing. Load config.js before student-courses.js."
    );
}


/* ==================================================
   PAGE INITIALIZATION
================================================== */

document.addEventListener(
    "DOMContentLoaded",
    initializeCoursesPage
);

async function initializeCoursesPage() {
    displayCurrentDate();
    initializeSidebar();
    initializeFilters();
    initializeEnrollment();
    initializeLogout();

    try {
        showLoading();
        hideError();

        const [
            profileResponse,
            courseResponse,
            enrollmentResponse
        ] = await Promise.all([
            fetchWithAuth(
                "/student-portal/profile"
            ),

            fetchWithAuth(
                "/courses"
            ),

            fetchWithAuth(
                "/student-portal/courses"
            )
        ]);

        currentStudent =
            normalizeStudent(
                profileResponse?.data
            );

        const availableCourses =
            Array.isArray(courseResponse?.data)
                ? courseResponse.data
                : [];

        const enrolledCourses =
            Array.isArray(enrollmentResponse?.data)
                ? enrollmentResponse.data
                : [];

        enrolledCourseIds =
            new Set(
                enrolledCourses.map(
                    (course) =>
                        Number(
                            course.CourseID ??
                            course.courseId
                        )
                )
            );

        allCourses =
            availableCourses.map(
                normalizeCourse
            );

        filteredCourses = [
            ...allCourses
        ];

        renderStudentInformation(
            currentStudent
        );

        populateDepartmentFilter(
            allCourses
        );

        updateSummaryCards();
        renderCourses(
            filteredCourses
        );

    } catch (error) {
        console.error(
            "Available Courses error:",
            error
        );

        showError(
            error.message ||
            "Unable to load available courses."
        );

        renderCourses([]);
    } finally {
        hideLoading();
    }
}


/* ==================================================
   NORMALIZE BACKEND DATA
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


function normalizeCourse(course = {}) {
    const courseId =
        Number(
            course.CourseID ??
            course.courseId
        );

    const isEnrolled =
        enrolledCourseIds.has(
            courseId
        );

    return {
        courseId,

        courseCode:
            course.CourseCode ||
            course.courseCode ||
            "N/A",

        courseName:
            course.CourseName ||
            course.courseName ||
            "Unnamed Course",

        description:
            course.Description ||
            course.description ||
            "Course description is not available.",

        faculty:
            course.Department ||
            course.department ||
            "Not available",

        semester:
            course.Semester ||
            course.semester ||
            "Not available",

        credits:
            Number(
                course.Credits ??
                course.credits
            ) || 0,

        lecturer:
            course.LecturerName ||
            course.lecturer ||
            "Not assigned",

        schedule:
            course.Schedule ||
            course.schedule ||
            "Schedule not available",

        location:
            course.Location ||
            course.location ||
            "Location not available",

        capacity:
            Number(
                course.Capacity ??
                course.capacity
            ) || 0,

        enrolledStudents:
            Number(
                course.EnrolledStudents ??
                course.enrolledStudents
            ) || 0,

        enrollmentStatus:
            String(
                course.EnrollmentStatus ||
                course.enrollmentStatus ||
                "Open"
            ),

        isEnrolled
    };
}


/* ==================================================
   STUDENT INFORMATION
================================================== */

function renderStudentInformation(student) {
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
        sidebarStudentAvatar,
        initials
    );

    setText(
        topStudentAvatar,
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

function displayCurrentDate() {
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
   DYNAMIC DEPARTMENT FILTER
================================================== */

function populateDepartmentFilter(courses) {
    if (!facultyFilter) {
        return;
    }

    const currentValue =
        facultyFilter.value;

    const departments =
        [
            ...new Set(
                courses
                    .map(
                        (course) =>
                            course.faculty
                    )
                    .filter(
                        (department) =>
                            department &&
                            department !==
                            "Not available"
                    )
            )
        ].sort();

    facultyFilter.innerHTML =
        '<option value="">All departments</option>';

    departments.forEach(
        (department) => {
            const option =
                document.createElement(
                    "option"
                );

            option.value =
                department;

            option.textContent =
                department;

            facultyFilter.appendChild(
                option
            );
        }
    );

    if (
        departments.includes(
            currentValue
        )
    ) {
        facultyFilter.value =
            currentValue;
    }
}
/* ==================================================
   SUMMARY CARDS
================================================== */

function updateSummaryCards() {
    const totalCourses =
        allCourses.length;

    const openCourses =
        allCourses.filter(
            (course) =>
                course.enrollmentStatus
                    .toLowerCase() ===
                "open" &&
                !course.isEnrolled
        ).length;

    const enrolledCourses =
        allCourses.filter(
            (course) =>
                course.isEnrolled
        ).length;

    setText(
        totalCoursesCount,
        totalCourses
    );

    setText(
        openCoursesCount,
        openCourses
    );

    setText(
        enrolledCoursesCount,
        enrolledCourses
    );
}


/* ==================================================
   FILTER INITIALIZATION
================================================== */

function initializeFilters() {
    courseSearchInput?.addEventListener(
        "input",
        filterCourses
    );

    facultyFilter?.addEventListener(
        "change",
        filterCourses
    );

    semesterFilter?.addEventListener(
        "change",
        filterCourses
    );

    creditFilter?.addEventListener(
        "change",
        filterCourses
    );

    clearFiltersButton?.addEventListener(
        "click",
        clearFilters
    );
}


/* ==================================================
   FILTER COURSES
================================================== */

function filterCourses() {
    const searchValue =
        courseSearchInput
            ?.value
            .trim()
            .toLowerCase() || "";

    const facultyValue =
        facultyFilter?.value || "";

    const semesterValue =
        semesterFilter?.value || "";

    const creditValue =
        creditFilter?.value || "";

    filteredCourses =
        allCourses.filter(
            (course) => {
                const courseCode =
                    String(
                        course.courseCode || ""
                    ).toLowerCase();

                const courseName =
                    String(
                        course.courseName || ""
                    ).toLowerCase();

                const matchesSearch =
                    searchValue === "" ||
                    courseCode.includes(
                        searchValue
                    ) ||
                    courseName.includes(
                        searchValue
                    );

                const matchesFaculty =
                    facultyValue === "" ||
                    course.faculty ===
                    facultyValue;

                const matchesSemester =
                    semesterValue === "" ||
                    course.semester ===
                    semesterValue;

                const matchesCredits =
                    creditValue === "" ||
                    String(
                        course.credits
                    ) === creditValue;

                return (
                    matchesSearch &&
                    matchesFaculty &&
                    matchesSemester &&
                    matchesCredits
                );
            }
        );

    renderCourses(
        filteredCourses
    );
}


/* ==================================================
   CLEAR FILTERS
================================================== */

function clearFilters() {
    if (courseSearchInput) {
        courseSearchInput.value = "";
    }

    if (facultyFilter) {
        facultyFilter.value = "";
    }

    if (semesterFilter) {
        semesterFilter.value = "";
    }

    if (creditFilter) {
        creditFilter.value = "";
    }

    filteredCourses = [
        ...allCourses
    ];

    renderCourses(
        filteredCourses
    );

    courseSearchInput?.focus();
}


/* ==================================================
   RENDER COURSE LIST
================================================== */

function renderCourses(courses) {
    if (!coursesGrid) {
        return;
    }

    coursesGrid.replaceChildren();

    setText(
        visibleCourseCount,
        courses.length
    );

    if (courses.length === 0) {
        coursesEmptyState?.classList
            .remove("d-none");

        return;
    }

    coursesEmptyState?.classList
        .add("d-none");

    courses.forEach(
        (course) => {
            const card =
                createCourseCard(
                    course
                );

            coursesGrid.appendChild(
                card
            );
        }
    );
}


/* ==================================================
   CREATE COURSE CARD
================================================== */

function createCourseCard(course) {
    const courseCard =
        document.createElement(
            "article"
        );

    courseCard.className =
        "course-card";

    const availableSeats =
        course.capacity > 0
            ? Math.max(
                course.capacity -
                course.enrolledStudents,
                0
            )
            : null;

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
        getCourseDisplayStatus(
            course
        );

    const statusClass =
        getCourseStatusClass(
            course
        );

    const buttonInformation =
        getEnrollmentButtonInformation(
            course
        );

    const seatText =
        course.capacity > 0
            ? `${availableSeats} / ${course.capacity}`
            : "Not available";

    const seatProgress =
        course.capacity > 0
            ? `
                <div
                    class="seat-progress"
                    aria-label="${usedPercentage}% of seats occupied"
                >
                    <div
                        class="seat-progress-bar"
                        style="width: ${usedPercentage}%"
                    ></div>
                </div>
            `
            : "";

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
                    ${escapeHtml(seatText)}
                </strong>

            </div>

            ${seatProgress}

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

    detailsButton?.addEventListener(
        "click",
        () => {
            showCourseDetails(
                course.courseId
            );
        }
    );

    if (
        enrollButton &&
        !buttonInformation.disabled
    ) {
        enrollButton.addEventListener(
            "click",
            () => {
                openEnrollmentModal(
                    course.courseId
                );
            }
        );
    }

    return courseCard;
}


/* ==================================================
   COURSE STATUS
================================================== */

function getCourseDisplayStatus(course) {
    if (course.isEnrolled) {
        return "Enrolled";
    }

    return (
        course.enrollmentStatus ||
        "Open"
    );
}

function getCourseStatusClass(course) {
    if (course.isEnrolled) {
        return "enrolled";
    }

    return (
        course.enrollmentStatus
            .toLowerCase() === "open"
            ? "open"
            : "closed"
    );
}

function getEnrollmentButtonInformation(
    course
) {
    if (course.isEnrolled) {
        return {
            text: "Already Enrolled",
            icon:
                "bi bi-check-circle-fill",
            disabled: true
        };
    }

    if (
        course.enrollmentStatus
            .toLowerCase() !== "open"
    ) {
        return {
            text: "Enrollment Closed",
            icon: "bi bi-lock-fill",
            disabled: true
        };
    }

    if (
        course.capacity > 0 &&
        course.enrolledStudents >=
        course.capacity
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
        allCourses.find(
            (item) =>
                Number(item.courseId) ===
                Number(courseId)
        );

    if (!course) {
        return;
    }

    const availableSeats =
        course.capacity > 0
            ? Math.max(
                course.capacity -
                course.enrolledStudents,
                0
            )
            : "Not available";

    window.alert(
        `${course.courseCode} - ${course.courseName}\n\n` +
        `Department: ${course.faculty}\n` +
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
   ENROLLMENT INITIALIZATION
================================================== */

function initializeEnrollment() {
    confirmEnrollmentButton?.addEventListener(
        "click",
        confirmCourseEnrollment
    );
}


/* ==================================================
   OPEN ENROLLMENT MODAL
================================================== */

function openEnrollmentModal(courseId) {
    const course =
        allCourses.find(
            (item) =>
                Number(item.courseId) ===
                Number(courseId)
        );

    if (!course) {
        return;
    }

    selectedCourseId =
        Number(courseId);

    setText(
        selectedCourseName,
        `${course.courseCode} - ${course.courseName}`
    );

    const modalElement =
        document.getElementById(
            "enrollmentConfirmationModal"
        );

    if (
        !modalElement ||
        typeof bootstrap === "undefined"
    ) {
        confirmCourseEnrollment();
        return;
    }

    const enrollmentModal =
        bootstrap.Modal.getOrCreateInstance(
            modalElement
        );

    enrollmentModal.show();
}


/* ==================================================
   CONFIRM REAL COURSE ENROLLMENT
================================================== */

async function confirmCourseEnrollment() {
    const course =
        allCourses.find(
            (item) =>
                Number(item.courseId) ===
                Number(selectedCourseId)
        );

    if (!course) {
        return;
    }

    if (!currentStudent?.studentId) {
        window.alert(
            "Student information is unavailable. Please sign in again."
        );

        return;
    }

    if (course.isEnrolled) {
        window.alert(
            "You are already enrolled in this course."
        );

        return;
    }

    if (
        course.enrollmentStatus
            .toLowerCase() !== "open"
    ) {
        window.alert(
            "Enrollment is closed for this course."
        );

        return;
    }

    if (
        course.capacity > 0 &&
        course.enrolledStudents >=
        course.capacity
    ) {
        window.alert(
            "This course is currently full."
        );

        return;
    }

    setEnrollmentButtonLoading(true);

    try {
        await fetchWithAuth(
            "/enrollments",
            {
                method: "POST",

                body: JSON.stringify({
                    studentId:
                        Number(
                            currentStudent.studentId
                        ),

                    courseId:
                        Number(
                            course.courseId
                        )
                })
            }
        );

        course.isEnrolled = true;

        enrolledCourseIds.add(
            Number(course.courseId)
        );

        if (course.capacity > 0) {
            course.enrolledStudents += 1;
        }

        updateSummaryCards();
        filterCourses();

        closeEnrollmentModal();

        selectedCourseId = null;

        window.alert(
            `You have successfully enrolled in ${course.courseCode} - ${course.courseName}.`
        );
    } catch (error) {
        console.error(
            "Course enrollment error:",
            error
        );

        window.alert(
            error.message ||
            "Unable to complete course enrollment."
        );
    } finally {
        setEnrollmentButtonLoading(false);
    }
}


/* ==================================================
   ENROLLMENT BUTTON LOADING
================================================== */

function setEnrollmentButtonLoading(
    loading
) {
    if (!confirmEnrollmentButton) {
        return;
    }

    confirmEnrollmentButton.disabled =
        loading;

    confirmEnrollmentButton.innerHTML =
        loading
            ? `
                <span
                    class="spinner-border spinner-border-sm me-2"
                    aria-hidden="true"
                ></span>
                Enrolling...
            `
            : "Enroll Now";
}


/* ==================================================
   CLOSE ENROLLMENT MODAL
================================================== */

function closeEnrollmentModal() {
    const modalElement =
        document.getElementById(
            "enrollmentConfirmationModal"
        );

    if (
        !modalElement ||
        typeof bootstrap === "undefined"
    ) {
        return;
    }

    const enrollmentModal =
        bootstrap.Modal.getInstance(
            modalElement
        );

    enrollmentModal?.hide();
}
/* ==================================================
   MOBILE SIDEBAR
================================================== */

function initializeSidebar() {
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
    studentSidebar?.classList.add(
        "open"
    );

    sidebarOverlay?.classList.add(
        "show"
    );

    mobileMenuButton?.setAttribute(
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

    mobileMenuButton?.setAttribute(
        "aria-expanded",
        "false"
    );

    document.body.style.overflow = "";
}


/* ==================================================
   LOGOUT
================================================== */

function initializeLogout() {
    sidebarLogoutButton?.addEventListener(
        "click",
        openLogoutModal
    );

    topLogoutButton?.addEventListener(
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

    const logoutModal =
        bootstrap.Modal.getOrCreateInstance(
            modalElement
        );

    logoutModal.show();
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
   LOADING AND ERROR STATES
================================================== */

function showLoading() {
    coursesLoadingOverlay?.classList
        .remove("hidden");
}

function hideLoading() {
    coursesLoadingOverlay?.classList
        .add("hidden");
}

function showError(message) {
    setText(
        coursesErrorMessage,
        message
    );

    coursesError?.classList
        .remove("d-none");
}

function hideError() {
    coursesError?.classList
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