import { describe, it, expect, vi } from "vitest";
import { Prisma } from "@prisma/client";
import { withCodeRetry } from "./next-code";

describe("withCodeRetry", () => {
  it("should return result on first attempt if no error", async () => {
    const result = await withCodeRetry(async () => ({ id: "1", code: 1 }));
    expect(result).toEqual({ id: "1", code: 1 });
  });

  it("should retry on P2002 unique constraint violation", async () => {
    const createFn = vi.fn()
      .mockRejectedValueOnce(
        new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
          code: "P2002",
          clientVersion: "5.0.0",
          meta: { target: ["companyId", "code"] },
        }),
      )
      .mockResolvedValueOnce({ id: "1", code: 2 });

    const result = await withCodeRetry((attempt) => createFn(attempt));
    expect(result).toEqual({ id: "1", code: 2 });
    expect(createFn).toHaveBeenCalledTimes(2);
    expect(createFn).toHaveBeenCalledWith(0);
    expect(createFn).toHaveBeenCalledWith(1);
  });

  it("should throw non-P2002 errors immediately", async () => {
    const error = new Error("Some other error");
    const createFn = vi.fn().mockRejectedValue(error);

    await expect(withCodeRetry(createFn)).rejects.toThrow("Some other error");
    expect(createFn).toHaveBeenCalledTimes(1);
  });

  it("should throw after max retries exhausted", async () => {
    const p2002Error = new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
      code: "P2002",
      clientVersion: "5.0.0",
      meta: { target: ["companyId", "code"] },
    });
    const createFn = vi.fn().mockRejectedValue(p2002Error);

    await expect(withCodeRetry(createFn, { maxRetries: 2 })).rejects.toThrow("Unique constraint failed");
    expect(createFn).toHaveBeenCalledTimes(3); // 0, 1, 2
  });

  it("should succeed after multiple retries", async () => {
    const p2002Error = new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
      code: "P2002",
      clientVersion: "5.0.0",
      meta: { target: ["companyId", "code"] },
    });
    const createFn = vi.fn()
      .mockRejectedValueOnce(p2002Error)
      .mockRejectedValueOnce(p2002Error)
      .mockResolvedValueOnce({ id: "1", code: 3 });

    const result = await withCodeRetry((attempt) => createFn(attempt));
    expect(result).toEqual({ id: "1", code: 3 });
    expect(createFn).toHaveBeenCalledTimes(3);
  });
});
