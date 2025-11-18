import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(
      id ? `${resource} with id '${id}' not found` : `${resource} not found`,
      404,
      'NOT_FOUND'
    );
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

export interface ErrorResponse {
  error: {
    message: string;
    code?: string;
    statusCode: number;
    details?: any;
    stack?: string;
  };
}

export function errorHandler(
  error: Error | FastifyError | AppError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const response: ErrorResponse = {
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        statusCode: 400,
        details: error.errors,
      },
    };

    return reply.status(400).send(response);
  }

  // Handle custom AppError
  if (error instanceof AppError) {
    const response: ErrorResponse = {
      error: {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        details: error.details,
        ...(isDevelopment && { stack: error.stack }),
      },
    };

    return reply.status(error.statusCode).send(response);
  }

  // Handle Fastify errors
  if ('statusCode' in error) {
    const statusCode = (error as FastifyError).statusCode || 500;
    const response: ErrorResponse = {
      error: {
        message: error.message,
        statusCode,
        ...(isDevelopment && { stack: error.stack }),
      },
    };

    return reply.status(statusCode).send(response);
  }

  // Default error response
  request.log.error(error);

  const response: ErrorResponse = {
    error: {
      message: isDevelopment ? error.message : 'Internal server error',
      statusCode: 500,
      code: 'INTERNAL_ERROR',
      ...(isDevelopment && { stack: error.stack }),
    },
  };

  return reply.status(500).send(response);
}
