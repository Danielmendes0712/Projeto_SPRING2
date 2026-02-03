const BASE_URL = "http://localhost:8080";

export function getToken() {
    return localStorage.getItem("token");
}
export function setToken(token) {
    localStorage.setItem("token", token);
}
export function clearToken() {
    localStorage.removeItem("token");
}

export async function api(path, { method = "GET", body } = {}) {
    const token = getToken();
    const isAuthEndpoint = path.startsWith("/api/auth/");

    const headers = { "Content-Type": "application/json" };
    if (!isAuthEndpoint && token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(`${BASE_URL}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `HTTP ${res.status}`);
    }

    // Se não tem corpo, retorna null
    if (res.status === 204) return null;

    const contentLength = res.headers.get("content-length");
    if (contentLength === "0") return null;

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
        const text = await res.text().catch(() => "");
        return text || null;
    }

    const text = await res.text();
    return text ? JSON.parse(text) : null;
}
