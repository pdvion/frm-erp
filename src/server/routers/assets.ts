/**
 * Router de Patrimônio / Ativo Fixo
 * CRUD de ativos, depreciação, baixa, transferência e relatórios.
 *
 * @see VIO-1075
 */

import { z } from "zod";
import { createTRPCRouter, tenantProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { AssetService } from "../services/asset";

const assetCategoryEnum = z.enum([
  "MACHINERY",
  "VEHICLES",
  "FURNITURE",
  "IT_EQUIPMENT",
  "BUILDINGS",
  "LAND",
  "OTHER",
]);

const depreciationMethodEnum = z.enum([
  "STRAIGHT_LINE",
  "DECLINING_BALANCE",
  "SUM_OF_YEARS",
]);

// ==========================================================================
// ROUTER
// ==========================================================================

export const assetsRouter = createTRPCRouter({
  // ========================================================================
  // ATIVOS — CRUD
  // ========================================================================

  listAssets: tenantProcedure
    .input(
      z.object({
        category: assetCategoryEnum.optional(),
        status: z.enum(["ACTIVE", "DISPOSED", "TRANSFERRED", "FULLY_DEPRECIATED"]).optional(),
        search: z.string().optional(),
      }).optional(),
    )
    .query(async ({ ctx, input }) => {
      const companyId = ctx.tenant.companyId!;
      const where: Record<string, unknown> = { companyId };
      if (input?.category) where.category = input.category;
      if (input?.status) where.status = input.status;
      if (input?.search) {
        where.OR = [
          { name: { contains: input.search, mode: "insensitive" } },
          { serialNumber: { contains: input.search, mode: "insensitive" } },
        ];
      }

      return ctx.prisma.fixedAsset.findMany({
        where,
        orderBy: { code: "asc" },
        include: {
          responsible: { select: { id: true, name: true } },
          costCenter: { select: { id: true, code: true, name: true } },
        },
      });
    }),

  getAsset: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const companyId = ctx.tenant.companyId!;
      const asset = await ctx.prisma.fixedAsset.findFirst({
        where: { id: input.id, companyId },
        include: {
          responsible: { select: { id: true, name: true } },
          costCenter: { select: { id: true, code: true, name: true } },
          depreciations: { orderBy: { period: "desc" }, take: 24 },
          movements: { orderBy: { date: "desc" }, take: 50 },
        },
      });

      if (!asset) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Ativo não encontrado" });
      }

      return asset;
    }),

  createAsset: tenantProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        description: z.string().optional().nullable(),
        category: assetCategoryEnum,
        acquisitionDate: z.coerce.date(),
        acquisitionValue: z.number().positive(),
        residualValue: z.number().min(0).optional(),
        usefulLifeMonths: z.number().int().positive(),
        depreciationMethod: depreciationMethodEnum.optional(),
        location: z.string().max(255).optional().nullable(),
        responsibleId: z.string().uuid().optional().nullable(),
        costCenterId: z.string().uuid().optional().nullable(),
        supplier: z.string().max(255).optional().nullable(),
        invoiceNumber: z.string().max(50).optional().nullable(),
        serialNumber: z.string().max(100).optional().nullable(),
        warrantyExpiry: z.coerce.date().optional().nullable(),
        notes: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const svc = new AssetService(ctx.prisma);
      return svc.createAsset({
        ...input,
        companyId: ctx.tenant.companyId!,
        createdBy: ctx.tenant.userId ?? null,
      });
    }),

  updateAsset: tenantProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(255).optional(),
        description: z.string().optional().nullable(),
        location: z.string().max(255).optional().nullable(),
        responsibleId: z.string().uuid().optional().nullable(),
        costCenterId: z.string().uuid().optional().nullable(),
        notes: z.string().optional().nullable(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const companyId = ctx.tenant.companyId!;
      const asset = await ctx.prisma.fixedAsset.findFirst({
        where: { id, companyId },
      });

      if (!asset) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Ativo não encontrado" });
      }

      return ctx.prisma.fixedAsset.update({ where: { id }, data });
    }),

  // ========================================================================
  // DEPRECIAÇÃO
  // ========================================================================

  processDepreciation: tenantProcedure
    .input(
      z.object({
        period: z.coerce.date(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const svc = new AssetService(ctx.prisma);
      return svc.processMonthlyDepreciation(ctx.tenant.companyId!, input.period);
    }),

  getDepreciationHistory: tenantProcedure
    .input(
      z.object({
        assetId: z.string().uuid(),
        limit: z.number().int().min(1).max(120).optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const companyId = ctx.tenant.companyId!;
      const asset = await ctx.prisma.fixedAsset.findFirst({
        where: { id: input.assetId, companyId },
        select: { id: true },
      });

      if (!asset) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Ativo não encontrado" });
      }

      return ctx.prisma.assetDepreciation.findMany({
        where: { assetId: input.assetId },
        orderBy: { period: "desc" },
        take: input.limit ?? 24,
      });
    }),

  // ========================================================================
  // BAIXA
  // ========================================================================

  disposeAsset: tenantProcedure
    .input(
      z.object({
        assetId: z.string().uuid(),
        disposalDate: z.coerce.date(),
        disposalValue: z.number().min(0),
        disposalReason: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.tenant.companyId!;
      const asset = await ctx.prisma.fixedAsset.findFirst({
        where: { id: input.assetId, companyId },
        select: { id: true },
      });

      if (!asset) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Ativo não encontrado" });
      }

      const svc = new AssetService(ctx.prisma);
      return svc.disposeAsset({
        ...input,
        companyId,
        userId: ctx.tenant.userId ?? null,
      });
    }),

  // ========================================================================
  // TRANSFERÊNCIA
  // ========================================================================

  transferAsset: tenantProcedure
    .input(
      z.object({
        assetId: z.string().uuid(),
        date: z.coerce.date(),
        toLocation: z.string().max(255).optional().nullable(),
        toCostCenterId: z.string().uuid().optional().nullable(),
        description: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.tenant.companyId!;
      const asset = await ctx.prisma.fixedAsset.findFirst({
        where: { id: input.assetId, companyId },
        select: { id: true },
      });

      if (!asset) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Ativo não encontrado" });
      }

      const svc = new AssetService(ctx.prisma);
      return svc.transferAsset({
        ...input,
        companyId,
        userId: ctx.tenant.userId ?? null,
      });
    }),

  // ========================================================================
  // RELATÓRIOS
  // ========================================================================

  getSummary: tenantProcedure.query(async ({ ctx }) => {
    const svc = new AssetService(ctx.prisma);
    return svc.getSummary(ctx.tenant.companyId!);
  }),

  getMovements: tenantProcedure
    .input(
      z.object({
        assetId: z.string().uuid().optional(),
        type: z.enum(["ACQUISITION", "DEPRECIATION", "DISPOSAL", "TRANSFER", "REVALUATION", "IMPAIRMENT"]).optional(),
        startDate: z.coerce.date().optional(),
        endDate: z.coerce.date().optional(),
      }).optional(),
    )
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {};

      if (input?.assetId) {
        // Verify asset belongs to tenant
        const companyId = ctx.tenant.companyId!;
        const asset = await ctx.prisma.fixedAsset.findFirst({
          where: { id: input.assetId, companyId },
          select: { id: true },
        });
        if (!asset) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Ativo não encontrado" });
        }
        where.assetId = input.assetId;
      } else {
        where.asset = { companyId: ctx.tenant.companyId! };
      }

      if (input?.type) where.type = input.type;
      if (input?.startDate || input?.endDate) {
        where.date = {};
        if (input?.startDate) (where.date as Record<string, unknown>).gte = input.startDate;
        if (input?.endDate) (where.date as Record<string, unknown>).lte = input.endDate;
      }

      return ctx.prisma.assetMovement.findMany({
        where,
        orderBy: { date: "desc" },
        take: 200,
        include: {
          asset: { select: { id: true, code: true, name: true, category: true } },
        },
      });
    }),
});
