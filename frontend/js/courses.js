"use strict";

/*
=========================================================
UNIVERSITY ERP SYSTEM
Course Management Frontend Module
Backend connected version
=========================================================
*/

/* ------------------------------------------------------
   PAGE ELEMENTS
------------------------------------------------------ */

const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");
const mobileMenuButton = document.getElementById("mobileMenuButton");
const sidebarCloseButton = document.getElementById("sidebarCloseButton");

const sidebarLogoutButton = document.getElementById("sidebarLogoutButton");
const topLogoutButton = document.getElementById("topLogoutButton");

const sidebarUsername = document.getElementById("sidebarUsername");
const sidebarRole = document.getElementById("sidebarRole");
const topUsername = document.getElementById("topUsername");
const topRole = document.getElementById("topRole");

const courseCardGrid = document.getElementById("courseCardGrid");
const courseSearchInput = document.getElementById("courseSearchInput");
const courseDepartmentFilter = document.getElementById("courseDepartmentFilter");
const courseStatusFilter = document.getElementById("courseStatusFilter");
const refreshCoursesButton = document.getElementById("refreshCoursesButton");

const courseRecordCount = document.getElementById("courseRecordCount");
const totalCoursesValue = document.getElementById("totalCoursesValue");
const courseDepartmentCountValue = document.getElementById("courseDepartmentCountValue");
const activeCoursesValue = document.getElementById("activeCoursesValue");
const totalCreditsValue = document.getElementById("totalCreditsValue");
const coursePageMessage = document.getElementById("coursePageMessage");

/* ------------------------------------------------------
   COURSE FORM ELEMENTS
------------------------------------------------------ */

const courseForm = document.getElementById("courseForm");
const courseIdInput = document.getElementById("courseId");
const courseCodeInput = document.getElementById("courseCode");
const courseNameInput = document.getElementById("courseName");
const courseDepartmentInput = document.getElementById("courseDepartment");
const courseCreditsInput = document.getElementById("courseCredits");
const courseSemesterInput = document.getElementById("courseSemester");
const courseStatusInput = document.getElementById("courseStatus");
const courseDescriptionInput = document.getElementById("courseDescription");

const courseCodeError = document.getElementById("courseCodeError");
const courseNameError = document.getElementById("courseNameError");
const courseDepartmentError = document.getElementById("courseDepartmentError");
const courseCreditsError = document.getElementById("courseCreditsError");
const courseSemesterError = document.getElementById("courseSemesterError");
const courseFormMessage = document.getElementById("courseFormMessage");

const courseModalTitle = document.getElementById("courseModalTitle");
const saveCourseButton = document.getElementById("saveCourseButton");
const saveCourseButtonText = document.getElementById("saveCourseButtonText");
const saveCourseSpinner = document.getElementById("saveCourseSpinner");
const openAddCourseButton = document.getElementById("openAddCourseButton");

/* ------------------------------------------------------
   DELETE COURSE ELEMENTS
------------------------------------------------------ */

const deleteCourseIdInput = document.getElementById("deleteCourseId");
const confirmDeleteCourseButton = document.getElementById("confirmDeleteCourseButton");

/* ------------------------------------------------------
   BOOTSTRAP MODALS
------------------------------------------------------ */

const courseModalElement = document.getElementById("courseModal");
const deleteCourseModalElement = document.getElementById("deleteCourseModal");

const courseModal = new bootstrap.Modal(courseModalElement);
const deleteCourseModal = new bootstrap.Modal(deleteCourseModalElement);

/* ------------------------------------------------------
   STATE
------------------------------------------------------ */

let courses = [];

/* ------------------------------------------------------
   LOGIN PROTECTION
------------------------------------------------------ */

function protectPage() {
    const token = localStorage.getItem("token");
    const isLoggedIn = localStorage.getItem("isLoggedIn");

    if (!token && isLoggedIn !== "true") {
        window.location.replace("login.html");
    }
}

/* ------------------------------------------------------
   USER INFORMATION
------------------------------------------------------ */

function loadUserInformation() {
    const storedUser =
        localStorage.getItem("user") ||
        localStorage.getItem("loggedUser");

    let user = {
        username: "Administrator",
        role: "Admin"
    };

    if (storedUser) {
        try {
            user = JSON.parse(storedUser);
        } catch (error) {
            console.error("Unable to read logged user:", error);
        }
    }

    const displayName =
        user.username || user.Username || "Administrator";

    const displayRole =
        user.role || user.Role || "Admin";

    sidebarUsername.textContent = displayName;
    sidebarRole.textContent = displayRole;

    topUsername.textContent = displayName;
    topRole.textContent = displayRole;
}

/* ------------------------------------------------------
   API HELPERS
------------------------------------------------------ */

function unwrapApiArray(responseData) {
    if (Array.isArray(responseData)) {
        return responseData;
    }

    if (Array.isArray(responseData.data)) {
        return responseData.data;
    }

    if (Array.isArray(responseData.courses)) {
        return responseData.courses;
    }

    return [];
}

function normalizeCourse(course) {
    return {
        courseId:
            course.CourseID ??
            course.courseId ??
            course.id,

        courseCode:
            course.CourseCode ??
            course.courseCode ??
            "",

        courseName:
            course.CourseName ??
            course.courseName ??
            "",

        department:
            course.Department ??
            course.department ??
            "",

        credits:
            course.Credits ??
            course.credits ??
            0,

        semester:
            course.Semester ??
            course.semester ??
            "N/A",

        status:
            course.Status ??
            course.status ??
            "Active",

        description:
            course.Description ??
            course.description ??
            "No course description available."
    };
}

function buildCoursePayload() {
    return {
        CourseCode: courseCodeInput.value.trim().toUpperCase(),
        CourseName: courseNameInput.value.trim(),
        Department: courseDepartmentInput.value,
        Credits: Number(courseCreditsInput.value)
    };
}

/* ------------------------------------------------------
   LOAD COURSES FROM BACKEND
------------------------------------------------------ */

async function loadCourses() {
    try {
        courseCardGrid.innerHTML = `
            <div class="course-empty-state">
                <h4>Loading courses...</h4>
            </div>
        `;

        const responseData = await fetchWithAuth("/courses");

        courses = unwrapApiArray(responseData).map(normalizeCourse);

        displayCourses();

    } catch (error) {
        console.error("Unable to load courses:", error);

        courses = [];
        displayCourses();

        showCoursePageMessage(
            error.message || "Unable to load course records.",
            "danger"
        );
    }
}

/* ------------------------------------------------------
   DISPLAY COURSES
------------------------------------------------------ */

function displayCourses() {
    const searchValue =
        courseSearchInput.value.trim().toLowerCase();

    const selectedDepartment =
        courseDepartmentFilter.value;

    const selectedStatus =
        courseStatusFilter.value;

    const filteredCourses = courses.filter((course) => {
        const courseCode =
            String(course.courseCode || "").toLowerCase();

        const courseName =
            String(course.courseName || "").toLowerCase();

        const description =
            String(course.description || "").toLowerCase();

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

        return matchesSearch && matchesDepartment && matchesStatus;
    });

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

        courseRecordCount.textContent = "Showing 0 courses";
        updateCourseSummary(courses);
        return;
    }

    filteredCourses.forEach((course) => {
        const courseCard = document.createElement("article");

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

                <span class="course-card-status ${statusClass}">
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
                    ${escapeHTML(course.description)}
                </p>

                <div class="course-card-details">
                    <div class="course-detail-item">
                        <i class="bi bi-building"></i>

                        <div>
                            <span>Department</span>
                            <strong>${escapeHTML(course.department)}</strong>
                        </div>
                    </div>

                    <div class="course-detail-item">
                        <i class="bi bi-calendar3"></i>

                        <div>
                            <span>Semester</span>
                            <strong>${escapeHTML(course.semester)}</strong>
                        </div>
                    </div>
                </div>
            </div>

            <div class="course-card-footer">
                <div class="course-credit-badge">
                    <i class="bi bi-award-fill"></i>
                    <span>${Number(course.credits)} Credits</span>
                </div>

                <div class="course-action-group">
                    <button
                        type="button"
                        class="course-action-button view-course-button"
                        title="View course"
                        onclick="viewCourse(${Number(course.courseId)})"
                    >
                        <i class="bi bi-eye"></i>
                    </button>

                    <button
                        type="button"
                        class="course-action-button edit-course-button"
                        title="Edit course"
                        onclick="editCourse(${Number(course.courseId)})"
                    >
                        <i class="bi bi-pencil-square"></i>
                    </button>

                    <button
                        type="button"
                        class="course-action-button delete-course-button"
                        title="Delete course"
                        onclick="openDeleteCourseModal(${Number(course.courseId)})"
                    >
                        <i class="bi bi-trash3"></i>
                    </button>

                    <button
                        type="button"
                        class="course-action-button enroll-course-button"
                        title="Open enrollment page"
                        onclick="openEnrollmentPage(${Number(course.courseId)})"
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

function updateCourseSummary(courseList) {
    totalCoursesValue.textContent = courseList.length;

    const departments = new Set(
        courseList
            .map((course) => course.department)
            .filter(Boolean)
    );

    courseDepartmentCountValue.textContent = departments.size;

    activeCoursesValue.textContent =
        courseList.filter((course) => course.status === "Active").length;

    totalCreditsValue.textContent =
        courseList.reduce(
            (total, course) => total + (Number(course.credits) || 0),
            0
        );
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

    const courseCode = courseCodeInput.value.trim();
    const courseName = courseNameInput.value.trim();
    const department = courseDepartmentInput.value;
    const credits = Number(courseCreditsInput.value);
    const semester = courseSemesterInput.value;

    if (courseCode === "") {
        courseCodeError.textContent = "Course code is required.";
        isValid = false;
    } else if (!/^[A-Za-z]{2,5}[0-9]{2,4}$/.test(courseCode)) {
        courseCodeError.textContent = "Use a format such as CS101 or SE201.";
        isValid = false;
    }

    if (courseName === "") {
        courseNameError.textContent = "Course name is required.";
        isValid = false;
    }

    if (department === "") {
        courseDepartmentError.textContent = "Select a department.";
        isValid = false;
    }

    if (!Number.isInteger(credits) || credits < 1 || credits > 10) {
        courseCreditsError.textContent = "Credits must be between 1 and 10.";
        isValid = false;
    }

    if (semester === "") {
        courseSemesterError.textContent = "Select a semester.";
        isValid = false;
    }

    return isValid;
}

/* ------------------------------------------------------
   ADD COURSE
------------------------------------------------------ */

async function addCourse() {
    const payload = buildCoursePayload();

    await fetchWithAuth("/courses", {
        method: "POST",
        body: JSON.stringify(payload)
    });

    courseModal.hide();
    resetCourseForm();

    showCoursePageMessage("Course added successfully.", "success");

    await loadCourses();
}

/* ------------------------------------------------------
   EDIT COURSE
------------------------------------------------------ */

function editCourse(courseId) {
    const course = courses.find(
        (item) => Number(item.courseId) === Number(courseId)
    );

    if (!course) {
        showCoursePageMessage("Course record was not found.", "danger");
        return;
    }

    clearCourseFormErrors();

    courseIdInput.value = course.courseId;
    courseCodeInput.value = course.courseCode;
    courseNameInput.value = course.courseName;
    courseDepartmentInput.value = course.department;
    courseCreditsInput.value = course.credits;
    courseSemesterInput.value =
        course.semester === "N/A" ? "Semester 1" : course.semester;
    courseStatusInput.value = course.status || "Active";
    courseDescriptionInput.value =
        course.description === "No course description available."
            ? ""
            : course.description;

    courseModalTitle.textContent = "Edit Course";
    saveCourseButtonText.textContent = "Update Course";

    courseModal.show();
}

/* ------------------------------------------------------
   UPDATE COURSE
------------------------------------------------------ */

async function updateCourse(courseId) {
    const payload = buildCoursePayload();

    await fetchWithAuth(`/courses/${courseId}`, {
        method: "PUT",
        body: JSON.stringify(payload)
    });

    courseModal.hide();
    resetCourseForm();

    showCoursePageMessage("Course updated successfully.", "success");

    await loadCourses();
}

/* ------------------------------------------------------
   VIEW COURSE
------------------------------------------------------ */

function viewCourse(courseId) {
    const course = courses.find(
        (item) => Number(item.courseId) === Number(courseId)
    );

    if (!course) {
        showCoursePageMessage("Course record was not found.", "danger");
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
    deleteCourseIdInput.value = courseId;
    deleteCourseModal.show();
}

async function deleteCourse() {
    const courseId = Number(deleteCourseIdInput.value);

    if (!courseId) {
        showCoursePageMessage("Invalid course record.", "danger");
        return;
    }

    try {
        confirmDeleteCourseButton.disabled = true;

        await fetchWithAuth(`/courses/${courseId}`, {
            method: "DELETE"
        });

        deleteCourseModal.hide();

        showCoursePageMessage("Course deleted successfully.", "success");

        await loadCourses();

    } catch (error) {
        console.error("Unable to delete course:", error);

        showCoursePageMessage(
            error.message || "Unable to delete course.",
            "danger"
        );

    } finally {
        confirmDeleteCourseButton.disabled = false;
    }
}

/* ------------------------------------------------------
   OPEN ENROLLMENT PAGE
------------------------------------------------------ */

function openEnrollmentPage(courseId) {
    localStorage.setItem(
        "selectedEnrollmentCourseId",
        String(courseId)
    );

    window.location.href = "enrollment.html";
}

/* ------------------------------------------------------
   FORM SUBMISSION
------------------------------------------------------ */

courseForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!validateCourseForm()) {
        return;
    }

    setSaveCourseLoading(true);

    try {
        const courseId = courseIdInput.value;

        if (courseId) {
            await updateCourse(Number(courseId));
        } else {
            await addCourse();
        }

    } catch (error) {
        console.error("Unable to save course:", error);

        courseFormMessage.innerHTML = `
            <div class="alert alert-danger">
                ${escapeHTML(error.message || "Unable to save course.")}
            </div>
        `;

    } finally {
        setSaveCourseLoading(false);
    }
});

/* ------------------------------------------------------
   RESET COURSE FORM
------------------------------------------------------ */

function resetCourseForm() {
    courseForm.reset();

    courseIdInput.value = "";
    courseStatusInput.value = "Active";

    courseModalTitle.textContent = "Add New Course";
    saveCourseButtonText.textContent = "Save Course";

    clearCourseFormErrors();
    setSaveCourseLoading(false);
}

openAddCourseButton.addEventListener("click", resetCourseForm);

courseModalElement.addEventListener("hidden.bs.modal", resetCourseForm);

/* ------------------------------------------------------
   SEARCH AND FILTER EVENTS
------------------------------------------------------ */

courseSearchInput.addEventListener("input", displayCourses);
courseDepartmentFilter.addEventListener("change", displayCourses);
courseStatusFilter.addEventListener("change", displayCourses);

refreshCoursesButton.addEventListener("click", async () => {
    courseSearchInput.value = "";
    courseDepartmentFilter.value = "";
    courseStatusFilter.value = "";

    await loadCourses();

    showCoursePageMessage("Course records refreshed.", "info");
});

/* ------------------------------------------------------
   DELETE EVENT
------------------------------------------------------ */

confirmDeleteCourseButton.addEventListener("click", deleteCourse);

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

mobileMenuButton.addEventListener("click", openSidebar);
sidebarCloseButton.addEventListener("click", closeSidebar);
sidebarOverlay.addEventListener("click", closeSidebar);

window.addEventListener("resize", () => {
    if (window.innerWidth > 900) {
        closeSidebar();
    }
});

/* ------------------------------------------------------
   LOGOUT
------------------------------------------------------ */

function logout() {
    if (typeof clearSession === "function") {
        clearSession();
    } else {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("loggedUser");
    }

    window.location.replace("login.html");
}

sidebarLogoutButton.addEventListener("click", logout);
topLogoutButton.addEventListener("click", logout);

/* ------------------------------------------------------
   HELPER FUNCTIONS
------------------------------------------------------ */

function setSaveCourseLoading(isLoading) {
    saveCourseButton.disabled = isLoading;

    saveCourseSpinner.classList.toggle("d-none", !isLoading);

    if (isLoading) {
        saveCourseButtonText.textContent = "Saving...";
    } else if (courseIdInput.value) {
        saveCourseButtonText.textContent = "Update Course";
    } else {
        saveCourseButtonText.textContent = "Save Course";
    }
}

function showCoursePageMessage(message, type) {
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
   INITIAL PAGE LOAD
------------------------------------------------------ */

document.addEventListener("DOMContentLoaded", async () => {
    protectPage();
    loadUserInformation();
    await loadCourses();
});