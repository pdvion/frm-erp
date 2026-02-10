import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, tenantProcedure, tenantFilter } from "../trpc";
import { Prisma } from "@prisma/client";
import { syncEntityEmbedding } from "../services/embeddingSync";

// Tabela INSS 2024
function calculateINSS(salary: number): number {
  if (salary <= 1412.00) return salary * 0.075;
  if (salary <= 2666.68) return 105.90 + (salary - 1412.00) * 0.09;
  if (salary <= 4000.03) return 218.82 + (salary - 2666.68) * 0.12;
  if (salary <= 7786.02) return 378.82 + (salary - 4000.03) * 0.14;
  return 908.85; // Teto
}

// Tabela IRRF 2024
function calculateIRRF(baseCalculo: number): number {
  if (baseCalculo <= 2259.20) return 0;
  if (baseCalculo <= 2826.65) return (baseCalculo * 0.075) - 169.44;
  if (baseCalculo <= 3751.05) return (baseCalculo * 0.15) - 381.44;
  if (baseCalculo <= 4664.68) return (baseCalculo * 0.225) - 662.77;
  return (baseCalculo * 0.275) - 896.00;
}

export const hrRouter = createTRPCRouter({
  // ==========================================================================
  // DEPARTAMENTOS
  // ==========================================================================
  listDepartments: tenantProcedure
    .input(z.object({ includeInactive: z.boolean().default(false) }).optional())
    .query(async ({ input, ctx }) => {
      return ctx.prisma.department.findMany({
        where: { ...tenantFilter(ctx.companyId, false), ...(!input?.includeInactive && { isActive: true }) },
        include: { parent: { select: { id: true, code: true, name: true } }, _count: { select: { employees: true } } },
        orderBy: { code: "asc" },
      });
    }),

  createDepartment: tenantProcedure
    .input(z.object({
      code: z.string().min(1),
      name: z.string().min(1),
      description: z.string().optional(),
      parentId: z.string().optional(),
      costCenterId: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      return ctx.prisma.department.create({ data: { ...input, companyId: ctx.companyId } });
    }),

  updateDepartment: tenantProcedure
    .input(z.object({
      id: z.string(),
      code: z.string().optional(),
      name: z.string().optional(),
      description: z.string().optional(),
      parentId: z.string().nullable().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      return ctx.prisma.department.update({
        where: { id, companyId: ctx.companyId },
        data: { ...data, parentId: data.parentId === null ? null : data.parentId },
      });
    }),

  deleteDepartment: tenantProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const hasEmployees = await ctx.prisma.employee.count({
        where: { departmentId: input.id, companyId: ctx.companyId },
      });
      if (hasEmployees > 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Não é possível excluir departamento com funcionários vinculados" });
      }
      return ctx.prisma.department.delete({ where: { id: input.id, companyId: ctx.companyId } });
    }),

  // ==========================================================================
  // CARGOS
  // ==========================================================================
  listPositions: tenantProcedure
    .input(z.object({ departmentId: z.string().optional() }).optional())
    .query(async ({ input, ctx }) => {
      return ctx.prisma.jobPosition.findMany({
        where: { ...tenantFilter(ctx.companyId, false), isActive: true, ...(input?.departmentId && { departmentId: input.departmentId }) },
        include: { department: { select: { id: true, name: true } } },
        orderBy: { name: "asc" },
      });
    }),

  createPosition: tenantProcedure
    .input(z.object({
      code: z.string().min(1),
      name: z.string().min(1),
      description: z.string().optional(),
      departmentId: z.string().optional(),
      baseSalary: z.number().optional(),
      level: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      return ctx.prisma.jobPosition.create({ data: { ...input, companyId: ctx.companyId } });
    }),

  // ==========================================================================
  // FUNCIONÁRIOS
  // ==========================================================================
  listEmployees: tenantProcedure
    .input(z.object({
      search: z.string().optional(),
      status: z.enum(["ACTIVE", "VACATION", "LEAVE", "SUSPENDED", "TERMINATED", "ALL"]).optional(),
      departmentId: z.string().optional(),
      page: z.number().default(1),
      limit: z.number().default(20),
    }).optional())
    .query(async ({ input, ctx }) => {
      const { search, status, departmentId, page = 1, limit = 20 } = input || {};
      const where: Prisma.EmployeeWhereInput = {
        ...tenantFilter(ctx.companyId, false),
        ...(search && { OR: [{ name: { contains: search, mode: "insensitive" as const } }, { cpf: { contains: search } }] }),
        ...(status && status !== "ALL" && { status }),
        ...(departmentId && { departmentId }),
      };

      const [employees, total] = await Promise.all([
        ctx.prisma.employee.findMany({
          where,
          include: {
            department: { select: { id: true, name: true } },
            position: { select: { id: true, name: true } },
            company: { select: { id: true, name: true } },
          },
          orderBy: { name: "asc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        ctx.prisma.employee.count({ where }),
      ]);

      return { employees, total, pages: Math.ceil(total / limit) };
    }),

  getEmployee: tenantProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      return ctx.prisma.employee.findUnique({
        where: { id: input.id },
        include: {
          department: true,
          position: true,
          manager: { select: { id: true, name: true } },
          company: { select: { id: true, name: true, tradeName: true } },
        },
      });
    }),

  createEmployee: tenantProcedure
    .input(z.object({
      name: z.string().min(1),
      cpf: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      mobile: z.string().optional(),
      departmentId: z.string().optional(),
      positionId: z.string().optional(),
      managerId: z.string().optional(),
      contractType: z.enum(["CLT", "PJ", "TEMPORARY", "INTERN", "APPRENTICE"]).default("CLT"),
      hireDate: z.date(),
      salary: z.number().default(0),
      workHoursPerDay: z.number().default(8),
      workDaysPerWeek: z.number().default(5),
    }))
    .mutation(async ({ input, ctx }) => {
      const lastEmployee = await ctx.prisma.employee.findFirst({
        where: tenantFilter(ctx.companyId, false),
        orderBy: { code: "desc" },
      });

      const employee = await ctx.prisma.employee.create({
        data: { ...input, code: (lastEmployee?.code || 0) + 1, companyId: ctx.companyId, createdBy: ctx.tenant.userId },
      });

      syncEntityEmbedding({ prisma: ctx.prisma, companyId: ctx.companyId }, "employee", employee.id, "create");

      return employee;
    }),

  updateEmployee: tenantProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().optional(),
      email: z.string().optional(),
      phone: z.string().optional(),
      mobile: z.string().optional(),
      departmentId: z.string().optional(),
      positionId: z.string().optional(),
      status: z.enum(["ACTIVE", "VACATION", "LEAVE", "SUSPENDED", "TERMINATED"]).optional(),
      salary: z.number().optional(),
      terminationDate: z.date().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      const employee = await ctx.prisma.employee.update({ where: { id }, data });

      syncEntityEmbedding({ prisma: ctx.prisma, companyId: ctx.companyId }, "employee", employee.id, "update");

      return employee;
    }),

  // ==========================================================================
  // PONTO
  // ==========================================================================
  listTimeEntries: tenantProcedure
    .input(z.object({
      date: z.string().optional(),
      employeeId: z.string().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const dateFilter = input?.date ? new Date(input.date) : new Date();
      const startOfDay = new Date(dateFilter);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(dateFilter);
      endOfDay.setHours(23, 59, 59, 999);

      return ctx.prisma.timesheetDay.findMany({
        where: {
          date: { gte: startOfDay, lte: endOfDay },
          ...(input?.employeeId && { employeeId: input.employeeId }),
          employee: tenantFilter(ctx.companyId, false),
        },
        include: {
          employee: {
            select: {
              id: true,
              name: true,
              department: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { employee: { name: "asc" } },
      });
    }),

  clockIn: tenantProcedure
    .input(z.object({
      employeeId: z.string(),
      type: z.enum(["CLOCK_IN", "CLOCK_OUT", "BREAK_START", "BREAK_END"]),
      location: z.string().optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      return ctx.prisma.timeClockEntry.create({
        data: { ...input, timestamp: new Date() },
      });
    }),

  getTimesheet: tenantProcedure
    .input(z.object({
      employeeId: z.string(),
      startDate: z.date(),
      endDate: z.date(),
    }))
    .query(async ({ input, ctx }) => {
      const entries = await ctx.prisma.timeClockEntry.findMany({
        where: {
          employeeId: input.employeeId,
          timestamp: { gte: input.startDate, lte: input.endDate },
        },
        orderBy: { timestamp: "asc" },
      });

      const days = await ctx.prisma.timesheetDay.findMany({
        where: {
          employeeId: input.employeeId,
          date: { gte: input.startDate, lte: input.endDate },
        },
        orderBy: { date: "asc" },
      });

      return { entries, days };
    }),

  // ==========================================================================
  // FOLHA DE PAGAMENTO
  // ==========================================================================
  listPayrolls: tenantProcedure
    .input(z.object({ 
      year: z.number().optional(),
      month: z.string().optional(), // formato: "YYYY-MM"
    }).optional())
    .query(async ({ input, ctx }) => {
      let yearFilter: number | undefined;
      let monthFilter: number | undefined;
      
      if (input?.month) {
        const [year, month] = input.month.split("-").map(Number);
        yearFilter = year;
        monthFilter = month;
      } else if (input?.year) {
        yearFilter = input.year;
      }

      const payrollItems = await ctx.prisma.payrollItem.findMany({
        where: {
          payroll: {
            ...tenantFilter(ctx.companyId, false),
            ...(yearFilter && { referenceYear: yearFilter }),
            ...(monthFilter && { referenceMonth: monthFilter }),
          },
        },
        include: {
          employee: {
            select: {
              id: true,
              name: true,
              position: { select: { id: true, name: true } },
            },
          },
          payroll: {
            select: { status: true, referenceMonth: true, referenceYear: true },
          },
        },
        orderBy: { employee: { name: "asc" } },
      });

      return payrollItems.map((item) => ({
        id: item.id,
        employee: item.employee,
        grossSalary: item.grossSalary,
        netSalary: item.netSalary,
        inssValue: item.inss,
        irrfValue: item.irrf,
        status: item.payroll.status,
      }));
    }),

  getPayroll: tenantProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      return ctx.prisma.payroll.findUnique({
        where: { id: input.id },
        include: {
          items: {
            include: { employee: { select: { id: true, code: true, name: true } }, events: true },
            orderBy: { employee: { name: "asc" } },
          },
        },
      });
    }),

  createPayroll: tenantProcedure
    .input(z.object({
      referenceMonth: z.number().min(1).max(12),
      referenceYear: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const lastPayroll = await ctx.prisma.payroll.findFirst({
        where: tenantFilter(ctx.companyId, false),
        orderBy: { code: "desc" },
      });

      const employees = await ctx.prisma.employee.findMany({
        where: { ...tenantFilter(ctx.companyId, false), status: "ACTIVE" },
      });

      return ctx.prisma.payroll.create({
        data: {
          code: (lastPayroll?.code || 0) + 1,
          companyId: ctx.companyId,
          referenceMonth: input.referenceMonth,
          referenceYear: input.referenceYear,
          employeeCount: employees.length,
          items: {
            create: employees.map((emp) => ({
              employeeId: emp.id,
              baseSalary: emp.salary,
              grossSalary: emp.salary,
              netSalary: emp.salary,
            })),
          },
        },
      });
    }),

  // Calcular folha de pagamento
  calculatePayroll: tenantProcedure
    .input(z.object({ payrollId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const payroll = await ctx.prisma.payroll.findFirst({
        where: { id: input.payrollId, ...tenantFilter(ctx.companyId, false) },
        include: {
          items: {
            include: {
              employee: true,
              events: true,
            },
          },
        },
      });

      if (!payroll) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Folha não encontrada" });
      }

      let totalGross = 0;
      let totalNet = 0;
      let totalDeductions = 0;

      for (const item of payroll.items) {
        const baseSalary = item.baseSalary;
        
        // Calcular proventos
        const earnings = item.events
          .filter((e) => !e.isDeduction)
          .reduce((sum, e) => sum + Number(e.value), 0);
        
        // Calcular descontos (exceto INSS e IRRF)
        const otherDeductions = item.events
          .filter((e) => e.isDeduction && !["INSS", "IRRF"].includes(e.code))
          .reduce((sum, e) => sum + Number(e.value), 0);

        const grossSalary = Number(baseSalary) + earnings;
        
        // Calcular INSS (tabela simplificada 2024)
        const inss = calculateINSS(grossSalary);
        
        // Calcular IRRF (tabela simplificada 2024)
        const irrf = calculateIRRF(grossSalary - inss);
        
        // Calcular FGTS (8%)
        const fgts = grossSalary * 0.08;
        
        const itemDeductions = inss + irrf + otherDeductions;
        const netSalary = grossSalary - itemDeductions;

        // Atualizar item
        await ctx.prisma.payrollItem.update({
          where: { id: item.id },
          data: {
            grossSalary,
            inss,
            irrf,
            fgts,
            totalDeductions: itemDeductions,
            netSalary,
          },
        });

        totalGross += grossSalary;
        totalNet += netSalary;
        totalDeductions += itemDeductions;
      }

      // Atualizar totais da folha
      return ctx.prisma.payroll.update({
        where: { id: input.payrollId },
        data: {
          totalGross,
          totalNet,
          totalDeductions,
          status: "PROCESSED",
          processedAt: new Date(),
          processedBy: ctx.tenant.userId,
        },
      });
    }),

  // Adicionar evento à folha de um funcionário
  addPayrollEvent: tenantProcedure
    .input(z.object({
      payrollItemId: z.string(),
      code: z.string(),
      description: z.string(),
      isDeduction: z.boolean().default(false),
      value: z.number(),
      reference: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      return ctx.prisma.payrollEvent.create({
        data: {
          payrollItemId: input.payrollItemId,
          code: input.code,
          description: input.description,
          type: input.isDeduction ? "DEDUCTION" : "ALLOWANCE",
          isDeduction: input.isDeduction,
          value: input.value,
          reference: input.reference,
        },
      });
    }),

  // Remover evento da folha
  removePayrollEvent: tenantProcedure
    .input(z.object({ eventId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      return ctx.prisma.payrollEvent.delete({
        where: { id: input.eventId },
      });
    }),

  // Aprovar folha de pagamento
  approvePayroll: tenantProcedure
    .input(z.object({ payrollId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const payroll = await ctx.prisma.payroll.findFirst({
        where: { id: input.payrollId, ...tenantFilter(ctx.companyId, false) },
      });

      if (!payroll) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Folha não encontrada" });
      }

      if (payroll.status !== "PROCESSED") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Folha precisa ser processada antes de aprovar" });
      }

      return ctx.prisma.payroll.update({
        where: { id: input.payrollId },
        data: {
          status: "APPROVED",
          approvedAt: new Date(),
          approvedBy: ctx.tenant.userId,
        },
      });
    }),

  // Resumo da folha
  payrollSummary: tenantProcedure
    .input(z.object({ payrollId: z.string() }))
    .query(async ({ input, ctx }) => {
      const payroll = await ctx.prisma.payroll.findFirst({
        where: { id: input.payrollId, ...tenantFilter(ctx.companyId, false) },
        include: {
          items: {
            include: {
              employee: { select: { id: true, name: true, department: { select: { name: true } } } },
              events: true,
            },
          },
        },
      });

      if (!payroll) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Folha não encontrada" });
      }

      // Agrupar por departamento
      const byDepartment = payroll.items.reduce((acc, item) => {
        const dept = item.employee.department?.name || "Sem Departamento";
        if (!acc[dept]) {
          acc[dept] = { count: 0, gross: 0, net: 0 };
        }
        acc[dept].count++;
        acc[dept].gross += Number(item.grossSalary);
        acc[dept].net += Number(item.netSalary);
        return acc;
      }, {} as Record<string, { count: number; gross: number; net: number }>);

      // Resumo de eventos
      const allEvents = payroll.items.flatMap((i) => i.events);
      const eventSummary = allEvents.reduce((acc, event) => {
        if (!acc[event.code]) {
          acc[event.code] = { description: event.description, isDeduction: event.isDeduction, total: 0, count: 0 };
        }
        acc[event.code].total += Number(event.value);
        acc[event.code].count++;
        return acc;
      }, {} as Record<string, { description: string; isDeduction: boolean; total: number; count: number }>);

      // Totais de INSS, IRRF e FGTS
      const totals = payroll.items.reduce((acc, item) => {
        acc.inss += Number(item.inss);
        acc.irrf += Number(item.irrf);
        acc.fgts += Number(item.fgts);
        return acc;
      }, { inss: 0, irrf: 0, fgts: 0 });

      return {
        payroll,
        byDepartment: Object.entries(byDepartment).map(([name, data]) => ({ name, ...data })),
        eventSummary: Object.entries(eventSummary).map(([code, data]) => ({ code, ...data })),
        totals,
      };
    }),

  // ==========================================================================
  // DASHBOARD
  // ==========================================================================
  dashboard: tenantProcedure.query(async ({ ctx }) => {
    const [totalEmployees, byStatus, byDepartment, recentHires] = await Promise.all([
      ctx.prisma.employee.count({ where: tenantFilter(ctx.companyId, false) }),
      ctx.prisma.employee.groupBy({ by: ["status"], where: tenantFilter(ctx.companyId, false), _count: true }),
      ctx.prisma.employee.groupBy({
        by: ["departmentId"],
        where: { ...tenantFilter(ctx.companyId, false), status: "ACTIVE" },
        _count: true,
      }),
      ctx.prisma.employee.findMany({
        where: { ...tenantFilter(ctx.companyId, false), status: "ACTIVE" },
        orderBy: { hireDate: "desc" },
        take: 5,
        select: { id: true, name: true, hireDate: true, position: { select: { name: true } } },
      }),
    ]);

    return { totalEmployees, byStatus, byDepartment, recentHires };
  }),
});
