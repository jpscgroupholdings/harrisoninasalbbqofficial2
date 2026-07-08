import { NextResponse } from "next/server";

interface APIErrorOptions {
  fallbackMessage?: string;
  extra?: Record<string, unknown>;
}

/**
 *
 * @param error - Error message you want to tell to the user
 * @param statusCode - status code of it e.g - 401, 404, 500
 * @param options - optional fallbackMessage and exta response fields
 * @returns
 */
export function getAPIError(
  error: unknown,
  statusCode: number = 500,
  options: APIErrorOptions = {},
) {
  const { fallbackMessage = "Internal Server Error", extra } = options;

  const err = typeof error === "string" ? new Error(error) : error;
  console.error(error);

  const message = err instanceof Error ? err.message : fallbackMessage;
  return NextResponse.json(
    { error: message, ...extra },
    { status: statusCode },
  );
}
