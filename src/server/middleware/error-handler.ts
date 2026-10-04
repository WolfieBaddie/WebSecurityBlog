import type { ErrorHandler } from 'hono';
import { AppError, responder } from '../common/response';

export const globalErrorHandler: ErrorHandler = (err, c) => {
  // 1. AppError (Thrown intentionally in services or controllers)
  if (err instanceof AppError) {
    return responder.error(c, err.message, err.statusCode, err.code, err.details);
  }

  // 2. PostgreSQL / Drizzle unique constraint violations (code 23505)
  if ((err as any)?.code === '23505') {
    return responder.error(
      c,
      'A record with this identifier or unique field already exists.',
      409,
      'DUPLICATE_KEY_CONFLICT',
      (err as any)?.detail
    );
  }

  // 3. PostgreSQL foreign key violations (code 23503)
  if ((err as any)?.code === '23503') {
    return responder.error(
      c,
      'Referenced resource does not exist.',
      400,
      'FOREIGN_KEY_VIOLATION',
      (err as any)?.detail
    );
  }

  // 4. Default unhandled internal server error
  console.error('[Unhandled Error]:', err);
  return responder.error(
    c,
    process.env.NODE_ENV === 'production' ? 'Internal server error occurred' : err.message,
    500,
    'INTERNAL_SERVER_ERROR'
  );
};