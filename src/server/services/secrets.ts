/**
 * Serviço para gerenciamento de secrets usando Supabase Vault nativo
 * Usa vault.secrets com pgsodium para criptografia
 * 
 * @see https://supabase.com/docs/guides/database/vault
 */

import { prisma } from "@/lib/prisma";

export type SecretName = 
  | "openai_token"
  | "anthropic_token"
  | "google_token"
  | "sefaz_certificate"
  | "sefaz_certificate_key"
  | "email_nfe_password"
  | "webhook_secret"
  | string;

/**
 * Gera o nome do secret com prefixo da empresa
 */
function getSecretName(name: SecretName, companyId: string): string {
  return `${name}_${companyId}`;
}

/**
 * Salva um secret no Supabase Vault
 */
export async function saveSecret(
  name: SecretName,
  value: string,
  companyId: string,
  description?: string
): Promise<string> {
  const secretName = getSecretName(name, companyId);
  
  // Verificar se já existe e deletar (upsert)
  await prisma.$executeRaw`
    DELETE FROM vault.secrets WHERE name = ${secretName}
  `;
  
  // Inserir novo secret
  const result = await prisma.$queryRaw<{ id: string }[]>`
    INSERT INTO vault.secrets (name, secret, description)
    VALUES (
      ${secretName},
      ${value},
      ${description ?? `Secret ${name} para company ${companyId}`}
    )
    RETURNING id::text
  `;
  
  return result[0]?.id ?? "";
}

/**
 * Recupera um secret descriptografado do Vault
 */
export async function getSecret(
  name: SecretName,
  companyId: string
): Promise<string | null> {
  const secretName = getSecretName(name, companyId);
  
  const result = await prisma.$queryRaw<{ secret: string | null }[]>`
    SELECT secret FROM vault.decrypted_secrets 
    WHERE name = ${secretName}
    LIMIT 1
  `;
  
  return result[0]?.secret ?? null;
}

/**
 * Remove um secret do Vault
 */
export async function deleteSecret(
  name: SecretName,
  companyId: string
): Promise<boolean> {
  const secretName = getSecretName(name, companyId);
  
  const result = await prisma.$executeRaw`
    DELETE FROM vault.secrets WHERE name = ${secretName}
  `;
  
  return result > 0;
}

/**
 * Verifica se um secret existe no Vault
 */
export async function hasSecret(
  name: SecretName,
  companyId: string
): Promise<boolean> {
  const secretName = getSecretName(name, companyId);
  
  const result = await prisma.$queryRaw<{ exists: boolean }[]>`
    SELECT EXISTS(
      SELECT 1 FROM vault.secrets WHERE name = ${secretName}
    ) as exists
  `;
  
  return result[0]?.exists ?? false;
}

/**
 * Lista todos os secrets de uma empresa (sem valores)
 */
export async function listSecrets(companyId: string): Promise<{
  name: string;
  description: string | null;
  createdAt: Date;
}[]> {
  const prefix = `%_${companyId}`;
  
  const secrets = await prisma.$queryRaw<{
    name: string;
    description: string | null;
    created_at: Date;
  }[]>`
    SELECT name, description, created_at 
    FROM vault.secrets 
    WHERE name LIKE ${prefix}
    ORDER BY name ASC
  `;
  
  return secrets.map(s => ({
    name: s.name.replace(`_${companyId}`, ""),
    description: s.description,
    createdAt: s.created_at ?? new Date(),
  }));
}

/**
 * Migra secrets do system_settings para o Vault
 */
export async function migrateSecretsFromSystemSettings(
  companyId: string,
  secretKeys: string[]
): Promise<{ migrated: string[]; skipped: string[] }> {
  const migrated: string[] = [];
  const skipped: string[] = [];
  
  for (const key of secretKeys) {
    const setting = await prisma.systemSetting.findFirst({
      where: { key, companyId },
    });
    
    if (!setting) {
      skipped.push(key);
      continue;
    }
    
    const value = setting.value as { value?: string } | string;
    const secretValue = typeof value === "string" ? value : value?.value;
    
    if (!secretValue) {
      skipped.push(key);
      continue;
    }
    
    await saveSecret(key, secretValue, companyId, setting.description ?? undefined);
    migrated.push(key);
  }
  
  return { migrated, skipped };
}
