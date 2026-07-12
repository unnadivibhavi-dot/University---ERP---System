"use strict";

const mockStudent = {
    studentId: "STU2026001",
    firstName: "Vibhavi",
    lastName: "Kahandawaarachchi"
};

const results = [
    {
        courseCode: "SE2011",
        courseName: "Object Oriented Programming",
        semester: "Semester 01",
        credits: 4,
        marks: 82,
        grade: "A",
        gradePoint: 4.0,
        status: "Pass"
    },
    {
        courseCode: "SE2022",
        courseName: "Computer Networks",
        semester: "Semester 01",
        credits: 3,
        marks: 75,
        grade: "A-",
        gradePoint: 3.7,
        status: "Pass"
    },
    {
        courseCode: "BM2013",
        courseName: "Business Process Management",
        semester: "Semester 02",
        credits: 3,
        marks: 68,
        grade: "B+",
        gradePoint: 3.3,
        status: "Pass"
    },
    {
        courseCode: "SE2062",
        courseName: "Operating Systems",
        semester: "Semester 02",
        credits: 4,
        marks: 61,
        grade: "B",
        gradePoint: 3.0,
        status: "Pass"
    },
    {
        courseCode: "SE2071",
        courseName: "Software Testing",
        semester: "Semester 02",
        credits: 3,
        marks: 42,
        grade: "F",
        gradePoint: 0,
        status: "Fail"
    }
];

let filteredResults = [...results];

const resultsTableBody =
    document.getElementById("resultsTableBody");

const resultSearch =
    document.getElementById("resultSearch");

const semesterFilter =
    document.getElementById("semesterFilter");

const statusFilter =
    document.getElementById("statusFilter");

const clearFilterButton =
    document.getElementById("clearFilterButton");

const emptyState =
    document.getElementById("emptyState");

const loadingOverlay =
    document.getElementById("loadingOverlay");

const studentSidebar =
    document.getElementById("studentSidebar");

const sidebarOverlay =
    document.getElementById("sidebarOverlay");

document.addEventListener(
    "DOMContentLoaded",
    function () {
        displayDate();
        displayStudent();
        initializeFilters();
        initializeSidebar();
        initializeLogout();

        setTimeout(function () {
            updateSummary();
            renderResults(filteredResults);
            loadingOverlay.classList.add("hidden");
        }, 500);
    }
);

function displayDate() {
    document.getElementById("currentDate").textContent =
        new Date().toLocaleDateString(
            "en-US",
            {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric"
            }
        );
}

function displayStudent() {
    const fullName =
        `${mockStudent.firstName} ${mockStudent.lastName}`;

    const initials =
        `${mockStudent.firstName[0]}${mockStudent.lastName[0]}`
            .toUpperCase();

    document.getElementById("sidebarAvatar").textContent =
        initials;

    document.getElementById("topAvatar").textContent =
        initials;

    document.getElementById("sidebarStudentName").textContent =
        fullName;

    document.getElementById("topStudentName").textContent =
        fullName;

    document.getElementById("sidebarStudentId").textContent =
        mockStudent.studentId;

    document.getElementById("topStudentId").textContent =
        mockStudent.studentId;
}

function updateSummary() {
    const passed =
        results.filter(
            item => item.status === "Pass"
        ).length;

    const failed =
        results.filter(
            item => item.status === "Fail"
        ).length;

    const totalGradePoints =
        results.reduce(
            function (total, item) {
                return total +
                    item.gradePoint * item.credits;
            },
            0
        );

    const totalCredits =
        results.reduce(
            function (total, item) {
                return total + item.credits;
            },
            0
        );

    const gpa =
        totalCredits > 0
            ? totalGradePoints / totalCredits
            : 0;

    document.getElementById("currentGpa").textContent =
        gpa.toFixed(2);

    document.getElementById("passedCount").textContent =
        passed;

    document.getElementById("failedCount").textContent =
        failed;

    document.getElementById("totalResultsCount").textContent =
        results.length;
}

function initializeFilters() {
    resultSearch.addEventListener(
        "input",
        filterResults
    );

    semesterFilter.addEventListener(
        "change",
        filterResults
    );

    statusFilter.addEventListener(
        "change",
        filterResults
    );

    clearFilterButton.addEventListener(
        "click",
        function () {
            resultSearch.value = "";
            semesterFilter.value = "";
            statusFilter.value = "";

            filteredResults = [...results];
            renderResults(filteredResults);
        }
    );
}

function filterResults() {
    const search =
        resultSearch.value
            .trim()
            .toLowerCase();

    const semester =
        semesterFilter.value;

    const status =
        statusFilter.value;

    filteredResults =
        results.filter(
            function (item) {
                const matchesSearch =
                    item.courseCode
                        .toLowerCase()
                        .includes(search) ||
                    item.courseName
                        .toLowerCase()
                        .includes(search);

                const matchesSemester =
                    semester === "" ||
                    item.semester === semester;

                const matchesStatus =
                    status === "" ||
                    item.status === status;

                return (
                    matchesSearch &&
                    matchesSemester &&
                    matchesStatus
                );
            }
        );

    renderResults(filteredResults);
}

function renderResults(items) {
    resultsTableBody.innerHTML = "";

    if (items.length === 0) {
        emptyState.classList.remove("d-none");
        return;
    }

    emptyState.classList.add("d-none");

    items.forEach(function (item) {
        const row =
            document.createElement("tr");

        const statusClass =
            item.status === "Pass"
                ? "status-pass"
                : "status-fail";

        row.innerHTML = `
            <td>
                <span class="course-name">
                    ${escapeHtml(item.courseName)}
                </span>

                <span class="course-code">
                    ${escapeHtml(item.courseCode)}
                </span>
            </td>

            <td>
                ${escapeHtml(item.semester)}
            </td>

            <td>
                ${item.credits}
            </td>

            <td>
                ${item.marks}%
            </td>

            <td>
                <span class="grade-badge">
                    ${escapeHtml(item.grade)}
                </span>
            </td>

            <td>
                <span class="status-badge ${statusClass}">
                    ${escapeHtml(item.status)}
                </span>
            </td>
        `;

        resultsTableBody.appendChild(row);
    });
}

function initializeSidebar() {
    document
        .getElementById("menuButton")
        .addEventListener(
            "click",
            function () {
                studentSidebar.classList.add("open");
                sidebarOverlay.classList.add("show");
            }
        );

    document
        .getElementById("sidebarCloseButton")
        .addEventListener(
            "click",
            closeSidebar
        );

    sidebarOverlay.addEventListener(
        "click",
        closeSidebar
    );
}

function closeSidebar() {
    studentSidebar.classList.remove("open");
    sidebarOverlay.classList.remove("show");
}

function initializeLogout() {
    document
        .getElementById("logoutButton")
        .addEventListener(
            "click",
            function () {
                bootstrap.Modal
                    .getOrCreateInstance(
                        document.getElementById(
                            "logoutModal"
                        )
                    )
                    .show();
            }
        );

    document
        .getElementById("confirmLogoutButton")
        .addEventListener(
            "click",
            function () {
                localStorage.clear();
                window.location.href = "login.html";
            }
        );
}

function escapeHtml(value) {
    const element =
        document.createElement("div");

    element.textContent =
        value === undefined ||
            value === null
            ? ""
            : String(value);

    return element.innerHTML;
}