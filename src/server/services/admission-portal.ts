/**
 * Admission Portal Service
 * VIO-1102 — Admissão Digital Fase 3
 * 
 * Pure functions for token management and candidate portal validation
 */

const TOKEN_DEFAULT_EXPIRY_DAYS = 7;
const TOKEN_MAX_EXPIRY_DAYS = 90;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
];

const CANDIDATE_EDITABLE_FIELDS = [
  "candidateRg",
  "candidateBirthDate",
  "candidateGender",
  "candidateMaritalStatus",
  "candidateMobile",
  "candidateAddress",
  "candidateAddressNumber",
  "candidateAddressComplement",
  "candidateAddressNeighborhood",
  "candidateAddressCity",
  "candidateAddressState",
  "candidateAddressZipCode",
  "candidatePis",
  "candidateCtps",
  "candidateCtpsSeries",
  "candidateVoterRegistration",
  "candidateMilitaryService",
  "candidateBankName",
  "candidateBankCode",
  "candidateBankBranch",
  "candidateBankAgency",
  "candidateBankAccount",
  "candidateBankAccountDigit",
  "candidateBankAccountType",
  "candidatePixKey",
] as const;

const CLOSED_STATUSES = ["COMPLETED", "CANCELLED", "REJECTED"];

export interface TokenConfig {
  expiresInDays?: number;
}

export interface TokenResult {
  token: string;
  expiresAt: Date;
}

export interface FileValidation {
  valid: boolean;
  error?: string;
}

export interface FieldFilter {
  data: Record<string, unknown>;
  filteredCount: number;
}

/**
 * Generate a token expiration date
 */
export function calculateTokenExpiry(config?: TokenConfig): Date {
  const days = Math.min(
    Math.max(config?.expiresInDays ?? TOKEN_DEFAULT_EXPIRY_DAYS, 1),
    TOKEN_MAX_EXPIRY_DAYS
  );
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + days);
  return expiresAt;
}

/**
 * Check if a token has expired
 */
export function isTokenExpired(expiresAt: Date | null, now?: Date): boolean {
  if (!expiresAt) return false; // No expiry = never expires
  return (now ?? new Date()) > expiresAt;
}

/**
 * Check if an admission process is in a closed/read-only state
 */
export function isAdmissionClosed(status: string): boolean {
  return CLOSED_STATUSES.includes(status);
}

/**
 * Validate a file for upload
 */
export function validateUploadFile(
  fileSize: number,
  mimeType: string
): FileValidation {
  if (fileSize > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `Arquivo excede o tamanho máximo de ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB`,
    };
  }

  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return {
      valid: false,
      error: `Tipo de arquivo não permitido. Aceitos: PDF, JPEG, PNG, WebP, HEIC`,
    };
  }

  return { valid: true };
}

/**
 * Filter input data to only include candidate-editable fields
 * Prevents candidates from modifying status, salary, etc.
 */
export function filterCandidateFields(
  input: Record<string, unknown>
): FieldFilter {
  const data: Record<string, unknown> = {};
  let filteredCount = 0;

  for (const field of CANDIDATE_EDITABLE_FIELDS) {
    if (field in input && input[field] !== undefined) {
      if (field === "candidateBirthDate" && input[field]) {
        const parsed = new Date(String(input[field]));
        if (Number.isNaN(parsed.getTime())) continue;
        data[field] = parsed;
      } else {
        data[field] = input[field];
      }
      filteredCount++;
    }
  }

  return { data, filteredCount };
}

/**
 * Generate the storage path for a document upload
 */
export function generateStoragePath(
  companyId: string,
  admissionId: string,
  documentId: string,
  fileName: string
): string {
  const parts = fileName.split(".");
  const ext = parts.length > 1 ? parts.pop()! : "pdf";
  return `${companyId}/${admissionId}/${documentId}.${ext}`;
}

/**
 * Generate the portal URL for a candidate
 */
export function generatePortalUrl(token: string, baseUrl?: string): string {
  const base = baseUrl || "";
  return `${base}/admission/portal/${token}`;
}

export interface DocumentStatusInput {
  status: string;
  isRequired: boolean | null;
}

export interface DocumentStats {
  total: number;
  required: number;
  uploaded: number;
  verified: number;
  rejected: number;
  pending: number;
  requiredComplete: boolean;
  allComplete: boolean;
  completionPercent: number;
}

/**
 * Calculate document completion stats
 */
export function calculateDocumentStats(
  documents: DocumentStatusInput[]
): DocumentStats {
  const total = documents.length;
  const required = documents.filter((d) => d.isRequired).length;
  const uploaded = documents.filter((d) => d.status === "UPLOADED" || d.status === "VERIFIED").length;
  const verified = documents.filter((d) => d.status === "VERIFIED").length;
  const rejected = documents.filter((d) => d.status === "REJECTED").length;
  const pending = documents.filter((d) => d.status === "PENDING").length;

  const requiredDocs = documents.filter((d) => d.isRequired);
  const requiredComplete = requiredDocs.every(
    (d) => d.status === "UPLOADED" || d.status === "VERIFIED"
  );
  const allComplete = documents.every(
    (d) => d.status === "UPLOADED" || d.status === "VERIFIED"
  );

  const completionPercent = total > 0 ? Math.round((uploaded / total) * 100) : 0;

  return {
    total,
    required,
    uploaded,
    verified,
    rejected,
    pending,
    requiredComplete,
    allComplete,
    completionPercent,
  };
}

export {
  CANDIDATE_EDITABLE_FIELDS,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  TOKEN_DEFAULT_EXPIRY_DAYS,
  TOKEN_MAX_EXPIRY_DAYS,
  CLOSED_STATUSES,
};
