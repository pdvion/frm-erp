import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { encrypt, decrypt, isEncrypted, encryptOptional, decryptOptional, redactSecret } from "./encryption";

// 32-byte test key (64 hex chars)
const TEST_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

describe("encryption", () => {
  beforeEach(() => {
    vi.stubEnv("ENCRYPTION_KEY", TEST_KEY);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("encrypt/decrypt roundtrip", () => {
    it("should encrypt and decrypt a string", () => {
      const plaintext = "my-secret-password-123";
      const encrypted = encrypt(plaintext);
      expect(encrypted).not.toBe(plaintext);
      expect(isEncrypted(encrypted)).toBe(true);
      expect(decrypt(encrypted)).toBe(plaintext);
    });

    it("should handle empty string", () => {
      expect(encrypt("")).toBe("");
      expect(decrypt("")).toBe("");
    });

    it("should handle unicode characters", () => {
      const plaintext = "senha-com-acentuação-ñ-ü-ç";
      const encrypted = encrypt(plaintext);
      expect(decrypt(encrypted)).toBe(plaintext);
    });

    it("should handle long strings", () => {
      const plaintext = "x".repeat(10000);
      const encrypted = encrypt(plaintext);
      expect(decrypt(encrypted)).toBe(plaintext);
    });

    it("should produce different ciphertexts for same plaintext (random IV)", () => {
      const plaintext = "same-input";
      const enc1 = encrypt(plaintext);
      const enc2 = encrypt(plaintext);
      expect(enc1).not.toBe(enc2);
      expect(decrypt(enc1)).toBe(plaintext);
      expect(decrypt(enc2)).toBe(plaintext);
    });

    it("should not double-encrypt already encrypted values", () => {
      const plaintext = "secret";
      const encrypted = encrypt(plaintext);
      const doubleEncrypted = encrypt(encrypted);
      expect(doubleEncrypted).toBe(encrypted);
      expect(decrypt(doubleEncrypted)).toBe(plaintext);
    });
  });

  describe("isEncrypted", () => {
    it("should detect encrypted values", () => {
      const encrypted = encrypt("test");
      expect(isEncrypted(encrypted)).toBe(true);
    });

    it("should return false for plaintext", () => {
      expect(isEncrypted("plaintext")).toBe(false);
    });

    it("should return false for null/undefined", () => {
      expect(isEncrypted(null)).toBe(false);
      expect(isEncrypted(undefined)).toBe(false);
    });
  });

  describe("encryptOptional/decryptOptional", () => {
    it("should handle null", () => {
      expect(encryptOptional(null)).toBeNull();
      expect(decryptOptional(null)).toBeNull();
    });

    it("should handle undefined", () => {
      expect(encryptOptional(undefined)).toBeUndefined();
      expect(decryptOptional(undefined)).toBeUndefined();
    });

    it("should encrypt/decrypt non-null values", () => {
      const encrypted = encryptOptional("secret");
      expect(encrypted).not.toBeNull();
      expect(isEncrypted(encrypted!)).toBe(true);
      expect(decryptOptional(encrypted)).toBe("secret");
    });
  });

  describe("without ENCRYPTION_KEY", () => {
    beforeEach(() => {
      vi.stubEnv("ENCRYPTION_KEY", "");
    });

    it("should passthrough encrypt when key not set", () => {
      expect(encrypt("plaintext")).toBe("plaintext");
    });

    it("should passthrough decrypt for non-encrypted values", () => {
      expect(decrypt("plaintext")).toBe("plaintext");
    });
  });

  describe("with invalid ENCRYPTION_KEY length", () => {
    beforeEach(() => {
      vi.stubEnv("ENCRYPTION_KEY", "tooshort");
    });

    it("should passthrough when key is wrong length", () => {
      expect(encrypt("plaintext")).toBe("plaintext");
    });
  });

  describe("redactSecret", () => {
    it("should redact null", () => {
      expect(redactSecret(null)).toBeNull();
    });

    it("should redact short strings", () => {
      expect(redactSecret("abc")).toBe("••••••••");
    });

    it("should redact encrypted values", () => {
      const encrypted = encrypt("secret");
      expect(redactSecret(encrypted)).toBe("••••••••");
    });

    it("should partially show long plaintext", () => {
      const result = redactSecret("sk-1234567890abcdef");
      expect(result).toMatch(/^sk-1.*cdef$/);
      expect(result).toContain("•");
    });
  });
});
