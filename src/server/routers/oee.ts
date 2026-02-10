import { z } from "zod";
import { createTRPCRouter, tenantProcedure, tenantFilter } from "../trpc";
import { TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client";

export const oeeRouter = createTRPCRouter({
  // Listar centros de trabalho
  listWorkCenters: tenantProcedure
    .input(z.object({
      search: z.string().optional(),
      includeInactive: z.boolean().default(false),
    }).optional())
    .query(async ({ input, ctx }) => {
      const { search, includeInactive } = input || {};

      const where: Prisma.WorkCenterWhereInput = {
        ...tenantFilter(ctx.companyId, false),
        ...(search && {
          OR: [
            { code: { contains: search, mode: "insensitive" as const } },
            { name: { contains: search, mode: "insensitive" as const } },
          ],
        }),
        ...(!includeInactive && { isActive: true }),
      };

      const workCenters = await ctx.prisma.workCenter.findMany({
        where,
        orderBy: { code: "asc" },
      });

      return workCenters;
    }),

  // Criar centro de trabalho
  createWorkCenter: tenantProcedure
    .input(z.object({
      code: z.string().min(1),
      name: z.string().min(1),
      description: z.string().optional(),
      capacityPerHour: z.number().default(1),
      hoursPerDay: z.number().default(8),
      daysPerWeek: z.number().default(5),
      efficiencyTarget: z.number().default(85),
      setupTimeMinutes: z.number().default(0),
      costPerHour: z.number().default(0),
    }))
    .mutation(async ({ input, ctx }) => {
      const workCenter = await ctx.prisma.workCenter.create({
        data: {
          ...input,
          companyId: ctx.companyId,
        },
      });

      return workCenter;
    }),

  // Atualizar centro de trabalho
  updateWorkCenter: tenantProcedure
    .input(z.object({
      id: z.string(),
      code: z.string().min(1).optional(),
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      capacityPerHour: z.number().optional(),
      hoursPerDay: z.number().optional(),
      daysPerWeek: z.number().optional(),
      efficiencyTarget: z.number().optional(),
      setupTimeMinutes: z.number().optional(),
      costPerHour: z.number().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;

      const workCenter = await ctx.prisma.workCenter.update({
        where: { id, ...tenantFilter(ctx.companyId, false) },
        data,
      });

      return workCenter;
    }),

  // Registrar produção
  logProduction: tenantProcedure
    .input(z.object({
      workCenterId: z.string(),
      productionOrderId: z.string().optional(),
      shiftDate: z.date(),
      shiftNumber: z.number().default(1),
      plannedQuantity: z.number().default(0),
      producedQuantity: z.number().default(0),
      goodQuantity: z.number().default(0),
      scrapQuantity: z.number().default(0),
      reworkQuantity: z.number().default(0),
      plannedTimeMinutes: z.number().default(0),
      actualTimeMinutes: z.number().default(0),
      setupTimeMinutes: z.number().default(0),
      runTimeMinutes: z.number().default(0),
      stopTimeMinutes: z.number().default(0),
      cycleTimeSeconds: z.number().optional(),
      idealCycleTimeSeconds: z.number().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const log = await ctx.prisma.productionLog.create({
        data: {
          ...input,
          createdBy: ctx.tenant.userId,
        },
      });

      return log;
    }),

  // Registrar parada
  logStop: tenantProcedure
    .input(z.object({
      workCenterId: z.string(),
      productionLogId: z.string().optional(),
      stopType: z.enum(["PLANNED", "UNPLANNED", "SETUP", "MAINTENANCE", "QUALITY", "MATERIAL", "OTHER"]),
      startTime: z.date(),
      endTime: z.date().optional(),
      reason: z.string().min(1),
      solution: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      let durationMinutes: number | undefined;
      if (input.endTime) {
        durationMinutes = Math.round((input.endTime.getTime() - input.startTime.getTime()) / 60000);
      }

      const stop = await ctx.prisma.machineStop.create({
        data: {
          ...input,
          durationMinutes,
          reportedBy: ctx.tenant.userId,
        },
      });

      return stop;
    }),

  // Finalizar parada
  endStop: tenantProcedure
    .input(z.object({
      id: z.string(),
      endTime: z.date(),
      solution: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const stop = await ctx.prisma.machineStop.findFirst({
        where: { id: input.id },
        include: { workCenter: { select: { companyId: true } } },
      });
      if (!stop || stop.workCenter.companyId !== ctx.companyId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Parada não encontrada" });
      }

      const durationMinutes = Math.round((input.endTime.getTime() - stop.startTime.getTime()) / 60000);

      const updated = await ctx.prisma.machineStop.update({
        where: { id: input.id },
        data: {
          endTime: input.endTime,
          durationMinutes,
          solution: input.solution,
        },
      });

      return updated;
    }),

  // Calcular OEE de um centro de trabalho
  calculateOee: tenantProcedure
    .input(z.object({
      workCenterId: z.string(),
      startDate: z.date(),
      endDate: z.date(),
    }))
    .query(async ({ input, ctx }) => {
      const logs = await ctx.prisma.productionLog.findMany({
        where: {
          workCenterId: input.workCenterId,
          shiftDate: { gte: input.startDate, lte: input.endDate },
        },
      });

      if (logs.length === 0) {
        return {
          availability: 0,
          performance: 0,
          quality: 0,
          oee: 0,
          totalPlannedTime: 0,
          totalRunTime: 0,
          totalStopTime: 0,
          totalProduced: 0,
          totalGood: 0,
          totalScrap: 0,
        };
      }

      // Somar totais
      const totals = logs.reduce(
        (acc, log) => ({
          plannedTime: acc.plannedTime + log.plannedTimeMinutes,
          actualTime: acc.actualTime + log.actualTimeMinutes,
          runTime: acc.runTime + log.runTimeMinutes,
          stopTime: acc.stopTime + log.stopTimeMinutes,
          setupTime: acc.setupTime + log.setupTimeMinutes,
          plannedQty: Number(acc.plannedQty) + Number(log.plannedQuantity),
          producedQty: Number(acc.producedQty) + Number(log.producedQuantity),
          goodQty: Number(acc.goodQty) + Number(log.goodQuantity),
          scrapQty: Number(acc.scrapQty) + Number(log.scrapQuantity),
        }),
        {
          plannedTime: 0,
          actualTime: 0,
          runTime: 0,
          stopTime: 0,
          setupTime: 0,
          plannedQty: 0,
          producedQty: 0,
          goodQty: 0,
          scrapQty: 0,
        }
      );

      // Disponibilidade = Tempo de Operação / Tempo Planejado
      const availability = totals.plannedTime > 0
        ? ((totals.plannedTime - totals.stopTime) / totals.plannedTime) * 100
        : 0;

      // Performance = (Quantidade Produzida * Tempo Ciclo Ideal) / Tempo de Operação
      // Simplificado: Quantidade Produzida / Quantidade Planejada
      const performance = totals.plannedQty > 0
        ? (totals.producedQty / totals.plannedQty) * 100
        : 0;

      // Qualidade = Quantidade Boa / Quantidade Produzida
      const quality = totals.producedQty > 0
        ? (totals.goodQty / totals.producedQty) * 100
        : 0;

      // OEE = Disponibilidade * Performance * Qualidade
      const oee = (availability / 100) * (performance / 100) * (quality / 100) * 100;

      return {
        availability: Math.round(availability * 100) / 100,
        performance: Math.round(performance * 100) / 100,
        quality: Math.round(quality * 100) / 100,
        oee: Math.round(oee * 100) / 100,
        totalPlannedTime: totals.plannedTime,
        totalRunTime: totals.runTime,
        totalStopTime: totals.stopTime,
        totalProduced: totals.producedQty,
        totalGood: totals.goodQty,
        totalScrap: totals.scrapQty,
      };
    }),

  // Dashboard OEE
  dashboard: tenantProcedure
    .input(z.object({
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    }).optional())
    .query(async ({ input, ctx }) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const startDate = input?.startDate || new Date(today.getFullYear(), today.getMonth(), 1);
      const endDate = input?.endDate || today;

      // Buscar centros de trabalho ativos
      const workCenters = await ctx.prisma.workCenter.findMany({
        where: { ...tenantFilter(ctx.companyId, false), isActive: true },
      });

      // Calcular OEE por centro de trabalho
      const oeeByWorkCenter = await Promise.all(
        workCenters.map(async (wc) => {
          const logs = await ctx.prisma.productionLog.findMany({
            where: {
              workCenterId: wc.id,
              shiftDate: { gte: startDate, lte: endDate },
            },
          });

          if (logs.length === 0) {
            return {
              workCenter: wc,
              availability: 0,
              performance: 0,
              quality: 0,
              oee: 0,
            };
          }

          const totals = logs.reduce(
            (acc, log) => ({
              plannedTime: acc.plannedTime + log.plannedTimeMinutes,
              stopTime: acc.stopTime + log.stopTimeMinutes,
              plannedQty: Number(acc.plannedQty) + Number(log.plannedQuantity),
              producedQty: Number(acc.producedQty) + Number(log.producedQuantity),
              goodQty: Number(acc.goodQty) + Number(log.goodQuantity),
            }),
            { plannedTime: 0, stopTime: 0, plannedQty: 0, producedQty: 0, goodQty: 0 }
          );

          const availability = totals.plannedTime > 0
            ? ((totals.plannedTime - totals.stopTime) / totals.plannedTime) * 100
            : 0;
          const performance = totals.plannedQty > 0
            ? (totals.producedQty / totals.plannedQty) * 100
            : 0;
          const quality = totals.producedQty > 0
            ? (totals.goodQty / totals.producedQty) * 100
            : 0;
          const oee = (availability / 100) * (performance / 100) * (quality / 100) * 100;

          return {
            workCenter: wc,
            availability: Math.round(availability * 100) / 100,
            performance: Math.round(performance * 100) / 100,
            quality: Math.round(quality * 100) / 100,
            oee: Math.round(oee * 100) / 100,
          };
        })
      );

      // Paradas por tipo
      const stopsByType = await ctx.prisma.machineStop.groupBy({
        by: ["stopType"],
        where: {
          workCenter: tenantFilter(ctx.companyId, false),
          startTime: { gte: startDate, lte: endDate },
        },
        _count: true,
        _sum: { durationMinutes: true },
      });

      // Produção do período
      const productionSummary = await ctx.prisma.productionLog.aggregate({
        where: {
          workCenter: tenantFilter(ctx.companyId, false),
          shiftDate: { gte: startDate, lte: endDate },
        },
        _sum: {
          producedQuantity: true,
          goodQuantity: true,
          scrapQuantity: true,
          plannedTimeMinutes: true,
          stopTimeMinutes: true,
        },
      });

      // OEE médio
      const validOees = oeeByWorkCenter.filter(o => o.oee > 0);
      const averageOee = validOees.length > 0
        ? validOees.reduce((sum, o) => sum + o.oee, 0) / validOees.length
        : 0;

      return {
        period: { startDate, endDate },
        averageOee: Math.round(averageOee * 100) / 100,
        oeeByWorkCenter,
        stopsByType,
        productionSummary: {
          totalProduced: productionSummary._sum.producedQuantity || 0,
          totalGood: productionSummary._sum.goodQuantity || 0,
          totalScrap: productionSummary._sum.scrapQuantity || 0,
          totalPlannedTime: productionSummary._sum.plannedTimeMinutes || 0,
          totalStopTime: productionSummary._sum.stopTimeMinutes || 0,
        },
      };
    }),

  // Metas OEE
  getTargets: tenantProcedure
    .input(z.object({
      workCenterId: z.string().optional(),
      year: z.number(),
      month: z.number().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const targets = await ctx.prisma.oeeTarget.findFirst({
        where: {
          ...tenantFilter(ctx.companyId, false),
          workCenterId: input.workCenterId || null,
          year: input.year,
          month: input.month || null,
        },
      });

      return targets || {
        availabilityTarget: 90,
        performanceTarget: 95,
        qualityTarget: 99,
        oeeTarget: 85,
      };
    }),

  // Salvar metas OEE
  saveTargets: tenantProcedure
    .input(z.object({
      workCenterId: z.string().optional(),
      year: z.number(),
      month: z.number().optional(),
      availabilityTarget: z.number().default(90),
      performanceTarget: z.number().default(95),
      qualityTarget: z.number().default(99),
      oeeTarget: z.number().default(85),
    }))
    .mutation(async ({ input, ctx }) => {
      const existing = await ctx.prisma.oeeTarget.findFirst({
        where: {
          ...tenantFilter(ctx.companyId, false),
          workCenterId: input.workCenterId || null,
          year: input.year,
          month: input.month || null,
        },
      });

      if (existing) {
        return ctx.prisma.oeeTarget.update({
          where: { id: existing.id },
          data: {
            availabilityTarget: input.availabilityTarget,
            performanceTarget: input.performanceTarget,
            qualityTarget: input.qualityTarget,
            oeeTarget: input.oeeTarget,
          },
        });
      }

      return ctx.prisma.oeeTarget.create({
        data: {
          companyId: ctx.companyId,
          workCenterId: input.workCenterId,
          year: input.year,
          month: input.month,
          availabilityTarget: input.availabilityTarget,
          performanceTarget: input.performanceTarget,
          qualityTarget: input.qualityTarget,
          oeeTarget: input.oeeTarget,
        },
      });
    }),
});
