import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in env variables!")
}

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get('host') || '';
  const { pathname } = url;
  const subdomain = hostname.split('.')[0];

  console.log('Hostname:', hostname, 'Subdomain:', subdomain, 'Path:', pathname);

  // ── Admin subdomain ──────────────────────────────────────────
  if (subdomain === 'admin') {
    const token = request.cookies.get('admin_token')?.value;
    const isPublic = ['/auth/login', '/auth/signup'].some((p) => pathname.startsWith(p));
    const isRoot = pathname === '/';

    // redirect root to dashboard if logged in, else to login
    if (isRoot) {
      return NextResponse.redirect(
        new URL(token ? '/dashboard' : '/auth/login', request.url)
      );
    }

    // redirect logged-in users away from auth pages
    if (isPublic && token) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // redirect unauthenticated users away from protected pages
    if (!isPublic && !token) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    // verify token validity on protected pages
    if (!isPublic && token) {
      const payload = await verifyToken(token);
      if (!payload) {
        const response = NextResponse.redirect(new URL('/auth/login', request.url));
        response.cookies.delete('admin_token');
        return response;
      }
    }

    // rewrite to /admin folder
    url.pathname = `/admin${pathname}`;
    return NextResponse.rewrite(url);
  }

  // ── Customer subdomains ──────────────────────────────────────
  if (subdomain === 'food' || subdomain === 'order' || subdomain === "orders" || subdomain === "foods") {
    url.pathname = `/customer${pathname}`;
    return NextResponse.rewrite(url);
  }

  if(subdomain === 'admin-testing'){
    url.pathname = `/admin-testing${pathname}`;
    return NextResponse.rewrite(url);
  }

  // ── Main domain ──────────────────────────────────────────────
  url.pathname = `/main${pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|images|videos|promos|privacy-policy).*)',
  ],
}