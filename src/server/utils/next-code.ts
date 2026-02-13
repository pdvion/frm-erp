import { Prisma } from "@prisma/client";

interface WithCodeRetryOptions {
  maxRetries?: number;
}

/**
 * Wraps a create operation with retry logic for unique constraint violations
 * on the code field. This handles the race condition where two concurrent
 * requests get the same lastCode from findFirst.
 *
 * @param createFn - Function that performs the findFirst + create.
 *   Receives the current `attempt` number (0-based) so the caller can
 *   increment the code accordingly on retries.
 * @param options - Configuration options (maxRetries defaults to 3)
 * @returns The result of the create operation
 */
export async function withCodeRetry<T>(
  createFn: (attempt: number) => Promise<T>,
  options?: WithCodeRetryOptions,
): Promise<T> {
  const maxRetries = options?.maxRetries ?? 3;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await createFn(attempt);
    } catch (error) {
      const isPrismaUniqueError =
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002";

      if (!isPrismaUniqueError || attempt >= maxRetries) {
        throw error;
      }
      // Retry on unique constraint violation — another request got the same code
    }
  }

  throw new Error("Failed after max retries");
}
