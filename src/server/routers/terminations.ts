import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, tenantProcedure, tenantFilter } from "../trpc";

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

      // Calcular dias de aviso prévio (3 dias por ano trabalhado, mín 30, máx 90)
      const hireDate = new Date(employee.hireDate);
      const yearsWorked = Math.floor((input.terminationDate.getTime() - hireDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      const noticePeriodDays = Math.min(90, Math.max(30, 30 + (yearsWorked * 3)));

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

      const { employee, type, terminationDate, noticePeriodIndemnity } = termination;
      const baseSalaryNum = Number(termination.baseSalary || 0);
      const noticePeriodDaysNum = Number(termination.noticePeriodDays || 30);
      const hireDate = new Date(employee.hireDate);
      const dailySalary = baseSalaryNum / 30;

      // Saldo de salário (dias trabalhados no mês)
      const dayOfMonth = terminationDate.getDate();
      const salaryBalance = dailySalary * dayOfMonth;

      // Aviso prévio indenizado
      let noticePeriodValue = 0;
      if (noticePeriodIndemnity && type !== "RESIGNATION" && type !== "DISMISSAL_WITH_CAUSE") {
        noticePeriodValue = dailySalary * noticePeriodDaysNum;
      }

      // Férias vencidas (período aquisitivo completo)
      const monthsSinceHire = Math.floor((terminationDate.getTime() - hireDate.getTime()) / (30 * 24 * 60 * 60 * 1000));
      const completedPeriods = Math.floor(monthsSinceHire / 12);
      const vacationBalanceCalc = completedPeriods > 0 ? baseSalaryNum : 0;

      // Férias proporcionais (meses do período aquisitivo atual)
      const monthsInCurrentPeriod = monthsSinceHire % 12;
      const vacationProportional = (baseSalaryNum / 12) * monthsInCurrentPeriod;

      // 1/3 de férias
      const vacationOneThird = (vacationBalanceCalc + vacationProportional) / 3;

      // 13º proporcional
      const monthsInYear = terminationDate.getMonth() + 1;
      let thirteenthProportional = 0;
      if (type !== "DISMISSAL_WITH_CAUSE") {
        thirteenthProportional = (baseSalaryNum / 12) * monthsInYear;
      }

      // FGTS (8% do salário por mês)
      const fgtsBalance = baseSalaryNum * 0.08 * monthsSinceHire;

      // Multa FGTS
      let fgtsFine = 0;
      if (type === "DISMISSAL_NO_CAUSE") {
        fgtsFine = fgtsBalance * 0.40; // 40%
      } else if (type === "MUTUAL_AGREEMENT") {
        fgtsFine = fgtsBalance * 0.20; // 20%
      }

      // Total bruto
      const totalGross = salaryBalance + noticePeriodValue + vacationBalanceCalc + 
        vacationProportional + vacationOneThird + thirteenthProportional + fgtsFine;

      // Calcular INSS
      const baseInss = salaryBalance + noticePeriodValue;
      const inssDeduction = Math.min(baseInss * 0.14, 908.85);

      // Calcular IRRF
      const baseIrrf = baseInss - inssDeduction;
      let irrfDeduction = 0;
      if (baseIrrf > 4664.68) {
        irrfDeduction = baseIrrf * 0.275 - 896.00;
      } else if (baseIrrf > 3751.05) {
        irrfDeduction = baseIrrf * 0.225 - 662.77;
      } else if (baseIrrf > 2826.65) {
        irrfDeduction = baseIrrf * 0.15 - 381.44;
      } else if (baseIrrf > 2259.20) {
        irrfDeduction = baseIrrf * 0.075 - 169.44;
      }

      const totalDeductions = inssDeduction + irrfDeduction;
      const totalNet = totalGross - totalDeductions;

      // Elegibilidade para seguro desemprego
      const eligibleForUnemployment = type === "DISMISSAL_NO_CAUSE" && monthsSinceHire >= 12;
      const unemploymentGuides = eligibleForUnemployment ? Math.min(5, Math.floor(monthsSinceHire / 6)) : 0;

      return ctx.prisma.termination.update({
        where: { id: input.id },
        data: {
          status: "CALCULATED",
          salaryBalance,
          noticePeriodValue,
          vacationBalance: vacationBalanceCalc,
          vacationProportional,
          vacationOneThird,
          thirteenthProportional,
          fgtsBalance,
          fgtsFine,
          totalGross,
          inssDeduction,
          irrfDeduction,
          totalDeductions,
          totalNet,
          eligibleForUnemployment,
          unemploymentGuides,
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
