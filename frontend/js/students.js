"use strict";

/*
=========================================================
UNIVERSITY ERP SYSTEM
Student Management Frontend Module
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

const studentTableBody = document.getElementById("studentTableBody");
const studentSearchInput = document.getElementById("studentSearchInput");
const departmentFilter = document.getElementById("departmentFilter");
const refreshStudentsButton = document.getElementById("refreshStudentsButton");

const studentRecordCount = document.getElementById("studentRecordCount");
const totalStudentsValue = document.getElementById("totalStudentsValue");
const departmentCountValue = document.getElementById("departmentCountValue");
const firstYearCountValue = document.getElementById("firstYearCountValue");
const finalYearCountValue = document.getElementById("finalYearCountValue");
const studentPageMessage = document.getElementById("studentPageMessage");

/* ------------------------------------------------------
   STUDENT FORM ELEMENTS
------------------------------------------------------ */

const studentForm = document.getElementById("studentForm");
const studentIdInput = document.getElementById("studentId");

const registrationNumberInput = document.getElementById("registrationNumber");
const fullNameInput = document.getElementById("fullName");
const studentEmailInput = document.getElementById("studentEmail");
const studentPhoneInput = document.getElementById("studentPhone");
const studentDepartmentInput = document.getElementById("studentDepartment");
const academicYearInput = document.getElementById("academicYear");
const studentStatusInput = document.getElementById("studentStatus");

const registrationNumberError = document.getElementById("registrationNumberError");
const fullNameError = document.getElementById("fullNameError");
const studentEmailError = document.getElementById("studentEmailError");
const studentPhoneError = document.getElementById("studentPhoneError");
const studentDepartmentError = document.getElementById("studentDepartmentError");
const academicYearError = document.getElementById("academicYearError");

const studentFormMessage = document.getElementById("studentFormMessage");
const studentModalTitle = document.getElementById("studentModalTitle");

const saveStudentButton = document.getElementById("saveStudentButton");
const saveStudentButtonText = document.getElementById("saveStudentButtonText");
const saveStudentSpinner = document.getElementById("saveStudentSpinner");

const openAddStudentButton = document.getElementById("openAddStudentButton");

/* ------------------------------------------------------
   DELETE MODAL ELEMENTS
------------------------------------------------------ */

const deleteStudentIdInput = document.getElementById("deleteStudentId");
const confirmDeleteStudentButton = document.getElementById("confirmDeleteStudentButton");

/* ------------------------------------------------------
   BOOTSTRAP MODALS
------------------------------------------------------ */

const studentModalElement = document.getElementById("studentModal");
const deleteStudentModalElement = document.getElementById("deleteStudentModal");

const studentModal = new bootstrap.Modal(studentModalElement);
const deleteStudentModal = new bootstrap.Modal(deleteStudentModalElement);

/* ------------------------------------------------------
   STATE
------------------------------------------------------ */

let students = [];

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

    if (Array.isArray(responseData.students)) {
        return responseData.students;
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

        phone:
            student.Phone ??
            student.phone ??
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

function buildStudentPayload() {
    return {
        registrationNumber: registrationNumberInput.value.trim(),
        fullName: fullNameInput.value.trim(),
        email: studentEmailInput.value.trim(),
        phone: studentPhoneInput.value.trim(),
        department: studentDepartmentInput.value,
        academicYear: Number(academicYearInput.value)
    };
}

/* ------------------------------------------------------
   LOAD STUDENTS FROM BACKEND
------------------------------------------------------ */

async function loadStudents() {
    try {
        studentTableBody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-4">
                    Loading students...
                </td>
            </tr>
        `;

        const responseData = await fetchWithAuth("/students");

        students = unwrapApiArray(responseData).map(normalizeStudent);

        displayStudents();

    } catch (error) {
        console.error("Unable to load students:", error);

        students = [];

        displayStudents();

        showPageMessage(
            error.message || "Unable to load student records.",
            "danger"
        );
    }
}

/* ------------------------------------------------------
   DISPLAY STUDENTS
------------------------------------------------------ */

function displayStudents() {
    const searchValue = studentSearchInput.value.trim().toLowerCase();
    const selectedDepartment = departmentFilter.value;

    const filteredStudents = students.filter((student) => {
        const matchesSearch =
            student.registrationNumber.toLowerCase().includes(searchValue) ||
            student.fullName.toLowerCase().includes(searchValue) ||
            student.email.toLowerCase().includes(searchValue);

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
                        <p>Try changing the search text or department filter.</p>
                    </div>
                </td>
            </tr>
        `;

        studentRecordCount.textContent = "Showing 0 students";
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
                    ${escapeHTML(student.studentId)}
                </span>
            </td>

            <td>${escapeHTML(student.registrationNumber)}</td>

            <td>
                <div class="student-name-cell">
                    <div class="student-table-avatar">
                        ${escapeHTML(initials)}
                    </div>
                    <div class="student-name-details">
                        <strong>${escapeHTML(student.fullName)}</strong>
                        <span>${escapeHTML(student.email)}</span>
                    </div>
                </div>
            </td>

            <td>${escapeHTML(student.department)}</td>

            <td>Year ${escapeHTML(student.academicYear)}</td>

            <td>${escapeHTML(student.phone || "Not provided")}</td>

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
                        onclick="viewStudent(${Number(student.studentId)})"
                    >
                        <i class="bi bi-eye"></i>
                    </button>

                    <button
                        type="button"
                        class="table-action-button edit-student-button"
                        title="Edit student"
                        onclick="editStudent(${Number(student.studentId)})"
                    >
                        <i class="bi bi-pencil-square"></i>
                    </button>

                    <button
                        type="button"
                        class="table-action-button delete-student-button"
                        title="Delete student"
                        onclick="openDeleteStudentModal(${Number(student.studentId)})"
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

function updateSummaryCards(studentList) {
    totalStudentsValue.textContent = studentList.length;

    const departments = new Set(
        studentList
            .map((student) => student.department)
            .filter(Boolean)
    );

    departmentCountValue.textContent = departments.size;

    firstYearCountValue.textContent =
        studentList.filter((student) => Number(student.academicYear) === 1).length;

    finalYearCountValue.textContent =
        studentList.filter((student) => Number(student.academicYear) === 4).length;
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

    const registrationNumber = registrationNumberInput.value.trim();
    const fullName = fullNameInput.value.trim();
    const email = studentEmailInput.value.trim();
    const phone = studentPhoneInput.value.trim();
    const department = studentDepartmentInput.value;
    const academicYear = academicYearInput.value;

    if (registrationNumber === "") {
        registrationNumberError.textContent = "Registration number is required.";
        isValid = false;
    }

    if (fullName === "") {
        fullNameError.textContent = "Full name is required.";
        isValid = false;
    }

    if (email === "") {
        studentEmailError.textContent = "Email address is required.";
        isValid = false;
    } else if (!isValidEmail(email)) {
        studentEmailError.textContent = "Enter a valid email address.";
        isValid = false;
    }

    if (phone !== "" && !/^[0-9]{10}$/.test(phone)) {
        studentPhoneError.textContent = "Phone number must contain 10 digits.";
        isValid = false;
    }

    if (department === "") {
        studentDepartmentError.textContent = "Select a department.";
        isValid = false;
    }

    if (academicYear === "") {
        academicYearError.textContent = "Select an academic year.";
        isValid = false;
    }

    return isValid;
}

/* ------------------------------------------------------
   ADD STUDENT
------------------------------------------------------ */

async function addStudent() {
    const payload = buildStudentPayload();

    await fetchWithAuth("/students", {
        method: "POST",
        body: JSON.stringify(payload)
    });

    showPageMessage("Student added successfully.", "success");

    studentModal.hide();
    resetStudentForm();

    await loadStudents();
}

/* ------------------------------------------------------
   UPDATE STUDENT
------------------------------------------------------ */

async function updateStudent(studentId) {
    const payload = buildStudentPayload();

    await fetchWithAuth(`/students/${studentId}`, {
        method: "PUT",
        body: JSON.stringify(payload)
    });

    showPageMessage("Student updated successfully.", "success");

    studentModal.hide();
    resetStudentForm();

    await loadStudents();
}

/* ------------------------------------------------------
   EDIT STUDENT
------------------------------------------------------ */

function editStudent(studentId) {
    const student = students.find(
        (item) => Number(item.studentId) === Number(studentId)
    );

    if (!student) {
        showPageMessage("Student record was not found.", "danger");
        return;
    }

    clearFormErrors();

    studentIdInput.value = student.studentId;
    registrationNumberInput.value = student.registrationNumber;
    fullNameInput.value = student.fullName;
    studentEmailInput.value = student.email;
    studentPhoneInput.value = student.phone || "";
    studentDepartmentInput.value = student.department;
    academicYearInput.value = String(student.academicYear);
    studentStatusInput.value = student.status || "Active";

    studentModalTitle.textContent = "Edit Student";
    saveStudentButtonText.textContent = "Update Student";

    studentModal.show();
}

/* ------------------------------------------------------
   VIEW STUDENT
------------------------------------------------------ */

function viewStudent(studentId) {
    const student = students.find(
        (item) => Number(item.studentId) === Number(studentId)
    );

    if (!student) {
        showPageMessage("Student record was not found.", "danger");
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

async function deleteStudent() {
    const studentId = Number(deleteStudentIdInput.value);

    if (!studentId) {
        showPageMessage("Invalid student record.", "danger");
        return;
    }

    try {
        confirmDeleteStudentButton.disabled = true;

        await fetchWithAuth(`/students/${studentId}`, {
            method: "DELETE"
        });

        deleteStudentModal.hide();

        showPageMessage("Student deleted successfully.", "success");

        await loadStudents();

    } catch (error) {
        console.error("Unable to delete student:", error);

        showPageMessage(
            error.message || "Unable to delete student.",
            "danger"
        );

    } finally {
        confirmDeleteStudentButton.disabled = false;
    }
}

/* ------------------------------------------------------
   FORM SUBMISSION
------------------------------------------------------ */

studentForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!validateStudentForm()) {
        return;
    }

    setSaveButtonLoading(true);

    try {
        const studentId = studentIdInput.value;

        if (studentId) {
            await updateStudent(Number(studentId));
        } else {
            await addStudent();
        }

    } catch (error) {
        console.error("Unable to save student:", error);

        studentFormMessage.innerHTML = `
            <div class="alert alert-danger">
                ${escapeHTML(error.message || "Unable to save student.")}
            </div>
        `;

    } finally {
        setSaveButtonLoading(false);
    }
});

/* ------------------------------------------------------
   RESET FORM
------------------------------------------------------ */

function resetStudentForm() {
    studentForm.reset();

    studentIdInput.value = "";
    studentStatusInput.value = "Active";

    studentModalTitle.textContent = "Add New Student";
    saveStudentButtonText.textContent = "Save Student";

    clearFormErrors();
}

openAddStudentButton.addEventListener("click", resetStudentForm);

studentModalElement.addEventListener("hidden.bs.modal", resetStudentForm);

/* ------------------------------------------------------
   SEARCH AND FILTER
------------------------------------------------------ */

studentSearchInput.addEventListener("input", displayStudents);
departmentFilter.addEventListener("change", displayStudents);

refreshStudentsButton.addEventListener("click", async () => {
    studentSearchInput.value = "";
    departmentFilter.value = "";

    await loadStudents();

    showPageMessage("Student records refreshed.", "info");
});

/* ------------------------------------------------------
   DELETE CONFIRMATION
------------------------------------------------------ */

confirmDeleteStudentButton.addEventListener("click", deleteStudent);

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
        .map((namePart) => namePart.charAt(0).toUpperCase())
        .join("");
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function setSaveButtonLoading(isLoading) {
    saveStudentButton.disabled = isLoading;

    saveStudentSpinner.classList.toggle("d-none", !isLoading);

    if (isLoading) {
        saveStudentButtonText.textContent = "Saving...";
    } else if (studentIdInput.value) {
        saveStudentButtonText.textContent = "Update Student";
    } else {
        saveStudentButtonText.textContent = "Save Student";
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
   INITIAL PAGE LOAD
------------------------------------------------------ */

document.addEventListener("DOMContentLoaded", async () => {
    protectPage();
    loadUserInformation();
    await loadStudents();
});