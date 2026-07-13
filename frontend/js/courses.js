"use strict";

/*
=========================================================
UNIVERSITY ERP SYSTEM
Course Management Frontend Module

Current data source:
- localStorage

Future backend endpoints:
GET    /api/courses
POST   /api/courses
PUT    /api/courses/:id
DELETE /api/courses/:id
=========================================================
*/

/* ------------------------------------------------------
   PAGE ELEMENTS
------------------------------------------------------ */

const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");
const mobileMenuButton = document.getElementById("mobileMenuButton");
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

const courseCardGrid =
    document.getElementById("courseCardGrid");

const courseSearchInput =
    document.getElementById("courseSearchInput");

const courseDepartmentFilter =
    document.getElementById("courseDepartmentFilter");

const courseStatusFilter =
    document.getElementById("courseStatusFilter");

const refreshCoursesButton =
    document.getElementById("refreshCoursesButton");

const courseRecordCount =
    document.getElementById("courseRecordCount");

const totalCoursesValue =
    document.getElementById("totalCoursesValue");

const courseDepartmentCountValue =
    document.getElementById("courseDepartmentCountValue");

const activeCoursesValue =
    document.getElementById("activeCoursesValue");

const totalCreditsValue =
    document.getElementById("totalCreditsValue");

const coursePageMessage =
    document.getElementById("coursePageMessage");

/* ------------------------------------------------------
   COURSE FORM ELEMENTS
------------------------------------------------------ */

const courseForm =
    document.getElementById("courseForm");

const courseIdInput =
    document.getElementById("courseId");

const courseCodeInput =
    document.getElementById("courseCode");

const courseNameInput =
    document.getElementById("courseName");

const courseDepartmentInput =
    document.getElementById("courseDepartment");

const courseCreditsInput =
    document.getElementById("courseCredits");

const courseSemesterInput =
    document.getElementById("courseSemester");

const courseStatusInput =
    document.getElementById("courseStatus");

const courseDescriptionInput =
    document.getElementById("courseDescription");

const courseCodeError =
    document.getElementById("courseCodeError");

const courseNameError =
    document.getElementById("courseNameError");

const courseDepartmentError =
    document.getElementById("courseDepartmentError");

const courseCreditsError =
    document.getElementById("courseCreditsError");

const courseSemesterError =
    document.getElementById("courseSemesterError");

const courseFormMessage =
    document.getElementById("courseFormMessage");

const courseModalTitle =
    document.getElementById("courseModalTitle");

const saveCourseButton =
    document.getElementById("saveCourseButton");

const saveCourseButtonText =
    document.getElementById("saveCourseButtonText");

const saveCourseSpinner =
    document.getElementById("saveCourseSpinner");

const openAddCourseButton =
    document.getElementById("openAddCourseButton");

/* ------------------------------------------------------
   DELETE COURSE ELEMENTS
------------------------------------------------------ */

const deleteCourseIdInput =
    document.getElementById("deleteCourseId");

const confirmDeleteCourseButton =
    document.getElementById("confirmDeleteCourseButton");

/* ------------------------------------------------------
   BOOTSTRAP MODALS
------------------------------------------------------ */

const courseModalElement =
    document.getElementById("courseModal");

const deleteCourseModalElement =
    document.getElementById("deleteCourseModal");

const courseModal =
    new bootstrap.Modal(courseModalElement);

const deleteCourseModal =
    new bootstrap.Modal(deleteCourseModalElement);

/* ------------------------------------------------------
   SAMPLE COURSE DATA
------------------------------------------------------ */

const defaultCourses = [
    {
        courseId: 1,
        courseCode: "CS101",
        courseName: "Programming Fundamentals",
        department: "Computing",
        credits: 3,
        semester: "Semester 1",
        status: "Active",
        description:
            "Introduces basic programming concepts, problem solving, variables, conditions, loops and functions."
    },
    {
        courseId: 2,
        courseCode: "CS102",
        courseName: "Database Management Systems",
        department: "Computing",
        credits: 3,
        semester: "Semester 2",
        status: "Active",
        description:
            "Covers relational databases, SQL, normalization, database design and transaction management."
    },
    {
        courseId: 3,
        courseCode: "BM101",
        courseName: "Business Management",
        department: "Business",
        credits: 3,
        semester: "Semester 1",
        status: "Active",
        description:
            "Provides an introduction to management principles, organizational structures and business operations."
    },
    {
        courseId: 4,
        courseCode: "SE201",
        courseName: "Software Engineering",
        department: "Computing",
        credits: 4,
        semester: "Semester 2",
        status: "Active",
        description:
            "Focuses on software development life cycles, requirements, design, testing and project management."
    },
    {
        courseId: 5,
        courseCode: "EN201",
        courseName: "Engineering Mathematics",
        department: "Engineering",
        credits: 4,
        semester: "Semester 1",
        status: "Inactive",
        description:
            "Develops mathematical techniques used in engineering analysis and problem solving."
    },
    {
        courseId: 6,
        courseCode: "SC105",
        courseName: "Applied Science",
        department: "Science",
        credits: 2,
        semester: "Semester 2",
        status: "Active",
        description:
            "Explores scientific principles through practical applications and laboratory-based learning."
    }
];

/* ------------------------------------------------------
   LOGIN PROTECTION
------------------------------------------------------ */

function protectPage() {
    const isLoggedIn = localStorage.getItem("isLoggedIn");

    if (isLoggedIn !== "true") {
        window.location.replace("login.html");
    }
}

/* ------------------------------------------------------
   USER INFORMATION
------------------------------------------------------ */

function loadUserInformation() {
    const storedUser =
        localStorage.getItem("loggedUser");

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
}

/* ------------------------------------------------------
   LOCAL STORAGE
------------------------------------------------------ */

function initializeCourses() {
    if (!localStorage.getItem("courses")) {
        saveCourses(defaultCourses);
    }
}

function getCourses() {
    const storedCourses =
        localStorage.getItem("courses");

    if (!storedCourses) {
        return [];
    }

    try {
        const parsedCourses =
            JSON.parse(storedCourses);

        return Array.isArray(parsedCourses)
            ? parsedCourses
            : [];
    } catch (error) {
        console.error(
            "Unable to read courses:",
            error
        );

        return [];
    }
}

function saveCourses(courses) {
    localStorage.setItem(
        "courses",
        JSON.stringify(courses)
    );
}

/* ------------------------------------------------------
   DISPLAY COURSES
------------------------------------------------------ */

function displayCourses() {
    const courses = getCourses();

    const searchValue =
        courseSearchInput.value
            .trim()
            .toLowerCase();

    const selectedDepartment =
        courseDepartmentFilter.value;

    const selectedStatus =
        courseStatusFilter.value;

    const filteredCourses = courses.filter(
        (course) => {
            const courseCode =
                String(course.courseCode || "")
                    .toLowerCase();

            const courseName =
                String(course.courseName || "")
                    .toLowerCase();

            const description =
                String(course.description || "")
                    .toLowerCase();

            const matchesSearch =
                courseCode.includes(searchValue) ||
                courseName.includes(searchValue) ||
                description.includes(searchValue);

            const matchesDepartment =
                selectedDepartment === "" ||
                course.department === selectedDepartment;

            const matchesStatus =
                selectedStatus === "" ||
                course.status === selectedStatus;

            return (
                matchesSearch &&
                matchesDepartment &&
                matchesStatus
            );
        }
    );

    courseCardGrid.innerHTML = "";

    if (filteredCourses.length === 0) {
        courseCardGrid.innerHTML = `
            <div class="course-empty-state">
                <div class="student-empty-icon">
                    <i class="bi bi-journal-x"></i>
                </div>

                <h4>No courses found</h4>

                <p>
                    Try changing the search text,
                    department or status filter.
                </p>
            </div>
        `;

        courseRecordCount.textContent =
            "Showing 0 courses";

        updateCourseSummary(courses);

        return;
    }

    filteredCourses.forEach((course) => {
        const courseCard =
            document.createElement("article");

        courseCard.className = "course-card";

        const statusClass =
            course.status === "Active"
                ? "course-status-active"
                : "course-status-inactive";

        courseCard.innerHTML = `
            <div class="course-card-header">

                <div class="course-card-icon">
                    <i class="bi bi-journal-bookmark-fill"></i>
                </div>

                <span
                    class="course-card-status ${statusClass}"
                >
                    ${escapeHTML(course.status)}
                </span>

            </div>

            <div class="course-card-body">

                <span class="course-card-code">
                    ${escapeHTML(course.courseCode)}
                </span>

                <h3 class="course-card-title">
                    ${escapeHTML(course.courseName)}
                </h3>

                <p class="course-card-description">
                    ${escapeHTML(
            course.description ||
            "No course description available."
        )}
                </p>

                <div class="course-card-details">

                    <div class="course-detail-item">
                        <i class="bi bi-building"></i>

                        <div>
                            <span>Department</span>
                            <strong>
                                ${escapeHTML(course.department)}
                            </strong>
                        </div>
                    </div>

                    <div class="course-detail-item">
                        <i class="bi bi-calendar3"></i>

                        <div>
                            <span>Semester</span>
                            <strong>
                                ${escapeHTML(course.semester)}
                            </strong>
                        </div>
                    </div>

                </div>

            </div>

            <div class="course-card-footer">

                <div class="course-credit-badge">
                    <i class="bi bi-award-fill"></i>

                    <span>
                        ${Number(course.credits)} Credits
                    </span>
                </div>

                <div class="course-action-group">

                    <button
                        type="button"
                        class="course-action-button view-course-button"
                        title="View course"
                        onclick="viewCourse(${course.courseId})"
                    >
                        <i class="bi bi-eye"></i>
                    </button>

                    <button
                        type="button"
                        class="course-action-button edit-course-button"
                        title="Edit course"
                        onclick="editCourse(${course.courseId})"
                    >
                        <i class="bi bi-pencil-square"></i>
                    </button>

                    <button
                        type="button"
                        class="course-action-button delete-course-button"
                        title="Delete course"
                        onclick="openDeleteCourseModal(${course.courseId})"
                    >
                        <i class="bi bi-trash3"></i>
                    </button>

                    <button
                        type="button"
                        class="course-action-button enroll-course-button"
                        title="Open enrollment page"
                        onclick="openEnrollmentPage(${course.courseId})"
                    >
                        <i class="bi bi-person-plus-fill"></i>
                        Enroll
                    </button>

                </div>

            </div>
        `;

        courseCardGrid.appendChild(courseCard);
    });

    courseRecordCount.textContent =
        `Showing ${filteredCourses.length} of ${courses.length} courses`;

    updateCourseSummary(courses);
}

/* ------------------------------------------------------
   COURSE SUMMARY
------------------------------------------------------ */

function updateCourseSummary(courses) {
    totalCoursesValue.textContent =
        courses.length;

    const departments = new Set(
        courses
            .map((course) => course.department)
            .filter(Boolean)
    );

    courseDepartmentCountValue.textContent =
        departments.size;

    const activeCourses = courses.filter(
        (course) =>
            course.status === "Active"
    );

    activeCoursesValue.textContent =
        activeCourses.length;

    const totalCredits = courses.reduce(
        (total, course) =>
            total + (Number(course.credits) || 0),
        0
    );

    totalCreditsValue.textContent =
        totalCredits;
}

/* ------------------------------------------------------
   CLEAR FORM ERRORS
------------------------------------------------------ */

function clearCourseFormErrors() {
    courseCodeError.textContent = "";
    courseNameError.textContent = "";
    courseDepartmentError.textContent = "";
    courseCreditsError.textContent = "";
    courseSemesterError.textContent = "";
    courseFormMessage.innerHTML = "";
}

/* ------------------------------------------------------
   COURSE FORM VALIDATION
------------------------------------------------------ */

function validateCourseForm() {
    clearCourseFormErrors();

    let isValid = true;

    const courseCode =
        courseCodeInput.value.trim();

    const courseName =
        courseNameInput.value.trim();

    const department =
        courseDepartmentInput.value;

    const credits =
        Number(courseCreditsInput.value);

    const semester =
        courseSemesterInput.value;

    if (courseCode === "") {
        courseCodeError.textContent =
            "Course code is required.";

        isValid = false;
    } else if (
        !/^[A-Za-z]{2,5}[0-9]{2,4}$/.test(courseCode)
    ) {
        courseCodeError.textContent =
            "Use a format such as CS101 or SE201.";
        isValid = false;
    }

    if (courseName === "") {
        courseNameError.textContent =
            "Course name is required.";

        isValid = false;
    }

    if (department === "") {
        courseDepartmentError.textContent =
            "Select a department.";

        isValid = false;
    }

    if (
        !Number.isInteger(credits) ||
        credits < 1 ||
        credits > 10
    ) {
        courseCreditsError.textContent =
            "Credits must be between 1 and 10.";

        isValid = false;
    }

    if (semester === "") {
        courseSemesterError.textContent =
            "Select a semester.";

        isValid = false;
    }

    return isValid;
}

/* ------------------------------------------------------
   ADD COURSE
------------------------------------------------------ */

function addCourse() {
    const courses = getCourses();

    const courseCode =
        courseCodeInput.value
            .trim()
            .toUpperCase();

    const duplicateCourse = courses.some(
        (course) =>
            String(course.courseCode)
                .toLowerCase() ===
            courseCode.toLowerCase()
    );

    if (duplicateCourse) {
        courseCodeError.textContent =
            "This course code already exists.";

        return false;
    }

    const newCourse = {
        courseId: generateCourseId(courses),

        courseCode,

        courseName:
            courseNameInput.value.trim(),

        department:
            courseDepartmentInput.value,

        credits:
            Number(courseCreditsInput.value),

        semester:
            courseSemesterInput.value,

        status:
            courseStatusInput.value,

        description:
            courseDescriptionInput.value.trim()
    };

    courses.push(newCourse);

    saveCourses(courses);

    courseModal.hide();

    resetCourseForm();

    displayCourses();

    showCoursePageMessage(
        "Course added successfully.",
        "success"
    );

    return true;
}

/* ------------------------------------------------------
   EDIT COURSE
------------------------------------------------------ */

function editCourse(courseId) {
    const courses = getCourses();

    const course = courses.find(
        (item) =>
            Number(item.courseId) ===
            Number(courseId)
    );

    if (!course) {
        showCoursePageMessage(
            "Course record was not found.",
            "danger"
        );

        return;
    }

    clearCourseFormErrors();

    courseIdInput.value =
        course.courseId;

    courseCodeInput.value =
        course.courseCode;

    courseNameInput.value =
        course.courseName;

    courseDepartmentInput.value =
        course.department;

    courseCreditsInput.value =
        course.credits;

    courseSemesterInput.value =
        course.semester;

    courseStatusInput.value =
        course.status;

    courseDescriptionInput.value =
        course.description || "";

    courseModalTitle.textContent =
        "Edit Course";

    saveCourseButtonText.textContent =
        "Update Course";

    courseModal.show();
}

/* ------------------------------------------------------
   UPDATE COURSE
------------------------------------------------------ */

function updateCourse(courseId) {
    const courses = getCourses();

    const courseIndex = courses.findIndex(
        (course) =>
            Number(course.courseId) ===
            Number(courseId)
    );

    if (courseIndex === -1) {
        showCoursePageMessage(
            "Course record was not found.",
            "danger"
        );

        return false;
    }

    const courseCode =
        courseCodeInput.value
            .trim()
            .toUpperCase();

    const duplicateCourse = courses.some(
        (course) =>
            String(course.courseCode)
                .toLowerCase() ===
            courseCode.toLowerCase() &&
            Number(course.courseId) !==
            Number(courseId)
    );

    if (duplicateCourse) {
        courseCodeError.textContent =
            "This course code already exists.";

        return false;
    }

    courses[courseIndex] = {
        ...courses[courseIndex],

        courseCode,

        courseName:
            courseNameInput.value.trim(),

        department:
            courseDepartmentInput.value,

        credits:
            Number(courseCreditsInput.value),

        semester:
            courseSemesterInput.value,

        status:
            courseStatusInput.value,

        description:
            courseDescriptionInput.value.trim()
    };

    saveCourses(courses);

    courseModal.hide();

    resetCourseForm();

    displayCourses();

    showCoursePageMessage(
        "Course updated successfully.",
        "success"
    );

    return true;
}

/* ------------------------------------------------------
   VIEW COURSE
------------------------------------------------------ */

function viewCourse(courseId) {
    const courses = getCourses();

    const course = courses.find(
        (item) =>
            Number(item.courseId) ===
            Number(courseId)
    );

    if (!course) {
        showCoursePageMessage(
            "Course record was not found.",
            "danger"
        );

        return;
    }

    alert(
        `Course Details\n\n` +
        `Course Code: ${course.courseCode}\n` +
        `Course Name: ${course.courseName}\n` +
        `Department: ${course.department}\n` +
        `Credits: ${course.credits}\n` +
        `Semester: ${course.semester}\n` +
        `Status: ${course.status}\n\n` +
        `Description:\n${course.description || "Not provided"}`
    );
}

/* ------------------------------------------------------
   DELETE COURSE
------------------------------------------------------ */

function openDeleteCourseModal(courseId) {
    deleteCourseIdInput.value =
        courseId;

    deleteCourseModal.show();
}

function deleteCourse() {
    const courseId = Number(
        deleteCourseIdInput.value
    );

    const courses = getCourses();

    const enrollments =
        getStoredArray("enrollments");

    const courseHasEnrollments =
        enrollments.some(
            (enrollment) =>
                Number(enrollment.courseId) ===
                courseId
        );

    if (courseHasEnrollments) {
        deleteCourseModal.hide();

        showCoursePageMessage(
            "This course cannot be deleted because students are enrolled in it.",
            "warning"
        );

        return;
    }

    const updatedCourses = courses.filter(
        (course) =>
            Number(course.courseId) !== courseId
    );

    if (
        updatedCourses.length ===
        courses.length
    ) {
        deleteCourseModal.hide();

        showCoursePageMessage(
            "Course record was not found.",
            "danger"
        );

        return;
    }

    saveCourses(updatedCourses);

    deleteCourseModal.hide();

    displayCourses();

    showCoursePageMessage(
        "Course deleted successfully.",
        "success"
    );
}

/* ------------------------------------------------------
   OPEN ENROLLMENT PAGE
------------------------------------------------------ */

function openEnrollmentPage(courseId) {
    localStorage.setItem(
        "selectedEnrollmentCourseId",
        String(courseId)
    );

    window.location.href =
        "enrollment.html";
}

/* ------------------------------------------------------
   FORM SUBMISSION
------------------------------------------------------ */

courseForm.addEventListener(
    "submit",
    (event) => {
        event.preventDefault();

        if (!validateCourseForm()) {
            return;
        }

        setSaveCourseLoading(true);

        window.setTimeout(() => {
            const courseId =
                courseIdInput.value;

            let completedSuccessfully;

            if (courseId) {
                completedSuccessfully =
                    updateCourse(Number(courseId));
            } else {
                completedSuccessfully =
                    addCourse();
            }

            if (!completedSuccessfully) {
                setSaveCourseLoading(false);
            }
        }, 450);
    }
);

/* ------------------------------------------------------
   RESET COURSE FORM
------------------------------------------------------ */

function resetCourseForm() {
    courseForm.reset();

    courseIdInput.value = "";

    courseStatusInput.value =
        "Active";

    courseModalTitle.textContent =
        "Add New Course";

    saveCourseButtonText.textContent =
        "Save Course";

    clearCourseFormErrors();

    setSaveCourseLoading(false);
}

openAddCourseButton.addEventListener(
    "click",
    resetCourseForm
);

courseModalElement.addEventListener(
    "hidden.bs.modal",
    resetCourseForm
);

/* ------------------------------------------------------
   SEARCH AND FILTER EVENTS
------------------------------------------------------ */

courseSearchInput.addEventListener(
    "input",
    displayCourses
);

courseDepartmentFilter.addEventListener(
    "change",
    displayCourses
);

courseStatusFilter.addEventListener(
    "change",
    displayCourses
);

refreshCoursesButton.addEventListener(
    "click",
    () => {
        courseSearchInput.value = "";
        courseDepartmentFilter.value = "";
        courseStatusFilter.value = "";

        displayCourses();

        showCoursePageMessage(
            "Course records refreshed.",
            "info"
        );
    }
);

/* ------------------------------------------------------
   DELETE EVENT
------------------------------------------------------ */

confirmDeleteCourseButton.addEventListener(
    "click",
    deleteCourse
);

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
   HELPER FUNCTIONS
------------------------------------------------------ */

function generateCourseId(courses) {
    if (courses.length === 0) {
        return 1;
    }

    const highestId = Math.max(
        ...courses.map(
            (course) =>
                Number(course.courseId) || 0
        )
    );

    return highestId + 1;
}

function getStoredArray(key) {
    const storedValue =
        localStorage.getItem(key);

    if (!storedValue) {
        return [];
    }

    try {
        const parsedValue =
            JSON.parse(storedValue);

        return Array.isArray(parsedValue)
            ? parsedValue
            : [];
    } catch (error) {
        console.error(
            `Unable to read ${key}:`,
            error
        );

        return [];
    }
}

function setSaveCourseLoading(isLoading) {
    saveCourseButton.disabled =
        isLoading;

    saveCourseSpinner.classList.toggle(
        "d-none",
        !isLoading
    );

    if (isLoading) {
        saveCourseButtonText.textContent =
            "Saving...";
    } else if (courseIdInput.value) {
        saveCourseButtonText.textContent =
            "Update Course";
    } else {
        saveCourseButtonText.textContent =
            "Save Course";
    }
}

function showCoursePageMessage(
    message,
    type
) {
    coursePageMessage.innerHTML = `
        <div class="alert alert-${type}">
            ${escapeHTML(message)}
        </div>
    `;

    window.setTimeout(() => {
        coursePageMessage.innerHTML = "";
    }, 3500);
}

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

   Later use:

   GET /api/courses
   POST /api/courses
   PUT /api/courses/:id
   DELETE /api/courses/:id

   Example:

   const API_BASE_URL =
       "http://localhost:5001/api";

   const response = await fetch(
       `${API_BASE_URL}/courses`
   );

   const courses =
       await response.json();
------------------------------------------------------ */

/* ------------------------------------------------------
   INITIAL PAGE LOAD
------------------------------------------------------ */

document.addEventListener(
    "DOMContentLoaded",
    () => {
        protectPage();
        initializeCourses();
        loadUserInformation();
        displayCourses();
    }
);