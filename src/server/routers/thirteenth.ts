import { z } from "zod";
import { createTRPCRouter, tenantProcedure, tenantFilter } from "../trpc";
import { PayrollService } from "../services/payroll";

export const thirteenthRouter = createTRPCRouter({
  // Listar 13º salário
  list: tenantProcedure
    .input(z.object({
      employeeId: z.string().optional(),
      year: z.number().optional(),
      type: z.enum(["FIRST_INSTALLMENT", "SECOND_INSTALLMENT", "FULL", "PROPORTIONAL", "ALL"]).optional(),
      status: z.enum(["PENDING", "CALCULATED", "PAID", "CANCELLED", "ALL"]).optional(),
      page: z.number().default(1),
      limit: z.number().default(20),
    }))
    .query(async ({ input, ctx }) => {
      const { employeeId, year, type, status, page, limit } = input;
      const skip = (page - 1) * limit;

      const where = {
        ...tenantFilter(ctx.companyId),
        ...(employeeId && { employeeId }),
        ...(year && { year }),
        ...(type && type !== "ALL" && { type }),
        ...(status && status !== "ALL" && { status }),
      };

      const [items, total] = await Promise.all([
        ctx.prisma.thirteenthSalary.findMany({
          where,
          include: {
            employee: { select: { id: true, name: true, code: true } },
          },
          orderBy: [{ year: "desc" }, { type: "asc" }],
          skip,
          take: limit,
        }),
        ctx.prisma.thirteenthSalary.count({ where }),
      ]);

      return {
        items,
        total,
        pages: Math.ceil(total / limit),
      };
    }),

  // Obter por ID
  getById: tenantProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      return ctx.prisma.thirteenthSalary.findUnique({
        where: { id: input.id },
        include: { employee: true },
      });
    }),

  // Calcular 1ª parcela para todos funcionários
  calculateFirstInstallment: tenantProcedure
    .input(z.object({ year: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const employees = await ctx.prisma.employee.findMany({
        where: {
          ...tenantFilter(ctx.companyId),
          status: "ACTIVE",
        },
      });

      const results = [];

      for (const employee of employees) {
        // Verificar se já existe
        const existing = await ctx.prisma.thirteenthSalary.findUnique({
          where: {
            employeeId_year_type: {
              employeeId: employee.id,
              year: input.year,
              type: "FIRST_INSTALLMENT",
            },
          },
        });

        if (existing) continue;

        const payrollService = new PayrollService(ctx.prisma);
        const calc = payrollService.calculateThirteenthFirstInstallment({
          salary: employee.salary,
          hireDate: new Date(employee.hireDate),
          year: input.year,
        });

        const thirteenth = await ctx.prisma.thirteenthSalary.create({
          data: {
            companyId: ctx.companyId,
            employeeId: employee.id,
            year: input.year,
            type: "FIRST_INSTALLMENT",
            status: "CALCULATED",
            monthsWorked: calc.monthsWorked,
            baseSalary: employee.salary,
            grossValue: calc.grossValue,
            netValue: calc.netValue,
            createdBy: ctx.tenant.userId,
          },
        });

        results.push(thirteenth);
      }

      return { created: results.length };
    }),

  // Calcular 2ª parcela para todos funcionários
  calculateSecondInstallment: tenantProcedure
    .input(z.object({ year: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const employees = await ctx.prisma.employee.findMany({
        where: {
          ...tenantFilter(ctx.companyId),
          status: "ACTIVE",
        },
      });

      const results = [];

      for (const employee of employees) {
        // Verificar se já existe
        const existing = await ctx.prisma.thirteenthSalary.findUnique({
          where: {
            employeeId_year_type: {
              employeeId: employee.id,
              year: input.year,
              type: "SECOND_INSTALLMENT",
            },
          },
        });

        if (existing) continue;

        // Buscar 1ª parcela
        const firstInstallment = await ctx.prisma.thirteenthSalary.findUnique({
          where: {
            employeeId_year_type: {
              employeeId: employee.id,
              year: input.year,
              type: "FIRST_INSTALLMENT",
            },
          },
        });

        const payrollService = new PayrollService(ctx.prisma);
        const calc = payrollService.calculateThirteenthSecondInstallment({
          salary: employee.salary,
          hireDate: new Date(employee.hireDate),
          year: input.year,
          firstInstallmentGross: Number(firstInstallment?.grossValue || 0),
        });

        const thirteenth = await ctx.prisma.thirteenthSalary.create({
          data: {
            companyId: ctx.companyId,
            employeeId: employee.id,
            year: input.year,
            type: "SECOND_INSTALLMENT",
            status: "CALCULATED",
            monthsWorked: calc.monthsWorked,
            baseSalary: employee.salary,
            grossValue: calc.grossValue,
            inssDeduction: calc.inssDeduction,
            irrfDeduction: calc.irrfDeduction,
            netValue: calc.netValue,
            createdBy: ctx.tenant.userId,
          },
        });

        results.push(thirteenth);
      }

      return { created: results.length };
    }),

  // Registrar pagamento
  registerPayment: tenantProcedure
    .input(z.object({
      id: z.string(),
      paymentDate: z.date(),
    }))
    .mutation(async ({ input, ctx }) => {
      return ctx.prisma.thirteenthSalary.update({
        where: { id: input.id },
        data: {
          status: "PAID",
          paymentDate: input.paymentDate,
        },
      });
    }),

  // Registrar pagamento em lote
  registerBatchPayment: tenantProcedure
    .input(z.object({
      ids: z.array(z.string()),
      paymentDate: z.date(),
    }))
    .mutation(async ({ input, ctx }) => {
      return ctx.prisma.thirteenthSalary.updateMany({
        where: { id: { in: input.ids } },
        data: {
          status: "PAID",
          paymentDate: input.paymentDate,
        },
      });
    }),

  // Resumo por ano
  summary: tenantProcedure
    .input(z.object({ year: z.number() }))
    .query(async ({ input, ctx }) => {
      const items = await ctx.prisma.thirteenthSalary.findMany({
        where: {
          ...tenantFilter(ctx.companyId),
          year: input.year,
        },
      });

      const firstInstallment = items.filter(i => i.type === "FIRST_INSTALLMENT");
      const secondInstallment = items.filter(i => i.type === "SECOND_INSTALLMENT");

      return {
        year: input.year,
        firstInstallment: {
          count: firstInstallment.length,
          totalGross: firstInstallment.reduce((sum, i) => sum + Number(i.grossValue || 0), 0),
          totalNet: firstInstallment.reduce((sum, i) => sum + Number(i.netValue || 0), 0),
          paid: firstInstallment.filter(i => i.status === "PAID").length,
        },
        secondInstallment: {
          count: secondInstallment.length,
          totalGross: secondInstallment.reduce((sum, i) => sum + Number(i.grossValue || 0), 0),
          totalNet: secondInstallment.reduce((sum, i) => sum + Number(i.netValue || 0), 0),
          paid: secondInstallment.filter(i => i.status === "PAID").length,
        },
      };
    }),
});
