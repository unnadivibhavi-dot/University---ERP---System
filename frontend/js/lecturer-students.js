"use strict";

/*
 * University ERP - Lecturer Course Students Page
 *
 * This file:
 * - Reads courseId from the URL
 * - Loads selected course information
 * - Loads registered students
 * - Displays student data
 * - Provides search functionality
 */

document.addEventListener(
    "DOMContentLoaded",
    initializeCourseStudentsPage
);

let selectedCourse = null;
let allCourseStudents = [];

/* =========================================================
   Page initialization
========================================================= */

async function initializeCourseStudentsPage() {
    const hasAccess = protectLecturerPage();

    if (!hasAccess) {
        return;
    }

    showStudentsLoading();

    try {
        const courseId = getCourseIdFromUrl();

        if (!courseId) {
            throw new Error(
                "No course was selected. Please return to My Courses."
            );
        }

        const pageData = await loadCourseStudentsPageData(courseId);

        selectedCourse = pageData.course;
        allCourseStudents = pageData.students;

        displaySelectedCourse(selectedCourse);
        displayCourseStudents(allCourseStudents);
        updateRegisteredStudentCount(allCourseStudents.length);
        updateStudentResultSummary(allCourseStudents.length);
        updateMarkAttendanceLink(courseId);

        initializeStudentSearch();
    } catch (error) {
        console.error(
            "Unable to load Course Students page:",
            error
        );

        showMessage(
            error.message ||
            "Course students could not be loaded.",
            "error",
            0
        );

        displayMissingCourseState();
    } finally {
        hideStudentsLoading();
    }
}

/* =========================================================
   URL course ID
========================================================= */

function getCourseIdFromUrl() {
    const courseIdValue = getUrlParameter("courseId");

    if (!courseIdValue) {
        return null;
    }

    const courseId = Number(courseIdValue);

    if (
        Number.isNaN(courseId) ||
        !Number.isInteger(courseId) ||
        courseId <= 0
    ) {
        return null;
    }

    return courseId;
}

/* =========================================================
   Load page data
========================================================= */

async function loadCourseStudentsPageData(courseId) {
    if (LECTURER_CONFIG.USE_MOCK_DATA === true) {
        return loadMockCourseStudentsData(courseId);
    }

    return loadApiCourseStudentsData(courseId);
}

/* =========================================================
   Mock mode
========================================================= */

function loadMockCourseStudentsData(courseId) {
    prepareMockLecturerSession();

    const courses = getLocalStorageData(
        LECTURER_CONFIG.STORAGE_KEYS.LECTURER_COURSES,
        []
    );

    const students = getLocalStorageData(
        LECTURER_CONFIG.STORAGE_KEYS.COURSE_STUDENTS,
        []
    );

    const course = courses.find(
        (item) =>
            Number(item.courseId) === Number(courseId)
    );

    if (!course) {
        throw new Error(
            "The selected course is not assigned to this lecturer."
        );
    }

    const registeredStudents = students.filter(
        (student) => {
            const courseIds = Array.isArray(student.courseIds)
                ? student.courseIds
                : [];

            return courseIds.some(
                (studentCourseId) =>
                    Number(studentCourseId) === Number(courseId)
            );
        }
    );

    return {
        course,
        students: registeredStudents
    };
}

/* =========================================================
   Real API mode
========================================================= */

async function loadApiCourseStudentsData(courseId) {
    if (
        typeof LecturerAPI === "undefined" ||
        typeof LecturerAPI.getCourseStudents !== "function"
    ) {
        throw new Error(
            "The Lecturer API service is not available."
        );
    }

    const coursesResponse = await LecturerAPI.getCourses();
    const studentsResponse =
        await LecturerAPI.getCourseStudents(courseId);

    const courses = normalizeArrayData(
        coursesResponse,
        "courses"
    );

    const students = normalizeArrayData(
        studentsResponse,
        "students"
    );

    const course = courses.find(
        (item) =>
            Number(item.courseId) === Number(courseId)
    );

    if (!course) {
        throw new Error(
            "The selected course is not assigned to this lecturer."
        );
    }

    return {
        course,
        students
    };
}

function normalizeArrayData(response, propertyName) {
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
   Display selected course
========================================================= */

function displaySelectedCourse(course) {
    setElementText(
        "selectedCourseName",
        course.courseName || "Course"
    );

    setElementText(
        "selectedCourseCode",
        course.courseCode || "-"
    );

    setElementText(
        "selectedCourseCredits",
        course.credits ?? 0
    );

    document.title =
        `${course.courseCode || "Course"} Students | University ERP`;
}

/* =========================================================
   Display students
========================================================= */

function displayCourseStudents(students) {
    const tableBody = document.getElementById(
        "courseStudentsTableBody"
    );

    if (!tableBody) {
        return;
    }

    if (!Array.isArray(students) || students.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="3"
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
            return `
                <tr>
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
                        <a
                            href="mailto:${escapeLecturerHtml(
                student.email || ""
            )}"
                        >
                            ${escapeLecturerHtml(
                student.email || "-"
            )}
                        </a>
                    </td>
                </tr>
            `;
        })
        .join("");
}

/* =========================================================
   Search
========================================================= */

function initializeStudentSearch() {
    const searchInput = document.getElementById(
        "studentSearchInput"
    );

    if (!searchInput) {
        return;
    }

    searchInput.addEventListener("input", () => {
        const searchTerm = searchInput.value
            .trim()
            .toLowerCase();

        const filteredStudents = allCourseStudents.filter(
            (student) => {
                const studentNumber = String(
                    student.studentNumber || ""
                ).toLowerCase();

                const fullName = String(
                    student.fullName || ""
                ).toLowerCase();

                const email = String(
                    student.email || ""
                ).toLowerCase();

                return (
                    studentNumber.includes(searchTerm) ||
                    fullName.includes(searchTerm) ||
                    email.includes(searchTerm)
                );
            }
        );

        displayCourseStudents(filteredStudents);

        updateStudentResultSummary(
            filteredStudents.length,
            searchTerm
        );
    });
}

/* =========================================================
   Page information
========================================================= */

function updateRegisteredStudentCount(studentCount) {
    setElementText(
        "registeredStudentCount",
        studentCount
    );
}

function updateStudentResultSummary(
    resultCount,
    searchTerm = ""
) {
    const summaryElement = document.getElementById(
        "studentResultSummary"
    );

    if (!summaryElement) {
        return;
    }

    if (searchTerm) {
        summaryElement.textContent =
            `${resultCount} student${resultCount === 1 ? "" : "s"
            } found`;
    } else {
        summaryElement.textContent =
            `Showing ${resultCount} registered student${resultCount === 1 ? "" : "s"
            }`;
    }
}

function updateMarkAttendanceLink(courseId) {
    const attendanceLink = document.getElementById(
        "markAttendanceLink"
    );

    if (!attendanceLink) {
        return;
    }

    attendanceLink.href =
        `${LECTURER_CONFIG.PAGES.ATTENDANCE}` +
        `?courseId=${encodeURIComponent(courseId)}`;
}

/* =========================================================
   Error state
========================================================= */

function displayMissingCourseState() {
    setElementText(
        "selectedCourseName",
        "Course unavailable"
    );

    setElementText(
        "selectedCourseCode",
        "-"
    );

    setElementText(
        "selectedCourseCredits",
        "-"
    );

    setElementText(
        "registeredStudentCount",
        0
    );

    displayCourseStudents([]);
}

/* =========================================================
   Loading state
========================================================= */

function showStudentsLoading() {
    showLoading(
        "studentsLoading",
        "studentsMainContent"
    );
}

function hideStudentsLoading() {
    hideLoading(
        "studentsLoading",
        "studentsMainContent"
    );
}