import { NextResponse } from "next/server";
/**
 * 
 * @param error - Error message you want to tell to the user
 * @param statusCode - status code of it e.g - 401, 404, 500
 * @param fallbackMessage - incase error message failed
 * @returns 
 */
export function getAPIError(
  error: unknown,
  statusCode: number = 500,
  fallbackMessage = "Internal Server Error",
) {
  console.error(error);

  const message = error instanceof Error ? error.message : fallbackMessage;
  return NextResponse.json({ error: message }, { status: statusCode });
}
