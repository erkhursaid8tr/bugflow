import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifySessionToken } from './auth';
import { prisma } from './prisma';

const COOKIE_NAME = 'bugflow_session';

/**
 * Server-side helper to get the current user from cookies in Server Components.
 * Returns the user object or null if not authenticated.
 */
export async function getServerUser(): Promise<{ id: string; name: string; email: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = await verifySessionToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, name: true, email: true },
  });

  return user;
}

/**
 * Server-side helper that throws redirect if not authenticated.
 * Use in Server Components that require auth.
 * redirect() from next/navigation throws internally, so this never returns null.
 */
export async function requireServerUser(): Promise<{ id: string; name: string; email: string }> {
  const user = await getServerUser();
  if (!user) {
    redirect('/login');
  }
  return user;
}
