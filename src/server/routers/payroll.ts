import { z } from "zod";
import { createTRPCRouter, tenantProcedure, tenantFilter } from "../trpc";
import { TRPCError } from "@trpc/server";
import { auditUpdate } from "../services/audit";

// =============================================================================
// TABELAS DE CÁLCULO 2024
// =============================================================================

// Tabela INSS 2024 (progressiva)
function calculateINSS(salary: number): number {
  if (salary <= 1412.0) return salary * 0.075;
  if (salary <= 2666.68) return 105.9 + (salary - 1412.0) * 0.09;
  if (salary <= 4000.03) return 218.82 + (salary - 2666.68) * 0.12;
  if (salary <= 7786.02) return 378.82 + (salary - 4000.03) * 0.14;
  return 908.85; // Teto
}

// Tabela IRRF 2024
function calculateIRRF(baseCalculo: number, dependentes: number = 0): number {
  // Dedução por dependente: R$ 189,59
  const deducaoDependentes = dependentes * 189.59;
  const base = baseCalculo - deducaoDependentes;

  if (base <= 2259.2) return 0;
  if (base <= 2826.65) return base * 0.075 - 169.44;
  if (base <= 3751.05) return base * 0.15 - 381.44;
  if (base <= 4664.68) return base * 0.225 - 662.77;
  return base * 0.275 - 896.0;
}

// Calcular DSR (Descanso Semanal Remunerado)
function calculateDSR(
  horasExtras: number,
  valorHoraExtra: number,
  diasUteis: number,
  domingosEFeriados: number
): number {
  if (diasUteis === 0) return 0;
  return (horasExtras * valorHoraExtra * domingosEFeriados) / diasUteis;
}

// Calcular adicional noturno (20% sobre hora normal, entre 22h e 5h)
function calculateNightShiftBonus(nightHours: number, hourlyRate: number): number {
  return nightHours * hourlyRate * 0.2;
}

// Calcular hora reduzida noturna (52:30 = 0.875 hora)
function calculateNightHoursReduction(nightHours: number): number {
  return nightHours * (60 / 52.5 - 1);
}

// Calcular insalubridade
function calculateInsalubrity(
  baseSalary: number,
  minimumWage: number,
  degree: "LOW" | "MEDIUM" | "HIGH" | null
): number {
  if (!degree) return 0;
  const percentages = { LOW: 0.1, MEDIUM: 0.2, HIGH: 0.4 };
  return minimumWage * percentages[degree];
}

// Calcular periculosidade (30% sobre salário base)
function calculateDangerousness(baseSalary: number, hasDangerousness: boolean): number {
  return hasDangerousness ? baseSalary * 0.3 : 0;
}

// Salário mínimo 2024
const MINIMUM_WAGE_2024 = 1412.0;

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
      const daysInMonth = endOfMonth.getDate();

      // Calcular dias úteis e domingos/feriados
      let diasUteis = 0;
      let domingosEFeriados = 0;
      for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(payroll.referenceYear, payroll.referenceMonth - 1, d);
        const dayOfWeek = date.getDay();
        if (dayOfWeek === 0) {
          domingosEFeriados++;
        } else if (dayOfWeek !== 6) {
          diasUteis++;
        }
      }

      // Buscar feriados do mês
      const holidays = await ctx.prisma.holiday.findMany({
        where: {
          ...tenantFilter(ctx.companyId, true),
          date: { gte: startOfMonth, lte: endOfMonth },
        },
      });
      domingosEFeriados += holidays.length;

      // Processar cada funcionário
      await ctx.prisma.$transaction(async (tx) => {
        for (const item of payroll.items) {
          const employee = item.employee;
          const baseSalary = item.baseSalary || employee.salary || 0;
          const hourlyRate = baseSalary / 220; // 220 horas mensais padrão

          // Buscar timesheet do funcionário para o mês
          const timesheetDays = await tx.timesheetDay.findMany({
            where: {
              employeeId: employee.id,
              date: { gte: startOfMonth, lte: endOfMonth },
            },
          });

          // Calcular horas trabalhadas
          const workedHours = timesheetDays.reduce((sum, day) => sum + (day.workedHours || 0), 0);
          const overtimeHours50 = timesheetDays.reduce(
            (sum, day) => sum + (day.overtime50 || 0),
            0
          );
          const overtimeHours100 = timesheetDays.reduce(
            (sum, day) => sum + (day.overtime100 || 0),
            0
          );
          const nightHours = timesheetDays.reduce((sum, day) => sum + (day.nightHours || 0), 0);
          const absenceDays = timesheetDays.filter((day) => day.status === "ABSENCE").length;

          // Eventos a criar
          const events: Array<{
            code: string;
            description: string;
            type: "ALLOWANCE" | "DEDUCTION";
            reference: number | null;
            value: number;
            isDeduction: boolean;
          }> = [];

          // 1. Salário Base
          let grossSalary = baseSalary;
          events.push({
            code: "001",
            description: "Salário Base",
            type: "ALLOWANCE",
            reference: null,
            value: baseSalary,
            isDeduction: false,
          });

          // 2. Horas Extras 50%
          if (options.includeOvertime && overtimeHours50 > 0) {
            const overtime50Value = overtimeHours50 * hourlyRate * 1.5;
            grossSalary += overtime50Value;
            events.push({
              code: "002",
              description: "Horas Extras 50%",
              type: "ALLOWANCE",
              reference: overtimeHours50,
              value: overtime50Value,
              isDeduction: false,
            });
          }

          // 3. Horas Extras 100%
          if (options.includeOvertime && overtimeHours100 > 0) {
            const overtime100Value = overtimeHours100 * hourlyRate * 2;
            grossSalary += overtime100Value;
            events.push({
              code: "003",
              description: "Horas Extras 100%",
              type: "ALLOWANCE",
              reference: overtimeHours100,
              value: overtime100Value,
              isDeduction: false,
            });
          }

          // 4. Adicional Noturno
          if (options.includeNightShift && nightHours > 0) {
            const nightBonus = calculateNightShiftBonus(nightHours, hourlyRate);
            const nightHoursReduction = calculateNightHoursReduction(nightHours);
            const nightReductionValue = nightHoursReduction * hourlyRate;
            grossSalary += nightBonus + nightReductionValue;
            events.push({
              code: "004",
              description: "Adicional Noturno",
              type: "ALLOWANCE",
              reference: nightHours,
              value: nightBonus + nightReductionValue,
              isDeduction: false,
            });
          }

          // 5. DSR sobre Horas Extras
          if (options.includeDSR && (overtimeHours50 > 0 || overtimeHours100 > 0)) {
            const totalOvertimeValue =
              overtimeHours50 * hourlyRate * 1.5 + overtimeHours100 * hourlyRate * 2;
            const dsrValue = calculateDSR(
              overtimeHours50 + overtimeHours100,
              totalOvertimeValue / (overtimeHours50 + overtimeHours100 || 1),
              diasUteis,
              domingosEFeriados
            );
            if (dsrValue > 0) {
              grossSalary += dsrValue;
              events.push({
                code: "005",
                description: "DSR sobre Horas Extras",
                type: "ALLOWANCE",
                reference: null,
                value: dsrValue,
                isDeduction: false,
              });
            }
          }

          // 6. Insalubridade
          if (options.includeInsalubrity && employee.insalubrityDegree) {
            const insalubrityValue = calculateInsalubrity(
              baseSalary,
              MINIMUM_WAGE_2024,
              employee.insalubrityDegree as "LOW" | "MEDIUM" | "HIGH"
            );
            grossSalary += insalubrityValue;
            events.push({
              code: "006",
              description: `Insalubridade (${employee.insalubrityDegree})`,
              type: "ALLOWANCE",
              reference: null,
              value: insalubrityValue,
              isDeduction: false,
            });
          }

          // 7. Periculosidade
          if (options.includeDangerousness && employee.hasDangerousness) {
            const dangerousnessValue = calculateDangerousness(baseSalary, true);
            grossSalary += dangerousnessValue;
            events.push({
              code: "007",
              description: "Periculosidade 30%",
              type: "ALLOWANCE",
              reference: 30,
              value: dangerousnessValue,
              isDeduction: false,
            });
          }

          // 8. Faltas
          if (absenceDays > 0) {
            const absenceValue = (baseSalary / 30) * absenceDays;
            grossSalary -= absenceValue;
            events.push({
              code: "101",
              description: "Faltas",
              type: "DEDUCTION",
              reference: absenceDays,
              value: absenceValue,
              isDeduction: true,
            });
          }

          // Calcular INSS
          const inss = calculateINSS(grossSalary);
          events.push({
            code: "201",
            description: "INSS",
            type: "DEDUCTION",
            reference: null,
            value: inss,
            isDeduction: true,
          });

          // Calcular IRRF
          const dependentes = employee.dependentsCount || 0;
          const irrf = calculateIRRF(grossSalary - inss, dependentes);
          if (irrf > 0) {
            events.push({
              code: "202",
              description: "IRRF",
              type: "DEDUCTION",
              reference: null,
              value: irrf,
              isDeduction: true,
            });
          }

          // Calcular FGTS (não é desconto, mas provisão)
          const fgts = grossSalary * 0.08;

          // Outros descontos existentes (VT, VR, etc)
          const existingDeductions = item.events
            .filter((e) => e.isDeduction && !["201", "202"].includes(e.code))
            .reduce((sum, e) => sum + e.value, 0);

          const totalItemDeductions = inss + irrf + existingDeductions;
          const netSalary = grossSalary - totalItemDeductions;

          // Limpar eventos antigos e criar novos
          await tx.payrollEvent.deleteMany({ where: { payrollItemId: item.id } });

          await tx.payrollEvent.createMany({
            data: events.map((e) => ({
              payrollItemId: item.id,
              ...e,
            })),
          });

          // Atualizar item
          await tx.payrollItem.update({
            where: { id: item.id },
            data: {
              workedDays: daysInMonth - absenceDays,
              workedHours,
              overtimeHours: overtimeHours50 + overtimeHours100,
              nightHours,
              absenceDays,
              grossSalary,
              inss,
              irrf,
              fgts,
              totalDeductions: totalItemDeductions,
              netSalary,
            },
          });

          totalGross += grossSalary;
          totalNet += netSalary;
          totalDeductions += totalItemDeductions;
          totalFGTS += fgts;
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

      const totals = payroll.items.reduce(
        (acc, item) => ({
          inss: acc.inss + item.inss,
          irrf: acc.irrf + item.irrf,
          fgts: acc.fgts + item.fgts,
          inssPatronal: acc.inssPatronal + item.grossSalary * 0.2, // 20% patronal
          rat: acc.rat + item.grossSalary * 0.03, // RAT 3% (média)
          terceiros: acc.terceiros + item.grossSalary * 0.058, // Sistema S 5.8%
          provisaoFerias: acc.provisaoFerias + item.grossSalary / 12 + item.grossSalary / 12 / 3,
          provisao13: acc.provisao13 + item.grossSalary / 12,
        }),
        {
          inss: 0,
          irrf: 0,
          fgts: 0,
          inssPatronal: 0,
          rat: 0,
          terceiros: 0,
          provisaoFerias: 0,
          provisao13: 0,
        }
      );

      return {
        period: { month: payroll.referenceMonth, year: payroll.referenceYear },
        employeeCount: payroll.employeeCount,
        grossTotal: payroll.totalGross,
        netTotal: payroll.totalNet,
        charges: {
          inssEmployee: totals.inss,
          irrfEmployee: totals.irrf,
          fgts: totals.fgts,
          inssPatronal: totals.inssPatronal,
          rat: totals.rat,
          terceiros: totals.terceiros,
          totalEncargos:
            totals.fgts + totals.inssPatronal + totals.rat + totals.terceiros,
        },
        provisions: {
          ferias: totals.provisaoFerias,
          thirteenth: totals.provisao13,
          total: totals.provisaoFerias + totals.provisao13,
        },
        totalCost:
          payroll.totalGross +
          totals.fgts +
          totals.inssPatronal +
          totals.rat +
          totals.terceiros +
          totals.provisaoFerias +
          totals.provisao13,
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
            `${Math.round(item.netSalary * 100)}`.padStart(15, "0") +
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
          gross: acc.gross + p.totalGross,
          net: acc.net + p.totalNet,
          deductions: acc.deductions + p.totalDeductions,
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
