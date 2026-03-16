import { NextRequest, NextResponse } from "next/server";


// Correct IP's from maya docs
// https://developers.maya.ph/reference/receive-real-time-payment-information-using-webhooks

const MAYA_ALLOWED_IPS: Record<string, string[]> = {
  sandbox: ["13.229.160.234", "3.1.199.75"],
  production: ["18.138.50.235", "3.1.207.200"],
};

const MAYA_CALLBACK_PATHS = [
  "/payment/success",
  "/payment/cancelled",
  "/payment/failed",
];

export function getMayaClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();

  return request.headers.get("x-real-ip") ?? "unknown";
}

export function isMayaAllowedIP(ip: string): boolean {
  if (process.env.MAYA_SKIP_IP_CHECK === "true") return true;

  const env = process.env.NODE_ENV === "production" ? "production" : "sandbox";

  return MAYA_ALLOWED_IPS[env].includes(ip);
}

export function isMayaCallbackPath(pathname: string): boolean {
    return MAYA_CALLBACK_PATHS.some((p) => pathname.startsWith(p));
}

export function blockNonMaya(request: NextRequest): NextResponse | null{
    const ip = getMayaClientIP(request);

    if(!isMayaAllowedIP(ip)){
        console.warn(`[Maya Guard] Blocked IP: ${ip} on ${request.nextUrl.pathname}`);

        // Redirect to home instead of raw 403 - looks less broken to curious users
        return NextResponse.redirect(new URL("/", request.url))
    }

    return null; // allowed - continue
}
