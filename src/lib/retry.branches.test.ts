import { describe, expect, it, vi } from "vitest";
import { ExternalServiceError } from "./errors";
import { retry, retryWithCircuitBreaker } from "./retry";

describe("retry branches", () => {
  it("retries on fetch TypeError", async () => {
    vi.useFakeTimers();

    const operation = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockResolvedValueOnce("ok");

    const promise = retry(operation, { maxAttempts: 2, initialDelayMs: 0, maxDelayMs: 0, backoffMultiplier: 1 });
    await vi.runAllTimersAsync();

    await expect(promise).resolves.toBe("ok");
    expect(operation).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });

  it("does not retry on non-retryable error", async () => {
    const operation = vi.fn<() => Promise<string>>().mockRejectedValue(new Error("nope"));

    await expect(
      retry(operation, {
        maxAttempts: 3,
        initialDelayMs: 0,
        maxDelayMs: 0,
        backoffMultiplier: 1,
        retryableErrors: () => false,
      })
    ).rejects.toThrow("nope");

    expect(operation).toHaveBeenCalledTimes(1);
  });

  it("retries on AbortError", async () => {
    vi.useFakeTimers();

    const abortError = new Error("aborted");
    abortError.name = "AbortError";

    const operation = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(abortError)
      .mockResolvedValueOnce("ok");

    const promise = retry(operation, { maxAttempts: 2, initialDelayMs: 0, maxDelayMs: 0, backoffMultiplier: 1 });
    await vi.runAllTimersAsync();

    await expect(promise).resolves.toBe("ok");
    expect(operation).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });

  it("retries on http status 503 and does not retry on 400", async () => {
    vi.useFakeTimers();

    const operationRetryable = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce({ status: 503 })
      .mockResolvedValueOnce("ok");

    const promise = retry(operationRetryable, { maxAttempts: 2, initialDelayMs: 0, maxDelayMs: 0, backoffMultiplier: 1 });
    await vi.runAllTimersAsync();

    await expect(promise).resolves.toBe("ok");
    expect(operationRetryable).toHaveBeenCalledTimes(2);

    const operationNotRetryable = vi.fn<() => Promise<string>>().mockRejectedValue({ statusCode: 400 });
    await expect(retry(operationNotRetryable, { maxAttempts: 2, initialDelayMs: 0 })).rejects.toBeDefined();
    expect(operationNotRetryable).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it("retries on ExternalServiceError", async () => {
    vi.useFakeTimers();

    const operation = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new ExternalServiceError("svc", "fail"))
      .mockResolvedValueOnce("ok");

    const promise = retry(operation, { maxAttempts: 2, initialDelayMs: 0, maxDelayMs: 0, backoffMultiplier: 1 });
    await vi.runAllTimersAsync();

    await expect(promise).resolves.toBe("ok");
    expect(operation).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });

  it("opens circuit breaker after failures and blocks calls until resetTimeout", async () => {
    const failingOp = vi.fn<() => Promise<string>>().mockRejectedValue(new ExternalServiceError("svc", "down"));

    await expect(
      retryWithCircuitBreaker(failingOp, {
        circuitName: "test-circuit",
        maxAttempts: 1,
        initialDelayMs: 0,
        maxDelayMs: 0,
        failureThreshold: 1,
        resetTimeoutMs: 60_000,
      })
    ).rejects.toBeDefined();

    await expect(
      retryWithCircuitBreaker(async () => "ok", {
        circuitName: "test-circuit",
        maxAttempts: 1,
        initialDelayMs: 0,
        maxDelayMs: 0,
        failureThreshold: 1,
        resetTimeoutMs: 60_000,
      })
    ).rejects.toBeInstanceOf(ExternalServiceError);
  });
});
