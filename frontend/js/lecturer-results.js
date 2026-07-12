"use strict";

/*
 * University ERP - Lecturer Results Page
 *
 * Responsibilities:
 * - Load examinations
 * - Load students registered for the selected examination course
 * - Enter marks
 * - Calculate grades
 * - Save new results
 * - Update existing results
 * - Display searchable saved results
 */

document.addEventListener(
    "DOMContentLoaded",
    initializeLecturerResultsPage
);

let resultCourses = [];
let resultStudents = [];
let resultExaminations = [];
let savedResults = [];

let selectedResultExamination = null;
let selectedResultCourse = null;
let selectedResultStudents = [];

/* =========================================================
   Page initialization
========================================================= */

async function initializeLecturerResultsPage() {
    const hasAccess = protectLecturerPage();

    if (!hasAccess) {
        return;
    }

    initializeResultsPageEvents();

    try {
        prepareMockLecturerSession();

        resultCourses = await loadResultCourses();
        resultStudents = await loadResultStudents();
        resultExaminations = await loadResultExaminations();
        savedResults = await loadSavedResults();

        populateExaminationSelect(resultExaminations);

        displayExistingResults(savedResults);
        updateSavedResultCount(savedResults.length);
    } catch (error) {
        console.error(
            "Unable to initialize Results page:",
            error
        );

        showMessage(
            error.message ||
            "The Results page could not be loaded.",
            "error",
            0
        );
    }
}

/* =========================================================
   Load data
========================================================= */

async function loadResultCourses() {
    if (LECTURER_CONFIG.USE_MOCK_DATA === true) {
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

    return normalizeResultArrayResponse(
        response,
        "courses"
    );
}

async function loadResultStudents() {
    if (LECTURER_CONFIG.USE_MOCK_DATA === true) {
        return getLocalStorageData(
            LECTURER_CONFIG.STORAGE_KEYS.COURSE_STUDENTS,
            []
        );
    }

    /*
     * In real API mode, students will be loaded after
     * an examination is selected because the course ID
     * is required.
     */

    return [];
}

async function loadResultExaminations() {
    if (LECTURER_CONFIG.USE_MOCK_DATA === true) {
        return getLocalStorageData(
            LECTURER_CONFIG.STORAGE_KEYS.EXAMINATIONS,
            []
        );
    }

    /*
     * The current route agreement includes only:
     *
     * POST /api/lecturer/examinations
     *
     * A GET examinations route is also needed for this page.
     * Until it is added, localStorage is used.
     */

    return getLocalStorageData(
        LECTURER_CONFIG.STORAGE_KEYS.EXAMINATIONS,
        []
    );
}

async function loadSavedResults() {
    if (LECTURER_CONFIG.USE_MOCK_DATA === true) {
        return getLocalStorageData(
            LECTURER_CONFIG.STORAGE_KEYS.RESULTS,
            []
        );
    }

    /*
     * The current route agreement does not include a GET
     * results route. Existing results are temporarily loaded
     * from localStorage.
     */

    return getLocalStorageData(
        LECTURER_CONFIG.STORAGE_KEYS.RESULTS,
        []
    );
}

function normalizeResultArrayResponse(
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
   Event listeners
========================================================= */

function initializeResultsPageEvents() {
    const selectionForm = document.getElementById(
        "resultSelectionForm"
    );

    const resultsForm = document.getElementById(
        "resultsForm"
    );

    const clearMarksButton = document.getElementById(
        "clearMarksButton"
    );

    const cancelButton = document.getElementById(
        "cancelResultEntryButton"
    );

    const searchInput = document.getElementById(
        "resultSearchInput"
    );

    if (selectionForm) {
        selectionForm.addEventListener(
            "submit",
            handleLoadResultStudents
        );
    }

    if (resultsForm) {
        resultsForm.addEventListener(
            "submit",
            handleSaveResults
        );
    }

    if (clearMarksButton) {
        clearMarksButton.addEventListener(
            "click",
            clearAllResultMarks
        );
    }

    if (cancelButton) {
        cancelButton.addEventListener(
            "click",
            cancelResultEntry
        );
    }

    if (searchInput) {
        searchInput.addEventListener(
            "input",
            handleResultSearch
        );
    }
}

/* =========================================================
   Examination dropdown
========================================================= */

function populateExaminationSelect(examinations) {
    const select = document.getElementById(
        "resultExaminationSelect"
    );

    if (!select) {
        return;
    }

    select.innerHTML = `
        <option value="">
            Select an examination
        </option>
    `;

    examinations.forEach((examination) => {
        const course = resultCourses.find(
            (item) =>
                Number(item.courseId) ===
                Number(examination.courseId)
        );

        const option = document.createElement("option");

        option.value = examination.examinationId;

        option.textContent =
            `${course?.courseCode || "Course"} - ` +
            `${examination.examName}`;

        select.appendChild(option);
    });
}

/* =========================================================
   Load examination students
========================================================= */

async function handleLoadResultStudents(event) {
    event.preventDefault();

    clearResultSelectionError();

    const examinationId = Number(
        document.getElementById(
            "resultExaminationSelect"
        )?.value
    );

    if (!examinationId) {
        showResultSelectionError(
            "Please select an examination."
        );

        return;
    }

    selectedResultExamination =
        resultExaminations.find(
            (examination) =>
                Number(examination.examinationId) ===
                examinationId
        );

    if (!selectedResultExamination) {
        showResultSelectionError(
            "The selected examination could not be found."
        );

        return;
    }

    selectedResultCourse = resultCourses.find(
        (course) =>
            Number(course.courseId) ===
            Number(selectedResultExamination.courseId)
    );

    if (!selectedResultCourse) {
        showResultSelectionError(
            "The selected examination course is not assigned to this lecturer."
        );

        return;
    }

    showLoading(
        "resultsLoading",
        "resultsMainContent"
    );

    try {
        selectedResultStudents =
            await loadStudentsForSelectedCourse(
                selectedResultCourse.courseId
            );

        displaySelectedExaminationInformation();

        displayResultEntryRows(
            selectedResultStudents
        );

        updateResultEntrySummary(
            selectedResultStudents.length
        );

        document.getElementById(
            "selectedExaminationSection"
        ).hidden = false;
    } catch (error) {
        console.error(
            "Unable to load result students:",
            error
        );

        showMessage(
            error.message ||
            "Registered students could not be loaded.",
            "error",
            0
        );
    } finally {
        hideLoading(
            "resultsLoading",
            "resultsMainContent"
        );
    }
}

async function loadStudentsForSelectedCourse(courseId) {
    if (LECTURER_CONFIG.USE_MOCK_DATA === true) {
        return resultStudents.filter((student) => {
            const courseIds = Array.isArray(
                student.courseIds
            )
                ? student.courseIds
                : [];

            return courseIds.some(
                (studentCourseId) =>
                    Number(studentCourseId) ===
                    Number(courseId)
            );
        });
    }

    if (
        typeof LecturerAPI === "undefined" ||
        typeof LecturerAPI.getCourseStudents !== "function"
    ) {
        throw new Error(
            "The Lecturer API service is not available."
        );
    }

    const response =
        await LecturerAPI.getCourseStudents(courseId);

    return normalizeResultArrayResponse(
        response,
        "students"
    );
}

/* =========================================================
   Selected examination information
========================================================= */

function displaySelectedExaminationInformation() {
    setElementText(
        "selectedExamName",
        selectedResultExamination.examName || "-"
    );

    setElementText(
        "selectedExamCourse",
        `${selectedResultCourse.courseCode} - ` +
        selectedResultCourse.courseName
    );

    setElementText(
        "selectedExamDate",
        formatLecturerDate(
            selectedResultExamination.examDate
        )
    );

    setElementText(
        "selectedExamTotalMarks",
        selectedResultExamination.totalMarks
    );
}

/* =========================================================
   Result entry table
========================================================= */

function displayResultEntryRows(students) {
    const tableBody = document.getElementById(
        "resultsStudentsTableBody"
    );

    if (!tableBody) {
        return;
    }

    if (!students.length) {
        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="5"
                    class="empty-table-message"
                >
                    No registered students were found for this course.
                </td>
            </tr>
        `;

        return;
    }

    tableBody.innerHTML = students
        .map((student) => {
            const existingResult = savedResults.find(
                (result) =>
                    Number(result.examinationId) ===
                    Number(
                        selectedResultExamination.examinationId
                    ) &&
                    Number(result.studentId) ===
                    Number(student.studentId)
            );

            const marks =
                existingResult?.marks ?? "";

            const grade =
                existingResult?.grade ?? "-";

            const statusText = existingResult
                ? "Existing"
                : "New";

            const statusClass = existingResult
                ? "result-status-existing"
                : "result-status-new";

            return `
                <tr data-student-id="${student.studentId}">
                    <td>
                        <strong>
                            ${escapeLecturerHtml(
                student.studentNumber || "-"
            )}
                        </strong>
                    </td>

                    <td>
                        ${escapeLecturerHtml(
                student.fullName || "-"
            )}
                    </td>

                    <td>
                        <label
                            class="visually-hidden"
                            for="resultMarks-${student.studentId}"
                        >
                            Marks for
                            ${escapeLecturerHtml(
                student.fullName
            )}
                        </label>

                        <input
                            type="number"
                            id="resultMarks-${student.studentId}"
                            class="result-marks-input"
                            data-student-id="${student.studentId}"
                            min="0"
                            max="${selectedResultExamination.totalMarks}"
                            step="0.01"
                            value="${marks}"
                            placeholder="0"
                        >
                    </td>

                    <td>
                        <span
                            id="resultGrade-${student.studentId}"
                            class="result-grade ${getGradeClass(
                grade
            )}"
                        >
                            ${escapeLecturerHtml(grade)}
                        </span>
                    </td>

                    <td>
                        <span
                            class="result-record-status ${statusClass}"
                        >
                            ${statusText}
                        </span>
                    </td>
                </tr>
            `;
        })
        .join("");

    initializeMarksInputEvents();
}

function initializeMarksInputEvents() {
    const markInputs = document.querySelectorAll(
        ".result-marks-input"
    );

    markInputs.forEach((input) => {
        input.addEventListener("input", () => {
            updateGradeForMarksInput(input);
        });
    });
}

function updateGradeForMarksInput(input) {
    const studentId = input.dataset.studentId;
    const gradeElement = document.getElementById(
        `resultGrade-${studentId}`
    );

    if (!gradeElement) {
        return;
    }

    const marksValue = input.value.trim();

    if (marksValue === "") {
        gradeElement.textContent = "-";
        gradeElement.className = "result-grade";
        input.classList.remove("invalid");
        return;
    }

    const marks = Number(marksValue);
    const totalMarks = Number(
        selectedResultExamination.totalMarks
    );

    if (
        Number.isNaN(marks) ||
        marks < 0 ||
        marks > totalMarks
    ) {
        gradeElement.textContent = "Invalid";
        gradeElement.className =
            "result-grade grade-f";

        input.classList.add("invalid");
        return;
    }

    const grade = calculateGrade(
        marks,
        totalMarks
    );

    gradeElement.textContent = grade;
    gradeElement.className =
        `result-grade ${getGradeClass(grade)}`;

    input.classList.remove("invalid");
}

/* =========================================================
   Save results
========================================================= */

async function handleSaveResults(event) {
    event.preventDefault();

    if (
        !selectedResultExamination ||
        !selectedResultCourse ||
        !selectedResultStudents.length
    ) {
        showMessage(
            "Please select an examination and load students first.",
            "error",
            4000
        );

        return;
    }

    const collectedResults =
        collectResultEntries();

    if (!collectedResults) {
        return;
    }

    const confirmed = window.confirm(
        `Save results for ${collectedResults.length} student${collectedResults.length === 1 ? "" : "s"
        }?`
    );

    if (!confirmed) {
        return;
    }

    const saveButton = document.getElementById(
        "saveResultsButton"
    );

    setResultsButtonLoading(
        saveButton,
        true
    );

    try {
        if (LECTURER_CONFIG.USE_MOCK_DATA === true) {
            saveMockResults(collectedResults);
        } else {
            await saveApiResults(collectedResults);
        }

        savedResults = await loadSavedResults();

        displayExistingResults(savedResults);
        updateSavedResultCount(savedResults.length);

        displayResultEntryRows(
            selectedResultStudents
        );

        showMessage(
            "Results saved successfully.",
            "success",
            4000
        );
    } catch (error) {
        console.error(
            "Unable to save results:",
            error
        );

        showMessage(
            error.message ||
            "Results could not be saved.",
            "error",
            0
        );
    } finally {
        setResultsButtonLoading(
            saveButton,
            false
        );
    }
}

function collectResultEntries() {
    const markInputs = Array.from(
        document.querySelectorAll(
            ".result-marks-input"
        )
    );

    if (!markInputs.length) {
        showMessage(
            "No students are available for result entry.",
            "error",
            4000
        );

        return null;
    }

    let hasInvalidMarks = false;
    let hasEmptyMarks = false;

    const results = markInputs.map((input) => {
        const marksText = input.value.trim();

        if (marksText === "") {
            input.classList.add("invalid");
            hasEmptyMarks = true;

            return null;
        }

        const marks = Number(marksText);
        const totalMarks = Number(
            selectedResultExamination.totalMarks
        );

        if (
            Number.isNaN(marks) ||
            marks < 0 ||
            marks > totalMarks
        ) {
            input.classList.add("invalid");
            hasInvalidMarks = true;

            return null;
        }

        input.classList.remove("invalid");

        return {
            examinationId:
                selectedResultExamination.examinationId,

            studentId: Number(
                input.dataset.studentId
            ),

            marks,

            grade: calculateGrade(
                marks,
                totalMarks
            )
        };
    });

    if (hasEmptyMarks) {
        showMessage(
            "Please enter marks for every student.",
            "error",
            4000
        );

        return null;
    }

    if (hasInvalidMarks) {
        showMessage(
            `Marks must be between 0 and ${selectedResultExamination.totalMarks
            }.`,
            "error",
            4000
        );

        return null;
    }

    return results.filter(Boolean);
}

/* =========================================================
   Mock save and update
========================================================= */

function saveMockResults(newResults) {
    const existingResults = getLocalStorageData(
        LECTURER_CONFIG.STORAGE_KEYS.RESULTS,
        []
    );

    let nextResultId =
        getNextResultId(existingResults);

    newResults.forEach((newResult) => {
        const existingIndex =
            existingResults.findIndex(
                (result) =>
                    Number(result.examinationId) ===
                    Number(
                        newResult.examinationId
                    ) &&
                    Number(result.studentId) ===
                    Number(newResult.studentId)
            );

        if (existingIndex >= 0) {
            existingResults[existingIndex] = {
                ...existingResults[existingIndex],
                marks: newResult.marks,
                grade: newResult.grade
            };
        } else {
            existingResults.push({
                resultId: nextResultId,
                ...newResult
            });

            nextResultId += 1;
        }
    });

    const saved = setLocalStorageData(
        LECTURER_CONFIG.STORAGE_KEYS.RESULTS,
        existingResults
    );

    if (!saved) {
        throw new Error(
            "Results could not be saved locally."
        );
    }
}

function getNextResultId(results) {
    if (!results.length) {
        return 1;
    }

    const highestId = Math.max(
        ...results.map((result) =>
            Number(result.resultId || 0)
        )
    );

    return highestId + 1;
}

/* =========================================================
   API save and update
========================================================= */

async function saveApiResults(results) {
    if (
        typeof LecturerAPI === "undefined"
    ) {
        throw new Error(
            "The Lecturer Results API is not available."
        );
    }

    for (const result of results) {
        const existingResult = savedResults.find(
            (savedResult) =>
                Number(savedResult.examinationId) ===
                Number(result.examinationId) &&
                Number(savedResult.studentId) ===
                Number(result.studentId)
        );

        if (existingResult) {
            if (
                typeof LecturerAPI.updateResult !==
                "function"
            ) {
                throw new Error(
                    "The Update Result API is not available."
                );
            }

            await LecturerAPI.updateResult(
                existingResult.resultId,
                {
                    examinationId:
                        result.examinationId,
                    studentId:
                        result.studentId,
                    marks:
                        result.marks,
                    grade:
                        result.grade
                }
            );
        } else {
            if (
                typeof LecturerAPI.createResult !==
                "function"
            ) {
                throw new Error(
                    "The Create Result API is not available."
                );
            }

            await LecturerAPI.createResult({
                examinationId:
                    result.examinationId,
                studentId:
                    result.studentId,
                marks:
                    result.marks,
                grade:
                    result.grade
            });
        }
    }
}

/* =========================================================
   Existing results table
========================================================= */

function displayExistingResults(results) {
    const tableBody = document.getElementById(
        "existingResultsTableBody"
    );

    if (!tableBody) {
        return;
    }

    if (!results.length) {
        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="5"
                    class="empty-table-message"
                >
                    No saved results are available.
                </td>
            </tr>
        `;

        return;
    }

    tableBody.innerHTML = results
        .map((result) => {
            const student = resultStudents.find(
                (item) =>
                    Number(item.studentId) ===
                    Number(result.studentId)
            );

            const examination =
                resultExaminations.find(
                    (item) =>
                        Number(item.examinationId) ===
                        Number(result.examinationId)
                );

            const course = resultCourses.find(
                (item) =>
                    Number(item.courseId) ===
                    Number(examination?.courseId)
            );

            return `
                <tr>
                    <td>
                        <strong>
                            ${escapeLecturerHtml(
                student?.fullName || "-"
            )}
                        </strong>

                        <div class="table-secondary-text">
                            ${escapeLecturerHtml(
                student?.studentNumber || ""
            )}
                        </div>
                    </td>

                    <td>
                        ${escapeLecturerHtml(
                course?.courseCode || "-"
            )}
                    </td>

                    <td>
                        ${escapeLecturerHtml(
                examination?.examName || "-"
            )}
                    </td>

                    <td>
                        ${escapeLecturerHtml(
                result.marks
            )}
                        /
                        ${escapeLecturerHtml(
                examination?.totalMarks || "-"
            )}
                    </td>

                    <td>
                        <span
                            class="result-grade ${getGradeClass(
                result.grade
            )}"
                        >
                            ${escapeLecturerHtml(
                result.grade
            )}
                        </span>
                    </td>
                </tr>
            `;
        })
        .join("");
}

/* =========================================================
   Search existing results
========================================================= */

function handleResultSearch(event) {
    const searchTerm = event.target.value
        .trim()
        .toLowerCase();

    if (!searchTerm) {
        displayExistingResults(savedResults);
        return;
    }

    const filteredResults = savedResults.filter(
        (result) => {
            const student = resultStudents.find(
                (item) =>
                    Number(item.studentId) ===
                    Number(result.studentId)
            );

            const examination =
                resultExaminations.find(
                    (item) =>
                        Number(item.examinationId) ===
                        Number(result.examinationId)
                );

            const course = resultCourses.find(
                (item) =>
                    Number(item.courseId) ===
                    Number(examination?.courseId)
            );

            const searchableText = [
                student?.fullName,
                student?.studentNumber,
                course?.courseCode,
                course?.courseName,
                examination?.examName,
                result.grade
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return searchableText.includes(
                searchTerm
            );
        }
    );

    displayExistingResults(filteredResults);
}

/* =========================================================
   Clear and cancel
========================================================= */

function clearAllResultMarks() {
    const inputs = document.querySelectorAll(
        ".result-marks-input"
    );

    inputs.forEach((input) => {
        input.value = "";
        input.classList.remove("invalid");

        updateGradeForMarksInput(input);
    });

    hideMessage();
}

function cancelResultEntry() {
    selectedResultExamination = null;
    selectedResultCourse = null;
    selectedResultStudents = [];

    const select = document.getElementById(
        "resultExaminationSelect"
    );

    if (select) {
        select.value = "";
    }

    document.getElementById(
        "selectedExaminationSection"
    ).hidden = true;

    document.getElementById(
        "resultsMainContent"
    ).hidden = true;

    clearResultSelectionError();
    hideMessage();
}

/* =========================================================
   Summary and count
========================================================= */

function updateResultEntrySummary(studentCount) {
    setElementText(
        "resultEntrySummary",
        `${studentCount} registered student${studentCount === 1 ? "" : "s"
        }`
    );
}

function updateSavedResultCount(count) {
    setElementText(
        "savedResultCount",
        count
    );
}

/* =========================================================
   Validation message
========================================================= */

function showResultSelectionError(message) {
    const select = document.getElementById(
        "resultExaminationSelect"
    );

    const errorElement = document.getElementById(
        "resultExaminationError"
    );

    if (select) {
        select.classList.add("invalid");
    }

    if (errorElement) {
        errorElement.textContent = message;
    }
}

function clearResultSelectionError() {
    const select = document.getElementById(
        "resultExaminationSelect"
    );

    if (select) {
        select.classList.remove("invalid");
    }

    setElementText(
        "resultExaminationError",
        ""
    );
}

/* =========================================================
   Grade CSS classes
========================================================= */

function getGradeClass(grade) {
    switch (String(grade).toUpperCase()) {
        case "A+":
            return "grade-a-plus";

        case "A":
            return "grade-a";

        case "B":
            return "grade-b";

        case "C":
            return "grade-c";

        case "D":
            return "grade-d";

        case "F":
            return "grade-f";

        default:
            return "";
    }
}

/* =========================================================
   Button loading
========================================================= */

function setResultsButtonLoading(
    button,
    isLoading
) {
    if (!button) {
        return;
    }

    button.disabled = isLoading;

    button.textContent = isLoading
        ? "Saving..."
        : "Save Results";
}