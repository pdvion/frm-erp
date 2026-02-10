import type { PrismaClient, Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";

type Decimal = Prisma.Decimal;

// ==========================================================================
// CONSTANTS
// ==========================================================================

export const MINIMUM_WAGE_2024 = 1412.0;
const STANDARD_MONTHLY_HOURS = 220;
const FGTS_RATE = 0.08;
const INSS_PATRONAL_RATE = 0.20;
const RAT_RATE = 0.03;
const TERCEIROS_RATE = 0.058;

// ==========================================================================
// TYPES
// ==========================================================================

export type InsalubrityDegree = "LOW" | "MEDIUM" | "HIGH";

export interface PayrollEvent {
  code: string;
  description: string;
  type: "ALLOWANCE" | "DEDUCTION";
  reference: number | null;
  value: number;
  isDeduction: boolean;
}

export interface EmployeePayrollInput {
  baseSalary: number;
  insalubrityDegree?: InsalubrityDegree | string | null;
  hasDangerousness?: boolean;
  dependentsCount?: number;
  existingDeductions?: number;
  timesheetData?: {
    workedHours: number;
    overtimeHours50: number;
    overtimeHours100: number;
    nightHours: number;
    absenceDays: number;
  };
}

export interface PayrollCalculationOptions {
  includeOvertime: boolean;
  includeNightShift: boolean;
  includeInsalubrity: boolean;
  includeDangerousness: boolean;
  includeDSR: boolean;
  includeVacationAdvance: boolean;
  includeThirteenthAdvance: boolean;
}

export interface EmployeePayrollResult {
  events: PayrollEvent[];
  grossSalary: number;
  inss: number;
  irrf: number;
  fgts: number;
  totalDeductions: number;
  netSalary: number;
  workedHours: number;
  overtimeHours: number;
  nightHours: number;
  absenceDays: number;
  workedDays: number;
}

export interface VacationCalculationInput {
  baseSalary: number | Decimal;
  totalDays: number;
  soldDays: number;
  dependentsCount?: number;
}

export interface VacationCalculationResult {
  enjoyedDays: number;
  dailySalary: number;
  vacationPay: number;
  oneThirdBonus: number;
  soldDaysValue: number;
  totalGross: number;
  inssDeduction: number;
  irrfDeduction: number;
  totalNet: number;
}

export interface ThirteenthFirstInstallmentInput {
  salary: number | Decimal;
  hireDate: Date;
  year: number;
}

export interface ThirteenthSecondInstallmentInput {
  salary: number | Decimal;
  hireDate: Date;
  year: number;
  firstInstallmentGross: number;
  dependentsCount?: number;
}

export interface ThirteenthCalculationResult {
  monthsWorked: number;
  grossValue: number;
  inssDeduction: number;
  irrfDeduction: number;
  netValue: number;
}

export interface TerminationCalculationInput {
  baseSalary: number | Decimal;
  hireDate: Date;
  terminationDate: Date;
  type: string;
  noticePeriodDays: number;
  noticePeriodIndemnity: boolean;
  dependentsCount?: number;
}

export interface TerminationCalculationResult {
  salaryBalance: number;
  noticePeriodValue: number;
  vacationBalance: number;
  vacationProportional: number;
  vacationOneThird: number;
  thirteenthProportional: number;
  fgtsBalance: number;
  fgtsFine: number;
  totalGross: number;
  inssDeduction: number;
  irrfDeduction: number;
  totalDeductions: number;
  totalNet: number;
  eligibleForUnemployment: boolean;
  unemploymentGuides: number;
}

export interface ChargesSummaryResult {
  inssEmployee: number;
  irrfEmployee: number;
  fgts: number;
  inssPatronal: number;
  rat: number;
  terceiros: number;
  totalEncargos: number;
  provisaoFerias: number;
  provisao13: number;
  provisaoTotal: number;
}

// ==========================================================================
// PURE CALCULATION FUNCTIONS (exported for direct testing)
// ==========================================================================

/**
 * Tabela INSS 2024 (progressiva)
 */
export function calculateINSS(salary: number): number {
  if (salary <= 1412.0) return salary * 0.075;
  if (salary <= 2666.68) return 105.9 + (salary - 1412.0) * 0.09;
  if (salary <= 4000.03) return 218.82 + (salary - 2666.68) * 0.12;
  if (salary <= 7786.02) return 378.82 + (salary - 4000.03) * 0.14;
  return 908.85; // Teto
}

/**
 * Tabela IRRF 2024
 */
export function calculateIRRF(baseCalculo: number, dependentes: number = 0): number {
  const deducaoDependentes = dependentes * 189.59;
  const base = baseCalculo - deducaoDependentes;

  if (base <= 2259.2) return 0;
  if (base <= 2826.65) return base * 0.075 - 169.44;
  if (base <= 3751.05) return base * 0.15 - 381.44;
  if (base <= 4664.68) return base * 0.225 - 662.77;
  return base * 0.275 - 896.0;
}

/**
 * IRRF simplificado (sem dedução de dependentes) — usado em férias, 13º, rescisão
 */
export function calculateIRRFSimple(baseCalculo: number): number {
  if (baseCalculo <= 2259.2) return 0;
  if (baseCalculo <= 2826.65) return baseCalculo * 0.075 - 169.44;
  if (baseCalculo <= 3751.05) return baseCalculo * 0.15 - 381.44;
  if (baseCalculo <= 4664.68) return baseCalculo * 0.225 - 662.77;
  return baseCalculo * 0.275 - 896.0;
}

/**
 * DSR (Descanso Semanal Remunerado) sobre horas extras
 */
export function calculateDSR(
  horasExtras: number,
  valorHoraExtra: number,
  diasUteis: number,
  domingosEFeriados: number,
): number {
  if (diasUteis === 0) return 0;
  return (horasExtras * valorHoraExtra * domingosEFeriados) / diasUteis;
}

/**
 * Adicional noturno (20% sobre hora normal, entre 22h e 5h)
 */
export function calculateNightShiftBonus(nightHours: number, hourlyRate: number): number {
  return nightHours * hourlyRate * 0.2;
}

/**
 * Hora reduzida noturna (52:30 = 0.875 hora)
 */
export function calculateNightHoursReduction(nightHours: number): number {
  return nightHours * (60 / 52.5 - 1);
}

/**
 * Insalubridade — base é o salário mínimo
 */
export function calculateInsalubrity(
  _baseSalary: number,
  minimumWage: number,
  degree: InsalubrityDegree | null,
): number {
  if (!degree) return 0;
  const percentages: Record<InsalubrityDegree, number> = { LOW: 0.1, MEDIUM: 0.2, HIGH: 0.4 };
  return minimumWage * percentages[degree];
}

/**
 * Periculosidade (30% sobre salário base)
 */
export function calculateDangerousness(baseSalary: number, hasDangerousness: boolean): number {
  return hasDangerousness ? baseSalary * 0.3 : 0;
}

/**
 * Aviso prévio proporcional (3 dias por ano, mín 30, máx 90)
 */
export function calculateNoticePeriodDays(hireDate: Date, terminationDate: Date): number {
  const yearsWorked = Math.floor(
    (terminationDate.getTime() - hireDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000),
  );
  return Math.min(90, Math.max(30, 30 + yearsWorked * 3));
}

/**
 * Meses trabalhados no ano
 */
export function calculateMonthsWorkedInYear(hireDate: Date, year: number): number {
  const startOfYear = new Date(year, 0, 1);
  return hireDate > startOfYear ? 12 - hireDate.getMonth() : 12;
}

/**
 * Dias úteis e domingos/feriados no mês
 */
export function calculateWorkingDays(
  year: number,
  month: number,
  holidayCount: number = 0,
): { diasUteis: number; domingosEFeriados: number; daysInMonth: number } {
  const endOfMonth = new Date(year, month, 0);
  const daysInMonth = endOfMonth.getDate();

  let diasUteis = 0;
  let domingosEFeriados = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month - 1, d);
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0) {
      domingosEFeriados++;
    } else if (dayOfWeek !== 6) {
      diasUteis++;
    }
  }
  domingosEFeriados += holidayCount;

  return { diasUteis, domingosEFeriados, daysInMonth };
}

// ==========================================================================
// SERVICE CLASS
// ==========================================================================

export class PayrollService {
  constructor(private prisma: PrismaClient) {}

  // ========================================================================
  // CÁLCULO DE FOLHA INDIVIDUAL (por funcionário)
  // ========================================================================

  /**
   * Calcula proventos e descontos de um funcionário para um mês.
   * Lógica pura — não persiste nada.
   */
  calculateEmployeePayroll(
    employee: EmployeePayrollInput,
    options: PayrollCalculationOptions,
    workingDays: { diasUteis: number; domingosEFeriados: number; daysInMonth: number },
  ): EmployeePayrollResult {
    const baseSalary = employee.baseSalary;
    const hourlyRate = baseSalary / STANDARD_MONTHLY_HOURS;
    const ts = employee.timesheetData ?? {
      workedHours: 0,
      overtimeHours50: 0,
      overtimeHours100: 0,
      nightHours: 0,
      absenceDays: 0,
    };

    const events: PayrollEvent[] = [];
    let grossSalary = baseSalary;

    // 1. Salário Base
    events.push({
      code: "001",
      description: "Salário Base",
      type: "ALLOWANCE",
      reference: null,
      value: baseSalary,
      isDeduction: false,
    });

    // 2. Horas Extras 50%
    if (options.includeOvertime && ts.overtimeHours50 > 0) {
      const value = ts.overtimeHours50 * hourlyRate * 1.5;
      grossSalary += value;
      events.push({
        code: "002",
        description: "Horas Extras 50%",
        type: "ALLOWANCE",
        reference: ts.overtimeHours50,
        value,
        isDeduction: false,
      });
    }

    // 3. Horas Extras 100%
    if (options.includeOvertime && ts.overtimeHours100 > 0) {
      const value = ts.overtimeHours100 * hourlyRate * 2;
      grossSalary += value;
      events.push({
        code: "003",
        description: "Horas Extras 100%",
        type: "ALLOWANCE",
        reference: ts.overtimeHours100,
        value,
        isDeduction: false,
      });
    }

    // 4. Adicional Noturno
    if (options.includeNightShift && ts.nightHours > 0) {
      const nightBonus = calculateNightShiftBonus(ts.nightHours, hourlyRate);
      const nightReduction = calculateNightHoursReduction(ts.nightHours) * hourlyRate;
      const value = nightBonus + nightReduction;
      grossSalary += value;
      events.push({
        code: "004",
        description: "Adicional Noturno",
        type: "ALLOWANCE",
        reference: ts.nightHours,
        value,
        isDeduction: false,
      });
    }

    // 5. DSR sobre Horas Extras
    if (options.includeDSR && options.includeOvertime && (ts.overtimeHours50 > 0 || ts.overtimeHours100 > 0)) {
      const totalOvertimeValue =
        ts.overtimeHours50 * hourlyRate * 1.5 + ts.overtimeHours100 * hourlyRate * 2;
      const totalOvertimeHours = ts.overtimeHours50 + ts.overtimeHours100;
      const dsrValue = calculateDSR(
        totalOvertimeHours,
        totalOvertimeValue / (totalOvertimeHours || 1),
        workingDays.diasUteis,
        workingDays.domingosEFeriados,
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
      const value = calculateInsalubrity(
        baseSalary,
        MINIMUM_WAGE_2024,
        employee.insalubrityDegree as InsalubrityDegree,
      );
      grossSalary += value;
      events.push({
        code: "006",
        description: `Insalubridade (${employee.insalubrityDegree})`,
        type: "ALLOWANCE",
        reference: null,
        value,
        isDeduction: false,
      });
    }

    // 7. Periculosidade
    if (options.includeDangerousness && employee.hasDangerousness) {
      const value = calculateDangerousness(baseSalary, true);
      grossSalary += value;
      events.push({
        code: "007",
        description: "Periculosidade 30%",
        type: "ALLOWANCE",
        reference: 30,
        value,
        isDeduction: false,
      });
    }

    // 8. Faltas
    if (ts.absenceDays > 0) {
      const value = (baseSalary / 30) * ts.absenceDays;
      grossSalary -= value;
      events.push({
        code: "101",
        description: "Faltas",
        type: "DEDUCTION",
        reference: ts.absenceDays,
        value,
        isDeduction: true,
      });
    }

    // INSS
    const inss = calculateINSS(grossSalary);
    events.push({
      code: "201",
      description: "INSS",
      type: "DEDUCTION",
      reference: null,
      value: inss,
      isDeduction: true,
    });

    // IRRF
    const irrf = calculateIRRF(grossSalary - inss, employee.dependentsCount ?? 0);
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

    // FGTS (provisão, não desconto)
    const fgts = grossSalary * FGTS_RATE;

    const existingDeductions = employee.existingDeductions ?? 0;
    const totalDeductions = inss + irrf + existingDeductions;
    const netSalary = grossSalary - totalDeductions;

    return {
      events,
      grossSalary,
      inss,
      irrf,
      fgts,
      totalDeductions,
      netSalary,
      workedHours: ts.workedHours,
      overtimeHours: ts.overtimeHours50 + ts.overtimeHours100,
      nightHours: ts.nightHours,
      absenceDays: ts.absenceDays,
      workedDays: workingDays.daysInMonth - ts.absenceDays,
    };
  }

  // ========================================================================
  // CÁLCULO DE FÉRIAS
  // ========================================================================

  /**
   * Calcula valores de férias. Lógica pura.
   */
  calculateVacation(input: VacationCalculationInput): VacationCalculationResult {
    const baseSalary = Number(input.baseSalary);
    const enjoyedDays = input.totalDays - input.soldDays;
    const dailySalary = baseSalary / 30;

    const vacationPay = dailySalary * enjoyedDays;
    const oneThirdBonus = vacationPay / 3;
    const soldDaysValue = dailySalary * input.soldDays * (4 / 3); // Abono = dias + 1/3
    const totalGross = vacationPay + oneThirdBonus + soldDaysValue;

    const inssDeduction = Math.min(totalGross * 0.14, 908.85);
    const baseIrrf = totalGross - inssDeduction;
    const irrfDeduction = calculateIRRFSimple(baseIrrf);
    const totalNet = totalGross - inssDeduction - irrfDeduction;

    return {
      enjoyedDays,
      dailySalary,
      vacationPay,
      oneThirdBonus,
      soldDaysValue,
      totalGross,
      inssDeduction,
      irrfDeduction,
      totalNet,
    };
  }

  // ========================================================================
  // CÁLCULO DE 13º SALÁRIO
  // ========================================================================

  /**
   * Calcula 1ª parcela do 13º. Lógica pura.
   */
  calculateThirteenthFirstInstallment(
    input: ThirteenthFirstInstallmentInput,
  ): ThirteenthCalculationResult {
    const salary = Number(input.salary);
    const monthsWorked = calculateMonthsWorkedInYear(input.hireDate, input.year);

    // 1ª parcela = 50% do salário proporcional (sem descontos)
    const grossValue = (salary / 12) * monthsWorked * 0.5;

    return {
      monthsWorked,
      grossValue,
      inssDeduction: 0,
      irrfDeduction: 0,
      netValue: grossValue, // 1ª parcela não tem descontos
    };
  }

  /**
   * Calcula 2ª parcela do 13º. Lógica pura.
   */
  calculateThirteenthSecondInstallment(
    input: ThirteenthSecondInstallmentInput,
  ): ThirteenthCalculationResult {
    const salary = Number(input.salary);
    const monthsWorked = calculateMonthsWorkedInYear(input.hireDate, input.year);

    const totalThirteenth = (salary / 12) * monthsWorked;
    const grossValue = totalThirteenth - input.firstInstallmentGross;

    // INSS sobre o total do 13º
    const inssDeduction = Math.min(totalThirteenth * 0.14, 908.85);

    // IRRF sobre o total do 13º
    const baseIrrf = totalThirteenth - inssDeduction;
    const irrfDeduction = calculateIRRFSimple(baseIrrf);

    const netValue = grossValue - inssDeduction - irrfDeduction;

    return {
      monthsWorked,
      grossValue,
      inssDeduction,
      irrfDeduction,
      netValue,
    };
  }

  // ========================================================================
  // CÁLCULO DE RESCISÃO
  // ========================================================================

  /**
   * Calcula todos os valores de rescisão. Lógica pura.
   */
  calculateTermination(input: TerminationCalculationInput): TerminationCalculationResult {
    const baseSalary = Number(input.baseSalary);
    const dailySalary = baseSalary / 30;
    const hireDate = new Date(input.hireDate);
    const { terminationDate, type, noticePeriodDays, noticePeriodIndemnity } = input;

    const monthsSinceHire = Math.floor(
      (terminationDate.getTime() - hireDate.getTime()) / (30 * 24 * 60 * 60 * 1000),
    );

    // Saldo de salário
    const salaryBalance = dailySalary * terminationDate.getDate();

    // Aviso prévio indenizado
    let noticePeriodValue = 0;
    if (noticePeriodIndemnity && type !== "RESIGNATION" && type !== "DISMISSAL_WITH_CAUSE") {
      noticePeriodValue = dailySalary * noticePeriodDays;
    }

    // Férias vencidas
    const completedPeriods = Math.floor(monthsSinceHire / 12);
    const vacationBalance = completedPeriods > 0 ? baseSalary : 0;

    // Férias proporcionais
    const monthsInCurrentPeriod = monthsSinceHire % 12;
    const vacationProportional = (baseSalary / 12) * monthsInCurrentPeriod;

    // 1/3 de férias
    const vacationOneThird = (vacationBalance + vacationProportional) / 3;

    // 13º proporcional
    const monthsInYear = terminationDate.getMonth() + 1;
    const thirteenthProportional =
      type !== "DISMISSAL_WITH_CAUSE" ? (baseSalary / 12) * monthsInYear : 0;

    // FGTS
    const fgtsBalance = baseSalary * FGTS_RATE * monthsSinceHire;

    // Multa FGTS
    let fgtsFine = 0;
    if (type === "DISMISSAL_NO_CAUSE") {
      fgtsFine = fgtsBalance * 0.4;
    } else if (type === "MUTUAL_AGREEMENT") {
      fgtsFine = fgtsBalance * 0.2;
    }

    // Total bruto
    const totalGross =
      salaryBalance +
      noticePeriodValue +
      vacationBalance +
      vacationProportional +
      vacationOneThird +
      thirteenthProportional +
      fgtsFine;

    // INSS sobre saldo + aviso
    const baseInss = salaryBalance + noticePeriodValue;
    const inssDeduction = Math.min(baseInss * 0.14, 908.85);

    // IRRF
    const baseIrrf = baseInss - inssDeduction;
    const irrfDeduction = calculateIRRFSimple(baseIrrf);

    const totalDeductions = inssDeduction + irrfDeduction;
    const totalNet = totalGross - totalDeductions;

    // Seguro desemprego
    const eligibleForUnemployment = type === "DISMISSAL_NO_CAUSE" && monthsSinceHire >= 12;
    const unemploymentGuides = eligibleForUnemployment
      ? Math.min(5, Math.floor(monthsSinceHire / 6))
      : 0;

    return {
      salaryBalance,
      noticePeriodValue,
      vacationBalance,
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
    };
  }

  // ========================================================================
  // ENCARGOS
  // ========================================================================

  /**
   * Calcula resumo de encargos de uma folha. Lógica pura.
   */
  calculateChargesSummary(
    items: Array<{ grossSalary: Decimal | number; inss: Decimal | number; irrf: Decimal | number; fgts: Decimal | number }>,
  ): ChargesSummaryResult {
    const totals = items.reduce(
      (acc, item) => ({
        inss: acc.inss + Number(item.inss),
        irrf: acc.irrf + Number(item.irrf),
        fgts: acc.fgts + Number(item.fgts),
        inssPatronal: acc.inssPatronal + Number(item.grossSalary) * INSS_PATRONAL_RATE,
        rat: acc.rat + Number(item.grossSalary) * RAT_RATE,
        terceiros: acc.terceiros + Number(item.grossSalary) * TERCEIROS_RATE,
        provisaoFerias:
          acc.provisaoFerias +
          Number(item.grossSalary) / 12 +
          Number(item.grossSalary) / 12 / 3,
        provisao13: acc.provisao13 + Number(item.grossSalary) / 12,
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
      },
    );

    return {
      inssEmployee: totals.inss,
      irrfEmployee: totals.irrf,
      fgts: totals.fgts,
      inssPatronal: totals.inssPatronal,
      rat: totals.rat,
      terceiros: totals.terceiros,
      totalEncargos: totals.fgts + totals.inssPatronal + totals.rat + totals.terceiros,
      provisaoFerias: totals.provisaoFerias,
      provisao13: totals.provisao13,
      provisaoTotal: totals.provisaoFerias + totals.provisao13,
    };
  }
}
