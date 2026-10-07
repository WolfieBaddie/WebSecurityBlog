import { createMiddleware } from 'hono/factory';
import { verify, sign } from 'hono/jwt';
import { getCookie } from 'hono/cookie';
import { AppError } from '../common/response';

export type UserRole = 'user' | 'author' | 'reviewer' | 'admin';

export interface SessionUser {
  sub: string;
  username: string;
  role: UserRole;
  exp: number;
}

export const SESSION_COOKIE = 'erudite_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

type Env = { Variables: { user: SessionUser } };

function getJwtSecret(): string {
  let secret: string | undefined;

  // Static member access — Vite's module runner rejects dynamic import.meta.env lookups.
  try {
    secret = import.meta.env.JWT_SECRET;
  } catch {
    secret = undefined; // plain Node (tsx scripts) — import.meta.env doesn't exist
  }

  if (!secret) secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new AppError(
      'JWT_SECRET is not configured. Add it to .env (local) or Cloudflare env vars (production).',
      500,
      'AUTH_MISCONFIGURED'
    );
  }
  return secret;
}

export async function createSessionToken(user: { id: string; username: string; role: UserRole }): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  return sign(
    {
      sub: user.id,
      username: user.username,
      role: user.role,
      iat: now,
      exp: now + SESSION_TTL_SECONDS,
    },
    getJwtSecret()
  );
}

export function sessionCookieOptions() {
  return {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax' as const,
    maxAge: SESSION_TTL_SECONDS,
  };
}

// Extracts + verifies the JWT from `Authorization: Bearer <token>` OR the session cookie.
// Safe to call multiple times per request — caches into c.var.user.
async function authenticate(c: any): Promise<SessionUser> {
  const existing = c.get('user');
  if (existing) return existing;

  const authHeader = c.req.header('Authorization');
  let token: string | undefined;

  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.slice(7);
  }
  if (!token) {
    token = getCookie(c, SESSION_COOKIE);
  }
  if (!token) {
    throw AppError.unauthorized('Authentication required');
  }

  try {
    const payload = await verify(token, getJwtSecret(), 'HS256');
    const user = payload as unknown as SessionUser;
    c.set('user', user);
    return user;
  } catch {
    throw AppError.unauthorized('Invalid or expired session');
  }
}

export const requireAuth = createMiddleware<Env>(async (c, next) => {
  await authenticate(c);
  await next();
});

// Role gate. Standalone-safe: performs authentication itself if requireAuth hasn't run.
// Super-set-friendly: admins implicitly pass every role check.
export function requireRole(allowed: UserRole[]) {
  return createMiddleware<Env>(async (c, next) => {
    const user = await authenticate(c);

    if (user.role !== 'admin' && !allowed.includes(user.role)) {
      throw AppError.forbidden(`Requires role: ${allowed.join(' or ')}`);
    }

    await next();
  });
}

// Frequently used gates
export const requireAuthorOrAdmin = () => requireRole(['author', 'admin']);
export const requireAdmin = () => requireRole(['admin']);
