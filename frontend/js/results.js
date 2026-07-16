"use strict";

/*
=========================================================
EDUPortal
Admin Results Management

Backend endpoints:
GET    /api/students
GET    /api/courses
GET    /api/examinations
GET    /api/results
POST   /api/results
PUT    /api/results/:id
DELETE /api/results/:id
=========================================================
*/


/* ------------------------------------------------------
   API CONFIGURATION
------------------------------------------------------ */

const RESULT_API_BASE_URL =
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

const resultTableBody =
    document.getElementById("resultTableBody");

const resultSearchInput =
    document.getElementById("resultSearchInput");

const courseFilterSelect =
    document.getElementById("courseFilterSelect");

const gradeFilterSelect =
    document.getElementById("gradeFilterSelect");

const resultRecordCount =
    document.getElementById("resultRecordCount");

const totalResultsValue =
    document.getElementById("totalResultsValue");

const classAverageValue =
    document.getElementById("classAverageValue");

const passRateValue =
    document.getElementById("passRateValue");

const topPerformerValue =
    document.getElementById("topPerformerValue");

const resultPageMessage =
    document.getElementById("resultPageMessage");


/* ------------------------------------------------------
   FORM ELEMENTS
------------------------------------------------------ */

const resultForm =
    document.getElementById("resultForm");

const resultIdInput =
    document.getElementById("resultId");

const resultStudentSelect =
    document.getElementById("resultStudent");

const resultCourseSelect =
    document.getElementById("resultCourse");

const resultExaminationSelect =
    document.getElementById("resultExamination");

const resultMarksInput =
    document.getElementById("resultMarks");

const resultGradeInput =
    document.getElementById("resultGrade");

const resultStudentError =
    document.getElementById("resultStudentError");

const resultCourseError =
    document.getElementById("resultCourseError");

const resultExaminationError =
    document.getElementById("resultExaminationError");

const resultMarksError =
    document.getElementById("resultMarksError");

const resultFormMessage =
    document.getElementById("resultFormMessage");

const resultModalTitle =
    document.getElementById("resultModalTitle");

const saveResultButton =
    document.getElementById("saveResultButton");

const saveResultButtonText =
    document.getElementById("saveResultButtonText");

const saveResultSpinner =
    document.getElementById("saveResultSpinner");

const openAddResultButton =
    document.getElementById("openAddResultButton");


/* ------------------------------------------------------
   DELETE MODAL ELEMENTS
------------------------------------------------------ */

const deleteResultIdInput =
    document.getElementById("deleteResultId");

const confirmDeleteResultButton =
    document.getElementById("confirmDeleteResultButton");


/* ------------------------------------------------------
   BOOTSTRAP MODALS
------------------------------------------------------ */

const resultModal =
    new bootstrap.Modal(
        document.getElementById("resultModal")
    );

const deleteResultModal =
    new bootstrap.Modal(
        document.getElementById("deleteResultModal")
    );


/* ------------------------------------------------------
   PAGE DATA

   These arrays contain API data only.
   Nothing is stored as academic data in localStorage.
------------------------------------------------------ */

let results = [];
let students = [];
let courses = [];
let examinations = [];


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
   API REQUEST
------------------------------------------------------ */

async function apiRequest(endpoint, options = {}) {
    if (
        typeof window.fetchWithAuth ===
        "function"
    ) {
        return window.fetchWithAuth(
            endpoint,
            options
        );
    }

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
            `${RESULT_API_BASE_URL}${cleanEndpoint}`,
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
    const user = getLoggedUser();

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
   FIELD HELPERS
------------------------------------------------------ */

function getResultId(result) {
    return Number(
        result.ResultID ??
        result.resultId ??
        result.id
    );
}

function getResultStudentId(result) {
    return Number(
        result.StudentID ??
        result.studentId
    );
}

function getResultExamId(result) {
    return Number(
        result.ExaminationID ??
        result.examinationId
    );
}

function getResultMarks(result) {
    return Number(
        result.Marks ??
        result.marks ??
        0
    );
}

function getResultGrade(result) {
    return String(
        result.Grade ??
        result.grade ??
        ""
    );
}

function getStudentId(student) {
    return Number(
        student.StudentID ??
        student.studentId ??
        student.id
    );
}

function getStudentName(student) {
    return String(
        student.FullName ??
        student.fullName ??
        ""
    );
}

function getRegistrationNumber(student) {
    return String(
        student.RegistrationNumber ??
        student.registrationNumber ??
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

function calculateGrade(marks) {
    const numericMarks =
        Number(marks);

    if (
        Number.isNaN(numericMarks) ||
        numericMarks < 0 ||
        numericMarks > 100
    ) {
        return "";
    }

    if (numericMarks >= 85) {
        return "A+";
    }

    if (numericMarks >= 75) {
        return "A";
    }

    if (numericMarks >= 65) {
        return "B";
    }

    if (numericMarks >= 55) {
        return "C";
    }

    if (numericMarks >= 45) {
        return "D";
    }

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
   MESSAGES
------------------------------------------------------ */

function flashMessage(
    text,
    type = "success"
) {
    const iconClass =
        type === "success"
            ? "bi-check-circle-fill"
            : "bi-exclamation-triangle-fill";

    resultPageMessage.innerHTML = `
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
        const alertElement =
            resultPageMessage.querySelector(
                ".alert"
            );

        if (alertElement) {
            bootstrap.Alert
                .getOrCreateInstance(
                    alertElement
                )
                .close();
        }
    }, 5000);
}

function showFormMessage(
    text,
    type = "danger"
) {
    resultFormMessage.innerHTML = `
        <div class="alert alert-${type}">
            ${escapeHTML(text)}
        </div>
    `;
}


/* ------------------------------------------------------
   LOADING STATES
------------------------------------------------------ */

function showTableLoading() {
    resultTableBody.innerHTML = `
        <tr>
            <td
                colspan="7"
                class="text-center py-5"
            >
                <span
                    class="spinner-border spinner-border-sm me-2"
                ></span>

                Loading results...
            </td>
        </tr>
    `;
}

function setSaveLoading(loading) {
    saveResultButton.disabled =
        loading;

    saveResultSpinner.classList.toggle(
        "d-none",
        !loading
    );

    saveResultButtonText.textContent =
        loading
            ? "Saving..."
            : resultIdInput.value
                ? "Update Result"
                : "Save Result";
}

function setDeleteLoading(loading) {
    confirmDeleteResultButton.disabled =
        loading;

    confirmDeleteResultButton.textContent =
        loading
            ? "Deleting..."
            : "Delete Result";
}


/* ------------------------------------------------------
   LOAD BACKEND DATA
------------------------------------------------------ */

async function loadResultPageData() {
    showTableLoading();

    try {
        const [
            studentResponse,
            courseResponse,
            examinationResponse,
            resultResponse
        ] = await Promise.all([
            apiRequest("/students"),
            apiRequest("/courses"),
            apiRequest("/examinations"),
            apiRequest("/results")
        ]);

        students =
            Array.isArray(studentResponse.data)
                ? studentResponse.data
                : [];

        courses =
            Array.isArray(courseResponse.data)
                ? courseResponse.data
                : [];

        examinations =
            Array.isArray(examinationResponse.data)
                ? examinationResponse.data
                : [];

        results =
            Array.isArray(resultResponse.data)
                ? resultResponse.data
                : [];

        populateDropdowns();
        displayResults();

    } catch (error) {
        console.error(
            "Unable to load Results page:",
            error
        );

        students = [];
        courses = [];
        examinations = [];
        results = [];

        populateDropdowns();
        displayResults();

        flashMessage(
            error.message,
            "danger"
        );
    }
}

async function reloadResults() {
    const response =
        await apiRequest("/results");

    results =
        Array.isArray(response.data)
            ? response.data
            : [];

    displayResults();
}


/* ------------------------------------------------------
   DROPDOWNS
------------------------------------------------------ */

function populateDropdowns() {
    resultStudentSelect.innerHTML = `
        <option value="">
            Select Student
        </option>
    `;

    students.forEach(student => {
        const option =
            document.createElement("option");

        option.value =
            getStudentId(student);

        option.textContent =
            `${getStudentName(student)} (${getRegistrationNumber(student)})`;

        resultStudentSelect.appendChild(
            option
        );
    });

    resultCourseSelect.innerHTML = `
        <option value="">
            Select Course
        </option>
    `;

    courseFilterSelect.innerHTML = `
        <option value="">
            All Courses
        </option>
    `;

    courses.forEach(course => {
        const courseId =
            getCourseId(course);

        const courseText =
            `${getCourseCode(course)} - ${getCourseName(course)}`;

        const formOption =
            document.createElement("option");

        formOption.value =
            courseId;

        formOption.textContent =
            courseText;

        resultCourseSelect.appendChild(
            formOption
        );

        const filterOption =
            document.createElement("option");

        filterOption.value =
            courseId;

        filterOption.textContent =
            getCourseName(course);

        courseFilterSelect.appendChild(
            filterOption
        );
    });
}

function handleCourseSelection() {
    const courseId =
        Number(
            resultCourseSelect.value
        );

    resultExaminationSelect.innerHTML = `
        <option value="">
            Select Examination
        </option>
    `;

    if (!courseId) {
        resultExaminationSelect.disabled =
            true;

        resultExaminationSelect.innerHTML = `
            <option value="">
                Select a course first
            </option>
        `;

        return;
    }

    const matchingExaminations =
        examinations.filter(
            exam =>
                getExamCourseId(exam) ===
                courseId
        );

    if (
        matchingExaminations.length === 0
    ) {
        resultExaminationSelect.disabled =
            true;

        resultExaminationSelect.innerHTML = `
            <option value="">
                No examinations for this course
            </option>
        `;

        return;
    }

    matchingExaminations.forEach(exam => {
        const option =
            document.createElement("option");

        option.value =
            getExamId(exam);

        option.textContent =
            getExamName(exam);

        resultExaminationSelect.appendChild(
            option
        );
    });

    resultExaminationSelect.disabled =
        false;
}


/* ------------------------------------------------------
   SUMMARY CARDS
------------------------------------------------------ */

function updateSummaryCards() {
    totalResultsValue.textContent =
        results.length;

    if (results.length === 0) {
        classAverageValue.textContent =
            "0%";

        passRateValue.textContent =
            "0%";

        topPerformerValue.textContent =
            "N/A";

        topPerformerValue.title =
            "";

        return;
    }

    const totalMarks =
        results.reduce(
            (total, result) =>
                total +
                getResultMarks(result),
            0
        );

    const average =
        Math.round(
            totalMarks /
            results.length
        );

    classAverageValue.textContent =
        `${average}%`;

    const passingResults =
        results.filter(
            result =>
                getResultMarks(result) >=
                45
        ).length;

    const passRate =
        Math.round(
            passingResults /
            results.length *
            100
        );

    passRateValue.textContent =
        `${passRate}%`;

    const topResult =
        [...results].sort(
            (first, second) =>
                getResultMarks(second) -
                getResultMarks(first)
        )[0];

    const studentName =
        topResult.FullName ||
        getStudentName(
            students.find(
                student =>
                    getStudentId(student) ===
                    getResultStudentId(topResult)
            )
        ) ||
        "Student";

    topPerformerValue.textContent =
        `${getResultMarks(topResult)}% (${studentName})`;

    topPerformerValue.title =
        `${studentName} - ${getResultMarks(topResult)}%`;
}


/* ------------------------------------------------------
   DISPLAY RESULTS
------------------------------------------------------ */

function displayResults() {
    const searchValue =
        resultSearchInput.value
            .trim()
            .toLowerCase();

    const selectedCourseId =
        courseFilterSelect.value;

    const selectedGrade =
        gradeFilterSelect.value;

    const filteredResults =
        results.filter(result => {
            const studentId =
                getResultStudentId(result);

            const examinationId =
                getResultExamId(result);

            const student =
                students.find(
                    item =>
                        getStudentId(item) ===
                        studentId
                );

            const exam =
                examinations.find(
                    item =>
                        getExamId(item) ===
                        examinationId
                );

            const resultCourseId =
                Number(
                    result.CourseID ??
                    getExamCourseId(exam)
                );

            const studentName =
                String(
                    result.FullName ||
                    getStudentName(student)
                ).toLowerCase();

            const registrationNumber =
                String(
                    result.RegistrationNumber ||
                    getRegistrationNumber(student)
                ).toLowerCase();

            const courseName =
                String(
                    result.CourseName ||
                    getCourseName(
                        courses.find(
                            course =>
                                getCourseId(course) ===
                                resultCourseId
                        )
                    )
                ).toLowerCase();

            const examinationName =
                String(
                    result.ExaminationName ||
                    getExamName(exam)
                ).toLowerCase();

            const matchesSearch =
                studentName.includes(
                    searchValue
                ) ||
                registrationNumber.includes(
                    searchValue
                ) ||
                courseName.includes(
                    searchValue
                ) ||
                examinationName.includes(
                    searchValue
                );

            const matchesCourse =
                selectedCourseId === "" ||
                String(resultCourseId) ===
                String(selectedCourseId);

            const matchesGrade =
                selectedGrade === "" ||
                getResultGrade(result) ===
                selectedGrade;

            return (
                matchesSearch &&
                matchesCourse &&
                matchesGrade
            );
        });

    resultTableBody.innerHTML = "";

    if (filteredResults.length === 0) {
        resultTableBody.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="result-empty-state">
                        <div class="result-empty-icon">
                            <i class="bi bi-bar-chart"></i>
                        </div>

                        <h4>No results found</h4>

                        <p>
                            Try changing the search or filter.
                        </p>
                    </div>
                </td>
            </tr>
        `;

        resultRecordCount.textContent =
            "Showing 0 results";

        updateSummaryCards();

        return;
    }

    filteredResults.forEach(result => {
        const resultId =
            getResultId(result);

        const studentId =
            getResultStudentId(result);

        const examinationId =
            getResultExamId(result);

        const student =
            students.find(
                item =>
                    getStudentId(item) ===
                    studentId
            );

        const exam =
            examinations.find(
                item =>
                    getExamId(item) ===
                    examinationId
            );

        const courseId =
            Number(
                result.CourseID ??
                getExamCourseId(exam)
            );

        const course =
            courses.find(
                item =>
                    getCourseId(item) ===
                    courseId
            );

        const studentName =
            result.FullName ||
            getStudentName(student) ||
            "Unknown Student";

        const registrationNumber =
            result.RegistrationNumber ||
            getRegistrationNumber(student) ||
            "N/A";

        const courseName =
            result.CourseName ||
            getCourseName(course) ||
            "Unknown Course";

        const courseCode =
            result.CourseCode ||
            getCourseCode(course) ||
            "N/A";

        const examinationName =
            result.ExaminationName ||
            getExamName(exam) ||
            "Unknown Examination";

        const marks =
            getResultMarks(result);

        const grade =
            getResultGrade(result);

        const row =
            document.createElement("tr");

        row.innerHTML = `
            <td>
                <span class="student-id-badge">
                    ${resultId}
                </span>
            </td>

            <td>
                <div
                    class="student-name-details"
                    style="
                        display: flex;
                        flex-direction: column;
                    "
                >
                    <strong>
                        ${escapeHTML(studentName)}
                    </strong>

                    <span
                        class="text-muted"
                        style="font-size: 12px;"
                    >
                        ${escapeHTML(registrationNumber)}
                    </span>
                </div>
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
                        ${escapeHTML(courseName)}
                    </strong>

                    <span
                        class="text-muted"
                        style="font-size: 12px;"
                    >
                        ${escapeHTML(courseCode)}
                    </span>
                </div>
            </td>

            <td>
                ${escapeHTML(examinationName)}
            </td>

            <td>
                <span class="marks-badge">
                    ${marks}
                </span>
            </td>

            <td>
                <span
                    class="grade-badge ${getGradeBadgeClass(grade)}"
                >
                    ${escapeHTML(grade)}
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
                        data-result-id="${resultId}"
                        aria-label="Edit result"
                    >
                        <i class="bi bi-pencil-fill"></i>
                    </button>

                    <button
                        type="button"
                        class="btn remove-enrollment-button"
                        data-action="delete"
                        data-result-id="${resultId}"
                        aria-label="Delete result"
                    >
                        <i class="bi bi-trash3-fill"></i>
                    </button>
                </div>
            </td>
        `;

        resultTableBody.appendChild(
            row
        );
    });

    resultRecordCount.textContent =
        `Showing ${filteredResults.length} of ${results.length} results`;

    updateSummaryCards();
}


/* ------------------------------------------------------
   FORM VALIDATION
------------------------------------------------------ */

function clearErrors() {
    resultStudentError.textContent =
        "";

    resultCourseError.textContent =
        "";

    resultExaminationError.textContent =
        "";

    resultMarksError.textContent =
        "";

    resultFormMessage.innerHTML =
        "";
}

function validateResultForm() {
    let valid = true;

    clearErrors();

    if (!resultStudentSelect.value) {
        resultStudentError.textContent =
            "Please select a student.";

        valid = false;
    }

    if (!resultCourseSelect.value) {
        resultCourseError.textContent =
            "Please select a course.";

        valid = false;
    }

    if (!resultExaminationSelect.value) {
        resultExaminationError.textContent =
            "Please select an examination.";

        valid = false;
    }

    const marks =
        Number(
            resultMarksInput.value
        );

    if (resultMarksInput.value === "") {
        resultMarksError.textContent =
            "Marks field is required.";

        valid = false;

    } else if (
        Number.isNaN(marks) ||
        marks < 0 ||
        marks > 100
    ) {
        resultMarksError.textContent =
            "Marks must be between 0 and 100.";

        valid = false;
    }

    return valid;
}


/* ------------------------------------------------------
   PREPARE ADD RESULT
------------------------------------------------------ */

function prepareAddResult() {
    resultForm.reset();
    clearErrors();

    resultIdInput.value =
        "";

    resultModalTitle.textContent =
        "Add Result";

    saveResultButtonText.textContent =
        "Save Result";

    resultStudentSelect.disabled =
        false;

    resultCourseSelect.disabled =
        false;

    resultExaminationSelect.disabled =
        true;

    resultExaminationSelect.innerHTML = `
        <option value="">
            Select a course first
        </option>
    `;

    resultGradeInput.value =
        "";
}


/* ------------------------------------------------------
   EDIT RESULT
------------------------------------------------------ */

function editResult(id) {
    const result =
        results.find(
            item =>
                getResultId(item) ===
                Number(id)
        );

    if (!result) {
        flashMessage(
            "Result was not found.",
            "danger"
        );

        return;
    }

    clearErrors();
    resultForm.reset();

    const examination =
        examinations.find(
            exam =>
                getExamId(exam) ===
                getResultExamId(result)
        );

    const courseId =
        Number(
            result.CourseID ??
            getExamCourseId(examination)
        );

    resultIdInput.value =
        getResultId(result);

    resultStudentSelect.value =
        getResultStudentId(result);

    resultCourseSelect.value =
        courseId;

    handleCourseSelection();

    resultExaminationSelect.value =
        getResultExamId(result);

    resultMarksInput.value =
        getResultMarks(result);

    resultGradeInput.value =
        getResultGrade(result);

    resultModalTitle.textContent =
        "Edit Result";

    saveResultButtonText.textContent =
        "Update Result";

    /*
    Keep student and course fixed during editing.
    */

    resultStudentSelect.disabled =
        true;

    resultCourseSelect.disabled =
        true;

    resultModal.show();
}


/* ------------------------------------------------------
   SAVE RESULT
------------------------------------------------------ */

async function saveResult(event) {
    event.preventDefault();

    if (!validateResultForm()) {
        return;
    }

    const resultId =
        resultIdInput.value
            ? Number(resultIdInput.value)
            : null;

    const payload = {
        examinationId:
            Number(
                resultExaminationSelect.value
            ),

        studentId:
            Number(
                resultStudentSelect.value
            ),

        marks:
            Number(
                resultMarksInput.value
            )
    };

    const duplicate =
        results.some(result => {
            return (
                getResultStudentId(result) ===
                payload.studentId &&

                getResultExamId(result) ===
                payload.examinationId &&

                getResultId(result) !==
                resultId
            );
        });

    if (duplicate) {
        showFormMessage(
            "A result already exists for this student and examination."
        );

        return;
    }

    setSaveLoading(true);

    try {
        if (resultId) {
            await apiRequest(
                `/results/${resultId}`,
                {
                    method: "PUT",
                    body: JSON.stringify(
                        payload
                    )
                }
            );
        } else {
            await apiRequest(
                "/results",
                {
                    method: "POST",
                    body: JSON.stringify(
                        payload
                    )
                }
            );
        }

        resultModal.hide();

        await reloadResults();

        flashMessage(
            resultId
                ? "Result updated successfully."
                : "Result created successfully.",
            "success"
        );

    } catch (error) {
        console.error(
            "Unable to save result:",
            error
        );

        showFormMessage(
            error.message
        );

    } finally {
        setSaveLoading(false);
    }
}


/* ------------------------------------------------------
   DELETE RESULT
------------------------------------------------------ */

function openDeleteModal(id) {
    deleteResultIdInput.value =
        id;

    deleteResultModal.show();
}

async function deleteResult() {
    const resultId =
        Number(
            deleteResultIdInput.value
        );

    if (!resultId) {
        return;
    }

    setDeleteLoading(true);

    try {
        await apiRequest(
            `/results/${resultId}`,
            {
                method: "DELETE"
            }
        );

        deleteResultModal.hide();

        await reloadResults();

        flashMessage(
            "Result deleted successfully.",
            "success"
        );

    } catch (error) {
        console.error(
            "Unable to delete result:",
            error
        );

        deleteResultModal.hide();

        flashMessage(
            error.message,
            "danger"
        );

    } finally {
        setDeleteLoading(false);
    }
}


/* ------------------------------------------------------
   TABLE BUTTON ACTION
------------------------------------------------------ */

function handleTableAction(event) {
    const button =
        event.target.closest(
            "button[data-action]"
        );

    if (!button) {
        return;
    }

    const resultId =
        Number(
            button.dataset.resultId
        );

    if (
        button.dataset.action ===
        "edit"
    ) {
        editResult(resultId);
    }

    if (
        button.dataset.action ===
        "delete"
    ) {
        openDeleteModal(resultId);
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

openAddResultButton?.addEventListener(
    "click",
    prepareAddResult
);

resultCourseSelect.addEventListener(
    "change",
    handleCourseSelection
);

resultMarksInput.addEventListener(
    "input",
    () => {
        resultGradeInput.value =
            calculateGrade(
                resultMarksInput.value
            ) || "N/A";
    }
);

resultForm.addEventListener(
    "submit",
    saveResult
);

confirmDeleteResultButton.addEventListener(
    "click",
    deleteResult
);

resultTableBody.addEventListener(
    "click",
    handleTableAction
);

resultSearchInput.addEventListener(
    "input",
    displayResults
);

courseFilterSelect.addEventListener(
    "change",
    displayResults
);

gradeFilterSelect.addEventListener(
    "change",
    displayResults
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
        loadResultPageData();
    }
);