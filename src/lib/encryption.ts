/**
 * Application-level AES-256-GCM encryption for sensitive fields stored in Prisma models.
 * VIO-1090 — Encrypt secrets at rest
 *
 * Uses ENCRYPTION_KEY env var (32-byte hex = 64 chars).
 * Format: "enc_v1:<iv_hex>:<authTag_hex>:<ciphertext_hex>"
 *
 * For AI tokens, prefer Supabase Vault via src/server/services/secrets.ts.
 * This module is for model-level fields (NfseConfig.password, DdaConfig.clientSecret, etc.)
 */

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits recommended for GCM
const PREFIX = "enc_v1:";

/**
 * Get the encryption key from environment.
 * Returns null if not configured (encryption disabled).
 */
function getEncryptionKey(): Buffer | null {
  const hex = process.env.ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) return null;
  return Buffer.from(hex, "hex");
}

/**
 * Check if a value is already encrypted
 */
export function isEncrypted(value: string | null | undefined): boolean {
  return typeof value === "string" && value.startsWith(PREFIX);
}

/**
 * Encrypt a plaintext string.
 * Returns the encrypted string or the original if encryption is not configured.
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) return plaintext;
  if (isEncrypted(plaintext)) return plaintext; // Already encrypted

  const key = getEncryptionKey();
  if (!key) return plaintext; // Encryption not configured — passthrough

  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  return `${PREFIX}${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * Decrypt an encrypted string.
 * Returns the plaintext or the original if not encrypted / encryption not configured.
 */
export function decrypt(ciphertext: string): string {
  if (!ciphertext) return ciphertext;
  if (!isEncrypted(ciphertext)) return ciphertext; // Not encrypted — passthrough

  const key = getEncryptionKey();
  if (!key) {
    console.warn("ENCRYPTION_KEY not set — cannot decrypt value");
    return ciphertext;
  }

  const parts = ciphertext.slice(PREFIX.length).split(":");
  if (parts.length !== 3) {
    console.warn("Invalid encrypted format");
    return ciphertext;
  }

  const [ivHex, authTagHex, encryptedHex] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedHex, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Encrypt a value only if it's not null/undefined/empty.
 * Convenience for optional fields.
 */
export function encryptOptional(value: string | null | undefined): string | null | undefined {
  if (value === null || value === undefined) return value;
  if (!value) return value;
  return encrypt(value);
}

/**
 * Decrypt a value only if it's not null/undefined/empty.
 * Convenience for optional fields.
 */
export function decryptOptional(value: string | null | undefined): string | null | undefined {
  if (value === null || value === undefined) return value;
  if (!value) return value;
  return decrypt(value);
}

/**
 * Redact a value for display (show first/last chars or mask entirely).
 */
export function redactSecret(value: string | null | undefined): string | null {
  if (!value) return null;
  if (isEncrypted(value)) return "••••••••";
  if (value.length <= 8) return "••••••••";
  return `${value.substring(0, 4)}${"•".repeat(Math.min(8, value.length - 8))}${value.substring(value.length - 4)}`;
}
