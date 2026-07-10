"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiError = void 0;
exports.asList = asList;
exports.asListTotal = asListTotal;
class ApiError extends Error {
    status;
    details;
    constructor(status, message, details) {
        super(message);
        this.status = status;
        this.details = details;
        this.name = 'ApiError';
    }
}
exports.ApiError = ApiError;
function asList(response) {
    if (Array.isArray(response))
        return response;
    if (response?.data && Array.isArray(response.data))
        return response.data;
    if (response?.items && Array.isArray(response.items))
        return response.items;
    return [];
}
function asListTotal(response) {
    if (Array.isArray(response))
        return response.length;
    if (response?.meta?.total != null)
        return response.meta.total;
    if (response?.total != null)
        return response.total;
    return asList(response).length;
}
//# sourceMappingURL=frontend-api.js.map