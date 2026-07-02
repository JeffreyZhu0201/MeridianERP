export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
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

export function asList<T>(
  response: PortalPaginatedResponse<T> | T[] | null | undefined,
): T[] {
  if (Array.isArray(response)) return response;
  if (response?.data && Array.isArray(response.data)) return response.data;
  if (response?.items && Array.isArray(response.items)) return response.items;
  return [];
}

export function asListTotal<T>(
  response: PortalPaginatedResponse<T> | T[] | null | undefined,
): number {
  if (Array.isArray(response)) return response.length;
  if (response?.meta?.total != null) return response.meta.total;
  if (response?.total != null) return response.total;
  return asList(response).length;
}
