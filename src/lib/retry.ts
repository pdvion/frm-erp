import { ExternalServiceError } from "./errors";

// ============================================
// Retry Configuration
// ============================================

export interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  retryableErrors?: (error: unknown) => boolean;
  onRetry?: (error: unknown, attempt: number, delayMs: number) => void;
}

const DEFAULT_OPTIONS: Required<Omit<RetryOptions, "onRetry" | "retryableErrors">> = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
};

// ============================================
// Retry Function
// ============================================

export async function retry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  let lastError: unknown;
  let delayMs = config.initialDelayMs;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Check if error is retryable
      const isRetryable = config.retryableErrors
        ? config.retryableErrors(error)
        : isDefaultRetryable(error);

      if (!isRetryable || attempt === config.maxAttempts) {
        throw error;
      }

      // Call onRetry callback if provided
      if (config.onRetry) {
        config.onRetry(error, attempt, delayMs);
      }

      // Wait before retrying
      await sleep(delayMs);

      // Calculate next delay with exponential backoff
      delayMs = Math.min(delayMs * config.backoffMultiplier, config.maxDelayMs);
    }
  }

  throw lastError;
}

// ============================================
// Default Retryable Error Check
// ============================================

function isDefaultRetryable(error: unknown): boolean {
  // Network errors
  if (error instanceof TypeError && error.message.includes("fetch")) {
    return true;
  }

  // Timeout errors
  if (error instanceof Error && error.name === "AbortError") {
    return true;
  }

  // External service errors (5xx)
  if (error instanceof ExternalServiceError) {
    return true;
  }

  // HTTP status codes that are retryable
  if (isHttpError(error)) {
    const status = getHttpStatus(error);
    return status !== null && (status >= 500 || status === 429 || status === 408);
  }

  return false;
}

function isHttpError(error: unknown): boolean {
  return (
    error !== null &&
    typeof error === "object" &&
    ("status" in error || "statusCode" in error)
  );
}

function getHttpStatus(error: unknown): number | null {
  if (error !== null && typeof error === "object") {
    if ("status" in error && typeof (error as Record<string, unknown>).status === "number") {
      return (error as Record<string, unknown>).status as number;
    }
    if ("statusCode" in error && typeof (error as Record<string, unknown>).statusCode === "number") {
      return (error as Record<string, unknown>).statusCode as number;
    }
  }
  return null;
}

// ============================================
// Sleep Utility
// ============================================

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================
// Retry with Circuit Breaker
// ============================================

interface CircuitBreakerState {
  failures: number;
  lastFailure: number;
  isOpen: boolean;
}

const circuitBreakers = new Map<string, CircuitBreakerState>();

export interface CircuitBreakerOptions extends RetryOptions {
  circuitName: string;
  failureThreshold?: number;
  resetTimeoutMs?: number;
}

export async function retryWithCircuitBreaker<T>(
  operation: () => Promise<T>,
  options: CircuitBreakerOptions
): Promise<T> {
  const {
    circuitName,
    failureThreshold = 5,
    resetTimeoutMs = 60000,
    ...retryOptions
  } = options;

  // Get or create circuit breaker state
  let state = circuitBreakers.get(circuitName);
  if (!state) {
    state = { failures: 0, lastFailure: 0, isOpen: false };
    circuitBreakers.set(circuitName, state);
  }

  // Check if circuit is open
  if (state.isOpen) {
    const timeSinceLastFailure = Date.now() - state.lastFailure;
    if (timeSinceLastFailure < resetTimeoutMs) {
      throw new ExternalServiceError(
        circuitName,
        `Serviço temporariamente indisponível. Tente novamente em ${Math.ceil((resetTimeoutMs - timeSinceLastFailure) / 1000)} segundos.`
      );
    }
    // Reset circuit breaker (half-open state)
    state.isOpen = false;
    state.failures = 0;
  }

  try {
    const result = await retry(operation, retryOptions);
    // Success - reset failures
    state.failures = 0;
    return result;
  } catch (error) {
    // Increment failures
    state.failures++;
    state.lastFailure = Date.now();

    // Open circuit if threshold reached
    if (state.failures >= failureThreshold) {
      state.isOpen = true;
    }

    throw error;
  }
}

// ============================================
// Specialized Retry Functions
// ============================================

export async function retrySefaz<T>(
  operation: () => Promise<T>,
  onRetry?: (error: unknown, attempt: number) => void
): Promise<T> {
  return retryWithCircuitBreaker(operation, {
    circuitName: "sefaz",
    maxAttempts: 3,
    initialDelayMs: 2000,
    maxDelayMs: 10000,
    failureThreshold: 5,
    resetTimeoutMs: 300000, // 5 minutes
    onRetry: (error, attempt, delay) => {
      console.warn(`[SEFAZ] Tentativa ${attempt} falhou. Retentando em ${delay}ms...`, error);
      onRetry?.(error, attempt);
    },
  });
}

export async function retryEmail<T>(
  operation: () => Promise<T>,
  onRetry?: (error: unknown, attempt: number) => void
): Promise<T> {
  return retry(operation, {
    maxAttempts: 3,
    initialDelayMs: 1000,
    maxDelayMs: 5000,
    onRetry: (error, attempt, delay) => {
      console.warn(`[EMAIL] Tentativa ${attempt} falhou. Retentando em ${delay}ms...`, error);
      onRetry?.(error, attempt);
    },
  });
}

export async function retryDatabase<T>(
  operation: () => Promise<T>,
  onRetry?: (error: unknown, attempt: number) => void
): Promise<T> {
  return retry(operation, {
    maxAttempts: 3,
    initialDelayMs: 100,
    maxDelayMs: 1000,
    retryableErrors: (error) => {
      // Retry on connection errors and deadlocks
      if (error instanceof Error) {
        const message = error.message.toLowerCase();
        return (
          message.includes("connection") ||
          message.includes("deadlock") ||
          message.includes("timeout") ||
          message.includes("econnrefused")
        );
      }
      return false;
    },
    onRetry: (error, attempt, delay) => {
      console.warn(`[DATABASE] Tentativa ${attempt} falhou. Retentando em ${delay}ms...`, error);
      onRetry?.(error, attempt);
    },
  });
}

// ============================================
// Batch Processing with Retry
// ============================================

export interface BatchResult<T, R> {
  item: T;
  result?: R;
  error?: Error;
  success: boolean;
}

export async function processBatchWithRetry<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  options: RetryOptions & { concurrency?: number } = {}
): Promise<BatchResult<T, R>[]> {
  const { concurrency = 5, ...retryOptions } = options;
  const results: BatchResult<T, R>[] = [];

  // Process in batches
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(async (item) => {
        try {
          const result = await retry(() => processor(item), retryOptions);
          return { item, result, success: true };
        } catch (error) {
          return {
            item,
            error: error instanceof Error ? error : new Error(String(error)),
            success: false,
          };
        }
      })
    );
    results.push(...batchResults);
  }

  return results;
}
