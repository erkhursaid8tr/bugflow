import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  // If no password is configured, the app remains open (useful for local development)
  const appPassword = process.env.APP_PASSWORD;
  if (!appPassword) {
    return NextResponse.next();
  }

  const { pathname } = req.nextUrl;

  // Allow access to the login page and auth endpoints so users can actually log in
  if (pathname === '/login' || pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // Check for our secure cookie
  const authCookie = req.cookies.get('bugflow_auth');
  
  if (!authCookie || authCookie.value !== 'authenticated') {
    // Redirect unauthenticated users to the sleek new login page
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
