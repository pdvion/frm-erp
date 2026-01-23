/**
 * Rate Limiting com armazenamento em memória
 * Para produção, considerar usar Redis/Upstash
 */

import { RateLimitError } from "./errors";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitConfig {
  /** Número máximo de requisições permitidas */
  limit: number;
  /** Janela de tempo em segundos */
  windowSeconds: number;
}

// Armazenamento em memória (para produção, usar Redis)
const store = new Map<string, RateLimitEntry>();

// Contador para cleanup lazy (a cada N operações)
let operationCount = 0;
const CLEANUP_INTERVAL = 50;

/**
 * Limpa entradas expiradas (cleanup lazy)
 * Chamado periodicamente durante operações normais
 */
function cleanupExpiredEntries(): void {
  operationCount++;
  if (operationCount < CLEANUP_INTERVAL) return;
  
  operationCount = 0;
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) {
      store.delete(key);
    }
  }
}

/**
 * Configurações padrão para diferentes tipos de operações
 */
export const RATE_LIMITS = {
  /** Login: 5 tentativas por minuto */
  LOGIN: { limit: 5, windowSeconds: 60 },
  /** API geral: 100 requisições por minuto */
  API: { limit: 100, windowSeconds: 60 },
  /** Upload de arquivos: 10 por minuto */
  UPLOAD: { limit: 10, windowSeconds: 60 },
  /** Operações sensíveis: 20 por minuto */
  SENSITIVE: { limit: 20, windowSeconds: 60 },
  /** Relatórios: 30 por minuto */
  REPORTS: { limit: 30, windowSeconds: 60 },
} as const;

export type RateLimitType = keyof typeof RATE_LIMITS;

/**
 * Verifica e aplica rate limiting
 * @param identifier - Identificador único (userId, IP, etc)
 * @param type - Tipo de operação
 * @returns Informações sobre o limite
 * @throws RateLimitError se o limite foi excedido
 */
export function checkRateLimit(
  identifier: string,
  type: RateLimitType
): { remaining: number; resetAt: Date } {
  const config = RATE_LIMITS[type];
  return checkRateLimitCustom(identifier, type, config);
}

/**
 * Verifica rate limiting com configuração customizada
 */
export function checkRateLimitCustom(
  identifier: string,
  namespace: string,
  config: RateLimitConfig
): { remaining: number; resetAt: Date } {
  cleanupExpiredEntries();
  const key = `${namespace}:${identifier}`;
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;

  let entry = store.get(key);

  // Se não existe ou expirou, criar nova entrada
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 1,
      resetAt: now + windowMs,
    };
    store.set(key, entry);
    return {
      remaining: config.limit - 1,
      resetAt: new Date(entry.resetAt),
    };
  }

  // Incrementar contador
  entry.count++;
  store.set(key, entry);

  // Verificar se excedeu o limite
  if (entry.count > config.limit) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    throw new RateLimitError(
      `Limite de ${config.limit} requisições por ${config.windowSeconds}s excedido. Tente novamente em ${retryAfter}s.`,
      retryAfter
    );
  }

  return {
    remaining: config.limit - entry.count,
    resetAt: new Date(entry.resetAt),
  };
}

/**
 * Reseta o rate limit para um identificador específico
 * Útil após login bem-sucedido para resetar tentativas falhas
 */
export function resetRateLimit(identifier: string, type: RateLimitType): void {
  const key = `${type}:${identifier}`;
  store.delete(key);
}

/**
 * Obtém informações do rate limit sem incrementar
 */
export function getRateLimitInfo(
  identifier: string,
  type: RateLimitType
): { count: number; remaining: number; resetAt: Date | null } {
  const config = RATE_LIMITS[type];
  const key = `${type}:${identifier}`;
  const entry = store.get(key);
  const now = Date.now();

  if (!entry || entry.resetAt < now) {
    return {
      count: 0,
      remaining: config.limit,
      resetAt: null,
    };
  }

  return {
    count: entry.count,
    remaining: Math.max(0, config.limit - entry.count),
    resetAt: new Date(entry.resetAt),
  };
}

/**
 * Middleware helper para usar em routers tRPC
 */
export function withRateLimit<T>(
  identifier: string,
  type: RateLimitType,
  operation: () => T | Promise<T>
): T | Promise<T> {
  checkRateLimit(identifier, type);
  return operation();
}

/**
 * Decorator para aplicar rate limiting em funções
 */
export function rateLimited(type: RateLimitType) {
  return function <T extends (...args: unknown[]) => unknown>(
    _target: unknown,
    _propertyKey: string,
    descriptor: TypedPropertyDescriptor<T>
  ): TypedPropertyDescriptor<T> {
    const originalMethod = descriptor.value;
    if (!originalMethod) return descriptor;

    descriptor.value = function (this: unknown, ...args: unknown[]) {
      // Assume primeiro argumento é o contexto com userId ou IP
      const ctx = args[0] as { userId?: string; ip?: string } | undefined;
      const identifier = ctx?.userId || ctx?.ip || "anonymous";
      checkRateLimit(identifier, type);
      return originalMethod.apply(this, args);
    } as T;

    return descriptor;
  };
}
