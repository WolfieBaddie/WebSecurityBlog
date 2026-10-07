import { Hono } from 'hono';
import { authController } from './auth.controller';
import { requireAuth } from '../../middleware/auth';

const authRouter = new Hono();

// Public
authRouter.post('/login', (c) => authController.login(c));
authRouter.post('/login-form', (c) => authController.loginForm(c));
authRouter.post('/logout', (c) => authController.logout(c));

// Authenticated
authRouter.get('/me', requireAuth, (c) => authController.me(c));

export default authRouter;
