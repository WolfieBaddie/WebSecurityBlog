import { defineMiddleware } from 'astro:middleware';
import { verify } from 'hono/jwt';

const SESSION_COOKIE = 'erudite_session';

function getJwtSecret(): string {
  return process.env.JWT_SECRET || (import.meta as any)?.env?.JWT_SECRET || '';
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { request, cookies, redirect, url, locals } = context;
  const path = url.pathname;

  // Only guard the operator console pages
  const isAdminPage = path === '/admin' || path.startsWith('/admin/');
  const isLoginPage = path.startsWith('/admin/login');

  if (isAdminPage && !isLoginPage) {
    const token = cookies.get(SESSION_COOKIE)?.value;

    if (!token) {
      return redirect(`/admin/login?next=${encodeURIComponent(path)}`, 302);
    }

    try {
      const secret = getJwtSecret();
      if (!secret) throw new Error('JWT_SECRET missing');
      const payload = (await verify(token, secret, 'HS256')) as {
        sub: string;
        username: string;
        role: string;
      };

      if (!['admin', 'author', 'reviewer'].includes(payload.role)) {
        return redirect('/admin/login?error=forbidden', 302);
      }

      locals.user = payload;
    } catch {
      cookies.delete(SESSION_COOKIE, { path: '/' });
      return redirect(`/admin/login?next=${encodeURIComponent(path)}`, 302);
    }
  }

  return next();
});
