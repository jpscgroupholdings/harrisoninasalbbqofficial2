import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { canAccess } from "./lib/roleBasedAccessCtrl";
import { StaffRole } from "./types/staff";
import { blockNonMaya, isMayaCallbackPath } from "./lib/mayaGuard";
import { isRouteBlocked } from "./helper/pageStatus";
import { COOKIE_NAMES, getAdminAuth, requireAdmin } from "./lib/getAuth";

export async function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get("host") || "";
  const { pathname } = url;
  const subdomain = hostname.split(".")[0];

  console.log(
    "Hostname:",
    hostname,
    "Subdomain:",
    subdomain,
    "Path:",
    pathname,
  );

  // Check for coming soon pages first
  if (pathname === "/coming-soon") {
    return NextResponse.next();
  }

  // Check if the route is blocked (coming soon) - this runs before any routing logic, so it applies to all subdomains
  if (isRouteBlocked(pathname)) {
    return NextResponse.rewrite(new URL("/coming-soon", request.url));
  }

  // Maya callback guard (run first, before routing)
  if (isMayaCallbackPath(pathname)) {
    const blocked = blockNonMaya(request);
    if (blocked) return blocked;
    // ip passed - let the request fall through to normal routing below
  }

  // ── Admin subdomain ──────────────────────────────────────────
  if (subdomain === "admin") {
    const isPublic = ["/auth/login", "/auth/signup"].some((p) =>
      pathname.startsWith(p),
    );

    const isRoot = pathname === "/";

    const admin = await getAdminAuth(request);

    // redirect root to dashboard if logged in, else to login
    if (isRoot) {
      return NextResponse.redirect(
        new URL(admin ? "/dashboard" : "/auth/login", request.url),
      );
    }

    // redirect logged-in admin away from auth pages
    if (isPublic && admin) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // redirect unauthenticated admin away from protected pages
    if (!isPublic && !admin) {
      const response = NextResponse.redirect(
        new URL("/auth/login", request.url),
      );
      response.cookies.delete(COOKIE_NAMES.ADMIN_TOKEN);
      return response;
    }

    // verify token validity on protected pages
    if (!isPublic && admin) {
      const role = admin.role as StaffRole;

      if (!admin.isActive) {
        const response = NextResponse.redirect(
          new URL("/auth/login", request.url),
        );
        response.cookies.delete(COOKIE_NAMES.ADMIN_TOKEN);
        return response;
      }

      // Example: "/orders/123".split("/") → ["", "orders", "123"]
      // We take index [1] to get the resource segment ("orders")
      const segment = pathname.split("/")[1];

      if (!canAccess(role, `${segment}.read`)) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }

    // rewrite to /admin folder
    url.pathname = `/admin${pathname}`;
    return NextResponse.rewrite(url);
  }

  // ── Customer subdomains ──────────────────────────────────────
  if (
    subdomain === "food" ||
    subdomain === "order" ||
    subdomain === "orders" ||
    subdomain === "foods"
  ) {
    url.pathname = `/customer${pathname}`;
    return NextResponse.rewrite(url);
  }

  // ── Main domain ──────────────────────────────────────────────
  url.pathname = `/main${pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|images|videos|gif|promos|privacy-policy|manifest\\.json|sw\\.js|workbox-.*|icons).*)",
  ],
};
