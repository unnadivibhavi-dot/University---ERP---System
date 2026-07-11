"use strict";

/*
---------------------------------------------------
University ERP System
Frontend Login Module
(Currently uses localStorage)

Later this file will connect to:

POST /api/auth/login

without changing much code.
---------------------------------------------------
*/

const loginForm = document.getElementById("loginForm");

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

/*
---------------------------------------------------
Demo Account
(Will be removed later)

Username : admin

Password : admin123
---------------------------------------------------
*/

const demoUser = {

    username: "admin",

    password: "admin123",

    role: "Administrator"

};

/*
---------------------------------------------------
Load remembered username
---------------------------------------------------
*/

window.addEventListener("DOMContentLoaded", () => {

    const savedUsername =
        localStorage.getItem("rememberedUsername");

    if (savedUsername) {

        usernameInput.value = savedUsername;

        rememberMe.checked = true;

    }

});

/*
---------------------------------------------------
Show Hide Password
---------------------------------------------------
*/

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

/*
---------------------------------------------------
Form Validation
---------------------------------------------------
*/

function validateForm() {

    let valid = true;

    usernameError.textContent = "";

    passwordError.textContent = "";

    loginMessage.innerHTML = "";

    if (usernameInput.value.trim() === "") {

        usernameError.textContent =
            "Username is required.";

        valid = false;

    }

    if (passwordInput.value.trim() === "") {

        passwordError.textContent =
            "Password is required.";

        valid = false;

    }

    return valid;

}

/*
---------------------------------------------------
Login
---------------------------------------------------
*/

loginForm.addEventListener("submit", (event) => {

    event.preventDefault();

    if (!validateForm()) return;

    loginButton.disabled = true;

    loginButtonText.textContent = "Signing In...";

    loginSpinner.classList.remove("d-none");

    setTimeout(() => {

        const username =
            usernameInput.value.trim();

        const password =
            passwordInput.value.trim();

        if (

            username === demoUser.username &&

            password === demoUser.password

        ) {

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

            /*
            Logged User

            Later

            JWT Token

            Role

            User Details

            will come from Backend
            */

            localStorage.setItem(

                "isLoggedIn",

                "true"

            );

            localStorage.setItem(

                "loggedUser",

                JSON.stringify({

                    username,

                    role: demoUser.role

                })

            );

            loginMessage.innerHTML = `

                <div class="alert alert-success">

                    Login Successful.

                    Redirecting...

                </div>

            `;

            setTimeout(() => {

                window.location.href =
                    "dashboard.html";

            }, 1000);

        }

        else {

            loginMessage.innerHTML = `

                <div class="alert alert-danger">

                    Invalid username or password.

                </div>

            `;

            loginButton.disabled = false;

            loginButtonText.textContent =
                "Sign In";

            loginSpinner.classList.add("d-none");

        }

    }, 1000);

});