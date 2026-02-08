import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, tenantProcedure } from "../trpc";
import { getGoogleKey } from "@/server/services/getAIApiKey";
import {
  composeEmbeddingText,
  generateEmbedding,
  upsertEmbedding,
  deleteEmbedding,
  processEmbeddingsBatch,
  getEmbeddingStatus,
  semanticSearch,
  EMBEDDABLE_ENTITIES,
  type EmbeddableEntity,
  type EntityEmbeddingData,
} from "@/lib/ai/embeddings";

// ============================================
// HELPERS — fetch + compose por entidade
// ============================================

const entityTypeSchema = z.enum(["material", "product", "customer", "supplier", "employee", "task", "sales_order"]);

/** Busca uma entidade pelo ID e retorna EntityEmbeddingData */
async function fetchEntityData(
  prisma: Parameters<typeof getGoogleKey>[0],
  entityType: EmbeddableEntity,
  entityId: string,
  companyId: string
): Promise<EntityEmbeddingData | null> {
  switch (entityType) {
    case "material": {
      const m = await prisma.material.findFirst({
        where: { id: entityId, OR: [{ companyId }, { isShared: true }] },
        include: { category: { select: { name: true } } },
      });
      if (!m) return null;
      let subCategoryName: string | null = null;
      if (m.subCategoryId) {
        const sc = await prisma.category.findUnique({ where: { id: m.subCategoryId }, select: { name: true } });
        subCategoryName = sc?.name ?? null;
      }
      return { type: "material", data: { id: m.id, code: m.code, description: m.description, internalCode: m.internalCode, ncm: m.ncm, unit: m.unit, categoryName: m.category?.name, subCategoryName, manufacturer: m.manufacturer, notes: m.notes, barcode: m.barcode } };
    }
    case "product": {
      const p = await prisma.product.findFirst({
        where: { id: entityId, companyId },
        include: { category: { select: { name: true } }, material: { select: { description: true } } },
      });
      if (!p) return null;
      return { type: "product", data: { id: p.id, code: p.code, name: p.name, shortDescription: p.shortDescription, description: p.description, tags: p.tags, categoryName: p.category?.name, materialDescription: p.material?.description, specifications: p.specifications as Record<string, unknown> | null } };
    }
    case "customer": {
      const c = await prisma.customer.findFirst({
        where: { id: entityId, companyId },
      });
      if (!c) return null;
      return { type: "customer", data: { id: c.id, code: c.code, companyName: c.companyName, tradeName: c.tradeName, cnpj: c.cnpj, cpf: c.cpf, city: c.addressCity, state: c.addressState, contactName: c.contactName, notes: c.notes } };
    }
    case "supplier": {
      const s = await prisma.supplier.findFirst({
        where: { id: entityId, OR: [{ companyId }, { isShared: true }] },
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
      return { type: "supplier", data: { id: s.id, code: s.code, companyName: s.companyName, tradeName: s.tradeName, cnpj: s.cnpj, city: s.city, state: s.state, cnae: s.cnae, categories: cats, notes: s.notes } };
    }
    case "employee": {
      const e = await prisma.employee.findFirst({
        where: { id: entityId, companyId },
        include: { department: { select: { name: true } }, position: { select: { name: true } } },
      });
      if (!e) return null;
      return { type: "employee", data: { id: e.id, code: e.code, name: e.name, cpf: e.cpf, email: e.email, departmentName: e.department?.name, positionName: e.position?.name, contractType: e.contractType, notes: e.notes } };
    }
    case "task": {
      const t = await prisma.task.findFirst({
        where: { id: entityId, companyId },
        include: { owner: { select: { name: true } }, targetDepartment: { select: { name: true } } },
      });
      if (!t) return null;
      return { type: "task", data: { id: t.id, code: t.code, title: t.title, description: t.description, priority: t.priority, status: t.status, entityType: t.entityType, ownerName: t.owner?.name, departmentName: t.targetDepartment?.name, resolution: t.resolution } };
    }
    case "sales_order": {
      const so = await prisma.salesOrder.findFirst({
        where: { id: entityId, companyId },
        include: { customer: { select: { companyName: true, tradeName: true } }, items: { select: { description: true }, take: 20 } },
      });
      if (!so) return null;
      return { type: "sales_order", data: { id: so.id, code: so.code, customerName: so.customer.companyName, customerTradeName: so.customer.tradeName, status: so.status, totalValue: so.totalValue, notes: so.notes, itemDescriptions: so.items.map((i) => i.description).filter(Boolean) as string[] } };
    }
  }
}

/** Retorna resumo compacto de uma entidade para enriquecer resultados de busca */
async function fetchEntitySummary(
  prisma: Parameters<typeof getGoogleKey>[0],
  entityType: EmbeddableEntity,
  entityId: string,
  companyId: string
): Promise<Record<string, unknown> | null> {
  switch (entityType) {
    case "material": {
      const m = await prisma.material.findFirst({
        where: { id: entityId, OR: [{ companyId }, { isShared: true }] },
        select: { id: true, code: true, description: true, unit: true, status: true, ncm: true, manufacturer: true },
      });
      return m as Record<string, unknown> | null;
    }
    case "product": {
      const p = await prisma.product.findFirst({
        where: { id: entityId, companyId },
        select: { id: true, code: true, name: true, shortDescription: true, status: true, listPrice: true, salePrice: true },
      });
      return p as Record<string, unknown> | null;
    }
    case "customer": {
      const c = await prisma.customer.findFirst({
        where: { id: entityId, companyId },
        select: { id: true, code: true, companyName: true, tradeName: true, cnpj: true, status: true, addressCity: true, addressState: true },
      });
      return c as Record<string, unknown> | null;
    }
    case "supplier": {
      const s = await prisma.supplier.findFirst({
        where: { id: entityId, OR: [{ companyId }, { isShared: true }] },
        select: { id: true, code: true, companyName: true, tradeName: true, cnpj: true, status: true, city: true, state: true },
      });
      return s as Record<string, unknown> | null;
    }
    case "employee": {
      const e = await prisma.employee.findFirst({
        where: { id: entityId, companyId },
        select: { id: true, code: true, name: true, email: true, status: true, contractType: true },
      });
      return e as Record<string, unknown> | null;
    }
    case "task": {
      const t = await prisma.task.findFirst({
        where: { id: entityId, companyId },
        select: { id: true, code: true, title: true, priority: true, status: true, entityType: true, deadline: true },
      });
      return t as Record<string, unknown> | null;
    }
    case "sales_order": {
      const so = await prisma.salesOrder.findFirst({
        where: { id: entityId, companyId },
        select: { id: true, code: true, status: true, totalValue: true, orderDate: true },
      });
      return so as Record<string, unknown> | null;
    }
  }
}

/** Busca entidades pendentes de embedding em batch */
async function fetchPendingEntities(
  prisma: Parameters<typeof getGoogleKey>[0],
  entityType: EmbeddableEntity,
  companyId: string,
  existingIds: string[],
  limit: number,
  forceRegenerate: boolean
): Promise<EntityEmbeddingData[]> {
  const notInFilter = existingIds.length > 0 && !forceRegenerate
    ? { id: { notIn: existingIds } }
    : {};

  switch (entityType) {
    case "material": {
      const items = await prisma.material.findMany({
        where: { OR: [{ companyId }, { isShared: true }], status: "ACTIVE", ...notInFilter },
        include: { category: { select: { name: true } } },
        take: limit,
        orderBy: { code: "asc" },
      });
      // Subcategorias em batch
      const subCatIds = [...new Set(items.map((m) => m.subCategoryId).filter(Boolean))] as string[];
      const subCats = subCatIds.length > 0
        ? await prisma.category.findMany({ where: { id: { in: subCatIds } }, select: { id: true, name: true } })
        : [];
      const scMap = new Map(subCats.map((c) => [c.id, c.name]));
      return items.map((m) => ({ type: "material" as const, data: { id: m.id, code: m.code, description: m.description, internalCode: m.internalCode, ncm: m.ncm, unit: m.unit, categoryName: m.category?.name, subCategoryName: m.subCategoryId ? scMap.get(m.subCategoryId) ?? null : null, manufacturer: m.manufacturer, notes: m.notes, barcode: m.barcode } }));
    }
    case "product": {
      const items = await prisma.product.findMany({
        where: { companyId, ...notInFilter },
        include: { category: { select: { name: true } }, material: { select: { description: true } } },
        take: limit,
        orderBy: { code: "asc" },
      });
      return items.map((p) => ({ type: "product" as const, data: { id: p.id, code: p.code, name: p.name, shortDescription: p.shortDescription, description: p.description, tags: p.tags, categoryName: p.category?.name, materialDescription: p.material?.description, specifications: p.specifications as Record<string, unknown> | null } }));
    }
    case "customer": {
      const items = await prisma.customer.findMany({
        where: { companyId, status: "ACTIVE", ...notInFilter },
        take: limit,
        orderBy: { code: "asc" },
      });
      return items.map((c) => ({ type: "customer" as const, data: { id: c.id, code: c.code, companyName: c.companyName, tradeName: c.tradeName, cnpj: c.cnpj, cpf: c.cpf, city: c.addressCity, state: c.addressState, contactName: c.contactName, notes: c.notes } }));
    }
    case "supplier": {
      const items = await prisma.supplier.findMany({
        where: { OR: [{ companyId }, { isShared: true }], status: "ACTIVE", ...notInFilter },
        take: limit,
        orderBy: { code: "asc" },
      });
      return items.map((s) => {
        const cats: string[] = [];
        if (s.cat01Embalagens) cats.push("Embalagens");
        if (s.cat02Tintas) cats.push("Tintas");
        if (s.cat03OleosGraxas) cats.push("Óleos/Graxas");
        if (s.cat04Dispositivos) cats.push("Dispositivos");
        if (s.cat05Acessorios) cats.push("Acessórios");
        if (s.cat06Manutencao) cats.push("Manutenção");
        if (s.cat07Servicos) cats.push("Serviços");
        if (s.cat08Escritorio) cats.push("Escritório");
        return { type: "supplier" as const, data: { id: s.id, code: s.code, companyName: s.companyName, tradeName: s.tradeName, cnpj: s.cnpj, city: s.city, state: s.state, cnae: s.cnae, categories: cats, notes: s.notes } };
      });
    }
    case "employee": {
      const items = await prisma.employee.findMany({
        where: { companyId, status: "ACTIVE", ...notInFilter },
        include: { department: { select: { name: true } }, position: { select: { name: true } } },
        take: limit,
        orderBy: { code: "asc" },
      });
      return items.map((e) => ({ type: "employee" as const, data: { id: e.id, code: e.code, name: e.name, cpf: e.cpf, email: e.email, departmentName: e.department?.name, positionName: e.position?.name, contractType: e.contractType, notes: e.notes } }));
    }
    case "task": {
      const items = await prisma.task.findMany({
        where: { companyId, ...notInFilter },
        include: { owner: { select: { name: true } }, targetDepartment: { select: { name: true } } },
        take: limit,
        orderBy: { code: "asc" },
      });
      return items.map((t) => ({ type: "task" as const, data: { id: t.id, code: t.code, title: t.title, description: t.description, priority: t.priority, status: t.status, entityType: t.entityType, ownerName: t.owner?.name, departmentName: t.targetDepartment?.name, resolution: t.resolution } }));
    }
    case "sales_order": {
      const items = await prisma.salesOrder.findMany({
        where: { companyId, ...notInFilter },
        include: { customer: { select: { companyName: true, tradeName: true } }, items: { select: { description: true }, take: 20 } },
        take: limit,
        orderBy: { code: "asc" },
      });
      return items.map((so) => ({ type: "sales_order" as const, data: { id: so.id, code: so.code, customerName: so.customer.companyName, customerTradeName: so.customer.tradeName, status: so.status, totalValue: so.totalValue, notes: so.notes, itemDescriptions: so.items.map((i) => i.description).filter(Boolean) as string[] } }));
    }
  }
}

// ============================================
// ROUTER
// ============================================

export const embeddingsRouter = createTRPCRouter({
  /**
   * Gerar embedding para uma entidade específica
   */
  generateForEntity: tenantProcedure
    .input(z.object({
      entityType: entityTypeSchema,
      entityId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const apiKey = await getGoogleKey(ctx.prisma, ctx.companyId);
      if (!apiKey) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Token de IA não configurado. Configure em Configurações > IA." });
      }

      const entityData = await fetchEntityData(ctx.prisma, input.entityType, input.entityId, ctx.companyId);
      if (!entityData) {
        throw new TRPCError({ code: "NOT_FOUND", message: `${input.entityType} não encontrado(a)` });
      }

      const content = composeEmbeddingText(entityData);
      const { embedding, tokenCount } = await generateEmbedding(content, apiKey);

      await upsertEmbedding(ctx.prisma, {
        entityType: input.entityType,
        entityId: input.entityId,
        companyId: ctx.companyId,
        content,
        metadata: { tokenCount },
      }, embedding);

      return { success: true, entityType: input.entityType, entityId: input.entityId, content, tokenCount };
    }),

  /**
   * Gerar embeddings em batch por tipo de entidade
   */
  generateBatch: tenantProcedure
    .input(z.object({
      entityType: entityTypeSchema,
      limit: z.number().min(1).max(500).default(100),
      forceRegenerate: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const apiKey = await getGoogleKey(ctx.prisma, ctx.companyId);
      if (!apiKey) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Token de IA não configurado. Configure em Configurações > IA." });
      }

      // IDs que já têm embedding
      let existingIds: string[] = [];
      if (!input.forceRegenerate) {
        const existing = await ctx.prisma.embedding.findMany({
          where: { entityType: input.entityType, companyId: ctx.companyId },
          select: { entityId: true },
        });
        existingIds = existing.map((e) => e.entityId);
      }

      const entities = await fetchPendingEntities(
        ctx.prisma, input.entityType, ctx.companyId, existingIds, input.limit, input.forceRegenerate
      );

      if (entities.length === 0) {
        return { total: 0, success: 0, failed: 0, errors: [] as Array<{ entityId: string; error: string }>, message: `Todos os ${input.entityType}s já possuem embeddings.` };
      }

      const result = await processEmbeddingsBatch(ctx.prisma, entities, ctx.companyId, apiKey);

      return { ...result, message: `${result.success} de ${result.total} embeddings (${input.entityType}) gerados.` };
    }),

  /**
   * Gerar embeddings para TODAS as entidades pendentes
   */
  generateAll: tenantProcedure
    .input(z.object({
      limitPerEntity: z.number().min(1).max(200).default(50),
      forceRegenerate: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const apiKey = await getGoogleKey(ctx.prisma, ctx.companyId);
      if (!apiKey) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Token de IA não configurado. Configure em Configurações > IA." });
      }

      const results: Record<string, { total: number; success: number; failed: number }> = {};

      for (const entityType of EMBEDDABLE_ENTITIES) {
        let existingIds: string[] = [];
        if (!input.forceRegenerate) {
          const existing = await ctx.prisma.embedding.findMany({
            where: { entityType, companyId: ctx.companyId },
            select: { entityId: true },
          });
          existingIds = existing.map((e) => e.entityId);
        }

        const entities = await fetchPendingEntities(
          ctx.prisma, entityType, ctx.companyId, existingIds, input.limitPerEntity, input.forceRegenerate
        );

        if (entities.length === 0) {
          results[entityType] = { total: 0, success: 0, failed: 0 };
          continue;
        }

        const result = await processEmbeddingsBatch(ctx.prisma, entities, ctx.companyId, apiKey);
        results[entityType] = { total: result.total, success: result.success, failed: result.failed };
      }

      const totalSuccess = Object.values(results).reduce((s, r) => s + r.success, 0);
      const totalProcessed = Object.values(results).reduce((s, r) => s + r.total, 0);

      return { results, totalProcessed, totalSuccess, message: `${totalSuccess} de ${totalProcessed} embeddings gerados.` };
    }),

  /**
   * Remover embedding de uma entidade
   */
  deleteForEntity: tenantProcedure
    .input(z.object({
      entityType: entityTypeSchema,
      entityId: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      await deleteEmbedding(ctx.prisma, input.entityType, input.entityId);
      return { success: true };
    }),

  /**
   * Busca semântica multi-entidade
   */
  search: tenantProcedure
    .input(z.object({
      query: z.string().min(1).max(500),
      entityType: entityTypeSchema.optional(),
      entityTypes: z.array(entityTypeSchema).optional(),
      threshold: z.number().min(0).max(1).default(0.5),
      limit: z.number().min(1).max(50).default(10),
      enrichResults: z.boolean().default(true),
    }))
    .query(async ({ ctx, input }) => {
      const apiKey = await getGoogleKey(ctx.prisma, ctx.companyId);
      if (!apiKey) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Token de IA não configurado. Configure em Configurações > IA." });
      }

      const results = await semanticSearch(ctx.prisma, input.query, apiKey, {
        entityType: input.entityType,
        entityTypes: input.entityTypes,
        companyId: ctx.companyId,
        threshold: input.threshold,
        limit: input.limit,
      });

      if (!input.enrichResults) {
        return { results, total: results.length };
      }

      // Enriquecer com dados da entidade
      const enriched = await Promise.all(
        results.map(async (r) => {
          const entityType = (r as { entityType?: string }).entityType ?? input.entityType ?? "material";
          const entity = await fetchEntitySummary(ctx.prisma, entityType as EmbeddableEntity, r.entityId, ctx.companyId);
          return { ...r, entityType, entity };
        })
      );

      return { results: enriched, total: enriched.length };
    }),

  /**
   * Busca textual (fallback quando IA indisponível)
   * Faz LIKE/contains em todas as entidades
   */
  textSearch: tenantProcedure
    .input(z.object({
      query: z.string().min(2).max(500),
      limit: z.number().min(1).max(50).default(15),
    }))
    .query(async ({ ctx, input }) => {
      const q = input.query;
      const perEntity = Math.ceil(input.limit / 7);
      const mode = "insensitive" as const;

      const [materials, products, customers, suppliers, employees, tasks, salesOrders] = await Promise.all([
        ctx.prisma.material.findMany({
          where: {
            OR: [{ companyId: ctx.companyId }, { isShared: true }],
            AND: {
              OR: [
                { description: { contains: q, mode } },
                { internalCode: { contains: q, mode } },
                { ncm: { contains: q, mode } },
                { manufacturer: { contains: q, mode } },
                { barcode: { contains: q, mode } },
              ],
            },
          },
          select: { id: true, code: true, description: true, unit: true, ncm: true, manufacturer: true, status: true },
          take: perEntity,
          orderBy: { description: "asc" },
        }),
        ctx.prisma.product.findMany({
          where: {
            companyId: ctx.companyId,
            OR: [
              { name: { contains: q, mode } },
              { code: { contains: q, mode } },
              { shortDescription: { contains: q, mode } },
            ],
          },
          select: { id: true, code: true, name: true, shortDescription: true, status: true, listPrice: true, salePrice: true },
          take: perEntity,
          orderBy: { name: "asc" },
        }),
        ctx.prisma.customer.findMany({
          where: {
            companyId: ctx.companyId,
            OR: [
              { companyName: { contains: q, mode } },
              { tradeName: { contains: q, mode } },
              { cnpj: { contains: q, mode } },
              { cpf: { contains: q, mode } },
              { contactName: { contains: q, mode } },
            ],
          },
          select: { id: true, code: true, companyName: true, tradeName: true, cnpj: true, status: true, addressCity: true, addressState: true },
          take: perEntity,
          orderBy: { companyName: "asc" },
        }),
        ctx.prisma.supplier.findMany({
          where: {
            OR: [{ companyId: ctx.companyId }, { isShared: true }],
            AND: {
              OR: [
                { companyName: { contains: q, mode } },
                { tradeName: { contains: q, mode } },
                { cnpj: { contains: q, mode } },
              ],
            },
          },
          select: { id: true, code: true, companyName: true, tradeName: true, cnpj: true, status: true, city: true, state: true },
          take: perEntity,
          orderBy: { companyName: "asc" },
        }),
        ctx.prisma.employee.findMany({
          where: {
            companyId: ctx.companyId,
            OR: [
              { name: { contains: q, mode } },
              { cpf: { contains: q, mode } },
              { email: { contains: q, mode } },
            ],
          },
          select: { id: true, code: true, name: true, email: true, status: true, contractType: true },
          take: perEntity,
          orderBy: { name: "asc" },
        }),
        ctx.prisma.task.findMany({
          where: {
            companyId: ctx.companyId,
            OR: [
              { title: { contains: q, mode } },
              { description: { contains: q, mode } },
              { resolution: { contains: q, mode } },
            ],
          },
          select: { id: true, code: true, title: true, priority: true, status: true, entityType: true, deadline: true },
          take: perEntity,
          orderBy: { code: "desc" },
        }),
        ctx.prisma.salesOrder.findMany({
          where: {
            companyId: ctx.companyId,
            OR: [
              { notes: { contains: q, mode } },
              { customer: { companyName: { contains: q, mode } } },
              { customer: { tradeName: { contains: q, mode } } },
            ],
          },
          select: { id: true, code: true, status: true, totalValue: true, orderDate: true },
          take: perEntity,
          orderBy: { code: "desc" },
        }),
      ]);

      type TextResult = { entityId: string; entityType: string; entity: Record<string, unknown> };
      const results: TextResult[] = [
        ...materials.map((m) => ({ entityId: m.id, entityType: "material", entity: m as Record<string, unknown> })),
        ...products.map((p) => ({ entityId: p.id, entityType: "product", entity: p as Record<string, unknown> })),
        ...customers.map((c) => ({ entityId: c.id, entityType: "customer", entity: c as Record<string, unknown> })),
        ...suppliers.map((s) => ({ entityId: s.id, entityType: "supplier", entity: s as Record<string, unknown> })),
        ...employees.map((e) => ({ entityId: e.id, entityType: "employee", entity: e as Record<string, unknown> })),
        ...tasks.map((t) => ({ entityId: t.id, entityType: "task", entity: t as Record<string, unknown> })),
        ...salesOrders.map((so) => ({ entityId: so.id, entityType: "sales_order", entity: so as Record<string, unknown> })),
      ];

      return { results: results.slice(0, input.limit), total: results.length };
    }),

  /**
   * Status dos embeddings da empresa (por entidade)
   */
  getStatus: tenantProcedure.query(async ({ ctx }) => {
    return getEmbeddingStatus(ctx.prisma, ctx.companyId);
  }),
});
