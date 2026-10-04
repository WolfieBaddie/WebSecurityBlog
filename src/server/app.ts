import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import { requestId } from 'hono/request-id';

import postsRouter from './routes/posts';
import { globalErrorHandler } from './middleware/error-handler';
import { AppError } from './common/response';
import mediaRouter from './modules/media/media.routes';

const app = new Hono().basePath('/api');

// Middleware Pipeline
app.use('*', requestId());
app.use('*', logger());
app.use('*', cors());

// Mount routers
app.route('/posts', postsRouter);

app.route('/meida', mediaRouter);

// Fallback 404 for undefined endpoints
app.notFound((c) => {
  throw AppError.notFound(`Endpoint ${c.req.method} ${c.req.path} does not exist`);
});

// Global Error Catching Layer
app.onError(globalErrorHandler);

export default app;