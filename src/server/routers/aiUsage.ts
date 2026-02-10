import { z } from "zod";
import { createTRPCRouter, tenantProcedure } from "../trpc";
import { Prisma } from "@prisma/client";

export const aiUsageRouter = createTRPCRouter({
  // Resumo do período
  getSummary: tenantProcedure
    .input(
      z.object({
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const now = new Date();
      const startDate = input?.startDate ?? new Date(now.getFullYear(), now.getMonth(), 1);
      const endDate = input?.endDate ?? now;

      const filter: Prisma.AiUsageLogWhereInput = {
        companyId: ctx.companyId,
        createdAt: { gte: startDate, lte: endDate },
      };

      // Período anterior para comparação
      const periodDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const prevStartDate = new Date(startDate.getTime() - periodDays * 24 * 60 * 60 * 1000);
      const prevEndDate = new Date(startDate.getTime() - 1);

      const prevFilter: Prisma.AiUsageLogWhereInput = {
        companyId: ctx.companyId,
        createdAt: { gte: prevStartDate, lte: prevEndDate },
      };

      const [current, previous] = await Promise.all([
        ctx.prisma.aiUsageLog.aggregate({
          where: filter,
          _count: true,
          _sum: {
            totalTokens: true,
            estimatedCost: true,
          },
          _avg: {
            latencyMs: true,
          },
        }),
        ctx.prisma.aiUsageLog.aggregate({
          where: prevFilter,
          _count: true,
          _sum: {
            totalTokens: true,
            estimatedCost: true,
          },
        }),
      ]);

      const successCount = await ctx.prisma.aiUsageLog.count({
        where: { ...filter, success: true },
      });

      const totalCalls = current._count;
      const successRate = totalCalls > 0 ? Math.round((successCount / totalCalls) * 100) : 0;

      const calcChange = (curr: number, prev: number) => {
        if (prev === 0) return curr > 0 ? 100 : 0;
        return Math.round(((curr - prev) / prev) * 100);
      };

      return {
        totalCalls,
        totalTokens: current._sum.totalTokens ?? 0,
        totalCost: current._sum.estimatedCost ?? 0,
        avgLatency: Math.round(current._avg.latencyMs ?? 0),
        successRate,
        callsChange: calcChange(totalCalls, previous._count),
        tokensChange: calcChange(current._sum.totalTokens ?? 0, previous._sum.totalTokens ?? 0),
        costChange: calcChange(Number(current._sum.estimatedCost) ?? 0, Number(previous._sum.estimatedCost) ?? 0),
      };
    }),

  // Uso por dia
  getDailyUsage: tenantProcedure
    .input(z.object({ days: z.number().int().min(1).max(90).default(30) }).optional())
    .query(async ({ ctx, input }) => {
      const days = input?.days ?? 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const logs = await ctx.prisma.aiUsageLog.findMany({
        where: {
          companyId: ctx.companyId,
          createdAt: { gte: startDate },
        },
        select: {
          createdAt: true,
          totalTokens: true,
          estimatedCost: true,
        },
        orderBy: { createdAt: "asc" },
      });

      // Agrupar por dia
      const dailyMap = new Map<string, { calls: number; tokens: number; cost: number }>();

      for (const log of logs) {
        const dateKey = log.createdAt.toISOString().split("T")[0];
        const existing = dailyMap.get(dateKey) ?? { calls: 0, tokens: 0, cost: 0 };
        dailyMap.set(dateKey, {
          calls: existing.calls + 1,
          tokens: existing.tokens + log.totalTokens,
          cost: Number(existing.cost) + Number(log.estimatedCost),
        });
      }

      return Array.from(dailyMap.entries()).map(([date, data]) => ({
        date,
        ...data,
      }));
    }),

  // Breakdown por provider/modelo/tarefa
  getBreakdown: tenantProcedure
    .input(
      z.object({
        groupBy: z.enum(["provider", "model", "taskType"]),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const now = new Date();
      const startDate = input.startDate ?? new Date(now.getFullYear(), now.getMonth(), 1);
      const endDate = input.endDate ?? now;

      const groupByField = input.groupBy === "taskType" ? "task_type" : input.groupBy;

      const result = await ctx.prisma.$queryRaw<
        Array<{ name: string; calls: bigint; tokens: bigint; cost: number }>
      >`
        SELECT 
          ${Prisma.raw(groupByField)} as name,
          COUNT(*) as calls,
          SUM(total_tokens) as tokens,
          SUM(estimated_cost) as cost
        FROM ai_usage_logs
        WHERE company_id = ${ctx.companyId}::uuid
          AND created_at >= ${startDate}
          AND created_at <= ${endDate}
        GROUP BY ${Prisma.raw(groupByField)}
        ORDER BY calls DESC
      `;

      return result.map((r) => ({
        name: r.name,
        calls: Number(r.calls),
        tokens: Number(r.tokens),
        cost: r.cost,
      }));
    }),

  // Histórico detalhado
  list: tenantProcedure
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(100).default(50),
        provider: z.string().optional(),
        taskType: z.string().optional(),
        success: z.boolean().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const page = input?.page ?? 1;
      const limit = input?.limit ?? 50;
      const skip = (page - 1) * limit;

      const where: Prisma.AiUsageLogWhereInput = {
        companyId: ctx.companyId,
        ...(input?.provider && { provider: input.provider }),
        ...(input?.taskType && { taskType: input.taskType }),
        ...(input?.success !== undefined && { success: input.success }),
      };

      const [logs, total] = await Promise.all([
        ctx.prisma.aiUsageLog.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        ctx.prisma.aiUsageLog.count({ where }),
      ]);

      return {
        logs,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      };
    }),

  // Registrar uso (chamado internamente pelos serviços de IA)
  log: tenantProcedure
    .input(
      z.object({
        provider: z.string(),
        model: z.string(),
        taskType: z.string(),
        inputTokens: z.number().int(),
        outputTokens: z.number().int(),
        latencyMs: z.number().int(),
        estimatedCost: z.number(),
        success: z.boolean(),
        errorMessage: z.string().optional(),
        wasFallback: z.boolean().optional(),
        fallbackFrom: z.string().optional(),
        requestId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.aiUsageLog.create({
        data: {
          companyId: ctx.companyId,
          provider: input.provider,
          model: input.model,
          taskType: input.taskType,
          inputTokens: input.inputTokens,
          outputTokens: input.outputTokens,
          totalTokens: input.inputTokens + input.outputTokens,
          latencyMs: input.latencyMs,
          estimatedCost: input.estimatedCost,
          success: input.success,
          errorMessage: input.errorMessage,
          wasFallback: input.wasFallback ?? false,
          fallbackFrom: input.fallbackFrom,
          requestId: input.requestId,
          userId: ctx.tenant?.userId ?? null,
        },
      });
    }),
});
