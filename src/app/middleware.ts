import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware to protect admin routes.
 * Expects a cookie named `admin-token` matching `process.env.ADMIN_TOKEN`.
 * If token is valid, also sets `request.nextUrl` `searchParams` with role=admin for downstream use.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // Bypass middleware for login page and public assets
  if (pathname.startsWith('/login') || pathname.startsWith('/_next')) return NextResponse.next();

  if (!pathname.startsWith('/admin')) return NextResponse.next();

  const token = request.cookies.get('admin-token')?.value;
  const expected = process.env.ADMIN_TOKEN;

  if (!expected || token !== expected) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Attach role info (optional for future use)
  const response = NextResponse.next();
  response.headers.set('x-user-role', 'admin');
  return response;
}

export const config = {
  matcher: ['/admin/:path*'],
};
