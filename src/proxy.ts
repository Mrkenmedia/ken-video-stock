import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware to protect admin routes.
 * Expects a cookie named `admin-token` matching `process.env.ADMIN_TOKEN`.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Chỉ kiểm tra các route bắt đầu bằng /admin
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  // Bypass trang login của admin nếu cần (trang login nằm ở /login)
  if (pathname.startsWith('/login')) {
    return NextResponse.next();
  }

  const token = request.cookies.get('admin-token')?.value;
  const expected = process.env.ADMIN_TOKEN;

  // Nếu không khớp token cấu hình, chuyển hướng sang trang /login
  if (!expected || token !== expected) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  const response = NextResponse.next();
  response.headers.set('x-user-role', 'admin');
  return response;
}

export const config = {
  matcher: ['/admin/:path*'],
};
