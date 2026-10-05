import type { Context } from 'hono';
import { setCookie, deleteCookie } from 'hono/cookie';
import { authService } from './auth.service';
import { responder, AppError } from '../../common/response';
import { createSessionToken, sessionCookieOptions, SESSION_COOKIE } from '../../middleware/auth';

export class AuthController {
  async login(c: Context) {
    const body = await c.req.json().catch(() => null);
    const identifier = body?.identifier ?? body?.username;
    const password = body?.password;

    if (!identifier || !password) {
      throw AppError.badRequest('identifier (username or email) and password are required');
    }

    const user = await authService.login(identifier, password);

    // RBAC gate: only elevated roles may reach the operator console
    if (!['admin', 'author', 'reviewer'].includes(user.role)) {
      throw AppError.forbidden('This account has no console access');
    }

    const token = await createSessionToken({ id: user.id, username: user.username, role: user.role });

    setCookie(c, SESSION_COOKIE, token, sessionCookieOptions());

    return responder.success(c, { token, user });
  }

  async me(c: Context) {
    const sessionUser = c.get('user');
    const user = await authService.getProfile(sessionUser.sub);
    return responder.success(c, user);
  }

  async logout(c: Context) {
    deleteCookie(c, SESSION_COOKIE, { path: '/' });
    return responder.success(c, { message: 'Signed out' });
  }
}

export const authController = new AuthController();
