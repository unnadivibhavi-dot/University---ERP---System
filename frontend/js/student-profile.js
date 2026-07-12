"use strict";

const mockStudent = {
    studentId: "STU2026001",
    firstName: "Vibhavi",
    lastName: "Kahandawaarachchi",
    email: "vibhavi@student.university.lk",
    phone: "0771234567",
    programme: "BSc (Hons) in Software Engineering",
    faculty: "Faculty of Computing",
    semester: "Semester 02",
    academicYear: "2026",
    address: "Gampaha, Sri Lanka"
};

let originalProfile = { ...mockStudent };
let isEditing = false;

const editableFields = [
    "email",
    "phone",
    "address"
];

const studentSidebar =
    document.getElementById("studentSidebar");

const sidebarOverlay =
    document.getElementById("sidebarOverlay");

const loadingOverlay =
    document.getElementById("loadingOverlay");

const editProfileButton =
    document.getElementById("editProfileButton");

const cancelButton =
    document.getElementById("cancelButton");

const profileForm =
    document.getElementById("profileForm");

const formActions =
    document.getElementById("formActions");

const formStatusMessage =
    document.getElementById("formStatusMessage");

document.addEventListener(
    "DOMContentLoaded",
    function () {
        displayDate();
        loadProfile();
        initializeSidebar();
        initializeProfileEditing();
        initializeLogout();

        setTimeout(function () {
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

function loadProfile() {
    const savedProfile =
        localStorage.getItem("studentProfile");

    if (savedProfile) {
        try {
            originalProfile = {
                ...mockStudent,
                ...JSON.parse(savedProfile)
            };
        } catch (error) {
            console.error("Invalid saved profile:", error);
        }
    }

    renderProfile(originalProfile);
}

function renderProfile(student) {
    const fullName =
        `${student.firstName} ${student.lastName}`.trim();

    const initials =
        `${student.firstName[0]}${student.lastName[0]}`
            .toUpperCase();

    document.getElementById("sidebarAvatar").textContent =
        initials;

    document.getElementById("topAvatar").textContent =
        initials;

    document.getElementById("largeAvatar").textContent =
        initials;

    document.getElementById("sidebarStudentName").textContent =
        fullName;

    document.getElementById("topStudentName").textContent =
        fullName;

    document.getElementById("profileName").textContent =
        fullName;

    document.getElementById("sidebarStudentId").textContent =
        student.studentId;

    document.getElementById("topStudentId").textContent =
        student.studentId;

    document.getElementById("profileStudentId").textContent =
        student.studentId;

    document.getElementById("profileProgramme").textContent =
        student.programme;

    document.getElementById("studentId").value =
        student.studentId;

    document.getElementById("fullName").value =
        fullName;

    document.getElementById("email").value =
        student.email;

    document.getElementById("phone").value =
        student.phone;

    document.getElementById("programme").value =
        student.programme;

    document.getElementById("faculty").value =
        student.faculty;

    document.getElementById("semester").value =
        student.semester;

    document.getElementById("academicYear").value =
        student.academicYear;

    document.getElementById("address").value =
        student.address;
}

function initializeProfileEditing() {
    editProfileButton.addEventListener(
        "click",
        enableEditing
    );

    cancelButton.addEventListener(
        "click",
        cancelEditing
    );

    profileForm.addEventListener(
        "submit",
        saveProfile
    );
}

function enableEditing() {
    isEditing = true;

    editableFields.forEach(function (fieldId) {
        document
            .getElementById(fieldId)
            .removeAttribute("disabled");
    });

    formActions.classList.remove("d-none");

    editProfileButton.disabled = true;
    formStatusMessage.textContent = "";
}

function cancelEditing() {
    isEditing = false;

    renderProfile(originalProfile);
    disableEditableFields();

    formActions.classList.add("d-none");

    editProfileButton.disabled = false;
    formStatusMessage.textContent = "";
}

function saveProfile(event) {
    event.preventDefault();

    const email =
        document.getElementById("email")
            .value
            .trim();

    const phone =
        document.getElementById("phone")
            .value
            .trim();

    const address =
        document.getElementById("address")
            .value
            .trim();

    if (!email || !phone || !address) {
        formStatusMessage.style.color = "#dc2626";
        formStatusMessage.textContent =
            "Please complete all editable fields.";

        return;
    }

    originalProfile = {
        ...originalProfile,
        email,
        phone,
        address
    };

    localStorage.setItem(
        "studentProfile",
        JSON.stringify(originalProfile)
    );

    renderProfile(originalProfile);
    disableEditableFields();

    formActions.classList.add("d-none");

    editProfileButton.disabled = false;
    isEditing = false;

    formStatusMessage.style.color = "#16a34a";
    formStatusMessage.textContent =
        "Profile updated successfully.";
}

function disableEditableFields() {
    editableFields.forEach(function (fieldId) {
        document
            .getElementById(fieldId)
            .setAttribute("disabled", "");
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
                localStorage.removeItem("token");
                localStorage.removeItem("authToken");
                localStorage.removeItem("loggedUser");
                localStorage.removeItem("isLoggedIn");

                window.location.href = "login.html";
            }
        );
}