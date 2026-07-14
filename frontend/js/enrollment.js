"use strict";

/*
=========================================================
UNIVERSITY ERP SYSTEM
Course Registration and Enrollment Frontend Module
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

/* ------------------------------------------------------
   ENROLLMENT FORM ELEMENTS
------------------------------------------------------ */

const enrollmentForm = document.getElementById("enrollmentForm");
const enrollmentStudent = document.getElementById("enrollmentStudent");
const enrollmentCourse = document.getElementById("enrollmentCourse");
const enrollmentDate = document.getElementById("enrollmentDate");
const enrollmentStatus = document.getElementById("enrollmentStatus");

const enrollmentStudentError = document.getElementById("enrollmentStudentError");
const enrollmentCourseError = document.getElementById("enrollmentCourseError");
const enrollmentDateError = document.getElementById("enrollmentDateError");
const enrollmentFormMessage = document.getElementById("enrollmentFormMessage");

const saveEnrollmentButton = document.getElementById("saveEnrollmentButton");
const saveEnrollmentButtonText = document.getElementById("saveEnrollmentButtonText");
const saveEnrollmentSpinner = document.getElementById("saveEnrollmentSpinner");

const selectedCoursePreview = document.getElementById("selectedCoursePreview");

/* ------------------------------------------------------
   ENROLLMENT TABLE ELEMENTS
------------------------------------------------------ */

const enrollmentTableBody = document.getElementById("enrollmentTableBody");
const enrollmentSearchInput = document.getElementById("enrollmentSearchInput");
const enrollmentStatusFilter = document.getElementById("enrollmentStatusFilter");
const refreshEnrollmentsButton = document.getElementById("refreshEnrollmentsButton");

const enrollmentRecordCount = document.getElementById("enrollmentRecordCount");
const enrollmentPageMessage = document.getElementById("enrollmentPageMessage");

/* ------------------------------------------------------
   SUMMARY ELEMENTS
------------------------------------------------------ */

const totalEnrollmentsValue = document.getElementById("totalEnrollmentsValue");
const enrolledStudentsValue = document.getElementById("enrolledStudentsValue");
const enrolledCoursesValue = document.getElementById("enrolledCoursesValue");
const activeEnrollmentsValue = document.getElementById("activeEnrollmentsValue");

/* ------------------------------------------------------
   DELETE MODAL ELEMENTS
------------------------------------------------------ */

const deleteEnrollmentId = document.getElementById("deleteEnrollmentId");
const confirmDeleteEnrollmentButton = document.getElementById("confirmDeleteEnrollmentButton");

const deleteEnrollmentModalElement = document.getElementById("deleteEnrollmentModal");
const deleteEnrollmentModal = new bootstrap.Modal(deleteEnrollmentModalElement);

/* ------------------------------------------------------
   STATE
------------------------------------------------------ */

let students = [];
let courses = [];
let enrollments = [];

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

function unwrapApiArray(responseData, key) {
    if (Array.isArray(responseData)) {
        return responseData;
    }

    if (Array.isArray(responseData.data)) {
        return responseData.data;
    }

    if (Array.isArray(responseData[key])) {
        return responseData[key];
    }

    return [];
}

function normalizeStudent(student) {
    return {
        studentId:
            student.StudentID ??
            student.studentId ??
            student.id,

        registrationNumber:
            student.RegistrationNumber ??
            student.registrationNumber ??
            "",

        fullName:
            student.FullName ??
            student.fullName ??
            "",

        email:
            student.Email ??
            student.email ??
            "",

        department:
            student.Department ??
            student.department ??
            "",

        academicYear:
            student.AcademicYear ??
            student.academicYear ??
            "",

        status:
            student.Status ??
            student.status ??
            "Active"
    };
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
            "No course description is available."
    };
}

function normalizeEnrollment(enrollment) {
    return {
        enrollmentId:
            enrollment.EnrollmentID ??
            enrollment.enrollmentId ??
            enrollment.id,

        studentId:
            enrollment.StudentID ??
            enrollment.studentId,

        courseId:
            enrollment.CourseID ??
            enrollment.courseId,

        enrollmentDate:
            enrollment.EnrollmentDate ??
            enrollment.enrollmentDate ??
            "",

        status:
            enrollment.Status ??
            enrollment.status ??
            "Active",

        student: normalizeStudent(enrollment),
        course: normalizeCourse(enrollment)
    };
}

/* ------------------------------------------------------
   LOAD DATA FROM BACKEND
------------------------------------------------------ */

async function loadEnrollmentPageData() {
    try {
        enrollmentTableBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-4">
                    Loading enrollments...
                </td>
            </tr>
        `;

        const [
            studentsResponse,
            coursesResponse,
            enrollmentsResponse
        ] = await Promise.all([
            fetchWithAuth("/students"),
            fetchWithAuth("/courses"),
            fetchWithAuth("/enrollments")
        ]);

        students = unwrapApiArray(studentsResponse, "students").map(normalizeStudent);
        courses = unwrapApiArray(coursesResponse, "courses").map(normalizeCourse);
        enrollments = unwrapApiArray(enrollmentsResponse, "enrollments").map(normalizeEnrollment);

        populateStudentDropdown();
        populateCourseDropdown();
        displayEnrollments();

    } catch (error) {
        console.error("Unable to load enrollment page data:", error);

        students = [];
        courses = [];
        enrollments = [];

        populateStudentDropdown();
        populateCourseDropdown();
        displayEnrollments();

        showPageMessage(
            error.message || "Unable to load enrollment records.",
            "danger"
        );
    }
}

/* ------------------------------------------------------
   POPULATE STUDENT DROPDOWN
------------------------------------------------------ */

function populateStudentDropdown() {
    enrollmentStudent.innerHTML = `
        <option value="">
            Choose a student
        </option>
    `;

    students.forEach((student) => {
        const option = document.createElement("option");

        option.value = student.studentId;
        option.textContent =
            `${student.registrationNumber} - ${student.fullName}`;

        enrollmentStudent.appendChild(option);
    });
}

/* ------------------------------------------------------
   POPULATE COURSE DROPDOWN
------------------------------------------------------ */

function populateCourseDropdown() {
    enrollmentCourse.innerHTML = `
        <option value="">
            Choose a course
        </option>
    `;

    courses.forEach((course) => {
        const option = document.createElement("option");

        option.value = course.courseId;
        option.textContent =
            `${course.courseCode} - ${course.courseName}`;

        enrollmentCourse.appendChild(option);
    });

    applyPreselectedCourse();
}

/* ------------------------------------------------------
   PRESELECT COURSE FROM COURSES PAGE
------------------------------------------------------ */

function applyPreselectedCourse() {
    const selectedCourseId =
        localStorage.getItem("selectedEnrollmentCourseId");

    if (!selectedCourseId) {
        return;
    }

    const optionExists =
        Array.from(enrollmentCourse.options).some(
            (option) => option.value === selectedCourseId
        );

    if (optionExists) {
        enrollmentCourse.value = selectedCourseId;
        updateSelectedCoursePreview();
    }

    localStorage.removeItem("selectedEnrollmentCourseId");
}

/* ------------------------------------------------------
   SELECTED COURSE PREVIEW
------------------------------------------------------ */

function updateSelectedCoursePreview() {
    const courseId = Number(enrollmentCourse.value);

    if (!courseId) {
        selectedCoursePreview.className = "selected-course-empty";

        selectedCoursePreview.innerHTML = `
            <div class="selected-course-empty-icon">
                <i class="bi bi-journal-bookmark"></i>
            </div>

            <h4>No course selected</h4>

            <p>
                Select a course from the registration form
                to view its information.
            </p>
        `;

        return;
    }

    const course = courses.find(
        (item) => Number(item.courseId) === courseId
    );

    if (!course) {
        return;
    }

    selectedCoursePreview.className = "selected-course-card";

    selectedCoursePreview.innerHTML = `
        <div class="selected-course-card-header">
            <div class="selected-course-card-icon">
                <i class="bi bi-journal-bookmark-fill"></i>
            </div>

            <div>
                <span>${escapeHTML(course.courseCode)}</span>
                <h4>${escapeHTML(course.courseName)}</h4>
            </div>
        </div>

        <div class="selected-course-card-body">
            <p class="selected-course-description">
                ${escapeHTML(course.description)}
            </p>

            <div class="selected-course-detail-grid">
                <div class="selected-course-detail">
                    <span>Department</span>
                    <strong>${escapeHTML(course.department)}</strong>
                </div>

                <div class="selected-course-detail">
                    <span>Semester</span>
                    <strong>${escapeHTML(course.semester)}</strong>
                </div>

                <div class="selected-course-detail">
                    <span>Credits</span>
                    <strong>${Number(course.credits)}</strong>
                </div>

                <div class="selected-course-detail">
                    <span>Status</span>
                    <strong>${escapeHTML(course.status)}</strong>
                </div>
            </div>
        </div>
    `;
}

/* ------------------------------------------------------
   DISPLAY ENROLLMENTS
------------------------------------------------------ */

function displayEnrollments() {
    const searchValue =
        enrollmentSearchInput.value.trim().toLowerCase();

    const selectedStatus =
        enrollmentStatusFilter.value;

    const detailedEnrollments = enrollments.map((enrollment) => {
        const student =
            students.find(
                (item) => Number(item.studentId) === Number(enrollment.studentId)
            ) || enrollment.student;

        const course =
            courses.find(
                (item) => Number(item.courseId) === Number(enrollment.courseId)
            ) || enrollment.course;

        return {
            ...enrollment,
            student,
            course
        };
    });

    const filteredEnrollments = detailedEnrollments.filter((enrollment) => {
        const studentName = enrollment.student?.fullName || "";
        const registrationNumber = enrollment.student?.registrationNumber || "";
        const courseName = enrollment.course?.courseName || "";
        const courseCode = enrollment.course?.courseCode || "";

        const matchesSearch =
            studentName.toLowerCase().includes(searchValue) ||
            registrationNumber.toLowerCase().includes(searchValue) ||
            courseName.toLowerCase().includes(searchValue) ||
            courseCode.toLowerCase().includes(searchValue);

        const matchesStatus =
            selectedStatus === "" ||
            enrollment.status === selectedStatus;

        return matchesSearch && matchesStatus;
    });

    enrollmentTableBody.innerHTML = "";

    if (filteredEnrollments.length === 0) {
        enrollmentTableBody.innerHTML = `
            <tr>
                <td colspan="8">
                    <div class="enrollment-empty-state">
                        <div class="student-empty-icon">
                            <i class="bi bi-person-check"></i>
                        </div>

                        <h4>No enrollments found</h4>

                        <p>
                            Try changing the search text
                            or status filter.
                        </p>
                    </div>
                </td>
            </tr>
        `;

        enrollmentRecordCount.textContent = "Showing 0 enrollments";

        updateEnrollmentSummary(enrollments);

        return;
    }

    filteredEnrollments.forEach((enrollment) => {
        const student = enrollment.student;
        const course = enrollment.course;

        const statusClass =
            getEnrollmentStatusClass(enrollment.status);

        const initials =
            getInitials(student?.fullName || "Student");

        const row = document.createElement("tr");

        row.innerHTML = `
            <td>
                <span class="enrollment-id-badge">
                    ${escapeHTML(enrollment.enrollmentId)}
                </span>
            </td>

            <td>
                <div class="enrollment-person-cell">
                    <div class="enrollment-student-avatar">
                        ${escapeHTML(initials)}
                    </div>

                    <div class="enrollment-cell-details">
                        <strong>
                            ${escapeHTML(student?.fullName || "Unknown Student")}
                        </strong>

                        <span>
                            ${escapeHTML(student?.registrationNumber || "No registration number")}
                        </span>
                    </div>
                </div>
            </td>

            <td>
                <div class="enrollment-course-cell">
                    <div class="enrollment-course-icon">
                        <i class="bi bi-journal-bookmark-fill"></i>
                    </div>

                    <div class="enrollment-cell-details">
                        <strong>
                            ${escapeHTML(course?.courseName || "Unknown Course")}
                        </strong>

                        <span>
                            ${escapeHTML(course?.courseCode || "No course code")}
                        </span>
                    </div>
                </div>
            </td>

            <td>${escapeHTML(course?.department || "Not available")}</td>

            <td>${Number(course?.credits) || 0}</td>

            <td>${formatDate(enrollment.enrollmentDate)}</td>

            <td>
                <span class="enrollment-status-badge ${statusClass}">
                    ${escapeHTML(enrollment.status)}
                </span>
            </td>

            <td>
                <div class="enrollment-action-group">
                    <button
                        type="button"
                        class="enrollment-action-button view-enrollment-button"
                        title="View enrollment"
                        onclick="viewEnrollment(${Number(enrollment.enrollmentId)})"
                    >
                        <i class="bi bi-eye"></i>
                    </button>

                    <button
                        type="button"
                        class="enrollment-action-button remove-enrollment-button"
                        title="Remove enrollment"
                        onclick="openDeleteEnrollmentModal(${Number(enrollment.enrollmentId)})"
                    >
                        <i class="bi bi-person-x"></i>
                    </button>
                </div>
            </td>
        `;

        enrollmentTableBody.appendChild(row);
    });

    enrollmentRecordCount.textContent =
        `Showing ${filteredEnrollments.length} of ${enrollments.length} enrollments`;

    updateEnrollmentSummary(enrollments);
}

/* ------------------------------------------------------
   SUMMARY CARDS
------------------------------------------------------ */

function updateEnrollmentSummary(enrollmentList) {
    totalEnrollmentsValue.textContent = enrollmentList.length;

    const studentIds = new Set(
        enrollmentList.map((enrollment) => Number(enrollment.studentId))
    );

    const courseIds = new Set(
        enrollmentList.map((enrollment) => Number(enrollment.courseId))
    );

    enrolledStudentsValue.textContent = studentIds.size;
    enrolledCoursesValue.textContent = courseIds.size;

    activeEnrollmentsValue.textContent =
        enrollmentList.filter(
            (enrollment) => enrollment.status === "Active"
        ).length;
}

/* ------------------------------------------------------
   VALIDATION
------------------------------------------------------ */

function clearEnrollmentErrors() {
    enrollmentStudentError.textContent = "";
    enrollmentCourseError.textContent = "";
    enrollmentDateError.textContent = "";
    enrollmentFormMessage.innerHTML = "";
}

function validateEnrollmentForm() {
    clearEnrollmentErrors();

    let isValid = true;

    if (enrollmentStudent.value === "") {
        enrollmentStudentError.textContent = "Select a student.";
        isValid = false;
    }

    if (enrollmentCourse.value === "") {
        enrollmentCourseError.textContent = "Select a course.";
        isValid = false;
    }

    if (enrollmentDate.value === "") {
        enrollmentDateError.textContent = "Select an enrollment date.";
        isValid = false;
    }

    return isValid;
}

/* ------------------------------------------------------
   CREATE ENROLLMENT
------------------------------------------------------ */

async function createEnrollment() {
 const payload = {
    studentId: Number(enrollmentStudent.value),
    courseId: Number(enrollmentCourse.value),
    enrollmentDate: enrollmentDate.value
};

    await fetchWithAuth("/enrollments", {
        method: "POST",
        body: JSON.stringify(payload)
    });

    resetEnrollmentForm();

    showPageMessage(
        "Student registered for the course successfully.",
        "success"
    );

    await loadEnrollmentPageData();
}

/* ------------------------------------------------------
   FORM SUBMISSION
------------------------------------------------------ */

enrollmentForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!validateEnrollmentForm()) {
        return;
    }

    setSaveEnrollmentLoading(true);

    try {
        await createEnrollment();

    } catch (error) {
        console.error("Unable to create enrollment:", error);

        showFormMessage(
            error.message || "Unable to register student for course.",
            "danger"
        );

    } finally {
        setSaveEnrollmentLoading(false);
    }
});

/* ------------------------------------------------------
   VIEW ENROLLMENT
------------------------------------------------------ */

function viewEnrollment(enrollmentId) {
    const enrollment = enrollments.find(
        (item) => Number(item.enrollmentId) === Number(enrollmentId)
    );

    if (!enrollment) {
        showPageMessage("Enrollment record was not found.", "danger");
        return;
    }

    const student =
        students.find(
            (item) => Number(item.studentId) === Number(enrollment.studentId)
        ) || enrollment.student;

    const course =
        courses.find(
            (item) => Number(item.courseId) === Number(enrollment.courseId)
        ) || enrollment.course;

    alert(
        `Enrollment Details\n\n` +
        `Enrollment ID: ${enrollment.enrollmentId}\n` +
        `Student: ${student?.fullName || "Unknown"}\n` +
        `Registration Number: ${student?.registrationNumber || "Unknown"}\n` +
        `Course: ${course?.courseName || "Unknown"}\n` +
        `Course Code: ${course?.courseCode || "Unknown"}\n` +
        `Enrollment Date: ${formatDate(enrollment.enrollmentDate)}\n` +
        `Status: ${enrollment.status}`
    );
}

/* ------------------------------------------------------
   DELETE ENROLLMENT
------------------------------------------------------ */

function openDeleteEnrollmentModal(enrollmentId) {
    deleteEnrollmentId.value = enrollmentId;
    deleteEnrollmentModal.show();
}

async function removeEnrollment() {
    const enrollmentId = Number(deleteEnrollmentId.value);

    if (!enrollmentId) {
        showPageMessage("Invalid enrollment record.", "danger");
        return;
    }

    try {
        confirmDeleteEnrollmentButton.disabled = true;

        await fetchWithAuth(`/enrollments/${enrollmentId}`, {
            method: "DELETE"
        });

        deleteEnrollmentModal.hide();

        showPageMessage("Enrollment removed successfully.", "success");

        await loadEnrollmentPageData();

    } catch (error) {
        console.error("Unable to remove enrollment:", error);

        showPageMessage(
            error.message || "Unable to remove enrollment.",
            "danger"
        );

    } finally {
        confirmDeleteEnrollmentButton.disabled = false;
    }
}

confirmDeleteEnrollmentButton.addEventListener("click", removeEnrollment);

/* ------------------------------------------------------
   FORM AND FILTER EVENTS
------------------------------------------------------ */

enrollmentCourse.addEventListener("change", updateSelectedCoursePreview);
enrollmentSearchInput.addEventListener("input", displayEnrollments);
enrollmentStatusFilter.addEventListener("change", displayEnrollments);

refreshEnrollmentsButton.addEventListener("click", async () => {
    enrollmentSearchInput.value = "";
    enrollmentStatusFilter.value = "";

    await loadEnrollmentPageData();

    showPageMessage("Enrollment records refreshed.", "info");
});

/* ------------------------------------------------------
   RESET FORM
------------------------------------------------------ */

function resetEnrollmentForm() {
    enrollmentForm.reset();

    setTodayAsEnrollmentDate();

    if (enrollmentStatus) {
        enrollmentStatus.value = "Active";
    }

    clearEnrollmentErrors();

    updateSelectedCoursePreview();
}

/* ------------------------------------------------------
   TODAY'S DATE
------------------------------------------------------ */

function setTodayAsEnrollmentDate() {
    const today = new Date();

    const year = today.getFullYear();

    const month =
        String(today.getMonth() + 1).padStart(2, "0");

    const day =
        String(today.getDate()).padStart(2, "0");

    enrollmentDate.value = `${year}-${month}-${day}`;
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

function getInitials(fullName) {
    return String(fullName || "")
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join("");
}

function getEnrollmentStatusClass(status) {
    if (status === "Completed") {
        return "enrollment-completed-status";
    }

    if (status === "Dropped") {
        return "enrollment-dropped-status";
    }

    return "enrollment-active-status";
}

function formatDate(dateValue) {
    if (!dateValue) {
        return "Not available";
    }

    const cleanDate =
        String(dateValue).includes("T")
            ? String(dateValue).split("T")[0]
            : String(dateValue);

    const date = new Date(`${cleanDate}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
        return String(dateValue);
    }

    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

function setSaveEnrollmentLoading(isLoading) {
    saveEnrollmentButton.disabled = isLoading;

    saveEnrollmentSpinner.classList.toggle("d-none", !isLoading);

    saveEnrollmentButtonText.textContent =
        isLoading
            ? "Registering..."
            : "Register Student";
}

function showFormMessage(message, type) {
    enrollmentFormMessage.innerHTML = `
        <div class="alert alert-${type}">
            ${escapeHTML(message)}
        </div>
    `;
}

function showPageMessage(message, type) {
    enrollmentPageMessage.innerHTML = `
        <div class="alert alert-${type}">
            ${escapeHTML(message)}
        </div>
    `;

    window.setTimeout(() => {
        enrollmentPageMessage.innerHTML = "";
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
    setTodayAsEnrollmentDate();
    updateSelectedCoursePreview();
    await loadEnrollmentPageData();
});