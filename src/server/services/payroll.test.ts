import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  PayrollService,
  calculateINSS,
  calculateIRRF,
  calculateIRRFSimple,
  calculateDSR,
  calculateNightShiftBonus,
  calculateNightHoursReduction,
  calculateInsalubrity,
  calculateDangerousness,
  calculateNoticePeriodDays,
  calculateMonthsWorkedInYear,
  calculateWorkingDays,
  MINIMUM_WAGE_2024,
} from "./payroll";
import type {
  PayrollCalculationOptions,
  EmployeePayrollInput,
  VacationCalculationInput,
  TerminationCalculationInput,
} from "./payroll";

// ==========================================================================
// PURE CALCULATION FUNCTIONS
// ==========================================================================

describe("Payroll calculation functions", () => {
  // ========================================================================
  // INSS
  // ========================================================================
  describe("calculateINSS", () => {
    it("should calculate 7.5% for salary up to R$1412", () => {
      expect(calculateINSS(1412)).toBeCloseTo(105.9, 1);
      expect(calculateINSS(1000)).toBeCloseTo(75, 1);
    });

    it("should calculate progressively for 2nd bracket", () => {
      // 105.9 + (2000 - 1412) * 0.09 = 105.9 + 52.92 = 158.82
      expect(calculateINSS(2000)).toBeCloseTo(158.82, 1);
    });

    it("should calculate progressively for 3rd bracket", () => {
      // 218.82 + (3500 - 2666.68) * 0.12 = 218.82 + 99.9984 = 318.82
      expect(calculateINSS(3500)).toBeCloseTo(318.82, 0);
    });

    it("should calculate progressively for 4th bracket", () => {
      // 378.82 + (5000 - 4000.03) * 0.14 = 378.82 + 139.9958 = 518.82
      expect(calculateINSS(5000)).toBeCloseTo(518.82, 0);
    });

    it("should cap at R$908.85 (teto)", () => {
      expect(calculateINSS(10000)).toBe(908.85);
      expect(calculateINSS(50000)).toBe(908.85);
    });
  });

  // ========================================================================
  // IRRF
  // ========================================================================
  describe("calculateIRRF", () => {
    it("should return 0 for base below R$2259.20 (isento)", () => {
      expect(calculateIRRF(2000)).toBe(0);
      expect(calculateIRRF(2259.2)).toBe(0);
    });

    it("should calculate 7.5% for 1st bracket", () => {
      const result = calculateIRRF(2500);
      expect(result).toBeGreaterThan(0);
      expect(result).toBeCloseTo(2500 * 0.075 - 169.44, 2);
    });

    it("should calculate 15% for 2nd bracket", () => {
      const result = calculateIRRF(3000);
      expect(result).toBeCloseTo(3000 * 0.15 - 381.44, 2);
    });

    it("should calculate 22.5% for 3rd bracket", () => {
      const result = calculateIRRF(4000);
      expect(result).toBeCloseTo(4000 * 0.225 - 662.77, 2);
    });

    it("should calculate 27.5% for 4th bracket", () => {
      const result = calculateIRRF(5000);
      expect(result).toBeCloseTo(5000 * 0.275 - 896.0, 2);
    });

    it("should deduct R$189.59 per dependent", () => {
      const withoutDep = calculateIRRF(3000, 0);
      const withDep = calculateIRRF(3000, 2);
      // 2 dependentes = 2 * 189.59 = 379.18 a menos na base
      expect(withDep).toBeLessThan(withoutDep);
    });
  });

  describe("calculateIRRFSimple", () => {
    it("should return 0 for base below R$2259.20", () => {
      expect(calculateIRRFSimple(2000)).toBe(0);
    });

    it("should calculate correctly without dependents deduction", () => {
      expect(calculateIRRFSimple(3000)).toBeCloseTo(3000 * 0.15 - 381.44, 2);
    });
  });

  // ========================================================================
  // DSR
  // ========================================================================
  describe("calculateDSR", () => {
    it("should calculate DSR correctly", () => {
      // 10h extras * R$20/h * 5 domingos / 22 dias úteis
      const result = calculateDSR(10, 20, 22, 5);
      expect(result).toBeCloseTo((10 * 20 * 5) / 22, 2);
    });

    it("should return 0 when diasUteis is 0", () => {
      expect(calculateDSR(10, 20, 0, 5)).toBe(0);
    });
  });

  // ========================================================================
  // Night shift
  // ========================================================================
  describe("calculateNightShiftBonus", () => {
    it("should calculate 20% bonus", () => {
      expect(calculateNightShiftBonus(10, 20)).toBe(40); // 10 * 20 * 0.2
    });
  });

  describe("calculateNightHoursReduction", () => {
    it("should calculate reduced night hours", () => {
      const result = calculateNightHoursReduction(10);
      // 10 * (60/52.5 - 1) = 10 * 0.142857 = 1.4286
      expect(result).toBeCloseTo(1.4286, 3);
    });
  });

  // ========================================================================
  // Insalubrity / Dangerousness
  // ========================================================================
  describe("calculateInsalubrity", () => {
    it("should return 10% of minimum wage for LOW", () => {
      expect(calculateInsalubrity(5000, MINIMUM_WAGE_2024, "LOW")).toBeCloseTo(141.2, 1);
    });

    it("should return 20% of minimum wage for MEDIUM", () => {
      expect(calculateInsalubrity(5000, MINIMUM_WAGE_2024, "MEDIUM")).toBeCloseTo(282.4, 1);
    });

    it("should return 40% of minimum wage for HIGH", () => {
      expect(calculateInsalubrity(5000, MINIMUM_WAGE_2024, "HIGH")).toBeCloseTo(564.8, 1);
    });

    it("should return 0 for null degree", () => {
      expect(calculateInsalubrity(5000, MINIMUM_WAGE_2024, null)).toBe(0);
    });
  });

  describe("calculateDangerousness", () => {
    it("should return 30% of base salary", () => {
      expect(calculateDangerousness(5000, true)).toBe(1500);
    });

    it("should return 0 when not applicable", () => {
      expect(calculateDangerousness(5000, false)).toBe(0);
    });
  });

  // ========================================================================
  // Notice period
  // ========================================================================
  describe("calculateNoticePeriodDays", () => {
    it("should return 30 days for less than 1 year", () => {
      const hire = new Date(2024, 0, 1);
      const term = new Date(2024, 6, 1);
      expect(calculateNoticePeriodDays(hire, term)).toBe(30);
    });

    it("should add 3 days per year worked", () => {
      const hire = new Date(2020, 0, 1);
      const term = new Date(2024, 0, 2); // ~4 years
      expect(calculateNoticePeriodDays(hire, term)).toBe(42); // 30 + 4*3
    });

    it("should cap at 90 days", () => {
      const hire = new Date(2000, 0, 1);
      const term = new Date(2024, 0, 1); // 24 years
      expect(calculateNoticePeriodDays(hire, term)).toBe(90);
    });
  });

  // ========================================================================
  // Months worked
  // ========================================================================
  describe("calculateMonthsWorkedInYear", () => {
    it("should return 12 for employee hired before the year", () => {
      expect(calculateMonthsWorkedInYear(new Date(2020, 0, 1), 2024)).toBe(12);
    });

    it("should return proportional months for employee hired during the year", () => {
      // Hired in March (month 2) → 12 - 2 = 10 months
      expect(calculateMonthsWorkedInYear(new Date(2024, 2, 15), 2024)).toBe(10);
    });

    it("should return 1 for employee hired in December", () => {
      expect(calculateMonthsWorkedInYear(new Date(2024, 11, 1), 2024)).toBe(1);
    });
  });

  // ========================================================================
  // Working days
  // ========================================================================
  describe("calculateWorkingDays", () => {
    it("should count working days correctly", () => {
      const result = calculateWorkingDays(2024, 1); // January 2024
      expect(result.daysInMonth).toBe(31);
      expect(result.diasUteis).toBeGreaterThan(0);
      expect(result.domingosEFeriados).toBeGreaterThan(0);
      expect(result.diasUteis + result.domingosEFeriados).toBeLessThanOrEqual(31);
    });

    it("should add holidays to domingosEFeriados", () => {
      const without = calculateWorkingDays(2024, 1, 0);
      const with3 = calculateWorkingDays(2024, 1, 3);
      expect(with3.domingosEFeriados).toBe(without.domingosEFeriados + 3);
    });
  });
});

// ==========================================================================
// SERVICE CLASS
// ==========================================================================

describe("PayrollService", () => {
  let service: PayrollService;

  beforeEach(() => {
    vi.clearAllMocks();
    const prisma = {} as import("@prisma/client").PrismaClient;
    service = new PayrollService(prisma);
  });

  const defaultOptions: PayrollCalculationOptions = {
    includeOvertime: true,
    includeNightShift: true,
    includeInsalubrity: true,
    includeDangerousness: true,
    includeDSR: true,
    includeVacationAdvance: false,
    includeThirteenthAdvance: false,
  };

  const defaultWorkingDays = { diasUteis: 22, domingosEFeriados: 9, daysInMonth: 31 };

  // ========================================================================
  // calculateEmployeePayroll
  // ========================================================================
  describe("calculateEmployeePayroll", () => {
    it("should calculate base salary only (no extras)", () => {
      const input: EmployeePayrollInput = { baseSalary: 3000 };
      const result = service.calculateEmployeePayroll(input, defaultOptions, defaultWorkingDays);

      expect(result.grossSalary).toBe(3000);
      expect(result.inss).toBe(calculateINSS(3000));
      expect(result.irrf).toBe(calculateIRRF(3000 - result.inss, 0));
      expect(result.fgts).toBeCloseTo(3000 * 0.08, 2);
      expect(result.netSalary).toBe(result.grossSalary - result.totalDeductions);
      expect(result.events.length).toBeGreaterThanOrEqual(2); // salary + INSS at minimum
    });

    it("should include overtime 50% and 100%", () => {
      const input: EmployeePayrollInput = {
        baseSalary: 3000,
        timesheetData: {
          workedHours: 220,
          overtimeHours50: 10,
          overtimeHours100: 5,
          nightHours: 0,
          absenceDays: 0,
        },
      };
      const result = service.calculateEmployeePayroll(input, defaultOptions, defaultWorkingDays);

      const hourlyRate = 3000 / 220;
      const expectedOvertime50 = 10 * hourlyRate * 1.5;
      const expectedOvertime100 = 5 * hourlyRate * 2;

      expect(result.grossSalary).toBeGreaterThan(3000 + expectedOvertime50 + expectedOvertime100);
      expect(result.overtimeHours).toBe(15);
    });

    it("should include night shift bonus", () => {
      const input: EmployeePayrollInput = {
        baseSalary: 3000,
        timesheetData: {
          workedHours: 220,
          overtimeHours50: 0,
          overtimeHours100: 0,
          nightHours: 20,
          absenceDays: 0,
        },
      };
      const result = service.calculateEmployeePayroll(input, defaultOptions, defaultWorkingDays);

      expect(result.grossSalary).toBeGreaterThan(3000);
      expect(result.nightHours).toBe(20);
      expect(result.events.some((e) => e.code === "004")).toBe(true);
    });

    it("should include insalubrity", () => {
      const input: EmployeePayrollInput = {
        baseSalary: 3000,
        insalubrityDegree: "MEDIUM",
      };
      const result = service.calculateEmployeePayroll(input, defaultOptions, defaultWorkingDays);

      const expectedInsalubrity = MINIMUM_WAGE_2024 * 0.2;
      expect(result.grossSalary).toBeCloseTo(3000 + expectedInsalubrity, 1);
      expect(result.events.some((e) => e.code === "006")).toBe(true);
    });

    it("should include dangerousness (30%)", () => {
      const input: EmployeePayrollInput = {
        baseSalary: 3000,
        hasDangerousness: true,
      };
      const result = service.calculateEmployeePayroll(input, defaultOptions, defaultWorkingDays);

      expect(result.grossSalary).toBeCloseTo(3000 + 900, 1); // 30%
      expect(result.events.some((e) => e.code === "007")).toBe(true);
    });

    it("should deduct absences", () => {
      const input: EmployeePayrollInput = {
        baseSalary: 3000,
        timesheetData: {
          workedHours: 200,
          overtimeHours50: 0,
          overtimeHours100: 0,
          nightHours: 0,
          absenceDays: 3,
        },
      };
      const result = service.calculateEmployeePayroll(input, defaultOptions, defaultWorkingDays);

      const absenceValue = (3000 / 30) * 3;
      expect(result.grossSalary).toBeCloseTo(3000 - absenceValue, 1);
      expect(result.absenceDays).toBe(3);
      expect(result.workedDays).toBe(28); // 31 - 3
    });

    it("should skip overtime when option is disabled", () => {
      const input: EmployeePayrollInput = {
        baseSalary: 3000,
        timesheetData: {
          workedHours: 220,
          overtimeHours50: 10,
          overtimeHours100: 5,
          nightHours: 0,
          absenceDays: 0,
        },
      };
      const opts = { ...defaultOptions, includeOvertime: false };
      const result = service.calculateEmployeePayroll(input, opts, defaultWorkingDays);

      expect(result.grossSalary).toBe(3000);
      expect(result.events.some((e) => e.code === "002")).toBe(false);
      expect(result.events.some((e) => e.code === "003")).toBe(false);
    });

    it("should include existing deductions in total", () => {
      const input: EmployeePayrollInput = {
        baseSalary: 3000,
        existingDeductions: 200, // VT, VR, etc
      };
      const result = service.calculateEmployeePayroll(input, defaultOptions, defaultWorkingDays);

      expect(result.totalDeductions).toBe(result.inss + result.irrf + 200);
    });

    it("should calculate IRRF with dependents", () => {
      const withoutDeps: EmployeePayrollInput = { baseSalary: 5000, dependentsCount: 0 };
      const withDeps: EmployeePayrollInput = { baseSalary: 5000, dependentsCount: 3 };

      const r1 = service.calculateEmployeePayroll(withoutDeps, defaultOptions, defaultWorkingDays);
      const r2 = service.calculateEmployeePayroll(withDeps, defaultOptions, defaultWorkingDays);

      expect(r2.irrf).toBeLessThan(r1.irrf);
    });
  });

  // ========================================================================
  // calculateVacation
  // ========================================================================
  describe("calculateVacation", () => {
    it("should calculate 30-day vacation correctly", () => {
      const input: VacationCalculationInput = {
        baseSalary: 3000,
        totalDays: 30,
        soldDays: 0,
      };
      const result = service.calculateVacation(input);

      expect(result.enjoyedDays).toBe(30);
      expect(result.vacationPay).toBe(3000); // 30 days = full salary
      expect(result.oneThirdBonus).toBe(1000); // 1/3
      expect(result.soldDaysValue).toBe(0);
      expect(result.totalGross).toBe(4000); // 3000 + 1000
      expect(result.inssDeduction).toBeGreaterThan(0);
      expect(result.totalNet).toBeLessThan(result.totalGross);
    });

    it("should calculate vacation with sold days (abono pecuniário)", () => {
      const input: VacationCalculationInput = {
        baseSalary: 3000,
        totalDays: 30,
        soldDays: 10,
      };
      const result = service.calculateVacation(input);

      expect(result.enjoyedDays).toBe(20);
      const dailySalary = 3000 / 30;
      expect(result.soldDaysValue).toBeCloseTo(dailySalary * 10 * (4 / 3), 2);
      expect(result.totalGross).toBeGreaterThan(0);
    });

    it("should cap INSS at R$908.85", () => {
      const input: VacationCalculationInput = {
        baseSalary: 15000,
        totalDays: 30,
        soldDays: 0,
      };
      const result = service.calculateVacation(input);

      expect(result.inssDeduction).toBe(908.85);
    });
  });

  // ========================================================================
  // calculateThirteenthFirstInstallment
  // ========================================================================
  describe("calculateThirteenthFirstInstallment", () => {
    it("should calculate 50% of proportional salary for full year", () => {
      const result = service.calculateThirteenthFirstInstallment({
        salary: 3000,
        hireDate: new Date(2020, 0, 1),
        year: 2024,
      });

      expect(result.monthsWorked).toBe(12);
      expect(result.grossValue).toBe(1500); // 3000 * 12/12 * 0.5
      expect(result.inssDeduction).toBe(0); // 1ª parcela sem descontos
      expect(result.irrfDeduction).toBe(0);
      expect(result.netValue).toBe(1500);
    });

    it("should calculate proportionally for employee hired mid-year", () => {
      const result = service.calculateThirteenthFirstInstallment({
        salary: 3000,
        hireDate: new Date(2024, 5, 1), // June → 7 months (Jun-Dec)
        year: 2024,
      });

      expect(result.monthsWorked).toBe(7); // 12 - 5
      expect(result.grossValue).toBeCloseTo((3000 / 12) * 7 * 0.5, 2);
    });
  });

  // ========================================================================
  // calculateThirteenthSecondInstallment
  // ========================================================================
  describe("calculateThirteenthSecondInstallment", () => {
    it("should calculate 2nd installment with INSS and IRRF deductions", () => {
      const result = service.calculateThirteenthSecondInstallment({
        salary: 5000,
        hireDate: new Date(2020, 0, 1),
        year: 2024,
        firstInstallmentGross: 2500,
      });

      expect(result.monthsWorked).toBe(12);
      expect(result.grossValue).toBe(2500); // 5000 - 2500
      expect(result.inssDeduction).toBeGreaterThan(0);
      expect(result.irrfDeduction).toBeGreaterThanOrEqual(0);
      expect(result.netValue).toBeLessThan(result.grossValue);
    });

    it("should cap INSS at teto", () => {
      const result = service.calculateThirteenthSecondInstallment({
        salary: 15000,
        hireDate: new Date(2020, 0, 1),
        year: 2024,
        firstInstallmentGross: 7500,
      });

      expect(result.inssDeduction).toBe(908.85);
    });
  });

  // ========================================================================
  // calculateTermination
  // ========================================================================
  describe("calculateTermination", () => {
    const baseInput: TerminationCalculationInput = {
      baseSalary: 3000,
      hireDate: new Date(2020, 0, 1),
      terminationDate: new Date(2024, 5, 15), // June 15
      type: "DISMISSAL_NO_CAUSE",
      noticePeriodDays: 42,
      noticePeriodIndemnity: true,
    };

    it("should calculate salary balance based on day of month", () => {
      const result = service.calculateTermination(baseInput);

      const dailySalary = 3000 / 30;
      expect(result.salaryBalance).toBeCloseTo(dailySalary * 15, 2);
    });

    it("should include notice period indemnity for dismissal without cause", () => {
      const result = service.calculateTermination(baseInput);

      const dailySalary = 3000 / 30;
      expect(result.noticePeriodValue).toBeCloseTo(dailySalary * 42, 2);
    });

    it("should NOT include notice period for resignation", () => {
      const result = service.calculateTermination({
        ...baseInput,
        type: "RESIGNATION",
      });

      expect(result.noticePeriodValue).toBe(0);
    });

    it("should NOT include notice period for dismissal with cause", () => {
      const result = service.calculateTermination({
        ...baseInput,
        type: "DISMISSAL_WITH_CAUSE",
      });

      expect(result.noticePeriodValue).toBe(0);
    });

    it("should calculate 40% FGTS fine for dismissal without cause", () => {
      const result = service.calculateTermination(baseInput);

      expect(result.fgtsFine).toBeCloseTo(result.fgtsBalance * 0.4, 2);
    });

    it("should calculate 20% FGTS fine for mutual agreement", () => {
      const result = service.calculateTermination({
        ...baseInput,
        type: "MUTUAL_AGREEMENT",
      });

      expect(result.fgtsFine).toBeCloseTo(result.fgtsBalance * 0.2, 2);
    });

    it("should NOT include 13th proportional for dismissal with cause", () => {
      const result = service.calculateTermination({
        ...baseInput,
        type: "DISMISSAL_WITH_CAUSE",
      });

      expect(result.thirteenthProportional).toBe(0);
    });

    it("should include 13th proportional for dismissal without cause", () => {
      const result = service.calculateTermination(baseInput);

      // June = month 6 → 6/12 of salary
      expect(result.thirteenthProportional).toBeCloseTo((3000 / 12) * 6, 2);
    });

    it("should determine unemployment insurance eligibility", () => {
      const eligible = service.calculateTermination(baseInput);
      expect(eligible.eligibleForUnemployment).toBe(true);
      expect(eligible.unemploymentGuides).toBeGreaterThan(0);

      const ineligible = service.calculateTermination({
        ...baseInput,
        type: "RESIGNATION",
      });
      expect(ineligible.eligibleForUnemployment).toBe(false);
      expect(ineligible.unemploymentGuides).toBe(0);
    });

    it("should calculate totalNet = totalGross - totalDeductions", () => {
      const result = service.calculateTermination(baseInput);

      expect(result.totalNet).toBeCloseTo(result.totalGross - result.totalDeductions, 2);
      expect(result.totalDeductions).toBe(result.inssDeduction + result.irrfDeduction);
    });
  });

  // ========================================================================
  // calculateChargesSummary
  // ========================================================================
  describe("calculateChargesSummary", () => {
    it("should calculate all employer charges", () => {
      const items = [
        { grossSalary: 3000, inss: 300, irrf: 50, fgts: 240 },
        { grossSalary: 5000, inss: 500, irrf: 200, fgts: 400 },
      ];

      const result = service.calculateChargesSummary(items);

      expect(result.inssEmployee).toBe(800);
      expect(result.irrfEmployee).toBe(250);
      expect(result.fgts).toBe(640);
      expect(result.inssPatronal).toBeCloseTo(8000 * 0.2, 2);
      expect(result.rat).toBeCloseTo(8000 * 0.03, 2);
      expect(result.terceiros).toBeCloseTo(8000 * 0.058, 2);
      expect(result.totalEncargos).toBeCloseTo(
        result.fgts + result.inssPatronal + result.rat + result.terceiros,
        2,
      );
      expect(result.provisaoTotal).toBe(result.provisaoFerias + result.provisao13);
    });

    it("should handle empty items array", () => {
      const result = service.calculateChargesSummary([]);

      expect(result.inssEmployee).toBe(0);
      expect(result.fgts).toBe(0);
      expect(result.totalEncargos).toBe(0);
    });
  });
});
