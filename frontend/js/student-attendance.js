"use strict";

const mockStudent = {
    studentId: "STU2026001",
    firstName: "Vibhavi",
    lastName: "Kahandawaarachchi"
};

const attendanceRecords = [
    {
        courseCode: "SE2031",
        courseName: "Data Structures and Algorithms",
        totalClasses: 20,
        present: 18,
        absent: 2
    },
    {
        courseCode: "SE2042",
        courseName: "Database Management Systems",
        totalClasses: 18,
        present: 15,
        absent: 3
    },
    {
        courseCode: "SE2051",
        courseName: "Human Computer Interaction",
        totalClasses: 16,
        present: 11,
        absent: 5
    },
    {
        courseCode: "BM2013",
        courseName: "Business Process Management",
        totalClasses: 15,
        present: 13,
        absent: 2
    },
    {
        courseCode: "SE2062",
        courseName: "Operating Systems",
        totalClasses: 19,
        present: 14,
        absent: 5
    }
];

let filteredRecords = [...attendanceRecords];

const attendanceGrid =
    document.getElementById("attendanceGrid");

const attendanceSearch =
    document.getElementById("attendanceSearch");

const attendanceFilter =
    document.getElementById("attendanceFilter");

const clearFilterButton =
    document.getElementById("clearFilterButton");

const emptyState =
    document.getElementById("emptyState");

const loadingOverlay =
    document.getElementById("loadingOverlay");

const overallAttendance =
    document.getElementById("overallAttendance");

const presentCount =
    document.getElementById("presentCount");

const absentCount =
    document.getElementById("absentCount");

const totalClasses =
    document.getElementById("totalClasses");

const attendanceWarning =
    document.getElementById("attendanceWarning");

const studentSidebar =
    document.getElementById("studentSidebar");

const sidebarOverlay =
    document.getElementById("sidebarOverlay");

document.addEventListener(
    "DOMContentLoaded",
    function () {
        displayDate();
        displayStudent();
        initializeSidebar();
        initializeFilters();
        initializeLogout();

        setTimeout(function () {
            updateSummary();
            renderAttendance(filteredRecords);
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
    const totals =
        attendanceRecords.reduce(
            function (result, record) {
                result.total += record.totalClasses;
                result.present += record.present;
                result.absent += record.absent;
                return result;
            },
            {
                total: 0,
                present: 0,
                absent: 0
            }
        );

    const percentage =
        totals.total > 0
            ? Math.round(
                totals.present / totals.total * 100
            )
            : 0;

    overallAttendance.textContent =
        `${percentage}%`;

    presentCount.textContent =
        totals.present;

    absentCount.textContent =
        totals.absent;

    totalClasses.textContent =
        totals.total;

    const hasLowAttendance =
        attendanceRecords.some(function (record) {
            return calculatePercentage(record) < 80;
        });

    attendanceWarning.classList.toggle(
        "d-none",
        !hasLowAttendance
    );
}

function calculatePercentage(record) {
    if (record.totalClasses === 0) {
        return 0;
    }

    return Math.round(
        record.present /
        record.totalClasses *
        100
    );
}

function initializeFilters() {
    attendanceSearch.addEventListener(
        "input",
        filterAttendance
    );

    attendanceFilter.addEventListener(
        "change",
        filterAttendance
    );

    clearFilterButton.addEventListener(
        "click",
        function () {
            attendanceSearch.value = "";
            attendanceFilter.value = "";
            filteredRecords = [...attendanceRecords];
            renderAttendance(filteredRecords);
        }
    );
}

function filterAttendance() {
    const search =
        attendanceSearch.value
            .trim()
            .toLowerCase();

    const level =
        attendanceFilter.value;

    filteredRecords =
        attendanceRecords.filter(
            function (record) {
                const percentage =
                    calculatePercentage(record);

                const matchesSearch =
                    record.courseCode
                        .toLowerCase()
                        .includes(search) ||
                    record.courseName
                        .toLowerCase()
                        .includes(search);

                const matchesLevel =
                    level === "" ||
                    (
                        level === "good" &&
                        percentage >= 80
                    ) ||
                    (
                        level === "low" &&
                        percentage < 80
                    );

                return (
                    matchesSearch &&
                    matchesLevel
                );
            }
        );

    renderAttendance(filteredRecords);
}

function renderAttendance(records) {
    attendanceGrid.innerHTML = "";

    if (records.length === 0) {
        emptyState.classList.remove("d-none");
        return;
    }

    emptyState.classList.add("d-none");

    records.forEach(function (record) {
        const percentage =
            calculatePercentage(record);

        const levelClass =
            percentage >= 80
                ? "good"
                : "low";

        const levelText =
            percentage >= 80
                ? "Good"
                : "Low";

        const card =
            document.createElement("article");

        card.className = "attendance-card";

        card.innerHTML = `
            <div class="attendance-card-header">
                <span class="course-code">
                    ${escapeHtml(record.courseCode)}
                </span>

                <span class="attendance-level ${levelClass}">
                    ${levelText}
                </span>
            </div>

            <h3>
                ${escapeHtml(record.courseName)}
            </h3>

            <div class="attendance-numbers">

                <div class="attendance-number">
                    <span>Total</span>
                    <strong>${record.totalClasses}</strong>
                </div>

                <div class="attendance-number">
                    <span>Present</span>
                    <strong>${record.present}</strong>
                </div>

                <div class="attendance-number">
                    <span>Absent</span>
                    <strong>${record.absent}</strong>
                </div>

            </div>

            <div class="progress-area">

                <div class="progress-top">
                    <span>Attendance progress</span>
                    <strong>${percentage}%</strong>
                </div>

                <div class="progress-track">
                    <div
                        class="progress-bar-custom"
                        style="width:${percentage}%"
                    ></div>
                </div>

            </div>
        `;

        attendanceGrid.appendChild(card);
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
    const div =
        document.createElement("div");

    div.textContent =
        value === undefined ||
            value === null
            ? ""
            : String(value);

    return div.innerHTML;
}