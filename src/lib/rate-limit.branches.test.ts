import { describe, expect, it } from "vitest";
import { RateLimitError } from "./errors";
import {
  checkRateLimitCustom,
  getRateLimitInfo,
  RATE_LIMITS,
  rateLimited,
  resetRateLimit,
  withRateLimit,
} from "./rate-limit";

describe("rate-limit branches", () => {
  it("checkRateLimitCustom creates entry then throws when exceeded", () => {
    const config = { limit: 1, windowSeconds: 60 };

    const first = checkRateLimitCustom("u1", "NS", config);
    expect(first.remaining).toBe(0);

    expect(() => checkRateLimitCustom("u1", "NS", config)).toThrow(RateLimitError);
  });

  it("getRateLimitInfo returns null resetAt for missing or expired", () => {
    resetRateLimit("u2", "API");

    const info = getRateLimitInfo("u2", "API");
    expect(info.count).toBe(0);
    expect(info.resetAt).toBeNull();
  });

  it("withRateLimit executes operation after check", () => {
    const result = withRateLimit("u3", "API", () => "ok");
    expect(result).toBe("ok");
  });

  it("rateLimited returns descriptor when no original method", () => {
    const decorator = rateLimited("API");
    const descriptor = {} as TypedPropertyDescriptor<(...args: unknown[]) => unknown>;

    const res = decorator({}, "x", descriptor);
    expect(res).toBe(descriptor);
  });

  it("rateLimited uses ctx userId/ip and falls back to anonymous", () => {
    class Test {
      value = 0;

      method(_ctx?: unknown) {
        this.value++;
        return this.value;
      }
    }

    const descriptor = Object.getOwnPropertyDescriptor(
      Test.prototype,
      "method"
    ) as TypedPropertyDescriptor<(...args: unknown[]) => unknown>;

    const decorated = rateLimited("API")({}, "method", descriptor);
    Object.defineProperty(Test.prototype, "method", decorated);

    const instance = new Test();

    expect(instance.method({ userId: "user-1" })).toBe(1);
    expect(instance.method({ ip: "127.0.0.1" })).toBe(2);
    expect(instance.method()).toBe(3);
  });

  it("cleanupExpiredEntries branch executes via many calls", () => {
    for (let i = 0; i < 60; i++) {
      checkRateLimitCustom(`u${i}`, "API", RATE_LIMITS.API);
    }

    const info = getRateLimitInfo("u0", "API");
    expect(info.count).toBeGreaterThan(0);
  });
});
