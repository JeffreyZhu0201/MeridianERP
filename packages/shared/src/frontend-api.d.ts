export declare class ApiError extends Error {
    status: number;
    details?: unknown | undefined;
    constructor(status: number, message: string, details?: unknown | undefined);
}
export interface PortalPaginatedResponse<T> {
    data?: T[];
    items?: T[];
    total?: number;
    page?: number;
    limit?: number;
    meta?: {
        total?: number;
        page?: number;
        limit?: number;
    };
}
export declare function asList<T>(response: PortalPaginatedResponse<T> | T[] | null | undefined): T[];
export declare function asListTotal<T>(response: PortalPaginatedResponse<T> | T[] | null | undefined): number;
