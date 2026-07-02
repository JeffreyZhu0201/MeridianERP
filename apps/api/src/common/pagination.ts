export interface PaginationInput {
  page?: number;
  limit?: number;
}

export interface PaginationState {
  page: number;
  limit: number;
  skip: number;
  take: number;
}

export function getPagination(
  input: PaginationInput,
  defaults = { page: 1, limit: 20 },
  maxLimit = 100,
): PaginationState {
  const page = Math.max(1, Number(input.page ?? defaults.page));
  const limit = Math.min(
    maxLimit,
    Math.max(1, Number(input.limit ?? defaults.limit)),
  );
  return { page, limit, skip: (page - 1) * limit, take: limit };
}
