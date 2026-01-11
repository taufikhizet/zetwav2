export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true,
    details?: unknown
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

// Common HTTP Errors
export class BadRequestError extends AppError {
  constructor(message: string = 'Bad Request', code: string = 'BAD_REQUEST', details?: unknown) {
    super(message, 400, code, true, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized', code: string = 'UNAUTHORIZED') {
    super(message, 401, code, true);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden', code: string = 'FORBIDDEN') {
    super(message, 403, code, true);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Not Found', code: string = 'NOT_FOUND') {
    super(message, 404, code, true);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Conflict', code: string = 'CONFLICT') {
    super(message, 409, code, true);
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Validation Error', details?: unknown) {
    super(message, 422, 'VALIDATION_ERROR', true, details);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message: string = 'Too Many Requests', code: string = 'RATE_LIMIT_EXCEEDED') {
    super(message, 429, code, true);
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Internal Server Error', code: string = 'INTERNAL_ERROR') {
    super(message, 500, code, false);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message: string = 'Service Unavailable', code: string = 'SERVICE_UNAVAILABLE') {
    super(message, 503, code, true);
  }
}

// WhatsApp specific errors
export class SessionNotFoundError extends NotFoundError {
  constructor(sessionId: string) {
    super(`Session ${sessionId} not found`, 'SESSION_NOT_FOUND');
  }
}

export class SessionNotConnectedError extends AppError {
  constructor(sessionId: string) {
    super(`Session ${sessionId} is not connected`, 400, 'SESSION_NOT_CONNECTED');
  }
}

export class SessionAlreadyExistsError extends ConflictError {
  constructor(name: string) {
    super(`Session with name ${name} already exists`, 'SESSION_ALREADY_EXISTS');
  }
}
