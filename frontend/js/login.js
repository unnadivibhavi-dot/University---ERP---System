"use strict";

const API_BASE_URL = "http://localhost:5001/api";

const loginForm = document.getElementById("loginForm");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const usernameError = document.getElementById("usernameError");
const passwordError = document.getElementById("passwordError");
const loginMessage = document.getElementById("loginMessage");
const loginButton = document.getElementById("loginButton");
const loginButtonText = document.getElementById("loginButtonText");
const loginSpinner = document.getElementById("loginSpinner");
const togglePassword = document.getElementById("togglePassword");
const passwordToggleIcon = document.getElementById("passwordToggleIcon");
const rememberMe = document.getElementById("rememberMe");

window.addEventListener("DOMContentLoaded", () => {
    const savedUsername = localStorage.getItem("rememberedUsername");

    if (savedUsername) {
        usernameInput.value = savedUsername;
        rememberMe.checked = true;
    }
});

togglePassword.addEventListener("click", () => {
    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        passwordToggleIcon.classList.remove("bi-eye");
        passwordToggleIcon.classList.add("bi-eye-slash");
    } else {
        passwordInput.type = "password";
        passwordToggleIcon.classList.remove("bi-eye-slash");
        passwordToggleIcon.classList.add("bi-eye");
    }
});

function validateForm() {
    let valid = true;

    usernameError.textContent = "";
    passwordError.textContent = "";
    loginMessage.innerHTML = "";

    if (usernameInput.value.trim() === "") {
        usernameError.textContent = "Username is required.";
        valid = false;
    }

    if (passwordInput.value.trim() === "") {
        passwordError.textContent = "Password is required.";
        valid = false;
    }

    return valid;
}

function getRedirectPage(role) {
    const normalizedRole = String(role || "").toLowerCase();

    if (normalizedRole === "admin") {
        return "dashboard.html";
    }

    if (normalizedRole === "lecturer") {
        return "lecturer-dashboard.html";
    }

    if (normalizedRole === "student") {
        return "student-dashboard.html";
    }

    return "dashboard.html";
}

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!validateForm()) return;

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    loginButton.disabled = true;
    loginButtonText.textContent = "Signing In...";
    loginSpinner.classList.remove("d-none");

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username,
                password
            })
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || "Invalid username or password.");
        }

        if (rememberMe.checked) {
            localStorage.setItem("rememberedUsername", username);
        } else {
            localStorage.removeItem("rememberedUsername");
        }

        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("authToken", result.token);
        localStorage.setItem("token", result.token);
        localStorage.setItem("loggedUser", JSON.stringify(result.user));
        localStorage.setItem("userRole", result.user.role);

        loginMessage.innerHTML = `
            <div class="alert alert-success">
                Login Successful. Redirecting...
            </div>
        `;

        setTimeout(() => {
            window.location.href = getRedirectPage(result.user.role);
        }, 800);
    } catch (error) {
        loginMessage.innerHTML = `
            <div class="alert alert-danger">
                ${error.message}
            </div>
        `;

        loginButton.disabled = false;
        loginButtonText.textContent = "Sign In";
        loginSpinner.classList.add("d-none");
    }
});
