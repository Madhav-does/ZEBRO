export class AppError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class InvalidTransitionError extends AppError {
  constructor(currentState: string, event: string) {
    super(
      `Invalid FSM transition: Cannot execute event '${event}' from state '${currentState}'.`,
      409
    );
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(
      id ? `${resource} with ID '${id}' was not found.` : `${resource} not found.`,
      404
    );
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}

export class ValidationError extends AppError {
  public details?: unknown;

  constructor(message: string, details?: unknown) {
    super(message, 400);
    this.details = details;
  }
}

export class IdempotencyConflictError extends AppError {
  constructor(key: string) {
    super(`Concurrent request with identical Idempotency-Key '${key}' is already processing.`, 409);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Missing or invalid authentication token.') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to access this resource or perform this action.') {
    super(message, 403);
  }
}
