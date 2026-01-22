import { TRPCError } from "@trpc/server";

// ============================================
// Custom Error Classes
// ============================================

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    isOperational: boolean = true
  ) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  public readonly field?: string;
  public readonly details?: Record<string, string[]>;

  constructor(
    message: string,
    field?: string,
    details?: Record<string, string[]>
  ) {
    super(message, "VALIDATION_ERROR", 400);
    this.field = field;
    this.details = details;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class NotFoundError extends AppError {
  public readonly resource: string;
  public readonly resourceId?: string;

  constructor(resource: string, resourceId?: string) {
    const message = resourceId
      ? `${resource} com ID ${resourceId} não encontrado`
      : `${resource} não encontrado`;
    super(message, "NOT_FOUND", 404);
    this.resource = resource;
    this.resourceId = resourceId;
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class ConflictError extends AppError {
  public readonly resource: string;
  public readonly conflictField?: string;

  constructor(resource: string, conflictField?: string, message?: string) {
    const defaultMessage = conflictField
      ? `${resource} com este ${conflictField} já existe`
      : `${resource} já existe`;
    super(message || defaultMessage, "CONFLICT", 409);
    this.resource = resource;
    this.conflictField = conflictField;
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = "Não autorizado") {
    super(message, "UNAUTHORIZED", 401);
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = "Acesso negado") {
    super(message, "FORBIDDEN", 403);
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

export class ExternalServiceError extends AppError {
  public readonly service: string;
  public readonly originalError?: Error;

  constructor(service: string, message: string, originalError?: Error) {
    super(`Erro no serviço ${service}: ${message}`, "EXTERNAL_SERVICE_ERROR", 502);
    this.service = service;
    this.originalError = originalError;
    Object.setPrototypeOf(this, ExternalServiceError.prototype);
  }
}

export class RateLimitError extends AppError {
  public readonly retryAfter?: number;

  constructor(message: string = "Muitas requisições. Tente novamente mais tarde.", retryAfter?: number) {
    super(message, "RATE_LIMIT", 429);
    this.retryAfter = retryAfter;
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

export class BusinessRuleError extends AppError {
  public readonly rule: string;

  constructor(rule: string, message: string) {
    super(message, "BUSINESS_RULE_ERROR", 422);
    this.rule = rule;
    Object.setPrototypeOf(this, BusinessRuleError.prototype);
  }
}

// ============================================
// Error Conversion to tRPC
// ============================================

export function toTRPCError(error: unknown): TRPCError {
  if (error instanceof TRPCError) {
    return error;
  }

  if (error instanceof ValidationError) {
    return new TRPCError({
      code: "BAD_REQUEST",
      message: error.message,
      cause: error,
    });
  }

  if (error instanceof NotFoundError) {
    return new TRPCError({
      code: "NOT_FOUND",
      message: error.message,
      cause: error,
    });
  }

  if (error instanceof ConflictError) {
    return new TRPCError({
      code: "CONFLICT",
      message: error.message,
      cause: error,
    });
  }

  if (error instanceof UnauthorizedError) {
    return new TRPCError({
      code: "UNAUTHORIZED",
      message: error.message,
      cause: error,
    });
  }

  if (error instanceof ForbiddenError) {
    return new TRPCError({
      code: "FORBIDDEN",
      message: error.message,
      cause: error,
    });
  }

  if (error instanceof RateLimitError) {
    return new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: error.message,
      cause: error,
    });
  }

  if (error instanceof BusinessRuleError) {
    return new TRPCError({
      code: "PRECONDITION_FAILED",
      message: error.message,
      cause: error,
    });
  }

  if (error instanceof ExternalServiceError) {
    return new TRPCError({
      code: "BAD_GATEWAY",
      message: error.message,
      cause: error,
    });
  }

  if (error instanceof AppError) {
    return new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: error.message,
      cause: error,
    });
  }

  // Unknown error
  const message = error instanceof Error ? error.message : "Erro interno do servidor";
  return new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message,
    cause: error,
  });
}

// ============================================
// Error Handler Wrapper
// ============================================

export async function handleError<T>(
  operation: () => Promise<T>,
  context?: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof AppError) {
      throw toTRPCError(error);
    }

    // Log unexpected errors
    console.error(`[ERROR] ${context || "Unknown context"}:`, error);

    throw toTRPCError(error);
  }
}

// ============================================
// Assertion Helpers
// ============================================

export function assertExists<T>(
  value: T | null | undefined,
  resource: string,
  resourceId?: string
): asserts value is T {
  if (value === null || value === undefined) {
    throw new NotFoundError(resource, resourceId);
  }
}

export function assertCondition(
  condition: boolean,
  rule: string,
  message: string
): asserts condition {
  if (!condition) {
    throw new BusinessRuleError(rule, message);
  }
}

export function assertAuthorized(
  condition: boolean,
  message: string = "Não autorizado"
): asserts condition {
  if (!condition) {
    throw new UnauthorizedError(message);
  }
}

export function assertPermission(
  condition: boolean,
  message: string = "Sem permissão para esta ação"
): asserts condition {
  if (!condition) {
    throw new ForbiddenError(message);
  }
}
