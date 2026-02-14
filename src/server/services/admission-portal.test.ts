/**
 * Tests for Admission Portal Service
 * VIO-1102 — Admissão Digital Fase 3
 */

import { describe, it, expect } from "vitest";
import {
  calculateTokenExpiry,
  isTokenExpired,
  isAdmissionClosed,
  validateUploadFile,
  filterCandidateFields,
  generateStoragePath,
  generatePortalUrl,
  calculateDocumentStats,
  CANDIDATE_EDITABLE_FIELDS,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  TOKEN_DEFAULT_EXPIRY_DAYS,
  TOKEN_MAX_EXPIRY_DAYS,
  CLOSED_STATUSES,
} from "./admission-portal";

// ─── calculateTokenExpiry ────────────────────────────────────────────────────

describe("calculateTokenExpiry", () => {
  it("should default to 7 days", () => {
    const now = new Date();
    const expiry = calculateTokenExpiry();
    const diffDays = Math.round((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBe(TOKEN_DEFAULT_EXPIRY_DAYS);
  });

  it("should accept custom expiry days", () => {
    const now = new Date();
    const expiry = calculateTokenExpiry({ expiresInDays: 30 });
    const diffDays = Math.round((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBe(30);
  });

  it("should clamp to minimum 1 day", () => {
    const now = new Date();
    const expiry = calculateTokenExpiry({ expiresInDays: 0 });
    const diffDays = Math.round((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBe(1);
  });

  it("should clamp to maximum 90 days", () => {
    const now = new Date();
    const expiry = calculateTokenExpiry({ expiresInDays: 365 });
    const diffDays = Math.round((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBe(TOKEN_MAX_EXPIRY_DAYS);
  });

  it("should handle negative values", () => {
    const now = new Date();
    const expiry = calculateTokenExpiry({ expiresInDays: -5 });
    const diffDays = Math.round((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBe(1);
  });
});

// ─── isTokenExpired ──────────────────────────────────────────────────────────

describe("isTokenExpired", () => {
  it("should return false when no expiry date", () => {
    expect(isTokenExpired(null)).toBe(false);
  });

  it("should return false when token is still valid", () => {
    const future = new Date();
    future.setDate(future.getDate() + 7);
    expect(isTokenExpired(future)).toBe(false);
  });

  it("should return true when token has expired", () => {
    const past = new Date();
    past.setDate(past.getDate() - 1);
    expect(isTokenExpired(past)).toBe(true);
  });

  it("should use custom 'now' date for comparison", () => {
    const expiresAt = new Date("2025-06-15T00:00:00Z");
    const beforeExpiry = new Date("2025-06-14T00:00:00Z");
    const afterExpiry = new Date("2025-06-16T00:00:00Z");

    expect(isTokenExpired(expiresAt, beforeExpiry)).toBe(false);
    expect(isTokenExpired(expiresAt, afterExpiry)).toBe(true);
  });
});

// ─── isAdmissionClosed ───────────────────────────────────────────────────────

describe("isAdmissionClosed", () => {
  it("should return true for COMPLETED", () => {
    expect(isAdmissionClosed("COMPLETED")).toBe(true);
  });

  it("should return true for CANCELLED", () => {
    expect(isAdmissionClosed("CANCELLED")).toBe(true);
  });

  it("should return true for REJECTED", () => {
    expect(isAdmissionClosed("REJECTED")).toBe(true);
  });

  it("should return false for DRAFT", () => {
    expect(isAdmissionClosed("DRAFT")).toBe(false);
  });

  it("should return false for IN_PROGRESS", () => {
    expect(isAdmissionClosed("IN_PROGRESS")).toBe(false);
  });

  it("should return false for PENDING_APPROVAL", () => {
    expect(isAdmissionClosed("PENDING_APPROVAL")).toBe(false);
  });

  it("should have exactly 3 closed statuses", () => {
    expect(CLOSED_STATUSES).toHaveLength(3);
  });
});

// ─── validateUploadFile ──────────────────────────────────────────────────────

describe("validateUploadFile", () => {
  it("should accept valid PDF", () => {
    const result = validateUploadFile(1024 * 1024, "application/pdf");
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("should accept valid JPEG", () => {
    const result = validateUploadFile(500 * 1024, "image/jpeg");
    expect(result.valid).toBe(true);
  });

  it("should accept valid PNG", () => {
    const result = validateUploadFile(2 * 1024 * 1024, "image/png");
    expect(result.valid).toBe(true);
  });

  it("should accept valid WebP", () => {
    const result = validateUploadFile(100 * 1024, "image/webp");
    expect(result.valid).toBe(true);
  });

  it("should reject files exceeding 10MB", () => {
    const result = validateUploadFile(MAX_FILE_SIZE_BYTES + 1, "application/pdf");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("10MB");
  });

  it("should accept files exactly at 10MB", () => {
    const result = validateUploadFile(MAX_FILE_SIZE_BYTES, "application/pdf");
    expect(result.valid).toBe(true);
  });

  it("should reject unsupported MIME types", () => {
    const result = validateUploadFile(1024, "application/zip");
    expect(result.valid).toBe(false);
    expect(result.error).toContain("não permitido");
  });

  it("should reject executable files", () => {
    const result = validateUploadFile(1024, "application/x-executable");
    expect(result.valid).toBe(false);
  });

  it("should reject text files", () => {
    const result = validateUploadFile(1024, "text/plain");
    expect(result.valid).toBe(false);
  });

  it("should have 5 allowed MIME types", () => {
    expect(ALLOWED_MIME_TYPES).toHaveLength(5);
  });
});

// ─── filterCandidateFields ───────────────────────────────────────────────────

describe("filterCandidateFields", () => {
  it("should filter only allowed fields", () => {
    const input = {
      candidateRg: "12.345.678-9",
      candidateGender: "M",
      status: "COMPLETED", // should be filtered out
      proposedSalary: 5000, // should be filtered out
    };
    const result = filterCandidateFields(input);
    expect(result.data).toHaveProperty("candidateRg", "12.345.678-9");
    expect(result.data).toHaveProperty("candidateGender", "M");
    expect(result.data).not.toHaveProperty("status");
    expect(result.data).not.toHaveProperty("proposedSalary");
    expect(result.filteredCount).toBe(2);
  });

  it("should convert candidateBirthDate to Date", () => {
    const input = { candidateBirthDate: "1990-05-15" };
    const result = filterCandidateFields(input);
    expect(result.data.candidateBirthDate).toBeInstanceOf(Date);
    expect((result.data.candidateBirthDate as Date).toISOString()).toContain("1990-05-15");
  });

  it("should skip undefined values", () => {
    const input = { candidateRg: undefined, candidateGender: "F" };
    const result = filterCandidateFields(input);
    expect(result.data).not.toHaveProperty("candidateRg");
    expect(result.data).toHaveProperty("candidateGender", "F");
    expect(result.filteredCount).toBe(1);
  });

  it("should return empty data for no valid fields", () => {
    const input = { status: "DRAFT", id: "abc", companyId: "xyz" };
    const result = filterCandidateFields(input);
    expect(Object.keys(result.data)).toHaveLength(0);
    expect(result.filteredCount).toBe(0);
  });

  it("should handle all address fields", () => {
    const input = {
      candidateAddress: "Rua A",
      candidateAddressNumber: "123",
      candidateAddressComplement: "Apto 1",
      candidateAddressNeighborhood: "Centro",
      candidateAddressCity: "São Paulo",
      candidateAddressState: "SP",
      candidateAddressZipCode: "01000-000",
    };
    const result = filterCandidateFields(input);
    expect(result.filteredCount).toBe(7);
  });

  it("should handle all bank fields", () => {
    const input = {
      candidateBankName: "Banco do Brasil",
      candidateBankCode: "001",
      candidateBankBranch: "1234",
      candidateBankAgency: "1234",
      candidateBankAccount: "12345",
      candidateBankAccountDigit: "6",
      candidateBankAccountType: "CHECKING",
      candidatePixKey: "12345678900",
    };
    const result = filterCandidateFields(input);
    expect(result.filteredCount).toBe(8);
  });

  it("should have 25 editable fields", () => {
    expect(CANDIDATE_EDITABLE_FIELDS).toHaveLength(25);
  });

  it("should not include sensitive fields", () => {
    const sensitiveFields = [
      "candidateName", "candidateEmail", "candidateCpf",
      "status", "companyId", "recruiterId", "managerId",
      "proposedSalary", "positionId", "departmentId",
      "accessToken", "tokenExpiresAt",
    ];
    for (const field of sensitiveFields) {
      expect(CANDIDATE_EDITABLE_FIELDS).not.toContain(field);
    }
  });
});

// ─── generateStoragePath ─────────────────────────────────────────────────────

describe("generateStoragePath", () => {
  it("should generate correct path with file extension", () => {
    const path = generateStoragePath("company-1", "admission-1", "doc-1", "photo.jpg");
    expect(path).toBe("company-1/admission-1/doc-1.jpg");
  });

  it("should default to pdf extension", () => {
    const path = generateStoragePath("company-1", "admission-1", "doc-1", "document");
    expect(path).toBe("company-1/admission-1/doc-1.pdf");
  });

  it("should handle files with multiple dots", () => {
    const path = generateStoragePath("c", "a", "d", "my.file.name.png");
    expect(path).toBe("c/a/d.png");
  });
});

// ─── generatePortalUrl ───────────────────────────────────────────────────────

describe("generatePortalUrl", () => {
  it("should generate relative URL without base", () => {
    const url = generatePortalUrl("abc-123");
    expect(url).toBe("/admission/portal/abc-123");
  });

  it("should generate absolute URL with base", () => {
    const url = generatePortalUrl("abc-123", "https://app.example.com");
    expect(url).toBe("https://app.example.com/admission/portal/abc-123");
  });
});

// ─── calculateDocumentStats ──────────────────────────────────────────────────

describe("calculateDocumentStats", () => {
  it("should calculate stats for empty documents", () => {
    const stats = calculateDocumentStats([]);
    expect(stats.total).toBe(0);
    expect(stats.required).toBe(0);
    expect(stats.completionPercent).toBe(0);
    expect(stats.requiredComplete).toBe(true); // vacuously true
    expect(stats.allComplete).toBe(true);
  });

  it("should calculate stats for all pending documents", () => {
    const docs = [
      { status: "PENDING", isRequired: true },
      { status: "PENDING", isRequired: true },
      { status: "PENDING", isRequired: false },
    ];
    const stats = calculateDocumentStats(docs);
    expect(stats.total).toBe(3);
    expect(stats.required).toBe(2);
    expect(stats.uploaded).toBe(0);
    expect(stats.pending).toBe(3);
    expect(stats.requiredComplete).toBe(false);
    expect(stats.allComplete).toBe(false);
    expect(stats.completionPercent).toBe(0);
  });

  it("should calculate stats for mixed statuses", () => {
    const docs = [
      { status: "VERIFIED", isRequired: true },
      { status: "UPLOADED", isRequired: true },
      { status: "PENDING", isRequired: false },
      { status: "REJECTED", isRequired: true },
    ];
    const stats = calculateDocumentStats(docs);
    expect(stats.total).toBe(4);
    expect(stats.required).toBe(3);
    expect(stats.uploaded).toBe(2); // UPLOADED + VERIFIED
    expect(stats.verified).toBe(1);
    expect(stats.rejected).toBe(1);
    expect(stats.pending).toBe(1);
    expect(stats.requiredComplete).toBe(false); // one required is REJECTED
    expect(stats.allComplete).toBe(false);
    expect(stats.completionPercent).toBe(50);
  });

  it("should detect all required complete", () => {
    const docs = [
      { status: "VERIFIED", isRequired: true },
      { status: "UPLOADED", isRequired: true },
      { status: "PENDING", isRequired: false },
    ];
    const stats = calculateDocumentStats(docs);
    expect(stats.requiredComplete).toBe(true);
    expect(stats.allComplete).toBe(false);
  });

  it("should detect all complete", () => {
    const docs = [
      { status: "VERIFIED", isRequired: true },
      { status: "UPLOADED", isRequired: false },
    ];
    const stats = calculateDocumentStats(docs);
    expect(stats.requiredComplete).toBe(true);
    expect(stats.allComplete).toBe(true);
    expect(stats.completionPercent).toBe(100);
  });
});
