import { z } from "zod";
import { createTRPCRouter, tenantProcedure, tenantFilter } from "../trpc";
import { TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client";

export const mrpRouter = createTRPCRouter({
  // Listar estrutura de produto (BOM)
  getBom: tenantProcedure
    .input(z.object({ materialId: z.string() }))
    .query(async ({ input, ctx }) => {
      const bomItems = await ctx.prisma.bomItem.findMany({
        where: { parentMaterialId: input.materialId, isActive: true },
        include: {
          childMaterial: {
            select: { id: true, code: true, description: true, unit: true },
          },
        },
        orderBy: { sequence: "asc" },
      });

      return bomItems;
    }),

  // Adicionar item à BOM
  addBomItem: tenantProcedure
    .input(z.object({
      parentMaterialId: z.string(),
      childMaterialId: z.string(),
      quantity: z.number().positive(),
      unit: z.string().default("UN"),
      scrapPercentage: z.number().default(0),
      leadTimeDays: z.number().default(0),
      sequence: z.number().default(0),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Verificar se não é o mesmo material
      if (input.parentMaterialId === input.childMaterialId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Material não pode ser componente de si mesmo" });
      }

      const bomItem = await ctx.prisma.bomItem.create({
        data: input,
      });

      return bomItem;
    }),

  // Atualizar item da BOM
  updateBomItem: tenantProcedure
    .input(z.object({
      id: z.string(),
      quantity: z.number().positive().optional(),
      unit: z.string().optional(),
      scrapPercentage: z.number().optional(),
      leadTimeDays: z.number().optional(),
      sequence: z.number().optional(),
      notes: z.string().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;

      const bomItem = await ctx.prisma.bomItem.update({
        where: { id },
        data,
      });

      return bomItem;
    }),

  // Remover item da BOM
  removeBomItem: tenantProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await ctx.prisma.bomItem.delete({ where: { id: input.id } });
      return { success: true };
    }),

  // Parâmetros MRP do material
  getParameters: tenantProcedure
    .input(z.object({ materialId: z.string() }))
    .query(async ({ input, ctx }) => {
      const params = await ctx.prisma.mrpParameter.findUnique({
        where: { materialId: input.materialId },
      });

      return params || {
        materialId: input.materialId,
        minLotSize: 1,
        lotMultiple: 1,
        safetyStock: 0,
        productionLeadTimeDays: 1,
        purchaseLeadTimeDays: 7,
        orderPolicy: "LOT_FOR_LOT",
      };
    }),

  // Salvar parâmetros MRP
  saveParameters: tenantProcedure
    .input(z.object({
      materialId: z.string(),
      minLotSize: z.number().default(1),
      lotMultiple: z.number().default(1),
      safetyStock: z.number().default(0),
      productionLeadTimeDays: z.number().default(1),
      purchaseLeadTimeDays: z.number().default(7),
      orderPolicy: z.string().default("LOT_FOR_LOT"),
    }))
    .mutation(async ({ input, ctx }) => {
      const params = await ctx.prisma.mrpParameter.upsert({
        where: { materialId: input.materialId },
        create: input,
        update: input,
      });

      return params;
    }),

  // Executar MRP
  run: tenantProcedure
    .input(z.object({
      horizonDays: z.number().default(30),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Criar registro da execução
      const run = await ctx.prisma.mrpRun.create({
        data: {
          companyId: ctx.companyId,
          horizonDays: input.horizonDays,
          status: "RUNNING",
          createdBy: ctx.tenant.userId,
          notes: input.notes,
        },
      });

      try {
        // Buscar ordens de produção planejadas/em andamento
        const productionOrders = await ctx.prisma.productionOrder.findMany({
          where: {
            ...tenantFilter(ctx.companyId, false),
            status: { in: ["PLANNED", "RELEASED", "IN_PROGRESS"] },
            dueDate: { lte: new Date(Date.now() + input.horizonDays * 24 * 60 * 60 * 1000) },
          },
          include: {
            product: { include: { bomAsParent: { include: { childMaterial: true } } } },
          },
        });

        const suggestions: Prisma.MrpSuggestionCreateManyInput[] = [];
        const today = new Date();

        for (const order of productionOrders) {
          // Explodir BOM
          for (const bomItem of order.product.bomAsParent) {
            const requiredQty = order.quantity * bomItem.quantity * (1 + bomItem.scrapPercentage / 100);

            // Buscar estoque disponível
            const inventory = await ctx.prisma.inventory.findFirst({
              where: { materialId: bomItem.childMaterialId, ...tenantFilter(ctx.companyId, false) },
            });

            const availableQty = inventory?.availableQty || 0;

            // Buscar parâmetros MRP
            const params = await ctx.prisma.mrpParameter.findUnique({
              where: { materialId: bomItem.childMaterialId },
            });

            const safetyStock = params?.safetyStock || 0;
            const netRequirement = requiredQty - availableQty + safetyStock;

            if (netRequirement > 0) {
              // Determinar tipo de sugestão baseado no tipo de material
              const material = bomItem.childMaterial;
              const isProduced = await ctx.prisma.bomItem.count({
                where: { parentMaterialId: material.id },
              }) > 0;

              const leadTime = isProduced
                ? (params?.productionLeadTimeDays || 1)
                : (params?.purchaseLeadTimeDays || 7);

              const suggestedDate = new Date(today);
              suggestedDate.setDate(suggestedDate.getDate() + leadTime);

              const requiredDate = order.dueDate || new Date();

              // Aplicar lote mínimo e múltiplo
              let orderQty = netRequirement;
              if (params) {
                if (orderQty < params.minLotSize) {
                  orderQty = params.minLotSize;
                }
                if (params.lotMultiple > 1) {
                  orderQty = Math.ceil(orderQty / params.lotMultiple) * params.lotMultiple;
                }
              }

              suggestions.push({
                runId: run.id,
                materialId: bomItem.childMaterialId,
                type: isProduced ? "PRODUCTION" : "PURCHASE",
                status: "PENDING",
                suggestedDate,
                requiredDate,
                quantity: orderQty,
                sourceOrderId: order.id,
                sourceOrderType: "PRODUCTION_ORDER",
                reason: `Necessidade para OP ${order.code} - ${order.product.description}`,
              });
            }
          }
        }

        // Criar sugestões
        if (suggestions.length > 0) {
          await ctx.prisma.mrpSuggestion.createMany({ data: suggestions });
        }

        // Atualizar status da execução
        const productionCount = suggestions.filter(s => s.type === "PRODUCTION").length;
        const purchaseCount = suggestions.filter(s => s.type === "PURCHASE").length;

        await ctx.prisma.mrpRun.update({
          where: { id: run.id },
          data: {
            status: "COMPLETED",
            completedAt: new Date(),
            totalSuggestions: suggestions.length,
            productionSuggestions: productionCount,
            purchaseSuggestions: purchaseCount,
          },
        });

        return {
          runId: run.id,
          totalSuggestions: suggestions.length,
          productionSuggestions: productionCount,
          purchaseSuggestions: purchaseCount,
        };
      } catch (error) {
        await ctx.prisma.mrpRun.update({
          where: { id: run.id },
          data: { status: "ERROR" },
        });
        throw error;
      }
    }),

  // Listar execuções MRP
  listRuns: tenantProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(20),
    }).optional())
    .query(async ({ input, ctx }) => {
      const { page = 1, limit = 20 } = input || {};

      const [runs, total] = await Promise.all([
        ctx.prisma.mrpRun.findMany({
          where: tenantFilter(ctx.companyId, false),
          orderBy: { runDate: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        ctx.prisma.mrpRun.count({ where: tenantFilter(ctx.companyId, false) }),
      ]);

      return { runs, total, pages: Math.ceil(total / limit) };
    }),

  // Listar sugestões de uma execução
  getSuggestions: tenantProcedure
    .input(z.object({
      runId: z.string(),
      type: z.enum(["PRODUCTION", "PURCHASE", "RESCHEDULE", "CANCEL", "ALL"]).optional(),
      status: z.enum(["PENDING", "APPROVED", "REJECTED", "CONVERTED", "ALL"]).optional(),
    }))
    .query(async ({ input, ctx }) => {
      const where: Prisma.MrpSuggestionWhereInput = {
        runId: input.runId,
        ...(input.type && input.type !== "ALL" && { type: input.type }),
        ...(input.status && input.status !== "ALL" && { status: input.status }),
      };

      const suggestions = await ctx.prisma.mrpSuggestion.findMany({
        where,
        include: {
          material: { select: { id: true, code: true, description: true, unit: true } },
        },
        orderBy: { requiredDate: "asc" },
      });

      return suggestions;
    }),

  // Aprovar sugestão
  approveSuggestion: tenantProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const suggestion = await ctx.prisma.mrpSuggestion.update({
        where: { id: input.id },
        data: {
          status: "APPROVED",
          approvedBy: ctx.tenant.userId,
          approvedAt: new Date(),
        },
      });

      return suggestion;
    }),

  // Rejeitar sugestão
  rejectSuggestion: tenantProcedure
    .input(z.object({
      id: z.string(),
      reason: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const suggestion = await ctx.prisma.mrpSuggestion.update({
        where: { id: input.id },
        data: {
          status: "REJECTED",
          rejectedBy: ctx.tenant.userId,
          rejectedAt: new Date(),
          rejectionReason: input.reason,
        },
      });

      return suggestion;
    }),

  // Dashboard MRP
  dashboard: tenantProcedure
    .query(async ({ ctx }) => {
      const lastRun = await ctx.prisma.mrpRun.findFirst({
        where: { ...tenantFilter(ctx.companyId, false), status: "COMPLETED" },
        orderBy: { runDate: "desc" },
      });

      const pendingSuggestions = lastRun
        ? await ctx.prisma.mrpSuggestion.groupBy({
            by: ["type"],
            where: { runId: lastRun.id, status: "PENDING" },
            _count: true,
            _sum: { quantity: true },
          })
        : [];

      // Materiais sem BOM
      const materialsWithoutBom = await ctx.prisma.material.count({
        where: {
          ...tenantFilter(ctx.companyId, false),
          status: "ACTIVE",
          bomAsParent: { none: {} },
          inventory: { some: { inventoryType: "FINISHED" } },
        },
      });

      // Materiais sem parâmetros MRP
      const materialsWithoutParams = await ctx.prisma.material.count({
        where: {
          ...tenantFilter(ctx.companyId, false),
          status: "ACTIVE",
          mrpParameter: null,
        },
      });

      return {
        lastRun,
        pendingSuggestions,
        materialsWithoutBom,
        materialsWithoutParams,
      };
    }),
});
