/**
 * @deprecated NÃO USAR — Este módulo usa Map em memória para armazenar tokens,
 * o que é incompatível com ambientes serverless (Vercel). Cada invocação cria
 * um novo processo, então tokens gerados nunca serão encontrados na validação.
 *
 * A proteção CSRF ativa está em src/server/trpc.ts via middleware de validação
 * de Origin header (stateless, funciona em serverless).
 *
 * Este arquivo é mantido apenas como referência. Remover em cleanup futuro.
 * Ver: VIO-1057
 */

import { randomBytes, createHmac } from "crypto";

const CSRF_SECRET = process.env.CSRF_SECRET;

// Validar secret em produção
if (!CSRF_SECRET && process.env.NODE_ENV === "production") {
  throw new Error("CSRF_SECRET environment variable is required in production");
}

// Fallback para desenvolvimento/testes
const SECRET = CSRF_SECRET || "dev-csrf-secret-not-for-production";
const TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hora

interface CSRFToken {
  token: string;
  expiresAt: number;
}

// Armazenamento em memória (para produção, usar Redis)
const tokenStore = new Map<string, CSRFToken>();

// Contador para cleanup lazy (a cada N operações)
let operationCount = 0;
const CLEANUP_INTERVAL = 100;

/**
 * Limpa tokens expirados (cleanup lazy)
 * Chamado periodicamente durante operações normais
 */
function cleanupExpiredTokens(): void {
  operationCount++;
  if (operationCount < CLEANUP_INTERVAL) return;
  
  operationCount = 0;
  const now = Date.now();
  for (const [key, value] of tokenStore.entries()) {
    if (value.expiresAt < now) {
      tokenStore.delete(key);
    }
  }
}

/**
 * Gera um token CSRF para uma sessão
 * @param sessionId - ID da sessão do usuário
 * @returns Token CSRF
 */
export function generateCSRFToken(sessionId: string): string {
  cleanupExpiredTokens();
  const timestamp = Date.now();
  const random = randomBytes(32).toString("hex");
  const data = `${sessionId}:${timestamp}:${random}`;
  
  const hmac = createHmac("sha256", SECRET);
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
    const hmac = createHmac("sha256", SECRET);
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
