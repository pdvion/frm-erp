import { Prisma } from "@prisma/client";

/**
 * Generates the next sequential code for a model within a company,
 * with retry logic to handle race conditions.
 *
 * Uses the existing @@unique([companyId, code]) constraint as a safety net.
 * If two concurrent requests get the same lastCode, the second one will
 * hit a unique constraint violation (P2002) and retry with a higher code.
 *
 * @param prisma - Prisma client or transaction
 * @param model - The Prisma model delegate (e.g., prisma.issuedInvoice)
 * @param companyId - The company ID to scope the code generation
 * @param options - Optional configuration
 * @returns The next available code number
 */
export async function getNextCode(
  model: { findFirst: (args: unknown) => Promise<{ code: number } | null> },
  companyId: string,
  options?: {
    maxRetries?: number;
    codeField?: string;
  },
): Promise<number> {
  const maxRetries = options?.maxRetries ?? 3;
  const codeField = options?.codeField ?? "code";

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const last = await (model.findFirst as CallableFunction)({
      where: { companyId },
      orderBy: { [codeField]: "desc" as const },
      select: { [codeField]: true },
    }) as { code: number } | null;

    const nextCode = ((last as Record<string, number> | null)?.[codeField] || 0) + 1 + attempt;
    return nextCode;
  }

  throw new Error("Failed to generate next code after max retries");
}

/**
 * Wraps a create operation with retry logic for unique constraint violations
 * on the code field. This handles the race condition where two concurrent
 * requests get the same lastCode from findFirst.
 *
 * @param createFn - Function that performs the findFirst + create
 * @param maxRetries - Maximum number of retries (default: 3)
 * @returns The result of the create operation
 */
export async function withCodeRetry<T>(
  createFn: (attempt: number) => Promise<T>,
  maxRetries = 3,
): Promise<T> {
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
