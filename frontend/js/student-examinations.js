"use strict";

const mockStudent = {
    studentId: "STU2026001",
    firstName: "Vibhavi",
    lastName: "Kahandawaarachchi"
};

const examinations = [
    {
        examId: 1,
        courseCode: "SE2031",
        courseName: "Data Structures and Algorithms",
        examType: "Midterm",
        date: "2026-07-18",
        time: "09:00 AM - 11:00 AM",
        location: "Examination Hall A",
        status: "Upcoming",
        instructions: "Bring your student ID and arrive 30 minutes early."
    },
    {
        examId: 2,
        courseCode: "SE2042",
        courseName: "Database Management Systems",
        examType: "Practical",
        date: "2026-07-22",
        time: "01:00 PM - 03:00 PM",
        location: "Computer Lab 02",
        status: "Upcoming",
        instructions: "Login credentials will be provided before the examination."
    },
    {
        examId: 3,
        courseCode: "SE2051",
        courseName: "Human Computer Interaction",
        examType: "Final",
        date: "2026-07-29",
        time: "10:00 AM - 12:00 PM",
        location: "Examination Hall B",
        status: "Upcoming",
        instructions: "Electronic devices are not permitted."
    },
    {
        examId: 4,
        courseCode: "BM2013",
        courseName: "Business Process Management",
        examType: "Midterm",
        date: "2026-06-25",
        time: "09:00 AM - 10:30 AM",
        location: "Hall C1",
        status: "Completed",
        instructions: "This examination has already been completed."
    }
];

let filteredExams = [...examinations];

const examGrid = document.getElementById("examGrid");
const examSearch = document.getElementById("examSearch");
const examStatusFilter =
    document.getElementById("examStatusFilter");
const examTypeFilter =
    document.getElementById("examTypeFilter");
const clearFilterButton =
    document.getElementById("clearFilterButton");
const emptyState = document.getElementById("emptyState");
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
            renderExams(filteredExams);
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
    document.getElementById("totalExamCount").textContent =
        examinations.length;

    document.getElementById("upcomingExamCount").textContent =
        examinations.filter(
            exam => exam.status === "Upcoming"
        ).length;

    document.getElementById("completedExamCount").textContent =
        examinations.filter(
            exam => exam.status === "Completed"
        ).length;
}

function initializeFilters() {
    examSearch.addEventListener("input", filterExams);
    examStatusFilter.addEventListener("change", filterExams);
    examTypeFilter.addEventListener("change", filterExams);

    clearFilterButton.addEventListener(
        "click",
        function () {
            examSearch.value = "";
            examStatusFilter.value = "";
            examTypeFilter.value = "";

            filteredExams = [...examinations];
            renderExams(filteredExams);
        }
    );
}

function filterExams() {
    const search =
        examSearch.value.trim().toLowerCase();

    const status =
        examStatusFilter.value;

    const type =
        examTypeFilter.value;

    filteredExams = examinations.filter(
        function (exam) {
            const matchesSearch =
                exam.courseCode
                    .toLowerCase()
                    .includes(search) ||
                exam.courseName
                    .toLowerCase()
                    .includes(search);

            const matchesStatus =
                status === "" ||
                exam.status === status;

            const matchesType =
                type === "" ||
                exam.examType === type;

            return (
                matchesSearch &&
                matchesStatus &&
                matchesType
            );
        }
    );

    renderExams(filteredExams);
}

function renderExams(exams) {
    examGrid.innerHTML = "";

    if (exams.length === 0) {
        emptyState.classList.remove("d-none");
        return;
    }

    emptyState.classList.add("d-none");

    exams.forEach(function (exam) {
        const card = document.createElement("article");

        card.className = "exam-card";

        const statusClass =
            exam.status.toLowerCase();

        card.innerHTML = `
            <div class="exam-card-header">
                <span class="course-code">
                    ${escapeHtml(exam.courseCode)}
                </span>

                <span class="exam-status ${statusClass}">
                    ${escapeHtml(exam.status)}
                </span>
            </div>

            <h3>${escapeHtml(exam.courseName)}</h3>

            <span class="exam-type">
                ${escapeHtml(exam.examType)} Examination
            </span>

            <div class="exam-details">

                <div class="exam-detail">
                    <i class="bi bi-calendar-event"></i>
                    <span>${formatDate(exam.date)}</span>
                </div>

                <div class="exam-detail">
                    <i class="bi bi-clock-fill"></i>
                    <span>${escapeHtml(exam.time)}</span>
                </div>

                <div class="exam-detail">
                    <i class="bi bi-geo-alt-fill"></i>
                    <span>${escapeHtml(exam.location)}</span>
                </div>

            </div>

            <button
                type="button"
                data-exam-id="${exam.examId}"
            >
                <i class="bi bi-eye-fill"></i>
                View Details
            </button>
        `;

        card.querySelector("button").addEventListener(
            "click",
            function () {
                showExamDetails(exam.examId);
            }
        );

        examGrid.appendChild(card);
    });
}

function showExamDetails(examId) {
    const exam = examinations.find(
        item => item.examId === examId
    );

    if (!exam) {
        return;
    }

    document.getElementById("modalExamTitle").textContent =
        `${exam.courseCode} - ${exam.courseName}`;

    document.getElementById("modalExamBody").innerHTML = `
        <div class="exam-modal-detail">
            <i class="bi bi-file-earmark-text-fill"></i>
            <span>
                <strong>Type:</strong>
                ${escapeHtml(exam.examType)}
            </span>
        </div>

        <div class="exam-modal-detail">
            <i class="bi bi-calendar-event"></i>
            <span>
                <strong>Date:</strong>
                ${formatDate(exam.date)}
            </span>
        </div>

        <div class="exam-modal-detail">
            <i class="bi bi-clock-fill"></i>
            <span>
                <strong>Time:</strong>
                ${escapeHtml(exam.time)}
            </span>
        </div>

        <div class="exam-modal-detail">
            <i class="bi bi-geo-alt-fill"></i>
            <span>
                <strong>Location:</strong>
                ${escapeHtml(exam.location)}
            </span>
        </div>

        <div class="exam-modal-detail">
            <i class="bi bi-info-circle-fill"></i>
            <span>
                <strong>Status:</strong>
                ${escapeHtml(exam.status)}
            </span>
        </div>

        <div class="exam-instructions">
            <strong>Important Instructions</strong>
            <p class="mb-0 mt-2">
                ${escapeHtml(exam.instructions)}
            </p>
        </div>
    `;

    bootstrap.Modal
        .getOrCreateInstance(
            document.getElementById("examDetailsModal")
        )
        .show();
}

function formatDate(dateValue) {
    return new Date(
        `${dateValue}T00:00:00`
    ).toLocaleDateString(
        "en-US",
        {
            year: "numeric",
            month: "long",
            day: "numeric"
        }
    );
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