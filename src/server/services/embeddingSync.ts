/**
 * Serviço de sincronização automática de embeddings (VIO-1010)
 *
 * Dispara geração/atualização de embeddings de forma assíncrona
 * após operações CRUD em entidades (materiais, produtos, etc.)
 *
 * Padrão fire-and-forget: não bloqueia a resposta da API
 */

import type { PrismaClient } from "@prisma/client";
import { getOpenAIKey } from "@/server/services/getAIApiKey";
import {
  composeEmbeddingText,
  generateEmbedding,
  upsertEmbedding,
  deleteEmbedding,
  type EmbeddableEntity,
  type EntityEmbeddingData,
  type MaterialEmbeddingData,
  type ProductEmbeddingData,
  type CustomerEmbeddingData,
  type SupplierEmbeddingData,
  type EmployeeEmbeddingData,
} from "@/lib/ai/embeddings";

// ============================================
// TYPES
// ============================================

interface SyncContext {
  prisma: PrismaClient;
  companyId: string;
}

type SyncOperation = "create" | "update" | "delete";

// ============================================
// CORE — fire-and-forget sync
// ============================================

/**
 * Sincroniza embedding de uma entidade após create/update/delete.
 * Fire-and-forget — erros são logados mas não propagados.
 *
 * Uso nos routers:
 * ```ts
 * const material = await ctx.prisma.material.create({ ... });
 * syncEntityEmbedding({ prisma: ctx.prisma, companyId: ctx.companyId }, "material", material.id, "create");
 * return material;
 * ```
 */
export function syncEntityEmbedding(
  ctx: SyncContext,
  entityType: EmbeddableEntity,
  entityId: string,
  operation: SyncOperation
): void {
  // Fire-and-forget — não await
  void _syncEntityEmbedding(ctx, entityType, entityId, operation);
}

async function _syncEntityEmbedding(
  ctx: SyncContext,
  entityType: EmbeddableEntity,
  entityId: string,
  operation: SyncOperation
): Promise<void> {
  try {
    // Delete: apenas remover embedding
    if (operation === "delete") {
      await deleteEmbedding(ctx.prisma, entityType, entityId);
      return;
    }

    // Create/Update: gerar novo embedding
    const apiKey = await getOpenAIKey(ctx.prisma, ctx.companyId);
    if (!apiKey) return; // Sem API key — skip silencioso

    const entityData = await fetchEntityForSync(ctx.prisma, entityType, entityId, ctx.companyId);
    if (!entityData) {
      // Entidade inativa ou não encontrada — remover embedding se existir
      await deleteEmbedding(ctx.prisma, entityType, entityId);
      return;
    }

    const content = composeEmbeddingText(entityData);
    const { embedding } = await generateEmbedding(content, apiKey);

    await upsertEmbedding(ctx.prisma, {
      entityType,
      entityId,
      companyId: ctx.companyId,
      content,
      metadata: { syncedAt: new Date().toISOString() },
    }, embedding);
  } catch (error) {
    // Log silencioso — não propagar erro para o caller
    console.error(`[embeddingSync] Falha ao sincronizar ${entityType}/${entityId}:`, error);
  }
}

// ============================================
// FETCH — busca dados da entidade para embedding
// ============================================

async function fetchEntityForSync(
  prisma: PrismaClient,
  entityType: EmbeddableEntity,
  entityId: string,
  companyId: string
): Promise<EntityEmbeddingData | null> {
  switch (entityType) {
    case "material": {
      const m = await prisma.material.findFirst({
        where: { id: entityId, OR: [{ companyId }, { isShared: true }], status: "ACTIVE" },
        include: { category: { select: { name: true } } },
      });
      if (!m) return null;
      let subCategoryName: string | null = null;
      if (m.subCategoryId) {
        const sc = await prisma.category.findUnique({ where: { id: m.subCategoryId }, select: { name: true } });
        subCategoryName = sc?.name ?? null;
      }
      const data: MaterialEmbeddingData = {
        id: m.id, code: m.code, description: m.description, internalCode: m.internalCode,
        ncm: m.ncm, unit: m.unit, categoryName: m.category?.name, subCategoryName,
        manufacturer: m.manufacturer, notes: m.notes, barcode: m.barcode,
      };
      return { type: "material", data };
    }
    case "product": {
      const p = await prisma.product.findFirst({
        where: { id: entityId, companyId },
        include: { category: { select: { name: true } }, material: { select: { description: true } } },
      });
      if (!p) return null;
      const data: ProductEmbeddingData = {
        id: p.id, code: p.code, name: p.name, shortDescription: p.shortDescription,
        description: p.description, tags: p.tags, categoryName: p.category?.name,
        materialDescription: p.material?.description,
        specifications: p.specifications as Record<string, unknown> | null,
      };
      return { type: "product", data };
    }
    case "customer": {
      const c = await prisma.customer.findFirst({
        where: { id: entityId, companyId, status: "ACTIVE" },
      });
      if (!c) return null;
      const data: CustomerEmbeddingData = {
        id: c.id, code: c.code, companyName: c.companyName, tradeName: c.tradeName,
        cnpj: c.cnpj, cpf: c.cpf, city: c.addressCity, state: c.addressState,
        contactName: c.contactName, notes: c.notes,
      };
      return { type: "customer", data };
    }
    case "supplier": {
      const s = await prisma.supplier.findFirst({
        where: { id: entityId, OR: [{ companyId }, { isShared: true }], status: "ACTIVE" },
      });
      if (!s) return null;
      const cats: string[] = [];
      if (s.cat01Embalagens) cats.push("Embalagens");
      if (s.cat02Tintas) cats.push("Tintas");
      if (s.cat03OleosGraxas) cats.push("Óleos/Graxas");
      if (s.cat04Dispositivos) cats.push("Dispositivos");
      if (s.cat05Acessorios) cats.push("Acessórios");
      if (s.cat06Manutencao) cats.push("Manutenção");
      if (s.cat07Servicos) cats.push("Serviços");
      if (s.cat08Escritorio) cats.push("Escritório");
      const data: SupplierEmbeddingData = {
        id: s.id, code: s.code, companyName: s.companyName, tradeName: s.tradeName,
        cnpj: s.cnpj, city: s.city, state: s.state, cnae: s.cnae, categories: cats, notes: s.notes,
      };
      return { type: "supplier", data };
    }
    case "employee": {
      const e = await prisma.employee.findFirst({
        where: { id: entityId, companyId, status: "ACTIVE" },
        include: { department: { select: { name: true } }, position: { select: { name: true } } },
      });
      if (!e) return null;
      const data: EmployeeEmbeddingData = {
        id: e.id, code: e.code, name: e.name, cpf: e.cpf, email: e.email,
        departmentName: e.department?.name, positionName: e.position?.name,
        contractType: e.contractType, notes: e.notes,
      };
      return { type: "employee", data };
    }
  }
}
