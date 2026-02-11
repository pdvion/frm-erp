import { z } from "zod";
import { createTRPCRouter, tenantProcedure, tenantFilter } from "../trpc";
import { TRPCError } from "@trpc/server";
import { auditUpdate } from "../services/audit";
import { PayrollService, calculateWorkingDays } from "../services/payroll";

// =============================================================================
// ROUTER
// =============================================================================

export const payrollRouter = createTRPCRouter({
  // ==========================================================================
  // CÁLCULO AVANÇADO DE FOLHA
  // ==========================================================================
  calculateAdvanced: tenantProcedure
    .input(
      z.object({
        payrollId: z.string().uuid(),
        options: z
          .object({
            includeOvertime: z.boolean().default(true),
            includeNightShift: z.boolean().default(true),
            includeInsalubrity: z.boolean().default(true),
            includeDangerousness: z.boolean().default(true),
            includeDSR: z.boolean().default(true),
            includeVacationAdvance: z.boolean().default(false),
            includeThirteenthAdvance: z.boolean().default(false),
          })
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const payroll = await ctx.prisma.payroll.findFirst({
        where: { id: input.payrollId, ...tenantFilter(ctx.companyId, false) },
        include: {
          items: {
            include: {
              employee: {
                include: {
                  position: true,
                  department: true,
                },
              },
              events: true,
            },
          },
        },
      });

      if (!payroll) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Folha não encontrada" });
      }

      if (payroll.status !== "DRAFT") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Apenas folhas em rascunho podem ser calculadas",
        });
      }

      const defaultOptions = {
        includeOvertime: true,
        includeNightShift: true,
        includeInsalubrity: true,
        includeDangerousness: true,
        includeDSR: true,
        includeVacationAdvance: false,
        includeThirteenthAdvance: false,
      };
      const options = { ...defaultOptions, ...input.options };
      let totalGross = 0;
      let totalNet = 0;
      let totalDeductions = 0;
      let totalFGTS = 0;

      // Buscar dias úteis e feriados do mês
      const startOfMonth = new Date(payroll.referenceYear, payroll.referenceMonth - 1, 1);
      const endOfMonth = new Date(payroll.referenceYear, payroll.referenceMonth, 0);

      const holidays = await ctx.prisma.holiday.findMany({
        where: {
          ...tenantFilter(ctx.companyId, true),
          date: { gte: startOfMonth, lte: endOfMonth },
        },
      });

      const workingDays = calculateWorkingDays(
        payroll.referenceYear,
        payroll.referenceMonth,
        holidays.length,
      );

      const payrollService = new PayrollService(ctx.prisma);

      // Processar cada funcionário
      await ctx.prisma.$transaction(async (tx) => {
        for (const item of payroll.items) {
          const employee = item.employee;
          const baseSalary = Number(item.baseSalary || employee.salary || 0);

          // Buscar timesheet do funcionário para o mês
          const timesheetDays = await tx.timesheetDay.findMany({
            where: {
              employeeId: employee.id,
              date: { gte: startOfMonth, lte: endOfMonth },
            },
          });

          // Agregar dados do timesheet
          const timesheetData = {
            workedHours: timesheetDays.reduce((sum, day) => sum + (Number(day.workedHours) || 0), 0),
            overtimeHours50: timesheetDays.reduce((sum, day) => sum + (Number(day.overtime50) || 0), 0),
            overtimeHours100: timesheetDays.reduce((sum, day) => sum + (Number(day.overtime100) || 0), 0),
            nightHours: timesheetDays.reduce((sum, day) => sum + (Number(day.nightHours) || 0), 0),
            absenceDays: timesheetDays.filter((day) => day.status === "ABSENCE").length,
          };

          // Outros descontos existentes (VT, VR, etc)
          const existingDeductions = item.events
            .filter((e) => e.isDeduction && !["201", "202"].includes(e.code))
            .reduce((sum, e) => sum + Number(e.value), 0);

          // Delegar cálculo ao PayrollService
          const result = payrollService.calculateEmployeePayroll(
            {
              baseSalary,
              insalubrityDegree: employee.insalubrityDegree,
              hasDangerousness: employee.hasDangerousness ?? false,
              dependentsCount: employee.dependentsCount ?? 0,
              existingDeductions,
              timesheetData,
            },
            options,
            workingDays,
          );

          // Limpar eventos antigos e criar novos
          await tx.payrollEvent.deleteMany({ where: { payrollItemId: item.id } });

          await tx.payrollEvent.createMany({
            data: result.events.map((e) => ({
              payrollItemId: item.id,
              ...e,
            })),
          });

          // Atualizar item
          await tx.payrollItem.update({
            where: { id: item.id },
            data: {
              workedDays: result.workedDays,
              workedHours: result.workedHours,
              overtimeHours: result.overtimeHours,
              nightHours: result.nightHours,
              absenceDays: result.absenceDays,
              grossSalary: result.grossSalary,
              inss: result.inss,
              irrf: result.irrf,
              fgts: result.fgts,
              totalDeductions: result.totalDeductions,
              netSalary: result.netSalary,
            },
          });

          totalGross += result.grossSalary;
          totalNet += result.netSalary;
          totalDeductions += result.totalDeductions;
          totalFGTS += result.fgts;
        }

        // Atualizar totais da folha
        await tx.payroll.update({
          where: { id: input.payrollId },
          data: {
            totalGross,
            totalNet,
            totalDeductions,
            status: "CALCULATED",
            processedAt: new Date(),
            processedBy: ctx.tenant.userId ?? undefined,
          },
        });
      });

      const updated = await ctx.prisma.payroll.findUnique({
        where: { id: input.payrollId },
        include: { items: { include: { employee: { select: { name: true } } } } },
      });

      if (updated) {
        await auditUpdate(
          "Payroll",
          input.payrollId,
          `Folha ${payroll.referenceMonth}/${payroll.referenceYear}`,
          payroll,
          updated,
          { userId: ctx.tenant.userId ?? undefined, companyId: ctx.companyId }
        );
      }

      return {
        payrollId: input.payrollId,
        totalGross,
        totalNet,
        totalDeductions,
        totalFGTS,
        employeeCount: payroll.items.length,
      };
    }),

  // ==========================================================================
  // HOLERITE (DEMONSTRATIVO DE PAGAMENTO)
  // ==========================================================================
  getPayslip: tenantProcedure
    .input(z.object({ payrollItemId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const item = await ctx.prisma.payrollItem.findFirst({
        where: {
          id: input.payrollItemId,
          payroll: tenantFilter(ctx.companyId, false),
        },
        include: {
          payroll: true,
          employee: {
            include: {
              department: true,
              position: true,
            },
          },
          events: { orderBy: { code: "asc" } },
        },
      });

      if (!item) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Holerite não encontrado" });
      }

      const earnings = item.events.filter((e) => !e.isDeduction);
      const deductions = item.events.filter((e) => e.isDeduction);

      return {
        employee: {
          id: item.employee.id,
          code: item.employee.code,
          name: item.employee.name,
          cpf: item.employee.cpf,
          department: item.employee.department?.name,
          position: item.employee.position?.name,
          hireDate: item.employee.hireDate,
        },
        period: {
          month: item.payroll.referenceMonth,
          year: item.payroll.referenceYear,
        },
        summary: {
          baseSalary: item.baseSalary,
          workedDays: item.workedDays,
          workedHours: item.workedHours,
          overtimeHours: item.overtimeHours,
          nightHours: item.nightHours,
          absenceDays: item.absenceDays,
        },
        earnings,
        deductions,
        totals: {
          grossSalary: item.grossSalary,
          totalDeductions: item.totalDeductions,
          netSalary: item.netSalary,
          fgts: item.fgts,
          inss: item.inss,
          irrf: item.irrf,
        },
      };
    }),

  // ==========================================================================
  // RESUMO ENCARGOS
  // ==========================================================================
  getChargesSummary: tenantProcedure
    .input(z.object({ payrollId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const payroll = await ctx.prisma.payroll.findFirst({
        where: { id: input.payrollId, ...tenantFilter(ctx.companyId, false) },
        include: {
          items: {
            include: {
              employee: { select: { name: true, department: { select: { name: true } } } },
            },
          },
        },
      });

      if (!payroll) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Folha não encontrada" });
      }

      const payrollService = new PayrollService(ctx.prisma);
      const charges = payrollService.calculateChargesSummary(payroll.items);

      return {
        period: { month: payroll.referenceMonth, year: payroll.referenceYear },
        employeeCount: payroll.employeeCount,
        grossTotal: payroll.totalGross,
        netTotal: payroll.totalNet,
        charges: {
          inssEmployee: charges.inssEmployee,
          irrfEmployee: charges.irrfEmployee,
          fgts: charges.fgts,
          inssPatronal: charges.inssPatronal,
          rat: charges.rat,
          terceiros: charges.terceiros,
          totalEncargos: charges.totalEncargos,
        },
        provisions: {
          ferias: charges.provisaoFerias,
          thirteenth: charges.provisao13,
          total: charges.provisaoTotal,
        },
        totalCost:
          Number(payroll.totalGross) + charges.totalEncargos + charges.provisaoTotal,
      };
    }),

  // ==========================================================================
  // MARCAR COMO PAGA
  // ==========================================================================
  markAsPaid: tenantProcedure
    .input(
      z.object({
        payrollId: z.string().uuid(),
        paymentDate: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const payroll = await ctx.prisma.payroll.findFirst({
        where: { id: input.payrollId, ...tenantFilter(ctx.companyId, false) },
      });

      if (!payroll) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Folha não encontrada" });
      }

      if (payroll.status !== "APPROVED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Folha precisa estar aprovada para ser marcada como paga",
        });
      }

      const updated = await ctx.prisma.payroll.update({
        where: { id: input.payrollId },
        data: {
          status: "PAID",
          paidAt: input.paymentDate ?? new Date(),
        },
      });

      await auditUpdate(
        "Payroll",
        input.payrollId,
        `Folha ${payroll.referenceMonth}/${payroll.referenceYear}`,
        payroll,
        updated,
        { userId: ctx.tenant.userId ?? undefined, companyId: ctx.companyId }
      );

      return updated;
    }),

  // ==========================================================================
  // GERAR ARQUIVO BANCÁRIO (CNAB)
  // ==========================================================================
  generateBankFile: tenantProcedure
    .input(
      z.object({
        payrollId: z.string().uuid(),
        bankAccountId: z.string().uuid(),
        paymentDate: z.date(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const payroll = await ctx.prisma.payroll.findFirst({
        where: { id: input.payrollId, ...tenantFilter(ctx.companyId, false) },
        include: {
          items: {
            include: {
              employee: {
                select: {
                  id: true,
                  name: true,
                  cpf: true,
                  bankCode: true,
                  bankAgency: true,
                  bankAccount: true,
                  bankAccountDigit: true,
                },
              },
            },
          },
        },
      });

      if (!payroll) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Folha não encontrada" });
      }

      if (payroll.status !== "APPROVED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Folha precisa estar aprovada para gerar arquivo bancário",
        });
      }

      const bankAccount = await ctx.prisma.bankAccount.findFirst({
        where: { id: input.bankAccountId, ...tenantFilter(ctx.companyId, false) },
      });

      if (!bankAccount) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Conta bancária não encontrada" });
      }

      // Gerar linhas do arquivo CNAB 240
      const lines: string[] = [];
      let sequentialNumber = 1;

      // Header do arquivo
      lines.push(
        `${bankAccount.bankCode}`.padStart(3, "0") +
          "0000" +
          "0" +
          " ".repeat(9) +
          "2" +
          `${ctx.companyId}`.substring(0, 14).padStart(14, "0") +
          " ".repeat(20) +
          `${bankAccount.agency}`.padStart(5, "0") +
          " " +
          `${bankAccount.accountNumber}`.padStart(12, "0") +
          " " +
          "FRM ERP".padEnd(30, " ") +
          `${bankAccount.bankName || "BANCO"}`.padEnd(30, " ") +
          " ".repeat(10) +
          "1" +
          new Date().toISOString().slice(0, 10).replace(/-/g, "") +
          new Date().toTimeString().slice(0, 8).replace(/:/g, "") +
          `${sequentialNumber}`.padStart(6, "0") +
          "089" +
          "00000" +
          " ".repeat(20) +
          " ".repeat(20) +
          " ".repeat(29)
      );

      // Detalhes (simplificado)
      for (const item of payroll.items) {
        if (!item.employee.bankCode || !item.employee.bankAccount) continue;

        sequentialNumber++;
        lines.push(
          `${bankAccount.bankCode}`.padStart(3, "0") +
            "0001" +
            "3" +
            `${sequentialNumber}`.padStart(5, "0") +
            "A" +
            "000" +
            "01" +
            `${item.employee.bankCode}`.padStart(3, "0") +
            `${item.employee.bankAgency || ""}`.padStart(5, "0") +
            " " +
            `${item.employee.bankAccount}`.padStart(12, "0") +
            `${item.employee.bankAccountDigit || ""}`.padStart(1, " ") +
            `${item.employee.name}`.padEnd(30, " ").substring(0, 30) +
            " ".repeat(10) +
            input.paymentDate.toISOString().slice(0, 10).replace(/-/g, "") +
            "BRL" +
            "000000000000000" +
            `${Math.round(Number(item.netSalary) * 100)}`.padStart(15, "0") +
            " ".repeat(20) +
            " ".repeat(40) +
            "00" +
            " ".repeat(10)
        );
      }

      // Trailer
      lines.push(
        `${bankAccount.bankCode}`.padStart(3, "0") +
          "9999" +
          "9" +
          " ".repeat(9) +
          `${sequentialNumber + 1}`.padStart(6, "0") +
          " ".repeat(211)
      );

      return {
        filename: `FOLHA_${payroll.referenceMonth}_${payroll.referenceYear}.rem`,
        content: lines.join("\r\n"),
        recordCount: payroll.items.length,
        totalValue: payroll.totalNet,
      };
    }),

  // ==========================================================================
  // ESTATÍSTICAS
  // ==========================================================================
  stats: tenantProcedure
    .input(z.object({ year: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const year = input?.year ?? new Date().getFullYear();

      const payrolls = await ctx.prisma.payroll.findMany({
        where: {
          ...tenantFilter(ctx.companyId, false),
          referenceYear: year,
        },
        orderBy: { referenceMonth: "asc" },
      });

      const monthlyData = payrolls.map((p) => ({
        month: p.referenceMonth,
        year: p.referenceYear,
        status: p.status,
        employeeCount: p.employeeCount,
        totalGross: p.totalGross,
        totalNet: p.totalNet,
        totalDeductions: p.totalDeductions,
      }));

      const totals = payrolls.reduce(
        (acc, p) => ({
          gross: Number(acc.gross) + Number(p.totalGross),
          net: Number(acc.net) + Number(p.totalNet),
          deductions: acc.deductions + Number(p.totalDeductions),
        }),
        { gross: 0, net: 0, deductions: 0 }
      );

      return {
        year,
        monthlyData,
        totals,
        averagePerMonth: {
          gross: payrolls.length > 0 ? totals.gross / payrolls.length : 0,
          net: payrolls.length > 0 ? totals.net / payrolls.length : 0,
        },
      };
    }),
});
