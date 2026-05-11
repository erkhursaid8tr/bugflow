import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySessionFromCookie, COOKIE_NAME } from '@/lib/auth';

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow access to login/register page and auth endpoints
  if (pathname === '/login' || pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // Allow static assets and Next.js internals
  if (pathname.startsWith('/_next') || pathname === '/favicon.ico') {
    return NextResponse.next();
  }

  // Verify JWT session
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const userId = await verifySessionFromCookie(token);

  if (!userId) {
    // Redirect unauthenticated users to login
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/login';
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// Protect all routes except Next.js internals and static assets
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
