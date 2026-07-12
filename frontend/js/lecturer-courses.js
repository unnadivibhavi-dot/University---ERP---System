"use strict";

/*
 * University ERP - Lecturer Courses Page
 *
 * This file:
 * - Protects the page
 * - Loads assigned courses
 * - Displays course information
 * - Provides search functionality
 * - Creates View Students links
 */

document.addEventListener(
    "DOMContentLoaded",
    initializeLecturerCoursesPage
);

let allLecturerCourses = [];

/* =========================================================
   Page initialization
========================================================= */

async function initializeLecturerCoursesPage() {
    const hasAccess = protectLecturerPage();

    if (!hasAccess) {
        return;
    }

    showCoursesLoading();

    try {
        allLecturerCourses = await loadLecturerCourses();

        displayLecturerCourses(allLecturerCourses);
        updateCourseCount(allLecturerCourses.length);
        updateCourseResultSummary(allLecturerCourses.length);

        initializeCourseSearch();
    } catch (error) {
        console.error(
            "Unable to load Lecturer courses:",
            error
        );

        showMessage(
            error.message ||
            "Assigned courses could not be loaded.",
            "error",
            0
        );
    } finally {
        hideCoursesLoading();
    }
}

/* =========================================================
   Load courses
========================================================= */

async function loadLecturerCourses() {
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

    return normalizeCoursesResponse(response);
}

function normalizeCoursesResponse(response) {
    if (Array.isArray(response)) {
        return response;
    }

    if (response && Array.isArray(response.data)) {
        return response.data;
    }

    if (response && Array.isArray(response.courses)) {
        return response.courses;
    }

    return [];
}

/* =========================================================
   Search
========================================================= */

function initializeCourseSearch() {
    const searchInput = document.getElementById(
        "courseSearchInput"
    );

    if (!searchInput) {
        return;
    }

    searchInput.addEventListener("input", () => {
        const searchTerm = searchInput.value
            .trim()
            .toLowerCase();

        const filteredCourses = allLecturerCourses.filter(
            (course) => {
                const code = String(
                    course.courseCode || ""
                ).toLowerCase();

                const name = String(
                    course.courseName || ""
                ).toLowerCase();

                return (
                    code.includes(searchTerm) ||
                    name.includes(searchTerm)
                );
            }
        );

        displayLecturerCourses(filteredCourses);
        updateCourseResultSummary(
            filteredCourses.length,
            searchTerm
        );
    });
}

/* =========================================================
   Display courses
========================================================= */

function displayLecturerCourses(courses) {
    const tableBody = document.getElementById(
        "lecturerCoursesTableBody"
    );

    if (!tableBody) {
        return;
    }

    if (!Array.isArray(courses) || courses.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td
                    colspan="5"
                    class="empty-table-message"
                >
                    No matching assigned courses were found.
                </td>
            </tr>
        `;

        return;
    }

    tableBody.innerHTML = courses
        .map((course) => {
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
                course.courseCode || "-"
            )}
                        </strong>
                    </td>

                    <td>
                        ${escapeLecturerHtml(
                course.courseName || "-"
            )}
                    </td>

                    <td>
                        ${escapeLecturerHtml(
                course.credits ?? 0
            )}
                    </td>

                    <td>
                        ${escapeLecturerHtml(
                course.studentCount ?? 0
            )}
                    </td>

                    <td>
                        <a
                            href="${studentsPageUrl}"
                            class="table-action-button"
                        >
                            View Students
                        </a>
                    </td>
                </tr>
            `;
        })
        .join("");
}

/* =========================================================
   Page information
========================================================= */

function updateCourseCount(courseCount) {
    setElementText(
        "courseCount",
        courseCount
    );
}

function updateCourseResultSummary(
    resultCount,
    searchTerm = ""
) {
    const summaryElement = document.getElementById(
        "courseResultSummary"
    );

    if (!summaryElement) {
        return;
    }

    if (searchTerm) {
        summaryElement.textContent =
            `${resultCount} course${resultCount === 1 ? "" : "s"} found`;
    } else {
        summaryElement.textContent =
            `Showing ${resultCount} assigned course${resultCount === 1 ? "" : "s"
            }`;
    }
}

/* =========================================================
   Loading state
========================================================= */

function showCoursesLoading() {
    showLoading(
        "coursesLoading",
        "coursesMainContent"
    );
}

function hideCoursesLoading() {
    hideLoading(
        "coursesLoading",
        "coursesMainContent"
    );
}