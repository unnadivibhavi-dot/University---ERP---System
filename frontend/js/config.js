"use strict";

/*
---------------------------------------------------
EDUPortal
Shared Frontend API Configuration
---------------------------------------------------
*/

(() => {
    const API_BASE_URL = "https://university-erp-api-eduportal.azurewebsites.net/api";

    function buildApiUrl(endpoint) {
        const cleanEndpoint = endpoint.startsWith("/")
            ? endpoint
            : `/${endpoint}`;

        return `${API_BASE_URL}${cleanEndpoint}`;
    }

    async function readApiResponse(response) {
        const responseText = await response.text();

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

    function storeSession(token, user) {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));

        /*
        Temporary support for older frontend pages.
        Remove these only after every dashboard is updated.
        */

        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("loggedUser", JSON.stringify(user));
    }

    function clearSession() {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("isLoggedIn");
        localStorage.removeItem("loggedUser");
    }

    function getToken() {
        return localStorage.getItem("token");
    }

    function getStoredUser() {
        const storedUser = localStorage.getItem("user");

        if (!storedUser) {
            return null;
        }

        try {
            return JSON.parse(storedUser);
        } catch (error) {
            console.error("Invalid stored user information:", error);
            return null;
        }
    }

    function redirectToLogin() {
        clearSession();

        if (!window.location.pathname.endsWith("/login.html")) {
            window.location.replace("login.html");
        }
    }

    async function fetchWithAuth(endpoint, options = {}) {
        const token = getToken();

        if (!token) {
            redirectToLogin();

            throw new Error(
                "Authentication token is missing. Please sign in again."
            );
        }

        const headers = new Headers(options.headers || {});

        headers.set(
            "Authorization",
            `Bearer ${token}`
        );

        if (
            options.body &&
            !(options.body instanceof FormData) &&
            !headers.has("Content-Type")
        ) {
            headers.set(
                "Content-Type",
                "application/json"
            );
        }

        try {
            const response = await fetch(
                buildApiUrl(endpoint),
                {
                    ...options,
                    headers
                }
            );

            const data = await readApiResponse(response);

            if (
                response.status === 401 ||
                response.status === 403
            ) {
                redirectToLogin();

                throw new Error(
                    data.message ||
                    "Your session has expired. Please sign in again."
                );
            }

            if (!response.ok) {
                throw new Error(
                    data.message ||
                    data.error ||
                    `Request failed with status ${response.status}.`
                );
            }

            return data;

        } catch (error) {
            if (error instanceof TypeError) {
                throw new Error(
                    "Unable to connect to the backend server."
                );
            }

            throw error;
        }
    }

    function logoutUser() {
        clearSession();
        window.location.replace("login.html");
    }

    window.ERP_CONFIG = Object.freeze({
        API_BASE_URL,
        buildApiUrl
    });

    window.storeSession = storeSession;
    window.clearSession = clearSession;
    window.getToken = getToken;
    window.getStoredUser = getStoredUser;
    window.redirectToLogin = redirectToLogin;
    window.fetchWithAuth = fetchWithAuth;
    window.logoutUser = logoutUser;
})();