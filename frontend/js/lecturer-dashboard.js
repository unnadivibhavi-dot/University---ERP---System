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
    if (
        typeof LECTURER_CONFIG !== "undefined" &&
        LECTURER_CONFIG.USE_MOCK_DATA
    ) {
        return {
            lecturer: LECTURER_MOCK_DATA.lecturer,
            summary: {},
            courses: LECTURER_MOCK_DATA.courses,
            students: LECTURER_MOCK_DATA.students,
            examinations: LECTURER_MOCK_DATA.examinations
        };
    }

    return loadApiDashboardData();
}
async function loadApiDashboardData() {
    if (
        typeof LecturerAPI === "undefined" ||
        typeof LecturerAPI.getProfile !== "function" ||
        typeof LecturerAPI.getDashboardSummary !== "function" ||
        typeof LecturerAPI.getCourses !== "function"
    ) {
        throw new Error(
            "The Lecturer API service is not available."
        );
    }

    const [
        profileResponse,
        summaryResponse,
        coursesResponse
    ] = await Promise.all([
        LecturerAPI.getProfile(),
        LecturerAPI.getDashboardSummary(),
        LecturerAPI.getCourses()
    ]);

    const lecturer =
        profileResponse?.data ||
        profileResponse?.lecturer ||
        profileResponse ||
        {};

    const summary =
        summaryResponse?.data ||
        summaryResponse?.summary ||
        summaryResponse ||
        {};

    const courses =
        normalizeArrayResponse(coursesResponse);

    return {
        lecturer,
        summary,
        courses,
        students: [],
        examinations: []
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

    const summary = data.summary || {};

    const upcomingExaminations =
        getUpcomingExaminations(examinations);

    const assignedCoursesCount =
        summary.AssignedCourses ??
        summary.assignedCourses ??
        courses.length;

    const totalStudents =
        summary.TotalStudents ??
        summary.totalStudents ??
        calculateTotalStudentCount(
            courses,
            students
        );

    const upcomingExaminationsCount =
        summary.UpcomingExaminations ??
        summary.upcomingExaminations ??
        upcomingExaminations.length;

    displayDashboardStatistics({
        assignedCourses: assignedCoursesCount,
        totalStudents,
        upcomingExaminations: upcomingExaminationsCount
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
    const uniqueStudentIds = new Set();

    students.forEach((student) => {
        if (
            student.studentId !== undefined &&
            student.studentId !== null
        ) {
            uniqueStudentIds.add(student.studentId);
        }
    });

    if (uniqueStudentIds.size > 0) {
        return uniqueStudentIds.size;
    }

    return courses.reduce((total, course) => {
        return total + Number(course.studentCount || 0);
    }, 0);
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
