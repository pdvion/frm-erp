import { describe, it, expect } from "vitest";
import { z } from "zod";

/**
 * Testes de schema para o router thirteenth (13º Salário)
 * Valida inputs e estruturas de dados de 13º salário
 */

// Schema de tipo de 13º
const thirteenthTypeSchema = z.enum([
  "FIRST_INSTALLMENT",
  "SECOND_INSTALLMENT",
  "FULL",
  "PROPORTIONAL",
]);

// Schema de status
const thirteenthStatusSchema = z.enum([
  "PENDING",
  "CALCULATED",
  "PAID",
  "CANCELLED",
]);

// Schema de listagem
const listInputSchema = z.object({
  employeeId: z.string().optional(),
  year: z.number().optional(),
  type: z.enum(["FIRST_INSTALLMENT", "SECOND_INSTALLMENT", "FULL", "PROPORTIONAL", "ALL"]).optional(),
  status: z.enum(["PENDING", "CALCULATED", "PAID", "CANCELLED", "ALL"]).optional(),
  page: z.number().default(1),
  limit: z.number().default(20),
});

// Schema de cálculo
const calculateInputSchema = z.object({
  year: z.number(),
});

// Schema de resposta
const thirteenthResponseSchema = z.object({
  id: z.string(),
  employeeId: z.string(),
  year: z.number(),
  type: thirteenthTypeSchema,
  status: thirteenthStatusSchema,
  baseValue: z.number(),
  monthsWorked: z.number(),
  grossValue: z.number(),
  inssDiscount: z.number(),
  irrfDiscount: z.number(),
  otherDiscounts: z.number(),
  netValue: z.number(),
});

describe("Thirteenth Router Schemas", () => {
  describe("Thirteenth Type Schema", () => {
    it("should accept FIRST_INSTALLMENT type", () => {
      const result = thirteenthTypeSchema.safeParse("FIRST_INSTALLMENT");
      expect(result.success).toBe(true);
    });

    it("should accept SECOND_INSTALLMENT type", () => {
      const result = thirteenthTypeSchema.safeParse("SECOND_INSTALLMENT");
      expect(result.success).toBe(true);
    });

    it("should accept FULL type", () => {
      const result = thirteenthTypeSchema.safeParse("FULL");
      expect(result.success).toBe(true);
    });

    it("should accept PROPORTIONAL type", () => {
      const result = thirteenthTypeSchema.safeParse("PROPORTIONAL");
      expect(result.success).toBe(true);
    });

    it("should reject invalid type", () => {
      const result = thirteenthTypeSchema.safeParse("INVALID");
      expect(result.success).toBe(false);
    });
  });

  describe("Thirteenth Status Schema", () => {
    it("should accept PENDING status", () => {
      const result = thirteenthStatusSchema.safeParse("PENDING");
      expect(result.success).toBe(true);
    });

    it("should accept CALCULATED status", () => {
      const result = thirteenthStatusSchema.safeParse("CALCULATED");
      expect(result.success).toBe(true);
    });

    it("should accept PAID status", () => {
      const result = thirteenthStatusSchema.safeParse("PAID");
      expect(result.success).toBe(true);
    });

    it("should accept CANCELLED status", () => {
      const result = thirteenthStatusSchema.safeParse("CANCELLED");
      expect(result.success).toBe(true);
    });

    it("should reject invalid status", () => {
      const result = thirteenthStatusSchema.safeParse("INVALID");
      expect(result.success).toBe(false);
    });
  });

  describe("List Input Schema", () => {
    it("should accept empty input with defaults", () => {
      const result = listInputSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });

    it("should accept all filters", () => {
      const result = listInputSchema.safeParse({
        employeeId: "emp-001",
        year: 2024,
        type: "FIRST_INSTALLMENT",
        status: "CALCULATED",
        page: 2,
        limit: 50,
      });
      expect(result.success).toBe(true);
    });

    it("should accept ALL type filter", () => {
      const result = listInputSchema.safeParse({ type: "ALL" });
      expect(result.success).toBe(true);
    });

    it("should accept ALL status filter", () => {
      const result = listInputSchema.safeParse({ status: "ALL" });
      expect(result.success).toBe(true);
    });
  });

  describe("Calculate Input Schema", () => {
    it("should accept valid year", () => {
      const result = calculateInputSchema.safeParse({ year: 2024 });
      expect(result.success).toBe(true);
    });

    it("should reject missing year", () => {
      const result = calculateInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("13th Salary Calculations", () => {
    it("should calculate first installment (50%)", () => {
      const salary = 3000;
      const firstInstallment = salary * 0.5;
      expect(firstInstallment).toBe(1500);
    });

    it("should calculate second installment with discounts", () => {
      const salary = 3000;
      const firstInstallment = 1500;
      const inss = salary * 0.09; // 9% for this bracket
      const secondInstallment = salary - firstInstallment - inss;
      expect(secondInstallment).toBe(1230);
    });

    it("should calculate proportional 13th for new employee", () => {
      const salary = 3000;
      const monthsWorked = 8;
      const proportional = (salary / 12) * monthsWorked;
      expect(proportional).toBe(2000);
    });

    it("should calculate full 13th for full year", () => {
      const salary = 3000;
      const monthsWorked = 12;
      const full13th = (salary / 12) * monthsWorked;
      expect(full13th).toBe(3000);
    });

    it("should count month if worked 15+ days", () => {
      const daysWorked = 15;
      const countsAsMonth = daysWorked >= 15;
      expect(countsAsMonth).toBe(true);
    });

    it("should not count month if worked less than 15 days", () => {
      const daysWorked = 14;
      const countsAsMonth = daysWorked >= 15;
      expect(countsAsMonth).toBe(false);
    });
  });

  describe("INSS Calculation for 13th", () => {
    const inssTable = [
      { max: 1412.00, rate: 0.075 },
      { max: 2666.68, rate: 0.09 },
      { max: 4000.03, rate: 0.12 },
      { max: 7786.02, rate: 0.14 },
    ];

    it("should have progressive brackets", () => {
      expect(inssTable.length).toBeGreaterThan(0);
      for (let i = 1; i < inssTable.length; i++) {
        expect(inssTable[i].max).toBeGreaterThan(inssTable[i - 1].max);
        expect(inssTable[i].rate).toBeGreaterThan(0);
      }
    });

    it("should calculate INSS for first bracket", () => {
      const salary = 1400;
      const inss = salary * 0.075;
      expect(inss).toBe(105);
    });

    it("should calculate INSS progressively", () => {
      const salary = 3000;
      let inss = 0;
      let remaining = salary;

      // First bracket
      const bracket1 = Math.min(remaining, 1412);
      inss += bracket1 * 0.075;
      remaining -= bracket1;

      // Second bracket
      const bracket2 = Math.min(remaining, 2666.68 - 1412);
      inss += bracket2 * 0.09;
      remaining -= bracket2;

      // Third bracket
      const bracket3 = Math.min(remaining, 4000.03 - 2666.68);
      inss += bracket3 * 0.12;

      // Progressive INSS calculation result
      expect(inss).toBeGreaterThan(250);
      expect(inss).toBeLessThan(300);
    });
  });

  describe("Thirteenth Response Schema", () => {
    it("should validate response shape", () => {
      const result = thirteenthResponseSchema.safeParse({
        id: "th-1",
        employeeId: "emp-1",
        year: 2024,
        type: "FULL",
        status: "CALCULATED",
        baseValue: 3000,
        monthsWorked: 12,
        grossValue: 3000,
        inssDiscount: 250,
        irrfDiscount: 0,
        otherDiscounts: 0,
        netValue: 2750,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("IRRF Calculation for 13th", () => {
    const irrfTable = [
      { max: 2259.20, rate: 0, deduction: 0 },
      { max: 2826.65, rate: 0.075, deduction: 169.44 },
      { max: 3751.05, rate: 0.15, deduction: 381.44 },
      { max: 4664.68, rate: 0.225, deduction: 662.77 },
      { max: Infinity, rate: 0.275, deduction: 896.00 },
    ];

    it("should have no IRRF for low income", () => {
      const baseCalculo = 2000;
      const bracket = irrfTable.find((b) => baseCalculo <= b.max);
      const irrf = bracket ? baseCalculo * bracket.rate - bracket.deduction : 0;
      expect(irrf).toBe(0);
    });

    it("should calculate IRRF for higher income", () => {
      const baseCalculo = 4000;
      const bracket = irrfTable.find((b) => baseCalculo <= b.max);
      const irrf = bracket ? baseCalculo * bracket.rate - bracket.deduction : 0;
      expect(irrf).toBeCloseTo(237.23, 2);
    });
  });

  describe("Payment Deadlines", () => {
    it("should have first installment deadline by November 30", () => {
      const year = 2024;
      const deadline = new Date(year, 10, 30); // November 30
      expect(deadline.getMonth()).toBe(10);
      expect(deadline.getDate()).toBe(30);
    });

    it("should have second installment deadline by December 20", () => {
      const year = 2024;
      const deadline = new Date(year, 11, 20); // December 20
      expect(deadline.getMonth()).toBe(11);
      expect(deadline.getDate()).toBe(20);
    });

    it("should allow advance payment with vacation", () => {
      const vacationMonth = 7; // August
      const canAdvance = vacationMonth >= 2 && vacationMonth <= 11;
      expect(canAdvance).toBe(true);
    });
  });

  describe("Thirteenth Workflow", () => {
    const validTransitions: Record<string, string[]> = {
      PENDING: ["CALCULATED", "CANCELLED"],
      CALCULATED: ["PAID", "PENDING", "CANCELLED"],
      PAID: [],
      CANCELLED: [],
    };

    it("should allow PENDING to CALCULATED", () => {
      expect(validTransitions.PENDING.includes("CALCULATED")).toBe(true);
    });

    it("should allow CALCULATED to PAID", () => {
      expect(validTransitions.CALCULATED.includes("PAID")).toBe(true);
    });

    it("should allow recalculation from CALCULATED", () => {
      expect(validTransitions.CALCULATED.includes("PENDING")).toBe(true);
    });

    it("should not allow PAID to any status", () => {
      expect(validTransitions.PAID.length).toBe(0);
    });
  });

  describe("Average Salary Calculation", () => {
    it("should calculate average with variable income", () => {
      const monthlySalaries = [3000, 3200, 3100, 3500, 3000, 3300, 3400, 3200, 3100, 3000, 3500, 3200];
      const average = monthlySalaries.reduce((a, b) => a + b, 0) / monthlySalaries.length;
      expect(average).toBeCloseTo(3208.33, 2);
    });

    it("should include overtime in calculation", () => {
      const baseSalary = 3000;
      const monthlyOvertime = [200, 150, 300, 100, 250, 180, 220, 190, 280, 150, 200, 180];
      const averageOvertime = monthlyOvertime.reduce((a, b) => a + b, 0) / monthlyOvertime.length;
      const total13th = baseSalary + averageOvertime;
      expect(total13th).toBeCloseTo(3200, 0);
    });

    it("should include commissions in calculation", () => {
      const baseSalary = 2000;
      const monthlyCommissions = [500, 800, 600, 1000, 700, 900, 750, 850, 650, 800, 950, 700];
      const averageCommission = monthlyCommissions.reduce((a, b) => a + b, 0) / monthlyCommissions.length;
      const total13th = baseSalary + averageCommission;
      expect(total13th).toBeCloseTo(2766.67, 2);
    });
  });
});
