"use strict";

/*
---------------------------------------------------
EDUPortal
Backend Authentication Login Module
---------------------------------------------------
*/

const loginForm =
    document.getElementById("loginForm");

const usernameInput =
    document.getElementById("username");

const passwordInput =
    document.getElementById("password");

const usernameError =
    document.getElementById("usernameError");

const passwordError =
    document.getElementById("passwordError");

const loginMessage =
    document.getElementById("loginMessage");

const loginButton =
    document.getElementById("loginButton");

const loginButtonText =
    document.getElementById("loginButtonText");

const loginSpinner =
    document.getElementById("loginSpinner");

const togglePassword =
    document.getElementById("togglePassword");

const passwordToggleIcon =
    document.getElementById("passwordToggleIcon");

const rememberMe =
    document.getElementById("rememberMe");

const forgotPasswordButton =
    document.getElementById("forgotPasswordButton");

const contactSupportButton =
    document.getElementById("contactSupportButton");

const registerButton =
    document.getElementById("registerButton");


if (
    !window.ERP_CONFIG ||
    typeof window.ERP_CONFIG.buildApiUrl !== "function"
) {
    throw new Error(
        "config.js must be loaded before login.js."
    );
}


function showLoginMessage(type, message) {
    loginMessage.replaceChildren();

    const alertElement =
        document.createElement("div");

    alertElement.className =
        `alert alert-${type}`;

    alertElement.textContent = message;

    loginMessage.appendChild(alertElement);
}


function clearLoginMessage() {
    loginMessage.replaceChildren();
}


function setLoginButtonLoading(loading) {
    loginButton.disabled = loading;

    loginButtonText.textContent =
        loading
            ? "Signing In..."
            : "Sign In";

    loginSpinner.classList.toggle(
        "d-none",
        !loading
    );
}


function validateForm() {
    let valid = true;

    usernameError.textContent = "";
    passwordError.textContent = "";
    clearLoginMessage();

    if (usernameInput.value.trim() === "") {
        usernameError.textContent =
            "Username is required.";

        valid = false;
    }

    if (passwordInput.value === "") {
        passwordError.textContent =
            "Password is required.";

        valid = false;
    }

    return valid;
}


function saveRememberedUsername(username) {
    if (rememberMe.checked) {
        localStorage.setItem(
            "rememberedUsername",
            username
        );
    } else {
        localStorage.removeItem(
            "rememberedUsername"
        );
    }
}


function normalizeUser(responseData, username) {
    const backendUser =
        responseData.user || {};

    return {
        id:
            backendUser.id ??
            backendUser.userId ??
            backendUser.UserID ??
            responseData.userId ??
            null,

        username:
            backendUser.username ??
            backendUser.Username ??
            responseData.username ??
            username,

        role:
            String(
                backendUser.role ??
                backendUser.Role ??
                responseData.role ??
                responseData.Role ??
                ""
            ).trim()
    };
}


function getDashboardForRole(role) {
    switch (
    String(role)
        .trim()
        .toLowerCase()
    ) {
        case "admin":
        case "administrator":
        case "system admin":
            return "dashboard.html";

        case "lecturer":
            return "lecturer-dashboard.html";

        case "student":
            return "student-dashboard.html";

        default:
            return null;
    }
}


async function readLoginResponse(response) {
    const responseText =
        await response.text();

    if (!responseText) {
        return {};
    }

    try {
        return JSON.parse(responseText);
    } catch (error) {
        return {
            message: responseText
        };
    }
}


window.addEventListener(
    "DOMContentLoaded",
    () => {
        const savedUsername =
            localStorage.getItem(
                "rememberedUsername"
            );

        if (savedUsername) {
            usernameInput.value =
                savedUsername;

            rememberMe.checked = true;
        }
    }
);


usernameInput.addEventListener(
    "input",
    () => {
        usernameError.textContent = "";
        clearLoginMessage();
    }
);


passwordInput.addEventListener(
    "input",
    () => {
        passwordError.textContent = "";
        clearLoginMessage();
    }
);


togglePassword.addEventListener(
    "click",
    () => {
        const passwordIsHidden =
            passwordInput.type === "password";

        passwordInput.type =
            passwordIsHidden
                ? "text"
                : "password";

        passwordToggleIcon.classList.toggle(
            "bi-eye",
            !passwordIsHidden
        );

        passwordToggleIcon.classList.toggle(
            "bi-eye-slash",
            passwordIsHidden
        );

        togglePassword.setAttribute(
            "aria-label",
            passwordIsHidden
                ? "Hide password"
                : "Show password"
        );
    }
);


loginForm.addEventListener(
    "submit",
    async (event) => {
        event.preventDefault();

        if (!validateForm()) {
            return;
        }

        const username =
            usernameInput.value.trim();

        const password =
            passwordInput.value;

        setLoginButtonLoading(true);

        try {
            clearSession();

            const response = await fetch(
                window.ERP_CONFIG.buildApiUrl(
                    "/auth/login"
                ),
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        username,
                        password
                    })
                }
            );

            const responseData =
                await readLoginResponse(response);

            if (!response.ok) {
                throw new Error(
                    responseData.message ||
                    "Invalid username or password."
                );
            }

            const token =
                responseData.token ??
                responseData.accessToken;

            if (!token) {
                throw new Error(
                    "The backend did not return an authentication token."
                );
            }

            const authenticatedUser =
                normalizeUser(
                    responseData,
                    username
                );

            if (!authenticatedUser.role) {
                throw new Error(
                    "The backend did not return the user role."
                );
            }

            const dashboardPage =
                getDashboardForRole(
                    authenticatedUser.role
                );

            if (!dashboardPage) {
                throw new Error(
                    `Unsupported role: ${authenticatedUser.role}`
                );
            }

            saveRememberedUsername(username);

            storeSession(
                token,
                authenticatedUser
            );

            showLoginMessage(
                "success",
                "Login successful. Redirecting..."
            );

            window.setTimeout(
                () => {
                    window.location.replace(
                        dashboardPage
                    );
                },
                600
            );

        } catch (error) {
            console.error(
                "Login failed:",
                error
            );

            let message =
                error.message ||
                "Unable to sign in.";

            if (error instanceof TypeError) {
                message =
                    "Unable to connect to the backend. Make sure the backend is running on port 5001.";
            }

            showLoginMessage(
                "danger",
                message
            );

            setLoginButtonLoading(false);
        }
    }
);


forgotPasswordButton?.addEventListener(
    "click",
    () => {
        showLoginMessage(
            "info",
            "Please contact the system administrator to reset your password."
        );
    }
);


contactSupportButton?.addEventListener(
    "click",
    () => {
        showLoginMessage(
            "info",
            "Please contact your university support team."
        );
    }
);


registerButton?.addEventListener(
    "click",
    () => {
        showLoginMessage(
            "info",
            "New accounts are created by the administrator."
        );
    }
);