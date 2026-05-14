import { NextRequest } from "next/server";

export type SortOrder = 1 | -1;

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginationOptions {
  defaultLimit?: number;
  maxLimit?: number;
}

export interface ParsedQuery {
  page: number;
  limit: number;
  skip: number;
  sort: Record<string, SortOrder>;
  search: string | null;
  dateRange: { from?: Date; to?: Date } | null;
  priceRange: { min?: number; max?: number } | null;
}

// ================= Pagination ==========================
export function parsePagination(
  searchParams: URLSearchParams,
  options: PaginationOptions = {},
): Pick<ParsedQuery, "page" | "limit" | "skip"> {
  const { defaultLimit = 20, maxLimit = 100 } = options;

  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(
    maxLimit,
    Math.max(0, parseInt(searchParams.get("limit") ?? String(defaultLimit))),
  );

  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

export function buildPaginationMeta(
  total: number,
  page: number,
  limit: number,
): PaginationMeta {
  const totalPages = limit > 0 ? Math.ceil(total / limit) : 1;

  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

// ─── Sorting ──────────────────────────────────────────────────────────────────
export function parseSortParam(
  raw: string | null,
  defaultSort: Record<string, SortOrder> = { createdAt: -1 },
): Record<string, SortOrder> {
  if (!raw) return defaultSort;

  const sort: Record<string, SortOrder> = {};

  for (const token of raw.split(",")) {
    const trimmed = token.trim();

    if (trimmed.includes(":")) {
      const [field, dir] = trimmed.split(":");
      sort[field] = dir === "asc" ? 1 : -1;
    } else if (trimmed.startsWith("-")) {
      sort[trimmed.slice(1)] = -1;
    } else {
      sort[trimmed] = 1;
    }
  }

  return Object.keys(sort).length ? sort : defaultSort;
}

// ─── Common Filters ───────────────────────────────────────────────────────────
export function parseSearchParam(
  searchParams: URLSearchParams,
  fields: string[],
): Record<string, any> | null {
  const search = searchParams.get("search");

  if (!search || !fields.length) return null;

  return {
    $or: fields.map((field) => ({
      [field]: { $regex: search, $options: "i" },
    })),
  };
}

export function parseDateRange(
  searchParams: URLSearchParams,
  field = "createdAt",
): Record<string, any> | null {
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  if (!from && !to) return null;

  const range: Record<string, Date> = {};
  if (from) range.$gte = new Date(from);
  if (to) range.$lte = new Date(to);

  return { [field]: range };
}

export function parsePriceRange(
  searchParams: URLSearchParams,
  field = "price",
): Record<string, any> | null {
  const min = searchParams.get("minPrice");
  const max = searchParams.get("maxPrice");
  if (!min && !max) return null;

  const range: Record<string, number> = {};
  if (min) range.$gte = parseFloat(min);
  if (max) range.$lte = parseFloat(max);

  return { [field]: range };
}

export function parseExactFilters(
  searchParams: URLSearchParams,
  fields: string[], // e.g. ["status", "currency", "productType"]
): Record<string, any> {
  const match: Record<string, any> = {};
  for (const field of fields) {
    const val = searchParams.getAll(field); // gets all values
    if (val.length === 1) {
      match[field] = val[0];
    } else if (val.length > 1) {
      match[field] = { $in: val };
    }
  }
  return match;
}

// ─── Compose everything ───────────────────────────────────────────────────────

/**
 * One-shot helper: call this at the top of any GET handler to get
 * pagination, sort, and a merged $match object ready for aggregation.
 *
 * @example
 * const { page, limit, skip, sort, match } = parseRequestQuery(request, {
 *   exactFields: ["status", "currency"],
 *   searchFields: ["name", "description"],
 *   defaultSort: { createdAt: -1 },
 * });
 */

// This is one to be used for parsing query
export function parseRequestQuery(
  request: NextRequest,
  options: {
    exactFields?: string[];
    searchFields?: string[];
    defaultSort?: Record<string, SortOrder>;
    defaultLimit?: number;
    maxLimit?: number;
  } = {},
) {
  const { searchParams } = new URL(request.url);
  const {
    exactFields = [],
    searchFields = [],
    defaultSort = { createdAt: -1 },
    defaultLimit = 20,
    maxLimit = 100,
  } = options;

  const pagination = parsePagination(searchParams, { defaultLimit, maxLimit });
  const sort = parseSortParam(searchParams.get("sort"), defaultSort);

  // Merge all filter fragments into one $match object
  const matchFragments = [
    parseExactFilters(searchParams, exactFields),
    parseSearchParam(searchParams, searchFields),
    parseDateRange(searchParams),
    parsePriceRange(searchParams),
  ].filter(Boolean) as Record<string, any>[];

  const match = Object.assign({}, ...matchFragments);

  return { ...pagination, sort, match, searchParams };
}
