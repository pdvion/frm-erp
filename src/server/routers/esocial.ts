/**
 * Router tRPC para Módulo eSocial Completo
 *
 * Configuração, Rubricas, Eventos, Lotes, Dashboard
 */

import { z } from "zod";
import { createTRPCRouter, tenantProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { ESocialService, EVENT_DEFINITIONS, getEventTypeName } from "../services/esocial";
import type { ESocialEventType, GroupType } from "../services/esocial";

const eventTypeEnum = z.enum([
  "S_1000", "S_1005", "S_1010", "S_1020",
  "S_1200", "S_1210", "S_1260", "S_1270", "S_1280",
  "S_1298", "S_1299",
  "S_2190", "S_2200", "S_2205", "S_2206",
  "S_2230", "S_2231", "S_2240", "S_2298", "S_2299",
  "S_2300", "S_2306", "S_2399",
  "S_2400", "S_2405", "S_2410", "S_2416", "S_2418", "S_2420",
  "S_3000", "S_3500",
  "S_5001", "S_5002", "S_5003", "S_5011", "S_5012", "S_5013",
]);

const eventStatusEnum = z.enum([
  "DRAFT", "VALIDATED", "QUEUED", "SENT",
  "ACCEPTED", "REJECTED", "CANCELLED", "EXCLUDED",
]);

const groupTypeEnum = z.enum(["TABLES", "NON_PERIODIC", "PERIODIC"]);

export const esocialRouter = createTRPCRouter({
  // ==========================================================================
  // CONFIGURAÇÃO
  // ==========================================================================

  getConfig: tenantProcedure
    .query(async ({ ctx }) => {
      const companyId = ctx.tenant.companyId!;
      const service = new ESocialService(ctx.prisma);
      const config = await service.getConfig(companyId);
      if (!config) return null;
      // Redact certificate path
      return {
        ...config,
        certificatePath: config.certificatePath ? "••••••••" : null,
      };
    }),

  upsertConfig: tenantProcedure
    .input(z.object({
      environment: z.enum(["PRODUCTION", "RESTRICTED"]).optional(),
      employerType: z.number().int().min(1).max(9).optional(),
      softwareId: z.string().optional(),
      softwareName: z.string().optional(),
      certificatePath: z.string().optional(),
      certificateExpiry: z.coerce.date().optional(),
      autoGenerate: z.boolean().optional(),
      autoSend: z.boolean().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.tenant.companyId!;
      const service = new ESocialService(ctx.prisma);
      return service.upsertConfig(companyId, input);
    }),

  // ==========================================================================
  // RUBRICAS
  // ==========================================================================

  listRubrics: tenantProcedure
    .input(z.object({
      type: z.enum(["EARNING", "DEDUCTION", "INFORMATIVE"]).optional(),
      isActive: z.boolean().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const companyId = ctx.tenant.companyId!;
      const service = new ESocialService(ctx.prisma);
      return service.listRubrics(companyId, input);
    }),

  createRubric: tenantProcedure
    .input(z.object({
      code: z.string().min(1).max(30),
      name: z.string().min(1).max(200),
      type: z.enum(["EARNING", "DEDUCTION", "INFORMATIVE"]),
      incidenceINSS: z.enum(["NORMAL", "EXEMPT", "SUSPENDED", "NOT_APPLICABLE"]).optional(),
      incidenceIRRF: z.enum(["NORMAL", "EXEMPT", "SUSPENDED", "NOT_APPLICABLE"]).optional(),
      incidenceFGTS: z.enum(["NORMAL", "EXEMPT", "SUSPENDED", "NOT_APPLICABLE"]).optional(),
      incidenceSindical: z.enum(["NORMAL", "EXEMPT", "SUSPENDED", "NOT_APPLICABLE"]).optional(),
      natureCode: z.string().optional(),
      description: z.string().optional(),
      startDate: z.coerce.date(),
      endDate: z.coerce.date().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.tenant.companyId!;
      const service = new ESocialService(ctx.prisma);
      return service.createRubric(companyId, input);
    }),

  updateRubric: tenantProcedure
    .input(z.object({
      id: z.string().uuid(),
      name: z.string().min(1).max(200).optional(),
      incidenceINSS: z.enum(["NORMAL", "EXEMPT", "SUSPENDED", "NOT_APPLICABLE"]).optional(),
      incidenceIRRF: z.enum(["NORMAL", "EXEMPT", "SUSPENDED", "NOT_APPLICABLE"]).optional(),
      incidenceFGTS: z.enum(["NORMAL", "EXEMPT", "SUSPENDED", "NOT_APPLICABLE"]).optional(),
      incidenceSindical: z.enum(["NORMAL", "EXEMPT", "SUSPENDED", "NOT_APPLICABLE"]).optional(),
      natureCode: z.string().optional(),
      description: z.string().optional(),
      endDate: z.coerce.date().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.tenant.companyId!;
      const service = new ESocialService(ctx.prisma);
      const { id, ...data } = input;
      return service.updateRubric(id, companyId, data);
    }),

  // ==========================================================================
  // EVENTOS
  // ==========================================================================

  listEvents: tenantProcedure
    .input(z.object({
      status: eventStatusEnum.optional(),
      eventType: eventTypeEnum.optional(),
      year: z.number().int().min(2020).max(2100).optional(),
      month: z.number().int().min(1).max(12).optional(),
      employeeId: z.string().uuid().optional(),
      batchId: z.string().uuid().optional(),
      limit: z.number().int().min(1).max(100).default(50),
      offset: z.number().int().min(0).default(0),
    }).optional())
    .query(async ({ ctx, input }) => {
      const companyId = ctx.tenant.companyId!;
      const service = new ESocialService(ctx.prisma);
      return service.listEvents(companyId, input ?? undefined);
    }),

  getEvent: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const companyId = ctx.tenant.companyId!;
      const service = new ESocialService(ctx.prisma);
      const event = await service.getEvent(input.id, companyId);
      if (!event) throw new TRPCError({ code: "NOT_FOUND", message: "Evento não encontrado" });
      return event;
    }),

  generateEvents: tenantProcedure
    .input(z.object({
      year: z.number().int().min(2020).max(2100),
      month: z.number().int().min(1).max(12),
      eventTypes: z.array(eventTypeEnum).optional(),
      employeeIds: z.array(z.string().uuid()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.tenant.companyId!;
      const service = new ESocialService(ctx.prisma);
      return service.generateEvents({
        companyId,
        year: input.year,
        month: input.month,
        eventTypes: input.eventTypes as ESocialEventType[] | undefined,
        employeeIds: input.employeeIds,
      });
    }),

  validateEvent: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.tenant.companyId!;
      const service = new ESocialService(ctx.prisma);
      return service.validateEvent(input.id, companyId);
    }),

  excludeEvent: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.tenant.companyId!;
      const service = new ESocialService(ctx.prisma);
      return service.excludeEvent(input.id, companyId);
    }),

  // ==========================================================================
  // LOTES
  // ==========================================================================

  listBatches: tenantProcedure
    .input(z.object({
      status: z.enum(["OPEN", "CLOSED", "SENDING", "SENT", "PROCESSED", "ERROR"]).optional(),
      groupType: groupTypeEnum.optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const companyId = ctx.tenant.companyId!;
      const service = new ESocialService(ctx.prisma);
      return service.listBatches(companyId, input ?? undefined);
    }),

  createBatch: tenantProcedure
    .input(z.object({
      groupType: groupTypeEnum,
    }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.tenant.companyId!;
      const service = new ESocialService(ctx.prisma);
      return service.createBatch(companyId, input.groupType as GroupType);
    }),

  addEventsToBatch: tenantProcedure
    .input(z.object({
      batchId: z.string().uuid(),
      eventIds: z.array(z.string().uuid()).min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.tenant.companyId!;
      const service = new ESocialService(ctx.prisma);
      const count = await service.addEventsToBatch(input.batchId, companyId, input.eventIds);
      return { added: count };
    }),

  closeBatch: tenantProcedure
    .input(z.object({ batchId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.tenant.companyId!;
      const service = new ESocialService(ctx.prisma);
      return service.closeBatch(input.batchId, companyId);
    }),

  sendBatch: tenantProcedure
    .input(z.object({ batchId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.tenant.companyId!;
      const service = new ESocialService(ctx.prisma);
      return service.sendBatch(input.batchId, companyId, ctx.tenant.userId ?? undefined);
    }),

  checkBatchResult: tenantProcedure
    .input(z.object({ batchId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.tenant.companyId!;
      const service = new ESocialService(ctx.prisma);
      return service.checkBatchResult(input.batchId, companyId);
    }),

  validateBatch: tenantProcedure
    .input(z.object({ batchId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.tenant.companyId!;
      const service = new ESocialService(ctx.prisma);
      return service.validateBatch(input.batchId, companyId);
    }),

  // ==========================================================================
  // DASHBOARD & REFERÊNCIA
  // ==========================================================================

  getDashboard: tenantProcedure
    .query(async ({ ctx }) => {
      const companyId = ctx.tenant.companyId!;
      const service = new ESocialService(ctx.prisma);
      return service.getDashboard(companyId);
    }),

  getEventDefinitions: tenantProcedure
    .query(() => {
      return EVENT_DEFINITIONS.map((d) => ({
        type: d.type,
        name: d.name,
        group: d.group,
        description: d.description,
        deadlineDays: d.deadlineDays,
        displayName: getEventTypeName(d.type),
      }));
    }),
});
