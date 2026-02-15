import { describe, it, expect } from "vitest";
import {
  generateApiKey,
  hashApiKey,
  parsePagination,
  paginationMeta,
} from "./api-auth";

describe("api-auth", () => {
  describe("generateApiKey", () => {
    it("should generate key with frm_ prefix", () => {
      const { key, keyHash, keyPrefix } = generateApiKey();
      expect(key).toMatch(/^frm_[0-9a-f]{32}$/);
      expect(keyPrefix).toBe(key.substring(0, 12));
      expect(keyHash).toHaveLength(64); // SHA-256 hex
    });

    it("should generate unique keys", () => {
      const keys = new Set<string>();
      for (let i = 0; i < 10; i++) {
        keys.add(generateApiKey().key);
      }
      expect(keys.size).toBe(10);
    });

    it("should generate unique hashes", () => {
      const hashes = new Set<string>();
      for (let i = 0; i < 10; i++) {
        hashes.add(generateApiKey().keyHash);
      }
      expect(hashes.size).toBe(10);
    });
  });

  describe("hashApiKey", () => {
    it("should produce consistent hash for same input", () => {
      const key = "frm_abc123def456";
      expect(hashApiKey(key)).toBe(hashApiKey(key));
    });

    it("should produce different hashes for different inputs", () => {
      expect(hashApiKey("frm_aaa")).not.toBe(hashApiKey("frm_bbb"));
    });

    it("should produce 64-char hex string", () => {
      const hash = hashApiKey("frm_test");
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });
  });

  describe("parsePagination", () => {
    it("should return defaults when no params", () => {
      const params = new URLSearchParams();
      const result = parsePagination(params);
      expect(result).toEqual({ page: 1, limit: 20, skip: 0 });
    });

    it("should parse page and limit", () => {
      const params = new URLSearchParams({ page: "3", limit: "50" });
      const result = parsePagination(params);
      expect(result).toEqual({ page: 3, limit: 50, skip: 100 });
    });

    it("should clamp page to minimum 1", () => {
      const params = new URLSearchParams({ page: "-5" });
      const result = parsePagination(params);
      expect(result.page).toBe(1);
    });

    it("should clamp limit to maximum 100", () => {
      const params = new URLSearchParams({ limit: "500" });
      const result = parsePagination(params);
      expect(result.limit).toBe(100);
    });

    it("should clamp limit to minimum 1", () => {
      const params = new URLSearchParams({ limit: "0" });
      const result = parsePagination(params);
      expect(result.limit).toBe(1);
    });
  });

  describe("paginationMeta", () => {
    it("should calculate pagination metadata", () => {
      const meta = paginationMeta(100, 2, 20);
      expect(meta).toEqual({
        total: 100,
        page: 2,
        limit: 20,
        totalPages: 5,
        hasNext: true,
        hasPrev: true,
      });
    });

    it("should detect first page", () => {
      const meta = paginationMeta(50, 1, 20);
      expect(meta.hasPrev).toBe(false);
      expect(meta.hasNext).toBe(true);
    });

    it("should detect last page", () => {
      const meta = paginationMeta(50, 3, 20);
      expect(meta.hasNext).toBe(false);
      expect(meta.hasPrev).toBe(true);
    });

    it("should handle empty results", () => {
      const meta = paginationMeta(0, 1, 20);
      expect(meta.totalPages).toBe(0);
      expect(meta.hasNext).toBe(false);
      expect(meta.hasPrev).toBe(false);
    });

    it("should handle single page", () => {
      const meta = paginationMeta(5, 1, 20);
      expect(meta.totalPages).toBe(1);
      expect(meta.hasNext).toBe(false);
      expect(meta.hasPrev).toBe(false);
    });
  });
});
