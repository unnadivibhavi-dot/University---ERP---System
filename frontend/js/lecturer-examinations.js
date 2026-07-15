"use strict";

/*
 * University ERP - Lecturer Examinations Page
 *
 * Responsibilities:
 * - Load assigned courses
 * - Validate examination form
 * - Create examinations
 * - Save examinations in localStorage during mock mode
 * - Display created examinations
 */

document.addEventListener(
    "DOMContentLoaded",
    initializeLecturerExaminationsPage
);

let lecturerExaminationCourses = [];
let lecturerExaminations = [];

/* =========================================================
   Page initialization
========================================================= */

async function initializeLecturerExaminationsPage() {
    const hasAccess = protectLecturerPage();

    if (!hasAccess) {
        return;
    }

    setMinimumExaminationDate();
    initializeExaminationPageEvents();
    configureTotalMarksInput();

    showLoading(
        "examinationsLoading",
        "examinationsMainContent"
    );

    try {
        lecturerExaminationCourses =
            await loadExaminationCourses();

        lecturerExaminations =
            await loadLecturerExaminations();

        populateExaminationCourseSelect(
            lecturerExaminationCourses
        );

        displayExaminations(
            lecturerExaminations
        );

        updateExaminationCount(
            lecturerExaminations.length
        );
    } catch (error) {
        console.error(
            "Unable to initialize Examinations page:",
            error
        );

        showMessage(
            error.message ||
            "The Examinations page could not be loaded.",
            "error",
            0
        );
    } finally {
        hideLoading(
            "examinationsLoading",
            "examinationsMainContent"
        );
    }
}

/* =========================================================
   Load assigned courses
========================================================= */

async function loadExaminationCourses() {
    if (LECTURER_CONFIG.USE_MOCK_DATA === true) {
        prepareMockLecturerSession();

        return getLocalStorageData(
            LECTURER_CONFIG.STORAGE_KEYS.LECTURER_COURSES,
            []
        );
    }

    if (
        typeof LecturerAPI === "undefined" ||
        typeof LecturerAPI.getCourses !== "function"
    ) {
        throw new Error(
            "The Lecturer API service is not available."
        );
    }

    const response = await LecturerAPI.getCourses();

    return normalizeExaminationArrayResponse(
        response,
        "courses"
    );
}

/* =========================================================
   Load examinations
========================================================= */

async function loadLecturerExaminations() {
    if (LECTURER_CONFIG.USE_MOCK_DATA === true) {
        return getLocalStorageData(
            LECTURER_CONFIG.STORAGE_KEYS.EXAMINATIONS,
            []
        );
    }

    if (
        typeof LecturerAPI === "undefined" ||
        typeof LecturerAPI.getExaminations !== "function"
    ) {
        throw new Error(
            "The Lecturer Examinations API is not available."
        );
    }

    const response =
        await LecturerAPI.getExaminations();

    return normalizeExaminationArrayResponse(
        response,
        "examinations"
    );
}

function normalizeExaminationArrayResponse(
    response,
    propertyName
) {
    if (Array.isArray(response)) {
        return response;
    }

    if (
        response &&
        Array.isArray(response[propertyName])
    ) {
        return response[propertyName];
    }

    if (
        response &&
        Array.isArray(response.data)
    ) {
        return response.data;
    }

    return [];
}

/* =========================================================
   Populate course dropdown
========================================================= */

function populateExaminationCourseSelect(courses) {
    const courseSelect = document.getElementById(
        "examinationCourseSelect"
    );

    if (!courseSelect) {
        return;
    }

    courseSelect.innerHTML = `
        <option value="">
            Select a course
        </option>
    `;

    courses.forEach((course) => {
        const option = document.createElement("option");

        option.value = course.courseId;

        option.textContent =
            `${course.courseCode} - ${course.courseName}`;

        courseSelect.appendChild(option);
    });
}

/* =========================================================
   Minimum examination date
========================================================= */

function setMinimumExaminationDate() {
    const examDateInput = document.getElementById(
        "examDateInput"
    );

    if (!examDateInput) {
        return;
    }

    const today = new Date();

    const year = today.getFullYear();
    const month = String(
        today.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        today.getDate()
    ).padStart(2, "0");

    examDateInput.min = `${year}-${month}-${day}`;
}

/* =========================================================
   Event listeners
========================================================= */

function initializeExaminationPageEvents() {
    const examinationForm = document.getElementById(
        "examinationForm"
    );

    const clearButton = document.getElementById(
        "clearExaminationFormButton"
    );

    if (examinationForm) {
        examinationForm.addEventListener(
            "submit",
            handleCreateExamination
        );
    }

    if (clearButton) {
        clearButton.addEventListener(
            "click",
            clearExaminationForm
        );
    }
}

/* =========================================================
   Create examination
========================================================= */

async function handleCreateExamination(event) {
    event.preventDefault();

    clearExaminationValidationErrors();

    const formData = getExaminationFormData();

    const isValid =
        validateExaminationForm(formData);

    if (!isValid) {
        return;
    }

    const selectedCourse =
        lecturerExaminationCourses.find(
            (course) =>
                Number(course.courseId) ===
                Number(formData.courseId)
        );

    if (!selectedCourse) {
        showMessage(
            "The selected course is not assigned to this lecturer.",
            "error",
            4000
        );

        return;
    }

    const confirmed = window.confirm(
        `Create "${formData.examName}" for ${selectedCourse.courseCode}?`
    );

    if (!confirmed) {
        return;
    }

    const createButton = document.getElementById(
        "createExaminationButton"
    );

    setExaminationButtonLoading(
        createButton,
        true
    );

    try {
        let createdExamination;

        if (LECTURER_CONFIG.USE_MOCK_DATA === true) {
            createdExamination =
                saveMockExamination(formData);
        } else {
            createdExamination =
                await saveApiExamination(formData);
        }

        lecturerExaminations = [
            ...lecturerExaminations,
            createdExamination
        ];

        displayExaminations(
            lecturerExaminations
        );

        updateExaminationCount(
            lecturerExaminations.length
        );

        clearExaminationForm();

        showMessage(
            "Examination created successfully.",
            "success",
            4000
        );
    } catch (error) {
        console.error(
            "Unable to create examination:",
            error
        );

        showMessage(
            error.message ||
            "The examination could not be created.",
            "error",
            0
        );
    } finally {
        setExaminationButtonLoading(
            createButton,
            false
        );
    }
}

/* =========================================================
   Read form values
========================================================= */

function getExaminationFormData() {
    const courseIdValue = document.getElementById(
        "examinationCourseSelect"
    )?.value;

    const examNameValue = document.getElementById(
        "examNameInput"
    )?.value;

    const examDateValue = document.getElementById(
        "examDateInput"
    )?.value;

    const totalMarksValue = document.getElementById(
        "totalMarksInput"
    )?.value;

    return {
        courseId: Number(courseIdValue),
        examName: String(
            examNameValue || ""
        ).trim(),
        examDate: String(
            examDateValue || ""
        ),
        totalMarks: Number(totalMarksValue)
    };
}

/* =========================================================
   Form validation
========================================================= */

function validateExaminationForm(formData) {
    let isValid = true;

    const courseSelect = document.getElementById(
        "examinationCourseSelect"
    );

    const examNameInput = document.getElementById(
        "examNameInput"
    );

    const examDateInput = document.getElementById(
        "examDateInput"
    );

    const totalMarksInput = document.getElementById(
        "totalMarksInput"
    );

    const validCourse = lecturerExaminationCourses.some(
        (course) =>
            Number(course.courseId) ===
            Number(formData.courseId)
    );

    if (!formData.courseId || !validCourse) {
        showExaminationFieldError(
            courseSelect,
            "examinationCourseError",
            "Please select an assigned course."
        );

        isValid = false;
    }

    if (!formData.examName) {
        showExaminationFieldError(
            examNameInput,
            "examNameError",
            "Please enter the examination name."
        );

        isValid = false;
    } else if (formData.examName.length < 3) {
        showExaminationFieldError(
            examNameInput,
            "examNameError",
            "The examination name must contain at least 3 characters."
        );

        isValid = false;
    } else if (formData.examName.length > 100) {
        showExaminationFieldError(
            examNameInput,
            "examNameError",
            "The examination name cannot exceed 100 characters."
        );

        isValid = false;
    }

    if (!formData.examDate) {
        showExaminationFieldError(
            examDateInput,
            "examDateError",
            "Please select the examination date."
        );

        isValid = false;
    } else {
        const selectedDate = new Date(
            `${formData.examDate}T00:00:00`
        );

        const today = new Date();

        today.setHours(0, 0, 0, 0);

        if (
            Number.isNaN(selectedDate.getTime()) ||
            selectedDate < today
        ) {
            showExaminationFieldError(
                examDateInput,
                "examDateError",
                "The examination date cannot be in the past."
            );

            isValid = false;
        }
    }

    if (
        Number.isNaN(formData.totalMarks) ||
        formData.totalMarks <= 0
    ) {
        showExaminationFieldError(
            totalMarksInput,
            "totalMarksError",
            "Total marks must be greater than zero."
        );

        isValid = false;
    } else if (
        !Number.isInteger(formData.totalMarks)
    ) {
        showExaminationFieldError(
            totalMarksInput,
            "totalMarksError",
            "Total marks must be a whole number."
        );

        isValid = false;
    } else if (formData.totalMarks > 1000) {
        showExaminationFieldError(
            totalMarksInput,
            "totalMarksError",
            "Total marks cannot exceed 1000."
        );

        isValid = false;
    }

    return isValid;
}

function showExaminationFieldError(
    fieldElement,
    errorElementId,
    message
) {
    const errorElement = document.getElementById(
        errorElementId
    );

    if (fieldElement) {
        fieldElement.classList.add("invalid");
    }

    if (errorElement) {
        errorElement.textContent = message;
    }
}

function clearExaminationValidationErrors() {
    const fieldIds = [
        "examinationCourseSelect",
        "examNameInput",
        "examDateInput",
        "totalMarksInput"
    ];

    const errorIds = [
        "examinationCourseError",
        "examNameError",
        "examDateError",
        "totalMarksError"
    ];

    fieldIds.forEach((fieldId) => {
        document
            .getElementById(fieldId)
            ?.classList.remove("invalid");
    });

    errorIds.forEach((errorId) => {
        setElementText(errorId, "");
    });
}

/* =========================================================
   Mock save
========================================================= */

function saveMockExamination(formData) {
    const existingExaminations =
        getLocalStorageData(
            LECTURER_CONFIG.STORAGE_KEYS.EXAMINATIONS,
            []
        );

    const duplicateExists =
        existingExaminations.some(
            (examination) =>
                Number(examination.courseId) ===
                Number(formData.courseId) &&
                examination.examName
                    .trim()
                    .toLowerCase() ===
                formData.examName
                    .trim()
                    .toLowerCase() &&
                examination.examDate ===
                formData.examDate
        );

    if (duplicateExists) {
        throw new Error(
            "An examination with the same course, name, and date already exists."
        );
    }

    const newExamination = {
        examinationId:
            getNextExaminationId(
                existingExaminations
            ),

        courseId: formData.courseId,
        examName: formData.examName,
        examDate: formData.examDate,
        totalMarks: formData.totalMarks
    };

    existingExaminations.push(
        newExamination
    );

    const saved = setLocalStorageData(
        LECTURER_CONFIG.STORAGE_KEYS.EXAMINATIONS,
        existingExaminations
    );

    if (!saved) {
        throw new Error(
            "The examination could not be saved locally."
        );
    }

    return newExamination;
}

function getNextExaminationId(examinations) {
    if (
        !Array.isArray(examinations) ||
        examinations.length === 0
    ) {
        return 1;
    }

    const highestId = Math.max(
        ...examinations.map((examination) =>
            Number(
                examination.examinationId || 0
            )
        )
    );

    return highestId + 1;
}

/* =========================================================
   API save
========================================================= */

async function saveApiExamination(formData) {
    if (
        typeof LecturerAPI === "undefined" ||
        typeof LecturerAPI.createExamination !== "function"
    ) {
        throw new Error(
            "The Lecturer Examination API is not available."
        );
    }

    const response =
        await LecturerAPI.createExamination(
            formData
        );

    if (
        response &&
        response.data
    ) {
        return response.data;
    }

    return response;
}

/* =========================================================
   Display examinations
========================================================= */

function displayExaminations(examinations) {
    const tableBody = document.getElementById(
        "examinationsTableBody"
    );

    if (!tableBody) {
        return;
    }

    if (
        !Array.isArray(examinations) ||
        examinations.length === 0
    ) {
        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="4"
                    class="empty-table-message"
                >
                    No examinations are available.
                </td>
            </tr>
        `;

        return;
    }

    const sortedExaminations = [
        ...examinations
    ].sort((first, second) => {
        return (
            new Date(first.examDate) -
            new Date(second.examDate)
        );
    });

    tableBody.innerHTML = sortedExaminations
        .map((examination) => {
            const course =
                lecturerExaminationCourses.find(
                    (item) =>
                        Number(item.courseId) ===
                        Number(examination.courseId)
                );

            return `
                <tr>
                    <td>
                        <strong>
                            ${escapeLecturerHtml(
                course?.courseCode || "-"
            )}
                        </strong>

                        <div class="table-secondary-text">
                            ${escapeLecturerHtml(
                course?.courseName || ""
            )}
                        </div>
                    </td>

                    <td>
                        ${escapeLecturerHtml(
                examination.examName || "-"
            )}
                    </td>

                    <td>
                        ${formatLecturerDate(
                examination.examDate
            )}
                    </td>

                    <td>
                        ${escapeLecturerHtml(
                examination.totalMarks ?? 0
            )}
                    </td>
                </tr>
            `;
        })
        .join("");
}

/* =========================================================
   Examination count
========================================================= */

function updateExaminationCount(count) {
    setElementText(
        "examinationCount",
        count
    );
}

function configureTotalMarksInput() {
    const totalMarksInput = document.getElementById(
        "totalMarksInput"
    );

    if (!totalMarksInput) {
        return;
    }

    totalMarksInput.value = "100";

    if (LECTURER_CONFIG.USE_MOCK_DATA === true) {
        totalMarksInput.readOnly = false;
        totalMarksInput.removeAttribute("aria-readonly");
        totalMarksInput.title = "";

        return;
    }

    totalMarksInput.readOnly = true;
    totalMarksInput.setAttribute(
        "aria-readonly",
        "true"
    );
    totalMarksInput.title =
        "The current backend uses 100 total marks.";
}

/* =========================================================
   Clear form
========================================================= */

function clearExaminationForm() {
    const examinationForm = document.getElementById(
        "examinationForm"
    );

    if (examinationForm) {
        examinationForm.reset();
    }

    clearExaminationValidationErrors();
    setMinimumExaminationDate();
    configureTotalMarksInput();
}

/* =========================================================
   Button loading state
========================================================= */

function setExaminationButtonLoading(
    button,
    isLoading
) {
    if (!button) {
        return;
    }

    button.disabled = isLoading;

    button.textContent = isLoading
        ? "Creating..."
        : "Create Examination";
}