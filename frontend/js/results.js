"use strict";

/*
=========================================================
UNIVERSITY ERP SYSTEM
Results Management Frontend Module

Data sources:
- localStorage ("results", "examinations", "students", "courses")
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

const resultTableBody = document.getElementById("resultTableBody");
const resultSearchInput = document.getElementById("resultSearchInput");
const courseFilterSelect = document.getElementById("courseFilterSelect");
const gradeFilterSelect = document.getElementById("gradeFilterSelect");
const resultRecordCount = document.getElementById("resultRecordCount");

const totalResultsValue = document.getElementById("totalResultsValue");
const classAverageValue = document.getElementById("classAverageValue");
const passRateValue = document.getElementById("passRateValue");
const topPerformerValue = document.getElementById("topPerformerValue");

const resultPageMessage = document.getElementById("resultPageMessage");

/* ------------------------------------------------------
   FORM ELEMENTS
------------------------------------------------------ */

const resultForm = document.getElementById("resultForm");
const resultIdInput = document.getElementById("resultId");
const resultStudentSelect = document.getElementById("resultStudent");
const resultCourseSelect = document.getElementById("resultCourse");
const resultExaminationSelect = document.getElementById("resultExamination");
const resultMarksInput = document.getElementById("resultMarks");
const resultGradeInput = document.getElementById("resultGrade");

const resultStudentError = document.getElementById("resultStudentError");
const resultCourseError = document.getElementById("resultCourseError");
const resultExaminationError = document.getElementById("resultExaminationError");
const resultMarksError = document.getElementById("resultMarksError");
const resultFormMessage = document.getElementById("resultFormMessage");

const resultModalTitle = document.getElementById("resultModalTitle");
const saveResultButton = document.getElementById("saveResultButton");
const saveResultButtonText = document.getElementById("saveResultButtonText");
const saveResultSpinner = document.getElementById("saveResultSpinner");
const openAddResultButton = document.getElementById("openAddResultButton");

/* ------------------------------------------------------
   DELETE MODAL ELEMENTS
------------------------------------------------------ */

const deleteResultIdInput = document.getElementById("deleteResultId");
const confirmDeleteResultButton = document.getElementById("confirmDeleteResultButton");

/* ------------------------------------------------------
   BOOTSTRAP MODALS
------------------------------------------------------ */

const resultModalElement = document.getElementById("resultModal");
const deleteResultModalElement = document.getElementById("deleteResultModal");

const resultModal = new bootstrap.Modal(resultModalElement);
const deleteResultModal = new bootstrap.Modal(deleteResultModalElement);

/* ------------------------------------------------------
   SAMPLE DATA INITIALIZATION
------------------------------------------------------ */

const defaultExaminations = [
    { examinationId: 1, courseId: 1, examinationName: "Midterm Exam", examinationDate: "2026-07-10" },
    { examinationId: 2, courseId: 1, examinationName: "Final Exam", examinationDate: "2026-08-15" },
    { examinationId: 3, courseId: 2, examinationName: "Practical Assessment", examinationDate: "2026-07-20" },
    { examinationId: 4, courseId: 2, examinationName: "Written Exam", examinationDate: "2026-08-20" },
    { examinationId: 5, courseId: 3, examinationName: "Case Study Presentation", examinationDate: "2026-07-25" },
    { examinationId: 6, courseId: 4, examinationName: "Project Defense", examinationDate: "2026-07-30" }
];

const defaultResults = [
    { resultId: 1, studentId: 1, examinationId: 1, marks: 88, grade: "A+" },
    { resultId: 2, studentId: 1, examinationId: 3, marks: 76, grade: "A" },
    { resultId: 3, studentId: 2, examinationId: 5, marks: 62, grade: "B" },
    { resultId: 4, studentId: 3, examinationId: 1, marks: 42, grade: "F" }
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
    let user = { username: "Administrator", role: "System Admin" };

    if (storedUser) {
        try {
            user = JSON.parse(storedUser);
        } catch (error) {
            console.error("Unable to read logged user:", error);
        }
    }

    const displayName = user.username === "admin" ? "Administrator" : user.username;
    const displayRole = user.role || "System Admin";

    if (sidebarUsername) sidebarUsername.textContent = displayName;
    if (sidebarRole) sidebarRole.textContent = displayRole;
    if (topUsername) topUsername.textContent = displayName;
    if (topRole) topRole.textContent = displayRole;
}

/* ------------------------------------------------------
   LOCAL STORAGE UTILITIES
------------------------------------------------------ */

function getStoredArray(key) {
    const stored = localStorage.getItem(key);
    if (!stored) return [];
    try {
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
        console.error(`Error reading key ${key}:`, e);
        return [];
    }
}

function saveStoredArray(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function initializeData() {
    if (!localStorage.getItem("examinations")) {
        saveStoredArray("examinations", defaultExaminations);
    }
    if (!localStorage.getItem("results")) {
        saveStoredArray("results", defaultResults);
    }
}

/* ------------------------------------------------------
   GRADE CALCULATOR
------------------------------------------------------ */

function calculateGrade(marks) {
    if (marks === null || marks === undefined || marks === "") return "";
    const numericMarks = Number(marks);
    if (isNaN(numericMarks) || numericMarks < 0 || numericMarks > 100) return "";

    if (numericMarks >= 85) return "A+";
    if (numericMarks >= 75) return "A";
    if (numericMarks >= 65) return "B";
    if (numericMarks >= 55) return "C";
    if (numericMarks >= 45) return "D";
    return "F";
}

function getGradeBadgeClass(grade) {
    switch (grade) {
        case "A+":
        case "A":
            return "grade-excellent";
        case "B":
        case "C":
            return "grade-good";
        case "D":
            return "grade-pass";
        case "F":
            return "grade-fail";
        default:
            return "";
    }
}

/* ------------------------------------------------------
   DATA LOAD & DROPDOWNS
------------------------------------------------------ */

function populateDropdowns() {
    const students = getStoredArray("students");
    const courses = getStoredArray("courses");

    // Populate student select in modal
    resultStudentSelect.innerHTML = '<option value="">Select Student</option>';
    students.forEach(student => {
        if (student.status !== "Inactive") {
            const option = document.createElement("option");
            option.value = student.studentId;
            option.textContent = `${student.fullName} (${student.registrationNumber})`;
            resultStudentSelect.appendChild(option);
        }
    });

    // Populate course select in modal
    resultCourseSelect.innerHTML = '<option value="">Select Course</option>';
    courses.forEach(course => {
        const option = document.createElement("option");
        option.value = course.courseId;
        option.textContent = `${course.courseCode} - ${course.courseName}`;
        resultCourseSelect.appendChild(option);
    });

    // Populate course filter in toolbar
    courseFilterSelect.innerHTML = '<option value="">All Courses</option>';
    courses.forEach(course => {
        const option = document.createElement("option");
        option.value = course.courseId;
        option.textContent = course.courseName;
        courseFilterSelect.appendChild(option);
    });
}

function handleCourseSelection() {
    const selectedCourseId = Number(resultCourseSelect.value);
    resultExaminationSelect.innerHTML = '<option value="">Select Examination</option>';

    if (!selectedCourseId) {
        resultExaminationSelect.disabled = true;
        resultExaminationSelect.innerHTML = '<option value="">Select a course first</option>';
        return;
    }

    const examinations = getStoredArray("examinations");
    const filteredExams = examinations.filter(exam => exam.courseId === selectedCourseId);

    if (filteredExams.length === 0) {
        resultExaminationSelect.disabled = true;
        resultExaminationSelect.innerHTML = '<option value="">No exams for this course</option>';
        return;
    }

    filteredExams.forEach(exam => {
        const option = document.createElement("option");
        option.value = exam.examinationId;
        option.textContent = exam.examinationName;
        resultExaminationSelect.appendChild(option);
    });

    resultExaminationSelect.disabled = false;
}

/* ------------------------------------------------------
   SUMMARY & METRICS
------------------------------------------------------ */

function updateSummaryCards(results, students) {
    totalResultsValue.textContent = results.length;

    if (results.length === 0) {
        classAverageValue.textContent = "0%";
        passRateValue.textContent = "0%";
        topPerformerValue.textContent = "N/A";
        topPerformerValue.title = "";
        return;
    }

    let totalMarks = 0;
    let passingCount = 0;
    let highestMark = -1;
    let topStudentId = null;

    results.forEach(res => {
        const marks = Number(res.marks) || 0;
        totalMarks += marks;
        if (marks >= 45) {
            passingCount++;
        }
        if (marks > highestMark) {
            highestMark = marks;
            topStudentId = res.studentId;
        }
    });

    const average = Math.round(totalMarks / results.length);
    classAverageValue.textContent = `${average}%`;

    const passRate = Math.round((passingCount / results.length) * 100);
    passRateValue.textContent = `${passRate}%`;

    if (topStudentId) {
        const topStudent = students.find(s => s.studentId === topStudentId);
        if (topStudent) {
            const displayName = topStudent.fullName;
            topPerformerValue.textContent = `${highestMark}% (${displayName})`;
            topPerformerValue.title = `${displayName} (${highestMark}%)`;
        } else {
            topPerformerValue.textContent = `${highestMark}%`;
            topPerformerValue.title = "";
        }
    } else {
        topPerformerValue.textContent = "N/A";
        topPerformerValue.title = "";
    }
}

/* ------------------------------------------------------
   DISPLAY & SEARCH / FILTER
------------------------------------------------------ */

function displayResults() {
    const results = getStoredArray("results");
    const students = getStoredArray("students");
    const courses = getStoredArray("courses");
    const examinations = getStoredArray("examinations");

    const searchValue = resultSearchInput.value.trim().toLowerCase();
    const courseFilter = courseFilterSelect.value;
    const gradeFilter = gradeFilterSelect.value;

    const filtered = results.filter(res => {
        const student = students.find(s => s.studentId === res.studentId);
        const exam = examinations.find(e => e.examinationId === res.examinationId);
        const course = exam ? courses.find(c => c.courseId === exam.courseId) : null;

        const studentName = student ? student.fullName.toLowerCase() : "";
        const regNumber = student ? student.registrationNumber.toLowerCase() : "";
        const courseName = course ? course.courseName.toLowerCase() : "";
        const examName = exam ? exam.examinationName.toLowerCase() : "";

        const matchesSearch = studentName.includes(searchValue) ||
            regNumber.includes(searchValue) ||
            courseName.includes(searchValue) ||
            examName.includes(searchValue);

        const matchesCourse = courseFilter === "" || (course && String(course.courseId) === String(courseFilter));
        const matchesGrade = gradeFilter === "" || res.grade === gradeFilter;

        return matchesSearch && matchesCourse && matchesGrade;
    });

    resultTableBody.innerHTML = "";

    if (filtered.length === 0) {
        resultTableBody.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="result-empty-state">
                        <div class="result-empty-icon">
                            <i class="bi bi-bar-chart"></i>
                        </div>
                        <h4>No results found</h4>
                        <p>Try changing the search queries or selecting a different filter.</p>
                    </div>
                </td>
            </tr>
        `;
        resultRecordCount.textContent = "Showing 0 results";
        updateSummaryCards(results, students);
        return;
    }

    filtered.forEach(res => {
        const student = students.find(s => s.studentId === res.studentId);
        const exam = examinations.find(e => e.examinationId === res.examinationId);
        const course = exam ? courses.find(c => c.courseId === exam.courseId) : null;

        const row = document.createElement("tr");
        row.innerHTML = `
            <td>
                <span class="student-id-badge">${res.resultId}</span>
            </td>
            <td>
                <div class="student-name-details" style="display: flex; flex-direction: column;">
                    <strong>${escapeHTML(student ? student.fullName : "Unknown Student")}</strong>
                    <span class="text-muted" style="font-size: 12px;">${escapeHTML(student ? student.registrationNumber : "N/A")}</span>
                </div>
            </td>
            <td>
                <div class="course-details" style="display: flex; flex-direction: column;">
                    <strong>${escapeHTML(course ? course.courseName : "Unknown Course")}</strong>
                    <span class="text-muted" style="font-size: 12px;">${escapeHTML(course ? course.courseCode : "N/A")}</span>
                </div>
            </td>
            <td>
                ${escapeHTML(exam ? exam.examinationName : "Unknown Exam")}
            </td>
            <td>
                <span class="marks-badge">${res.marks}</span>
            </td>
            <td>
                <span class="grade-badge ${getGradeBadgeClass(res.grade)}">${res.grade}</span>
            </td>
            <td>
                <div class="table-action-group" style="display: flex; gap: 8px;">
                    <button type="button" class="btn edit-student-button" onclick="editResult(${res.resultId})" aria-label="Edit result">
                        <i class="bi bi-pencil-fill"></i>
                    </button>
                    <button type="button" class="btn remove-enrollment-button" onclick="openDeleteModal(${res.resultId})" aria-label="Delete result">
                        <i class="bi bi-trash3-fill"></i>
                    </button>
                </div>
            </td>
        `;
        resultTableBody.appendChild(row);
    });

    resultRecordCount.textContent = `Showing ${filtered.length} of ${results.length} results`;
    updateSummaryCards(results, students);
}

/* ------------------------------------------------------
   FORM VALIDATION & CRUD
------------------------------------------------------ */

function clearErrors() {
    resultStudentError.textContent = "";
    resultCourseError.textContent = "";
    resultExaminationError.textContent = "";
    resultMarksError.textContent = "";
    resultFormMessage.innerHTML = "";
}

function validateResultForm() {
    let isValid = true;
    clearErrors();

    if (!resultStudentSelect.value) {
        resultStudentError.textContent = "Please select a student.";
        isValid = false;
    }

    if (!resultCourseSelect.value) {
        resultCourseError.textContent = "Please select a course.";
        isValid = false;
    }

    if (!resultExaminationSelect.value) {
        resultExaminationError.textContent = "Please select an examination.";
        isValid = false;
    }

    const marksVal = resultMarksInput.value;
    if (marksVal === "") {
        resultMarksError.textContent = "Marks field is required.";
        isValid = false;
    } else {
        const marks = Number(marksVal);
        if (isNaN(marks) || marks < 0 || marks > 100) {
            resultMarksError.textContent = "Marks must be between 0 and 100.";
            isValid = false;
        }
    }

    return isValid;
}

// Open modal for Add
openAddResultButton.addEventListener("click", () => {
    resultForm.reset();
    resultIdInput.value = "";
    resultModalTitle.textContent = "Add Result";
    saveResultButtonText.textContent = "Save Result";
    resultCourseSelect.disabled = false;
    resultStudentSelect.disabled = false;
    resultExaminationSelect.disabled = true;
    resultExaminationSelect.innerHTML = '<option value="">Select a course first</option>';
    clearErrors();
});

// Real-time grade preview as user changes marks
resultMarksInput.addEventListener("input", () => {
    const val = resultMarksInput.value;
    resultGradeInput.value = calculateGrade(val) || "N/A";
});

// Dynamic examination filtering
resultCourseSelect.addEventListener("change", handleCourseSelection);

// Form submission handler
resultForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!validateResultForm()) return;

    saveResultButton.disabled = true;
    saveResultSpinner.classList.remove("d-none");
    saveResultButtonText.textContent = "Saving...";

    setTimeout(() => {
        const resultId = resultIdInput.value;
        const studentId = Number(resultStudentSelect.value);
        const examinationId = Number(resultExaminationSelect.value);
        const marks = Number(resultMarksInput.value);
        const grade = calculateGrade(marks);

        const results = getStoredArray("results");

        // Enrollments validation: Student must be enrolled in course
        const enrollments = getStoredArray("enrollments");
        const examinations = getStoredArray("examinations");
        const selectedExam = examinations.find(e => e.examinationId === examinationId);
        const courseId = selectedExam ? selectedExam.courseId : null;

        const isEnrolled = enrollments.some(en => en.studentId === studentId && en.courseId === courseId);

        if (!isEnrolled) {
            resultFormMessage.innerHTML = `
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle-fill me-2"></i>
                    This student is not enrolled in the course for this examination.
                </div>
            `;
            saveResultButton.disabled = false;
            saveResultSpinner.classList.add("d-none");
            saveResultButtonText.textContent = resultId ? "Update Result" : "Save Result";
            return;
        }

        if (resultId) {
            // Update
            const idx = results.findIndex(r => String(r.resultId) === String(resultId));
            if (idx !== -1) {
                results[idx].studentId = studentId;
                results[idx].examinationId = examinationId;
                results[idx].marks = marks;
                results[idx].grade = grade;
            }
        } else {
            // Create
            // Avoid duplicate results
            const isDuplicate = results.some(r => r.studentId === studentId && r.examinationId === examinationId);
            if (isDuplicate) {
                resultFormMessage.innerHTML = `
                    <div class="alert alert-danger">
                        <i class="bi bi-exclamation-triangle-fill me-2"></i>
                        A result already exists for this student and examination.
                    </div>
                `;
                saveResultButton.disabled = false;
                saveResultSpinner.classList.add("d-none");
                saveResultButtonText.textContent = "Save Result";
                return;
            }

            const nextId = results.length > 0 ? Math.max(...results.map(r => r.resultId)) + 1 : 1;
            results.push({
                resultId: nextId,
                studentId,
                examinationId,
                marks,
                grade
            });
        }

        saveStoredArray("results", results);

        saveResultButton.disabled = false;
        saveResultSpinner.classList.add("d-none");
        resultModal.hide();

        // Flash message
        flashMessage(resultId ? "Result updated successfully!" : "Result added successfully!", "success");

        displayResults();
    }, 600);
});

// Edit result loader (global scope for onclick handler)
window.editResult = function (id) {
    const results = getStoredArray("results");
    const res = results.find(r => r.resultId === id);
    if (!res) return;

    clearErrors();
    resultForm.reset();

    resultIdInput.value = res.resultId;
    resultStudentSelect.value = res.studentId;

    const examinations = getStoredArray("examinations");
    const exam = examinations.find(e => e.examinationId === res.examinationId);
    const courseId = exam ? exam.courseId : "";

    resultCourseSelect.value = courseId;
    handleCourseSelection();

    resultExaminationSelect.value = res.examinationId;
    resultMarksInput.value = res.marks;
    resultGradeInput.value = res.grade;

    resultModalTitle.textContent = "Edit Result";
    saveResultButtonText.textContent = "Update Result";

    // Disable changing student or course during edit for database safety, matching real academic operations
    resultCourseSelect.disabled = true;
    resultStudentSelect.disabled = true;

    resultModal.show();
};

/* ------------------------------------------------------
   DELETE RESULT
------------------------------------------------------ */

window.openDeleteModal = function (id) {
    deleteResultIdInput.value = id;
    deleteResultModal.show();
};

confirmDeleteResultButton.addEventListener("click", () => {
    const id = Number(deleteResultIdInput.value);
    const results = getStoredArray("results");
    const filtered = results.filter(r => r.resultId !== id);

    saveStoredArray("results", filtered);
    deleteResultModal.hide();

    flashMessage("Result record has been deleted.", "success");
    displayResults();
});

/* ------------------------------------------------------
   UI HELPERS
------------------------------------------------------ */

function flashMessage(text, type = "success") {
    resultPageMessage.innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            <i class="bi bi-check-circle-fill me-2"></i>
            ${escapeHTML(text)}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;

    // Auto dismiss after 5 seconds
    setTimeout(() => {
        const alertNode = resultPageMessage.querySelector(".alert");
        if (alertNode) {
            const bsAlert = bootstrap.Alert.getOrCreateInstance(alertNode);
            bsAlert.close();
        }
    }, 5000);
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
   LOGOUT & SIDEBAR NAVIGATION
------------------------------------------------------ */

function handleLogout() {
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("loggedUser");
    window.location.replace("login.html");
}

if (sidebarLogoutButton) {
    sidebarLogoutButton.addEventListener("click", handleLogout);
}
if (topLogoutButton) {
    topLogoutButton.addEventListener("click", handleLogout);
}

// Responsive Sidebar opening
if (mobileMenuButton) {
    mobileMenuButton.addEventListener("click", () => {
        sidebar.classList.add("show");
        sidebarOverlay.classList.add("show");
        document.body.style.overflow = "hidden";
    });
}

// Sidebar closing
function closeSidebar() {
    sidebar.classList.remove("show");
    sidebarOverlay.classList.remove("show");
    document.body.style.overflow = "";
}

if (sidebarCloseButton) {
    sidebarCloseButton.addEventListener("click", closeSidebar);
}
if (sidebarOverlay) {
    sidebarOverlay.addEventListener("click", closeSidebar);
}

/* ------------------------------------------------------
   FUTURE BACKEND VERSION

   Later, replace localStorage functions with fetch calls.

   Example:

   const API_BASE_URL = "http://localhost:5001/api";

   async function getResultsBackend() {
       const res = await fetch(`${API_BASE_URL}/results`);
       const json = await res.json();
       return json.data;
   }

   async function createResultBackend(resultData) {
       const res = await fetch(`${API_BASE_URL}/results`, {
           method: "POST",
           headers: { "Content-Type": "application/json" },
           body: JSON.stringify(resultData)
       });
       return await res.json();
   }
------------------------------------------------------ */

/* ------------------------------------------------------
   INITIAL PAGE LOAD
------------------------------------------------------ */

document.addEventListener("DOMContentLoaded", () => {
    protectPage();
    initializeData();
    loadUserInformation();
    populateDropdowns();
    displayResults();

    // Event listeners for searching/filtering
    resultSearchInput.addEventListener("input", displayResults);
    courseFilterSelect.addEventListener("change", displayResults);
    gradeFilterSelect.addEventListener("change", displayResults);
});
