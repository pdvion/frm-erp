import { z } from "zod";
import { createTRPCRouter, tenantProcedure } from "../trpc";
import { prisma } from "@/lib/prisma";
import { TRPCError } from "@trpc/server";

const inspectionTypeEnum = z.enum(["RECEIVING", "IN_PROCESS", "FINAL", "AUDIT"]);
const inspectionStatusEnum = z.enum(["PENDING", "IN_PROGRESS", "APPROVED", "REJECTED", "PARTIAL"]);
const inspectionResultEnum = z.enum(["PENDING", "PASS", "FAIL", "CONDITIONAL"]);
const ncTypeEnum = z.enum(["INTERNAL", "SUPPLIER", "CUSTOMER", "PROCESS"]);
const ncSeverityEnum = z.enum(["MINOR", "MAJOR", "CRITICAL"]);
const ncStatusEnum = z.enum(["OPEN", "ANALYZING", "ACTION", "VERIFICATION", "CLOSED"]);

export const qualityRouter = createTRPCRouter({
  // ==================== INSPEÇÕES ====================

  listInspections: tenantProcedure
    .input(
      z.object({
        search: z.string().optional(),
        type: inspectionTypeEnum.optional(),
        status: inspectionStatusEnum.optional(),
        materialId: z.string().optional(),
        page: z.number().default(1),
        limit: z.number().default(20),
      })
    )
    .query(async ({ input, ctx }) => {
      const { search, type, status, materialId, page, limit } = input;
      const skip = (page - 1) * limit;

      const where: Record<string, unknown> = {
        companyId: ctx.companyId,
      };

      if (search) {
        where.OR = [
          { code: { equals: parseInt(search) || -1 } },
          { lotNumber: { contains: search, mode: "insensitive" as const } },
          { material: { description: { contains: search, mode: "insensitive" as const } } },
        ];
      }

      if (type) where.type = type;
      if (status) where.status = status;
      if (materialId) where.materialId = materialId;

      const [inspections, total] = await Promise.all([
        prisma.qualityInspection.findMany({
          where,
          include: {
            material: { select: { id: true, code: true, description: true } },
            productionOrder: { select: { id: true, code: true } },
            _count: { select: { items: true, nonConformities: true } },
          },
          orderBy: { inspectionDate: "desc" },
          skip,
          take: limit,
        }),
        prisma.qualityInspection.count({ where }),
      ]);

      return {
        inspections,
        total,
        page,
        pages: Math.ceil(total / limit),
      };
    }),

  getInspection: tenantProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const inspection = await prisma.qualityInspection.findFirst({
        where: { id: input.id, companyId: ctx.companyId },
        include: {
          material: true,
          productionOrder: { select: { id: true, code: true, status: true } },
          items: { orderBy: { createdAt: "asc" } },
          nonConformities: { orderBy: { createdAt: "desc" } },
        },
      });

      if (!inspection) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Inspeção não encontrada" });
      }

      return inspection;
    }),

  createInspection: tenantProcedure
    .input(
      z.object({
        type: inspectionTypeEnum,
        materialId: z.string().optional(),
        productionOrderId: z.string().optional(),
        receivedInvoiceId: z.string().optional(),
        lotNumber: z.string().optional(),
        quantity: z.number().positive(),
        sampleSize: z.number().optional(),
        notes: z.string().optional(),
        items: z.array(
          z.object({
            characteristic: z.string(),
            specification: z.string().optional(),
            toleranceMin: z.number().optional(),
            toleranceMax: z.number().optional(),
          })
        ).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const lastInspection = await prisma.qualityInspection.findFirst({
        where: { companyId: ctx.companyId },
        orderBy: { code: "desc" },
        select: { code: true },
      });

      const nextCode = (lastInspection?.code ?? 0) + 1;

      const inspection = await prisma.qualityInspection.create({
        data: {
          code: nextCode,
          companyId: ctx.companyId,
          type: input.type,
          status: "PENDING",
          materialId: input.materialId,
          productionOrderId: input.productionOrderId,
          receivedInvoiceId: input.receivedInvoiceId,
          lotNumber: input.lotNumber,
          quantity: input.quantity,
          sampleSize: input.sampleSize,
          inspectorId: ctx.tenant.userId,
          notes: input.notes,
          items: input.items ? {
            create: input.items.map((item) => ({
              characteristic: item.characteristic,
              specification: item.specification,
              toleranceMin: item.toleranceMin,
              toleranceMax: item.toleranceMax,
              result: "PENDING",
            })),
          } : undefined,
        },
        include: { items: true },
      });

      return inspection;
    }),

  // Registrar resultado de item de inspeção
  recordItemResult: tenantProcedure
    .input(
      z.object({
        itemId: z.string(),
        measuredValue: z.number().optional(),
        result: inspectionResultEnum,
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const item = await prisma.qualityInspectionItem.findFirst({
        where: { id: input.itemId },
        include: { inspection: true },
      });

      if (!item) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Item não encontrado" });
      }

      // Verificar se a inspeção pertence à empresa
      if (item.inspection.companyId !== ctx.companyId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
      }

      const updated = await prisma.qualityInspectionItem.update({
        where: { id: input.itemId },
        data: {
          measuredValue: input.measuredValue,
          result: input.result,
          notes: input.notes,
        },
      });

      // Atualizar status da inspeção se necessário
      const allItems = await prisma.qualityInspectionItem.findMany({
        where: { inspectionId: item.inspectionId },
      });

      const pendingItems = allItems.filter((i: { result: string }) => i.result === "PENDING");
      if (pendingItems.length === 0 && item.inspection.status === "PENDING") {
        await prisma.qualityInspection.update({
          where: { id: item.inspectionId },
          data: { status: "IN_PROGRESS" },
        });
      }

      return updated;
    }),

  // Finalizar inspeção
  completeInspection: tenantProcedure
    .input(
      z.object({
        id: z.string(),
        approvedQty: z.number().min(0),
        rejectedQty: z.number().min(0),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const inspection = await prisma.qualityInspection.findFirst({
        where: { id: input.id, companyId: ctx.companyId },
        include: { items: true },
      });

      if (!inspection) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Inspeção não encontrada" });
      }

      if (inspection.status === "APPROVED" || inspection.status === "REJECTED") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Inspeção já finalizada" });
      }

      // Determinar status final
      let finalStatus: "APPROVED" | "REJECTED" | "PARTIAL";
      if (input.rejectedQty === 0) {
        finalStatus = "APPROVED";
      } else if (input.approvedQty === 0) {
        finalStatus = "REJECTED";
      } else {
        finalStatus = "PARTIAL";
      }

      const updated = await prisma.qualityInspection.update({
        where: { id: input.id },
        data: {
          status: finalStatus,
          approvedQty: input.approvedQty,
          rejectedQty: input.rejectedQty,
          completedAt: new Date(),
          notes: input.notes ? `${inspection.notes || ""}\n${input.notes}` : inspection.notes,
        },
      });

      return updated;
    }),

  // ==================== NÃO-CONFORMIDADES ====================

  listNonConformities: tenantProcedure
    .input(
      z.object({
        search: z.string().optional(),
        type: ncTypeEnum.optional(),
        status: ncStatusEnum.optional(),
        severity: ncSeverityEnum.optional(),
        page: z.number().default(1),
        limit: z.number().default(20),
      })
    )
    .query(async ({ input, ctx }) => {
      const { search, type, status, severity, page, limit } = input;
      const skip = (page - 1) * limit;

      const where: Record<string, unknown> = {
        companyId: ctx.companyId,
      };

      if (search) {
        where.OR = [
          { code: { equals: parseInt(search) || -1 } },
          { description: { contains: search, mode: "insensitive" as const } },
          { lotNumber: { contains: search, mode: "insensitive" as const } },
        ];
      }

      if (type) where.type = type;
      if (status) where.status = status;
      if (severity) where.severity = severity;

      const [nonConformities, total] = await Promise.all([
        prisma.nonConformity.findMany({
          where,
          include: {
            material: { select: { id: true, code: true, description: true } },
            productionOrder: { select: { id: true, code: true } },
            inspection: { select: { id: true, code: true } },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        prisma.nonConformity.count({ where }),
      ]);

      return {
        nonConformities,
        total,
        page,
        pages: Math.ceil(total / limit),
      };
    }),

  getNonConformity: tenantProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const nc = await prisma.nonConformity.findFirst({
        where: { id: input.id, companyId: ctx.companyId },
        include: {
          material: true,
          productionOrder: { select: { id: true, code: true, status: true } },
          inspection: { select: { id: true, code: true, type: true } },
        },
      });

      if (!nc) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Não-conformidade não encontrada" });
      }

      return nc;
    }),

  createNonConformity: tenantProcedure
    .input(
      z.object({
        type: ncTypeEnum,
        severity: ncSeverityEnum,
        inspectionId: z.string().optional(),
        productionOrderId: z.string().optional(),
        materialId: z.string().optional(),
        lotNumber: z.string().optional(),
        quantity: z.number().optional(),
        description: z.string().min(10, "Descrição deve ter pelo menos 10 caracteres"),
        immediateAction: z.string().optional(),
        responsibleId: z.string().optional(),
        dueDate: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const lastNC = await prisma.nonConformity.findFirst({
        where: { companyId: ctx.companyId },
        orderBy: { code: "desc" },
        select: { code: true },
      });

      const nextCode = (lastNC?.code ?? 0) + 1;

      const nc = await prisma.nonConformity.create({
        data: {
          code: nextCode,
          companyId: ctx.companyId,
          type: input.type,
          status: "OPEN",
          severity: input.severity,
          inspectionId: input.inspectionId,
          productionOrderId: input.productionOrderId,
          materialId: input.materialId,
          lotNumber: input.lotNumber,
          quantity: input.quantity ?? 0,
          description: input.description,
          immediateAction: input.immediateAction,
          responsibleId: input.responsibleId,
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
          createdBy: ctx.tenant.userId,
        },
      });

      return nc;
    }),

  updateNonConformity: tenantProcedure
    .input(
      z.object({
        id: z.string(),
        status: ncStatusEnum.optional(),
        rootCause: z.string().optional(),
        correctiveAction: z.string().optional(),
        preventiveAction: z.string().optional(),
        responsibleId: z.string().optional(),
        dueDate: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;

      const existing = await prisma.nonConformity.findFirst({
        where: { id, companyId: ctx.companyId },
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Não-conformidade não encontrada" });
      }

      const nc = await prisma.nonConformity.update({
        where: { id },
        data: {
          status: data.status,
          rootCause: data.rootCause,
          correctiveAction: data.correctiveAction,
          preventiveAction: data.preventiveAction,
          responsibleId: data.responsibleId,
          dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        },
      });

      return nc;
    }),

  closeNonConformity: tenantProcedure
    .input(
      z.object({
        id: z.string(),
        preventiveAction: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const nc = await prisma.nonConformity.findFirst({
        where: { id: input.id, companyId: ctx.companyId },
      });

      if (!nc) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Não-conformidade não encontrada" });
      }

      if (nc.status === "CLOSED") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Não-conformidade já está fechada" });
      }

      // Verificar se tem ação corretiva
      if (!nc.correctiveAction) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Ação corretiva é obrigatória para fechar" });
      }

      return prisma.nonConformity.update({
        where: { id: input.id },
        data: {
          status: "CLOSED",
          preventiveAction: input.preventiveAction,
          closedAt: new Date(),
          closedBy: ctx.tenant.userId,
        },
      });
    }),

  // ==================== DASHBOARD ====================

  dashboard: tenantProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalInspections,
      pendingInspections,
      monthlyInspections,
      approvalRate,
      openNCs,
      criticalNCs,
      byType,
      bySeverity,
    ] = await Promise.all([
      prisma.qualityInspection.count({ where: { companyId: ctx.companyId } }),
      prisma.qualityInspection.count({
        where: { companyId: ctx.companyId, status: "PENDING" },
      }),
      prisma.qualityInspection.count({
        where: {
          companyId: ctx.companyId,
          inspectionDate: { gte: startOfMonth },
        },
      }),
      (async () => {
        const approved = await prisma.qualityInspection.count({
          where: { companyId: ctx.companyId, status: "APPROVED" },
        });
        const total = await prisma.qualityInspection.count({
          where: {
            companyId: ctx.companyId,
            status: { in: ["APPROVED", "REJECTED", "PARTIAL"] },
          },
        });
        return total > 0 ? (approved / total) * 100 : 100;
      })(),
      prisma.nonConformity.count({
        where: { companyId: ctx.companyId, status: { not: "CLOSED" } },
      }),
      prisma.nonConformity.count({
        where: { companyId: ctx.companyId, severity: "CRITICAL", status: { not: "CLOSED" } },
      }),
      prisma.nonConformity.groupBy({
        by: ["type"],
        where: { companyId: ctx.companyId },
        _count: true,
      }),
      prisma.nonConformity.groupBy({
        by: ["severity"],
        where: { companyId: ctx.companyId, status: { not: "CLOSED" } },
        _count: true,
      }),
    ]);

    return {
      totalInspections,
      pendingInspections,
      monthlyInspections,
      approvalRate,
      openNCs,
      criticalNCs,
      byType: byType.map((t: { type: string; _count: number }) => ({ type: t.type, count: t._count })),
      bySeverity: bySeverity.map((s: { severity: string; _count: number }) => ({ severity: s.severity, count: s._count })),
    };
  }),
});
