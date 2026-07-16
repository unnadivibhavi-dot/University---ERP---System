"use strict";

/*
=========================================================
EDUPortal
Admin Examinations Management

Backend endpoints:
GET    /api/courses
GET    /api/examinations
POST   /api/examinations
PUT    /api/examinations/:id
DELETE /api/examinations/:id
=========================================================
*/


/* ------------------------------------------------------
   API CONFIGURATION
------------------------------------------------------ */

const EXAM_API_BASE_URL =
    window.ERP_CONFIG?.API_BASE_URL ||
    "https://university-erp-api-eduportal.azurewebsites.net/api";


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

const examTableBody =
    document.getElementById("examTableBody");

const examSearchInput =
    document.getElementById("examSearchInput");

const courseFilterSelect =
    document.getElementById("courseFilterSelect");

const statusFilterSelect =
    document.getElementById("statusFilterSelect");

const examRecordCount =
    document.getElementById("examRecordCount");

const totalExamsValue =
    document.getElementById("totalExamsValue");

const upcomingExamsValue =
    document.getElementById("upcomingExamsValue");

const completedExamsValue =
    document.getElementById("completedExamsValue");

const mostActiveCourseValue =
    document.getElementById("mostActiveCourseValue");

const examPageMessage =
    document.getElementById("examPageMessage");


/* ------------------------------------------------------
   FORM ELEMENTS
------------------------------------------------------ */

const examForm =
    document.getElementById("examForm");

const examIdInput =
    document.getElementById("examId");

const examCourseSelect =
    document.getElementById("examCourse");

const examNameInput =
    document.getElementById("examName");

const examDateInput =
    document.getElementById("examDate");

const examCourseError =
    document.getElementById("examCourseError");

const examNameError =
    document.getElementById("examNameError");

const examDateError =
    document.getElementById("examDateError");

const examFormMessage =
    document.getElementById("examFormMessage");

const examModalTitle =
    document.getElementById("examModalTitle");

const saveExamButton =
    document.getElementById("saveExamButton");

const saveExamButtonText =
    document.getElementById("saveExamButtonText");

const saveExamSpinner =
    document.getElementById("saveExamSpinner");

const openAddExamButton =
    document.getElementById("openAddExamButton");


/* ------------------------------------------------------
   DELETE MODAL ELEMENTS
------------------------------------------------------ */

const deleteExamIdInput =
    document.getElementById("deleteExamId");

const confirmDeleteExamButton =
    document.getElementById("confirmDeleteExamButton");


/* ------------------------------------------------------
   BOOTSTRAP MODALS
------------------------------------------------------ */

const examModalElement =
    document.getElementById("examModal");

const deleteExamModalElement =
    document.getElementById("deleteExamModal");

const examModal =
    new bootstrap.Modal(examModalElement);

const deleteExamModal =
    new bootstrap.Modal(deleteExamModalElement);


/* ------------------------------------------------------
   PAGE DATA

   These arrays hold backend data temporarily in memory.
   They are not saved to localStorage.
------------------------------------------------------ */

let examinations = [];
let courses = [];


/* ------------------------------------------------------
   AUTHENTICATION
------------------------------------------------------ */

function getToken() {
    return (
        localStorage.getItem("token") ||
        localStorage.getItem("authToken")
    );
}

function getLoggedUser() {
    const storedUser =
        localStorage.getItem("user") ||
        localStorage.getItem("loggedUser");

    if (!storedUser) {
        return null;
    }

    try {
        return JSON.parse(storedUser);
    } catch (error) {
        console.error(
            "Unable to read logged user:",
            error
        );

        return null;
    }
}

function clearLocalSession() {
    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    localStorage.removeItem("loggedUser");
    localStorage.removeItem("userRole");
    localStorage.removeItem("isLoggedIn");
}

function protectPage() {
    if (!getToken()) {
        clearLocalSession();
        window.location.replace("login.html");
        return false;
    }

    return true;
}


/* ------------------------------------------------------
   API REQUEST FUNCTION
------------------------------------------------------ */

async function apiRequest(endpoint, options = {}) {
    /*
    Use shared fetchWithAuth when config.js exists.
    */

    if (
        typeof window.fetchWithAuth ===
        "function"
    ) {
        return window.fetchWithAuth(
            endpoint,
            options
        );
    }

    /*
    Fallback for branches where config.js has not
    been merged yet.
    */

    const token = getToken();

    if (!token) {
        clearLocalSession();
        window.location.replace("login.html");

        throw new Error(
            "Authentication token is missing."
        );
    }

    const cleanEndpoint =
        endpoint.startsWith("/")
            ? endpoint
            : `/${endpoint}`;

    const headers =
        new Headers(options.headers || {});

    headers.set(
        "Authorization",
        `Bearer ${token}`
    );

    if (
        options.body &&
        !(options.body instanceof FormData)
    ) {
        headers.set(
            "Content-Type",
            "application/json"
        );
    }

    let response;

    try {
        response = await fetch(
            `${EXAM_API_BASE_URL}${cleanEndpoint}`,
            {
                ...options,
                headers
            }
        );
    } catch (error) {
        throw new Error(
            "Unable to connect to the backend server. Make sure it is running on port 5001."
        );
    }

    const responseText =
        await response.text();

    let data = {};

    if (responseText) {
        try {
            data = JSON.parse(responseText);
        } catch (error) {
            data = {
                message: responseText
            };
        }
    }

    if (
        response.status === 401 ||
        response.status === 403
    ) {
        clearLocalSession();
        window.location.replace("login.html");

        throw new Error(
            data.message ||
            "Your session has expired."
        );
    }

    if (!response.ok) {
        throw new Error(
            data.message ||
            data.error ||
            `Request failed with status ${response.status}.`
        );
    }

    return data;
}


/* ------------------------------------------------------
   USER INFORMATION
------------------------------------------------------ */

function loadUserInformation() {
    const user =
        getLoggedUser();

    const username =
        user?.username ||
        user?.Username ||
        "Administrator";

    const role =
        user?.role ||
        user?.Role ||
        "Admin";

    if (sidebarUsername) {
        sidebarUsername.textContent =
            username;
    }

    if (sidebarRole) {
        sidebarRole.textContent =
            role;
    }

    if (topUsername) {
        topUsername.textContent =
            username;
    }

    if (topRole) {
        topRole.textContent =
            role;
    }
}


/* ------------------------------------------------------
   FIELD NORMALIZATION

   Backend returns capitalized property names.
   These functions keep the frontend safe if property
   names change slightly.
------------------------------------------------------ */

function getExamId(exam) {
    return Number(
        exam.ExaminationID ??
        exam.examinationId ??
        exam.id
    );
}

function getExamCourseId(exam) {
    return Number(
        exam.CourseID ??
        exam.courseId
    );
}

function getExamName(exam) {
    return String(
        exam.ExaminationName ??
        exam.examinationName ??
        ""
    );
}

function getExamDate(exam) {
    return (
        exam.ExaminationDate ??
        exam.examinationDate ??
        ""
    );
}

function getCourseId(course) {
    return Number(
        course.CourseID ??
        course.courseId ??
        course.id
    );
}

function getCourseCode(course) {
    return String(
        course.CourseCode ??
        course.courseCode ??
        ""
    );
}

function getCourseName(course) {
    return String(
        course.CourseName ??
        course.courseName ??
        ""
    );
}


/* ------------------------------------------------------
   GENERAL HELPERS
------------------------------------------------------ */

function escapeHTML(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function getTodayString() {
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

    return `${year}-${month}-${day}`;
}

function toDateInputValue(value) {
    if (!value) {
        return "";
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "";
    }

    return date
        .toISOString()
        .split("T")[0];
}

function formatDate(value) {
    if (!value) {
        return "N/A";
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return value;
    }

    return date.toLocaleDateString(
        "en-US",
        {
            year: "numeric",
            month: "short",
            day: "numeric"
        }
    );
}


/* ------------------------------------------------------
   PAGE MESSAGES
------------------------------------------------------ */

function flashMessage(
    text,
    type = "success"
) {
    const iconClass =
        type === "success"
            ? "bi-check-circle-fill"
            : "bi-exclamation-triangle-fill";

    examPageMessage.innerHTML = `
        <div
            class="alert alert-${type} alert-dismissible fade show"
            role="alert"
        >
            <i class="bi ${iconClass} me-2"></i>

            ${escapeHTML(text)}

            <button
                type="button"
                class="btn-close"
                data-bs-dismiss="alert"
                aria-label="Close"
            ></button>
        </div>
    `;

    window.setTimeout(() => {
        const alertNode =
            examPageMessage.querySelector(
                ".alert"
            );

        if (alertNode) {
            const alertInstance =
                bootstrap.Alert.getOrCreateInstance(
                    alertNode
                );

            alertInstance.close();
        }
    }, 5000);
}

function showFormMessage(
    text,
    type = "danger"
) {
    examFormMessage.innerHTML = `
        <div class="alert alert-${type}">
            ${escapeHTML(text)}
        </div>
    `;
}


/* ------------------------------------------------------
   LOADING STATE
------------------------------------------------------ */

function showTableLoading() {
    examTableBody.innerHTML = `
        <tr>
            <td
                colspan="6"
                class="text-center py-5"
            >
                <span
                    class="spinner-border spinner-border-sm me-2"
                ></span>

                Loading examinations...
            </td>
        </tr>
    `;
}

function setSaveButtonLoading(loading) {
    saveExamButton.disabled =
        loading;

    saveExamSpinner.classList.toggle(
        "d-none",
        !loading
    );

    saveExamButtonText.textContent =
        loading
            ? "Saving..."
            : examIdInput.value
                ? "Save Changes"
                : "Save Examination";
}

function setDeleteButtonLoading(loading) {
    confirmDeleteExamButton.disabled =
        loading;

    confirmDeleteExamButton.textContent =
        loading
            ? "Deleting..."
            : "Delete Examination";
}


/* ------------------------------------------------------
   LOAD BACKEND DATA
------------------------------------------------------ */

async function loadExaminationPageData() {
    showTableLoading();

    try {
        const [
            courseResponse,
            examinationResponse
        ] = await Promise.all([
            apiRequest("/courses"),
            apiRequest("/examinations")
        ]);

        courses =
            Array.isArray(courseResponse.data)
                ? courseResponse.data
                : [];

        examinations =
            Array.isArray(
                examinationResponse.data
            )
                ? examinationResponse.data
                : [];

        populateDropdowns();
        displayExaminations();

    } catch (error) {
        console.error(
            "Unable to load examination page:",
            error
        );

        examinations = [];
        courses = [];

        populateDropdowns();
        displayExaminations();

        flashMessage(
            error.message,
            "danger"
        );
    }
}

async function reloadExaminations() {
    const response =
        await apiRequest(
            "/examinations"
        );

    examinations =
        Array.isArray(response.data)
            ? response.data
            : [];

    displayExaminations();
}


/* ------------------------------------------------------
   POPULATE COURSE DROPDOWNS
------------------------------------------------------ */

function populateDropdowns() {
    courseFilterSelect.innerHTML = `
        <option value="">
            All Courses
        </option>
    `;

    examCourseSelect.innerHTML = `
        <option value="">
            Select Course
        </option>
    `;

    courses.forEach(course => {
        const courseId =
            getCourseId(course);

        const optionText =
            `${getCourseCode(course)} - ${getCourseName(course)}`;

        const filterOption =
            document.createElement("option");

        filterOption.value =
            courseId;

        filterOption.textContent =
            optionText;

        courseFilterSelect.appendChild(
            filterOption
        );

        const formOption =
            document.createElement("option");

        formOption.value =
            courseId;

        formOption.textContent =
            optionText;

        examCourseSelect.appendChild(
            formOption
        );
    });
}


/* ------------------------------------------------------
   SUMMARY CARDS
------------------------------------------------------ */

function updateSummaryCards() {
    totalExamsValue.textContent =
        examinations.length;

    const today =
        getTodayString();

    const upcomingCount =
        examinations.filter(
            exam =>
                toDateInputValue(
                    getExamDate(exam)
                ) > today
        ).length;

    const completedCount =
        examinations.filter(
            exam =>
                toDateInputValue(
                    getExamDate(exam)
                ) <= today
        ).length;

    upcomingExamsValue.textContent =
        upcomingCount;

    completedExamsValue.textContent =
        completedCount;

    if (
        examinations.length === 0
    ) {
        mostActiveCourseValue.textContent =
            "N/A";

        mostActiveCourseValue.title =
            "";

        return;
    }

    const courseCounts = {};

    examinations.forEach(exam => {
        const courseId =
            getExamCourseId(exam);

        courseCounts[courseId] =
            (courseCounts[courseId] || 0) +
            1;
    });

    let mostActiveCourseId = null;
    let highestCount = 0;

    Object.entries(courseCounts)
        .forEach(
            ([courseId, count]) => {
                if (count > highestCount) {
                    highestCount = count;

                    mostActiveCourseId =
                        Number(courseId);
                }
            }
        );

    const selectedCourse =
        courses.find(
            course =>
                getCourseId(course) ===
                mostActiveCourseId
        );

    if (selectedCourse) {
        mostActiveCourseValue.textContent =
            `${getCourseCode(selectedCourse)} (${highestCount})`;

        mostActiveCourseValue.title =
            `${getCourseName(selectedCourse)} (${highestCount} examinations)`;
    } else {
        mostActiveCourseValue.textContent =
            `Course ${mostActiveCourseId} (${highestCount})`;

        mostActiveCourseValue.title =
            "";
    }
}


/* ------------------------------------------------------
   DISPLAY EXAMINATIONS
------------------------------------------------------ */

function displayExaminations() {
    const searchValue =
        examSearchInput.value
            .trim()
            .toLowerCase();

    const selectedCourseId =
        courseFilterSelect.value;

    const selectedStatus =
        statusFilterSelect.value;

    const today =
        getTodayString();

    const filteredExaminations =
        examinations
            .filter(exam => {
                const examCourseId =
                    getExamCourseId(exam);

                const course =
                    courses.find(
                        item =>
                            getCourseId(item) ===
                            examCourseId
                    );

                const examinationName =
                    getExamName(exam)
                        .toLowerCase();

                const courseCode =
                    getCourseCode(course)
                        .toLowerCase();

                const courseName =
                    getCourseName(course)
                        .toLowerCase();

                const matchesSearch =
                    examinationName.includes(
                        searchValue
                    ) ||
                    courseCode.includes(
                        searchValue
                    ) ||
                    courseName.includes(
                        searchValue
                    );

                const matchesCourse =
                    selectedCourseId === "" ||
                    String(examCourseId) ===
                    String(
                        selectedCourseId
                    );

                const status =
                    toDateInputValue(
                        getExamDate(exam)
                    ) > today
                        ? "Upcoming"
                        : "Completed";

                const matchesStatus =
                    selectedStatus === "" ||
                    status === selectedStatus;

                return (
                    matchesSearch &&
                    matchesCourse &&
                    matchesStatus
                );
            })
            .sort(
                (firstExam, secondExam) =>
                    new Date(
                        getExamDate(
                            secondExam
                        )
                    ) -
                    new Date(
                        getExamDate(
                            firstExam
                        )
                    )
            );

    examTableBody.innerHTML = "";

    if (
        filteredExaminations.length ===
        0
    ) {
        examTableBody.innerHTML = `
            <tr>
                <td colspan="6">
                    <div
                        class="result-empty-state"
                        style="
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            padding: 40px 20px;
                            text-align: center;
                        "
                    >
                        <div
                            class="result-empty-icon"
                            style="
                                font-size: 40px;
                                color: var(--text-muted);
                                margin-bottom: 12px;
                            "
                        >
                            <i class="bi bi-file-earmark-text"></i>
                        </div>

                        <h4>No examinations found</h4>

                        <p class="text-muted">
                            Try changing the search or filter.
                        </p>
                    </div>
                </td>
            </tr>
        `;

        examRecordCount.textContent =
            "Showing 0 examinations";

        updateSummaryCards();

        return;
    }

    filteredExaminations.forEach(
        exam => {
            const examinationId =
                getExamId(exam);

            const courseId =
                getExamCourseId(exam);

            const course =
                courses.find(
                    item =>
                        getCourseId(item) ===
                        courseId
                );

            const examinationDate =
                toDateInputValue(
                    getExamDate(exam)
                );

            const examinationStatus =
                examinationDate > today
                    ? "Upcoming"
                    : "Completed";

            const statusClass =
                examinationStatus ===
                    "Upcoming"
                    ? "pending-status"
                    : "active-status";

            const row =
                document.createElement(
                    "tr"
                );

            row.innerHTML = `
                <td>
                    <span class="student-id-badge">
                        ${examinationId}
                    </span>
                </td>

                <td>
                    <div
                        class="course-details"
                        style="
                            display: flex;
                            flex-direction: column;
                        "
                    >
                        <strong>
                            ${escapeHTML(
                getCourseName(course) ||
                exam.CourseName ||
                "Unknown Course"
            )}
                        </strong>

                        <span
                            class="text-muted"
                            style="font-size: 12px;"
                        >
                            ${escapeHTML(
                getCourseCode(course) ||
                exam.CourseCode ||
                "N/A"
            )}
                        </span>
                    </div>
                </td>

                <td>
                    <strong>
                        ${escapeHTML(
                getExamName(exam)
            )}
                    </strong>
                </td>

                <td>
                    ${formatDate(
                getExamDate(exam)
            )}
                </td>

                <td>
                    <span
                        class="status-badge ${statusClass}"
                    >
                        ${examinationStatus}
                    </span>
                </td>

                <td>
                    <div
                        class="table-action-group"
                        style="
                            display: flex;
                            gap: 8px;
                        "
                    >
                        <button
                            type="button"
                            class="btn edit-student-button"
                            data-action="edit"
                            data-exam-id="${examinationId}"
                            aria-label="Edit examination"
                        >
                            <i class="bi bi-pencil-fill"></i>
                        </button>

                        <button
                            type="button"
                            class="btn remove-enrollment-button"
                            data-action="delete"
                            data-exam-id="${examinationId}"
                            aria-label="Delete examination"
                        >
                            <i class="bi bi-trash3-fill"></i>
                        </button>
                    </div>
                </td>
            `;

            examTableBody.appendChild(
                row
            );
        }
    );

    examRecordCount.textContent =
        `Showing ${filteredExaminations.length} of ${examinations.length} examinations`;

    updateSummaryCards();
}


/* ------------------------------------------------------
   FORM VALIDATION
------------------------------------------------------ */

function clearErrors() {
    examCourseError.textContent =
        "";

    examNameError.textContent =
        "";

    examDateError.textContent =
        "";

    examFormMessage.innerHTML =
        "";
}

function validateForm() {
    let valid = true;

    clearErrors();

    if (!examCourseSelect.value) {
        examCourseError.textContent =
            "Please select a course.";

        valid = false;
    }

    if (
        !examNameInput.value.trim()
    ) {
        examNameError.textContent =
            "Examination name is required.";

        valid = false;
    }

    if (!examDateInput.value) {
        examDateError.textContent =
            "Examination date is required.";

        valid = false;
    } else {
        const selectedDate =
            new Date(
                examDateInput.value
            );

        if (
            Number.isNaN(
                selectedDate.getTime()
            )
        ) {
            examDateError.textContent =
                "Please enter a valid date.";

            valid = false;
        }
    }

    return valid;
}


/* ------------------------------------------------------
   OPEN ADD MODAL
------------------------------------------------------ */

function prepareAddExamination() {
    clearErrors();
    examForm.reset();

    examIdInput.value =
        "";

    examModalTitle.textContent =
        "Add Examination";

    saveExamButtonText.textContent =
        "Save Examination";
}


/* ------------------------------------------------------
   OPEN EDIT MODAL
------------------------------------------------------ */

function editExamination(id) {
    const examination =
        examinations.find(
            exam =>
                getExamId(exam) ===
                Number(id)
        );

    if (!examination) {
        flashMessage(
            "Examination was not found.",
            "danger"
        );

        return;
    }

    clearErrors();
    examForm.reset();

    examIdInput.value =
        getExamId(examination);

    examCourseSelect.value =
        getExamCourseId(examination);

    examNameInput.value =
        getExamName(examination);

    examDateInput.value =
        toDateInputValue(
            getExamDate(examination)
        );

    examModalTitle.textContent =
        "Edit Examination";

    saveExamButtonText.textContent =
        "Save Changes";

    examModal.show();
}


/* ------------------------------------------------------
   SAVE EXAMINATION
------------------------------------------------------ */

async function saveExamination(event) {
    event.preventDefault();

    if (!validateForm()) {
        return;
    }

    const examinationId =
        examIdInput.value
            ? Number(examIdInput.value)
            : null;

    const payload = {
        courseId:
            Number(
                examCourseSelect.value
            ),

        examinationName:
            examNameInput.value.trim(),

        examinationDate:
            examDateInput.value
    };

    const duplicate =
        examinations.some(exam => {
            return (
                getExamCourseId(exam) ===
                payload.courseId &&

                getExamName(exam)
                    .toLowerCase() ===
                payload.examinationName
                    .toLowerCase() &&

                toDateInputValue(
                    getExamDate(exam)
                ) ===
                payload.examinationDate &&

                getExamId(exam) !==
                examinationId
            );
        });

    if (duplicate) {
        showFormMessage(
            "An examination with the same course, name and date already exists."
        );

        return;
    }

    setSaveButtonLoading(true);

    try {
        if (examinationId) {
            await apiRequest(
                `/examinations/${examinationId}`,
                {
                    method: "PUT",
                    body: JSON.stringify(
                        payload
                    )
                }
            );
        } else {
            await apiRequest(
                "/examinations",
                {
                    method: "POST",
                    body: JSON.stringify(
                        payload
                    )
                }
            );
        }

        examModal.hide();

        await reloadExaminations();

        flashMessage(
            examinationId
                ? "Examination updated successfully."
                : "Examination created successfully.",
            "success"
        );

    } catch (error) {
        console.error(
            "Unable to save examination:",
            error
        );

        showFormMessage(
            error.message
        );

    } finally {
        setSaveButtonLoading(false);
    }
}


/* ------------------------------------------------------
   DELETE EXAMINATION
------------------------------------------------------ */

function openDeleteModal(id) {
    deleteExamIdInput.value =
        id;

    deleteExamModal.show();
}

async function deleteExamination() {
    const examinationId =
        Number(
            deleteExamIdInput.value
        );

    if (!examinationId) {
        return;
    }

    setDeleteButtonLoading(true);

    try {
        await apiRequest(
            `/examinations/${examinationId}`,
            {
                method: "DELETE"
            }
        );

        deleteExamModal.hide();

        await reloadExaminations();

        flashMessage(
            "Examination deleted successfully.",
            "success"
        );

    } catch (error) {
        console.error(
            "Unable to delete examination:",
            error
        );

        deleteExamModal.hide();

        flashMessage(
            error.message,
            "danger"
        );

    } finally {
        setDeleteButtonLoading(false);
    }
}


/* ------------------------------------------------------
   TABLE BUTTON HANDLING
------------------------------------------------------ */

function handleTableAction(event) {
    const button =
        event.target.closest(
            "button[data-action]"
        );

    if (!button) {
        return;
    }

    const examinationId =
        Number(
            button.dataset.examId
        );

    if (
        button.dataset.action ===
        "edit"
    ) {
        editExamination(
            examinationId
        );
    }

    if (
        button.dataset.action ===
        "delete"
    ) {
        openDeleteModal(
            examinationId
        );
    }
}


/* ------------------------------------------------------
   SIDEBAR
------------------------------------------------------ */

function openSidebar() {
    sidebar?.classList.add("show");
    sidebarOverlay?.classList.add("show");

    document.body.style.overflow =
        "hidden";
}

function closeSidebar() {
    sidebar?.classList.remove("show");
    sidebarOverlay?.classList.remove("show");

    document.body.style.overflow =
        "";
}


/* ------------------------------------------------------
   LOGOUT
------------------------------------------------------ */

function handleLogout() {
    if (
        typeof window.clearSession ===
        "function"
    ) {
        window.clearSession();
    } else {
        clearLocalSession();
    }

    window.location.replace(
        "login.html"
    );
}


/* ------------------------------------------------------
   EVENT LISTENERS
------------------------------------------------------ */

examForm.addEventListener(
    "submit",
    saveExamination
);

confirmDeleteExamButton.addEventListener(
    "click",
    deleteExamination
);

examTableBody.addEventListener(
    "click",
    handleTableAction
);

openAddExamButton?.addEventListener(
    "click",
    prepareAddExamination
);

examSearchInput.addEventListener(
    "input",
    displayExaminations
);

courseFilterSelect.addEventListener(
    "change",
    displayExaminations
);

statusFilterSelect.addEventListener(
    "change",
    displayExaminations
);

sidebarLogoutButton?.addEventListener(
    "click",
    handleLogout
);

topLogoutButton?.addEventListener(
    "click",
    handleLogout
);

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


/* ------------------------------------------------------
   INITIAL PAGE LOAD
------------------------------------------------------ */

document.addEventListener(
    "DOMContentLoaded",
    () => {
        if (!protectPage()) {
            return;
        }

        loadUserInformation();
        loadExaminationPageData();
    }
);