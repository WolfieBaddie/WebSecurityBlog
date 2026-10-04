import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

// Standard envelope shapes
export interface ApiResponse<T = any> {
  success: true;
  data: T;
  meta?: ApiMeta;
}

export interface ApiMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  [key: string]: any;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  requestId?: string;
}

// Custom Typed Exception
export class AppError extends Error {
  public readonly statusCode: ContentfulStatusCode;
  public readonly code: string;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: ContentfulStatusCode = 500,
    code: string = 'INTERNAL_SERVER_ERROR',
    details?: any
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  static badRequest(message: string = 'Bad Request', details?: any) {
    return new AppError(message, 400, 'BAD_REQUEST', details);
  }

  static unauthorized(message: string = 'Unauthorized', details?: any) {
    return new AppError(message, 401, 'UNAUTHORIZED', details);
  }

  static forbidden(message: string = 'Forbidden', details?: any) {
    return new AppError(message, 403, 'FORBIDDEN', details);
  }

  static notFound(message: string = 'Resource Not Found', details?: any) {
    return new AppError(message, 404, 'NOT_FOUND', details);
  }

  static conflict(message: string = 'Resource Conflict', details?: any) {
    return new AppError(message, 409, 'CONFLICT', details);
  }

  static unprocessable(message: string = 'Unprocessable Entity', details?: any) {
    return new AppError(message, 422, 'UNPROCESSABLE_ENTITY', details);
  }
}

// Unified Context Responder Helper
export const responder = {
  success<T>(c: Context, data: T, statusCode: ContentfulStatusCode = 200, meta?: ApiMeta) {
    const payload: ApiResponse<T> = {
      success: true,
      data,
      ...(meta && { meta }),
    };
    return c.json(payload, statusCode);
  },

  created<T>(c: Context, data: T, meta?: ApiMeta) {
    return responder.success(c, data, 201, meta);
  },

  noContent(c: Context) {
    // 204 No Content does not take a JSON body
    return c.body(null, 204);
  },

  error(
    c: Context,
    message: string,
    statusCode: ContentfulStatusCode = 500,
    code: string = 'INTERNAL_SERVER_ERROR',
    details?: any
  ) {
    const requestId = c.req.header('x-request-id') || undefined;
    const payload: ApiErrorResponse = {
      success: false,
      error: {
        code,
        message,
        ...(details && { details }),
      },
      ...(requestId && { requestId }),
    };
    return c.json(payload, statusCode);
  },
};