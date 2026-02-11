import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, tenantProcedure, tenantFilter } from "../trpc";
import { PayrollService, calculateNoticePeriodDays } from "../services/payroll";

export const terminationsRouter = createTRPCRouter({
  // Listar rescisões
  list: tenantProcedure
    .input(z.object({
      employeeId: z.string().optional(),
      status: z.enum(["DRAFT", "CALCULATED", "APPROVED", "PAID", "HOMOLOGATED", "CANCELLED", "ALL"]).optional(),
      type: z.enum(["RESIGNATION", "DISMISSAL_WITH_CAUSE", "DISMISSAL_NO_CAUSE", "MUTUAL_AGREEMENT", "CONTRACT_END", "RETIREMENT", "DEATH", "ALL"]).optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      page: z.number().default(1),
      limit: z.number().default(20),
    }))
    .query(async ({ input, ctx }) => {
      const { employeeId, status, type, startDate, endDate, page, limit } = input;
      const skip = (page - 1) * limit;

      const where = {
        ...tenantFilter(ctx.companyId),
        ...(employeeId && { employeeId }),
        ...(status && status !== "ALL" && { status }),
        ...(type && type !== "ALL" && { type }),
        ...(startDate && { terminationDate: { gte: startDate } }),
        ...(endDate && { terminationDate: { lte: endDate } }),
      };

      const [terminations, total] = await Promise.all([
        ctx.prisma.termination.findMany({
          where,
          include: {
            employee: { select: { id: true, name: true, code: true, hireDate: true } },
          },
          orderBy: { terminationDate: "desc" },
          skip,
          take: limit,
        }),
        ctx.prisma.termination.count({ where }),
      ]);

      return {
        terminations,
        total,
        pages: Math.ceil(total / limit),
      };
    }),

  // Obter por ID
  getById: tenantProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      return ctx.prisma.termination.findFirst({
        where: { 
          id: input.id,
          companyId: ctx.companyId,
        },
        include: { employee: true },
      });
    }),

  // Criar rescisão
  create: tenantProcedure
    .input(z.object({
      employeeId: z.string(),
      type: z.enum(["RESIGNATION", "DISMISSAL_WITH_CAUSE", "DISMISSAL_NO_CAUSE", "MUTUAL_AGREEMENT", "CONTRACT_END", "RETIREMENT", "DEATH"]),
      terminationDate: z.date(),
      lastWorkDay: z.date().optional(),
      noticeDate: z.date().optional(),
      noticePeriodWorked: z.boolean().default(false),
      noticePeriodIndemnity: z.boolean().default(false),
      reason: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const employee = await ctx.prisma.employee.findUnique({
        where: { id: input.employeeId },
        select: { salary: true, hireDate: true },
      });

      if (!employee) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Funcionário não encontrado" });
      }

      // Calcular dias de aviso prévio
      const hireDate = new Date(employee.hireDate);
      const noticePeriodDays = calculateNoticePeriodDays(hireDate, input.terminationDate);

      return ctx.prisma.termination.create({
        data: {
          companyId: ctx.companyId,
          employeeId: input.employeeId,
          type: input.type,
          terminationDate: input.terminationDate,
          lastWorkDay: input.lastWorkDay || input.terminationDate,
          noticeDate: input.noticeDate,
          noticePeriodDays,
          noticePeriodWorked: input.noticePeriodWorked,
          noticePeriodIndemnity: input.noticePeriodIndemnity,
          baseSalary: employee.salary,
          reason: input.reason,
          notes: input.notes,
          createdBy: ctx.tenant.userId,
        },
      });
    }),

  // Calcular rescisão
  calculate: tenantProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const termination = await ctx.prisma.termination.findFirst({
        where: { 
          id: input.id,
          companyId: ctx.companyId,
        },
        include: { employee: true },
      });

      if (!termination) throw new TRPCError({ code: "NOT_FOUND", message: "Rescisão não encontrada ou sem permissão" });

      // Delegar cálculo ao PayrollService
      const payrollService = new PayrollService(ctx.prisma);
      const calc = payrollService.calculateTermination({
        baseSalary: termination.baseSalary || 0,
        hireDate: new Date(termination.employee.hireDate),
        terminationDate: termination.terminationDate,
        type: termination.type,
        noticePeriodDays: Number(termination.noticePeriodDays || 30),
        noticePeriodIndemnity: termination.noticePeriodIndemnity ?? false,
      });

      return ctx.prisma.termination.update({
        where: { id: input.id },
        data: {
          status: "CALCULATED",
          salaryBalance: calc.salaryBalance,
          noticePeriodValue: calc.noticePeriodValue,
          vacationBalance: calc.vacationBalance,
          vacationProportional: calc.vacationProportional,
          vacationOneThird: calc.vacationOneThird,
          thirteenthProportional: calc.thirteenthProportional,
          fgtsBalance: calc.fgtsBalance,
          fgtsFine: calc.fgtsFine,
          totalGross: calc.totalGross,
          inssDeduction: calc.inssDeduction,
          irrfDeduction: calc.irrfDeduction,
          totalDeductions: calc.totalDeductions,
          totalNet: calc.totalNet,
          eligibleForUnemployment: calc.eligibleForUnemployment,
          unemploymentGuides: calc.unemploymentGuides,
        },
      });
    }),

  // Aprovar rescisão
  approve: tenantProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const result = await ctx.prisma.termination.updateMany({
        where: { 
          id: input.id,
          companyId: ctx.companyId,
        },
        data: {
          status: "APPROVED",
          approvedBy: ctx.tenant.userId,
          approvedAt: new Date(),
        },
      });
      if (result.count === 0) throw new TRPCError({ code: "NOT_FOUND", message: "Rescisão não encontrada ou sem permissão" });
      return ctx.prisma.termination.findUnique({ where: { id: input.id } });
    }),

  // Registrar pagamento
  registerPayment: tenantProcedure
    .input(z.object({
      id: z.string(),
      paymentDate: z.date(),
    }))
    .mutation(async ({ input, ctx }) => {
      const termination = await ctx.prisma.termination.findFirst({
        where: { 
          id: input.id,
          companyId: ctx.companyId,
        },
      });

      if (!termination) throw new TRPCError({ code: "NOT_FOUND", message: "Rescisão não encontrada ou sem permissão" });

      // Atualizar status do funcionário
      await ctx.prisma.employee.update({
        where: { id: termination.employeeId },
        data: {
          status: "TERMINATED",
          terminationDate: termination.terminationDate,
        },
      });

      return ctx.prisma.termination.update({
        where: { id: input.id },
        data: {
          status: "PAID",
          paymentDate: input.paymentDate,
        },
      });
    }),

  // Registrar homologação
  registerHomologation: tenantProcedure
    .input(z.object({
      id: z.string(),
      homologationDate: z.date(),
      trctNumber: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const result = await ctx.prisma.termination.updateMany({
        where: { 
          id: input.id,
          companyId: ctx.companyId,
        },
        data: {
          status: "HOMOLOGATED",
          homologationDate: input.homologationDate,
          trctNumber: input.trctNumber,
        },
      });
      if (result.count === 0) throw new TRPCError({ code: "NOT_FOUND", message: "Rescisão não encontrada ou sem permissão" });
      return ctx.prisma.termination.findUnique({ where: { id: input.id } });
    }),

  // Gerar GRRF
  generateGrrf: tenantProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const result = await ctx.prisma.termination.updateMany({
        where: { 
          id: input.id,
          companyId: ctx.companyId,
        },
        data: {
          grffGenerated: true,
          grffDate: new Date(),
        },
      });
      if (result.count === 0) throw new TRPCError({ code: "NOT_FOUND", message: "Rescisão não encontrada ou sem permissão" });
      return ctx.prisma.termination.findUnique({ where: { id: input.id } });
    }),

  // Cancelar rescisão
  cancel: tenantProcedure
    .input(z.object({ id: z.string(), reason: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const result = await ctx.prisma.termination.updateMany({
        where: { 
          id: input.id,
          companyId: ctx.companyId,
        },
        data: {
          status: "CANCELLED",
          notes: input.reason,
        },
      });
      if (result.count === 0) throw new TRPCError({ code: "NOT_FOUND", message: "Rescisão não encontrada ou sem permissão" });
      return ctx.prisma.termination.findUnique({ where: { id: input.id } });
    }),
});
