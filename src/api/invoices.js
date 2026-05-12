import { http } from "./httpClient";

export const invoicesApi = {
    list({ propertyId, sortBy = "-created_date", limit = 100, skip, status } = {}) {
        return http.request("/invoices", {
            query: {
                property_id: propertyId,
                sort_by: sortBy,
                limit,
                skip,
                status,
            },
        });
    },

    create(payload) {
        return http.request("/invoices", { method: "POST", body: payload });
    },

    update(id, patch) {
        return http.request(`/invoices/${id}`, { method: "PUT", body: patch });
    },

    delete(id) {
        return http.request(`/invoices/${id}`, { method: "DELETE" });
    },
};

