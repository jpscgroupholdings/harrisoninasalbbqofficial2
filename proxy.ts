import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server';
import {jwtVerify} from 'jose';

/**
 * This middleware function acts as a proxy to route requests based on the subdomain of the incoming request. It checks the hostname and rewrites the URL path accordingly to serve different parts of the application from specific folders.
 * Proxy to handle subdomain-based routing
 * - localhost:3000 → routes to /main (company site)
 * - food.localhost:3000 → routes to /customer (ordering app)
 * - order.localhost:3000 → routes to /customer (ordering app)
 */

if(!process.env.JWT_SECRET){
    throw new Error("JWT_SECRET is not defined in env variables!")
}

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

// Admin routes that don't need auth
const PUBLIC_ADMIN_PATH = ['/auth/login', '/auth/signup'];

async function verifyToken(token: string){
  try{
    const {payload} = await jwtVerify(token, JWT_SECRET);
    return payload
  }catch(error){
    return null
  }
}

export async function proxy(request: NextRequest) {
  //  By calling .clone(), you get a new URL instance that you can safely modify
  const url = request.nextUrl.clone() 
  const hostname = request.headers.get('host') || ''
  const { pathname } = url
  
  // Extract subdomain from hostname (e.g., "food" from "food.localhost:3000")
  const subdomain = hostname.split('.')[0]
  
  // Debug logging to see what's being routed
  console.log('Hostname:', hostname, 'Subdomain:', subdomain, 'Path:', pathname)
  
  // Skip rewriting if already routed to /main or /customer
  // This prevents infinite rewrite loops
  if (pathname.startsWith('/main') || pathname.startsWith('/customer') || pathname.startsWith('/admin') || pathname.startsWith('harrison-testing')) {
    return NextResponse.next()
  }
  
  // Route customer ordering subdomains to /customer folder
  if (subdomain === 'food' || subdomain === 'order') {
    url.pathname = `/customer${pathname}`
    return NextResponse.rewrite(url)
  }

  if (subdomain === 'admin') {
    // allow login page through without token check
    const isPublic = PUBLIC_ADMIN_PATH.some((p) => pathname.startsWith(p));

    if(!isPublic){
      const token = request.cookies.get('admin_token')?.value;

      if(!token){
        // no token -> redirect to login
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = '/auth/login'
        return NextResponse.redirect(loginUrl)
      }

      const payload = await verifyToken(token);
      if(!payload){
        // invalid/expire token -> redirect to login and clear cookie
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = '/auth/login';
        const response = NextResponse.redirect(loginUrl);
        response.cookies.delete('admin_token');
        return response
      }
    }

    url.pathname = `admin${pathname}`
    return NextResponse.rewrite(url)
  }

  
  // Default: route main domain (localhost) to /main folder
  url.pathname = `/main${pathname}`
  return NextResponse.rewrite(url)
}

/**
 * Configuration for which paths the proxy should run on
 * Excludes:
 * - api: API routes
 * - _next/static: Static files from Next.js
 * - _next/image: Next.js image optimization
 * - favicon.ico: Favicon
 * - images: Static images from public/images folder
 * - main: Already routed pages (prevents loop)
 * - customer: Already routed pages (prevents loop)
 * - Add more
 */
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|images|main|customer|videos|promos|privacy-policy|admin).*)',
  ],
}