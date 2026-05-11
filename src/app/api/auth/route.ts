import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  hashPassword,
  verifyPassword,
  createSessionToken,
  setSessionCookie,
  clearSessionCookie,
  getUserFromRequest,
} from '@/lib/auth';

// POST /api/auth — handles login, register, and logout
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    // ─── REGISTER ─────────────────────────────────────
    if (action === 'register') {
      const { name, email, password } = body;

      if (!name || !email || !password) {
        return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
      }

      if (password.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
      }

      // Check if email already exists
      const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
      if (existing) {
        return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
      }

      const passwordHash = await hashPassword(password);
      const user = await prisma.user.create({
        data: {
          name,
          email: email.toLowerCase(),
          passwordHash,
        },
      });

      // If this is the first user, assign all existing programs and logs to them (Option A migration)
      const userCount = await prisma.user.count();
      if (userCount === 1) {
        await prisma.program.updateMany({
          where: { userId: null },
          data: { userId: user.id },
        });
        await prisma.dailyLog.updateMany({
          where: { userId: null },
          data: { userId: user.id },
        });
      }

      const token = await createSessionToken(user.id);
      const response = NextResponse.json({
        success: true,
        user: { id: user.id, name: user.name, email: user.email },
      });
      response.cookies.set(setSessionCookie(token));
      return response;
    }

    // ─── LOGIN ────────────────────────────────────────
    if (action === 'login') {
      const { email, password } = body;

      if (!email || !password) {
        return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
      }

      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (!user) {
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
      }

      const isValid = await verifyPassword(password, user.passwordHash);
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
      }

      const token = await createSessionToken(user.id);
      const response = NextResponse.json({
        success: true,
        user: { id: user.id, name: user.name, email: user.email },
      });
      response.cookies.set(setSessionCookie(token));
      return response;
    }

    // ─── LOGOUT ───────────────────────────────────────
    if (action === 'logout') {
      const response = NextResponse.json({ success: true });
      response.cookies.set(clearSessionCookie());
      return response;
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}

// GET /api/auth — return current user info
export async function GET(request: Request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }
  return NextResponse.json({ user });
}
