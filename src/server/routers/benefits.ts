import { z } from "zod";
import { createTRPCRouter, tenantProcedure } from "../trpc";
import { prisma } from "@/lib/prisma";
import { TRPCError } from "@trpc/server";
import { auditUpdate } from "../services/audit";

// Constants
const VT_DISCOUNT_PERCENTAGE = 0.06; // 6% desconto máximo de Vale Transporte
const MAX_PAGE_SIZE = 100;

const benefitCategoryEnum = z.enum([
  "TRANSPORT", "MEAL", "FOOD", "HEALTH", "DENTAL",
  "LIFE_INSURANCE", "PENSION", "EDUCATION", "CHILDCARE", "OTHER"
]);
const benefitStatusEnum = z.enum(["ACTIVE", "SUSPENDED", "CANCELLED"]);
const trainingStatusEnum = z.enum(["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "EXPIRED"]);

export const benefitsRouter = createTRPCRouter({
  // ==================== TIPOS DE BENEFÍCIO ====================

  listBenefitTypes: tenantProcedure
    .input(z.object({
      category: benefitCategoryEnum.optional(),
      includeInactive: z.boolean().default(false),
    }).optional())
    .query(async ({ input, ctx }) => {
      const where: Record<string, unknown> = {
        companyId: ctx.companyId,
      };
      if (input?.category) where.category = input.category;
      if (!input?.includeInactive) where.isActive = true;

      return prisma.benefitType.findMany({
        where,
        include: { _count: { select: { employeeBenefits: true } } },
        orderBy: { name: "asc" },
      });
    }),

  createBenefitType: tenantProcedure
    .input(z.object({
      code: z.string().min(1),
      name: z.string().min(1),
      description: z.string().optional(),
      category: benefitCategoryEnum,
      calculationType: z.enum(["FIXED", "PERCENTAGE", "PER_DAY", "PER_DEPENDENT"]).default("FIXED"),
      defaultValue: z.number().optional(),
      defaultPercentage: z.number().optional(),
      employeeDiscountPercent: z.number().optional(),
      isTaxable: z.boolean().default(false),
      affectsInss: z.boolean().default(false),
      affectsIrrf: z.boolean().default(false),
      affectsFgts: z.boolean().default(false),
    }))
    .mutation(async ({ input, ctx }) => {
      return prisma.benefitType.create({
        data: { ...input, companyId: ctx.companyId },
      });
    }),

  updateBenefitType: tenantProcedure
    .input(z.object({
      id: z.string().uuid(),
      name: z.string().optional(),
      description: z.string().optional(),
      defaultValue: z.number().optional(),
      defaultPercentage: z.number().optional(),
      employeeDiscountPercent: z.number().optional(),
      isTaxable: z.boolean().optional(),
      affectsInss: z.boolean().optional(),
      affectsIrrf: z.boolean().optional(),
      affectsFgts: z.boolean().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      
      // Validate tenant ownership
      const existing = await prisma.benefitType.findFirst({
        where: { id, companyId: ctx.companyId },
      });
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Tipo de benefício não encontrado" });
      }
      
      const updated = await prisma.benefitType.update({
        where: { id },
        data,
      });
      
      await auditUpdate("BenefitType", id, existing.code, existing, updated, {
        userId: ctx.tenant.userId ?? undefined,
        companyId: ctx.companyId,
      });
      return updated;
    }),

  // ==================== BENEFÍCIOS DO FUNCIONÁRIO ====================

  listEmployeeBenefits: tenantProcedure
    .input(z.object({
      employeeId: z.string().optional(),
      benefitTypeId: z.string().optional(),
      status: benefitStatusEnum.optional(),
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(MAX_PAGE_SIZE).default(20),
    }))
    .query(async ({ input, ctx }) => {
      const { employeeId, benefitTypeId, status, page, limit } = input;
      const skip = (page - 1) * limit;

      const where: Record<string, unknown> = {
        companyId: ctx.companyId,
      };
      if (employeeId) where.employeeId = employeeId;
      if (benefitTypeId) where.benefitTypeId = benefitTypeId;
      if (status) where.status = status;

      const [benefits, total] = await Promise.all([
        prisma.employeeBenefit.findMany({
          where,
          include: {
            employee: { select: { id: true, code: true, name: true } },
            benefitType: { select: { id: true, code: true, name: true, category: true } },
          },
          orderBy: { startDate: "desc" },
          skip,
          take: limit,
        }),
        prisma.employeeBenefit.count({ where }),
      ]);

      return { benefits, total, page, pages: Math.ceil(total / limit) };
    }),

  assignBenefit: tenantProcedure
    .input(z.object({
      employeeId: z.string(),
      benefitTypeId: z.string(),
      value: z.number().optional(),
      employeeDiscount: z.number().optional(),
      companyContribution: z.number().optional(),
      quantity: z.number().optional(),
      startDate: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Verificar se já existe benefício ativo do mesmo tipo
      const existing = await prisma.employeeBenefit.findFirst({
        where: {
          employeeId: input.employeeId,
          benefitTypeId: input.benefitTypeId,
          status: "ACTIVE",
        },
      });

      if (existing) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Funcionário já possui este benefício ativo",
        });
      }

      return prisma.employeeBenefit.create({
        data: {
          employeeId: input.employeeId,
          benefitTypeId: input.benefitTypeId,
          companyId: ctx.companyId,
          value: input.value ?? 0,
          employeeDiscount: input.employeeDiscount ?? 0,
          companyContribution: input.companyContribution ?? 0,
          quantity: input.quantity ?? 1,
          startDate: input.startDate ? new Date(input.startDate) : new Date(),
          notes: input.notes,
        },
        include: {
          employee: { select: { id: true, name: true } },
          benefitType: { select: { id: true, name: true } },
        },
      });
    }),

  updateEmployeeBenefit: tenantProcedure
    .input(z.object({
      id: z.string().uuid(),
      value: z.number().optional(),
      employeeDiscount: z.number().optional(),
      companyContribution: z.number().optional(),
      quantity: z.number().optional(),
      status: benefitStatusEnum.optional(),
      endDate: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, endDate, ...data } = input;
      
      // Validate tenant ownership
      const existing = await prisma.employeeBenefit.findFirst({
        where: { id, companyId: ctx.companyId },
      });
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Benefício não encontrado" });
      }
      
      const updated = await prisma.employeeBenefit.update({
        where: { id },
        data: {
          ...data,
          endDate: endDate ? new Date(endDate) : undefined,
        },
      });
      
      await auditUpdate("EmployeeBenefit", id, undefined, existing, updated, {
        userId: ctx.tenant.userId ?? undefined,
        companyId: ctx.companyId,
      });
      return updated;
    }),

  cancelBenefit: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      // Validate tenant ownership
      const existing = await prisma.employeeBenefit.findFirst({
        where: { id: input.id, companyId: ctx.companyId },
      });
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Benefício não encontrado" });
      }
      
      const updated = await prisma.employeeBenefit.update({
        where: { id: input.id },
        data: {
          status: "CANCELLED",
          endDate: new Date(),
        },
      });
      
      await auditUpdate("EmployeeBenefit", input.id, undefined, existing, updated, {
        userId: ctx.tenant.userId ?? undefined,
        companyId: ctx.companyId,
      });
      return updated;
    }),

  // ==================== VALE TRANSPORTE ====================

  listTransportVouchers: tenantProcedure
    .input(z.object({ employeeId: z.string() }))
    .query(async ({ input }) => {
      return prisma.transportVoucher.findMany({
        where: { employeeId: input.employeeId, isActive: true },
        orderBy: { lineName: "asc" },
      });
    }),

  addTransportVoucher: tenantProcedure
    .input(z.object({
      employeeId: z.string(),
      lineType: z.enum(["BUS", "METRO", "TRAIN", "FERRY", "OTHER"]).default("BUS"),
      lineName: z.string().min(1),
      fareValue: z.number().positive(),
      quantityPerDay: z.number().int().positive().default(2),
      workingDays: z.number().int().positive().default(22),
    }))
    .mutation(async ({ input, ctx }) => {
      return prisma.transportVoucher.create({
        data: { ...input, companyId: ctx.companyId },
      });
    }),

  updateTransportVoucher: tenantProcedure
    .input(z.object({
      id: z.string().uuid(),
      lineType: z.string().optional(),
      lineName: z.string().optional(),
      fareValue: z.number().optional(),
      quantityPerDay: z.number().optional(),
      workingDays: z.number().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      
      // Validate tenant ownership
      const existing = await prisma.transportVoucher.findFirst({
        where: { id, companyId: ctx.companyId },
      });
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Vale transporte não encontrado" });
      }
      
      return prisma.transportVoucher.update({ where: { id }, data });
    }),

  calculateTransportVoucher: tenantProcedure
    .input(z.object({ employeeId: z.string() }))
    .query(async ({ input }) => {
      const vouchers = await prisma.transportVoucher.findMany({
        where: { employeeId: input.employeeId, isActive: true },
      });

      const employee = await prisma.employee.findUnique({
        where: { id: input.employeeId },
        select: { salary: true },
      });

      const totalMonthly = vouchers.reduce((sum: number, v: { fareValue: number; quantityPerDay: number; workingDays: number }) => {
        return sum + (v.fareValue * v.quantityPerDay * v.workingDays);
      }, 0);

      // Desconto máximo de 6% do salário (CLT)
      const maxDiscount = (employee?.salary || 0) * VT_DISCOUNT_PERCENTAGE;
      const employeeDiscount = Math.min(totalMonthly, maxDiscount);
      const companyContribution = totalMonthly - employeeDiscount;

      return {
        vouchers,
        totalMonthly,
        employeeDiscount,
        companyContribution,
        discountPercentage: employee?.salary ? (employeeDiscount / employee.salary) * 100 : 0,
      };
    }),

  // ==================== TREINAMENTOS ====================

  listTrainings: tenantProcedure
    .input(z.object({
      search: z.string().optional(),
      category: z.string().optional(),
      isMandatory: z.boolean().optional(),
      includeInactive: z.boolean().default(false),
    }).optional())
    .query(async ({ input, ctx }) => {
      const where: Record<string, unknown> = {
        companyId: ctx.companyId,
      };
      if (input?.search) {
        where.OR = [
          { name: { contains: input.search, mode: "insensitive" as const } },
          { code: { contains: input.search, mode: "insensitive" as const } },
        ];
      }
      if (input?.category) where.category = input.category;
      if (input?.isMandatory !== undefined) where.isMandatory = input.isMandatory;
      if (!input?.includeInactive) where.isActive = true;

      return prisma.training.findMany({
        where,
        include: { _count: { select: { employeeTrainings: true } } },
        orderBy: { name: "asc" },
      });
    }),

  createTraining: tenantProcedure
    .input(z.object({
      code: z.string().min(1),
      name: z.string().min(1),
      description: z.string().optional(),
      category: z.string().optional(),
      durationHours: z.number().int().optional(),
      instructor: z.string().optional(),
      provider: z.string().optional(),
      cost: z.number().optional(),
      isMandatory: z.boolean().default(false),
      validityMonths: z.number().int().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      return prisma.training.create({
        data: { ...input, companyId: ctx.companyId },
      });
    }),

  // ==================== TREINAMENTOS DO FUNCIONÁRIO ====================

  listEmployeeTrainings: tenantProcedure
    .input(z.object({
      employeeId: z.string().optional(),
      trainingId: z.string().optional(),
      status: trainingStatusEnum.optional(),
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(MAX_PAGE_SIZE).default(20),
    }))
    .query(async ({ input, ctx }) => {
      const { employeeId, trainingId, status, page, limit } = input;
      const skip = (page - 1) * limit;

      const where: Record<string, unknown> = {
        companyId: ctx.companyId,
      };
      if (employeeId) where.employeeId = employeeId;
      if (trainingId) where.trainingId = trainingId;
      if (status) where.status = status;

      const [trainings, total] = await Promise.all([
        prisma.employeeTraining.findMany({
          where,
          include: {
            employee: { select: { id: true, code: true, name: true } },
            training: { select: { id: true, code: true, name: true, durationHours: true } },
          },
          orderBy: { scheduledDate: "desc" },
          skip,
          take: limit,
        }),
        prisma.employeeTraining.count({ where }),
      ]);

      return { trainings, total, page, pages: Math.ceil(total / limit) };
    }),

  scheduleTraining: tenantProcedure
    .input(z.object({
      employeeId: z.string(),
      trainingId: z.string(),
      scheduledDate: z.string(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const training = await prisma.training.findUnique({
        where: { id: input.trainingId },
        select: { validityMonths: true },
      });

      const scheduledDate = new Date(input.scheduledDate);
      let expirationDate: Date | null = null;

      if (training?.validityMonths) {
        expirationDate = new Date(scheduledDate);
        expirationDate.setMonth(expirationDate.getMonth() + training.validityMonths);
      }

      return prisma.employeeTraining.create({
        data: {
          employeeId: input.employeeId,
          trainingId: input.trainingId,
          companyId: ctx.companyId,
          scheduledDate,
          expirationDate,
          notes: input.notes,
        },
        include: {
          employee: { select: { id: true, name: true } },
          training: { select: { id: true, name: true } },
        },
      });
    }),

  completeTraining: tenantProcedure
    .input(z.object({
      id: z.string(),
      score: z.number().optional(),
      certificateUrl: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const training = await prisma.employeeTraining.findUnique({
        where: { id: input.id },
        include: { training: { select: { validityMonths: true } } },
      });

      const completionDate = new Date();
      let expirationDate: Date | null = null;

      if (training?.training?.validityMonths) {
        expirationDate = new Date(completionDate);
        expirationDate.setMonth(expirationDate.getMonth() + training.training.validityMonths);
      }

      return prisma.employeeTraining.update({
        where: { id: input.id },
        data: {
          status: "COMPLETED",
          completionDate,
          expirationDate,
          score: input.score,
          certificateUrl: input.certificateUrl,
          notes: input.notes,
        },
      });
    }),

  // ==================== MATRIZ DE POLIVALÊNCIA ====================

  listSkillMatrix: tenantProcedure
    .input(z.object({
      employeeId: z.string().optional(),
      category: z.string().optional(),
      minLevel: z.number().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const where: Record<string, unknown> = {
        companyId: ctx.companyId,
      };
      if (input?.employeeId) where.employeeId = input.employeeId;
      if (input?.category) where.category = input.category;
      if (input?.minLevel) where.level = { gte: input.minLevel };

      return prisma.skillMatrix.findMany({
        where,
        include: {
          employee: { select: { id: true, code: true, name: true } },
        },
        orderBy: [{ category: "asc" }, { skillName: "asc" }],
      });
    }),

  addSkill: tenantProcedure
    .input(z.object({
      employeeId: z.string(),
      skillName: z.string().min(1),
      category: z.string().optional(),
      level: z.number().int().min(0).max(4).default(0),
      maxLevel: z.number().int().default(4),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      return prisma.skillMatrix.create({
        data: { ...input, companyId: ctx.companyId },
      });
    }),

  updateSkillLevel: tenantProcedure
    .input(z.object({
      id: z.string().uuid(),
      level: z.number().int().min(0).max(4),
      certifiedAt: z.string().optional(),
      expirationDate: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, certifiedAt, expirationDate, ...data } = input;
      
      // Validate tenant ownership
      const existing = await prisma.skillMatrix.findFirst({
        where: { id, companyId: ctx.companyId },
      });
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Competência não encontrada" });
      }
      
      return prisma.skillMatrix.update({
        where: { id },
        data: {
          ...data,
          certifiedAt: certifiedAt ? new Date(certifiedAt) : undefined,
          certifiedBy: certifiedAt ? ctx.tenant.userId : undefined,
          expirationDate: expirationDate ? new Date(expirationDate) : undefined,
        },
      });
    }),

  getSkillMatrixSummary: tenantProcedure
    .input(z.object({ category: z.string().optional() }))
    .query(async ({ input, ctx }) => {
      const where: Record<string, unknown> = {
        companyId: ctx.companyId,
      };
      if (input?.category) where.category = input.category;

      const skills = await prisma.skillMatrix.groupBy({
        by: ["skillName", "category"],
        where,
        _count: true,
        _avg: { level: true },
      });

      return skills.map((s: { skillName: string; category: string | null; _count: number; _avg: { level: number | null } }) => ({
        skillName: s.skillName,
        category: s.category,
        employeeCount: s._count,
        avgLevel: s._avg?.level ?? 0,
      }));
    }),

  // ==================== DASHBOARD ====================

  dashboard: tenantProcedure.query(async ({ ctx }) => {
    const [
      totalBenefitTypes,
      activeBenefits,
      totalTrainings,
      pendingTrainings,
      expiredTrainings,
      skillsCount,
      benefitsByCategory,
    ] = await Promise.all([
      prisma.benefitType.count({ where: { companyId: ctx.companyId, isActive: true } }),
      prisma.employeeBenefit.count({ where: { companyId: ctx.companyId, status: "ACTIVE" } }),
      prisma.training.count({ where: { companyId: ctx.companyId, isActive: true } }),
      prisma.employeeTraining.count({
        where: { companyId: ctx.companyId, status: "SCHEDULED" },
      }),
      prisma.employeeTraining.count({
        where: {
          companyId: ctx.companyId,
          status: "COMPLETED",
          expirationDate: { lt: new Date() },
        },
      }),
      prisma.skillMatrix.count({ where: { companyId: ctx.companyId } }),
      prisma.employeeBenefit.groupBy({
        by: ["benefitTypeId"],
        where: { companyId: ctx.companyId, status: "ACTIVE" },
        _count: true,
        _sum: { value: true },
      }),
    ]);

    return {
      totalBenefitTypes,
      activeBenefits,
      totalTrainings,
      pendingTrainings,
      expiredTrainings,
      skillsCount,
      benefitsByCategory: benefitsByCategory.map((b: { benefitTypeId: string; _count: number; _sum: { value: number | null } }) => ({
        benefitTypeId: b.benefitTypeId,
        count: b._count,
        totalValue: b._sum?.value ?? 0,
      })),
    };
  }),
});
