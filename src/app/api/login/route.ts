import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Login page server action – validates admin password and sets cookie.
 * The password is stored in env `ADMIN_PASSWORD`.
 * On success it redirects to /admin.
 */
export async function POST(request: Request) {
  const form = await request.formData();
  const password = form.get('password')?.toString() ?? '';
  const expected = process.env.ADMIN_PASSWORD;
  const token = process.env.ADMIN_TOKEN;

  if (password !== expected) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  const response = NextResponse.redirect(new URL('/admin', request.url));
  // Set secure cookie (for demo use HttpOnly, sameSite Strict)
  response.cookies.set('admin-token', token ?? '', {
    httpOnly: true,
    path: '/',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 1 day
  });
  return response;
}
