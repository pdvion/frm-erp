import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, tenantProcedure, tenantFilter } from "../trpc";

// Helper para validar que funcionário pertence à empresa
async function validateEmployee(prisma: typeof import("@/lib/prisma").prisma, employeeId: string, companyId: string | null) {
  if (!companyId) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Empresa não selecionada" });
  }
  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, companyId },
  });
  if (!employee) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Funcionário não encontrado" });
  }
  return employee;
}

export const timeclockRouter = createTRPCRouter({
  // ============================================================================
  // MARCAÇÕES DE PONTO
  // ============================================================================
  
  clockIn: tenantProcedure
    .input(z.object({
      employeeId: z.string().uuid(),
      type: z.enum(["CLOCK_IN", "CLOCK_OUT", "BREAK_START", "BREAK_END"]),
      location: z.string().optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
      deviceId: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // VIO-558: Validar que funcionário pertence à empresa
      await validateEmployee(ctx.prisma, input.employeeId, ctx.tenant.companyId);

      return ctx.prisma.timeClockEntry.create({
        data: {
          employeeId: input.employeeId,
          type: input.type,
          timestamp: new Date(),
          location: input.location,
          latitude: input.latitude,
          longitude: input.longitude,
          deviceId: input.deviceId,
          ipAddress: ctx.headers.get("x-forwarded-for") || undefined,
          isManual: false,
        },
      });
    }),

  manualEntry: tenantProcedure
    .input(z.object({
      employeeId: z.string().uuid(),
      type: z.enum(["CLOCK_IN", "CLOCK_OUT", "BREAK_START", "BREAK_END"]),
      timestamp: z.date(),
      justification: z.string().min(10),
    }))
    .mutation(async ({ ctx, input }) => {
      // VIO-558: Validar que funcionário pertence à empresa
      await validateEmployee(ctx.prisma, input.employeeId, ctx.tenant.companyId);

      return ctx.prisma.timeClockEntry.create({
        data: {
          employeeId: input.employeeId,
          type: input.type,
          timestamp: input.timestamp,
          isManual: true,
          justification: input.justification,
        },
      });
    }),

  listEntries: tenantProcedure
    .input(z.object({
      employeeId: z.string().uuid().optional(),
      startDate: z.date(),
      endDate: z.date(),
      page: z.number().default(1),
      limit: z.number().default(50),
    }))
    .query(async ({ ctx, input }) => {
      // VIO-554: Aplicar filtro multi-tenant via employee.companyId
      const where = {
        employee: { companyId: ctx.tenant.companyId },
        timestamp: {
          gte: input.startDate,
          lte: input.endDate,
        },
        ...(input.employeeId && { employeeId: input.employeeId }),
      };

      const [entries, total] = await Promise.all([
        ctx.prisma.timeClockEntry.findMany({
          where,
          include: { employee: { select: { id: true, name: true, code: true } } },
          orderBy: { timestamp: "desc" },
          skip: (input.page - 1) * input.limit,
          take: input.limit,
        }),
        ctx.prisma.timeClockEntry.count({ where }),
      ]);

      return {
        entries,
        total,
        pages: Math.ceil(total / input.limit),
      };
    }),

  // ============================================================================
  // ESCALAS DE TRABALHO
  // ============================================================================

  listSchedules: tenantProcedure
    .input(z.object({
      search: z.string().optional(),
      isActive: z.boolean().optional(),
    }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.workSchedule.findMany({
        where: {
          ...tenantFilter(ctx.tenant.companyId),
          ...(input.search && {
            OR: [
              { name: { contains: input.search, mode: "insensitive" } },
              { code: { contains: input.search, mode: "insensitive" } },
            ],
          }),
          ...(input.isActive !== undefined && { isActive: input.isActive }),
        },
        include: {
          shifts: { orderBy: { dayOfWeek: "asc" } },
          _count: { select: { employees: true } },
        },
        orderBy: { name: "asc" },
      });
    }),

  getSchedule: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.workSchedule.findUnique({
        where: { id: input.id },
        include: {
          shifts: { orderBy: { dayOfWeek: "asc" } },
          employees: {
            where: { isActive: true },
            include: { schedule: true },
          },
        },
      });
    }),

  createSchedule: tenantProcedure
    .input(z.object({
      name: z.string().min(3),
      code: z.string().optional(),
      type: z.enum(["FIXED", "ROTATING", "FLEXIBLE", "SHIFT"]),
      description: z.string().optional(),
      weeklyHours: z.number().default(44),
      dailyHours: z.number().default(8),
      toleranceMinutes: z.number().default(10),
      shifts: z.array(z.object({
        dayOfWeek: z.number().min(0).max(6),
        startTime: z.string(),
        endTime: z.string(),
        breakStartTime: z.string().optional(),
        breakEndTime: z.string().optional(),
        breakDuration: z.number().default(60),
        isWorkDay: z.boolean().default(true),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      const { shifts, ...scheduleData } = input;
      
      return ctx.prisma.workSchedule.create({
        data: {
          ...scheduleData,
          companyId: ctx.tenant.companyId,
          shifts: {
            create: shifts,
          },
        },
        include: { shifts: true },
      });
    }),

  updateSchedule: tenantProcedure
    .input(z.object({
      id: z.string().uuid(),
      name: z.string().min(3).optional(),
      code: z.string().optional(),
      type: z.enum(["FIXED", "ROTATING", "FLEXIBLE", "SHIFT"]).optional(),
      description: z.string().optional(),
      weeklyHours: z.number().optional(),
      dailyHours: z.number().optional(),
      toleranceMinutes: z.number().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.prisma.workSchedule.update({
        where: { id },
        data,
      });
    }),

  assignSchedule: tenantProcedure
    .input(z.object({
      employeeId: z.string().uuid(),
      scheduleId: z.string().uuid(),
      startDate: z.date(),
      endDate: z.date().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Desativar escala anterior
      await ctx.prisma.employeeSchedule.updateMany({
        where: {
          employeeId: input.employeeId,
          isActive: true,
        },
        data: {
          isActive: false,
          endDate: input.startDate,
        },
      });

      return ctx.prisma.employeeSchedule.create({
        data: {
          employeeId: input.employeeId,
          scheduleId: input.scheduleId,
          startDate: input.startDate,
          endDate: input.endDate,
          isActive: true,
        },
      });
    }),

  // ============================================================================
  // BANCO DE HORAS
  // ============================================================================

  getHoursBalance: tenantProcedure
    .input(z.object({
      employeeId: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      // VIO-559: Validar que funcionário pertence à empresa
      await validateEmployee(ctx.prisma, input.employeeId, ctx.tenant.companyId);

      const lastEntry = await ctx.prisma.hoursBank.findFirst({
        where: { employeeId: input.employeeId, companyId: ctx.tenant.companyId },
        orderBy: { date: "desc" },
      });

      const movements = await ctx.prisma.hoursBank.findMany({
        where: { employeeId: input.employeeId, companyId: ctx.tenant.companyId },
        orderBy: { date: "desc" },
        take: 30,
      });

      return {
        balance: lastEntry?.balance || 0,
        movements,
      };
    }),

  listHoursBank: tenantProcedure
    .input(z.object({
      employeeId: z.string().uuid().optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
      page: z.number().default(1),
      limit: z.number().default(50),
    }))
    .query(async ({ ctx, input }) => {
      const where = {
        ...tenantFilter(ctx.tenant.companyId),
        ...(input.employeeId && { employeeId: input.employeeId }),
        ...(input.startDate && input.endDate && {
          date: { gte: input.startDate, lte: input.endDate },
        }),
      };

      const [entries, total] = await Promise.all([
        ctx.prisma.hoursBank.findMany({
          where,
          orderBy: { date: "desc" },
          skip: (input.page - 1) * input.limit,
          take: input.limit,
        }),
        ctx.prisma.hoursBank.count({ where }),
      ]);

      return { entries, total, pages: Math.ceil(total / input.limit) };
    }),

  addHoursBankEntry: tenantProcedure
    .input(z.object({
      employeeId: z.string().uuid(),
      type: z.enum(["CREDIT", "DEBIT", "COMPENSATION", "EXPIRATION", "ADJUSTMENT"]),
      date: z.date(),
      hours: z.number(),
      description: z.string().optional(),
      expiresAt: z.date().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Buscar saldo atual
      const lastEntry = await ctx.prisma.hoursBank.findFirst({
        where: { employeeId: input.employeeId },
        orderBy: { date: "desc" },
      });

      const currentBalance = lastEntry?.balance || 0;
      const newBalance = currentBalance + input.hours;

      return ctx.prisma.hoursBank.create({
        data: {
          companyId: ctx.tenant.companyId,
          employeeId: input.employeeId,
          type: input.type,
          date: input.date,
          hours: input.hours,
          balance: newBalance,
          description: input.description,
          expiresAt: input.expiresAt,
          approvedBy: ctx.tenant.userId,
          approvedAt: new Date(),
        },
      });
    }),

  // ============================================================================
  // AJUSTES DE PONTO
  // ============================================================================

  listAdjustments: tenantProcedure
    .input(z.object({
      employeeId: z.string().uuid().optional(),
      status: z.enum(["PENDING", "APPROVED", "REJECTED", "ALL"]).default("ALL"),
      page: z.number().default(1),
      limit: z.number().default(20),
    }))
    .query(async ({ ctx, input }) => {
      const where = {
        ...tenantFilter(ctx.tenant.companyId),
        ...(input.employeeId && { employeeId: input.employeeId }),
        ...(input.status !== "ALL" && { status: input.status }),
      };

      const [adjustments, total] = await Promise.all([
        ctx.prisma.timeClockAdjustment.findMany({
          where,
          orderBy: { requestedAt: "desc" },
          skip: (input.page - 1) * input.limit,
          take: input.limit,
        }),
        ctx.prisma.timeClockAdjustment.count({ where }),
      ]);

      return { adjustments, total, pages: Math.ceil(total / input.limit) };
    }),

  requestAdjustment: tenantProcedure
    .input(z.object({
      employeeId: z.string().uuid(),
      date: z.date(),
      adjustmentType: z.enum(["ADD", "MODIFY", "DELETE"]),
      clockType: z.enum(["CLOCK_IN", "CLOCK_OUT", "BREAK_START", "BREAK_END"]),
      originalEntryId: z.string().uuid().optional(),
      originalTime: z.date().optional(),
      newTime: z.date().optional(),
      reason: z.string().min(10),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.timeClockAdjustment.create({
        data: {
          companyId: ctx.tenant.companyId,
          employeeId: input.employeeId,
          date: input.date,
          adjustmentType: input.adjustmentType,
          clockType: input.clockType,
          originalEntryId: input.originalEntryId,
          originalTime: input.originalTime,
          newTime: input.newTime,
          reason: input.reason,
          status: "PENDING",
          requestedBy: ctx.tenant.userId,
        },
      });
    }),

  reviewAdjustment: tenantProcedure
    .input(z.object({
      id: z.string().uuid(),
      approved: z.boolean(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const adjustment = await ctx.prisma.timeClockAdjustment.update({
        where: { id: input.id },
        data: {
          status: input.approved ? "APPROVED" : "REJECTED",
          reviewedBy: ctx.tenant.userId,
          reviewedAt: new Date(),
          reviewNotes: input.notes,
        },
      });

      // Se aprovado, aplicar o ajuste
      if (input.approved && adjustment.adjustmentType === "ADD" && adjustment.newTime) {
        await ctx.prisma.timeClockEntry.create({
          data: {
            employeeId: adjustment.employeeId,
            type: adjustment.clockType,
            timestamp: adjustment.newTime,
            isManual: true,
            justification: `Ajuste aprovado: ${adjustment.reason}`,
            approvedBy: ctx.tenant.userId,
            approvedAt: new Date(),
          },
        });
      }

      return adjustment;
    }),

  // ============================================================================
  // FERIADOS
  // ============================================================================

  listHolidays: tenantProcedure
    .input(z.object({
      year: z.number().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const year = input.year || new Date().getFullYear();
      const startDate = new Date(year, 0, 1);
      const endDate = new Date(year, 11, 31);

      return ctx.prisma.holiday.findMany({
        where: {
          OR: [
            { companyId: ctx.tenant.companyId },
            { companyId: null },
          ],
          date: { gte: startDate, lte: endDate },
        },
        orderBy: { date: "asc" },
      });
    }),

  createHoliday: tenantProcedure
    .input(z.object({
      date: z.date(),
      name: z.string().min(3),
      type: z.enum(["NATIONAL", "STATE", "MUNICIPAL", "COMPANY"]),
      isOptional: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.holiday.create({
        data: {
          companyId: input.type === "COMPANY" ? ctx.tenant.companyId : null,
          date: input.date,
          name: input.name,
          type: input.type,
          isOptional: input.isOptional,
        },
      });
    }),

  deleteHoliday: tenantProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.holiday.delete({ where: { id: input.id } });
    }),

  // ============================================================================
  // ESPELHO DE PONTO
  // ============================================================================

  getTimesheet: tenantProcedure
    .input(z.object({
      employeeId: z.string().uuid(),
      month: z.number().min(1).max(12),
      year: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const startDate = new Date(input.year, input.month - 1, 1);
      const endDate = new Date(input.year, input.month, 0);

      const [days, entries, employee] = await Promise.all([
        ctx.prisma.timesheetDay.findMany({
          where: {
            employeeId: input.employeeId,
            date: { gte: startDate, lte: endDate },
          },
          orderBy: { date: "asc" },
        }),
        ctx.prisma.timeClockEntry.findMany({
          where: {
            employeeId: input.employeeId,
            timestamp: { gte: startDate, lte: endDate },
          },
          orderBy: { timestamp: "asc" },
        }),
        ctx.prisma.employee.findUnique({
          where: { id: input.employeeId },
          select: { id: true, name: true, code: true, department: true },
        }),
      ]);

      // Agrupar entradas por dia
      const entriesByDay: Record<string, typeof entries> = {};
      entries.forEach((entry) => {
        const dateKey = entry.timestamp.toISOString().split("T")[0];
        if (!entriesByDay[dateKey]) entriesByDay[dateKey] = [];
        entriesByDay[dateKey].push(entry);
      });

      // Calcular totais
      const totals = days.reduce(
        (acc, day) => ({
          scheduledHours: acc.scheduledHours + day.scheduledHours,
          workedHours: acc.workedHours + day.workedHours,
          overtimeHours: acc.overtimeHours + day.overtimeHours,
          nightHours: acc.nightHours + day.nightHours,
          absenceHours: acc.absenceHours + day.absenceHours,
        }),
        { scheduledHours: 0, workedHours: 0, overtimeHours: 0, nightHours: 0, absenceHours: 0 }
      );

      return {
        employee,
        month: input.month,
        year: input.year,
        days,
        entriesByDay,
        totals,
      };
    }),

  processTimesheet: tenantProcedure
    .input(z.object({
      employeeId: z.string().uuid(),
      month: z.number().min(1).max(12),
      year: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const startDate = new Date(input.year, input.month - 1, 1);
      const endDate = new Date(input.year, input.month, 0);

      // Buscar marcações do período
      const entries = await ctx.prisma.timeClockEntry.findMany({
        where: {
          employeeId: input.employeeId,
          timestamp: { gte: startDate, lte: endDate },
        },
        orderBy: { timestamp: "asc" },
      });

      // Buscar feriados
      const holidays = await ctx.prisma.holiday.findMany({
        where: {
          date: { gte: startDate, lte: endDate },
          OR: [
            { companyId: ctx.tenant.companyId },
            { companyId: null },
          ],
        },
      });

      const holidayDates = new Set(holidays.map((h) => h.date.toISOString().split("T")[0]));

      // Processar cada dia
      const daysToUpsert: Array<{
        employeeId: string;
        date: Date;
        scheduledHours: number;
        workedHours: number;
        overtimeHours: number;
        nightHours: number;
        absenceHours: number;
        isHoliday: boolean;
        isWeekend: boolean;
        status: string;
      }> = [];

      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateKey = d.toISOString().split("T")[0];
        const dayOfWeek = d.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const isHoliday = holidayDates.has(dateKey);

        const dayEntries = entries.filter(
          (e) => e.timestamp.toISOString().split("T")[0] === dateKey
        );

        let workedHours = 0;
        let nightHours = 0;

        // Calcular horas trabalhadas e horas noturnas (22h-5h)
        const clockIns = dayEntries.filter((e) => e.type === "CLOCK_IN");
        const clockOuts = dayEntries.filter((e) => e.type === "CLOCK_OUT");

        for (let i = 0; i < Math.min(clockIns.length, clockOuts.length); i++) {
          const inTime = clockIns[i].timestamp;
          const outTime = clockOuts[i].timestamp;
          const diff = (outTime.getTime() - inTime.getTime()) / 3600000;
          workedHours += diff;

          // Calcular horas noturnas (22h-5h) - adicional noturno CLT
          const inHour = inTime.getHours();
          const outHour = outTime.getHours();
          
          // Simplificado: verificar se período inclui horário noturno
          if (inHour >= 22 || inHour < 5 || outHour >= 22 || outHour < 5) {
            // Calcular interseção com período noturno
            const nightStart = 22;
            const nightEnd = 5;
            
            let nightMinutes = 0;
            const startMinutes = inHour * 60 + inTime.getMinutes();
            const endMinutes = outHour * 60 + outTime.getMinutes();
            
            // Período noturno: 22:00-23:59 e 00:00-05:00
            if (startMinutes >= nightStart * 60) {
              nightMinutes += Math.min(endMinutes, 24 * 60) - startMinutes;
            }
            if (endMinutes <= nightEnd * 60) {
              nightMinutes += endMinutes - Math.max(startMinutes, 0);
            }
            
            nightHours += Math.max(0, nightMinutes / 60);
          }
        }

        const scheduledHours = isWeekend || isHoliday ? 0 : 8;
        const overtimeHours = Math.max(0, workedHours - scheduledHours);
        const absenceHours = Math.max(0, scheduledHours - workedHours);

        daysToUpsert.push({
          employeeId: input.employeeId,
          date: new Date(d),
          scheduledHours,
          workedHours,
          overtimeHours,
          nightHours,
          absenceHours,
          isHoliday,
          isWeekend,
          status: "PROCESSED",
        });
      }

      // VIO-555: Usar transaction para batch de upserts (mais eficiente)
      await ctx.prisma.$transaction(
        daysToUpsert.map((day) =>
          ctx.prisma.timesheetDay.upsert({
            where: {
              employeeId_date: {
                employeeId: day.employeeId,
                date: day.date,
              },
            },
            create: day,
            update: day,
          })
        )
      );

      return { processed: daysToUpsert.length };
    }),
});
