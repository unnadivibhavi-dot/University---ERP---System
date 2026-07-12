"use strict";

/*
 * University ERP - Lecturer Dashboard
 *
 * This file:
 * - Protects the Lecturer page
 * - Loads Lecturer courses and examinations
 * - Calculates dashboard statistics
 * - Displays assigned courses
 * - Displays upcoming examinations
 */

document.addEventListener(
    "DOMContentLoaded",
    initializeLecturerDashboard
);

/* =========================================================
   Dashboard initialization
========================================================= */

async function initializeLecturerDashboard() {
    const hasAccess = protectLecturerPage();

    if (!hasAccess) {
        return;
    }

    showLoading();

    try {
        const dashboardData = await loadDashboardData();

        renderDashboard(dashboardData);
    } catch (error) {
        console.error(
            "Unable to initialize Lecturer Dashboard:",
            error
        );

        showMessage(
            error.message ||
            "The Lecturer Dashboard could not be loaded.",
            "error",
            0
        );
    } finally {
        hideLoading();
    }
}

/* =========================================================
   Load dashboard data
========================================================= */

async function loadDashboardData() {
    if (LECTURER_CONFIG.USE_MOCK_DATA === true) {
        return loadMockDashboardData();
    }

    return loadApiDashboardData();
}

/* =========================================================
   Mock mode
========================================================= */

function loadMockDashboardData() {
    prepareMockLecturerSession();

    const lecturer = getLecturerProfile();

    const courses = getLocalStorageData(
        LECTURER_CONFIG.STORAGE_KEYS.LECTURER_COURSES,
        []
    );

    const students = getLocalStorageData(
        LECTURER_CONFIG.STORAGE_KEYS.COURSE_STUDENTS,
        []
    );

    const examinations = getLocalStorageData(
        LECTURER_CONFIG.STORAGE_KEYS.EXAMINATIONS,
        []
    );

    return {
        lecturer,
        courses,
        students,
        examinations
    };
}

/* =========================================================
   Real API mode
========================================================= */

async function loadApiDashboardData() {
    if (
        typeof LecturerAPI === "undefined" ||
        typeof LecturerAPI.getCourses !== "function"
    ) {
        throw new Error(
            "The Lecturer API service is not available."
        );
    }

    const lecturer = getLecturerProfile();

    const courses = await LecturerAPI.getCourses();

    /*
     * The current agreed backend route returns assigned courses.
     * Student counts may be included in each course response.
     *
     * The examinations route is currently POST-only in the
     * agreed API contract. Until a GET examination endpoint is
     * available, the dashboard uses any saved examination data.
     */

    const examinations = getLocalStorageData(
        LECTURER_CONFIG.STORAGE_KEYS.EXAMINATIONS,
        []
    );

    return {
        lecturer,
        courses: normalizeArrayResponse(courses),
        students: [],
        examinations
    };
}

function normalizeArrayResponse(response) {
    if (Array.isArray(response)) {
        return response;
    }

    if (response && Array.isArray(response.data)) {
        return response.data;
    }

    return [];
}

/* =========================================================
   Render complete dashboard
========================================================= */

function renderDashboard(data) {
    const lecturer = data.lecturer || {};
    const courses = Array.isArray(data.courses)
        ? data.courses
        : [];

    const students = Array.isArray(data.students)
        ? data.students
        : [];

    const examinations = Array.isArray(data.examinations)
        ? data.examinations
        : [];

    displayLecturerInformation(lecturer);

    const upcomingExaminations =
        getUpcomingExaminations(examinations);

    const totalStudents = calculateTotalStudentCount(
        courses,
        students
    );

    displayDashboardStatistics({
        assignedCourses: courses.length,
        totalStudents,
        upcomingExaminations: upcomingExaminations.length
    });

    displayUpcomingExaminations(
        upcomingExaminations,
        courses
    );

    displayAssignedCourses(courses);
}

/* =========================================================
   Lecturer information
========================================================= */

function displayLecturerInformation(lecturer) {
    setElementText(
        "welcomeLecturerName",
        lecturer.fullName || "Lecturer"
    );

    setElementText(
        "headerLecturerName",
        lecturer.fullName || "Lecturer"
    );

    setElementText(
        "headerLecturerDepartment",
        lecturer.department || "Department"
    );

    setElementText(
        "lecturerName",
        lecturer.fullName || "Lecturer"
    );

    setElementText(
        "lecturerDepartment",
        lecturer.department || "Department"
    );

    setElementText(
        "lecturerInitials",
        getInitials(lecturer.fullName)
    );
}

/* =========================================================
   Statistics
========================================================= */

function calculateTotalStudentCount(courses, students) {
    const coursesHaveStudentCounts = courses.some(
        (course) =>
            course.studentCount !== undefined &&
            course.studentCount !== null
    );

    if (coursesHaveStudentCounts) {
        return courses.reduce((total, course) => {
            return total + Number(course.studentCount || 0);
        }, 0);
    }

    /*
     * If the API does not include studentCount,
     * count unique students from mock/local student data.
     */

    const uniqueStudentIds = new Set();

    students.forEach((student) => {
        if (student.studentId !== undefined) {
            uniqueStudentIds.add(student.studentId);
        }
    });

    return uniqueStudentIds.size;
}

function displayDashboardStatistics(statistics) {
    setElementText(
        "assignedCoursesCount",
        statistics.assignedCourses
    );

    setElementText(
        "totalStudentsCount",
        statistics.totalStudents
    );

    setElementText(
        "upcomingExaminationsCount",
        statistics.upcomingExaminations
    );
}

/* =========================================================
   Upcoming examinations
========================================================= */

function getUpcomingExaminations(examinations) {
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    return examinations
        .filter((examination) => {
            const examinationDate = new Date(
                examination.examDate
            );

            if (Number.isNaN(examinationDate.getTime())) {
                return false;
            }

            examinationDate.setHours(0, 0, 0, 0);

            return examinationDate >= today;
        })
        .sort((firstExamination, secondExamination) => {
            return (
                new Date(firstExamination.examDate) -
                new Date(secondExamination.examDate)
            );
        });
}

function displayUpcomingExaminations(
    examinations,
    courses
) {
    const examinationList = document.getElementById(
        "upcomingExaminationsList"
    );

    if (!examinationList) {
        return;
    }

    if (examinations.length === 0) {
        examinationList.innerHTML = `
            <div class="empty-state">
                No upcoming examinations are available.
            </div>
        `;

        return;
    }

    examinationList.innerHTML = examinations
        .slice(0, 5)
        .map((examination) => {
            const course = courses.find(
                (item) =>
                    Number(item.courseId) ===
                    Number(examination.courseId)
            );

            const courseCode =
                course?.courseCode || "Course";

            const courseName =
                course?.courseName || "Course information unavailable";

            return `
                <article class="examination-item">
                    <div>
                        <h3>
                            ${escapeLecturerHtml(
                examination.examName
            )}
                        </h3>

                        <p>
                            ${escapeLecturerHtml(courseCode)}
                            ·
                            ${escapeLecturerHtml(courseName)}
                            ·
                            Total Marks:
                            ${escapeLecturerHtml(
                examination.totalMarks
            )}
                        </p>
                    </div>

                    <time datetime="${examination.examDate
                }">
                        ${formatLecturerDate(
                    examination.examDate
                )}
                    </time>
                </article>
            `;
        })
        .join("");
}

/* =========================================================
   Assigned courses table
========================================================= */

function displayAssignedCourses(courses) {
    const tableBody = document.getElementById(
        "dashboardCoursesTableBody"
    );

    if (!tableBody) {
        return;
    }

    if (courses.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="5"
                    class="empty-table-message"
                >
                    No courses are assigned to this lecturer.
                </td>
            </tr>
        `;

        return;
    }

    tableBody.innerHTML = courses
        .slice(0, 5)
        .map((course) => {
            const studentCount = Number(
                course.studentCount || 0
            );

            const studentsPageUrl =
                `${LECTURER_CONFIG.PAGES.STUDENTS}` +
                `?courseId=${encodeURIComponent(
                    course.courseId
                )}`;

            return `
                <tr>
                    <td>
                        <strong>
                            ${escapeLecturerHtml(
                course.courseCode
            )}
                        </strong>
                    </td>

                    <td>
                        ${escapeLecturerHtml(
                course.courseName
            )}
                    </td>

                    <td>
                        ${escapeLecturerHtml(
                course.credits
            )}
                    </td>

                    <td>
                        ${studentCount}
                    </td>

                    <td>
                        <a
                            href="${studentsPageUrl}"
                            class="table-action-button"
                            aria-label="View students in ${escapeLecturerHtml(
                course.courseName
            )
                }"
                        >
                            View Students
                        </a>
                    </td>
                </tr>
            `;
        })
        .join("");
}