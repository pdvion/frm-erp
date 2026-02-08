/**
 * Helper centralizado para buscar API keys de IA
 * Resolve inconsistência entre routers (VIO-1018)
 *
 * Ordem de busca (VIO-1019):
 *   1. Supabase Vault (criptografado via pgsodium)
 *   2. systemSettings (fallback legado)
 *
 * Padrão de armazenamento:
 *   Vault: name = "{provider}_token_{companyId}", secret = "sk-..."
 *   systemSettings: key = "{provider}_token", value = { value: "sk-..." }
 */

import type { PrismaClient } from "@prisma/client";
import { getSecret } from "./secrets";

export type AIProvider = "openai" | "anthropic" | "google";

interface GetAIApiKeyOptions {
  provider?: AIProvider;
  fallbackProviders?: AIProvider[];
}

/**
 * Busca a API key de IA configurada para uma empresa
 * Tenta Vault primeiro, fallback para systemSettings
 *
 * @param prisma - Instância do Prisma
 * @param companyId - ID da empresa (tenant)
 * @param options - Provider desejado e fallbacks
 * @returns API key string ou null se não configurada
 */
export async function getAIApiKey(
  prisma: PrismaClient,
  companyId: string,
  options: GetAIApiKeyOptions = {}
): Promise<{ apiKey: string; provider: AIProvider } | null> {
  const {
    provider = "openai",
    fallbackProviders = [],
  } = options;

  const providers = [provider, ...fallbackProviders];

  for (const p of providers) {
    const key = `${p}_token`;

    // 1. Tentar Supabase Vault (criptografado)
    try {
      const vaultSecret = await getSecret(prisma, key, companyId);
      if (vaultSecret && vaultSecret.length > 0) {
        return { apiKey: vaultSecret, provider: p };
      }
    } catch {
      // Vault indisponível — seguir para fallback
    }

    // 2. Fallback: systemSettings (legado)
    const setting = await prisma.systemSetting.findFirst({
      where: {
        key,
        companyId,
      },
    });

    if (!setting?.value) continue;

    // Extrair valor — suporta ambos os formatos por segurança
    const raw = setting.value;
    let apiKey: string | null = null;

    if (typeof raw === "string") {
      // Formato legado: valor direto como string
      apiKey = raw;
    } else if (typeof raw === "object" && raw !== null && "value" in raw) {
      // Formato padrão: { value: "sk-..." }
      const val = (raw as { value: unknown }).value;
      if (typeof val === "string") {
        apiKey = val;
      }
    }

    if (apiKey && apiKey.length > 0) {
      return { apiKey, provider: p };
    }
  }

  return null;
}

/**
 * Busca a API key OpenAI com fallback para outros providers
 * Atalho conveniente para o caso mais comum
 */
export async function getOpenAIKey(
  prisma: PrismaClient,
  companyId: string
): Promise<string | null> {
  const result = await getAIApiKey(prisma, companyId, {
    provider: "openai",
    fallbackProviders: ["anthropic", "google"],
  });
  return result?.apiKey ?? null;
}

/**
 * Busca a API key Google com fallback
 * Usado para embeddings (Google Gemini text-embedding-004)
 */
export async function getGoogleKey(
  prisma: PrismaClient,
  companyId: string
): Promise<string | null> {
  const result = await getAIApiKey(prisma, companyId, {
    provider: "google",
  });
  return result?.apiKey ?? null;
}
