import OpenAI from "openai";
import type { PrismaClient } from "@prisma/client";

// ============================================
// TYPES
// ============================================

export interface EmbeddingInput {
  entityType: EmbeddableEntity;
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

/** Entidades suportadas para embedding */
export type EmbeddableEntity = "material" | "product" | "customer" | "supplier" | "employee";

export const EMBEDDABLE_ENTITIES: EmbeddableEntity[] = [
  "material", "product", "customer", "supplier", "employee",
];

// --- Data interfaces por entidade ---

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

export interface ProductEmbeddingData {
  id: string;
  code: string;
  name: string;
  shortDescription?: string | null;
  description?: string | null;
  tags?: string[];
  categoryName?: string | null;
  materialDescription?: string | null;
  specifications?: Record<string, unknown> | null;
}

export interface CustomerEmbeddingData {
  id: string;
  code: string;
  companyName: string;
  tradeName?: string | null;
  cnpj?: string | null;
  cpf?: string | null;
  city?: string | null;
  state?: string | null;
  contactName?: string | null;
  notes?: string | null;
  segment?: string | null;
}

export interface SupplierEmbeddingData {
  id: string;
  code: number;
  companyName: string;
  tradeName?: string | null;
  cnpj?: string | null;
  city?: string | null;
  state?: string | null;
  cnae?: string | null;
  categories?: string[];
  notes?: string | null;
}

export interface EmployeeEmbeddingData {
  id: string;
  code: number;
  name: string;
  cpf?: string | null;
  email?: string | null;
  departmentName?: string | null;
  positionName?: string | null;
  contractType: string;
  notes?: string | null;
}

/** Union de todos os tipos de dados de embedding */
export type EntityEmbeddingData =
  | { type: "material"; data: MaterialEmbeddingData }
  | { type: "product"; data: ProductEmbeddingData }
  | { type: "customer"; data: CustomerEmbeddingData }
  | { type: "supplier"; data: SupplierEmbeddingData }
  | { type: "employee"; data: EmployeeEmbeddingData };

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

/** Helper: junta partes não-nulas com separador pipe */
function joinParts(parts: (string | null | undefined | false)[]): string {
  return parts.filter(Boolean).join(" | ");
}

export function composeMaterialEmbeddingText(d: MaterialEmbeddingData): string {
  return joinParts([
    d.description,
    d.internalCode && `Código interno: ${d.internalCode}`,
    `Código: ${d.code}`,
    d.ncm && `NCM: ${d.ncm}`,
    d.categoryName && `Categoria: ${d.categoryName}`,
    d.subCategoryName && `Subcategoria: ${d.subCategoryName}`,
    `Unidade: ${d.unit}`,
    d.manufacturer && `Fabricante: ${d.manufacturer}`,
    d.barcode && `Código de barras: ${d.barcode}`,
    d.notes && `Observações: ${d.notes}`,
  ]);
}

export function composeProductEmbeddingText(d: ProductEmbeddingData): string {
  const specsStr = d.specifications
    ? Object.entries(d.specifications).map(([k, v]) => `${k}: ${v}`).join(", ")
    : null;

  return joinParts([
    d.name,
    `SKU: ${d.code}`,
    d.shortDescription,
    d.description,
    d.categoryName && `Categoria: ${d.categoryName}`,
    d.materialDescription && `Material: ${d.materialDescription}`,
    d.tags && d.tags.length > 0 && `Tags: ${d.tags.join(", ")}`,
    specsStr && `Especificações: ${specsStr}`,
  ]);
}

export function composeCustomerEmbeddingText(d: CustomerEmbeddingData): string {
  return joinParts([
    d.companyName,
    d.tradeName && `Nome fantasia: ${d.tradeName}`,
    `Código: ${d.code}`,
    d.cnpj && `CNPJ: ${d.cnpj}`,
    d.cpf && `CPF: ${d.cpf}`,
    d.city && d.state && `${d.city}/${d.state}`,
    d.contactName && `Contato: ${d.contactName}`,
    d.segment && `Segmento: ${d.segment}`,
    d.notes && `Observações: ${d.notes}`,
  ]);
}

export function composeSupplierEmbeddingText(d: SupplierEmbeddingData): string {
  return joinParts([
    d.companyName,
    d.tradeName && `Nome fantasia: ${d.tradeName}`,
    `Código: ${d.code}`,
    d.cnpj && `CNPJ: ${d.cnpj}`,
    d.city && d.state && `${d.city}/${d.state}`,
    d.cnae && `CNAE: ${d.cnae}`,
    d.categories && d.categories.length > 0 && `Categorias: ${d.categories.join(", ")}`,
    d.notes && `Observações: ${d.notes}`,
  ]);
}

export function composeEmployeeEmbeddingText(d: EmployeeEmbeddingData): string {
  return joinParts([
    d.name,
    `Matrícula: ${d.code}`,
    d.cpf && `CPF: ${d.cpf}`,
    d.email && `Email: ${d.email}`,
    d.departmentName && `Departamento: ${d.departmentName}`,
    d.positionName && `Cargo: ${d.positionName}`,
    `Contrato: ${d.contractType}`,
    d.notes && `Observações: ${d.notes}`,
  ]);
}

/** Compõe texto de embedding para qualquer entidade suportada */
export function composeEmbeddingText(entity: EntityEmbeddingData): string {
  switch (entity.type) {
    case "material": return composeMaterialEmbeddingText(entity.data);
    case "product": return composeProductEmbeddingText(entity.data);
    case "customer": return composeCustomerEmbeddingText(entity.data);
    case "supplier": return composeSupplierEmbeddingText(entity.data);
    case "employee": return composeEmployeeEmbeddingText(entity.data);
  }
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

// ============================================
// SEMANTIC SEARCH
// ============================================

export interface SemanticSearchResult {
  entityId: string;
  content: string;
  similarity: number;
  metadata: Record<string, unknown>;
}

/**
 * Busca semântica usando pgvector (cosine similarity)
 * Usa a função match_embeddings() do Supabase
 */
export async function semanticSearch(
  prisma: PrismaClient,
  query: string,
  apiKey: string,
  options: {
    entityType?: EmbeddableEntity;
    entityTypes?: EmbeddableEntity[];
    companyId: string;
    threshold?: number;
    limit?: number;
  }
): Promise<SemanticSearchResult[]> {
  // Gerar embedding da query
  const { embedding } = await generateEmbedding(query, apiKey);
  const vectorStr = `[${embedding.join(",")}]`;

  const threshold = options.threshold ?? 0.5;
  const limit = options.limit ?? 10;

  // Determinar tipos de entidade
  const types = options.entityTypes ?? (options.entityType ? [options.entityType] : EMBEDDABLE_ENTITIES);

  // Buscar em cada tipo e combinar resultados
  const allResults: SemanticSearchResult[] = [];

  for (const entityType of types) {
    const results = await prisma.$queryRawUnsafe<SemanticSearchResult[]>(
      `SELECT entity_id AS "entityId", content, similarity, metadata
       FROM match_embeddings($1::vector(1536), $2, $3::uuid, $4, $5)`,
      vectorStr,
      entityType,
      options.companyId,
      threshold,
      limit
    );

    allResults.push(...results.map((r) => ({ ...r, entityType })));
  }

  // Ordenar por similaridade e limitar
  return allResults
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}

/**
 * Busca semântica com enriquecimento de dados da entidade
 */
export interface EnrichedSearchResult extends SemanticSearchResult {
  entityType: string;
  entity?: Record<string, unknown>;
}

/**
 * Processa embeddings em batch para qualquer entidade
 */
export async function processEmbeddingsBatch(
  prisma: PrismaClient,
  entities: EntityEmbeddingData[],
  companyId: string,
  apiKey: string
): Promise<BatchResult> {
  const result: BatchResult = {
    total: entities.length,
    success: 0,
    failed: 0,
    errors: [],
  };

  // Compor textos
  const texts = entities.map(composeEmbeddingText);

  // Gerar embeddings em batch
  let embeddings: Array<{ embedding: number[]; tokenCount: number }>;
  try {
    embeddings = await generateEmbeddingsBatch(texts, apiKey);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return {
      ...result,
      failed: entities.length,
      errors: entities.map((e) => ({ entityId: e.data.id, error: message })),
    };
  }

  // Persistir cada embedding
  for (let i = 0; i < entities.length; i++) {
    const entity = entities[i];
    try {
      await upsertEmbedding(prisma, {
        entityType: entity.type,
        entityId: entity.data.id,
        companyId,
        content: texts[i],
        metadata: {
          tokenCount: embeddings[i].tokenCount,
        },
      }, embeddings[i].embedding);

      result.success++;
    } catch (error) {
      result.failed++;
      result.errors.push({
        entityId: entity.data.id,
        error: error instanceof Error ? error.message : "Erro ao persistir",
      });
    }
  }

  return result;
}

// ============================================
// STATUS
// ============================================

export interface EntityEmbeddingStatus {
  entityType: EmbeddableEntity;
  totalEntities: number;
  totalEmbeddings: number;
  pendingCount: number;
  coveragePercent: number;
}

export interface EmbeddingStatus {
  entities: EntityEmbeddingStatus[];
  totalEntities: number;
  totalEmbeddings: number;
  overallCoveragePercent: number;
  lastUpdated: Date | null;
}

/**
 * Retorna status dos embeddings para uma empresa, por entidade
 */
export async function getEmbeddingStatus(
  prisma: PrismaClient,
  companyId: string
): Promise<EmbeddingStatus> {
  const tenantFilter = { OR: [{ companyId }, { isShared: true }] };

  // Contar entidades por tipo em paralelo
  const [materials, products, customers, suppliers, employees, allEmbeddings] =
    await Promise.all([
      prisma.material.count({ where: { ...tenantFilter, status: "ACTIVE" } }),
      prisma.product.count({ where: { companyId } }),
      prisma.customer.count({ where: { companyId, status: "ACTIVE" } }),
      prisma.supplier.count({ where: { ...tenantFilter, status: "ACTIVE" } }),
      prisma.employee.count({ where: { companyId, status: "ACTIVE" } }),
      prisma.embedding.groupBy({
        by: ["entityType"],
        where: { companyId },
        _count: true,
      }),
    ]);

  const embeddingCountMap = new Map(
    allEmbeddings.map((e) => [e.entityType, e._count])
  );

  const entityCounts: Record<EmbeddableEntity, number> = {
    material: materials,
    product: products,
    customer: customers,
    supplier: suppliers,
    employee: employees,
  };

  const entities: EntityEmbeddingStatus[] = EMBEDDABLE_ENTITIES.map((type) => {
    const total = entityCounts[type];
    const embedded = embeddingCountMap.get(type) ?? 0;
    return {
      entityType: type,
      totalEntities: total,
      totalEmbeddings: embedded,
      pendingCount: Math.max(0, total - embedded),
      coveragePercent: total > 0 ? Math.round((embedded / total) * 100) : 0,
    };
  });

  const totalEntities = entities.reduce((s, e) => s + e.totalEntities, 0);
  const totalEmbeddings = entities.reduce((s, e) => s + e.totalEmbeddings, 0);

  // Último update
  const lastEmbedding = await prisma.embedding.findFirst({
    where: { companyId },
    orderBy: { updatedAt: "desc" },
    select: { updatedAt: true },
  });

  return {
    entities,
    totalEntities,
    totalEmbeddings,
    overallCoveragePercent: totalEntities > 0
      ? Math.round((totalEmbeddings / totalEntities) * 100)
      : 0,
    lastUpdated: lastEmbedding?.updatedAt ?? null,
  };
}
