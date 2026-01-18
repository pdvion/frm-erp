import { z } from "zod";
import { createTRPCRouter, tenantProcedure, tenantFilter } from "../trpc";
import { Prisma } from "@prisma/client";

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
        include: { department: true, position: true, manager: { select: { id: true, name: true } } },
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

      return ctx.prisma.employee.create({
        data: { ...input, code: (lastEmployee?.code || 0) + 1, companyId: ctx.companyId, createdBy: ctx.tenant.userId },
      });
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
      return ctx.prisma.employee.update({ where: { id }, data });
    }),

  // ==========================================================================
  // PONTO
  // ==========================================================================
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
    .input(z.object({ year: z.number().optional() }).optional())
    .query(async ({ input, ctx }) => {
      return ctx.prisma.payroll.findMany({
        where: { ...tenantFilter(ctx.companyId, false), ...(input?.year && { referenceYear: input.year }) },
        orderBy: [{ referenceYear: "desc" }, { referenceMonth: "desc" }],
      });
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
    .input(z.object({ referenceMonth: z.number().min(1).max(12), referenceYear: z.number() }))
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
