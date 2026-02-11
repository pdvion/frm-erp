import { z } from "zod";
import { createTRPCRouter, tenantProcedure } from "../trpc";
import { auditCreate, auditUpdate } from "../services/audit";
import { MaintenanceService, getNextMaintenanceDate } from "../services/maintenance";
import { TRPCError } from "@trpc/server";
import {
  MaintenanceFrequency, EquipmentCriticality, MaintenanceType,
  MaintenanceOrderStatus, MaintenancePriority, FailureCategory,
} from "@prisma/client";

const freqZ = z.nativeEnum(MaintenanceFrequency);
const critZ = z.nativeEnum(EquipmentCriticality);
const typeZ = z.nativeEnum(MaintenanceType);
const statusZ = z.nativeEnum(MaintenanceOrderStatus);
const prioZ = z.nativeEnum(MaintenancePriority);
const failCatZ = z.nativeEnum(FailureCategory);
const pageZ = z.object({ page: z.number().min(1).default(1), limit: z.number().min(1).max(100).default(20) });

export const maintenanceRouter = createTRPCRouter({
  listEquipment: tenantProcedure
    .input(z.object({ search: z.string().optional(), criticality: critZ.optional(),
      workCenterId: z.string().optional(), isActive: z.boolean().optional() }).merge(pageZ).optional())
    .query(async ({ ctx, input }) => {
      const { search, criticality, workCenterId, isActive, page = 1, limit = 20 } = input ?? {};
      const cid = ctx.tenant.companyId!;
      const w: Record<string, unknown> = { companyId: cid };
      if (search) w.OR = [{ name: { contains: search, mode: "insensitive" } }, { code: { contains: search, mode: "insensitive" } }];
      if (criticality) w.criticality = criticality;
      if (workCenterId) w.workCenterId = workCenterId;
      if (isActive !== undefined) w.isActive = isActive;
      const [items, total] = await Promise.all([
        ctx.prisma.maintenanceEquipment.findMany({ where: w, include: { workCenter: true, parent: true }, orderBy: { code: "asc" }, skip: (page - 1) * limit, take: limit }),
        ctx.prisma.maintenanceEquipment.count({ where: w })]);
      return { items, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
    }),

  getEquipment: tenantProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    return ctx.prisma.maintenanceEquipment.findFirst({ where: { id: input.id, companyId: ctx.tenant.companyId! },
      include: { workCenter: true, fixedAsset: true, parent: true, children: true, maintenancePlans: { where: { isActive: true } } } });
  }),

  createEquipment: tenantProcedure
    .input(z.object({ code: z.string().min(1), name: z.string().min(1), description: z.string().optional(),
      manufacturer: z.string().optional(), model: z.string().optional(), serialNumber: z.string().optional(),
      installDate: z.coerce.date().optional(), warrantyExpiry: z.coerce.date().optional(),
      criticality: critZ.default("B"), location: z.string().optional(), workCenterId: z.string().optional(),
      fixedAssetId: z.string().optional(), parentId: z.string().optional(), notes: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const cid = ctx.tenant.companyId!;
      const r = await ctx.prisma.maintenanceEquipment.create({ data: { companyId: cid, ...input } });
      await auditCreate("MaintenanceEquipment", r, r.code, { userId: ctx.tenant.userId ?? undefined, companyId: cid });
      return r;
    }),

  updateEquipment: tenantProcedure
    .input(z.object({ id: z.string(), name: z.string().optional(), description: z.string().nullable().optional(),
      manufacturer: z.string().nullable().optional(), model: z.string().nullable().optional(),
      criticality: critZ.optional(), location: z.string().nullable().optional(),
      workCenterId: z.string().nullable().optional(), operatingHours: z.number().min(0).optional(),
      isActive: z.boolean().optional(), notes: z.string().nullable().optional() }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input; const cid = ctx.tenant.companyId!;
      const old = await ctx.prisma.maintenanceEquipment.findFirst({ where: { id, companyId: cid } });
      if (!old) throw new Error("Equipamento não encontrado");
      const r = await ctx.prisma.maintenanceEquipment.update({ where: { id }, data });
      await auditUpdate("MaintenanceEquipment", id, r.code, old, r, { userId: ctx.tenant.userId ?? undefined, companyId: cid });
      return r;
    }),

  // PLANOS
  listPlans: tenantProcedure
    .input(z.object({ equipmentId: z.string().optional(), type: z.enum(["PREVENTIVE","PREDICTIVE"]).optional(),
      isActive: z.boolean().optional() }).merge(pageZ).optional())
    .query(async ({ ctx, input }) => {
      const { equipmentId, type, isActive, page = 1, limit = 20 } = input ?? {};
      const cid = ctx.tenant.companyId!;
      const w: Record<string, unknown> = { companyId: cid };
      if (equipmentId) w.equipmentId = equipmentId;
      if (type) w.type = type;
      if (isActive !== undefined) w.isActive = isActive;
      const [items, total] = await Promise.all([
        ctx.prisma.maintenancePlan.findMany({ where: w, include: { equipment: true }, orderBy: { nextDueDate: "asc" }, skip: (page - 1) * limit, take: limit }),
        ctx.prisma.maintenancePlan.count({ where: w })]);
      return { items, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
    }),

  createPlan: tenantProcedure
    .input(z.object({ code: z.string().min(1), name: z.string().min(1), description: z.string().optional(),
      equipmentId: z.string(), type: z.enum(["PREVENTIVE","PREDICTIVE"]).default("PREVENTIVE"),
      frequency: freqZ, frequencyValue: z.number().min(1).default(1), triggerHours: z.number().optional(),
      estimatedDuration: z.number().default(60), assignedTeam: z.string().optional(), notes: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const cid = ctx.tenant.companyId!;
      const eq = await ctx.prisma.maintenanceEquipment.findFirst({ where: { id: input.equipmentId, companyId: cid } });
      if (!eq) throw new TRPCError({ code: "BAD_REQUEST", message: "Equipamento não encontrado para este tenant" });
      const nextDueDate = getNextMaintenanceDate(new Date(), input.frequency, input.frequencyValue);
      const r = await ctx.prisma.maintenancePlan.create({ data: { companyId: cid, nextDueDate, ...input } });
      await auditCreate("MaintenancePlan", r, r.code, { userId: ctx.tenant.userId ?? undefined, companyId: cid });
      return r;
    }),

  updatePlan: tenantProcedure
    .input(z.object({ id: z.string(), name: z.string().optional(), description: z.string().nullable().optional(),
      frequency: freqZ.optional(), frequencyValue: z.number().min(1).optional(),
      estimatedDuration: z.number().optional(), isActive: z.boolean().optional(), notes: z.string().nullable().optional() }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input; const cid = ctx.tenant.companyId!;
      const old = await ctx.prisma.maintenancePlan.findFirst({ where: { id, companyId: cid } });
      if (!old) throw new TRPCError({ code: "NOT_FOUND", message: "Plano não encontrado" });
      const updateData: Record<string, unknown> = { ...data };
      const freqChanged = (input.frequency && input.frequency !== old.frequency) ||
        (input.frequencyValue && input.frequencyValue !== old.frequencyValue);
      if (freqChanged) {
        const freq = input.frequency ?? old.frequency;
        const freqVal = input.frequencyValue ?? old.frequencyValue ?? 1;
        const baseDate = old.lastExecutedAt ?? old.createdAt;
        updateData.nextDueDate = getNextMaintenanceDate(baseDate, freq, freqVal);
      }
      const r = await ctx.prisma.maintenancePlan.update({ where: { id }, data: updateData });
      await auditUpdate("MaintenancePlan", id, r.code, old, r, { userId: ctx.tenant.userId ?? undefined, companyId: cid });
      return r;
    }),

  generateOrders: tenantProcedure.mutation(async ({ ctx }) => {
    const svc = new MaintenanceService(ctx.prisma);
    return { generated: await svc.generateOrdersFromPlans(ctx.tenant.companyId!) };
  }),

  // ORDENS DE SERVIÇO
  listOrders: tenantProcedure
    .input(z.object({ search: z.string().optional(), equipmentId: z.string().optional(),
      status: statusZ.optional(), type: typeZ.optional(), priority: prioZ.optional(),
      assignedTo: z.string().optional() }).merge(pageZ).optional())
    .query(async ({ ctx, input }) => {
      const { search, equipmentId, status, type, priority, assignedTo, page = 1, limit = 20 } = input ?? {};
      const cid = ctx.tenant.companyId!;
      const w: Record<string, unknown> = { companyId: cid };
      if (search) w.OR = [{ title: { contains: search, mode: "insensitive" } }];
      if (equipmentId) w.equipmentId = equipmentId;
      if (status) w.status = status;
      if (type) w.type = type;
      if (priority) w.priority = priority;
      if (assignedTo) w.assignedTo = assignedTo;
      const [items, total] = await Promise.all([
        ctx.prisma.maintenanceOrder.findMany({ where: w, include: { equipment: true, assignedToUser: true },
          orderBy: [{ priority: "asc" }, { createdAt: "desc" }], skip: (page - 1) * limit, take: limit }),
        ctx.prisma.maintenanceOrder.count({ where: w })]);
      return { items, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
    }),

  getOrder: tenantProcedure.input(z.object({ id: z.string() })).query(async ({ ctx, input }) => {
    return ctx.prisma.maintenanceOrder.findFirst({ where: { id: input.id, companyId: ctx.tenant.companyId! },
      include: { equipment: true, plan: true, failureCode: true, requestedByUser: true, assignedToUser: true,
        parts: { include: { material: true } }, labor: { include: { employee: true } },
        checklist: { orderBy: { sequence: "asc" } } } });
  }),

  createOrder: tenantProcedure
    .input(z.object({ equipmentId: z.string(), type: typeZ, priority: prioZ.default("NORMAL"),
      title: z.string().min(1), description: z.string().optional(), failureDescription: z.string().optional(),
      failureCodeId: z.string().optional(), assignedTo: z.string().optional(),
      plannedStart: z.coerce.date().optional(), plannedEnd: z.coerce.date().optional(),
      estimatedDuration: z.number().optional(), notes: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const cid = ctx.tenant.companyId!;
      const eq = await ctx.prisma.maintenanceEquipment.findFirst({ where: { id: input.equipmentId, companyId: cid } });
      if (!eq) throw new TRPCError({ code: "BAD_REQUEST", message: "Equipamento não encontrado" });
      if (input.failureCodeId) {
        const fc = await ctx.prisma.failureCode.findFirst({ where: { id: input.failureCodeId, companyId: cid } });
        if (!fc) throw new TRPCError({ code: "BAD_REQUEST", message: "Código de falha não encontrado" });
      }
      if (input.assignedTo) {
        const u = await ctx.prisma.user.findFirst({ where: { id: input.assignedTo, companyId: cid } });
        if (!u) throw new TRPCError({ code: "BAD_REQUEST", message: "Técnico não encontrado" });
      }
      const svc = new MaintenanceService(ctx.prisma);
      const r = await svc.createOrder(cid, { ...input, requestedBy: ctx.tenant.userId });
      await auditCreate("MaintenanceOrder", r, String(r.code), { userId: ctx.tenant.userId ?? undefined, companyId: cid });
      return r;
    }),

  startOrder: tenantProcedure.input(z.object({ id: z.string() })).mutation(async ({ ctx, input }) => {
    const svc = new MaintenanceService(ctx.prisma);
    return svc.startOrder(input.id);
  }),

  completeOrder: tenantProcedure
    .input(z.object({ id: z.string(), solution: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const svc = new MaintenanceService(ctx.prisma);
      return svc.completeOrder(input.id, input.solution, ctx.tenant.userId ?? undefined);
    }),

  cancelOrder: tenantProcedure
    .input(z.object({ id: z.string(), reason: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const svc = new MaintenanceService(ctx.prisma);
      return svc.cancelOrder(input.id, input.reason, ctx.tenant.userId ?? undefined);
    }),

  // PEÇAS E MÃO DE OBRA
  addPart: tenantProcedure
    .input(z.object({ orderId: z.string(), materialId: z.string(), quantity: z.number().min(0.01),
      unitCost: z.number().min(0), notes: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const cid = ctx.tenant.companyId!;
      const ord = await ctx.prisma.maintenanceOrder.findFirst({ where: { id: input.orderId, companyId: cid } });
      if (!ord) throw new TRPCError({ code: "FORBIDDEN", message: "Ordem não pertence a este tenant" });
      const totalCost = input.quantity * input.unitCost;
      return ctx.prisma.maintenanceOrderPart.create({ data: { ...input, totalCost } });
    }),

  addLabor: tenantProcedure
    .input(z.object({ orderId: z.string(), employeeId: z.string().optional(),
      techName: z.string().optional(), startTime: z.coerce.date(),
      endTime: z.coerce.date().optional(), hours: z.number().min(0).default(0),
      hourlyRate: z.number().min(0).default(0), notes: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const cid = ctx.tenant.companyId!;
      const ord = await ctx.prisma.maintenanceOrder.findFirst({ where: { id: input.orderId, companyId: cid } });
      if (!ord) throw new TRPCError({ code: "FORBIDDEN", message: "Ordem não pertence a este tenant" });
      if (input.employeeId) {
        const emp = await ctx.prisma.employee.findFirst({ where: { id: input.employeeId, companyId: cid } });
        if (!emp) throw new TRPCError({ code: "BAD_REQUEST", message: "Funcionário não encontrado" });
      }
      const totalCost = Number(input.hours) * Number(input.hourlyRate);
      return ctx.prisma.maintenanceOrderLabor.create({
        data: {
          orderId: input.orderId,
          employeeId: input.employeeId ?? null,
          techName: input.techName ?? null,
          startTime: input.startTime,
          endTime: input.endTime ?? null,
          hours: input.hours,
          hourlyRate: input.hourlyRate,
          totalCost,
          notes: input.notes ?? null,
        },
      });
    }),

  // CHECKLIST
  updateChecklist: tenantProcedure
    .input(z.object({ id: z.string(), isCompleted: z.boolean(), result: z.string().nullable().optional(),
      notes: z.string().nullable().optional() }))
    .mutation(async ({ ctx, input }) => {
      const cid = ctx.tenant.companyId!;
      const cl = await ctx.prisma.maintenanceChecklist.findFirst({
        where: { id: input.id, order: { companyId: cid } },
      });
      if (!cl) throw new TRPCError({ code: "FORBIDDEN", message: "Checklist não pertence a este tenant" });
      const { id, ...data } = input;
      return ctx.prisma.maintenanceChecklist.update({ where: { id },
        data: { ...data, completedAt: input.isCompleted ? new Date() : null, completedBy: input.isCompleted ? ctx.tenant.userId : null } });
    }),

  // CÓDIGOS DE FALHA
  listFailureCodes: tenantProcedure
    .input(z.object({ category: failCatZ.optional() }).optional())
    .query(async ({ ctx, input }) => {
      const cid = ctx.tenant.companyId!;
      const w: Record<string, unknown> = { companyId: cid, isActive: true };
      if (input?.category) w.category = input.category;
      return ctx.prisma.failureCode.findMany({ where: w, orderBy: { code: "asc" } });
    }),

  createFailureCode: tenantProcedure
    .input(z.object({ code: z.string().min(1), name: z.string().min(1), description: z.string().optional(),
      category: failCatZ,
      severity: z.number().min(1).max(5).default(3) }))
    .mutation(async ({ ctx, input }) => {
      const cid = ctx.tenant.companyId!;
      return ctx.prisma.failureCode.create({
        data: {
          companyId: cid,
          code: input.code,
          name: input.name,
          description: input.description ?? null,
          category: input.category,
          severity: input.severity,
        },
      });
    }),

  // KPIs
  getEquipmentKPIs: tenantProcedure.input(z.object({ equipmentId: z.string() })).query(async ({ ctx, input }) => {
    const svc = new MaintenanceService(ctx.prisma);
    return svc.getEquipmentKPIs(ctx.tenant.companyId!, input.equipmentId);
  }),
});
