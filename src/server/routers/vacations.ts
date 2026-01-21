import { z } from "zod";
import { createTRPCRouter, tenantProcedure, tenantFilter } from "../trpc";

export const vacationsRouter = createTRPCRouter({
  // Listar férias
  list: tenantProcedure
    .input(z.object({
      employeeId: z.string().optional(),
      status: z.enum(["SCHEDULED", "APPROVED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "ALL"]).optional(),
      year: z.number().optional(),
      page: z.number().default(1),
      limit: z.number().default(20),
    }))
    .query(async ({ input, ctx }) => {
      const { employeeId, status, year, page, limit } = input;
      const skip = (page - 1) * limit;

      const where = {
        ...tenantFilter(ctx.companyId),
        ...(employeeId && { employeeId }),
        ...(status && status !== "ALL" && { status }),
        ...(year && {
          startDate: {
            gte: new Date(year, 0, 1),
            lt: new Date(year + 1, 0, 1),
          },
        }),
      };

      const [vacations, total] = await Promise.all([
        ctx.prisma.vacation.findMany({
          where,
          include: {
            employee: { select: { id: true, name: true, code: true } },
          },
          orderBy: { startDate: "desc" },
          skip,
          take: limit,
        }),
        ctx.prisma.vacation.count({ where }),
      ]);

      return {
        vacations,
        total,
        pages: Math.ceil(total / limit),
      };
    }),

  // Obter férias por ID
  getById: tenantProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      return ctx.prisma.vacation.findUnique({
        where: { id: input.id },
        include: {
          employee: true,
        },
      });
    }),

  // Criar férias
  create: tenantProcedure
    .input(z.object({
      employeeId: z.string(),
      acquisitionStart: z.date(),
      acquisitionEnd: z.date(),
      startDate: z.date(),
      endDate: z.date(),
      totalDays: z.number().default(30),
      soldDays: z.number().default(0),
      isCollective: z.boolean().default(false),
      collectiveGroupId: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const employee = await ctx.prisma.employee.findUnique({
        where: { id: input.employeeId },
        select: { salary: true },
      });

      if (!employee) {
        throw new Error("Funcionário não encontrado");
      }

      // Calcular valores
      const baseSalary = employee.salary;
      const enjoyedDays = input.totalDays - input.soldDays;
      const dailySalary = baseSalary / 30;
      
      const vacationPay = dailySalary * enjoyedDays;
      const oneThirdBonus = vacationPay / 3;
      const soldDaysValue = dailySalary * input.soldDays * (4 / 3); // Abono = dias + 1/3
      const totalGross = vacationPay + oneThirdBonus + soldDaysValue;

      // Calcular INSS (simplificado - usar tabela real em produção)
      const inssDeduction = Math.min(totalGross * 0.14, 908.85);
      
      // Calcular IRRF (simplificado - usar tabela real em produção)
      const baseIrrf = totalGross - inssDeduction;
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

      const totalNet = totalGross - inssDeduction - irrfDeduction;

      return ctx.prisma.vacation.create({
        data: {
          companyId: ctx.companyId,
          employeeId: input.employeeId,
          acquisitionStart: input.acquisitionStart,
          acquisitionEnd: input.acquisitionEnd,
          startDate: input.startDate,
          endDate: input.endDate,
          totalDays: input.totalDays,
          soldDays: input.soldDays,
          enjoyedDays,
          baseSalary,
          vacationPay,
          oneThirdBonus,
          soldDaysValue,
          totalGross,
          inssDeduction,
          irrfDeduction,
          totalNet,
          isCollective: input.isCollective,
          collectiveGroupId: input.collectiveGroupId,
          notes: input.notes,
          createdBy: ctx.tenant.userId,
        },
      });
    }),

  // Aprovar férias
  approve: tenantProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.prisma.vacation.update({
        where: { id: input.id },
        data: {
          status: "APPROVED",
          approvedBy: ctx.tenant.userId,
          approvedAt: new Date(),
        },
      });
    }),

  // Iniciar férias
  start: tenantProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const vacation = await ctx.prisma.vacation.findUnique({
        where: { id: input.id },
        include: { employee: true },
      });

      if (!vacation) throw new Error("Férias não encontradas");

      // Atualizar status do funcionário
      await ctx.prisma.employee.update({
        where: { id: vacation.employeeId },
        data: { status: "VACATION" },
      });

      return ctx.prisma.vacation.update({
        where: { id: input.id },
        data: { status: "IN_PROGRESS" },
      });
    }),

  // Concluir férias
  complete: tenantProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const vacation = await ctx.prisma.vacation.findUnique({
        where: { id: input.id },
      });

      if (!vacation) throw new Error("Férias não encontradas");

      // Retornar status do funcionário para ativo
      await ctx.prisma.employee.update({
        where: { id: vacation.employeeId },
        data: { status: "ACTIVE" },
      });

      return ctx.prisma.vacation.update({
        where: { id: input.id },
        data: { status: "COMPLETED" },
      });
    }),

  // Cancelar férias
  cancel: tenantProcedure
    .input(z.object({ id: z.string(), reason: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.prisma.vacation.update({
        where: { id: input.id },
        data: {
          status: "CANCELLED",
          notes: input.reason,
        },
      });
    }),

  // Registrar pagamento
  registerPayment: tenantProcedure
    .input(z.object({
      id: z.string(),
      paymentDate: z.date(),
    }))
    .mutation(async ({ input, ctx }) => {
      return ctx.prisma.vacation.update({
        where: { id: input.id },
        data: { paymentDate: input.paymentDate },
      });
    }),

  // Listar funcionários com férias vencidas
  listOverdue: tenantProcedure
    .query(async ({ ctx }) => {
      const today = new Date();
      const oneYearAgo = new Date(today);
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      // Funcionários ativos que não tiraram férias no último ano
      const employees = await ctx.prisma.employee.findMany({
        where: {
          ...tenantFilter(ctx.companyId),
          status: "ACTIVE",
          hireDate: { lt: oneYearAgo },
        },
        include: {
          vacations: {
            where: {
              status: { in: ["COMPLETED", "IN_PROGRESS"] },
              startDate: { gte: oneYearAgo },
            },
          },
        },
      });

      return employees.filter(e => e.vacations.length === 0);
    }),
});
