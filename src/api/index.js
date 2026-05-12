import { invoicesApi } from "./invoices";
import { createEntityApi } from "./entitiesClient";
import { buildApiUrl, http } from "./httpClient";

export const api = {
    invoices: invoicesApi,
    properties: createEntityApi("/properties"),
    roomTypes: createEntityApi("/room-types"),
    rooms: createEntityApi("/rooms"),
    guests: createEntityApi("/guests"),
    reservations: createEntityApi("/reservations"),
    policies: createEntityApi("/policies"),
    ratePlans: createEntityApi("/rate-plans"),
    folioTransactions: createEntityApi("/folio-transactions"),
    userProperties: createEntityApi("/user-properties"),
    licenseTransactions: createEntityApi("/license-transactions"),
    users: {
        ...createEntityApi("/users"),
        inviteUser(email, role) {
            return http.request("/api/users/invite", {
                method: "POST",
                body: { email, role },
            });
        },
    },
    auth: {
        me() {
            return http.request("/api/auth/me");
        },
        logout() {
            if (typeof window !== "undefined") {
                window.localStorage.removeItem("token");
                window.localStorage.removeItem("base44_access_token");
            }
        },
    },
    integrations: {
        async uploadFile(file) {
            const fd = new FormData();
            fd.append("file", file);
            const res = await fetch(buildApiUrl("/integrations/Core/UploadFile"), {
                method: "POST",
                body: fd,
            });
            const data = await res.json().catch(() => null);
            if (!res.ok) {
                throw new Error(data?.message || data?.error || `Request failed (${res.status})`);
            }
            return data;
        },
    },
};
