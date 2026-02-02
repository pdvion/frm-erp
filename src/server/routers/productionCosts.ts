import { z } from "zod";
import { createTRPCRouter, tenantProcedure } from "../trpc";
import { prisma } from "@/lib/prisma";
import { TRPCError } from "@trpc/server";

const costStatusEnum = z.enum(["DRAFT", "CALCULATED", "CLOSED"]);

export const productionCostsRouter = createTRPCRouter({
  // Listar custos de produção
  list: tenantProcedure
    .input(
      z.object({
        search: z.string().optional(),
        status: costStatusEnum.optional(),
        page: z.number().default(1),
        limit: z.number().default(20),
      })
    )
    .query(async ({ input, ctx }) => {
      const { search, status, page, limit } = input;
      const skip = (page - 1) * limit;

      const where: Record<string, unknown> = {
        companyId: ctx.companyId,
      };

      if (search) {
        where.productionOrder = {
          OR: [
            { code: { equals: parseInt(search) || -1 } },
            { product: { description: { contains: search, mode: "insensitive" as const } } },
          ],
        };
      }

      if (status) where.status = status;

      const [costs, total] = await Promise.all([
        prisma.productionCost.findMany({
          where,
          include: {
            productionOrder: {
              select: {
                id: true,
                code: true,
                status: true,
                quantity: true,
                producedQty: true,
                product: { select: { id: true, code: true, description: true } },
              },
            },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.productionCost.count({ where }),
      ]);

      return {
        costs,
        total,
        page,
        pages: Math.ceil(total / limit),
      };
    }),

  // Obter custo por ID
  byId: tenantProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const cost = await prisma.productionCost.findFirst({
        where: { id: input.id, companyId: ctx.companyId },
        include: {
          productionOrder: {
            include: {
              product: true,
              materials: { include: { material: true } },
              operations: true,
            },
          },
          materialItems: {
            include: { productionCost: true },
          },
          laborItems: {
            include: { productionCost: true },
          },
        },
      });

      if (!cost) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Custo não encontrado" });
      }

      return cost;
    }),

  // Obter custo por OP
  byProductionOrder: tenantProcedure
    .input(z.object({ productionOrderId: z.string() }))
    .query(async ({ input, ctx }) => {
      const cost = await prisma.productionCost.findFirst({
        where: { productionOrderId: input.productionOrderId, companyId: ctx.companyId },
        include: {
          productionOrder: {
            include: { product: true },
          },
          materialItems: {
            include: { productionCost: true },
          },
          laborItems: {
            include: { productionCost: true },
          },
        },
      });

      return cost;
    }),

  // Calcular custo de uma OP
  calculate: tenantProcedure
    .input(z.object({ productionOrderId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      // Buscar OP com materiais e logs de produção
      const order = await prisma.productionOrder.findFirst({
        where: { id: input.productionOrderId, companyId: ctx.companyId },
        include: {
          product: true,
          materials: { include: { material: true } },
          productionLogs: {
            include: { workCenter: true },
          },
        },
      });

      if (!order) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Ordem de produção não encontrada" });
      }

      // Verificar se já existe custo para esta OP
      let existingCost = await prisma.productionCost.findFirst({
        where: { productionOrderId: input.productionOrderId },
      });

      // Calcular custo de materiais
      let materialCost = 0;
      let materialCostStd = 0;
      const materialDetails: Array<{
        materialId: string;
        quantityStd: number;
        quantityActual: number;
        unitCost: number;
        totalCostStd: number;
        totalCostActual: number;
        variance: number;
      }> = [];

      for (const mat of order.materials) {
        const unitCost = mat.unitCost || 0;
        const qtyStd = mat.requiredQty;
        const qtyActual = mat.consumedQty;
        const costStd = qtyStd * unitCost;
        const costActual = qtyActual * unitCost;

        materialCost += costActual;
        materialCostStd += costStd;

        materialDetails.push({
          materialId: mat.materialId,
          quantityStd: qtyStd,
          quantityActual: qtyActual,
          unitCost,
          totalCostStd: costStd,
          totalCostActual: costActual,
          variance: costActual - costStd,
        });
      }

      // Calcular custo de mão de obra
      let laborCost = 0;
      let laborCostStd = 0;
      let laborHours = 0;
      let laborHoursStd = 0;
      const laborDetails: Array<{
        workCenterId: string | null;
        hoursStd: number;
        hoursActual: number;
        hourlyRate: number;
        totalCostStd: number;
        totalCostActual: number;
        variance: number;
      }> = [];

      // Agrupar logs por centro de trabalho
      const logsByWorkCenter = new Map<string, typeof order.productionLogs>();
      for (const log of order.productionLogs) {
        const wcId = log.workCenterId;
        if (!logsByWorkCenter.has(wcId)) {
          logsByWorkCenter.set(wcId, []);
        }
        logsByWorkCenter.get(wcId)!.push(log);
      }

      for (const [wcId, logs] of logsByWorkCenter) {
        const workCenter = logs[0]?.workCenter;
        const hourlyRate = workCenter?.costPerHour || 0;

        // Somar horas trabalhadas
        const hoursActual = logs.reduce((sum, log) => {
          const runtime = log.runTimeMinutes || 0;
          return sum + runtime / 60;
        }, 0);

        // Horas padrão (estimativa baseada na quantidade produzida e capacidade)
        const hoursStd = workCenter?.capacityPerHour
          ? order.producedQty / workCenter.capacityPerHour
          : hoursActual;

        const costStd = hoursStd * hourlyRate;
        const costActual = hoursActual * hourlyRate;

        laborCost += costActual;
        laborCostStd += costStd;
        laborHours += hoursActual;
        laborHoursStd += hoursStd;

        laborDetails.push({
          workCenterId: wcId,
          hoursStd,
          hoursActual,
          hourlyRate,
          totalCostStd: costStd,
          totalCostActual: costActual,
          variance: costActual - costStd,
        });
      }

      // Calcular custos indiretos (GGF) - 30% do custo de mão de obra como padrão
      const overheadRate = 0.3;
      const overheadCost = laborCost * overheadRate;
      const overheadCostStd = laborCostStd * overheadRate;

      // Totais
      const totalCost = materialCost + laborCost + overheadCost;
      const totalCostStd = materialCostStd + laborCostStd + overheadCostStd;
      const quantityProduced = order.producedQty || 1;
      const unitCost = totalCost / quantityProduced;
      const unitCostStd = totalCostStd / quantityProduced;

      // Criar ou atualizar custo
      if (existingCost) {
        // Deletar detalhes antigos
        await prisma.productionCostMaterial.deleteMany({ where: { productionCostId: existingCost.id } });
        await prisma.productionCostLabor.deleteMany({ where: { productionCostId: existingCost.id } });

        existingCost = await prisma.productionCost.update({
          where: { id: existingCost.id },
          data: {
            status: "CALCULATED",
            materialCost,
            materialCostStd,
            materialVariance: materialCost - materialCostStd,
            laborCost,
            laborCostStd,
            laborVariance: laborCost - laborCostStd,
            laborHours,
            laborHoursStd,
            overheadCost,
            overheadCostStd,
            overheadVariance: overheadCost - overheadCostStd,
            totalCost,
            totalCostStd,
            totalVariance: totalCost - totalCostStd,
            unitCost,
            unitCostStd,
            quantityProduced,
            calculatedAt: new Date(),
            materialItems: { create: materialDetails },
            laborItems: { create: laborDetails },
          },
          include: { materialItems: true, laborItems: true },
        });
      } else {
        existingCost = await prisma.productionCost.create({
          data: {
            productionOrderId: input.productionOrderId,
            companyId: ctx.companyId,
            status: "CALCULATED",
            materialCost,
            materialCostStd,
            materialVariance: materialCost - materialCostStd,
            laborCost,
            laborCostStd,
            laborVariance: laborCost - laborCostStd,
            laborHours,
            laborHoursStd,
            overheadCost,
            overheadCostStd,
            overheadVariance: overheadCost - overheadCostStd,
            totalCost,
            totalCostStd,
            totalVariance: totalCost - totalCostStd,
            unitCost,
            unitCostStd,
            quantityProduced,
            calculatedAt: new Date(),
            materialItems: { create: materialDetails },
            laborItems: { create: laborDetails },
          },
          include: { materialItems: true, laborItems: true },
        });
      }

      return existingCost;
    }),

  // Fechar custo (não permite mais alterações)
  close: tenantProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const cost = await prisma.productionCost.findFirst({
        where: { id: input.id, companyId: ctx.companyId },
      });

      if (!cost) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Custo não encontrado" });
      }

      if (cost.status === "CLOSED") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Custo já está fechado" });
      }

      if (cost.status !== "CALCULATED") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Custo precisa ser calculado antes de fechar" });
      }

      return prisma.productionCost.update({
        where: { id: input.id },
        data: {
          status: "CLOSED",
          closedAt: new Date(),
        },
      });
    }),

  // Custo padrão de material
  getStandardCost: tenantProcedure
    .input(z.object({ materialId: z.string() }))
    .query(async ({ input, ctx }) => {
      const cost = await prisma.materialStandardCost.findFirst({
        where: { materialId: input.materialId, companyId: ctx.companyId },
        orderBy: { effectiveDate: "desc" },
      });

      return cost;
    }),

  // Salvar custo padrão de material
  saveStandardCost: tenantProcedure
    .input(
      z.object({
        materialId: z.string(),
        materialCost: z.number().min(0),
        laborCost: z.number().min(0).optional(),
        overheadCost: z.number().min(0).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const totalCost = input.materialCost + (input.laborCost || 0) + (input.overheadCost || 0);

      const cost = await prisma.materialStandardCost.create({
        data: {
          materialId: input.materialId,
          companyId: ctx.companyId,
          materialCost: input.materialCost,
          laborCost: input.laborCost ?? 0,
          overheadCost: input.overheadCost ?? 0,
          totalCost,
          notes: input.notes,
          createdBy: ctx.tenant.userId,
        },
      });

      return cost;
    }),

  // Dashboard de custos
  dashboard: tenantProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalCosts,
      calculatedCosts,
      closedCosts,
      monthlyCosts,
      avgVariance,
      byStatus,
    ] = await Promise.all([
      prisma.productionCost.count({ where: { companyId: ctx.companyId } }),
      prisma.productionCost.count({
        where: { companyId: ctx.companyId, status: "CALCULATED" },
      }),
      prisma.productionCost.count({
        where: { companyId: ctx.companyId, status: "CLOSED" },
      }),
      prisma.productionCost.aggregate({
        where: {
          companyId: ctx.companyId,
          calculatedAt: { gte: startOfMonth },
        },
        _sum: { totalCost: true },
        _count: true,
      }),
      prisma.productionCost.aggregate({
        where: { companyId: ctx.companyId, status: { in: ["CALCULATED", "CLOSED"] } },
        _avg: { totalVariance: true },
      }),
      prisma.productionCost.groupBy({
        by: ["status"],
        where: { companyId: ctx.companyId },
        _count: true,
        _sum: { totalCost: true },
      }),
    ]);

    return {
      totalCosts,
      calculatedCosts,
      closedCosts,
      monthlyCosts: {
        count: monthlyCosts._count,
        total: monthlyCosts._sum?.totalCost ?? 0,
      },
      avgVariance: avgVariance._avg?.totalVariance ?? 0,
      byStatus: byStatus.map((s: { status: string; _count: number; _sum: { totalCost: number | null } }) => ({
        status: s.status,
        count: s._count,
        total: s._sum?.totalCost ?? 0,
      })),
    };
  }),
});
