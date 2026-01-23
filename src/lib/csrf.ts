/**
 * CSRF Protection
 * Gera e valida tokens CSRF para proteger mutations
 */

import { randomBytes, createHmac } from "crypto";

const CSRF_SECRET = process.env.CSRF_SECRET || "frm-erp-csrf-secret-change-in-production";
const TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hora

interface CSRFToken {
  token: string;
  expiresAt: number;
}

// Armazenamento em memória (para produção, usar Redis)
const tokenStore = new Map<string, CSRFToken>();

// Limpar tokens expirados periodicamente
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of tokenStore.entries()) {
    if (value.expiresAt < now) {
      tokenStore.delete(key);
    }
  }
}, 300000); // Limpar a cada 5 minutos

/**
 * Gera um token CSRF para uma sessão
 * @param sessionId - ID da sessão do usuário
 * @returns Token CSRF
 */
export function generateCSRFToken(sessionId: string): string {
  const timestamp = Date.now();
  const random = randomBytes(32).toString("hex");
  const data = `${sessionId}:${timestamp}:${random}`;
  
  const hmac = createHmac("sha256", CSRF_SECRET);
  hmac.update(data);
  const signature = hmac.digest("hex");
  
  const token = `${Buffer.from(data).toString("base64")}.${signature}`;
  
  tokenStore.set(sessionId, {
    token,
    expiresAt: timestamp + TOKEN_EXPIRY_MS,
  });
  
  return token;
}

/**
 * Valida um token CSRF
 * @param sessionId - ID da sessão do usuário
 * @param token - Token CSRF a validar
 * @returns true se válido
 */
export function validateCSRFToken(sessionId: string, token: string): boolean {
  if (!token || !sessionId) {
    return false;
  }

  const stored = tokenStore.get(sessionId);
  if (!stored) {
    return false;
  }

  // Verificar expiração
  if (stored.expiresAt < Date.now()) {
    tokenStore.delete(sessionId);
    return false;
  }

  // Verificar token
  if (stored.token !== token) {
    return false;
  }

  // Validar assinatura
  try {
    const [dataBase64, signature] = token.split(".");
    if (!dataBase64 || !signature) {
      return false;
    }

    const data = Buffer.from(dataBase64, "base64").toString();
    const hmac = createHmac("sha256", CSRF_SECRET);
    hmac.update(data);
    const expectedSignature = hmac.digest("hex");

    return signature === expectedSignature;
  } catch {
    return false;
  }
}

/**
 * Invalida o token CSRF de uma sessão
 * @param sessionId - ID da sessão
 */
export function invalidateCSRFToken(sessionId: string): void {
  tokenStore.delete(sessionId);
}

/**
 * Renova o token CSRF de uma sessão
 * @param sessionId - ID da sessão
 * @returns Novo token CSRF
 */
export function renewCSRFToken(sessionId: string): string {
  invalidateCSRFToken(sessionId);
  return generateCSRFToken(sessionId);
}

/**
 * Header name para o token CSRF
 */
export const CSRF_HEADER = "x-csrf-token";

/**
 * Cookie name para o token CSRF
 */
export const CSRF_COOKIE = "csrf-token";
