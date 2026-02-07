import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, tenantProcedure } from "../trpc";

export const gpdRouter = createTRPCRouter({
  // ============================================================================
  // METAS ESTRATÉGICAS
  // ============================================================================

  listGoals: tenantProcedure
    .input(
      z.object({
        year: z.number().optional(),
        category: z.enum(["FINANCIAL", "OPERATIONAL", "CUSTOMER", "GROWTH", "PEOPLE"]).optional(),
        status: z.enum(["ACTIVE", "ACHIEVED", "NOT_ACHIEVED", "CANCELLED"]).optional(),
        parentId: z.string().uuid().nullable().optional(),
        departmentId: z.string().uuid().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      return ctx.prisma.strategicGoal.findMany({
        where: {
          companyId: ctx.companyId,
          ...(input?.year && { year: input.year }),
          ...(input?.category && { category: input.category }),
          ...(input?.status && { status: input.status }),
          ...(input?.parentId !== undefined && { parentId: input.parentId }),
          ...(input?.departmentId && { departmentId: input.departmentId }),
        },
        include: {
          owner: { select: { id: true, name: true } },
          department: { select: { id: true, name: true } },
          parent: { select: { id: true, title: true } },
          _count: { select: { children: true, indicators: true, actionPlans: true } },
        },
        orderBy: [{ category: "asc" }, { title: "asc" }],
      });
    }),

  getGoal: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.strategicGoal.findFirst({
        where: { id: input.id, companyId: ctx.companyId },
        include: {
          owner: { select: { id: true, name: true, email: true } },
          department: { select: { id: true, name: true, code: true } },
          parent: { select: { id: true, title: true, category: true } },
          children: {
            include: {
              owner: { select: { id: true, name: true } },
              _count: { select: { indicators: true } },
            },
          },
          indicators: {
            include: {
              history: { orderBy: { period: "desc" }, take: 12 },
            },
          },
          actionPlans: {
            include: {
              responsible: { select: { id: true, name: true } },
              _count: { select: { tasks: true } },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      });
    }),

  createGoal: tenantProcedure
    .input(
      z.object({
        year: z.number(),
        title: z.string().min(1),
        description: z.string().optional(),
        category: z.enum(["FINANCIAL", "OPERATIONAL", "CUSTOMER", "GROWTH", "PEOPLE"]),
        targetValue: z.number().optional(),
        unit: z.string().max(20).optional(),
        weight: z.number().min(0).max(10).optional(),
        ownerId: z.string().uuid().optional(),
        departmentId: z.string().uuid().optional(),
        parentId: z.string().uuid().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.strategicGoal.create({
        data: {
          ...input,
          companyId: ctx.companyId,
        },
      });
    }),

  updateGoal: tenantProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        targetValue: z.number().nullable().optional(),
        unit: z.string().max(20).optional(),
        weight: z.number().min(0).max(10).optional(),
        status: z.enum(["ACTIVE", "ACHIEVED", "NOT_ACHIEVED", "CANCELLED"]).optional(),
        ownerId: z.string().uuid().nullable().optional(),
        departmentId: z.string().uuid().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.prisma.strategicGoal.update({
        where: { id },
        data,
      });
    }),

  deleteGoal: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.strategicGoal.delete({
        where: { id: input.id },
      });
    }),

  // ============================================================================
  // INDICADORES
  // ============================================================================

  listIndicators: tenantProcedure
    .input(
      z.object({
        goalId: z.string().uuid().optional(),
        isActive: z.boolean().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      return ctx.prisma.goalIndicator.findMany({
        where: {
          companyId: ctx.companyId,
          ...(input?.goalId && { goalId: input.goalId }),
          ...(input?.isActive !== undefined && { isActive: input.isActive }),
        },
        include: {
          goal: { select: { id: true, title: true, category: true } },
          history: { orderBy: { period: "desc" }, take: 1 },
        },
        orderBy: { name: "asc" },
      });
    }),

  getIndicator: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.goalIndicator.findFirst({
        where: { id: input.id, companyId: ctx.companyId },
        include: {
          goal: { select: { id: true, title: true, category: true, year: true } },
          history: { orderBy: { period: "desc" }, take: 30 },
          actionPlans: {
            include: {
              responsible: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      });
    }),

  createIndicator: tenantProcedure
    .input(
      z.object({
        goalId: z.string().uuid(),
        name: z.string().min(1),
        description: z.string().optional(),
        formula: z.string().optional(),
        unit: z.string().max(20).optional(),
        polarity: z.enum(["HIGHER", "LOWER"]).optional(),
        frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY"]).optional(),
        targetMin: z.number().optional(),
        targetExpected: z.number().optional(),
        targetMax: z.number().optional(),
        dataSource: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.goalIndicator.create({
        data: {
          ...input,
          companyId: ctx.companyId,
        },
      });
    }),

  updateIndicator: tenantProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        formula: z.string().optional(),
        unit: z.string().max(20).optional(),
        polarity: z.enum(["HIGHER", "LOWER"]).optional(),
        frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY"]).optional(),
        targetMin: z.number().nullable().optional(),
        targetExpected: z.number().nullable().optional(),
        targetMax: z.number().nullable().optional(),
        dataSource: z.string().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.prisma.goalIndicator.update({
        where: { id },
        data,
      });
    }),

  recordIndicatorValue: tenantProcedure
    .input(
      z.object({
        indicatorId: z.string().uuid(),
        period: z.string(),
        value: z.number(),
        target: z.number().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const indicator = await ctx.prisma.goalIndicator.findFirst({
        where: { id: input.indicatorId, companyId: ctx.companyId },
      });

      if (!indicator) throw new TRPCError({ code: "NOT_FOUND", message: "Indicador não encontrado" });

      const target = input.target || indicator.targetExpected;
      let status: "BELOW" | "ON_TARGET" | "ABOVE" = "ON_TARGET";

      if (target) {
        const targetNum = Number(target);
        const targetMin = Number(indicator.targetMin || targetNum * 0.9);
        const targetMax = Number(indicator.targetMax || targetNum * 1.1);
        if (indicator.polarity === "HIGHER") {
          if (input.value < targetMin) status = "BELOW";
          else if (input.value >= targetMax) status = "ABOVE";
        } else {
          if (input.value > targetMax) status = "BELOW";
          else if (input.value <= targetMin) status = "ABOVE";
        }
      }

      const [history] = await ctx.prisma.$transaction([
        ctx.prisma.indicatorHistory.upsert({
          where: {
            indicatorId_period: {
              indicatorId: input.indicatorId,
              period: new Date(input.period),
            },
          },
          update: {
            value: input.value,
            target,
            status,
            notes: input.notes,
          },
          create: {
            indicatorId: input.indicatorId,
            period: new Date(input.period),
            value: input.value,
            target,
            status,
            notes: input.notes,
          },
        }),
        ctx.prisma.goalIndicator.update({
          where: { id: input.indicatorId },
          data: {
            currentValue: input.value,
            lastUpdated: new Date(),
          },
        }),
      ]);

      return history;
    }),

  // ============================================================================
  // PLANOS DE AÇÃO
  // ============================================================================

  listActionPlans: tenantProcedure
    .input(
      z.object({
        goalId: z.string().uuid().optional(),
        indicatorId: z.string().uuid().optional(),
        status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
        responsibleId: z.string().uuid().optional(),
        type: z.enum(["CORRECTIVE", "PREVENTIVE", "IMPROVEMENT"]).optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      return ctx.prisma.actionPlan.findMany({
        where: {
          companyId: ctx.companyId,
          ...(input?.goalId && { goalId: input.goalId }),
          ...(input?.indicatorId && { indicatorId: input.indicatorId }),
          ...(input?.status && { status: input.status }),
          ...(input?.responsibleId && { responsibleId: input.responsibleId }),
          ...(input?.type && { type: input.type }),
        },
        include: {
          goal: { select: { id: true, title: true } },
          indicator: { select: { id: true, name: true } },
          responsible: { select: { id: true, name: true } },
          creator: { select: { id: true, name: true } },
          _count: { select: { tasks: true } },
        },
        orderBy: [{ priority: "asc" }, { dueDate: "asc" }],
      });
    }),

  getActionPlan: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.actionPlan.findFirst({
        where: { id: input.id, companyId: ctx.companyId },
        include: {
          goal: { select: { id: true, title: true, category: true } },
          indicator: { select: { id: true, name: true, currentValue: true, targetExpected: true } },
          responsible: { select: { id: true, name: true, email: true } },
          creator: { select: { id: true, name: true } },
          tasks: {
            include: {
              responsible: { select: { id: true, name: true } },
            },
            orderBy: { sequence: "asc" },
          },
        },
      });
    }),

  createActionPlan: tenantProcedure
    .input(
      z.object({
        goalId: z.string().uuid().optional(),
        indicatorId: z.string().uuid().optional(),
        title: z.string().min(1),
        description: z.string().optional(),
        type: z.enum(["CORRECTIVE", "PREVENTIVE", "IMPROVEMENT"]).optional(),
        priority: z.number().min(1).max(4).optional(),
        responsibleId: z.string().uuid().optional(),
        dueDate: z.string().optional(),
        rootCause: z.string().optional(),
        expectedResult: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.actionPlan.create({
        data: {
          ...input,
          dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
          companyId: ctx.companyId,
          createdBy: ctx.tenant.userId,
        },
      });
    }),

  updateActionPlan: tenantProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        type: z.enum(["CORRECTIVE", "PREVENTIVE", "IMPROVEMENT"]).optional(),
        priority: z.number().min(1).max(4).optional(),
        status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).optional(),
        responsibleId: z.string().uuid().nullable().optional(),
        dueDate: z.string().nullable().optional(),
        progress: z.number().min(0).max(100).optional(),
        rootCause: z.string().optional(),
        expectedResult: z.string().optional(),
        actualResult: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, dueDate, status, ...data } = input;

      const updateData: Record<string, unknown> = { ...data };
      if (dueDate !== undefined) {
        updateData.dueDate = dueDate ? new Date(dueDate) : null;
      }
      if (status) {
        updateData.status = status;
        if (status === "COMPLETED") {
          updateData.completedAt = new Date();
          updateData.progress = 100;
        }
      }

      return ctx.prisma.actionPlan.update({
        where: { id },
        data: updateData,
      });
    }),

  deleteActionPlan: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.actionPlan.delete({
        where: { id: input.id },
      });
    }),

  // ============================================================================
  // TAREFAS DO PLANO DE AÇÃO
  // ============================================================================

  addTask: tenantProcedure
    .input(
      z.object({
        actionPlanId: z.string().uuid(),
        title: z.string().min(1),
        description: z.string().optional(),
        responsibleId: z.string().uuid().optional(),
        dueDate: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const maxSequence = await ctx.prisma.actionPlanTask.aggregate({
        where: { actionPlanId: input.actionPlanId },
        _max: { sequence: true },
      });

      return ctx.prisma.actionPlanTask.create({
        data: {
          ...input,
          dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
          sequence: (maxSequence._max.sequence || 0) + 1,
        },
      });
    }),

  updateTask: tenantProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        responsibleId: z.string().uuid().nullable().optional(),
        dueDate: z.string().nullable().optional(),
        status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, dueDate, status, ...data } = input;

      const updateData: Record<string, unknown> = { ...data };
      if (dueDate !== undefined) {
        updateData.dueDate = dueDate ? new Date(dueDate) : null;
      }
      if (status) {
        updateData.status = status;
        if (status === "COMPLETED") {
          updateData.completedAt = new Date();
        }
      }

      const task = await ctx.prisma.actionPlanTask.update({
        where: { id },
        data: updateData,
        include: { actionPlan: true },
      });

      // Atualizar progresso do plano de ação
      const tasks = await ctx.prisma.actionPlanTask.findMany({
        where: { actionPlanId: task.actionPlanId },
      });

      const completedTasks = tasks.filter((t) => t.status === "COMPLETED").length;
      const progress = Math.round((completedTasks / tasks.length) * 100);

      await ctx.prisma.actionPlan.update({
        where: { id: task.actionPlanId },
        data: { progress },
      });

      return task;
    }),

  deleteTask: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.actionPlanTask.delete({
        where: { id: input.id },
      });
    }),

  // ============================================================================
  // DASHBOARD GPD
  // ============================================================================

  getDashboard: tenantProcedure
    .input(z.object({ year: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const year = input?.year || new Date().getFullYear();

      const [goals, indicators, actionPlans, pendingActions] = await Promise.all([
        ctx.prisma.strategicGoal.groupBy({
          by: ["status"],
          where: { companyId: ctx.companyId, year },
          _count: true,
        }),
        ctx.prisma.goalIndicator.findMany({
          where: {
            companyId: ctx.companyId,
            goal: { year },
            isActive: true,
          },
          select: {
            id: true,
            name: true,
            currentValue: true,
            targetExpected: true,
            targetMin: true,
            targetMax: true,
            polarity: true,
            lastUpdated: true,
            goal: { select: { title: true, category: true } },
          },
        }),
        ctx.prisma.actionPlan.groupBy({
          by: ["status"],
          where: { companyId: ctx.companyId, goal: { year } },
          _count: true,
        }),
        ctx.prisma.actionPlan.findMany({
          where: {
            companyId: ctx.companyId,
            status: { in: ["PENDING", "IN_PROGRESS"] },
            dueDate: { lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
          },
          include: {
            goal: { select: { title: true } },
            responsible: { select: { name: true } },
          },
          orderBy: { dueDate: "asc" },
          take: 10,
        }),
      ]);

      // Calcular status dos indicadores
      const indicatorStatus = indicators.map((ind) => {
        let status: "BELOW" | "ON_TARGET" | "ABOVE" = "ON_TARGET";
        if (ind.currentValue !== null && ind.targetExpected !== null) {
          const currentVal = Number(ind.currentValue);
          const targetExp = Number(ind.targetExpected);
          const targetMin = Number(ind.targetMin || targetExp * 0.9);
          const targetMax = Number(ind.targetMax || targetExp * 1.1);
          if (ind.polarity === "HIGHER") {
            if (currentVal < targetMin) status = "BELOW";
            else if (currentVal >= targetMax) status = "ABOVE";
          } else {
            if (currentVal > targetMax) status = "BELOW";
            else if (currentVal <= targetMin) status = "ABOVE";
          }
        }
        return { ...ind, status };
      });

      const belowTarget = indicatorStatus.filter((i) => i.status === "BELOW").length;
      const onTarget = indicatorStatus.filter((i) => i.status === "ON_TARGET").length;
      const aboveTarget = indicatorStatus.filter((i) => i.status === "ABOVE").length;

      return {
        year,
        goals: {
          total: goals.reduce((acc, g) => acc + g._count, 0),
          byStatus: goals.reduce((acc, g) => ({ ...acc, [g.status]: g._count }), {}),
        },
        indicators: {
          total: indicators.length,
          belowTarget,
          onTarget,
          aboveTarget,
          list: indicatorStatus,
        },
        actionPlans: {
          total: actionPlans.reduce((acc, a) => acc + a._count, 0),
          byStatus: actionPlans.reduce((acc, a) => ({ ...acc, [a.status]: a._count }), {}),
        },
        pendingActions,
      };
    }),
});
