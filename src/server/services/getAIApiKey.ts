/**
 * Helper centralizado para buscar API keys de IA
 * Resolve inconsistência entre routers (VIO-1018)
 *
 * Padrão de armazenamento no systemSettings:
 *   key: "{provider}_token"
 *   value: { value: "sk-..." }  (JSON com campo value)
 *
 * Futuramente será migrado para Supabase Vault (VIO-1019)
 */

import type { PrismaClient } from "@prisma/client";

export type AIProvider = "openai" | "anthropic" | "google";

interface GetAIApiKeyOptions {
  provider?: AIProvider;
  fallbackProviders?: AIProvider[];
}

/**
 * Busca a API key de IA configurada para uma empresa
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
