import { z } from "zod";
import { createTRPCRouter, tenantProcedure, tenantFilter } from "../trpc";
import { TRPCError } from "@trpc/server";

export const employeePortalRouter = createTRPCRouter({
  // Get current employee profile (based on logged user)
  getMyProfile: tenantProcedure.query(async ({ ctx }) => {
    const employee = await ctx.prisma.employee.findFirst({
      where: {
        userId: ctx.tenant.userId,
        ...tenantFilter(ctx.companyId, false),
      },
      include: {
        department: true,
        position: true,
      },
    });

    if (!employee) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Perfil de funcionário não encontrado",
      });
    }

    return employee;
  }),

  // Get my payslips (holerites)
  getMyPayslips: tenantProcedure
    .input(
      z.object({
        year: z.number().optional(),
        limit: z.number().min(1).max(24).default(12),
      })
    )
    .query(async ({ ctx, input }) => {
      const employee = await ctx.prisma.employee.findFirst({
        where: {
          userId: ctx.tenant.userId,
          ...tenantFilter(ctx.companyId, false),
        },
      });

      if (!employee) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Funcionário não encontrado",
        });
      }

      const payslips = await ctx.prisma.payrollItem.findMany({
        where: {
          employeeId: employee.id,
          payroll: {
            ...(input.year ? { referenceYear: input.year } : {}),
            ...tenantFilter(ctx.companyId, false),
          },
        },
        include: {
          payroll: {
            select: {
              id: true,
              referenceMonth: true,
              referenceYear: true,
              status: true,
            },
          },
        },
        orderBy: [
          { payroll: { referenceYear: "desc" } },
          { payroll: { referenceMonth: "desc" } },
        ],
        take: input.limit,
      });

      return payslips;
    }),

  // Get single payslip details
  getPayslipDetails: tenantProcedure
    .input(z.object({ payrollItemId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const employee = await ctx.prisma.employee.findFirst({
        where: {
          userId: ctx.tenant.userId,
          ...tenantFilter(ctx.companyId, false),
        },
      });

      if (!employee) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Funcionário não encontrado",
        });
      }

      const payslip = await ctx.prisma.payrollItem.findFirst({
        where: {
          id: input.payrollItemId,
          employeeId: employee.id,
          payroll: {
            ...tenantFilter(ctx.companyId, false),
          },
        },
        include: {
          payroll: true,
          employee: {
            include: {
              department: true,
              position: true,
            },
          },
        },
      });

      if (!payslip) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Holerite não encontrado",
        });
      }

      return payslip;
    }),

  // Get my vacation balance and history
  getMyVacations: tenantProcedure.query(async ({ ctx }) => {
    const employee = await ctx.prisma.employee.findFirst({
      where: {
        userId: ctx.tenant.userId,
        ...tenantFilter(ctx.companyId, false),
      },
    });

    if (!employee) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Funcionário não encontrado",
      });
    }

    const vacations = await ctx.prisma.vacation.findMany({
      where: {
        employeeId: employee.id,
        ...tenantFilter(ctx.companyId, false),
      },
      orderBy: { startDate: "desc" },
    });

    // Calculate vacation balance
    const hireDate = employee.hireDate;
    const now = new Date();
    const diffTime = now.getTime() - hireDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const monthsWorked = diffDays / 30.44; // Average days in a month
    const totalDaysEarned = Math.min(Math.floor(monthsWorked * 2.5), 30);
    const daysUsed = vacations
      .filter((v) => v.status === "APPROVED" || v.status === "COMPLETED")
      .reduce((sum, v) => sum + (v.enjoyedDays || 0), 0);
    const daysAvailable = Math.max(totalDaysEarned - daysUsed, 0);

    return {
      balance: {
        totalEarned: totalDaysEarned,
        used: daysUsed,
        available: daysAvailable,
        hireDate,
      },
      history: vacations,
    };
  }),

  // Request vacation
  requestVacation: tenantProcedure
    .input(
      z.object({
        startDate: z.string(),
        days: z.number().min(5).max(30),
        sellDays: z.number().min(0).max(10).default(0),
        advanceThirteenth: z.boolean().default(false),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const employee = await ctx.prisma.employee.findFirst({
        where: {
          userId: ctx.tenant.userId,
          ...tenantFilter(ctx.companyId, false),
        },
      });

      if (!employee) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Funcionário não encontrado",
        });
      }

      const startDate = new Date(input.startDate);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + input.days - 1);

      // Calculate acquisition period (last 12 months)
      const acquisitionEnd = new Date();
      const acquisitionStart = new Date();
      acquisitionStart.setFullYear(acquisitionStart.getFullYear() - 1);

      const vacation = await ctx.prisma.vacation.create({
        data: {
          employeeId: employee.id,
          startDate,
          endDate,
          totalDays: input.days,
          soldDays: input.sellDays,
          enjoyedDays: input.days - input.sellDays,
          acquisitionStart,
          acquisitionEnd,
          notes: input.notes,
          status: "SCHEDULED",
          companyId: ctx.companyId,
        },
      });

      return vacation;
    }),

  // Get my time clock records (espelho de ponto)
  getMyTimeRecords: tenantProcedure
    .input(
      z.object({
        month: z.number().min(1).max(12),
        year: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const employee = await ctx.prisma.employee.findFirst({
        where: {
          userId: ctx.tenant.userId,
          ...tenantFilter(ctx.companyId, false),
        },
      });

      if (!employee) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Funcionário não encontrado",
        });
      }

      const startDate = new Date(input.year, input.month - 1, 1);
      const endDate = new Date(input.year, input.month, 0);

      // Get timesheet days (consolidated daily records)
      const timesheetDays = await ctx.prisma.timesheetDay.findMany({
        where: {
          employeeId: employee.id,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { date: "asc" },
      });

      // Get individual clock entries for the month
      const clockEntries = await ctx.prisma.timeClockEntry.findMany({
        where: {
          employeeId: employee.id,
          timestamp: {
            gte: startDate,
            lte: new Date(endDate.getTime() + 24 * 60 * 60 * 1000),
          },
        },
        orderBy: { timestamp: "asc" },
      });

      // Group clock entries by date
      const entriesByDate = new Map<string, typeof clockEntries>();
      clockEntries.forEach((entry) => {
        const dateKey = entry.timestamp.toISOString().split("T")[0];
        if (!entriesByDate.has(dateKey)) {
          entriesByDate.set(dateKey, []);
        }
        entriesByDate.get(dateKey)!.push(entry);
      });

      // Build records with clock times
      const records = timesheetDays.map((day) => {
        const dateKey = day.date.toISOString().split("T")[0];
        const dayEntries = entriesByDate.get(dateKey) || [];

        const entryTime = dayEntries.find((e) => e.type === "CLOCK_IN");
        const lunchOut = dayEntries.find((e) => e.type === "BREAK_START");
        const lunchIn = dayEntries.find((e) => e.type === "BREAK_END");
        const exitTime = dayEntries.find((e) => e.type === "CLOCK_OUT");

        return {
          id: day.id,
          date: day.date.toISOString(),
          entryTime: entryTime
            ? entryTime.timestamp.toTimeString().slice(0, 5)
            : null,
          lunchOutTime: lunchOut
            ? lunchOut.timestamp.toTimeString().slice(0, 5)
            : null,
          lunchInTime: lunchIn
            ? lunchIn.timestamp.toTimeString().slice(0, 5)
            : null,
          exitTime: exitTime
            ? exitTime.timestamp.toTimeString().slice(0, 5)
            : null,
          workedHours: Math.floor(Number(day.workedHours)),
          workedMinutes: Math.round((Number(day.workedHours) % 1) * 60),
          overtimeHours: Math.floor(Number(day.overtimeHours)),
          overtimeMinutes: Math.round((Number(day.overtimeHours) % 1) * 60),
          status: day.status,
        };
      });

      // Calculate summary
      const totalWorkedHours = timesheetDays.reduce(
        (sum, d) => sum + Number(d.workedHours),
        0
      );
      const totalOvertimeHours = timesheetDays.reduce(
        (sum, d) => sum + Number(d.overtimeHours),
        0
      );
      const absences = timesheetDays.filter(
        (d) => d.status === "ABSENT"
      ).length;
      const lateArrivals = timesheetDays.filter(
        (d) => d.status === "LATE"
      ).length;
      const workDays = timesheetDays.filter(
        (d) => Number(d.workedHours) > 0
      ).length;

      return {
        records,
        summary: {
          totalWorkedHours: Math.floor(totalWorkedHours),
          totalWorkedMinutes: Math.round((totalWorkedHours % 1) * 60),
          totalOvertimeHours: Math.floor(totalOvertimeHours),
          totalOvertimeMinutes: Math.round((totalOvertimeHours % 1) * 60),
          absences,
          lateArrivals,
          workDays,
        },
      };
    }),

  // Register time clock (ponto)
  registerTimeClock: tenantProcedure
    .input(
      z.object({
        type: z.enum(["CLOCK_IN", "CLOCK_OUT", "BREAK_START", "BREAK_END"]),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const employee = await ctx.prisma.employee.findFirst({
        where: {
          userId: ctx.tenant.userId,
          ...tenantFilter(ctx.companyId, false),
        },
      });

      if (!employee) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Funcionário não encontrado",
        });
      }

      const now = new Date();

      // Create time clock entry
      const entry = await ctx.prisma.timeClockEntry.create({
        data: {
          employeeId: employee.id,
          type: input.type,
          timestamp: now,
          latitude: input.latitude,
          longitude: input.longitude,
        },
      });

      const timeString = now.toTimeString().slice(0, 5); // HH:MM

      // Also update or create TimesheetDay for today
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      await ctx.prisma.timesheetDay.upsert({
        where: {
          employeeId_date: {
            employeeId: employee.id,
            date: today,
          },
        },
        create: {
          employeeId: employee.id,
          date: today,
          status: "PENDING",
        },
        update: {
          updatedAt: now,
        },
      });

      return {
        success: true,
        type: input.type,
        time: timeString,
        entry,
      };
    }),

  // Get company announcements (placeholder - model not yet implemented)
  getAnnouncements: tenantProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async () => {
      // Announcement model not yet implemented
      return [];
    }),

  // Get my documents (placeholder - model not yet implemented)
  getMyDocuments: tenantProcedure.query(async () => {
    // Document model not yet implemented
    return [];
  }),

  // Update my profile (limited fields)
  updateMyProfile: tenantProcedure
    .input(
      z.object({
        phone: z.string().optional(),
        mobile: z.string().optional(),
        email: z.string().email().optional(),
        address: z.string().optional(),
        addressCity: z.string().optional(),
        addressState: z.string().optional(),
        addressZipCode: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const employee = await ctx.prisma.employee.findFirst({
        where: {
          userId: ctx.tenant.userId,
          ...tenantFilter(ctx.companyId, false),
        },
      });

      if (!employee) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Funcionário não encontrado",
        });
      }

      const updated = await ctx.prisma.employee.update({
        where: { id: employee.id },
        data: input,
      });

      return updated;
    }),

  // Get income report (informe de rendimentos)
  getIncomeReport: tenantProcedure
    .input(z.object({ year: z.number() }))
    .query(async ({ ctx, input }) => {
      const employee = await ctx.prisma.employee.findFirst({
        where: {
          userId: ctx.tenant.userId,
          ...tenantFilter(ctx.companyId, false),
        },
        include: {
          department: true,
          position: true,
        },
      });

      if (!employee) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Funcionário não encontrado",
        });
      }

      // Get all payroll items for the year
      const payrollItems = await ctx.prisma.payrollItem.findMany({
        where: {
          employeeId: employee.id,
          payroll: {
            referenceYear: input.year,
            status: "CLOSED",
          },
        },
        include: {
          payroll: true,
        },
      });

      // Calculate totals
      const totals = payrollItems.reduce(
        (acc, item) => ({
          grossSalary: Number(acc.grossSalary) + (Number(item.grossSalary) || 0),
          inss: Number(acc.inss) + (Number(item.inss) || 0),
          irrf: Number(acc.irrf) + (Number(item.irrf) || 0),
          fgts: Number(acc.fgts) + (Number(item.fgts) || 0),
          netSalary: Number(acc.netSalary) + (Number(item.netSalary) || 0),
          totalDeductions: Number(acc.totalDeductions) + (Number(item.totalDeductions) || 0),
        }),
        {
          grossSalary: 0,
          inss: 0,
          irrf: 0,
          fgts: 0,
          netSalary: 0,
          totalDeductions: 0,
        }
      );

      return {
        year: input.year,
        employee: {
          name: employee.name,
          cpf: employee.cpf,
          department: employee.department?.name,
          position: employee.position?.name,
          hireDate: employee.hireDate,
        },
        totals,
        monthlyDetails: payrollItems.map((item) => ({
          month: item.payroll.referenceMonth,
          grossSalary: item.grossSalary,
          inss: item.inss,
          irrf: item.irrf,
          fgts: item.fgts,
          netSalary: item.netSalary,
        })),
      };
    }),
});
