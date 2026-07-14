"use strict";

const API_BASE_URL = "http://localhost:5001/api";

function buildApiUrl(endpoint) {
    const cleanEndpoint = endpoint.startsWith("/")
        ? endpoint
        : `/${endpoint}`;

    return `${API_BASE_URL}${cleanEndpoint}`;
}

function getToken() {
    return localStorage.getItem("token");
}

function clearSession() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("loggedUser");
}

function redirectToLogin() {
    clearSession();

    if (!window.location.pathname.endsWith("login.html")) {
        window.location.href = "login.html";
    }
}

async function readApiResponse(response) {
    const text = await response.text();

    if (!text) {
        return {};
    }

    try {
        return JSON.parse(text);
    } catch {
        return {
            message: text
        };
    }
}

async function fetchWithAuth(endpoint, options = {}) {
    const token = getToken();

    if (!token) {
        redirectToLogin();
        throw new Error("Login token missing.");
    }

    const headers = new Headers(options.headers || {});

    headers.set("Authorization", `Bearer ${token}`);

    if (
        options.body &&
        !(options.body instanceof FormData) &&
        !headers.has("Content-Type")
    ) {
        headers.set("Content-Type", "application/json");
    }

    const response = await fetch(buildApiUrl(endpoint), {
        ...options,
        headers
    });

    const data = await readApiResponse(response);

    if (response.status === 401 || response.status === 403) {
        redirectToLogin();
        throw new Error(data.message || "Session expired.");
    }

    if (!response.ok) {
        throw new Error(
            data.message ||
            data.error ||
            `Request failed with status ${response.status}`
        );
    }

    return data;
}

window.ERP_CONFIG = {
    API_BASE_URL,
    buildApiUrl
};

window.fetchWithAuth = fetchWithAuth;
window.clearSession = clearSession;
window.getToken = getToken;