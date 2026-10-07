import { verify } from 'hono/jwt';

const SESSION_COOKIE = 'erudite_session';

export interface AdminUser {
  sub: string;
  username: string;
  role: string;
  exp: number;
}

function getJwtSecret(): string {
  let secret: string | undefined;
  try {
    secret = import.meta.env.JWT_SECRET; // static access — required by Vite module runner
  } catch {
    secret = undefined; // plain Node (tsx scripts)
  }
  return secret || process.env.JWT_SECRET || '';
}

/**
 * Page-level RBAC guard. Called from admin page frontmatter.
 * Astro 6.0.2's middleware pipeline delivers a synthetic header-less Request
 * under @astrojs/node dev, but page/endpoint contexts receive the real one —
 * so guards live here, not in src/middleware.ts.
 *
 * Returns the session user, or null if the visitor must be redirected to login.
 */
function readCookieFromHeader(header: string | null, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    if (part.slice(0, idx).trim() === name) {
      try {
        return decodeURIComponent(part.slice(idx + 1).trim());
      } catch {
        return part.slice(idx + 1).trim();
      }
    }
  }
  return undefined;
}

export async function getAdminUser(Astro: {
  request: { headers: { get(name: string): string | null } };
  cookies: { get(name: string): { value: string } | undefined };
}): Promise<AdminUser | null> {
  // Primary: raw Cookie header (Astro.cookies proved unreliable under @astrojs/node dev)
  let token = readCookieFromHeader(Astro.request.headers.get('cookie'), SESSION_COOKIE);

  // Fallback: Astro cookies API (works in some contexts)
  if (!token) {
    token = Astro.cookies.get(SESSION_COOKIE)?.value;
  }

  if (!token) {
    console.error('[admin-guard] no token (header + cookies API both empty)');
    return null;
  }

  const secret = getJwtSecret();
  if (!secret) {
    console.error('[admin-guard] JWT_SECRET missing');
    return null;
  }

  try {
    const payload = (await verify(token, secret, 'HS256')) as unknown as AdminUser;
    if (!['admin', 'author', 'reviewer'].includes(payload.role)) {
      console.error('[admin-guard] role rejected:', payload.role);
      return null;
    }
    return payload;
  } catch (err: any) {
    console.error('[admin-guard] verify failed:', err?.message);
    return null;
  }
}

export function loginRedirect(path: string, reason?: string): string {
  const base = `/admin/login?next=${encodeURIComponent(path)}`;
  return reason ? `${base}&reason=${encodeURIComponent(reason)}` : base;
}
