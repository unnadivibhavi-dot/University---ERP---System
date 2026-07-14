"use strict";

/*
---------------------------------------------------
EDUPortal
Admin Attendance Management
---------------------------------------------------
*/

const API_BASE_URL =
    window.ERP_CONFIG?.API_BASE_URL ||
    "http://localhost:5001/api";

/*
---------------------------------------------------
Page elements
---------------------------------------------------
*/

const courseSelect =
    document.getElementById("courseSelect");

const attendanceDate =
    document.getElementById("attendanceDate");

const attendanceSheetContainer =
    document.getElementById("attendanceSheetContainer");

const attendanceHistoryTableBody =
    document.getElementById("attendanceHistoryTableBody");

const saveAttendanceButton =
    document.getElementById("saveAttendanceButton");

const saveButtonText =
    document.getElementById("saveButtonText");

const saveSpinner =
    document.getElementById("saveSpinner");

const markAllPresentBtn =
    document.getElementById("markAllPresentBtn");

const resetSheetBtn =
    document.getElementById("resetSheetBtn");

const attendancePageMessage =
    document.getElementById("attendancePageMessage");

const avgAttendanceRateValue =
    document.getElementById("avgAttendanceRateValue");

const presentCountValue =
    document.getElementById("presentCountValue");

const lateCountValue =
    document.getElementById("lateCountValue");

const absentCountValue =
    document.getElementById("absentCountValue");

const sidebar =
    document.getElementById("sidebar");

const sidebarOverlay =
    document.getElementById("sidebarOverlay");

const mobileMenuButton =
    document.getElementById("mobileMenuButton");

const sidebarCloseButton =
    document.getElementById("sidebarCloseButton");

const sidebarLogoutButton =
    document.getElementById("sidebarLogoutButton");

const topLogoutButton =
    document.getElementById("topLogoutButton");

const sidebarUsername =
    document.getElementById("sidebarUsername");

const sidebarRole =
    document.getElementById("sidebarRole");

const topUsername =
    document.getElementById("topUsername");

const topRole =
    document.getElementById("topRole");


/*
---------------------------------------------------
Page data
---------------------------------------------------
*/

let courses = [];
let enrollments = [];
let attendanceRecords = [];
let currentStudents = [];
let selectedStatuses = new Map();


/*
---------------------------------------------------
Authentication helpers
---------------------------------------------------
*/

function getToken() {
    return (
        localStorage.getItem("token") ||
        localStorage.getItem("authToken")
    );
}

function getLoggedUser() {
    const storedUser =
        localStorage.getItem("user") ||
        localStorage.getItem("loggedUser");

    if (!storedUser) {
        return null;
    }

    try {
        return JSON.parse(storedUser);
    } catch (error) {
        console.error(
            "Unable to read logged user:",
            error
        );

        return null;
    }
}

function clearSession() {
    localStorage.removeItem("token");
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    localStorage.removeItem("loggedUser");
    localStorage.removeItem("userRole");
    localStorage.removeItem("isLoggedIn");
}

function redirectToLogin() {
    clearSession();
    window.location.replace("login.html");
}


/*
---------------------------------------------------
API request helper
---------------------------------------------------
*/

async function apiRequest(endpoint, options = {}) {
    if (typeof window.fetchWithAuth === "function") {
        return window.fetchWithAuth(
            endpoint,
            options
        );
    }

    const token = getToken();

    if (!token) {
        redirectToLogin();

        throw new Error(
            "Please sign in before accessing attendance."
        );
    }

    const cleanEndpoint =
        endpoint.startsWith("/")
            ? endpoint
            : `/${endpoint}`;

    const headers =
        new Headers(options.headers || {});

    headers.set(
        "Authorization",
        `Bearer ${token}`
    );

    if (
        options.body &&
        !(options.body instanceof FormData)
    ) {
        headers.set(
            "Content-Type",
            "application/json"
        );
    }

    const response = await fetch(
        `${API_BASE_URL}${cleanEndpoint}`,
        {
            ...options,
            headers
        }
    );

    const text = await response.text();

    let data = {};

    if (text) {
        try {
            data = JSON.parse(text);
        } catch (error) {
            data = {
                message: text
            };
        }
    }

    if (
        response.status === 401 ||
        response.status === 403
    ) {
        redirectToLogin();

        throw new Error(
            data.message ||
            "Your session has expired."
        );
    }

    if (!response.ok) {
        throw new Error(
            data.message ||
            "Unable to complete the request."
        );
    }

    return data;
}


/*
---------------------------------------------------
Utility functions
---------------------------------------------------
*/

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function toDateValue(value) {
    if (!value) {
        return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    return date.toISOString().split("T")[0];
}

function formatDate(value) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    return date.toLocaleDateString(
        "en-GB",
        {
            year: "numeric",
            month: "short",
            day: "2-digit"
        }
    );
}

function getCourseId(course) {
    return Number(
        course.CourseID ??
        course.courseId ??
        course.id
    );
}

function getAttendanceId(record) {
    return Number(
        record.AttendanceID ??
        record.attendanceId
    );
}

function getStudentId(record) {
    return Number(
        record.StudentID ??
        record.studentId
    );
}

function getStatus(record) {
    return String(
        record.Status ??
        record.status ??
        ""
    );
}


/*
---------------------------------------------------
Messages
---------------------------------------------------
*/

function showMessage(type, message) {
    attendancePageMessage.innerHTML = `
        <div class="alert alert-${type}">
            ${escapeHtml(message)}
        </div>
    `;
}

function clearMessage() {
    attendancePageMessage.innerHTML = "";
}


/*
---------------------------------------------------
User information
---------------------------------------------------
*/

function loadUserInformation() {
    const user = getLoggedUser();

    const username =
        user?.username ||
        user?.Username ||
        "Administrator";

    const role =
        user?.role ||
        user?.Role ||
        "Admin";

    if (sidebarUsername) {
        sidebarUsername.textContent = username;
    }

    if (topUsername) {
        topUsername.textContent = username;
    }

    if (sidebarRole) {
        sidebarRole.textContent = role;
    }

    if (topRole) {
        topRole.textContent = role;
    }
}


/*
---------------------------------------------------
Empty sheet
---------------------------------------------------
*/

function showEmptySheet(
    title = "No course selected",
    message =
        "Select a course and date to load the attendance sheet."
) {
    attendanceSheetContainer.innerHTML = `
        <div class="empty-sheet-state">
            <div class="empty-sheet-icon">
                <i class="bi bi-journal-check"></i>
            </div>

            <h4>${escapeHtml(title)}</h4>

            <p>${escapeHtml(message)}</p>
        </div>
    `;

    saveAttendanceButton.disabled = true;
    markAllPresentBtn.disabled = true;
    resetSheetBtn.disabled = true;

    currentStudents = [];
    selectedStatuses.clear();

    updateSummary();
}


/*
---------------------------------------------------
Load data
---------------------------------------------------
*/

async function loadPageData() {
    showEmptySheet(
        "Loading attendance",
        "Please wait while attendance information is loaded."
    );

    try {
        const [
            courseResponse,
            enrollmentResponse,
            attendanceResponse
        ] = await Promise.all([
            apiRequest("/courses"),
            apiRequest("/enrollments"),
            apiRequest("/attendance")
        ]);

        courses =
            Array.isArray(courseResponse.data)
                ? courseResponse.data
                : [];

        enrollments =
            Array.isArray(enrollmentResponse.data)
                ? enrollmentResponse.data
                : [];

        attendanceRecords =
            Array.isArray(attendanceResponse.data)
                ? attendanceResponse.data
                : [];

        populateCourseSelect();

        showEmptySheet();
        renderHistory();

    } catch (error) {
        console.error(
            "Attendance loading error:",
            error
        );

        showEmptySheet(
            "Unable to load attendance",
            error.message
        );

        showMessage(
            "danger",
            error.message
        );
    }
}


/*
---------------------------------------------------
Course dropdown
---------------------------------------------------
*/

function populateCourseSelect() {
    courseSelect.innerHTML = `
        <option value="">
            Choose a course
        </option>
    `;

    courses.forEach(course => {
        const option =
            document.createElement("option");

        option.value =
            getCourseId(course);

        option.textContent =
            `${course.CourseCode ??
            course.courseCode ??
            ""
            } - ${course.CourseName ??
            course.courseName ??
            ""
            }`;

        courseSelect.appendChild(option);
    });
}


/*
---------------------------------------------------
Students enrolled in course
---------------------------------------------------
*/

function getStudentsForCourse(courseId) {
    const students = new Map();

    enrollments
        .filter(
            enrollment =>
                Number(enrollment.CourseID) ===
                Number(courseId)
        )
        .forEach(enrollment => {
            const studentId =
                Number(enrollment.StudentID);

            if (!students.has(studentId)) {
                students.set(
                    studentId,
                    {
                        StudentID:
                            studentId,

                        RegistrationNumber:
                            enrollment.RegistrationNumber ??
                            enrollment.registrationNumber ??
                            "",

                        FullName:
                            enrollment.FullName ??
                            enrollment.fullName ??
                            ""
                    }
                );
            }
        });

    return Array.from(
        students.values()
    );
}


/*
---------------------------------------------------
Find an existing attendance record
---------------------------------------------------
*/

function findAttendanceRecord(
    studentId,
    courseId,
    date
) {
    return attendanceRecords.find(
        record =>
            getStudentId(record) ===
            Number(studentId) &&

            Number(record.CourseID) ===
            Number(courseId) &&

            toDateValue(
                record.AttendanceDate
            ) === date
    );
}


/*
---------------------------------------------------
Status button HTML
---------------------------------------------------
*/

function createStatusButton(
    studentId,
    status,
    currentStatus
) {
    const statusClass =
        status.toLowerCase();

    const activeClass =
        currentStatus === status
            ? "active"
            : "";

    return `
        <button
            type="button"
            class="status-btn btn-${statusClass} ${activeClass}"
            data-student-id="${studentId}"
            data-status="${status}"
        >
            ${status}
        </button>
    `;
}


/*
---------------------------------------------------
Attendance sheet
---------------------------------------------------
*/

function renderAttendanceSheet() {
    clearMessage();

    const courseId =
        Number(courseSelect.value);

    const date =
        attendanceDate.value;

    if (!courseId || !date) {
        showEmptySheet(
            "Select course and date",
            "Choose both a course and an attendance date."
        );

        renderHistory();
        return;
    }

    currentStudents =
        getStudentsForCourse(courseId);

    selectedStatuses.clear();

    if (currentStudents.length === 0) {
        showEmptySheet(
            "No enrolled students",
            "No students are enrolled in this course."
        );

        renderHistory();
        return;
    }

    currentStudents.forEach(student => {
        const existing =
            findAttendanceRecord(
                student.StudentID,
                courseId,
                date
            );

        selectedStatuses.set(
            student.StudentID,
            existing
                ? getStatus(existing)
                : ""
        );
    });

    attendanceSheetContainer.innerHTML = `
        <div class="table-responsive">
            <table class="table student-table align-middle">
                <thead>
                    <tr>
                        <th>Registration No.</th>
                        <th>Student Name</th>
                        <th>Status</th>
                    </tr>
                </thead>

                <tbody>
                    ${currentStudents.map(student => {
        const currentStatus =
            selectedStatuses.get(
                student.StudentID
            );

        return `
                            <tr>
                                <td>
                                    ${escapeHtml(
            student.RegistrationNumber
        )}
                                </td>

                                <td>
                                    ${escapeHtml(
            student.FullName
        )}
                                </td>

                                <td>
                                    <div class="status-btn-group">
                                        ${createStatusButton(
            student.StudentID,
            "Present",
            currentStatus
        )}

                                        ${createStatusButton(
            student.StudentID,
            "Late",
            currentStatus
        )}

                                        ${createStatusButton(
            student.StudentID,
            "Absent",
            currentStatus
        )}
                                    </div>
                                </td>
                            </tr>
                        `;
    }).join("")}
                </tbody>
            </table>
        </div>
    `;

    attendanceSheetContainer
        .querySelectorAll(".status-btn")
        .forEach(button => {
            button.addEventListener(
                "click",
                selectStatus
            );
        });

    saveAttendanceButton.disabled = false;
    markAllPresentBtn.disabled = false;
    resetSheetBtn.disabled = false;

    updateSummary();
    renderHistory();
}


/*
---------------------------------------------------
Select status
---------------------------------------------------
*/

function selectStatus(event) {
    const button =
        event.currentTarget;

    const studentId =
        Number(button.dataset.studentId);

    const status =
        button.dataset.status;

    selectedStatuses.set(
        studentId,
        status
    );

    button
        .closest(".status-btn-group")
        .querySelectorAll(".status-btn")
        .forEach(statusButton => {
            statusButton.classList.toggle(
                "active",
                statusButton === button
            );
        });

    updateSummary();
}


/*
---------------------------------------------------
Summary cards
---------------------------------------------------
*/

function updateSummary() {
    const statuses =
        Array.from(
            selectedStatuses.values()
        );

    const present =
        statuses.filter(
            status => status === "Present"
        ).length;

    const late =
        statuses.filter(
            status => status === "Late"
        ).length;

    const absent =
        statuses.filter(
            status => status === "Absent"
        ).length;

    presentCountValue.textContent = present;
    lateCountValue.textContent = late;
    absentCountValue.textContent = absent;

    const courseId =
        Number(courseSelect.value);

    const courseRecords =
        attendanceRecords.filter(
            record =>
                Number(record.CourseID) ===
                courseId
        );

    const totalPresent =
        courseRecords.filter(
            record =>
                getStatus(record) ===
                "Present"
        ).length;

    const rate =
        courseRecords.length > 0
            ? Math.round(
                totalPresent /
                courseRecords.length *
                100
            )
            : 0;

    avgAttendanceRateValue.textContent =
        `${rate}%`;
}


/*
---------------------------------------------------
Mark all present
---------------------------------------------------
*/

function markAllPresent() {
    currentStudents.forEach(student => {
        selectedStatuses.set(
            student.StudentID,
            "Present"
        );
    });

    attendanceSheetContainer
        .querySelectorAll(".status-btn")
        .forEach(button => {
            button.classList.toggle(
                "active",
                button.dataset.status ===
                "Present"
            );
        });

    updateSummary();
}


/*
---------------------------------------------------
Save attendance
---------------------------------------------------
*/

async function saveAttendance() {
    const courseId =
        Number(courseSelect.value);

    const date =
        attendanceDate.value;

    if (!courseId || !date) {
        showMessage(
            "warning",
            "Select a course and date first."
        );

        return;
    }

    const incompleteStudents =
        currentStudents.filter(
            student =>
                !selectedStatuses.get(
                    student.StudentID
                )
        );

    if (incompleteStudents.length > 0) {
        showMessage(
            "warning",
            "Select a status for every student."
        );

        return;
    }

    setSaving(true);
    clearMessage();

    try {
        for (const student of currentStudents) {
            const existing =
                findAttendanceRecord(
                    student.StudentID,
                    courseId,
                    date
                );

            const requestBody = {
                studentId:
                    student.StudentID,

                courseId,

                attendanceDate:
                    date,

                status:
                    selectedStatuses.get(
                        student.StudentID
                    )
            };

            if (existing) {
                await apiRequest(
                    `/attendance/${getAttendanceId(existing)}`,
                    {
                        method: "PUT",
                        body: JSON.stringify(
                            requestBody
                        )
                    }
                );
            } else {
                await apiRequest(
                    "/attendance",
                    {
                        method: "POST",
                        body: JSON.stringify(
                            requestBody
                        )
                    }
                );
            }
        }

        const response =
            await apiRequest("/attendance");

        attendanceRecords =
            Array.isArray(response.data)
                ? response.data
                : [];

        renderAttendanceSheet();

        showMessage(
            "success",
            "Attendance saved successfully."
        );

    } catch (error) {
        console.error(
            "Attendance save error:",
            error
        );

        showMessage(
            "danger",
            error.message
        );

    } finally {
        setSaving(false);
    }
}

function setSaving(saving) {
    saveAttendanceButton.disabled =
        saving;

    saveButtonText.textContent =
        saving
            ? "Saving..."
            : "Save Attendance";

    saveSpinner.classList.toggle(
        "d-none",
        !saving
    );
}


/*
---------------------------------------------------
Attendance history
---------------------------------------------------
*/

function renderHistory() {
    const courseId =
        Number(courseSelect.value);

    if (!courseId) {
        attendanceHistoryTableBody.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    class="text-center py-4 text-muted"
                >
                    Select a course to view its attendance history logs.
                </td>
            </tr>
        `;

        return;
    }

    const course =
        courses.find(
            item =>
                getCourseId(item) ===
                courseId
        );

    const courseRecords =
        attendanceRecords.filter(
            record =>
                Number(record.CourseID) ===
                courseId
        );

    if (courseRecords.length === 0) {
        attendanceHistoryTableBody.innerHTML = `
            <tr>
                <td
                    colspan="6"
                    class="text-center py-4 text-muted"
                >
                    No attendance history exists for this course.
                </td>
            </tr>
        `;

        return;
    }

    const recordsByDate = new Map();

    courseRecords.forEach(record => {
        const date =
            toDateValue(
                record.AttendanceDate
            );

        if (!recordsByDate.has(date)) {
            recordsByDate.set(
                date,
                []
            );
        }

        recordsByDate
            .get(date)
            .push(record);
    });

    const totalEnrolled =
        getStudentsForCourse(
            courseId
        ).length;

    attendanceHistoryTableBody.innerHTML =
        Array.from(
            recordsByDate.entries()
        )
            .sort(
                ([dateA], [dateB]) =>
                    dateB.localeCompare(dateA)
            )
            .map(([date, records]) => {
                const present =
                    records.filter(
                        record =>
                            getStatus(record) ===
                            "Present"
                    ).length;

                const absent =
                    records.filter(
                        record =>
                            getStatus(record) ===
                            "Absent"
                    ).length;

                const late =
                    records.filter(
                        record =>
                            getStatus(record) ===
                            "Late"
                    ).length;

                const rate =
                    records.length > 0
                        ? Math.round(
                            present /
                            records.length *
                            100
                        )
                        : 0;

                return `
                    <tr>
                        <td>${formatDate(date)}</td>

                        <td>
                            <strong>
                                ${escapeHtml(
                    course?.CourseCode || ""
                )}
                            </strong>

                            <div class="small text-muted">
                                ${escapeHtml(
                    course?.CourseName || ""
                )}
                            </div>
                        </td>

                        <td>${totalEnrolled}</td>

                        <td>${rate}%</td>

                        <td>
                            <span class="badge-absent">
                                ${absent} absent
                            </span>

                            <span class="badge-late ms-1">
                                ${late} late
                            </span>
                        </td>

                        <td>
                            <button
                                type="button"
                                class="btn btn-sm btn-outline-primary view-history"
                                data-date="${date}"
                            >
                                View
                            </button>
                        </td>
                    </tr>
                `;
            })
            .join("");

    attendanceHistoryTableBody
        .querySelectorAll(".view-history")
        .forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    attendanceDate.value =
                        button.dataset.date;

                    renderAttendanceSheet();
                }
            );
        });
}


/*
---------------------------------------------------
Sidebar and logout
---------------------------------------------------
*/

function openSidebar() {
    sidebar?.classList.add("show");
    sidebarOverlay?.classList.add("show");
    document.body.style.overflow =
        "hidden";
}

function closeSidebar() {
    sidebar?.classList.remove("show");
    sidebarOverlay?.classList.remove("show");
    document.body.style.overflow =
        "";
}

function handleLogout() {
    if (
        typeof window.clearSession ===
        "function"
    ) {
        window.clearSession();
    } else {
        clearSession();
    }

    window.location.replace("login.html");
}


/*
---------------------------------------------------
Events
---------------------------------------------------
*/

courseSelect.addEventListener(
    "change",
    renderAttendanceSheet
);

attendanceDate.addEventListener(
    "change",
    renderAttendanceSheet
);

markAllPresentBtn.addEventListener(
    "click",
    markAllPresent
);

resetSheetBtn.addEventListener(
    "click",
    renderAttendanceSheet
);

saveAttendanceButton.addEventListener(
    "click",
    saveAttendance
);

mobileMenuButton?.addEventListener(
    "click",
    openSidebar
);

sidebarCloseButton?.addEventListener(
    "click",
    closeSidebar
);

sidebarOverlay?.addEventListener(
    "click",
    closeSidebar
);

sidebarLogoutButton?.addEventListener(
    "click",
    handleLogout
);

topLogoutButton?.addEventListener(
    "click",
    handleLogout
);


/*
---------------------------------------------------
Initial page load
---------------------------------------------------
*/

document.addEventListener(
    "DOMContentLoaded",
    () => {
        if (!getToken()) {
            redirectToLogin();
            return;
        }

        attendanceDate.value =
            new Date()
                .toISOString()
                .split("T")[0];

        loadUserInformation();
        loadPageData();
    }
);