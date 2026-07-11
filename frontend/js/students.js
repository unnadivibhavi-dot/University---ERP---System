"use strict";

/*
=========================================================
UNIVERSITY ERP SYSTEM
Student Management Frontend Module

Current data source:
- localStorage

Future backend endpoints:
GET    /api/students
POST   /api/students
PUT    /api/students/:id
DELETE /api/students/:id
=========================================================
*/

/* ------------------------------------------------------
   PAGE ELEMENTS
------------------------------------------------------ */

const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");
const mobileMenuButton = document.getElementById("mobileMenuButton");
const sidebarCloseButton = document.getElementById(
    "sidebarCloseButton"
);

const sidebarLogoutButton = document.getElementById(
    "sidebarLogoutButton"
);

const topLogoutButton = document.getElementById(
    "topLogoutButton"
);

const sidebarUsername = document.getElementById(
    "sidebarUsername"
);

const sidebarRole = document.getElementById("sidebarRole");

const topUsername = document.getElementById("topUsername");
const topRole = document.getElementById("topRole");

const studentTableBody = document.getElementById(
    "studentTableBody"
);

const studentSearchInput = document.getElementById(
    "studentSearchInput"
);

const departmentFilter = document.getElementById(
    "departmentFilter"
);

const refreshStudentsButton = document.getElementById(
    "refreshStudentsButton"
);

const studentRecordCount = document.getElementById(
    "studentRecordCount"
);

const totalStudentsValue = document.getElementById(
    "totalStudentsValue"
);

const departmentCountValue = document.getElementById(
    "departmentCountValue"
);

const firstYearCountValue = document.getElementById(
    "firstYearCountValue"
);

const finalYearCountValue = document.getElementById(
    "finalYearCountValue"
);

const studentPageMessage = document.getElementById(
    "studentPageMessage"
);

/* ------------------------------------------------------
   STUDENT FORM ELEMENTS
------------------------------------------------------ */

const studentForm = document.getElementById("studentForm");

const studentIdInput = document.getElementById("studentId");

const registrationNumberInput = document.getElementById(
    "registrationNumber"
);

const fullNameInput = document.getElementById("fullName");

const studentEmailInput = document.getElementById(
    "studentEmail"
);

const studentPhoneInput = document.getElementById(
    "studentPhone"
);

const studentDepartmentInput = document.getElementById(
    "studentDepartment"
);

const academicYearInput = document.getElementById(
    "academicYear"
);

const studentStatusInput = document.getElementById(
    "studentStatus"
);

const registrationNumberError = document.getElementById(
    "registrationNumberError"
);

const fullNameError = document.getElementById(
    "fullNameError"
);

const studentEmailError = document.getElementById(
    "studentEmailError"
);

const studentPhoneError = document.getElementById(
    "studentPhoneError"
);

const studentDepartmentError = document.getElementById(
    "studentDepartmentError"
);

const academicYearError = document.getElementById(
    "academicYearError"
);

const studentFormMessage = document.getElementById(
    "studentFormMessage"
);

const studentModalTitle = document.getElementById(
    "studentModalTitle"
);

const saveStudentButton = document.getElementById(
    "saveStudentButton"
);

const saveStudentButtonText = document.getElementById(
    "saveStudentButtonText"
);

const saveStudentSpinner = document.getElementById(
    "saveStudentSpinner"
);

const openAddStudentButton = document.getElementById(
    "openAddStudentButton"
);

/* ------------------------------------------------------
   DELETE MODAL ELEMENTS
------------------------------------------------------ */

const deleteStudentIdInput = document.getElementById(
    "deleteStudentId"
);

const confirmDeleteStudentButton = document.getElementById(
    "confirmDeleteStudentButton"
);

/* ------------------------------------------------------
   BOOTSTRAP MODALS
------------------------------------------------------ */

const studentModalElement = document.getElementById(
    "studentModal"
);

const deleteStudentModalElement = document.getElementById(
    "deleteStudentModal"
);

const studentModal = new bootstrap.Modal(
    studentModalElement
);

const deleteStudentModal = new bootstrap.Modal(
    deleteStudentModalElement
);

/* ------------------------------------------------------
   SAMPLE DATA
------------------------------------------------------ */

const defaultStudents = [
    {
        studentId: 1,
        registrationNumber: "UGC001",
        fullName: "Nimal Perera",
        email: "nimal@example.com",
        phone: "0771234567",
        department: "Computing",
        academicYear: 1,
        status: "Active"
    },
    {
        studentId: 2,
        registrationNumber: "UGC002",
        fullName: "Kamal Silva",
        email: "kamal@example.com",
        phone: "0712345678",
        department: "Business",
        academicYear: 2,
        status: "Active"
    },
    {
        studentId: 3,
        registrationNumber: "UGC003",
        fullName: "Saman Fernando",
        email: "saman@example.com",
        phone: "0759876543",
        department: "Engineering",
        academicYear: 4,
        status: "Inactive"
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
    const storedUser = localStorage.getItem("loggedUser");

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

function initializeStudents() {
    if (!localStorage.getItem("students")) {
        saveStudents(defaultStudents);
    }
}

function getStudents() {
    const storedStudents = localStorage.getItem("students");

    if (!storedStudents) {
        return [];
    }

    try {
        const parsedStudents = JSON.parse(storedStudents);

        return Array.isArray(parsedStudents)
            ? parsedStudents
            : [];
    } catch (error) {
        console.error(
            "Unable to read students:",
            error
        );

        return [];
    }
}

function saveStudents(students) {
    localStorage.setItem(
        "students",
        JSON.stringify(students)
    );
}

/* ------------------------------------------------------
   DISPLAY STUDENTS
------------------------------------------------------ */

function displayStudents() {
    const students = getStudents();

    const searchValue =
        studentSearchInput.value.trim().toLowerCase();

    const selectedDepartment =
        departmentFilter.value;

    const filteredStudents = students.filter((student) => {
        const matchesSearch =
            student.registrationNumber
                .toLowerCase()
                .includes(searchValue) ||
            student.fullName
                .toLowerCase()
                .includes(searchValue) ||
            student.email
                .toLowerCase()
                .includes(searchValue);

        const matchesDepartment =
            selectedDepartment === "" ||
            student.department === selectedDepartment;

        return matchesSearch && matchesDepartment;
    });

    studentTableBody.innerHTML = "";

    if (filteredStudents.length === 0) {
        studentTableBody.innerHTML = `
            <tr>
                <td colspan="8">
                    <div class="student-empty-state">
                        <div class="student-empty-icon">
                            <i class="bi bi-people"></i>
                        </div>

                        <h4>No students found</h4>

                        <p>
                            Try changing the search text or department filter.
                        </p>
                    </div>
                </td>
            </tr>
        `;

        studentRecordCount.textContent =
            "Showing 0 students";

        updateSummaryCards(students);

        return;
    }

    filteredStudents.forEach((student) => {
        const row = document.createElement("tr");

        const initials = getInitials(student.fullName);

        const statusClass =
            student.status === "Active"
                ? "student-active-status"
                : "student-inactive-status";

        row.innerHTML = `
            <td>
                <span class="student-id-badge">
                    ${student.studentId}
                </span>
            </td>

            <td>
                ${escapeHTML(student.registrationNumber)}
            </td>

            <td>
                <div class="student-name-cell">
                    <div class="student-table-avatar">
                        ${initials}
                    </div>

                    <div class="student-name-details">
                        <strong>
                            ${escapeHTML(student.fullName)}
                        </strong>

                        <span>
                            ${escapeHTML(student.email)}
                        </span>
                    </div>
                </div>
            </td>

            <td>
                ${escapeHTML(student.department)}
            </td>

            <td>
                Year ${Number(student.academicYear)}
            </td>

            <td>
                ${escapeHTML(student.phone || "Not provided")}
            </td>

            <td>
                <span class="student-status-badge ${statusClass}">
                    ${escapeHTML(student.status)}
                </span>
            </td>

            <td>
                <div class="table-action-group">

                    <button
                        type="button"
                        class="table-action-button view-student-button"
                        title="View student"
                        onclick="viewStudent(${student.studentId})"
                    >
                        <i class="bi bi-eye"></i>
                    </button>

                    <button
                        type="button"
                        class="table-action-button edit-student-button"
                        title="Edit student"
                        onclick="editStudent(${student.studentId})"
                    >
                        <i class="bi bi-pencil-square"></i>
                    </button>

                    <button
                        type="button"
                        class="table-action-button delete-student-button"
                        title="Delete student"
                        onclick="openDeleteStudentModal(${student.studentId})"
                    >
                        <i class="bi bi-trash3"></i>
                    </button>

                </div>
            </td>
        `;

        studentTableBody.appendChild(row);
    });

    studentRecordCount.textContent =
        `Showing ${filteredStudents.length} of ${students.length} students`;

    updateSummaryCards(students);
}

/* ------------------------------------------------------
   SUMMARY CARDS
------------------------------------------------------ */

function updateSummaryCards(students) {
    totalStudentsValue.textContent = students.length;

    const departments = new Set(
        students.map((student) => student.department)
    );

    departmentCountValue.textContent =
        departments.size;

    const firstYearStudents = students.filter(
        (student) =>
            Number(student.academicYear) === 1
    );

    const finalYearStudents = students.filter(
        (student) =>
            Number(student.academicYear) === 4
    );

    firstYearCountValue.textContent =
        firstYearStudents.length;

    finalYearCountValue.textContent =
        finalYearStudents.length;
}

/* ------------------------------------------------------
   FORM VALIDATION
------------------------------------------------------ */

function clearFormErrors() {
    registrationNumberError.textContent = "";
    fullNameError.textContent = "";
    studentEmailError.textContent = "";
    studentPhoneError.textContent = "";
    studentDepartmentError.textContent = "";
    academicYearError.textContent = "";
    studentFormMessage.innerHTML = "";
}

function validateStudentForm() {
    clearFormErrors();

    let isValid = true;

    const registrationNumber =
        registrationNumberInput.value.trim();

    const fullName =
        fullNameInput.value.trim();

    const email =
        studentEmailInput.value.trim();

    const phone =
        studentPhoneInput.value.trim();

    const department =
        studentDepartmentInput.value;

    const academicYear =
        academicYearInput.value;

    if (registrationNumber === "") {
        registrationNumberError.textContent =
            "Registration number is required.";

        isValid = false;
    }

    if (fullName === "") {
        fullNameError.textContent =
            "Full name is required.";

        isValid = false;
    }

    if (email === "") {
        studentEmailError.textContent =
            "Email address is required.";

        isValid = false;
    } else if (!isValidEmail(email)) {
        studentEmailError.textContent =
            "Enter a valid email address.";

        isValid = false;
    }

    if (phone !== "" && !/^[0-9]{10}$/.test(phone)) {
        studentPhoneError.textContent =
            "Phone number must contain 10 digits.";

        isValid = false;
    }

    if (department === "") {
        studentDepartmentError.textContent =
            "Select a department.";

        isValid = false;
    }

    if (academicYear === "") {
        academicYearError.textContent =
            "Select an academic year.";

        isValid = false;
    }

    return isValid;
}

/* ------------------------------------------------------
   ADD STUDENT
------------------------------------------------------ */

function addStudent() {
    const students = getStudents();

    const registrationNumber =
        registrationNumberInput.value.trim();

    const duplicateRegistration = students.some(
        (student) =>
            student.registrationNumber.toLowerCase() ===
            registrationNumber.toLowerCase()
    );

    if (duplicateRegistration) {
        registrationNumberError.textContent =
            "This registration number already exists.";

        return;
    }

    const newStudent = {
        studentId: generateStudentId(students),

        registrationNumber,

        fullName: fullNameInput.value.trim(),

        email: studentEmailInput.value.trim(),

        phone: studentPhoneInput.value.trim(),

        department: studentDepartmentInput.value,

        academicYear: Number(
            academicYearInput.value
        ),

        status: studentStatusInput.value
    };

    students.push(newStudent);

    saveStudents(students);

    showPageMessage(
        "Student added successfully.",
        "success"
    );

    studentModal.hide();

    resetStudentForm();

    displayStudents();
}

/* ------------------------------------------------------
   UPDATE STUDENT
------------------------------------------------------ */

function updateStudent(studentId) {
    const students = getStudents();

    const studentIndex = students.findIndex(
        (student) =>
            Number(student.studentId) === Number(studentId)
    );

    if (studentIndex === -1) {
        showPageMessage(
            "Student record was not found.",
            "danger"
        );

        return;
    }

    const registrationNumber =
        registrationNumberInput.value.trim();

    const duplicateRegistration = students.some(
        (student) =>
            student.registrationNumber.toLowerCase() ===
            registrationNumber.toLowerCase() &&
            Number(student.studentId) !== Number(studentId)
    );

    if (duplicateRegistration) {
        registrationNumberError.textContent =
            "This registration number already exists.";

        return;
    }

    students[studentIndex] = {
        ...students[studentIndex],

        registrationNumber,

        fullName: fullNameInput.value.trim(),

        email: studentEmailInput.value.trim(),

        phone: studentPhoneInput.value.trim(),

        department: studentDepartmentInput.value,

        academicYear: Number(
            academicYearInput.value
        ),

        status: studentStatusInput.value
    };

    saveStudents(students);

    showPageMessage(
        "Student updated successfully.",
        "success"
    );

    studentModal.hide();

    resetStudentForm();

    displayStudents();
}

/* ------------------------------------------------------
   EDIT STUDENT
------------------------------------------------------ */

function editStudent(studentId) {
    const students = getStudents();

    const student = students.find(
        (item) =>
            Number(item.studentId) === Number(studentId)
    );

    if (!student) {
        showPageMessage(
            "Student record was not found.",
            "danger"
        );

        return;
    }

    clearFormErrors();

    studentIdInput.value = student.studentId;
    registrationNumberInput.value =
        student.registrationNumber;

    fullNameInput.value = student.fullName;
    studentEmailInput.value = student.email;
    studentPhoneInput.value = student.phone || "";
    studentDepartmentInput.value =
        student.department;

    academicYearInput.value =
        String(student.academicYear);

    studentStatusInput.value = student.status;

    studentModalTitle.textContent =
        "Edit Student";

    saveStudentButtonText.textContent =
        "Update Student";

    studentModal.show();
}

/* ------------------------------------------------------
   VIEW STUDENT
------------------------------------------------------ */

function viewStudent(studentId) {
    const students = getStudents();

    const student = students.find(
        (item) =>
            Number(item.studentId) === Number(studentId)
    );

    if (!student) {
        return;
    }

    alert(
        `Student Details\n\n` +
        `Registration Number: ${student.registrationNumber}\n` +
        `Name: ${student.fullName}\n` +
        `Email: ${student.email}\n` +
        `Phone: ${student.phone || "Not provided"}\n` +
        `Department: ${student.department}\n` +
        `Academic Year: Year ${student.academicYear}\n` +
        `Status: ${student.status}`
    );
}

/* ------------------------------------------------------
   DELETE STUDENT
------------------------------------------------------ */

function openDeleteStudentModal(studentId) {
    deleteStudentIdInput.value = studentId;
    deleteStudentModal.show();
}

function deleteStudent() {
    const studentId = Number(
        deleteStudentIdInput.value
    );

    const students = getStudents();

    const updatedStudents = students.filter(
        (student) =>
            Number(student.studentId) !== studentId
    );

    if (updatedStudents.length === students.length) {
        showPageMessage(
            "Student record was not found.",
            "danger"
        );

        return;
    }

    saveStudents(updatedStudents);

    deleteStudentModal.hide();

    showPageMessage(
        "Student deleted successfully.",
        "success"
    );

    displayStudents();
}

/* ------------------------------------------------------
   FORM SUBMISSION
------------------------------------------------------ */

studentForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!validateStudentForm()) {
        return;
    }

    setSaveButtonLoading(true);

    window.setTimeout(() => {
        const studentId = studentIdInput.value;

        if (studentId) {
            updateStudent(Number(studentId));
        } else {
            addStudent();
        }

        setSaveButtonLoading(false);
    }, 500);
});

/* ------------------------------------------------------
   RESET FORM
------------------------------------------------------ */

function resetStudentForm() {
    studentForm.reset();

    studentIdInput.value = "";

    studentStatusInput.value = "Active";

    studentModalTitle.textContent =
        "Add New Student";

    saveStudentButtonText.textContent =
        "Save Student";

    clearFormErrors();
}

openAddStudentButton.addEventListener(
    "click",
    resetStudentForm
);

studentModalElement.addEventListener(
    "hidden.bs.modal",
    resetStudentForm
);

/* ------------------------------------------------------
   SEARCH AND FILTER
------------------------------------------------------ */

studentSearchInput.addEventListener(
    "input",
    displayStudents
);

departmentFilter.addEventListener(
    "change",
    displayStudents
);

refreshStudentsButton.addEventListener(
    "click",
    () => {
        studentSearchInput.value = "";
        departmentFilter.value = "";

        displayStudents();

        showPageMessage(
            "Student records refreshed.",
            "info"
        );
    }
);

/* ------------------------------------------------------
   DELETE CONFIRMATION
------------------------------------------------------ */

confirmDeleteStudentButton.addEventListener(
    "click",
    deleteStudent
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

window.addEventListener("resize", () => {
    if (window.innerWidth > 900) {
        closeSidebar();
    }
});

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

function generateStudentId(students) {
    if (students.length === 0) {
        return 1;
    }

    const highestId = Math.max(
        ...students.map(
            (student) =>
                Number(student.studentId) || 0
        )
    );

    return highestId + 1;
}

function getInitials(fullName) {
    return fullName
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((namePart) =>
            namePart.charAt(0).toUpperCase()
        )
        .join("");
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function setSaveButtonLoading(isLoading) {
    saveStudentButton.disabled = isLoading;

    saveStudentSpinner.classList.toggle(
        "d-none",
        !isLoading
    );

    if (isLoading) {
        saveStudentButtonText.textContent =
            "Saving...";
    } else if (studentIdInput.value) {
        saveStudentButtonText.textContent =
            "Update Student";
    } else {
        saveStudentButtonText.textContent =
            "Save Student";
    }
}

function showPageMessage(message, type) {
    studentPageMessage.innerHTML = `
        <div class="alert alert-${type}">
            ${escapeHTML(message)}
        </div>
    `;

    window.setTimeout(() => {
        studentPageMessage.innerHTML = "";
    }, 3000);
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
   FUTURE BACKEND VERSION

   Later, replace localStorage functions with fetch calls.

   Example:

   const API_BASE_URL =
       "http://localhost:5000/api";

   GET:
   fetch(`${API_BASE_URL}/students`);

   POST:
   fetch(`${API_BASE_URL}/students`, {
       method: "POST",
       headers: {
           "Content-Type": "application/json"
       },
       body: JSON.stringify(studentData)
   });

   PUT:
   fetch(`${API_BASE_URL}/students/${studentId}`, {
       method: "PUT",
       headers: {
           "Content-Type": "application/json"
       },
       body: JSON.stringify(studentData)
   });

   DELETE:
   fetch(`${API_BASE_URL}/students/${studentId}`, {
       method: "DELETE"
   });
------------------------------------------------------ */

/* ------------------------------------------------------
   INITIAL PAGE LOAD
------------------------------------------------------ */

document.addEventListener(
    "DOMContentLoaded",
    () => {
        protectPage();
        initializeStudents();
        loadUserInformation();
        displayStudents();
    }
);