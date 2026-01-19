import { z } from "zod";
import { createTRPCRouter, tenantProcedure, tenantFilter } from "../trpc";
import { TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client";

export const mesRouter = createTRPCRouter({
  // ==========================================================================
  // APONTAMENTO DE PRODUÇÃO
  // ==========================================================================

  // Criar registro de produção (apontamento)
  createProductionLog: tenantProcedure
    .input(z.object({
      workCenterId: z.string().uuid(),
      productionOrderId: z.string().uuid().optional(),
      operatorId: z.string().uuid().optional(),
      shiftDate: z.date(),
      shiftNumber: z.number().min(1).max(3).default(1),
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
      // Verificar se work center existe
      const workCenter = await ctx.prisma.workCenter.findFirst({
        where: { id: input.workCenterId, ...tenantFilter(ctx.companyId, false) },
      });

      if (!workCenter) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Centro de trabalho não encontrado" });
      }

      const log = await ctx.prisma.productionLog.create({
        data: {
          ...input,
          createdBy: ctx.tenant.userId,
        },
        include: {
          workCenter: true,
          productionOrder: { include: { product: true } },
        },
      });

      return log;
    }),

  // Atualizar registro de produção
  updateProductionLog: tenantProcedure
    .input(z.object({
      id: z.string().uuid(),
      producedQuantity: z.number().optional(),
      goodQuantity: z.number().optional(),
      scrapQuantity: z.number().optional(),
      reworkQuantity: z.number().optional(),
      actualTimeMinutes: z.number().optional(),
      setupTimeMinutes: z.number().optional(),
      runTimeMinutes: z.number().optional(),
      stopTimeMinutes: z.number().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;

      const log = await ctx.prisma.productionLog.update({
        where: { id },
        data,
        include: {
          workCenter: true,
          productionOrder: { include: { product: true } },
        },
      });

      return log;
    }),

  // Listar registros de produção
  listProductionLogs: tenantProcedure
    .input(z.object({
      workCenterId: z.string().uuid().optional(),
      productionOrderId: z.string().uuid().optional(),
      dateFrom: z.date().optional(),
      dateTo: z.date().optional(),
      page: z.number().default(1),
      limit: z.number().default(20),
    }).optional())
    .query(async ({ input, ctx }) => {
      const { workCenterId, productionOrderId, dateFrom, dateTo, page = 1, limit = 20 } = input || {};

      const where: Prisma.ProductionLogWhereInput = {
        workCenter: { ...tenantFilter(ctx.companyId, false) },
        ...(workCenterId && { workCenterId }),
        ...(productionOrderId && { productionOrderId }),
        ...(dateFrom && { shiftDate: { gte: dateFrom } }),
        ...(dateTo && { shiftDate: { lte: dateTo } }),
      };

      const [logs, total] = await Promise.all([
        ctx.prisma.productionLog.findMany({
          where,
          include: {
            workCenter: true,
            productionOrder: { include: { product: true } },
            machineStops: true,
          },
          orderBy: [{ shiftDate: "desc" }, { shiftNumber: "asc" }],
          skip: (page - 1) * limit,
          take: limit,
        }),
        ctx.prisma.productionLog.count({ where }),
      ]);

      return { logs, total, pages: Math.ceil(total / limit) };
    }),

  // ==========================================================================
  // PARADAS DE MÁQUINA
  // ==========================================================================

  // Registrar parada
  startMachineStop: tenantProcedure
    .input(z.object({
      workCenterId: z.string().uuid(),
      productionLogId: z.string().uuid().optional(),
      stopType: z.enum(["PLANNED", "UNPLANNED", "SETUP", "MAINTENANCE", "QUALITY", "MATERIAL", "OTHER"]),
      reason: z.string().min(1),
    }))
    .mutation(async ({ input, ctx }) => {
      // Verificar se work center existe
      const workCenter = await ctx.prisma.workCenter.findFirst({
        where: { id: input.workCenterId, ...tenantFilter(ctx.companyId, false) },
      });

      if (!workCenter) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Centro de trabalho não encontrado" });
      }

      // Verificar se já existe parada em aberto
      const openStop = await ctx.prisma.machineStop.findFirst({
        where: { workCenterId: input.workCenterId, endTime: null },
      });

      if (openStop) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Já existe uma parada em aberto para este centro de trabalho" });
      }

      const stop = await ctx.prisma.machineStop.create({
        data: {
          workCenterId: input.workCenterId,
          productionLogId: input.productionLogId,
          stopType: input.stopType,
          startTime: new Date(),
          reason: input.reason,
          reportedBy: ctx.tenant.userId,
        },
        include: { workCenter: true },
      });

      return stop;
    }),

  // Encerrar parada
  endMachineStop: tenantProcedure
    .input(z.object({
      id: z.string().uuid(),
      solution: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const stop = await ctx.prisma.machineStop.findFirst({
        where: { id: input.id },
        include: { workCenter: true },
      });

      if (!stop) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Parada não encontrada" });
      }

      if (stop.endTime) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Parada já foi encerrada" });
      }

      const endTime = new Date();
      const durationMinutes = Math.round((endTime.getTime() - stop.startTime.getTime()) / 60000);

      const updatedStop = await ctx.prisma.machineStop.update({
        where: { id: input.id },
        data: {
          endTime,
          durationMinutes,
          solution: input.solution,
        },
        include: { workCenter: true },
      });

      // Atualizar tempo de parada no log de produção se vinculado
      if (stop.productionLogId) {
        await ctx.prisma.productionLog.update({
          where: { id: stop.productionLogId },
          data: { stopTimeMinutes: { increment: durationMinutes } },
        });
      }

      return updatedStop;
    }),

  // Listar paradas
  listMachineStops: tenantProcedure
    .input(z.object({
      workCenterId: z.string().uuid().optional(),
      stopType: z.enum(["PLANNED", "UNPLANNED", "SETUP", "MAINTENANCE", "QUALITY", "MATERIAL", "OTHER"]).optional(),
      dateFrom: z.date().optional(),
      dateTo: z.date().optional(),
      onlyOpen: z.boolean().default(false),
      page: z.number().default(1),
      limit: z.number().default(20),
    }).optional())
    .query(async ({ input, ctx }) => {
      const { workCenterId, stopType, dateFrom, dateTo, onlyOpen, page = 1, limit = 20 } = input || {};

      const where: Prisma.MachineStopWhereInput = {
        workCenter: { ...tenantFilter(ctx.companyId, false) },
        ...(workCenterId && { workCenterId }),
        ...(stopType && { stopType }),
        ...(dateFrom && { startTime: { gte: dateFrom } }),
        ...(dateTo && { startTime: { lte: dateTo } }),
        ...(onlyOpen && { endTime: null }),
      };

      const [stops, total] = await Promise.all([
        ctx.prisma.machineStop.findMany({
          where,
          include: { workCenter: true, productionLog: true },
          orderBy: { startTime: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        ctx.prisma.machineStop.count({ where }),
      ]);

      return { stops, total, pages: Math.ceil(total / limit) };
    }),

  // Paradas em aberto
  getOpenStops: tenantProcedure.query(async ({ ctx }) => {
    const stops = await ctx.prisma.machineStop.findMany({
      where: {
        workCenter: { ...tenantFilter(ctx.companyId, false) },
        endTime: null,
      },
      include: { workCenter: true },
      orderBy: { startTime: "asc" },
    });

    return stops;
  }),

  // ==========================================================================
  // TERMINAL DE CHÃO DE FÁBRICA
  // ==========================================================================

  // Obter status do centro de trabalho
  getWorkCenterStatus: tenantProcedure
    .input(z.object({ workCenterId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const workCenter = await ctx.prisma.workCenter.findFirst({
        where: { id: input.workCenterId, ...tenantFilter(ctx.companyId, false) },
      });

      if (!workCenter) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Centro de trabalho não encontrado" });
      }

      // Buscar parada em aberto
      const openStop = await ctx.prisma.machineStop.findFirst({
        where: { workCenterId: input.workCenterId, endTime: null },
      });

      // Buscar OP em andamento
      const activeOrder = await ctx.prisma.productionOrder.findFirst({
        where: {
          ...tenantFilter(ctx.companyId, false),
          status: "IN_PROGRESS",
          operations: { some: { workCenter: workCenter.code } },
        },
        include: { product: true },
        orderBy: { priority: "asc" },
      });

      // Buscar log de produção do dia
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayLog = await ctx.prisma.productionLog.findFirst({
        where: {
          workCenterId: input.workCenterId,
          shiftDate: { gte: today },
        },
        orderBy: { shiftDate: "desc" },
      });

      // Calcular OEE do dia
      let oee = null;
      if (todayLog && todayLog.plannedTimeMinutes > 0) {
        const availability = todayLog.plannedTimeMinutes > 0
          ? ((todayLog.plannedTimeMinutes - todayLog.stopTimeMinutes) / todayLog.plannedTimeMinutes) * 100
          : 0;
        const performance = todayLog.actualTimeMinutes > 0 && todayLog.idealCycleTimeSeconds
          ? ((todayLog.producedQuantity * todayLog.idealCycleTimeSeconds / 60) / todayLog.actualTimeMinutes) * 100
          : 0;
        const quality = todayLog.producedQuantity > 0
          ? (todayLog.goodQuantity / todayLog.producedQuantity) * 100
          : 0;
        oee = (availability * performance * quality) / 10000;
      }

      return {
        workCenter,
        status: openStop ? "STOPPED" : (activeOrder ? "RUNNING" : "IDLE"),
        openStop,
        activeOrder,
        todayLog,
        oee,
      };
    }),

  // Apontamento rápido (terminal)
  quickReport: tenantProcedure
    .input(z.object({
      workCenterId: z.string().uuid(),
      productionOrderId: z.string().uuid(),
      quantity: z.number().positive(),
      scrapQty: z.number().default(0),
      scrapReason: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Verificar OP
      const order = await ctx.prisma.productionOrder.findFirst({
        where: {
          id: input.productionOrderId,
          ...tenantFilter(ctx.companyId, false),
          status: "IN_PROGRESS",
        },
        include: { product: true },
      });

      if (!order) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Ordem de produção não encontrada ou não está em andamento" });
      }

      // Buscar ou criar log de produção do dia
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let log = await ctx.prisma.productionLog.findFirst({
        where: {
          workCenterId: input.workCenterId,
          productionOrderId: input.productionOrderId,
          shiftDate: { gte: today },
        },
      });

      if (!log) {
        log = await ctx.prisma.productionLog.create({
          data: {
            workCenterId: input.workCenterId,
            productionOrderId: input.productionOrderId,
            shiftDate: today,
            shiftNumber: 1,
            createdBy: ctx.tenant.userId,
          },
        });
      }

      // Atualizar log
      await ctx.prisma.productionLog.update({
        where: { id: log.id },
        data: {
          producedQuantity: { increment: input.quantity },
          goodQuantity: { increment: input.quantity - input.scrapQty },
          scrapQuantity: { increment: input.scrapQty },
          notes: input.scrapReason
            ? `${log.notes || ""}\nRefugo: ${input.scrapQty} - ${input.scrapReason}`.trim()
            : log.notes,
        },
      });

      // Atualizar OP
      const newProducedQty = order.producedQty + input.quantity;
      const isComplete = newProducedQty >= order.quantity;

      await ctx.prisma.productionOrder.update({
        where: { id: order.id },
        data: {
          producedQty: newProducedQty,
          status: isComplete ? "COMPLETED" : "IN_PROGRESS",
          actualEnd: isComplete ? new Date() : undefined,
        },
      });

      return {
        success: true,
        newProducedQty,
        isComplete,
        remaining: Math.max(0, order.quantity - newProducedQty),
      };
    }),

  // ==========================================================================
  // DASHBOARD MES
  // ==========================================================================

  dashboard: tenantProcedure.query(async ({ ctx }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      workCenters,
      openStops,
      todayProduction,
      activeOrders,
    ] = await Promise.all([
      // Centros de trabalho
      ctx.prisma.workCenter.findMany({
        where: tenantFilter(ctx.companyId, false),
        select: { id: true, code: true, name: true },
      }),

      // Paradas em aberto
      ctx.prisma.machineStop.count({
        where: {
          workCenter: { ...tenantFilter(ctx.companyId, false) },
          endTime: null,
        },
      }),

      // Produção do dia
      ctx.prisma.productionLog.aggregate({
        where: {
          workCenter: { ...tenantFilter(ctx.companyId, false) },
          shiftDate: { gte: today },
        },
        _sum: {
          producedQuantity: true,
          goodQuantity: true,
          scrapQuantity: true,
          stopTimeMinutes: true,
        },
      }),

      // OPs em andamento
      ctx.prisma.productionOrder.count({
        where: {
          ...tenantFilter(ctx.companyId, false),
          status: "IN_PROGRESS",
        },
      }),
    ]);

    // Calcular taxa de qualidade do dia
    const qualityRate = todayProduction._sum.producedQuantity
      ? ((todayProduction._sum.goodQuantity || 0) / todayProduction._sum.producedQuantity) * 100
      : 100;

    return {
      workCentersCount: workCenters.length,
      openStopsCount: openStops,
      activeOrdersCount: activeOrders,
      todayProduction: {
        produced: todayProduction._sum.producedQuantity || 0,
        good: todayProduction._sum.goodQuantity || 0,
        scrap: todayProduction._sum.scrapQuantity || 0,
        stopMinutes: todayProduction._sum.stopTimeMinutes || 0,
        qualityRate,
      },
    };
  }),
});
