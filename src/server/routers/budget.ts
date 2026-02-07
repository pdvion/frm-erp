import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, tenantProcedure } from "../trpc";

export const budgetRouter = createTRPCRouter({
  // ============================================================================
  // CONTAS ORÇAMENTÁRIAS
  // ============================================================================

  listAccounts: tenantProcedure
    .input(
      z.object({
        type: z.enum(["REVENUE", "EXPENSE", "INVESTMENT"]).optional(),
        parentId: z.string().uuid().nullable().optional(),
        isActive: z.boolean().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      return ctx.prisma.budgetAccount.findMany({
        where: {
          companyId: ctx.companyId,
          ...(input?.type && { type: input.type }),
          ...(input?.parentId !== undefined && { parentId: input.parentId }),
          ...(input?.isActive !== undefined && { isActive: input.isActive }),
        },
        include: {
          parent: { select: { id: true, code: true, name: true } },
          _count: { select: { children: true, entries: true } },
        },
        orderBy: { code: "asc" },
      });
    }),

  getAccount: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.budgetAccount.findFirst({
        where: { id: input.id, companyId: ctx.companyId },
        include: {
          parent: { select: { id: true, code: true, name: true } },
          children: { orderBy: { code: "asc" } },
        },
      });
    }),

  createAccount: tenantProcedure
    .input(
      z.object({
        code: z.string().min(1).max(20),
        name: z.string().min(1),
        description: z.string().optional(),
        type: z.enum(["REVENUE", "EXPENSE", "INVESTMENT"]),
        parentId: z.string().uuid().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      let level = 1;
      if (input.parentId) {
        const parent = await ctx.prisma.budgetAccount.findUnique({
          where: { id: input.parentId },
        });
        if (parent) level = parent.level + 1;
      }

      return ctx.prisma.budgetAccount.create({
        data: {
          ...input,
          level,
          companyId: ctx.companyId,
        },
      });
    }),

  updateAccount: tenantProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        code: z.string().min(1).max(20).optional(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.prisma.budgetAccount.update({
        where: { id },
        data,
      });
    }),

  // ============================================================================
  // VERSÕES DE ORÇAMENTO
  // ============================================================================

  listVersions: tenantProcedure
    .input(
      z.object({
        year: z.number().optional(),
        type: z.enum(["ORIGINAL", "REVISED", "FORECAST"]).optional(),
        status: z.enum(["DRAFT", "APPROVED", "LOCKED"]).optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      return ctx.prisma.budgetVersion.findMany({
        where: {
          companyId: ctx.companyId,
          ...(input?.year && { year: input.year }),
          ...(input?.type && { type: input.type }),
          ...(input?.status && { status: input.status }),
        },
        include: {
          creator: { select: { id: true, name: true } },
          approver: { select: { id: true, name: true } },
          _count: { select: { entries: true } },
        },
        orderBy: [{ year: "desc" }, { createdAt: "desc" }],
      });
    }),

  getVersion: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.budgetVersion.findFirst({
        where: { id: input.id, companyId: ctx.companyId },
        include: {
          creator: { select: { id: true, name: true } },
          approver: { select: { id: true, name: true } },
          entries: {
            include: {
              account: { select: { id: true, code: true, name: true, type: true } },
              costCenter: { select: { id: true, code: true, name: true } },
            },
          },
        },
      });
    }),

  createVersion: tenantProcedure
    .input(
      z.object({
        year: z.number(),
        name: z.string().min(1),
        type: z.enum(["ORIGINAL", "REVISED", "FORECAST"]),
        description: z.string().optional(),
        copyFromVersionId: z.string().uuid().optional(),
        adjustmentPercent: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { copyFromVersionId, adjustmentPercent, ...data } = input;

      const version = await ctx.prisma.budgetVersion.create({
        data: {
          ...data,
          companyId: ctx.companyId,
          createdBy: ctx.tenant.userId,
        },
      });

      if (copyFromVersionId) {
        const sourceEntries = await ctx.prisma.budgetEntry.findMany({
          where: { versionId: copyFromVersionId },
        });

        const multiplier = adjustmentPercent ? 1 + adjustmentPercent / 100 : 1;

        await ctx.prisma.budgetEntry.createMany({
          data: sourceEntries.map((entry) => ({
            versionId: version.id,
            accountId: entry.accountId,
            costCenterId: entry.costCenterId,
            month: entry.month,
            amount: Number(entry.amount) * multiplier,
            notes: entry.notes,
          })),
        });
      }

      return version;
    }),

  updateVersion: tenantProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        status: z.enum(["DRAFT", "APPROVED", "LOCKED"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, status, ...data } = input;

      const updateData: Record<string, unknown> = { ...data };
      if (status) {
        updateData.status = status;
        if (status === "APPROVED") {
          updateData.approvedBy = ctx.tenant.userId;
          updateData.approvedAt = new Date();
        }
      }

      return ctx.prisma.budgetVersion.update({
        where: { id },
        data: updateData,
      });
    }),

  // ============================================================================
  // ENTRADAS ORÇAMENTÁRIAS
  // ============================================================================

  getEntries: tenantProcedure
    .input(
      z.object({
        versionId: z.string().uuid(),
        accountId: z.string().uuid().optional(),
        costCenterId: z.string().uuid().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.prisma.budgetEntry.findMany({
        where: {
          versionId: input.versionId,
          ...(input.accountId && { accountId: input.accountId }),
          ...(input.costCenterId && { costCenterId: input.costCenterId }),
        },
        include: {
          account: { select: { id: true, code: true, name: true, type: true } },
          costCenter: { select: { id: true, code: true, name: true } },
        },
        orderBy: [{ account: { code: "asc" } }, { month: "asc" }],
      });
    }),

  upsertEntry: tenantProcedure
    .input(
      z.object({
        versionId: z.string().uuid(),
        accountId: z.string().uuid(),
        costCenterId: z.string().uuid().optional(),
        month: z.number().min(1).max(12),
        amount: z.number(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { versionId, accountId, costCenterId, month, ...data } = input;

      // Se não tem costCenterId, buscar ou criar sem ele
      if (!costCenterId) {
        const existing = await ctx.prisma.budgetEntry.findFirst({
          where: { versionId, accountId, costCenterId: null, month },
        });

        if (existing) {
          return ctx.prisma.budgetEntry.update({
            where: { id: existing.id },
            data,
          });
        }

        return ctx.prisma.budgetEntry.create({
          data: { versionId, accountId, month, ...data },
        });
      }

      return ctx.prisma.budgetEntry.upsert({
        where: {
          versionId_accountId_costCenterId_month: {
            versionId,
            accountId,
            costCenterId,
            month,
          },
        },
        update: data,
        create: {
          versionId,
          accountId,
          costCenterId,
          month,
          ...data,
        },
      });
    }),

  distributeAnnualBudget: tenantProcedure
    .input(
      z.object({
        versionId: z.string().uuid(),
        accountId: z.string().uuid(),
        costCenterId: z.string().uuid().nullable().optional(),
        annualAmount: z.number(),
        distribution: z.enum(["LINEAR", "SEASONAL"]),
        seasonalWeights: z.array(z.number()).length(12).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { versionId, accountId, costCenterId, annualAmount, distribution, seasonalWeights } = input;

      let monthlyAmounts: number[];

      if (distribution === "LINEAR") {
        const monthlyAmount = annualAmount / 12;
        monthlyAmounts = Array(12).fill(monthlyAmount);
      } else {
        const weights = seasonalWeights || [8, 8, 9, 8, 8, 9, 8, 8, 9, 8, 8, 9];
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        monthlyAmounts = weights.map((w) => (annualAmount * w) / totalWeight);
      }

      const entries = monthlyAmounts.map((amount, index) => ({
        versionId,
        accountId,
        costCenterId: costCenterId || null,
        month: index + 1,
        amount,
      }));

      await ctx.prisma.budgetEntry.deleteMany({
        where: { versionId, accountId, costCenterId: costCenterId || null },
      });

      await ctx.prisma.budgetEntry.createMany({ data: entries });

      return { success: true, entries: entries.length };
    }),

  // ============================================================================
  // REALIZADO
  // ============================================================================

  recordActual: tenantProcedure
    .input(
      z.object({
        accountId: z.string().uuid(),
        costCenterId: z.string().uuid().optional(),
        date: z.string(),
        amount: z.number(),
        description: z.string().optional(),
        documentType: z.string().optional(),
        documentId: z.string().uuid().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.budgetActual.create({
        data: {
          ...input,
          date: new Date(input.date),
          companyId: ctx.companyId,
        },
      });
    }),

  getActuals: tenantProcedure
    .input(
      z.object({
        accountId: z.string().uuid().optional(),
        costCenterId: z.string().uuid().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      return ctx.prisma.budgetActual.findMany({
        where: {
          companyId: ctx.companyId,
          ...(input?.accountId && { accountId: input.accountId }),
          ...(input?.costCenterId && { costCenterId: input.costCenterId }),
          ...(input?.startDate && { date: { gte: new Date(input.startDate) } }),
          ...(input?.endDate && { date: { lte: new Date(input.endDate) } }),
        },
        include: {
          account: { select: { id: true, code: true, name: true, type: true } },
          costCenter: { select: { id: true, code: true, name: true } },
        },
        orderBy: { date: "desc" },
      });
    }),

  // ============================================================================
  // DASHBOARD E ANÁLISE
  // ============================================================================

  getDashboard: tenantProcedure
    .input(z.object({ year: z.number().optional(), versionId: z.string().uuid().optional() }))
    .query(async ({ ctx, input }) => {
      const year = input?.year || new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;

      let version = input?.versionId
        ? await ctx.prisma.budgetVersion.findFirst({ where: { id: input.versionId } })
        : await ctx.prisma.budgetVersion.findFirst({
          where: { companyId: ctx.companyId, year, status: "APPROVED" },
          orderBy: { createdAt: "desc" },
        });

      if (!version) {
        version = await ctx.prisma.budgetVersion.findFirst({
          where: { companyId: ctx.companyId, year },
          orderBy: { createdAt: "desc" },
        });
      }

      if (!version) {
        return {
          year,
          version: null,
          summary: { budgeted: 0, actual: 0, variance: 0, variancePercent: 0 },
          byAccount: [],
          alerts: [],
        };
      }

      const [entries, actuals, alerts] = await Promise.all([
        ctx.prisma.budgetEntry.groupBy({
          by: ["accountId"],
          where: { versionId: version.id, month: { lte: currentMonth } },
          _sum: { amount: true },
        }),
        ctx.prisma.budgetActual.groupBy({
          by: ["accountId"],
          where: {
            companyId: ctx.companyId,
            date: {
              gte: new Date(year, 0, 1),
              lte: new Date(year, currentMonth - 1, 31),
            },
          },
          _sum: { amount: true },
        }),
        ctx.prisma.budgetAlert.findMany({
          where: { companyId: ctx.companyId, versionId: version.id, isResolved: false },
          include: {
            account: { select: { code: true, name: true } },
            costCenter: { select: { code: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        }),
      ]);

      const accounts = await ctx.prisma.budgetAccount.findMany({
        where: { companyId: ctx.companyId, isActive: true },
        select: { id: true, code: true, name: true, type: true },
      });

      const budgetMap = new Map(entries.map((e) => [e.accountId, e._sum.amount || 0]));
      const actualMap = new Map(actuals.map((a) => [a.accountId, a._sum.amount || 0]));

      const byAccount = accounts.map((account) => {
        const budgeted = Number(budgetMap.get(account.id) || 0);
        const actual = Number(actualMap.get(account.id) || 0);
        const variance = budgeted - actual;
        const variancePercent = budgeted !== 0 ? (variance / budgeted) * 100 : 0;

        return {
          ...account,
          budgeted,
          actual,
          variance,
          variancePercent,
          status: variancePercent < -10 ? "EXCEEDED" : variancePercent < 0 ? "WARNING" : "OK",
        };
      });

      const totalBudgeted = byAccount.reduce((sum, a) => sum + Number(a.budgeted), 0);
      const totalActual = byAccount.reduce((sum, a) => sum + Number(a.actual), 0);

      return {
        year,
        version: { id: version.id, name: version.name, type: version.type, status: version.status },
        summary: {
          budgeted: totalBudgeted,
          actual: totalActual,
          variance: totalBudgeted - totalActual,
          variancePercent: totalBudgeted !== 0 ? ((totalBudgeted - totalActual) / totalBudgeted) * 100 : 0,
        },
        byAccount: byAccount.filter((a) => a.budgeted !== 0 || a.actual !== 0),
        alerts,
      };
    }),

  getBudgetVsActual: tenantProcedure
    .input(
      z.object({
        versionId: z.string().uuid(),
        accountId: z.string().uuid().optional(),
        costCenterId: z.string().uuid().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const version = await ctx.prisma.budgetVersion.findFirst({
        where: { id: input.versionId },
      });

      if (!version) throw new TRPCError({ code: "NOT_FOUND", message: "Versão não encontrada" });

      const entries = await ctx.prisma.budgetEntry.findMany({
        where: {
          versionId: input.versionId,
          ...(input.accountId && { accountId: input.accountId }),
          ...(input.costCenterId && { costCenterId: input.costCenterId }),
        },
        include: {
          account: { select: { id: true, code: true, name: true, type: true } },
        },
      });

      const actuals = await ctx.prisma.budgetActual.findMany({
        where: {
          companyId: ctx.companyId,
          date: {
            gte: new Date(version.year, 0, 1),
            lte: new Date(version.year, 11, 31),
          },
          ...(input.accountId && { accountId: input.accountId }),
          ...(input.costCenterId && { costCenterId: input.costCenterId }),
        },
      });

      const monthlyData = Array.from({ length: 12 }, (_, i) => {
        const month = i + 1;
        const budgeted = entries
          .filter((e) => e.month === month)
          .reduce((sum, e) => sum + Number(e.amount), 0);
        const actual = actuals
          .filter((a) => new Date(a.date).getMonth() + 1 === month)
          .reduce((sum, a) => sum + Number(a.amount), 0);

        return {
          month,
          monthName: new Date(2024, i, 1).toLocaleDateString("pt-BR", { month: "short" }),
          budgeted,
          actual,
          variance: budgeted - actual,
          variancePercent: budgeted !== 0 ? ((budgeted - actual) / budgeted) * 100 : 0,
        };
      });

      return {
        version: { id: version.id, name: version.name, year: version.year },
        monthlyData,
        totals: {
          budgeted: monthlyData.reduce((sum, m) => sum + m.budgeted, 0),
          actual: monthlyData.reduce((sum, m) => sum + m.actual, 0),
          variance: monthlyData.reduce((sum, m) => sum + m.variance, 0),
        },
      };
    }),

  // ============================================================================
  // ALERTAS
  // ============================================================================

  listAlerts: tenantProcedure
    .input(
      z.object({
        isResolved: z.boolean().optional(),
        type: z.enum(["WARNING", "EXCEEDED", "BLOCKED"]).optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      return ctx.prisma.budgetAlert.findMany({
        where: {
          companyId: ctx.companyId,
          ...(input?.isResolved !== undefined && { isResolved: input.isResolved }),
          ...(input?.type && { type: input.type }),
        },
        include: {
          version: { select: { id: true, name: true, year: true } },
          account: { select: { id: true, code: true, name: true } },
          costCenter: { select: { id: true, code: true, name: true } },
          resolver: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      });
    }),

  resolveAlert: tenantProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.budgetAlert.update({
        where: { id: input.id },
        data: {
          isResolved: true,
          resolvedBy: ctx.tenant.userId,
          resolvedAt: new Date(),
          notes: input.notes,
        },
      });
    }),
});
