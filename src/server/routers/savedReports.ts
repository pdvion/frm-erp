import { z } from "zod";
import { createTRPCRouter, tenantProcedure } from "../trpc";
import type { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";

function getUserId(ctx: { tenant: { userId: string | null } }): string {
  const userId = ctx.tenant.userId;
  if (!userId) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Usuário não autenticado" });
  }
  return userId;
}

export const savedReportsRouter = createTRPCRouter({
  list: tenantProcedure
    .input(z.object({ reportType: z.string().optional(), onlyFavorites: z.boolean().optional(), includeShared: z.boolean().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const userId = getUserId(ctx);
      const { reportType, onlyFavorites, includeShared } = input || {};
      const where: Prisma.SavedReportWhereInput = {
        companyId: ctx.companyId,
        OR: [{ userId }, ...(includeShared ? [{ isShared: true }] : [])],
        ...(reportType && { reportType }),
        ...(onlyFavorites && { isFavorite: true }),
      };
      const reports = await ctx.prisma.savedReport.findMany({
        where,
        orderBy: [{ isFavorite: "desc" }, { updatedAt: "desc" }],
        include: { user: { select: { name: true, email: true } } },
      });
      return reports.map((r) => ({
        id: r.id, reportType: r.reportType, name: r.name, description: r.description,
        filters: r.filters, isDefault: r.isDefault, isShared: r.isShared, isFavorite: r.isFavorite,
        isOwner: r.userId === userId, createdBy: r.user.name, createdAt: r.createdAt, updatedAt: r.updatedAt,
      }));
    }),

  getById: tenantProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = getUserId(ctx);
      const report = await ctx.prisma.savedReport.findFirst({
        where: { id: input.id, companyId: ctx.companyId, OR: [{ userId }, { isShared: true }] },
      });
      if (!report) throw new TRPCError({ code: "NOT_FOUND", message: "Relatório não encontrado" });
      return report;
    }),

  create: tenantProcedure
    .input(z.object({
      reportType: z.string(), name: z.string().min(1), description: z.string().optional(),
      filters: z.record(z.string(), z.unknown()), isDefault: z.boolean().optional(), isShared: z.boolean().optional(), isFavorite: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = getUserId(ctx);
      if (input.isDefault) {
        await ctx.prisma.savedReport.updateMany({
          where: { userId, companyId: ctx.companyId, reportType: input.reportType, isDefault: true },
          data: { isDefault: false },
        });
      }
      return ctx.prisma.savedReport.create({
        data: {
          userId, companyId: ctx.companyId, reportType: input.reportType, name: input.name,
          description: input.description ?? null, filters: input.filters as Prisma.InputJsonValue,
          isDefault: input.isDefault ?? false, isShared: input.isShared ?? false, isFavorite: input.isFavorite ?? false,
        },
      });
    }),

  update: tenantProcedure
    .input(z.object({
      id: z.string(), name: z.string().min(1).optional(), description: z.string().optional(),
      filters: z.record(z.string(), z.unknown()).optional(), isDefault: z.boolean().optional(), isShared: z.boolean().optional(), isFavorite: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = getUserId(ctx);
      const existing = await ctx.prisma.savedReport.findFirst({ where: { id: input.id, userId, companyId: ctx.companyId } });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Relatório não encontrado" });
      if (input.isDefault) {
        await ctx.prisma.savedReport.updateMany({
          where: { userId, companyId: ctx.companyId, reportType: existing.reportType, isDefault: true, id: { not: input.id } },
          data: { isDefault: false },
        });
      }
      return ctx.prisma.savedReport.update({
        where: { id: input.id },
        data: {
          ...(input.name && { name: input.name }),
          ...(input.description !== undefined && { description: input.description }),
          ...(input.filters && { filters: input.filters as Prisma.InputJsonValue }),
          ...(input.isDefault !== undefined && { isDefault: input.isDefault }),
          ...(input.isShared !== undefined && { isShared: input.isShared }),
          ...(input.isFavorite !== undefined && { isFavorite: input.isFavorite }),
        },
      });
    }),

  delete: tenantProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = getUserId(ctx);
      const existing = await ctx.prisma.savedReport.findFirst({ where: { id: input.id, userId, companyId: ctx.companyId } });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Relatório não encontrado" });
      await ctx.prisma.savedReport.delete({ where: { id: input.id } });
      return { success: true };
    }),

  toggleFavorite: tenantProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = getUserId(ctx);
      const existing = await ctx.prisma.savedReport.findFirst({ where: { id: input.id, userId, companyId: ctx.companyId } });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Relatório não encontrado" });
      return ctx.prisma.savedReport.update({ where: { id: input.id }, data: { isFavorite: !existing.isFavorite } });
    }),

  getDefault: tenantProcedure
    .input(z.object({ reportType: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = getUserId(ctx);
      return ctx.prisma.savedReport.findFirst({
        where: { userId, companyId: ctx.companyId, reportType: input.reportType, isDefault: true },
      });
    }),
});
