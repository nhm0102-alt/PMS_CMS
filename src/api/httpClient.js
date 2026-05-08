const toQueryString = (params = {}) => {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
        if (v === undefined || v === null || v === "") return;
        sp.set(k, String(v));
    });
    const s = sp.toString();
    return s ? `?${s}` : "";
};

const getToken = () => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem("token") || window.localStorage.getItem("base44_access_token");
};

export const http = {
    async request(path, { method = "GET", query, body, headers } = {}) {
        const token = getToken();
        const res = await fetch(`${path}${toQueryString(query)}`, {
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
