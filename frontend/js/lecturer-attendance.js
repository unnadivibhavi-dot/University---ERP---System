"use strict";

/*
 * University ERP - Lecturer Attendance Page
 *
 * Responsibilities:
 * - Load assigned courses
 * - Read optional courseId from URL
 * - Load registered students
 * - Mark Present, Absent, or Late
 * - Save attendance in localStorage while mock mode is enabled
 * - Display recent attendance records
 */

document.addEventListener(
    "DOMContentLoaded",
    initializeLecturerAttendancePage
);

let attendanceCourses = [];
let attendanceStudents = [];
let selectedAttendanceCourse = null;

/* =========================================================
   Page initialization
========================================================= */

async function initializeLecturerAttendancePage() {
    const hasAccess = protectLecturerPage();

    if (!hasAccess) {
        return;
    }

    setDefaultAttendanceDate();

    try {
        attendanceCourses = await loadAttendanceCourses();

        populateAttendanceCourseSelect(attendanceCourses);

        initializeAttendancePageEvents();

        selectCourseFromUrl();

        displayRecentAttendanceRecords();
    } catch (error) {
        console.error(
            "Unable to initialize Attendance page:",
            error
        );

        showMessage(
            error.message ||
            "The Attendance page could not be loaded.",
            "error",
            0
        );
    }
}

/* =========================================================
   Load assigned courses
========================================================= */

async function loadAttendanceCourses() {
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

    return normalizeAttendanceArrayResponse(
        response,
        "courses"
    );
}

function normalizeAttendanceArrayResponse(
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
   Course select
========================================================= */

function populateAttendanceCourseSelect(courses) {
    const courseSelect = document.getElementById(
        "attendanceCourseSelect"
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

function selectCourseFromUrl() {
    const courseIdValue = getUrlParameter("courseId");

    if (!courseIdValue) {
        return;
    }

    const courseSelect = document.getElementById(
        "attendanceCourseSelect"
    );

    if (!courseSelect) {
        return;
    }

    const courseExists = attendanceCourses.some(
        (course) =>
            Number(course.courseId) === Number(courseIdValue)
    );

    if (!courseExists) {
        showMessage(
            "The selected course is not assigned to this lecturer.",
            "error",
            5000
        );

        return;
    }

    courseSelect.value = String(courseIdValue);
}

/* =========================================================
   Date
========================================================= */

function setDefaultAttendanceDate() {
    const dateInput = document.getElementById(
        "attendanceDateInput"
    );

    if (!dateInput) {
        return;
    }

    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(
        2,
        "0"
    );
    const day = String(today.getDate()).padStart(2, "0");

    const formattedDate = `${year}-${month}-${day}`;

    dateInput.value = formattedDate;
    dateInput.max = formattedDate;
}

/* =========================================================
   Event listeners
========================================================= */

function initializeAttendancePageEvents() {
    const selectionForm = document.getElementById(
        "attendanceSelectionForm"
    );

    const attendanceForm = document.getElementById(
        "attendanceForm"
    );

    const markAllButton = document.getElementById(
        "markAllPresentButton"
    );

    const clearButton = document.getElementById(
        "clearAttendanceButton"
    );

    if (selectionForm) {
        selectionForm.addEventListener(
            "submit",
            handleLoadAttendanceStudents
        );
    }

    if (attendanceForm) {
        attendanceForm.addEventListener(
            "submit",
            handleSaveAttendance
        );
    }

    if (markAllButton) {
        markAllButton.addEventListener(
            "click",
            markAllStudentsPresent
        );
    }

    if (clearButton) {
        clearButton.addEventListener(
            "click",
            clearAttendanceSelections
        );
    }
}

/* =========================================================
   Load registered students
========================================================= */

async function handleLoadAttendanceStudents(event) {
    event.preventDefault();

    clearAttendanceValidationErrors();

    const courseId = Number(
        document.getElementById(
            "attendanceCourseSelect"
        )?.value
    );

    const attendanceDate = document.getElementById(
        "attendanceDateInput"
    )?.value;

    const isValid = validateAttendanceSelection(
        courseId,
        attendanceDate
    );

    if (!isValid) {
        return;
    }

    showLoading(
        "attendanceLoading",
        "attendanceMainContent"
    );

    try {
        selectedAttendanceCourse = attendanceCourses.find(
            (course) =>
                Number(course.courseId) === courseId
        );

        attendanceStudents =
            await loadRegisteredStudentsForAttendance(
                courseId
            );

        displayAttendanceStudents(
            attendanceStudents
        );

        displayAttendanceCourseInformation(
            selectedAttendanceCourse,
            attendanceDate,
            attendanceStudents.length
        );

        hideMessage();
    } catch (error) {
        console.error(
            "Unable to load attendance students:",
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
            "attendanceLoading",
            "attendanceMainContent"
        );
    }
}

async function loadRegisteredStudentsForAttendance(courseId) {
    if (LECTURER_CONFIG.USE_MOCK_DATA === true) {
        const students = getLocalStorageData(
            LECTURER_CONFIG.STORAGE_KEYS.COURSE_STUDENTS,
            []
        );

        return students.filter((student) => {
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

    return normalizeAttendanceArrayResponse(
        response,
        "students"
    );
}

/* =========================================================
   Validation
========================================================= */

function validateAttendanceSelection(
    courseId,
    attendanceDate
) {
    let isValid = true;

    const courseSelect = document.getElementById(
        "attendanceCourseSelect"
    );

    const dateInput = document.getElementById(
        "attendanceDateInput"
    );

    if (
        !courseId ||
        !attendanceCourses.some(
            (course) =>
                Number(course.courseId) === courseId
        )
    ) {
        showFieldError(
            courseSelect,
            "attendanceCourseError",
            "Please select an assigned course."
        );

        isValid = false;
    }

    if (!attendanceDate) {
        showFieldError(
            dateInput,
            "attendanceDateError",
            "Please select an attendance date."
        );

        isValid = false;
    } else {
        const selectedDate = new Date(
            `${attendanceDate}T00:00:00`
        );

        const today = new Date();

        today.setHours(0, 0, 0, 0);

        if (selectedDate > today) {
            showFieldError(
                dateInput,
                "attendanceDateError",
                "Attendance cannot be marked for a future date."
            );

            isValid = false;
        }
    }

    return isValid;
}

function showFieldError(
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

function clearAttendanceValidationErrors() {
    const courseSelect = document.getElementById(
        "attendanceCourseSelect"
    );

    const dateInput = document.getElementById(
        "attendanceDateInput"
    );

    if (courseSelect) {
        courseSelect.classList.remove("invalid");
    }

    if (dateInput) {
        dateInput.classList.remove("invalid");
    }

    setElementText("attendanceCourseError", "");
    setElementText("attendanceDateError", "");
}

/* =========================================================
   Display students
========================================================= */

function displayAttendanceStudents(students) {
    const tableBody = document.getElementById(
        "attendanceStudentsTableBody"
    );

    if (!tableBody) {
        return;
    }

    if (!Array.isArray(students) || students.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="4"
                    class="empty-table-message"
                >
                    No registered students were found for this course.
                </td>
            </tr>
        `;

        return;
    }

    const courseId = Number(
        document.getElementById(
            "attendanceCourseSelect"
        )?.value
    );

    const attendanceDate = document.getElementById(
        "attendanceDateInput"
    )?.value;

    const savedAttendance = getLocalStorageData(
        LECTURER_CONFIG.STORAGE_KEYS.ATTENDANCE,
        []
    );

    tableBody.innerHTML = students
        .map((student) => {
            const existingRecord =
                savedAttendance.find(
                    (record) =>
                        Number(record.studentId) ===
                        Number(student.studentId) &&
                        Number(record.courseId) ===
                        courseId &&
                        record.attendanceDate ===
                        attendanceDate
                );

            const selectedStatus =
                existingRecord?.status || "";

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
                        ${escapeLecturerHtml(
                student.email || "-"
            )}
                    </td>

                    <td>
                        <label
                            class="visually-hidden"
                            for="attendanceStatus-${student.studentId}"
                        >
                            Attendance status for
                            ${escapeLecturerHtml(
                student.fullName
            )}
                        </label>

                        <select
                            id="attendanceStatus-${student.studentId}"
                            class="attendance-status-select"
                            data-student-id="${student.studentId}"
                        >
                            <option value="">
                                Select status
                            </option>

                            ${LECTURER_CONFIG.ATTENDANCE_STATUSES
                    .map((status) => {
                        const selected =
                            selectedStatus === status
                                ? "selected"
                                : "";

                        return `
                                        <option
                                            value="${status}"
                                            ${selected}
                                        >
                                            ${status}
                                        </option>
                                    `;
                    })
                    .join("")}
                        </select>
                    </td>
                </tr>
            `;
        })
        .join("");
}

/* =========================================================
   Course information
========================================================= */

function displayAttendanceCourseInformation(
    course,
    date,
    studentCount
) {
    if (!course) {
        return;
    }

    setElementText(
        "attendanceCourseTitle",
        `${course.courseCode} - ${course.courseName}`
    );

    setElementText(
        "attendanceSummary",
        `${studentCount} registered student${studentCount === 1 ? "" : "s"
        } · ${formatLecturerDate(date)}`
    );
}

/* =========================================================
   Mark all and clear
========================================================= */

function markAllStudentsPresent() {
    const statusSelects = document.querySelectorAll(
        ".attendance-status-select"
    );

    if (statusSelects.length === 0) {
        showMessage(
            "Load students before marking attendance.",
            "warning",
            3500
        );

        return;
    }

    statusSelects.forEach((select) => {
        select.value = "Present";
        select.classList.remove("invalid");
    });

    showMessage(
        "All students were marked as Present.",
        "success",
        2500
    );
}

function clearAttendanceSelections() {
    const statusSelects = document.querySelectorAll(
        ".attendance-status-select"
    );

    statusSelects.forEach((select) => {
        select.value = "";
        select.classList.remove("invalid");
    });

    hideMessage();
}

/* =========================================================
   Save attendance
========================================================= */

async function handleSaveAttendance(event) {
    event.preventDefault();

    const courseId = Number(
        document.getElementById(
            "attendanceCourseSelect"
        )?.value
    );

    const attendanceDate = document.getElementById(
        "attendanceDateInput"
    )?.value;

    if (
        !courseId ||
        !attendanceDate ||
        attendanceStudents.length === 0
    ) {
        showMessage(
            "Load a course and its students before saving attendance.",
            "error",
            4000
        );

        return;
    }

    const attendanceRecords =
        collectAttendanceRecords(
            courseId,
            attendanceDate
        );

    if (!attendanceRecords) {
        return;
    }

    const confirmed = window.confirm(
        `Save attendance for ${attendanceStudents.length} student${attendanceStudents.length === 1 ? "" : "s"
        }?`
    );

    if (!confirmed) {
        return;
    }

    const saveButton = document.getElementById(
        "saveAttendanceButton"
    );

    setButtonLoading(
        saveButton,
        true,
        "Saving..."
    );

    try {
        if (LECTURER_CONFIG.USE_MOCK_DATA === true) {
            saveMockAttendanceRecords(
                attendanceRecords
            );
        } else {
            await saveApiAttendanceRecords(
                attendanceRecords
            );
        }

        showMessage(
            "Attendance saved successfully.",
            "success",
            4000
        );

        displayRecentAttendanceRecords();

        displayAttendanceStudents(
            attendanceStudents
        );
    } catch (error) {
        console.error(
            "Unable to save attendance:",
            error
        );

        showMessage(
            error.message ||
            "Attendance could not be saved.",
            "error",
            0
        );
    } finally {
        setButtonLoading(
            saveButton,
            false,
            "Save Attendance"
        );
    }
}

function collectAttendanceRecords(
    courseId,
    attendanceDate
) {
    const statusSelects = Array.from(
        document.querySelectorAll(
            ".attendance-status-select"
        )
    );

    let hasInvalidStatus = false;

    const records = statusSelects.map((select) => {
        const status = select.value;

        if (
            !LECTURER_CONFIG.ATTENDANCE_STATUSES.includes(
                status
            )
        ) {
            select.classList.add("invalid");
            hasInvalidStatus = true;
        } else {
            select.classList.remove("invalid");
        }

        return {
            studentId: Number(
                select.dataset.studentId
            ),
            courseId,
            attendanceDate,
            status
        };
    });

    if (hasInvalidStatus) {
        showMessage(
            "Please select an attendance status for every student.",
            "error",
            4000
        );

        return null;
    }

    return records;
}

/* =========================================================
   Mock save
========================================================= */

function saveMockAttendanceRecords(newRecords) {
    const existingRecords = getLocalStorageData(
        LECTURER_CONFIG.STORAGE_KEYS.ATTENDANCE,
        []
    );

    let nextAttendanceId =
        getNextAttendanceId(existingRecords);

    newRecords.forEach((newRecord) => {
        const existingIndex = existingRecords.findIndex(
            (record) =>
                Number(record.studentId) ===
                Number(newRecord.studentId) &&
                Number(record.courseId) ===
                Number(newRecord.courseId) &&
                record.attendanceDate ===
                newRecord.attendanceDate
        );

        if (existingIndex >= 0) {
            existingRecords[existingIndex] = {
                ...existingRecords[existingIndex],
                ...newRecord
            };
        } else {
            existingRecords.push({
                attendanceId: nextAttendanceId,
                ...newRecord
            });

            nextAttendanceId += 1;
        }
    });

    const saved = setLocalStorageData(
        LECTURER_CONFIG.STORAGE_KEYS.ATTENDANCE,
        existingRecords
    );

    if (!saved) {
        throw new Error(
            "Attendance could not be saved locally."
        );
    }
}

function getNextAttendanceId(records) {
    if (!Array.isArray(records) || records.length === 0) {
        return 1;
    }

    const highestId = Math.max(
        ...records.map((record) =>
            Number(record.attendanceId || 0)
        )
    );

    return highestId + 1;
}

/* =========================================================
   API save
========================================================= */

async function saveApiAttendanceRecords(records) {
    if (
        typeof LecturerAPI === "undefined" ||
        typeof LecturerAPI.saveAttendance !== "function"
    ) {
        throw new Error(
            "The Lecturer Attendance API is not available."
        );
    }

    /*
     * Preferred frontend request:
     *
     * {
     *   courseId,
     *   attendanceDate,
     *   records: [
     *     { studentId, status }
     *   ]
     * }
     */

    const payload = {
        courseId: records[0].courseId,
        attendanceDate:
            records[0].attendanceDate,

        records: records.map((record) => ({
            studentId: record.studentId,
            status: record.status
        }))
    };

    return LecturerAPI.saveAttendance(payload);
}

/* =========================================================
   Recent attendance
========================================================= */

function displayRecentAttendanceRecords() {
    const tableBody = document.getElementById(
        "recentAttendanceTableBody"
    );

    if (!tableBody) {
        return;
    }

    const attendanceRecords = getLocalStorageData(
        LECTURER_CONFIG.STORAGE_KEYS.ATTENDANCE,
        []
    );

    const students = getLocalStorageData(
        LECTURER_CONFIG.STORAGE_KEYS.COURSE_STUDENTS,
        []
    );

    const courses = getLocalStorageData(
        LECTURER_CONFIG.STORAGE_KEYS.LECTURER_COURSES,
        []
    );

    const sortedRecords = [...attendanceRecords]
        .sort((first, second) => {
            return (
                new Date(second.attendanceDate) -
                new Date(first.attendanceDate)
            );
        })
        .slice(0, 10);

    if (sortedRecords.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="4"
                    class="empty-table-message"
                >
                    No recent attendance records available.
                </td>
            </tr>
        `;

        return;
    }

    tableBody.innerHTML = sortedRecords
        .map((record) => {
            const student = students.find(
                (item) =>
                    Number(item.studentId) ===
                    Number(record.studentId)
            );

            const course = courses.find(
                (item) =>
                    Number(item.courseId) ===
                    Number(record.courseId)
            );

            const statusClass =
                getAttendanceStatusClass(
                    record.status
                );

            return `
                <tr>
                    <td>
                        ${formatLecturerDate(
                record.attendanceDate
            )}
                    </td>

                    <td>
                        ${escapeLecturerHtml(
                course?.courseCode || "-"
            )}
                    </td>

                    <td>
                        ${escapeLecturerHtml(
                student?.fullName || "-"
            )}
                    </td>

                    <td>
                        <span
                            class="status-badge ${statusClass}"
                        >
                            ${escapeLecturerHtml(
                record.status
            )}
                        </span>
                    </td>
                </tr>
            `;
        })
        .join("");
}

function getAttendanceStatusClass(status) {
    switch (status) {
        case "Present":
            return "status-present";

        case "Absent":
            return "status-absent";

        case "Late":
            return "status-late";

        default:
            return "";
    }
}

/* =========================================================
   Button loading
========================================================= */

function setButtonLoading(
    button,
    isLoading,
    text
) {
    if (!button) {
        return;
    }

    button.disabled = isLoading;
    button.textContent = text;
}