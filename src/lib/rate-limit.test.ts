import { describe, it, expect, beforeEach } from "vitest";
import {
  checkRateLimit,
  checkRateLimitCustom,
  resetRateLimit,
  getRateLimitInfo,
  RATE_LIMITS,
} from "./rate-limit";
import { RateLimitError } from "./errors";

describe("checkRateLimit", () => {
  beforeEach(() => {
    // Reset rate limits between tests
    resetRateLimit("test-user", "API");
    resetRateLimit("test-user", "LOGIN");
    resetRateLimit("test-user", "UPLOAD");
  });

  it("should allow requests within limit", () => {
    const result = checkRateLimit("test-user", "API");
    expect(result.remaining).toBe(RATE_LIMITS.API.limit - 1);
    expect(result.resetAt).toBeInstanceOf(Date);
  });

  it("should decrement remaining count", () => {
    checkRateLimit("test-user-2", "API");
    const result = checkRateLimit("test-user-2", "API");
    expect(result.remaining).toBe(RATE_LIMITS.API.limit - 2);
  });

  it("should throw RateLimitError when limit exceeded", () => {
    const identifier = "test-user-limit";
    
    // Exhaust the limit
    for (let i = 0; i < RATE_LIMITS.LOGIN.limit; i++) {
      checkRateLimit(identifier, "LOGIN");
    }

    // Next request should throw
    expect(() => checkRateLimit(identifier, "LOGIN")).toThrow(RateLimitError);
  });

  it("should track different identifiers separately", () => {
    checkRateLimit("user-a", "API");
    checkRateLimit("user-a", "API");
    
    const resultA = checkRateLimit("user-a", "API");
    const resultB = checkRateLimit("user-b", "API");

    expect(resultA.remaining).toBe(RATE_LIMITS.API.limit - 3);
    expect(resultB.remaining).toBe(RATE_LIMITS.API.limit - 1);
  });

  it("should track different types separately", () => {
    checkRateLimit("user-c", "API");
    checkRateLimit("user-c", "LOGIN");

    const apiInfo = getRateLimitInfo("user-c", "API");
    const loginInfo = getRateLimitInfo("user-c", "LOGIN");

    expect(apiInfo.count).toBe(1);
    expect(loginInfo.count).toBe(1);
  });
});

describe("checkRateLimitCustom", () => {
  it("should use custom configuration", () => {
    const customConfig = { limit: 3, windowSeconds: 60 };
    
    checkRateLimitCustom("custom-user", "CUSTOM", customConfig);
    checkRateLimitCustom("custom-user", "CUSTOM", customConfig);
    const result = checkRateLimitCustom("custom-user", "CUSTOM", customConfig);

    expect(result.remaining).toBe(0);
  });

  it("should throw when custom limit exceeded", () => {
    const customConfig = { limit: 2, windowSeconds: 60 };
    
    checkRateLimitCustom("custom-user-2", "CUSTOM2", customConfig);
    checkRateLimitCustom("custom-user-2", "CUSTOM2", customConfig);

    expect(() => 
      checkRateLimitCustom("custom-user-2", "CUSTOM2", customConfig)
    ).toThrow(RateLimitError);
  });
});

describe("resetRateLimit", () => {
  it("should reset rate limit for identifier", () => {
    checkRateLimit("reset-user", "API");
    checkRateLimit("reset-user", "API");
    
    resetRateLimit("reset-user", "API");
    
    const info = getRateLimitInfo("reset-user", "API");
    expect(info.count).toBe(0);
    expect(info.remaining).toBe(RATE_LIMITS.API.limit);
  });
});

describe("getRateLimitInfo", () => {
  it("should return info without incrementing", () => {
    checkRateLimit("info-user", "API");
    
    const info1 = getRateLimitInfo("info-user", "API");
    const info2 = getRateLimitInfo("info-user", "API");

    expect(info1.count).toBe(1);
    expect(info2.count).toBe(1);
  });

  it("should return full limit for new identifier", () => {
    const info = getRateLimitInfo("new-user", "API");
    
    expect(info.count).toBe(0);
    expect(info.remaining).toBe(RATE_LIMITS.API.limit);
    expect(info.resetAt).toBe(null);
  });
});

describe("RATE_LIMITS", () => {
  it("should have correct LOGIN limit", () => {
    expect(RATE_LIMITS.LOGIN.limit).toBe(5);
    expect(RATE_LIMITS.LOGIN.windowSeconds).toBe(60);
  });

  it("should have correct API limit", () => {
    expect(RATE_LIMITS.API.limit).toBe(100);
    expect(RATE_LIMITS.API.windowSeconds).toBe(60);
  });

  it("should have correct UPLOAD limit", () => {
    expect(RATE_LIMITS.UPLOAD.limit).toBe(10);
    expect(RATE_LIMITS.UPLOAD.windowSeconds).toBe(60);
  });

  it("should have correct SENSITIVE limit", () => {
    expect(RATE_LIMITS.SENSITIVE.limit).toBe(20);
    expect(RATE_LIMITS.SENSITIVE.windowSeconds).toBe(60);
  });

  it("should have correct REPORTS limit", () => {
    expect(RATE_LIMITS.REPORTS.limit).toBe(30);
    expect(RATE_LIMITS.REPORTS.windowSeconds).toBe(60);
  });
});
