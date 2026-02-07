import OpenAI from "openai";
import type { PrismaClient } from "@prisma/client";
import { Prisma } from "@prisma/client";

// ============================================
// TYPES
// ============================================

export interface EmbeddingInput {
  entityType: string;
  entityId: string;
  companyId: string;
  content: string;
  metadata?: Record<string, unknown>;
  model?: string;
}

export interface EmbeddingResult {
  entityType: string;
  entityId: string;
  embedding: number[];
  tokenCount: number;
}

export interface BatchResult {
  total: number;
  success: number;
  failed: number;
  errors: Array<{ entityId: string; error: string }>;
}

export interface MaterialEmbeddingData {
  id: string;
  code: number;
  description: string;
  internalCode?: string | null;
  ncm?: string | null;
  unit: string;
  categoryName?: string | null;
  subCategoryName?: string | null;
  manufacturer?: string | null;
  notes?: string | null;
  barcode?: string | null;
}

// ============================================
// CONSTANTS
// ============================================

const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_DIMENSIONS = 1536;
const MAX_BATCH_SIZE = 2048;
const BATCH_DELAY_MS = 200;

// ============================================
// TEXT COMPOSITION
// ============================================

/**
 * Compõe o texto para embedding de um material
 * Combina campos relevantes para busca semântica
 */
export function composeMaterialEmbeddingText(material: MaterialEmbeddingData): string {
  const parts: string[] = [];

  parts.push(material.description);

  if (material.internalCode) {
    parts.push(`Código interno: ${material.internalCode}`);
  }

  parts.push(`Código: ${material.code}`);

  if (material.ncm) {
    parts.push(`NCM: ${material.ncm}`);
  }

  if (material.categoryName) {
    parts.push(`Categoria: ${material.categoryName}`);
  }

  if (material.subCategoryName) {
    parts.push(`Subcategoria: ${material.subCategoryName}`);
  }

  parts.push(`Unidade: ${material.unit}`);

  if (material.manufacturer) {
    parts.push(`Fabricante: ${material.manufacturer}`);
  }

  if (material.barcode) {
    parts.push(`Código de barras: ${material.barcode}`);
  }

  if (material.notes) {
    parts.push(`Observações: ${material.notes}`);
  }

  return parts.join(" | ");
}

// ============================================
// EMBEDDING GENERATION
// ============================================

/**
 * Gera embedding para um único texto
 */
export async function generateEmbedding(
  text: string,
  apiKey: string
): Promise<{ embedding: number[]; tokenCount: number }> {
  const openai = new OpenAI({ apiKey });

  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
    dimensions: EMBEDDING_DIMENSIONS,
  });

  return {
    embedding: response.data[0].embedding,
    tokenCount: response.usage.total_tokens,
  };
}

/**
 * Gera embeddings em batch (máx 2048 por chamada da API)
 */
export async function generateEmbeddingsBatch(
  texts: string[],
  apiKey: string
): Promise<Array<{ embedding: number[]; tokenCount: number }>> {
  const openai = new OpenAI({ apiKey });
  const results: Array<{ embedding: number[]; tokenCount: number }> = [];

  // Processar em chunks de MAX_BATCH_SIZE
  for (let i = 0; i < texts.length; i += MAX_BATCH_SIZE) {
    const chunk = texts.slice(i, i + MAX_BATCH_SIZE);

    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: chunk,
      dimensions: EMBEDDING_DIMENSIONS,
    });

    const tokensPerItem = Math.ceil(response.usage.total_tokens / chunk.length);

    for (const item of response.data) {
      results.push({
        embedding: item.embedding,
        tokenCount: tokensPerItem,
      });
    }

    // Rate limiting entre batches
    if (i + MAX_BATCH_SIZE < texts.length) {
      await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
    }
  }

  return results;
}

// ============================================
// PERSISTENCE (raw SQL — pgvector)
// ============================================

/**
 * Insere ou atualiza embedding no banco (upsert via raw SQL)
 */
export async function upsertEmbedding(
  prisma: PrismaClient,
  input: EmbeddingInput,
  embedding: number[]
): Promise<void> {
  const vectorStr = `[${embedding.join(",")}]`;
  const metadata = input.metadata ? JSON.stringify(input.metadata) : "{}";
  const model = input.model ?? EMBEDDING_MODEL;

  await prisma.$executeRaw`
    INSERT INTO embeddings (
      id, entity_type, entity_id, company_id, content, embedding, model, metadata, created_at, updated_at
    ) VALUES (
      gen_random_uuid(),
      ${input.entityType},
      ${input.entityId}::uuid,
      ${input.companyId}::uuid,
      ${input.content},
      ${vectorStr}::vector(1536),
      ${model},
      ${metadata}::jsonb,
      NOW(),
      NOW()
    )
    ON CONFLICT (entity_type, entity_id)
    DO UPDATE SET
      content = EXCLUDED.content,
      embedding = EXCLUDED.embedding,
      model = EXCLUDED.model,
      metadata = EXCLUDED.metadata,
      updated_at = NOW()
  `;
}

/**
 * Remove embedding de uma entidade
 */
export async function deleteEmbedding(
  prisma: PrismaClient,
  entityType: string,
  entityId: string
): Promise<void> {
  await prisma.$executeRaw`
    DELETE FROM embeddings
    WHERE entity_type = ${entityType}
      AND entity_id = ${entityId}::uuid
  `;
}

/**
 * Processa embeddings em batch para materiais
 */
export async function processEmbeddingsBatch(
  prisma: PrismaClient,
  materials: MaterialEmbeddingData[],
  companyId: string,
  apiKey: string
): Promise<BatchResult> {
  const result: BatchResult = {
    total: materials.length,
    success: 0,
    failed: 0,
    errors: [],
  };

  // Compor textos
  const texts = materials.map(composeMaterialEmbeddingText);

  // Gerar embeddings em batch
  let embeddings: Array<{ embedding: number[]; tokenCount: number }>;
  try {
    embeddings = await generateEmbeddingsBatch(texts, apiKey);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return {
      ...result,
      failed: materials.length,
      errors: materials.map((m) => ({ entityId: m.id, error: message })),
    };
  }

  // Persistir cada embedding
  for (let i = 0; i < materials.length; i++) {
    try {
      await upsertEmbedding(prisma, {
        entityType: "material",
        entityId: materials[i].id,
        companyId,
        content: texts[i],
        metadata: {
          code: materials[i].code,
          ncm: materials[i].ncm,
          tokenCount: embeddings[i].tokenCount,
        },
      }, embeddings[i].embedding);

      result.success++;
    } catch (error) {
      result.failed++;
      result.errors.push({
        entityId: materials[i].id,
        error: error instanceof Error ? error.message : "Erro ao persistir",
      });
    }
  }

  return result;
}

// ============================================
// STATUS
// ============================================

export interface EmbeddingStatus {
  totalMaterials: number;
  totalEmbeddings: number;
  pendingCount: number;
  coveragePercent: number;
  lastUpdated: Date | null;
}

/**
 * Retorna status dos embeddings para uma empresa
 */
export async function getEmbeddingStatus(
  prisma: PrismaClient,
  companyId: string
): Promise<EmbeddingStatus> {
  const [totalMaterials, embeddingData] = await Promise.all([
    prisma.material.count({
      where: {
        OR: [{ companyId }, { isShared: true }],
        status: "ACTIVE",
      },
    }),
    prisma.embedding.findMany({
      where: {
        entityType: "material",
        companyId,
      },
      select: {
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const totalEmbeddings = embeddingData.length;
  const pendingCount = totalMaterials - totalEmbeddings;
  const coveragePercent = totalMaterials > 0
    ? Math.round((totalEmbeddings / totalMaterials) * 100)
    : 0;
  const lastUpdated = embeddingData[0]?.updatedAt ?? null;

  return {
    totalMaterials,
    totalEmbeddings,
    pendingCount,
    coveragePercent,
    lastUpdated,
  };
}
