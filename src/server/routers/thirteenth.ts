import { z } from "zod";
import { createTRPCRouter, tenantProcedure, tenantFilter } from "../trpc";

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

        // Calcular meses trabalhados no ano
        const hireDate = new Date(employee.hireDate);
        const startOfYear = new Date(input.year, 0, 1);
        const monthsWorked = hireDate > startOfYear
          ? 12 - hireDate.getMonth()
          : 12;

        // 1ª parcela = 50% do salário proporcional (sem descontos)
        const grossValue = (employee.salary / 12) * monthsWorked * 0.5;

        const thirteenth = await ctx.prisma.thirteenthSalary.create({
          data: {
            companyId: ctx.companyId,
            employeeId: employee.id,
            year: input.year,
            type: "FIRST_INSTALLMENT",
            status: "CALCULATED",
            monthsWorked,
            baseSalary: employee.salary,
            grossValue,
            netValue: grossValue, // 1ª parcela não tem descontos
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

        // Calcular meses trabalhados no ano
        const hireDate = new Date(employee.hireDate);
        const startOfYear = new Date(input.year, 0, 1);
        const monthsWorked = hireDate > startOfYear
          ? 12 - hireDate.getMonth()
          : 12;

        // Total do 13º
        const totalThirteenth = (employee.salary / 12) * monthsWorked;
        
        // 2ª parcela = Total - 1ª parcela
        const firstValue = firstInstallment?.grossValue || 0;
        const grossValue = totalThirteenth - firstValue;

        // Calcular INSS sobre o total
        const inssDeduction = Math.min(totalThirteenth * 0.14, 908.85);

        // Calcular IRRF sobre o total
        const baseIrrf = totalThirteenth - inssDeduction;
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

        const netValue = grossValue - inssDeduction - irrfDeduction;

        const thirteenth = await ctx.prisma.thirteenthSalary.create({
          data: {
            companyId: ctx.companyId,
            employeeId: employee.id,
            year: input.year,
            type: "SECOND_INSTALLMENT",
            status: "CALCULATED",
            monthsWorked,
            baseSalary: employee.salary,
            grossValue,
            inssDeduction,
            irrfDeduction,
            netValue,
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
