"use strict";

/*
=========================================================
UNIVERSITY ERP SYSTEM
Course Registration and Enrollment Frontend Module

Current data source:
- localStorage

Future backend endpoints:
GET    /api/students
GET    /api/courses
GET    /api/enrollments
POST   /api/enrollments
DELETE /api/enrollments/:id
=========================================================
*/

/* ------------------------------------------------------
   PAGE ELEMENTS
------------------------------------------------------ */

const sidebar =
    document.getElementById("sidebar");

const sidebarOverlay =
    document.getElementById("sidebarOverlay");

const mobileMenuButton =
    document.getElementById("mobileMenuButton");

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

/* ------------------------------------------------------
   ENROLLMENT FORM ELEMENTS
------------------------------------------------------ */

const enrollmentForm =
    document.getElementById("enrollmentForm");

const enrollmentStudent =
    document.getElementById("enrollmentStudent");

const enrollmentCourse =
    document.getElementById("enrollmentCourse");

const enrollmentDate =
    document.getElementById("enrollmentDate");

const enrollmentStatus =
    document.getElementById("enrollmentStatus");

const enrollmentStudentError =
    document.getElementById("enrollmentStudentError");

const enrollmentCourseError =
    document.getElementById("enrollmentCourseError");

const enrollmentDateError =
    document.getElementById("enrollmentDateError");

const enrollmentFormMessage =
    document.getElementById("enrollmentFormMessage");

const saveEnrollmentButton =
    document.getElementById("saveEnrollmentButton");

const saveEnrollmentButtonText =
    document.getElementById("saveEnrollmentButtonText");

const saveEnrollmentSpinner =
    document.getElementById("saveEnrollmentSpinner");

const selectedCoursePreview =
    document.getElementById("selectedCoursePreview");

/* ------------------------------------------------------
   ENROLLMENT TABLE ELEMENTS
------------------------------------------------------ */

const enrollmentTableBody =
    document.getElementById("enrollmentTableBody");

const enrollmentSearchInput =
    document.getElementById("enrollmentSearchInput");

const enrollmentStatusFilter =
    document.getElementById("enrollmentStatusFilter");

const refreshEnrollmentsButton =
    document.getElementById("refreshEnrollmentsButton");

const enrollmentRecordCount =
    document.getElementById("enrollmentRecordCount");

const enrollmentPageMessage =
    document.getElementById("enrollmentPageMessage");

/* ------------------------------------------------------
   SUMMARY ELEMENTS
------------------------------------------------------ */

const totalEnrollmentsValue =
    document.getElementById("totalEnrollmentsValue");

const enrolledStudentsValue =
    document.getElementById("enrolledStudentsValue");

const enrolledCoursesValue =
    document.getElementById("enrolledCoursesValue");

const activeEnrollmentsValue =
    document.getElementById("activeEnrollmentsValue");

/* ------------------------------------------------------
   DELETE MODAL ELEMENTS
------------------------------------------------------ */

const deleteEnrollmentId =
    document.getElementById("deleteEnrollmentId");

const confirmDeleteEnrollmentButton =
    document.getElementById(
        "confirmDeleteEnrollmentButton"
    );

const deleteEnrollmentModalElement =
    document.getElementById("deleteEnrollmentModal");

const deleteEnrollmentModal =
    new bootstrap.Modal(deleteEnrollmentModalElement);

/* ------------------------------------------------------
   SAMPLE ENROLLMENT DATA
------------------------------------------------------ */

const defaultEnrollments = [
    {
        enrollmentId: 1,
        studentId: 1,
        courseId: 1,
        enrollmentDate: "2026-07-01",
        status: "Active"
    },
    {
        enrollmentId: 2,
        studentId: 1,
        courseId: 2,
        enrollmentDate: "2026-07-02",
        status: "Active"
    },
    {
        enrollmentId: 3,
        studentId: 2,
        courseId: 3,
        enrollmentDate: "2026-07-03",
        status: "Completed"
    },
    {
        enrollmentId: 4,
        studentId: 3,
        courseId: 4,
        enrollmentDate: "2026-07-04",
        status: "Dropped"
    }
];

/* ------------------------------------------------------
   LOGIN PROTECTION
------------------------------------------------------ */

function protectPage() {
    const isLoggedIn =
        localStorage.getItem("isLoggedIn");

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

    sidebarUsername.textContent =
        displayName;

    sidebarRole.textContent =
        displayRole;

    topUsername.textContent =
        displayName;

    topRole.textContent =
        displayRole;
}

/* ------------------------------------------------------
   LOCAL STORAGE FUNCTIONS
------------------------------------------------------ */

function initializeEnrollments() {
    if (!localStorage.getItem("enrollments")) {
        saveEnrollments(defaultEnrollments);
    }
}

function getStudents() {
    return getStoredArray("students");
}

function getCourses() {
    return getStoredArray("courses");
}

function getEnrollments() {
    return getStoredArray("enrollments");
}

function saveEnrollments(enrollments) {
    localStorage.setItem(
        "enrollments",
        JSON.stringify(enrollments)
    );
}

/* ------------------------------------------------------
   POPULATE STUDENT DROPDOWN
------------------------------------------------------ */

function populateStudentDropdown() {
    const students = getStudents();

    enrollmentStudent.innerHTML = `
        <option value="">
            Choose a student
        </option>
    `;

    students
        .filter(
            (student) =>
                student.status !== "Inactive"
        )
        .forEach((student) => {
            const option =
                document.createElement("option");

            option.value =
                student.studentId;

            option.textContent =
                `${student.registrationNumber} - ${student.fullName}`;

            enrollmentStudent.appendChild(option);
        });
}

/* ------------------------------------------------------
   POPULATE COURSE DROPDOWN
------------------------------------------------------ */

function populateCourseDropdown() {
    const courses = getCourses();

    enrollmentCourse.innerHTML = `
        <option value="">
            Choose a course
        </option>
    `;

    courses
        .filter(
            (course) =>
                course.status === "Active"
        )
        .forEach((course) => {
            const option =
                document.createElement("option");

            option.value =
                course.courseId;

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
        localStorage.getItem(
            "selectedEnrollmentCourseId"
        );

    if (!selectedCourseId) {
        return;
    }

    const optionExists =
        Array.from(
            enrollmentCourse.options
        ).some(
            (option) =>
                option.value === selectedCourseId
        );

    if (optionExists) {
        enrollmentCourse.value =
            selectedCourseId;

        updateSelectedCoursePreview();
    }

    localStorage.removeItem(
        "selectedEnrollmentCourseId"
    );
}

/* ------------------------------------------------------
   SELECTED COURSE PREVIEW
------------------------------------------------------ */

function updateSelectedCoursePreview() {
    const courseId =
        Number(enrollmentCourse.value);

    if (!courseId) {
        selectedCoursePreview.className =
            "selected-course-empty";

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

    const course = getCourses().find(
        (item) =>
            Number(item.courseId) === courseId
    );

    if (!course) {
        return;
    }

    selectedCoursePreview.className =
        "selected-course-card";

    selectedCoursePreview.innerHTML = `
        <div class="selected-course-card-header">

            <div class="selected-course-card-icon">
                <i class="bi bi-journal-bookmark-fill"></i>
            </div>

            <div>
                <span>
                    ${escapeHTML(course.courseCode)}
                </span>

                <h4>
                    ${escapeHTML(course.courseName)}
                </h4>
            </div>

        </div>

        <div class="selected-course-card-body">

            <p class="selected-course-description">
                ${escapeHTML(
        course.description ||
        "No course description is available."
    )}
            </p>

            <div class="selected-course-detail-grid">

                <div class="selected-course-detail">
                    <span>Department</span>
                    <strong>
                        ${escapeHTML(course.department)}
                    </strong>
                </div>

                <div class="selected-course-detail">
                    <span>Semester</span>
                    <strong>
                        ${escapeHTML(course.semester)}
                    </strong>
                </div>

                <div class="selected-course-detail">
                    <span>Credits</span>
                    <strong>
                        ${Number(course.credits)}
                    </strong>
                </div>

                <div class="selected-course-detail">
                    <span>Status</span>
                    <strong>
                        ${escapeHTML(course.status)}
                    </strong>
                </div>

            </div>

        </div>
    `;
}

/* ------------------------------------------------------
   DISPLAY ENROLLMENTS
------------------------------------------------------ */

function displayEnrollments() {
    const enrollments =
        getEnrollments();

    const students =
        getStudents();

    const courses =
        getCourses();

    const searchValue =
        enrollmentSearchInput.value
            .trim()
            .toLowerCase();

    const selectedStatus =
        enrollmentStatusFilter.value;

    const detailedEnrollments =
        enrollments.map((enrollment) => {
            const student = students.find(
                (item) =>
                    Number(item.studentId) ===
                    Number(enrollment.studentId)
            );

            const course = courses.find(
                (item) =>
                    Number(item.courseId) ===
                    Number(enrollment.courseId)
            );

            return {
                ...enrollment,
                student,
                course
            };
        });

    const filteredEnrollments =
        detailedEnrollments.filter(
            (enrollment) => {
                const studentName =
                    enrollment.student?.fullName || "";

                const registrationNumber =
                    enrollment.student
                        ?.registrationNumber || "";

                const courseName =
                    enrollment.course?.courseName || "";

                const courseCode =
                    enrollment.course?.courseCode || "";

                const matchesSearch =
                    studentName
                        .toLowerCase()
                        .includes(searchValue) ||
                    registrationNumber
                        .toLowerCase()
                        .includes(searchValue) ||
                    courseName
                        .toLowerCase()
                        .includes(searchValue) ||
                    courseCode
                        .toLowerCase()
                        .includes(searchValue);

                const matchesStatus =
                    selectedStatus === "" ||
                    enrollment.status ===
                    selectedStatus;

                return (
                    matchesSearch &&
                    matchesStatus
                );
            }
        );

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

        enrollmentRecordCount.textContent =
            "Showing 0 enrollments";

        updateEnrollmentSummary(enrollments);

        return;
    }

    filteredEnrollments.forEach(
        (enrollment) => {
            const student =
                enrollment.student;

            const course =
                enrollment.course;

            const statusClass =
                getEnrollmentStatusClass(
                    enrollment.status
                );

            const initials =
                getInitials(
                    student?.fullName || "Student"
                );

            const row =
                document.createElement("tr");

            row.innerHTML = `
                <td>
                    <span class="enrollment-id-badge">
                        ${enrollment.enrollmentId}
                    </span>
                </td>

                <td>
                    <div class="enrollment-person-cell">

                        <div class="enrollment-student-avatar">
                            ${initials}
                        </div>

                        <div class="enrollment-cell-details">
                            <strong>
                                ${escapeHTML(
                student?.fullName ||
                "Unknown Student"
            )}
                            </strong>

                            <span>
                                ${escapeHTML(
                student?.registrationNumber ||
                "No registration number"
            )}
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
                                ${escapeHTML(
                course?.courseName ||
                "Unknown Course"
            )}
                            </strong>

                            <span>
                                ${escapeHTML(
                course?.courseCode ||
                "No course code"
            )}
                            </span>
                        </div>

                    </div>
                </td>

                <td>
                    ${escapeHTML(
                course?.department ||
                "Not available"
            )}
                </td>

                <td>
                    ${Number(course?.credits) || 0}
                </td>

                <td>
                    ${formatDate(
                enrollment.enrollmentDate
            )}
                </td>

                <td>
                    <span
                        class="enrollment-status-badge ${statusClass}"
                    >
                        ${escapeHTML(enrollment.status)}
                    </span>
                </td>

                <td>
                    <div class="enrollment-action-group">

                        <button
                            type="button"
                            class="enrollment-action-button view-enrollment-button"
                            title="View enrollment"
                            onclick="viewEnrollment(${enrollment.enrollmentId})"
                        >
                            <i class="bi bi-eye"></i>
                        </button>

                        <button
                            type="button"
                            class="enrollment-action-button remove-enrollment-button"
                            title="Remove enrollment"
                            onclick="openDeleteEnrollmentModal(${enrollment.enrollmentId})"
                        >
                            <i class="bi bi-person-x"></i>
                        </button>

                    </div>
                </td>
            `;

            enrollmentTableBody.appendChild(row);
        }
    );

    enrollmentRecordCount.textContent =
        `Showing ${filteredEnrollments.length} of ${enrollments.length} enrollments`;

    updateEnrollmentSummary(enrollments);
}

/* ------------------------------------------------------
   SUMMARY CARDS
------------------------------------------------------ */

function updateEnrollmentSummary(
    enrollments
) {
    totalEnrollmentsValue.textContent =
        enrollments.length;

    const studentIds = new Set(
        enrollments.map(
            (enrollment) =>
                Number(enrollment.studentId)
        )
    );

    const courseIds = new Set(
        enrollments.map(
            (enrollment) =>
                Number(enrollment.courseId)
        )
    );

    const activeEnrollments =
        enrollments.filter(
            (enrollment) =>
                enrollment.status === "Active"
        );

    enrolledStudentsValue.textContent =
        studentIds.size;

    enrolledCoursesValue.textContent =
        courseIds.size;

    activeEnrollmentsValue.textContent =
        activeEnrollments.length;
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
        enrollmentStudentError.textContent =
            "Select a student.";

        isValid = false;
    }

    if (enrollmentCourse.value === "") {
        enrollmentCourseError.textContent =
            "Select a course.";

        isValid = false;
    }

    if (enrollmentDate.value === "") {
        enrollmentDateError.textContent =
            "Select an enrollment date.";

        isValid = false;
    }

    return isValid;
}

/* ------------------------------------------------------
   CREATE ENROLLMENT
------------------------------------------------------ */

function createEnrollment() {
    const enrollments =
        getEnrollments();

    const studentId =
        Number(enrollmentStudent.value);

    const courseId =
        Number(enrollmentCourse.value);

    const duplicateEnrollment =
        enrollments.some(
            (enrollment) =>
                Number(enrollment.studentId) ===
                studentId &&
                Number(enrollment.courseId) ===
                courseId &&
                enrollment.status !== "Dropped"
        );

    if (duplicateEnrollment) {
        showFormMessage(
            "This student is already enrolled in the selected course.",
            "warning"
        );

        return false;
    }

    const newEnrollment = {
        enrollmentId:
            generateEnrollmentId(enrollments),

        studentId,

        courseId,

        enrollmentDate:
            enrollmentDate.value,

        status:
            enrollmentStatus.value
    };

    enrollments.push(newEnrollment);

    saveEnrollments(enrollments);

    resetEnrollmentForm();

    displayEnrollments();

    showPageMessage(
        "Student registered for the course successfully.",
        "success"
    );

    return true;
}

/* ------------------------------------------------------
   FORM SUBMISSION
------------------------------------------------------ */

enrollmentForm.addEventListener(
    "submit",
    (event) => {
        event.preventDefault();

        if (!validateEnrollmentForm()) {
            return;
        }

        setSaveEnrollmentLoading(true);

        window.setTimeout(() => {
            const completed =
                createEnrollment();

            setSaveEnrollmentLoading(false);

            if (!completed) {
                return;
            }
        }, 450);
    }
);

/* ------------------------------------------------------
   VIEW ENROLLMENT
------------------------------------------------------ */

function viewEnrollment(enrollmentId) {
    const enrollment =
        getEnrollments().find(
            (item) =>
                Number(item.enrollmentId) ===
                Number(enrollmentId)
        );

    if (!enrollment) {
        return;
    }

    const student =
        getStudents().find(
            (item) =>
                Number(item.studentId) ===
                Number(enrollment.studentId)
        );

    const course =
        getCourses().find(
            (item) =>
                Number(item.courseId) ===
                Number(enrollment.courseId)
        );

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

function openDeleteEnrollmentModal(
    enrollmentId
) {
    deleteEnrollmentId.value =
        enrollmentId;

    deleteEnrollmentModal.show();
}

function removeEnrollment() {
    const enrollmentId =
        Number(deleteEnrollmentId.value);

    const enrollments =
        getEnrollments();

    const updatedEnrollments =
        enrollments.filter(
            (enrollment) =>
                Number(enrollment.enrollmentId) !==
                enrollmentId
        );

    if (
        updatedEnrollments.length ===
        enrollments.length
    ) {
        deleteEnrollmentModal.hide();

        showPageMessage(
            "Enrollment record was not found.",
            "danger"
        );

        return;
    }

    saveEnrollments(updatedEnrollments);

    deleteEnrollmentModal.hide();

    displayEnrollments();

    showPageMessage(
        "Enrollment removed successfully.",
        "success"
    );
}

confirmDeleteEnrollmentButton.addEventListener(
    "click",
    removeEnrollment
);

/* ------------------------------------------------------
   FORM AND FILTER EVENTS
------------------------------------------------------ */

enrollmentCourse.addEventListener(
    "change",
    updateSelectedCoursePreview
);

enrollmentSearchInput.addEventListener(
    "input",
    displayEnrollments
);

enrollmentStatusFilter.addEventListener(
    "change",
    displayEnrollments
);

refreshEnrollmentsButton.addEventListener(
    "click",
    () => {
        enrollmentSearchInput.value = "";
        enrollmentStatusFilter.value = "";

        displayEnrollments();

        showPageMessage(
            "Enrollment records refreshed.",
            "info"
        );
    }
);

/* ------------------------------------------------------
   RESET FORM
------------------------------------------------------ */

function resetEnrollmentForm() {
    enrollmentForm.reset();

    setTodayAsEnrollmentDate();

    enrollmentStatus.value =
        "Active";

    clearEnrollmentErrors();

    updateSelectedCoursePreview();
}

/* ------------------------------------------------------
   TODAY'S DATE
------------------------------------------------------ */

function setTodayAsEnrollmentDate() {
    const today =
        new Date();

    const year =
        today.getFullYear();

    const month =
        String(
            today.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            today.getDate()
        ).padStart(2, "0");

    enrollmentDate.value =
        `${year}-${month}-${day}`;
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

function generateEnrollmentId(
    enrollments
) {
    if (enrollments.length === 0) {
        return 1;
    }

    const highestId = Math.max(
        ...enrollments.map(
            (enrollment) =>
                Number(
                    enrollment.enrollmentId
                ) || 0
        )
    );

    return highestId + 1;
}

function getInitials(fullName) {
    return fullName
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(
            (part) =>
                part.charAt(0).toUpperCase()
        )
        .join("");
}

function getEnrollmentStatusClass(
    status
) {
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

    const date =
        new Date(`${dateValue}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
        return dateValue;
    }

    return date.toLocaleDateString(
        "en-GB",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}

function setSaveEnrollmentLoading(
    isLoading
) {
    saveEnrollmentButton.disabled =
        isLoading;

    saveEnrollmentSpinner.classList.toggle(
        "d-none",
        !isLoading
    );

    saveEnrollmentButtonText.textContent =
        isLoading
            ? "Registering..."
            : "Register Student";
}

function showFormMessage(
    message,
    type
) {
    enrollmentFormMessage.innerHTML = `
        <div class="alert alert-${type}">
            ${escapeHTML(message)}
        </div>
    `;
}

function showPageMessage(
    message,
    type
) {
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
   FUTURE BACKEND CONNECTION

   Replace localStorage with:

   GET /api/students
   GET /api/courses
   GET /api/enrollments
   POST /api/enrollments
   DELETE /api/enrollments/:id
------------------------------------------------------ */

/* ------------------------------------------------------
   INITIAL PAGE LOAD
------------------------------------------------------ */

document.addEventListener(
    "DOMContentLoaded",
    () => {
        protectPage();
        initializeEnrollments();
        loadUserInformation();
        populateStudentDropdown();
        populateCourseDropdown();
        setTodayAsEnrollmentDate();
        displayEnrollments();
    }
);