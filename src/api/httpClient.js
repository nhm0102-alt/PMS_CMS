const toQueryString = (params = {}) => {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
        if (v === undefined || v === null || v === "") return;
        sp.set(k, String(v));
    });
    const s = sp.toString();
    return s ? `?${s}` : "";
};

const API_BASE_URL = (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_BASE_URL) || "";

const buildUrl = (path, query) => {
    const qs = toQueryString(query);
    if (!path) return qs;
    if (path.startsWith("http://") || path.startsWith("https://")) {
        return `${path}${qs}`;
    }
    const base = API_BASE_URL ? API_BASE_URL.trim().replace(/\/+$/, "") : "";
    const p0 = typeof path === "string" ? path.trim() : String(path);
    const p = p0.startsWith("/") ? p0 : `/${p0}`;
    return `${base}${p}${qs}`;
};

const getToken = () => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem("token") || window.localStorage.getItem("base44_access_token");
};

export const http = {
    async request(path, { method = "GET", query, body, headers } = {}) {
        const token = getToken();
        const res = await fetch(buildUrl(path, query), {
            method,
            headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                ...(headers || {}),
            },
            body: body === undefined ? undefined : JSON.stringify(body),
        });

        if (res.status === 204) return null;
        const data = await res.json().catch(() => null);

        if (!res.ok) {
            const message = data?.message || data?.error || `Request failed (${res.status})`;
            throw new Error(message);
        }
        return data;
    },
};

export const buildApiUrl = (path, query) => buildUrl(path, query);
