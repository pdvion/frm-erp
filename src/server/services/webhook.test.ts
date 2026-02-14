/**
 * Unit tests for WebhookService
 * VIO-1122: Webhooks Configuráveis
 */

import { describe, it, expect } from "vitest";
import {
  signPayload,
  verifySignature,
  generateSecret,
  getRetryDelay,
  truncateResponseBody,
  WEBHOOK_EVENT_TYPES,
} from "./webhook";

describe("WebhookService — Pure Functions", () => {
  describe("signPayload", () => {
    it("should generate a valid HMAC-SHA256 signature", () => {
      const payload = '{"event":"test"}';
      const secret = "whsec_test123";
      const signature = signPayload(payload, secret);

      expect(signature).toMatch(/^sha256=[a-f0-9]{64}$/);
    });

    it("should produce consistent signatures for same input", () => {
      const payload = '{"data":"hello"}';
      const secret = "whsec_abc";

      const sig1 = signPayload(payload, secret);
      const sig2 = signPayload(payload, secret);

      expect(sig1).toBe(sig2);
    });

    it("should produce different signatures for different secrets", () => {
      const payload = '{"data":"hello"}';

      const sig1 = signPayload(payload, "secret1");
      const sig2 = signPayload(payload, "secret2");

      expect(sig1).not.toBe(sig2);
    });

    it("should produce different signatures for different payloads", () => {
      const secret = "whsec_test";

      const sig1 = signPayload('{"a":1}', secret);
      const sig2 = signPayload('{"a":2}', secret);

      expect(sig1).not.toBe(sig2);
    });

    it("should handle empty payload", () => {
      const signature = signPayload("", "secret");
      expect(signature).toMatch(/^sha256=[a-f0-9]{64}$/);
    });

    it("should handle unicode payload", () => {
      const payload = '{"name":"José da Silva","city":"São Paulo"}';
      const signature = signPayload(payload, "secret");
      expect(signature).toMatch(/^sha256=[a-f0-9]{64}$/);
    });
  });

  describe("verifySignature", () => {
    it("should verify a valid signature", () => {
      const payload = '{"event":"order.created"}';
      const secret = "whsec_verify_test";
      const signature = signPayload(payload, secret);

      expect(verifySignature(payload, secret, signature)).toBe(true);
    });

    it("should reject an invalid signature", () => {
      const payload = '{"event":"order.created"}';
      const secret = "whsec_verify_test";

      expect(verifySignature(payload, secret, "sha256=invalid")).toBe(false);
    });

    it("should reject a signature with wrong secret", () => {
      const payload = '{"event":"test"}';
      const signature = signPayload(payload, "correct_secret");

      expect(verifySignature(payload, "wrong_secret", signature)).toBe(false);
    });

    it("should reject a tampered payload", () => {
      const secret = "whsec_tamper";
      const signature = signPayload('{"amount":100}', secret);

      expect(verifySignature('{"amount":999}', secret, signature)).toBe(false);
    });

    it("should reject signature with wrong length", () => {
      const payload = "test";
      const secret = "secret";

      expect(verifySignature(payload, secret, "sha256=short")).toBe(false);
    });
  });

  describe("generateSecret", () => {
    it("should generate a secret with whsec_ prefix", () => {
      const secret = generateSecret();
      expect(secret).toMatch(/^whsec_[a-f0-9]{64}$/);
    });

    it("should generate unique secrets", () => {
      const secrets = new Set(Array.from({ length: 100 }, () => generateSecret()));
      expect(secrets.size).toBe(100);
    });

    it("should generate secrets of consistent length", () => {
      const secret = generateSecret();
      expect(secret.length).toBe(6 + 64); // "whsec_" + 64 hex chars
    });
  });

  describe("getRetryDelay", () => {
    it("should return 10s for first retry", () => {
      expect(getRetryDelay(1, 3)).toBe(10_000);
    });

    it("should return 60s for second retry", () => {
      expect(getRetryDelay(2, 3)).toBe(60_000);
    });

    it("should return 300s for third retry", () => {
      expect(getRetryDelay(3, 4)).toBe(300_000);
    });

    it("should return null when max retries exceeded", () => {
      expect(getRetryDelay(3, 3)).toBeNull();
    });

    it("should return null when attempt equals max retries", () => {
      expect(getRetryDelay(5, 5)).toBeNull();
    });

    it("should return last delay for attempts beyond array", () => {
      expect(getRetryDelay(4, 10)).toBe(300_000);
    });

    it("should return null for maxRetries = 1", () => {
      expect(getRetryDelay(1, 1)).toBeNull();
    });

    it("should return 10s for maxRetries = 2, attempt 1", () => {
      expect(getRetryDelay(1, 2)).toBe(10_000);
    });
  });

  describe("truncateResponseBody", () => {
    it("should return null for null input", () => {
      expect(truncateResponseBody(null)).toBeNull();
    });

    it("should return short strings unchanged", () => {
      const body = "OK";
      expect(truncateResponseBody(body)).toBe("OK");
    });

    it("should return strings at max length unchanged", () => {
      const body = "x".repeat(4096);
      expect(truncateResponseBody(body)).toBe(body);
    });

    it("should truncate strings exceeding max length", () => {
      const body = "x".repeat(5000);
      const result = truncateResponseBody(body);
      expect(result).not.toBeNull();
      expect(result!.endsWith("... [truncated]")).toBe(true);
      expect(result!.length).toBe(4096 + "... [truncated]".length);
    });

    it("should handle empty string", () => {
      expect(truncateResponseBody("")).toBe("");
    });
  });

  describe("WEBHOOK_EVENT_TYPES", () => {
    it("should have descriptions for all event types", () => {
      const types = Object.entries(WEBHOOK_EVENT_TYPES);
      expect(types.length).toBeGreaterThan(0);

      for (const [key, description] of types) {
        expect(key).toBeTruthy();
        expect(description).toBeTruthy();
        expect(typeof description).toBe("string");
      }
    });

    it("should use dot notation for event types", () => {
      for (const key of Object.keys(WEBHOOK_EVENT_TYPES)) {
        expect(key).toMatch(/^[a-z_]+\.[a-z_]+$/);
      }
    });

    it("should include core event types", () => {
      expect(WEBHOOK_EVENT_TYPES).toHaveProperty("order.created");
      expect(WEBHOOK_EVENT_TYPES).toHaveProperty("invoice.created");
      expect(WEBHOOK_EVENT_TYPES).toHaveProperty("stock.movement");
      expect(WEBHOOK_EVENT_TYPES).toHaveProperty("admission.status_changed");
      expect(WEBHOOK_EVENT_TYPES).toHaveProperty("webhook.test");
    });

    it("should have unique descriptions", () => {
      const descriptions = Object.values(WEBHOOK_EVENT_TYPES);
      const unique = new Set(descriptions);
      expect(unique.size).toBe(descriptions.length);
    });
  });

  describe("Signature with timestamp (Stripe-style)", () => {
    it("should sign timestamp.payload format", () => {
      const timestamp = "1707900000000";
      const payload = '{"event":"test"}';
      const secret = "whsec_stripe_style";

      const signature = signPayload(`${timestamp}.${payload}`, secret);
      expect(signature).toMatch(/^sha256=[a-f0-9]{64}$/);

      // Verify
      expect(
        verifySignature(`${timestamp}.${payload}`, secret, signature)
      ).toBe(true);

      // Different timestamp should fail
      expect(
        verifySignature(`9999999999999.${payload}`, secret, signature)
      ).toBe(false);
    });
  });
});
