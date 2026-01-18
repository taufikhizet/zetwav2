import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors.js';
import { createLogger } from '../utils/logger.js';
import { config } from '../config/index.js';

const logger = createLogger('error-handler');

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
    stack?: string;
  };
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response<ErrorResponse>,
  _next: NextFunction
): void => {
  // Log error
  logger.error(
    {
      err,
      method: req.method,
      path: req.path,
      query: req.query,
      userId: (req as unknown as { userId?: string }).userId,
    },
    'Request error'
  );

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    res.status(422).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      },
    });
    return;
  }

  // Handle known application errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        ...(config.isDevelopment && { stack: err.stack }),
      },
    });
    return;
  }

  // Handle Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as unknown as { code: string; meta?: { target?: string[] } };
    
    if (prismaError.code === 'P2002') {
      res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_ENTRY',
          message: `Duplicate entry for ${prismaError.meta?.target?.join(', ') || 'field'}`,
        },
      });
      return;
    }

    if (prismaError.code === 'P2025') {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Record not found',
        },
      });
      return;
    }

    // Handle connection errors
    if (['P1001', 'P1002', 'P1008', 'P1017'].includes(prismaError.code)) {
      res.status(503).json({
        success: false,
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Database service unavailable, please try again later',
        },
      });
      return;
    }
  }

  // Handle unknown errors
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: config.isProduction ? 'Internal server error' : err.message,
      ...(config.isDevelopment && { stack: err.stack }),
    },
  });
};

export const notFoundHandler = (req: Request, res: Response<ErrorResponse>): void => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
};
