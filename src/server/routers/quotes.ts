import { z } from "zod";
import { createTRPCRouter, tenantProcedure, tenantFilter } from "../trpc";
import { auditCreate, auditUpdate, auditDelete } from "../services/audit";

export const quotesRouter = createTRPCRouter({
  // Listar cotações
  list: tenantProcedure
    .input(
      z.object({
        supplierId: z.string().optional(),
        status: z.enum(["DRAFT", "PENDING", "SENT", "RECEIVED", "APPROVED", "REJECTED", "CANCELLED"]).optional(),
        search: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const { supplierId, status, search, startDate, endDate, page = 1, limit = 20 } = input ?? {};

      const where = {
        supplier: { ...tenantFilter(ctx.companyId, true) },
        ...(supplierId && { supplierId }),
        ...(status && { status }),
        ...(search && {
          OR: [
            { supplier: { companyName: { contains: search, mode: "insensitive" as const } } },
            { notes: { contains: search, mode: "insensitive" as const } },
          ],
        }),
        ...(startDate && endDate && {
          requestDate: {
            gte: startDate,
            lte: endDate,
          },
        }),
      };

      const [quotes, total] = await Promise.all([
        ctx.prisma.quote.findMany({
          where,
          include: {
            supplier: {
              select: {
                id: true,
                code: true,
                companyName: true,
                tradeName: true,
              },
            },
            items: {
              include: {
                material: {
                  select: {
                    id: true,
                    code: true,
                    description: true,
                    unit: true,
                  },
                },
              },
            },
            _count: {
              select: { items: true },
            },
          },
          orderBy: { requestDate: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        ctx.prisma.quote.count({ where }),
      ]);

      return {
        quotes,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    }),

  // Buscar cotação por ID
  byId: tenantProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.quote.findFirst({
        where: {
          id: input.id,
          supplier: { ...tenantFilter(ctx.companyId, true) },
        },
        include: {
          supplier: true,
          items: {
            include: {
              material: {
                include: { category: true },
              },
            },
            orderBy: { createdAt: "asc" },
          },
        },
      });
    }),

  // Criar cotação
  create: tenantProcedure
    .input(
      z.object({
        supplierId: z.string(),
        requestDate: z.date().optional(),
        validUntil: z.date().optional(),
        paymentTerms: z.string().optional(),
        deliveryTerms: z.string().optional(),
        notes: z.string().optional(),
        items: z.array(
          z.object({
            materialId: z.string(),
            quantity: z.number().min(0.01),
            unitPrice: z.number().min(0).optional(),
            deliveryDays: z.number().optional(),
            notes: z.string().optional(),
          })
        ).min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { items, ...quoteData } = input;

      // Gerar próximo código
      const lastQuote = await ctx.prisma.quote.findFirst({
        orderBy: { code: "desc" },
      });
      const nextCode = (lastQuote?.code ?? 0) + 1;

      // Calcular totais dos itens
      const itemsWithTotals = items.map(item => ({
        ...item,
        unitPrice: item.unitPrice ?? 0,
        totalPrice: (item.unitPrice ?? 0) * item.quantity,
      }));

      const totalValue = itemsWithTotals.reduce((sum, item) => sum + item.totalPrice, 0);

      const quote = await ctx.prisma.quote.create({
        data: {
          code: nextCode,
          ...quoteData,
          totalValue,
          items: {
            create: itemsWithTotals,
          },
        },
        include: {
          supplier: true,
          items: {
            include: { material: true },
          },
        },
      });

      await auditCreate("Quote", quote, String(quote.code), {
        userId: ctx.tenant.userId ?? undefined,
        companyId: ctx.companyId,
      });

      return quote;
    }),

  // Atualizar cotação
  update: tenantProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(["DRAFT", "PENDING", "SENT", "RECEIVED", "APPROVED", "REJECTED", "CANCELLED"]).optional(),
        responseDate: z.date().optional(),
        validUntil: z.date().optional(),
        paymentTerms: z.string().optional(),
        deliveryTerms: z.string().optional(),
        freightValue: z.number().optional(),
        discountPercent: z.number().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const oldQuote = await ctx.prisma.quote.findFirst({
        where: {
          id,
          supplier: { ...tenantFilter(ctx.companyId, true) },
        },
      });

      if (!oldQuote) {
        throw new Error("Cotação não encontrada ou sem permissão");
      }

      const quote = await ctx.prisma.quote.update({
        where: { id },
        data,
        include: {
          supplier: true,
          items: true,
        },
      });

      await auditUpdate("Quote", id, String(quote.code), oldQuote, quote, {
        userId: ctx.tenant.userId ?? undefined,
        companyId: ctx.companyId,
      });

      return quote;
    }),

  // Atualizar item da cotação
  updateItem: tenantProcedure
    .input(
      z.object({
        id: z.string(),
        unitPrice: z.number().min(0).optional(),
        quantity: z.number().min(0.01).optional(),
        deliveryDays: z.number().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const item = await ctx.prisma.quoteItem.findUnique({
        where: { id },
        include: {
          quote: {
            include: { supplier: true },
          },
        },
      });

      if (!item) {
        throw new Error("Item não encontrado");
      }

      // Calcular novo total
      const quantity = data.quantity ?? item.quantity;
      const unitPrice = data.unitPrice ?? item.unitPrice;
      const totalPrice = quantity * unitPrice;

      const updatedItem = await ctx.prisma.quoteItem.update({
        where: { id },
        data: {
          ...data,
          totalPrice,
        },
      });

      // Recalcular total da cotação
      const allItems = await ctx.prisma.quoteItem.findMany({
        where: { quoteId: item.quoteId },
      });

      const newTotal = allItems.reduce((sum, i) => 
        sum + (i.id === id ? totalPrice : i.totalPrice), 0
      );

      await ctx.prisma.quote.update({
        where: { id: item.quoteId },
        data: { totalValue: newTotal },
      });

      return updatedItem;
    }),

  // Adicionar item à cotação
  addItem: tenantProcedure
    .input(
      z.object({
        quoteId: z.string(),
        materialId: z.string(),
        quantity: z.number().min(0.01),
        unitPrice: z.number().min(0).optional(),
        deliveryDays: z.number().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { quoteId, ...itemData } = input;

      const quote = await ctx.prisma.quote.findFirst({
        where: {
          id: quoteId,
          supplier: { ...tenantFilter(ctx.companyId, true) },
        },
      });

      if (!quote) {
        throw new Error("Cotação não encontrada ou sem permissão");
      }

      const unitPrice = itemData.unitPrice ?? 0;
      const totalPrice = unitPrice * itemData.quantity;

      const item = await ctx.prisma.quoteItem.create({
        data: {
          quoteId,
          ...itemData,
          unitPrice,
          totalPrice,
        },
        include: { material: true },
      });

      // Atualizar total da cotação
      await ctx.prisma.quote.update({
        where: { id: quoteId },
        data: { totalValue: quote.totalValue + totalPrice },
      });

      return item;
    }),

  // Remover item da cotação
  removeItem: tenantProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const item = await ctx.prisma.quoteItem.findUnique({
        where: { id: input.id },
        include: {
          quote: {
            include: { supplier: true },
          },
        },
      });

      if (!item) {
        throw new Error("Item não encontrado");
      }

      await ctx.prisma.quoteItem.delete({
        where: { id: input.id },
      });

      // Atualizar total da cotação
      await ctx.prisma.quote.update({
        where: { id: item.quoteId },
        data: { totalValue: item.quote.totalValue - item.totalPrice },
      });

      return { success: true };
    }),

  // Deletar cotação
  delete: tenantProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const quote = await ctx.prisma.quote.findFirst({
        where: {
          id: input.id,
          supplier: { ...tenantFilter(ctx.companyId, true) },
        },
      });

      if (!quote) {
        throw new Error("Cotação não encontrada ou sem permissão");
      }

      const deleted = await ctx.prisma.quote.delete({
        where: { id: input.id },
      });

      await auditDelete("Quote", quote, String(quote.code), {
        userId: ctx.tenant.userId ?? undefined,
        companyId: ctx.companyId,
      });

      return deleted;
    }),

  // Aprovar cotação
  approve: tenantProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const quote = await ctx.prisma.quote.findFirst({
        where: {
          id: input.id,
          supplier: { ...tenantFilter(ctx.companyId, true) },
        },
      });

      if (!quote) {
        throw new Error("Cotação não encontrada ou sem permissão");
      }

      const updated = await ctx.prisma.quote.update({
        where: { id: input.id },
        data: { status: "APPROVED" },
      });

      await auditUpdate("Quote", input.id, String(quote.code), quote, updated, {
        userId: ctx.tenant.userId ?? undefined,
        companyId: ctx.companyId,
      });

      return updated;
    }),

  // Rejeitar cotação
  reject: tenantProcedure
    .input(z.object({ 
      id: z.string(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const quote = await ctx.prisma.quote.findFirst({
        where: {
          id: input.id,
          supplier: { ...tenantFilter(ctx.companyId, true) },
        },
      });

      if (!quote) {
        throw new Error("Cotação não encontrada ou sem permissão");
      }

      const updated = await ctx.prisma.quote.update({
        where: { id: input.id },
        data: { 
          status: "REJECTED",
          notes: input.reason ? `${quote.notes || ""}\n[REJEITADA] ${input.reason}`.trim() : quote.notes,
        },
      });

      await auditUpdate("Quote", input.id, String(quote.code), quote, updated, {
        userId: ctx.tenant.userId ?? undefined,
        companyId: ctx.companyId,
      });

      return updated;
    }),

  // Estatísticas
  stats: tenantProcedure
    .query(async ({ ctx }) => {
      const [total, byStatus, recentQuotes] = await Promise.all([
        ctx.prisma.quote.count({
          where: { supplier: { ...tenantFilter(ctx.companyId, true) } },
        }),
        ctx.prisma.quote.groupBy({
          by: ["status"],
          where: { supplier: { ...tenantFilter(ctx.companyId, true) } },
          _count: true,
          _sum: { totalValue: true },
        }),
        ctx.prisma.quote.findMany({
          where: { supplier: { ...tenantFilter(ctx.companyId, true) } },
          include: { supplier: true },
          orderBy: { createdAt: "desc" },
          take: 5,
        }),
      ]);

      return {
        total,
        byStatus: byStatus.map(s => ({
          status: s.status,
          count: s._count,
          totalValue: s._sum.totalValue ?? 0,
        })),
        recentQuotes,
      };
    }),

  // Comparar cotações por material
  compare: tenantProcedure
    .input(
      z.object({
        materialId: z.string().optional(),
        materialIds: z.array(z.string()).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const materialFilter = input.materialId 
        ? { materialId: input.materialId }
        : input.materialIds?.length 
          ? { materialId: { in: input.materialIds } }
          : {};

      // Buscar itens de cotações com os materiais especificados
      const quoteItems = await ctx.prisma.quoteItem.findMany({
        where: {
          ...materialFilter,
          quote: {
            supplier: { ...tenantFilter(ctx.companyId, true) },
            status: { in: ["RECEIVED", "APPROVED", "PENDING"] },
          },
        },
        include: {
          quote: {
            include: {
              supplier: {
                select: {
                  id: true,
                  code: true,
                  companyName: true,
                  tradeName: true,
                  qualityIndex: true,
                },
              },
            },
          },
          material: {
            select: {
              id: true,
              code: true,
              description: true,
              unit: true,
            },
          },
        },
        orderBy: [
          { materialId: "asc" },
          { unitPrice: "asc" },
        ],
      });

      // Agrupar por material
      const byMaterial = quoteItems.reduce((acc, item) => {
        const key = item.materialId;
        if (!acc[key]) {
          acc[key] = {
            material: item.material,
            quotes: [],
          };
        }
        acc[key].quotes.push({
          quoteId: item.quote.id,
          quoteCode: item.quote.code,
          quoteStatus: item.quote.status,
          supplier: item.quote.supplier,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          deliveryDays: item.deliveryDays,
          requestDate: item.quote.requestDate,
          validUntil: item.quote.validUntil,
        });
        return acc;
      }, {} as Record<string, {
        material: typeof quoteItems[0]["material"];
        quotes: Array<{
          quoteId: string;
          quoteCode: number;
          quoteStatus: string;
          supplier: typeof quoteItems[0]["quote"]["supplier"];
          quantity: number;
          unitPrice: number;
          totalPrice: number;
          deliveryDays: number | null;
          requestDate: Date;
          validUntil: Date | null;
        }>;
      }>);

      // Calcular estatísticas por material
      const comparison = Object.values(byMaterial).map((group) => {
        const prices = group.quotes.map((q) => q.unitPrice);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
        const bestQuote = group.quotes.find((q) => q.unitPrice === minPrice);

        return {
          material: group.material,
          quotesCount: group.quotes.length,
          minPrice,
          maxPrice,
          avgPrice,
          priceVariation: maxPrice > 0 ? ((maxPrice - minPrice) / maxPrice) * 100 : 0,
          bestQuote,
          quotes: group.quotes.sort((a, b) => a.unitPrice - b.unitPrice),
        };
      });

      return comparison;
    }),

  // Listar materiais com múltiplas cotações
  materialsWithQuotes: tenantProcedure
    .query(async ({ ctx }) => {
      const materials = await ctx.prisma.material.findMany({
        where: {
          ...tenantFilter(ctx.companyId, false),
          quoteItems: {
            some: {
              quote: {
                status: { in: ["RECEIVED", "APPROVED", "PENDING"] },
              },
            },
          },
        },
        include: {
          _count: {
            select: {
              quoteItems: {
                where: {
                  quote: {
                    status: { in: ["RECEIVED", "APPROVED", "PENDING"] },
                  },
                },
              },
            },
          },
        },
        orderBy: { description: "asc" },
      });

      return materials.filter((m) => m._count.quoteItems > 1);
    }),
});
