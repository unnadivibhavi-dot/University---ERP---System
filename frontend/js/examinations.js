"use strict";

/*
=========================================================
UNIVERSITY ERP SYSTEM
Examinations Management Frontend Module

Data sources:
- localStorage ("examinations", "courses", "results")
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

const examTableBody = document.getElementById("examTableBody");
const examSearchInput = document.getElementById("examSearchInput");
const courseFilterSelect = document.getElementById("courseFilterSelect");
const statusFilterSelect = document.getElementById("statusFilterSelect");
const examRecordCount = document.getElementById("examRecordCount");

const totalExamsValue = document.getElementById("totalExamsValue");
const upcomingExamsValue = document.getElementById("upcomingExamsValue");
const completedExamsValue = document.getElementById("completedExamsValue");
const mostActiveCourseValue = document.getElementById("mostActiveCourseValue");

const examPageMessage = document.getElementById("examPageMessage");

/* ------------------------------------------------------
   FORM ELEMENTS
------------------------------------------------------ */

const examForm = document.getElementById("examForm");
const examIdInput = document.getElementById("examId");
const examCourseSelect = document.getElementById("examCourse");
const examNameInput = document.getElementById("examName");
const examDateInput = document.getElementById("examDate");

const examCourseError = document.getElementById("examCourseError");
const examNameError = document.getElementById("examNameError");
const examDateError = document.getElementById("examDateError");
const examFormMessage = document.getElementById("examFormMessage");

const examModalTitle = document.getElementById("examModalTitle");
const saveExamButton = document.getElementById("saveExamButton");
const saveExamButtonText = document.getElementById("saveExamButtonText");
const saveExamSpinner = document.getElementById("saveExamSpinner");
const openAddExamButton = document.getElementById("openAddExamButton");

/* ------------------------------------------------------
   DELETE MODAL ELEMENTS
------------------------------------------------------ */

const deleteExamIdInput = document.getElementById("deleteExamId");
const confirmDeleteExamButton = document.getElementById("confirmDeleteExamButton");

/* ------------------------------------------------------
   BOOTSTRAP MODALS
------------------------------------------------------ */

const examModalElement = document.getElementById("examModal");
const deleteExamModalElement = document.getElementById("deleteExamModal");

const examModal = new bootstrap.Modal(examModalElement);
const deleteExamModal = new bootstrap.Modal(deleteExamModalElement);

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
        console.error(`Failed to parse localStorage key "${key}":`, e);
        return [];
    }
}

function saveStoredArray(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.error(`Failed to save localStorage key "${key}":`, e);
    }
}

function initializeData() {
    // If examinations are not set, initialize defaults
    if (!localStorage.getItem("examinations")) {
        saveStoredArray("examinations", defaultExaminations);
    }
}

/* ------------------------------------------------------
   POPULATE DROPDOWNS
------------------------------------------------------ */

function populateDropdowns() {
    const courses = getStoredArray("courses");

    // Clear filters and form selections
    courseFilterSelect.innerHTML = '<option value="">All Courses</option>';
    examCourseSelect.innerHTML = '<option value="">Select Course</option>';

    courses.forEach(course => {
        const optionText = `${course.courseCode} - ${course.courseName}`;
        
        // Populate filter
        const filterOpt = document.createElement("option");
        filterOpt.value = course.courseId;
        filterOpt.textContent = optionText;
        courseFilterSelect.appendChild(filterOpt);

        // Populate modal select
        const formOpt = document.createElement("option");
        formOpt.value = course.courseId;
        formOpt.textContent = optionText;
        examCourseSelect.appendChild(formOpt);
    });
}

/* ------------------------------------------------------
   METRICS CALCULATIONS
------------------------------------------------------ */

function getTodayString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function updateSummaryCards(filteredList) {
    const examinations = getStoredArray("examinations");
    const courses = getStoredArray("courses");

    totalExamsValue.textContent = examinations.length;

    const todayStr = getTodayString();

    const upcomingCount = examinations.filter(e => e.examinationDate > todayStr).length;
    const completedCount = examinations.filter(e => e.examinationDate <= todayStr).length;

    upcomingExamsValue.textContent = upcomingCount;
    completedExamsValue.textContent = completedCount;

    // Calculate course with most exams
    if (examinations.length === 0) {
        mostActiveCourseValue.textContent = "N/A";
        mostActiveCourseValue.title = "";
        return;
    }

    const courseCounts = {};
    examinations.forEach(e => {
        courseCounts[e.courseId] = (courseCounts[e.courseId] || 0) + 1;
    });

    let topCourseId = null;
    let maxCount = -1;
    for (const [cId, count] of Object.entries(courseCounts)) {
        if (count > maxCount) {
            maxCount = count;
            topCourseId = Number(cId);
        }
    }

    if (topCourseId) {
        const topCourse = courses.find(c => c.courseId === topCourseId);
        if (topCourse) {
            const displayName = topCourse.courseCode;
            mostActiveCourseValue.textContent = `${displayName} (${maxCount})`;
            mostActiveCourseValue.title = `${topCourse.courseName} (${maxCount} Exams)`;
        } else {
            mostActiveCourseValue.textContent = `Course ID: ${topCourseId} (${maxCount})`;
            mostActiveCourseValue.title = "";
        }
    } else {
        mostActiveCourseValue.textContent = "N/A";
        mostActiveCourseValue.title = "";
    }
}

/* ------------------------------------------------------
   DISPLAY & SEARCH / FILTER
------------------------------------------------------ */

function formatDate(dateStr) {
    if (!dateStr) return "N/A";
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric"
        });
    } catch (e) {
        return dateStr;
    }
}

function displayExaminations() {
    const examinations = getStoredArray("examinations");
    const courses = getStoredArray("courses");

    const searchValue = examSearchInput.value.trim().toLowerCase();
    const courseFilter = courseFilterSelect.value;
    const statusFilter = statusFilterSelect.value;

    const todayStr = getTodayString();

    const filtered = examinations.filter(exam => {
        const course = courses.find(c => c.courseId === exam.courseId);
        const courseCode = course ? course.courseCode.toLowerCase() : "";
        const courseName = course ? course.courseName.toLowerCase() : "";
        const examName = exam.examinationName.toLowerCase();

        const matchesSearch = examName.includes(searchValue) ||
            courseCode.includes(searchValue) ||
            courseName.includes(searchValue);

        const matchesCourse = courseFilter === "" || String(exam.courseId) === String(courseFilter);

        const examStatus = exam.examinationDate > todayStr ? "Upcoming" : "Completed";
        const matchesStatus = statusFilter === "" || examStatus === statusFilter;

        return matchesSearch && matchesCourse && matchesStatus;
    });

    // Sort by date descending
    filtered.sort((a, b) => new Date(b.examinationDate) - new Date(a.examinationDate));

    examTableBody.innerHTML = "";

    if (filtered.length === 0) {
        examTableBody.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="result-empty-state" style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 20px; text-align: center;">
                        <div class="result-empty-icon" style="font-size: 40px; color: var(--text-muted); margin-bottom: 12px;">
                            <i class="bi bi-file-earmark-text"></i>
                        </div>
                        <h4>No examinations found</h4>
                        <p class="text-muted">Try changing the search queries or selecting a different filter.</p>
                    </div>
                </td>
            </tr>
        `;
        examRecordCount.textContent = "Showing 0 examinations";
        updateSummaryCards(examinations);
        return;
    }

    filtered.forEach(exam => {
        const course = courses.find(c => c.courseId === exam.courseId);
        const examStatus = exam.examinationDate > todayStr ? "Upcoming" : "Completed";
        const statusClass = examStatus === "Upcoming" ? "pending-status" : "active-status";

        const row = document.createElement("tr");
        row.innerHTML = `
            <td>
                <span class="student-id-badge">${exam.examinationId}</span>
            </td>
            <td>
                <div class="course-details" style="display: flex; flex-direction: column;">
                    <strong>${escapeHTML(course ? course.courseName : "Unknown Course")}</strong>
                    <span class="text-muted" style="font-size: 12px;">${escapeHTML(course ? course.courseCode : "N/A")}</span>
                </div>
            </td>
            <td>
                <strong>${escapeHTML(exam.examinationName)}</strong>
            </td>
            <td>
                ${formatDate(exam.examinationDate)}
            </td>
            <td>
                <span class="status-badge ${statusClass}">
                    ${examStatus}
                </span>
            </td>
            <td>
                <div class="table-action-group" style="display: flex; gap: 8px;">
                    <button type="button" class="btn edit-student-button" onclick="editExamination(${exam.examinationId})" aria-label="Edit examination">
                        <i class="bi bi-pencil-fill"></i>
                    </button>
                    <button type="button" class="btn remove-enrollment-button" onclick="openDeleteModal(${exam.examinationId})" aria-label="Delete examination">
                        <i class="bi bi-trash3-fill"></i>
                    </button>
                </div>
            </td>
        `;
        examTableBody.appendChild(row);
    });

    examRecordCount.textContent = `Showing ${filtered.length} of ${examinations.length} examinations`;
    updateSummaryCards(examinations);
}

/* ------------------------------------------------------
   FORM VALIDATION & CRUD
------------------------------------------------------ */

function clearErrors() {
    examCourseError.textContent = "";
    examNameError.textContent = "";
    examDateError.textContent = "";
    examFormMessage.innerHTML = "";
}

function validateForm() {
    let isValid = true;
    clearErrors();

    if (!examCourseSelect.value) {
        examCourseError.textContent = "Please select a course.";
        isValid = false;
    }

    if (!examNameInput.value.trim()) {
        examNameError.textContent = "Examination name is required.";
        isValid = false;
    }

    if (!examDateInput.value) {
        examDateError.textContent = "Examination date is required.";
        isValid = false;
    } else {
        const testDate = new Date(examDateInput.value);
        if (isNaN(testDate.getTime())) {
            examDateError.textContent = "Please enter a valid date.";
            isValid = false;
        }
    }

    return isValid;
}

examForm.addEventListener("submit", (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    saveExamButton.disabled = true;
    saveExamSpinner.classList.remove("d-none");
    saveExamButtonText.textContent = "Saving...";

    setTimeout(() => {
        const examId = examIdInput.value ? Number(examIdInput.value) : null;
        const courseId = Number(examCourseSelect.value);
        const examName = examNameInput.value.trim();
        const examDate = examDateInput.value;

        const examinations = getStoredArray("examinations");

        // Duplicate Check (same course, name, and date; exclude current editing ID)
        const isDuplicate = examinations.some(e => 
            e.courseId === courseId && 
            e.examinationName.toLowerCase() === examName.toLowerCase() && 
            e.examinationDate === examDate && 
            e.examinationId !== examId
        );

        if (isDuplicate) {
            examFormMessage.innerHTML = `
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle-fill me-2"></i>
                    An examination with the same course, name, and date already exists.
                </div>
            `;
            saveExamButton.disabled = false;
            saveExamSpinner.classList.add("d-none");
            saveExamButtonText.textContent = examId ? "Save Changes" : "Save Examination";
            return;
        }

        if (examId) {
            // Update
            const index = examinations.findIndex(e => e.examinationId === examId);
            if (index !== -1) {
                examinations[index] = {
                    examinationId: examId,
                    courseId,
                    examinationName: examName,
                    examinationDate: examDate
                };
            }
        } else {
            // Create
            const nextId = examinations.length > 0 ? Math.max(...examinations.map(e => e.examinationId)) + 1 : 1;
            examinations.push({
                examinationId: nextId,
                courseId,
                examinationName: examName,
                examinationDate: examDate
            });
        }

        saveStoredArray("examinations", examinations);

        saveExamButton.disabled = false;
        saveExamSpinner.classList.add("d-none");
        examModal.hide();

        flashMessage(examId ? "Examination updated successfully!" : "Examination created successfully!", "success");
        displayExaminations();
    }, 600);
});

// Edit Loader
window.editExamination = function(id) {
    const examinations = getStoredArray("examinations");
    const exam = examinations.find(e => e.examinationId === id);
    if (!exam) return;

    clearErrors();
    examForm.reset();

    examIdInput.value = exam.examinationId;
    examCourseSelect.value = exam.courseId;
    examNameInput.value = exam.examinationName;
    examDateInput.value = exam.examinationDate;

    examModalTitle.textContent = "Edit Examination";
    saveExamButtonText.textContent = "Save Changes";

    examModal.show();
};

/* ------------------------------------------------------
   DELETE EXAMINATION
------------------------------------------------------ */

window.openDeleteModal = function(id) {
    deleteExamIdInput.value = id;
    deleteExamModal.show();
};

confirmDeleteExamButton.addEventListener("click", () => {
    const id = Number(deleteExamIdInput.value);
    const results = getStoredArray("results");

    // Referential integrity check: Cannot delete examination if it has results
    const hasAssociatedResults = results.some(r => r.examinationId === id);

    if (hasAssociatedResults) {
        deleteExamModal.hide();
        flashMessage("Cannot delete examination because it has associated results.", "danger");
        return;
    }

    const examinations = getStoredArray("examinations");
    const filtered = examinations.filter(e => e.examinationId !== id);

    saveStoredArray("examinations", filtered);
    deleteExamModal.hide();

    flashMessage("Examination record has been deleted.", "success");
    displayExaminations();
});

/* ------------------------------------------------------
   UI HELPERS
------------------------------------------------------ */

function flashMessage(text, type = "success") {
    const iconClass = type === "success" ? "bi-check-circle-fill" : "bi-exclamation-triangle-fill";
    examPageMessage.innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            <i class="bi ${iconClass} me-2"></i>
            ${escapeHTML(text)}
            <button type="button" class="btn-close" data-bs-alert="close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;

    setTimeout(() => {
        const alertNode = examPageMessage.querySelector(".alert");
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
   FUTURE BACKEND CONNECTION
   
   Later use:
   GET    /api/examinations
   GET    /api/examinations/:id
   POST   /api/examinations
   PUT    /api/examinations/:id
   DELETE /api/examinations/:id

   Example:
   const API_BASE_URL = "http://localhost:5001/api";

   async function getExaminationsBackend() {
       const res = await fetch(`${API_BASE_URL}/examinations`);
       const json = await res.json();
       return json.data;
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
    displayExaminations();

    // Reset button handler
    if (openAddExamButton) {
        openAddExamButton.addEventListener("click", () => {
            clearErrors();
            examForm.reset();
            examIdInput.value = "";
            examModalTitle.textContent = "Add Examination";
            saveExamButtonText.textContent = "Save Examination";
        });
    }

    // Filters event listeners
    examSearchInput.addEventListener("input", displayExaminations);
    courseFilterSelect.addEventListener("change", displayExaminations);
    statusFilterSelect.addEventListener("change", displayExaminations);
});
