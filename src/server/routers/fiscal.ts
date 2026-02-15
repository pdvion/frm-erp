/**
 * Router tRPC para Módulo Fiscal Completo
 *
 * @see VIO-1077 - Fiscal Completo (eSocial, EFD-Reinf, NFS-e, DIFAL/ST, Bloco K)
 */

import { z } from "zod";
import { createTRPCRouter, tenantProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { FiscalService } from "../services/fiscal";
import { encryptOptional } from "@/lib/encryption";

export const fiscalRouter = createTRPCRouter({
  // ==========================================================================
  // OBRIGAÇÕES ACESSÓRIAS
  // ==========================================================================

  listObligations: tenantProcedure
    .input(z.object({
      year: z.number().int().min(2020).max(2100),
      month: z.number().int().min(1).max(12),
      status: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const companyId = ctx.tenant.companyId!;
      const where: Record<string, unknown> = { companyId, year: input.year, month: input.month };
      if (input.status) where.status = input.status;

      return ctx.prisma.fiscalObligation.findMany({
        where,
        orderBy: { dueDate: "asc" },
      });
    }),

  generateObligations: tenantProcedure
    .input(z.object({
      year: z.number().int().min(2020).max(2100),
      month: z.number().int().min(1).max(12),
      codes: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.tenant.companyId!;
      const service = new FiscalService(ctx.prisma);
      return service.generateObligations(companyId, input.year, input.month, input.codes);
    }),

  updateObligationStatus: tenantProcedure
    .input(z.object({
      id: z.string().uuid(),
      status: z.enum(["PENDING", "GENERATING", "GENERATED", "TRANSMITTED", "ACCEPTED", "REJECTED", "RECTIFIED"]),
      receiptNumber: z.string().optional(),
      fileName: z.string().optional(),
      fileContent: z.string().optional(),
      errorMessage: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.tenant.companyId!;
      const service = new FiscalService(ctx.prisma);
      const { id, status, ...extra } = input;
      return service.updateObligationStatus(id, companyId, status, extra);
    }),

  // ==========================================================================
  // APURAÇÃO DE IMPOSTOS
  // ==========================================================================

  listApurations: tenantProcedure
    .input(z.object({
      year: z.number().int().min(2020).max(2100),
      month: z.number().int().min(1).max(12),
      taxType: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const companyId = ctx.tenant.companyId!;
      const where: Record<string, unknown> = { companyId, year: input.year, month: input.month };
      if (input.taxType) where.taxType = input.taxType;

      return ctx.prisma.taxApuration.findMany({
        where,
        include: { items: true },
        orderBy: { taxType: "asc" },
      });
    }),

  getOrCreateApuration: tenantProcedure
    .input(z.object({
      taxType: z.string(),
      year: z.number().int().min(2020).max(2100),
      month: z.number().int().min(1).max(12),
    }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.tenant.companyId!;
      const service = new FiscalService(ctx.prisma);
      return service.getOrCreateApuration(companyId, input.taxType, input.year, input.month);
    }),

  addApurationItem: tenantProcedure
    .input(z.object({
      apurationId: z.string().uuid(),
      documentType: z.string(),
      documentId: z.string().uuid().optional(),
      documentNumber: z.string().optional(),
      cfop: z.string().optional(),
      baseValue: z.number(),
      rate: z.number(),
      taxValue: z.number(),
      nature: z.enum(["CREDIT", "DEBIT"]),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const service = new FiscalService(ctx.prisma);
      const companyId = ctx.tenant.companyId!;
      return service.addApurationItem(companyId, input.apurationId, input);
    }),

  closeApuration: tenantProcedure
    .input(z.object({
      taxType: z.string(),
      year: z.number().int().min(2020).max(2100),
      month: z.number().int().min(1).max(12),
    }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.tenant.companyId!;
      const service = new FiscalService(ctx.prisma);
      return service.closeApuration(companyId, input.taxType, input.year, input.month);
    }),

  getApurationSummary: tenantProcedure
    .input(z.object({
      year: z.number().int().min(2020).max(2100),
      month: z.number().int().min(1).max(12),
    }))
    .query(async ({ ctx, input }) => {
      const companyId = ctx.tenant.companyId!;
      const service = new FiscalService(ctx.prisma);
      return service.getApurationSummary(companyId, input.year, input.month);
    }),

  // ==========================================================================
  // DIFAL / ICMS-ST
  // ==========================================================================

  calculateDifal: tenantProcedure
    .input(z.object({
      documentType: z.string(),
      documentId: z.string().uuid().optional(),
      documentNumber: z.string().optional(),
      ufOrigem: z.string().length(2),
      ufDestino: z.string().length(2),
      productValue: z.number().positive(),
      icmsOrigemRate: z.number().min(0).max(100),
      icmsDestinoRate: z.number().min(0).max(100),
      fcpRate: z.number().min(0).max(10).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.tenant.companyId!;
      const service = new FiscalService(ctx.prisma);
      return service.calculateAndSaveDifal(companyId, input);
    }),

  listDifalCalculations: tenantProcedure
    .input(z.object({
      ufOrigem: z.string().length(2).optional(),
      ufDestino: z.string().length(2).optional(),
      limit: z.number().int().min(1).max(100).default(50),
    }))
    .query(async ({ ctx, input }) => {
      const companyId = ctx.tenant.companyId!;
      const where: Record<string, unknown> = { companyId };
      if (input.ufOrigem) where.ufOrigem = input.ufOrigem;
      if (input.ufDestino) where.ufDestino = input.ufDestino;

      return ctx.prisma.difalCalculation.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: input.limit,
      });
    }),

  // ==========================================================================
  // NFS-e
  // ==========================================================================

  getNfseConfig: tenantProcedure
    .query(async ({ ctx }) => {
      const companyId = ctx.tenant.companyId!;
      const config = await ctx.prisma.nfseConfig.findUnique({ where: { companyId } });
      if (!config) return null;
      // Redact sensitive credentials — never expose plaintext to client
      return {
        ...config,
        password: config.password ? "••••••••" : null,
        token: config.token ? "••••••••" : null,
      };
    }),

  upsertNfseConfig: tenantProcedure
    .input(z.object({
      providerCode: z.string(),
      municipalityCode: z.string(),
      environment: z.enum(["HOMOLOGATION", "PRODUCTION"]).default("HOMOLOGATION"),
      certificatePath: z.string().optional(),
      login: z.string().optional(),
      password: z.string().optional(),
      token: z.string().optional(),
      cnae: z.string().optional(),
      serviceCode: z.string().optional(),
      issRate: z.number().min(0).max(100).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.tenant.companyId!;
      const data = {
        ...input,
        password: encryptOptional(input.password) ?? undefined,
        token: encryptOptional(input.token) ?? undefined,
        issRate: input.issRate ?? undefined,
      };
      return ctx.prisma.nfseConfig.upsert({
        where: { companyId },
        create: { companyId, ...data, issRate: input.issRate ?? null },
        update: data,
      });
    }),

  listNfse: tenantProcedure
    .input(z.object({
      status: z.string().optional(),
      competenceDateFrom: z.date().optional(),
      competenceDateTo: z.date().optional(),
      customerId: z.string().uuid().optional(),
      limit: z.number().int().min(1).max(100).default(50),
      offset: z.number().int().min(0).default(0),
    }))
    .query(async ({ ctx, input }) => {
      const companyId = ctx.tenant.companyId!;
      const where: Record<string, unknown> = { companyId };
      if (input.status) where.status = input.status;
      if (input.customerId) where.customerId = input.customerId;
      if (input.competenceDateFrom || input.competenceDateTo) {
        where.competenceDate = {
          ...(input.competenceDateFrom && { gte: input.competenceDateFrom }),
          ...(input.competenceDateTo && { lte: input.competenceDateTo }),
        };
      }

      const [items, total] = await Promise.all([
        ctx.prisma.nfseIssued.findMany({
          where,
          include: { customer: { select: { id: true, companyName: true, cnpj: true } } },
          orderBy: { code: "desc" },
          take: input.limit,
          skip: input.offset,
        }),
        ctx.prisma.nfseIssued.count({ where }),
      ]);

      return { items, total };
    }),

  createNfse: tenantProcedure
    .input(z.object({
      customerId: z.string().uuid(),
      serviceCode: z.string(),
      cnae: z.string().optional(),
      description: z.string().min(1),
      competenceDate: z.date(),
      serviceValue: z.number().positive(),
      deductionValue: z.number().min(0).optional(),
      issRate: z.number().min(0).max(100),
      issWithheld: z.boolean().optional(),
      pisRate: z.number().min(0).max(100).optional(),
      cofinsRate: z.number().min(0).max(100).optional(),
      irRate: z.number().min(0).max(100).optional(),
      csllRate: z.number().min(0).max(100).optional(),
      inssRate: z.number().min(0).max(100).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.tenant.companyId!;
      const service = new FiscalService(ctx.prisma);
      return service.createNfse(companyId, {
        ...input,
        createdBy: ctx.tenant.userId ?? undefined,
      });
    }),

  getNfse: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const companyId = ctx.tenant.companyId!;
      const nfse = await ctx.prisma.nfseIssued.findFirst({
        where: { id: input.id, companyId },
        include: { customer: true },
      });
      if (!nfse) throw new TRPCError({ code: "NOT_FOUND", message: "NFS-e não encontrada" });
      return nfse;
    }),

  cancelNfse: tenantProcedure
    .input(z.object({
      id: z.string().uuid(),
      reason: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.tenant.companyId!;

      return ctx.prisma.$transaction(async (tx: Record<string, unknown>) => {
        const nfse = await (tx as unknown as typeof ctx.prisma).nfseIssued.findFirst({
          where: { id: input.id, companyId },
        });
        if (!nfse) throw new TRPCError({ code: "NOT_FOUND", message: "NFS-e não encontrada" });
        if (nfse.status === "CANCELLED") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "NFS-e já está cancelada" });
        }

        return (tx as unknown as typeof ctx.prisma).nfseIssued.update({
          where: { id: input.id },
          data: {
            status: "CANCELLED",
            cancelledAt: new Date(),
            cancelReason: input.reason,
          },
        });
      });
    }),

  // ==========================================================================
  // BLOCO K
  // ==========================================================================

  generateBlocoK: tenantProcedure
    .input(z.object({
      year: z.number().int().min(2020).max(2100),
      month: z.number().int().min(1).max(12),
    }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.tenant.companyId!;
      const service = new FiscalService(ctx.prisma);
      return service.generateBlocoKRecords(companyId, input.year, input.month);
    }),

  listBlocoKRecords: tenantProcedure
    .input(z.object({
      year: z.number().int().min(2020).max(2100),
      month: z.number().int().min(1).max(12),
      recordType: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const companyId = ctx.tenant.companyId!;
      const where: Record<string, unknown> = { companyId, year: input.year, month: input.month };
      if (input.recordType) where.recordType = input.recordType;

      return ctx.prisma.blocoKRecord.findMany({
        where,
        orderBy: [{ recordType: "asc" }, { movementDate: "asc" }],
      });
    }),

  // ==========================================================================
  // CALENDÁRIO FISCAL
  // ==========================================================================

  getFiscalCalendar: tenantProcedure
    .input(z.object({
      year: z.number().int().min(2020).max(2100),
      month: z.number().int().min(1).max(12),
    }))
    .query(async ({ ctx, input }) => {
      const companyId = ctx.tenant.companyId!;
      const service = new FiscalService(ctx.prisma);
      return service.getFiscalCalendar(companyId, input.year, input.month);
    }),
});
