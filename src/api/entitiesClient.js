import { http } from "./httpClient";

export const createEntityApi = (basePath) => ({
    list(sortBy = "-created_date", limit = 100, skip) {
        return http.request(basePath, {
            query: {
                sort_by: sortBy,
                limit,
                skip,
            },
        });
    },

    filter(q, sortBy = "-created_date", limit = 100, skip) {
        return http.request(basePath, {
            query: {
                ...(q || {}),
                sort_by: sortBy,
                limit,
                skip,
            },
        });
    },

    get(id) {
        return http.request(`${basePath}/${id}`);
    },

    create(payload) {
        return http.request(basePath, { method: "POST", body: payload });
    },

    update(id, patch) {
        return http.request(`${basePath}/${id}`, { method: "PUT", body: patch });
    },

    delete(id) {
        return http.request(`${basePath}/${id}`, { method: "DELETE" });
    },

    deleteMany(filter) {
        return http.request(basePath, { method: "DELETE", body: filter || {} });
    },

    bulkCreate(items) {
        return http.request(`${basePath}/bulk`, { method: "POST", body: items || [] });
    },

    restore(id) {
        return http.request(`${basePath}/${id}/restore`, { method: "PUT" });
    },
});
