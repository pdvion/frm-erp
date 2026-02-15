/**
 * EDI Router
 * VIO-1126 — Troca eletrônica com montadoras/varejo
 */

import { z } from "zod";
import { createTRPCRouter, tenantProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { EdiService } from "../services/edi";

export const ediRouter = createTRPCRouter({
  // ─── Dashboard ────────────────────────────────────────────────────────

  stats: tenantProcedure.query(async ({ ctx }) => {
    const svc = new EdiService(ctx.prisma);
    return svc.getStats(ctx.companyId);
  }),

  // ─── Partners ─────────────────────────────────────────────────────────

  listPartners: tenantProcedure
    .input(z.object({
      status: z.string().optional(),
      search: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const svc = new EdiService(ctx.prisma);
      return svc.listPartners(ctx.companyId, input);
    }),

  getPartner: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const svc = new EdiService(ctx.prisma);
      const partner = await svc.getPartner(input.id, ctx.companyId);
      if (!partner) throw new TRPCError({ code: "NOT_FOUND", message: "Parceiro EDI não encontrado" });
      return {
        ...partner,
        sftpPassword: partner.sftpPassword ? "••••••••" : null,
      };
    }),

  createPartner: tenantProcedure
    .input(z.object({
      code: z.string().min(1).max(50),
      name: z.string().min(1),
      cnpj: z.string().optional(),
      format: z.enum(["EDIFACT", "FLAT_FILE", "XML", "JSON"]).optional(),
      sftpHost: z.string().optional(),
      sftpPort: z.number().optional(),
      sftpUser: z.string().optional(),
      sftpPassword: z.string().optional(),
      sftpInboundPath: z.string().optional(),
      sftpOutboundPath: z.string().optional(),
      webhookUrl: z.string().url().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const svc = new EdiService(ctx.prisma);
      return svc.createPartner(ctx.companyId, input);
    }),

  updatePartner: tenantProcedure
    .input(z.object({
      id: z.string().uuid(),
      name: z.string().optional(),
      cnpj: z.string().optional(),
      format: z.enum(["EDIFACT", "FLAT_FILE", "XML", "JSON"]).optional(),
      status: z.enum(["ACTIVE", "INACTIVE", "TESTING"]).optional(),
      sftpHost: z.string().optional(),
      sftpPort: z.number().optional(),
      sftpUser: z.string().optional(),
      sftpPassword: z.string().optional(),
      sftpInboundPath: z.string().optional(),
      sftpOutboundPath: z.string().optional(),
      webhookUrl: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const svc = new EdiService(ctx.prisma);
      return svc.updatePartner(id, ctx.companyId, data);
    }),

  // ─── Messages ─────────────────────────────────────────────────────────

  listMessages: tenantProcedure
    .input(z.object({
      partnerId: z.string().uuid().optional(),
      messageType: z.string().optional(),
      direction: z.enum(["INBOUND", "OUTBOUND"]).optional(),
      status: z.string().optional(),
      limit: z.number().min(1).max(100).optional(),
      offset: z.number().min(0).optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const svc = new EdiService(ctx.prisma);
      return svc.listMessages(ctx.companyId, input);
    }),

  getMessage: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const svc = new EdiService(ctx.prisma);
      const msg = await svc.getMessage(input.id, ctx.companyId);
      if (!msg) throw new TRPCError({ code: "NOT_FOUND", message: "Mensagem EDI não encontrada" });
      return msg;
    }),

  createMessage: tenantProcedure
    .input(z.object({
      partnerId: z.string().uuid(),
      messageType: z.enum(["ORDERS", "ORDRSP", "DESADV", "INVOIC", "RECADV", "PRICAT", "INVRPT", "OTHER"]),
      direction: z.enum(["INBOUND", "OUTBOUND"]),
      referenceNumber: z.string().optional(),
      fileName: z.string().optional(),
      rawContent: z.string().optional(),
      relatedOrderId: z.string().uuid().optional(),
      relatedInvoiceId: z.string().uuid().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const svc = new EdiService(ctx.prisma);
      return svc.createMessage(ctx.companyId, input);
    }),

  processMessage: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const svc = new EdiService(ctx.prisma);
      return svc.processMessage(input.id, ctx.companyId);
    }),

  retryMessage: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const svc = new EdiService(ctx.prisma);
      return svc.retryMessage(input.id, ctx.companyId);
    }),

  // ─── Mappings ─────────────────────────────────────────────────────────

  listMappings: tenantProcedure
    .input(z.object({ partnerId: z.string().uuid().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const svc = new EdiService(ctx.prisma);
      return svc.listMappings(ctx.companyId, input?.partnerId);
    }),

  createMapping: tenantProcedure
    .input(z.object({
      partnerId: z.string().uuid(),
      messageType: z.enum(["ORDERS", "ORDRSP", "DESADV", "INVOIC", "RECADV", "PRICAT", "INVRPT", "OTHER"]),
      direction: z.enum(["INBOUND", "OUTBOUND"]),
      name: z.string().min(1),
      description: z.string().optional(),
      fieldMappings: z.array(z.object({
        sourceField: z.string(),
        targetField: z.string(),
        transform: z.enum(["uppercase", "lowercase", "trim", "number", "date", "cnpj", "none"]).optional(),
        defaultValue: z.string().optional(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      const svc = new EdiService(ctx.prisma);
      return svc.createMapping(ctx.companyId, input);
    }),

  updateMapping: tenantProcedure
    .input(z.object({
      id: z.string().uuid(),
      name: z.string().optional(),
      description: z.string().optional(),
      fieldMappings: z.array(z.object({
        sourceField: z.string(),
        targetField: z.string(),
        transform: z.enum(["uppercase", "lowercase", "trim", "number", "date", "cnpj", "none"]).optional(),
        defaultValue: z.string().optional(),
      })).optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const svc = new EdiService(ctx.prisma);
      return svc.updateMapping(id, ctx.companyId, data);
    }),
});
