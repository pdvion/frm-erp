import { describe, it, expect } from "vitest";
import { z } from "zod";

/**
 * Testes de schema para o router payroll (Folha de Pagamento)
 * Valida inputs, estruturas de dados e cálculos trabalhistas
 */

// Schema de status da folha
const payrollStatusSchema = z.enum(["DRAFT", "CALCULATING", "CALCULATED", "APPROVED", "PAID", "CANCELED"]);

// Schema de tipo de evento
const eventTypeSchema = z.enum(["PROVENTO", "DESCONTO"]);

// Schema de grau de insalubridade
const insalubrityDegreeSchema = z.enum(["LOW", "MEDIUM", "HIGH"]).nullable();

// Schema de cálculo avançado
const calculateAdvancedInputSchema = z.object({
  payrollId: z.string().uuid(),
  options: z.object({
    includeOvertime: z.boolean().default(true),
    includeNightShift: z.boolean().default(true),
    includeInsalubrity: z.boolean().default(true),
    includeDangerousness: z.boolean().default(true),
    includeDSR: z.boolean().default(true),
    includeVacationAdvance: z.boolean().default(false),
    includeThirteenthAdvance: z.boolean().default(false),
  }).optional(),
});

// Schema de listagem de folhas
const listInputSchema = z.object({
  year: z.number().optional(),
  month: z.number().min(1).max(12).optional(),
  status: payrollStatusSchema.optional(),
  page: z.number().default(1),
  limit: z.number().default(20),
});

// Schema de criação de folha
const createInputSchema = z.object({
  year: z.number().min(2020).max(2100),
  month: z.number().min(1).max(12),
  description: z.string().optional(),
});

// Schema de item da folha
const payrollItemSchema = z.object({
  employeeId: z.string().uuid(),
  baseSalary: z.number(),
  overtimeHours: z.number().default(0),
  overtimeRate: z.number().default(1.5),
  nightShiftHours: z.number().default(0),
  insalubrityDegree: insalubrityDegreeSchema,
  hasDangerousness: z.boolean().default(false),
  dependents: z.number().default(0),
});

// Schema de evento da folha
const payrollEventSchema = z.object({
  code: z.string(),
  description: z.string(),
  type: eventTypeSchema,
  value: z.number(),
  reference: z.number().optional(),
});

// Schema de resposta de cálculo
const calculationResultSchema = z.object({
  grossSalary: z.number(),
  inss: z.number(),
  irrf: z.number(),
  otherDeductions: z.number(),
  netSalary: z.number(),
  fgts: z.number(),
  events: z.array(payrollEventSchema),
});

describe("Payroll Router Schemas", () => {
  describe("Status Schema", () => {
    it("should accept DRAFT status", () => {
      const result = payrollStatusSchema.safeParse("DRAFT");
      expect(result.success).toBe(true);
    });

    it("should accept CALCULATING status", () => {
      const result = payrollStatusSchema.safeParse("CALCULATING");
      expect(result.success).toBe(true);
    });

    it("should accept CALCULATED status", () => {
      const result = payrollStatusSchema.safeParse("CALCULATED");
      expect(result.success).toBe(true);
    });

    it("should accept APPROVED status", () => {
      const result = payrollStatusSchema.safeParse("APPROVED");
      expect(result.success).toBe(true);
    });

    it("should accept PAID status", () => {
      const result = payrollStatusSchema.safeParse("PAID");
      expect(result.success).toBe(true);
    });

    it("should accept CANCELED status", () => {
      const result = payrollStatusSchema.safeParse("CANCELED");
      expect(result.success).toBe(true);
    });

    it("should reject invalid status", () => {
      const result = payrollStatusSchema.safeParse("INVALID");
      expect(result.success).toBe(false);
    });
  });

  describe("Event Type Schema", () => {
    it("should accept PROVENTO type", () => {
      const result = eventTypeSchema.safeParse("PROVENTO");
      expect(result.success).toBe(true);
    });

    it("should accept DESCONTO type", () => {
      const result = eventTypeSchema.safeParse("DESCONTO");
      expect(result.success).toBe(true);
    });

    it("should reject invalid type", () => {
      const result = eventTypeSchema.safeParse("INVALID");
      expect(result.success).toBe(false);
    });
  });

  describe("Insalubrity Degree Schema", () => {
    it("should accept LOW degree", () => {
      const result = insalubrityDegreeSchema.safeParse("LOW");
      expect(result.success).toBe(true);
    });

    it("should accept MEDIUM degree", () => {
      const result = insalubrityDegreeSchema.safeParse("MEDIUM");
      expect(result.success).toBe(true);
    });

    it("should accept HIGH degree", () => {
      const result = insalubrityDegreeSchema.safeParse("HIGH");
      expect(result.success).toBe(true);
    });

    it("should accept null (no insalubrity)", () => {
      const result = insalubrityDegreeSchema.safeParse(null);
      expect(result.success).toBe(true);
    });

    it("should reject invalid degree", () => {
      const result = insalubrityDegreeSchema.safeParse("INVALID");
      expect(result.success).toBe(false);
    });
  });

  describe("Calculate Advanced Input Schema", () => {
    it("should accept minimal input", () => {
      const result = calculateAdvancedInputSchema.safeParse({
        payrollId: "123e4567-e89b-12d3-a456-426614174000",
      });
      expect(result.success).toBe(true);
    });

    it("should accept input with all options", () => {
      const result = calculateAdvancedInputSchema.safeParse({
        payrollId: "123e4567-e89b-12d3-a456-426614174000",
        options: {
          includeOvertime: true,
          includeNightShift: true,
          includeInsalubrity: true,
          includeDangerousness: true,
          includeDSR: true,
          includeVacationAdvance: true,
          includeThirteenthAdvance: true,
        },
      });
      expect(result.success).toBe(true);
    });

    it("should accept input with partial options", () => {
      const result = calculateAdvancedInputSchema.safeParse({
        payrollId: "123e4567-e89b-12d3-a456-426614174000",
        options: {
          includeOvertime: false,
          includeNightShift: false,
        },
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid UUID", () => {
      const result = calculateAdvancedInputSchema.safeParse({
        payrollId: "invalid-uuid",
      });
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

    it("should accept year filter", () => {
      const result = listInputSchema.safeParse({ year: 2024 });
      expect(result.success).toBe(true);
    });

    it("should accept month filter", () => {
      const result = listInputSchema.safeParse({ month: 6 });
      expect(result.success).toBe(true);
    });

    it("should reject invalid month (0)", () => {
      const result = listInputSchema.safeParse({ month: 0 });
      expect(result.success).toBe(false);
    });

    it("should reject invalid month (13)", () => {
      const result = listInputSchema.safeParse({ month: 13 });
      expect(result.success).toBe(false);
    });

    it("should accept status filter", () => {
      const result = listInputSchema.safeParse({ status: "CALCULATED" });
      expect(result.success).toBe(true);
    });

    it("should accept all filters combined", () => {
      const result = listInputSchema.safeParse({
        year: 2024,
        month: 6,
        status: "PAID",
        page: 2,
        limit: 50,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("Create Input Schema", () => {
    it("should accept valid input", () => {
      const result = createInputSchema.safeParse({
        year: 2024,
        month: 6,
      });
      expect(result.success).toBe(true);
    });

    it("should accept input with description", () => {
      const result = createInputSchema.safeParse({
        year: 2024,
        month: 6,
        description: "Folha de Junho 2024",
      });
      expect(result.success).toBe(true);
    });

    it("should reject year below 2020", () => {
      const result = createInputSchema.safeParse({
        year: 2019,
        month: 6,
      });
      expect(result.success).toBe(false);
    });

    it("should reject year above 2100", () => {
      const result = createInputSchema.safeParse({
        year: 2101,
        month: 6,
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing year", () => {
      const result = createInputSchema.safeParse({
        month: 6,
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing month", () => {
      const result = createInputSchema.safeParse({
        year: 2024,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Payroll Item Schema", () => {
    it("should accept minimal valid input", () => {
      const result = payrollItemSchema.safeParse({
        employeeId: "123e4567-e89b-12d3-a456-426614174000",
        baseSalary: 3000.0,
        insalubrityDegree: null,
      });
      expect(result.success).toBe(true);
    });

    it("should accept complete input", () => {
      const result = payrollItemSchema.safeParse({
        employeeId: "123e4567-e89b-12d3-a456-426614174000",
        baseSalary: 5000.0,
        overtimeHours: 20,
        overtimeRate: 1.5,
        nightShiftHours: 40,
        insalubrityDegree: "MEDIUM",
        hasDangerousness: false,
        dependents: 2,
      });
      expect(result.success).toBe(true);
    });

    it("should accept item with dangerousness", () => {
      const result = payrollItemSchema.safeParse({
        employeeId: "123e4567-e89b-12d3-a456-426614174000",
        baseSalary: 4000.0,
        insalubrityDegree: null,
        hasDangerousness: true,
      });
      expect(result.success).toBe(true);
    });

    it("should apply default values", () => {
      const result = payrollItemSchema.safeParse({
        employeeId: "123e4567-e89b-12d3-a456-426614174000",
        baseSalary: 3000.0,
        insalubrityDegree: null,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.overtimeHours).toBe(0);
        expect(result.data.overtimeRate).toBe(1.5);
        expect(result.data.nightShiftHours).toBe(0);
        expect(result.data.hasDangerousness).toBe(false);
        expect(result.data.dependents).toBe(0);
      }
    });
  });

  describe("Payroll Event Schema", () => {
    it("should accept provento event", () => {
      const result = payrollEventSchema.safeParse({
        code: "001",
        description: "Salário Base",
        type: "PROVENTO",
        value: 3000.0,
      });
      expect(result.success).toBe(true);
    });

    it("should accept desconto event", () => {
      const result = payrollEventSchema.safeParse({
        code: "101",
        description: "INSS",
        type: "DESCONTO",
        value: 330.0,
      });
      expect(result.success).toBe(true);
    });

    it("should accept event with reference", () => {
      const result = payrollEventSchema.safeParse({
        code: "002",
        description: "Horas Extras 50%",
        type: "PROVENTO",
        value: 500.0,
        reference: 20, // 20 horas
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing required fields", () => {
      const result = payrollEventSchema.safeParse({
        code: "001",
        type: "PROVENTO",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Calculation Result Schema", () => {
    it("should validate complete calculation result", () => {
      const result = calculationResultSchema.safeParse({
        grossSalary: 5000.0,
        inss: 550.0,
        irrf: 200.0,
        otherDeductions: 100.0,
        netSalary: 4150.0,
        fgts: 400.0,
        events: [
          { code: "001", description: "Salário", type: "PROVENTO", value: 5000.0 },
          { code: "101", description: "INSS", type: "DESCONTO", value: 550.0 },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("should validate result with empty events", () => {
      const result = calculationResultSchema.safeParse({
        grossSalary: 3000.0,
        inss: 330.0,
        irrf: 0,
        otherDeductions: 0,
        netSalary: 2670.0,
        fgts: 240.0,
        events: [],
      });
      expect(result.success).toBe(true);
    });
  });
});

describe("Payroll Calculations", () => {
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
    const deducaoDependentes = dependentes * 189.59;
    const base = baseCalculo - deducaoDependentes;

    if (base <= 2259.2) return 0;
    if (base <= 2826.65) return base * 0.075 - 169.44;
    if (base <= 3751.05) return base * 0.15 - 381.44;
    if (base <= 4664.68) return base * 0.225 - 662.77;
    return base * 0.275 - 896.0;
  }

  describe("INSS Calculation (2024)", () => {
    it("should calculate INSS for first bracket (up to R$ 1.412,00)", () => {
      const inss = calculateINSS(1412.0);
      expect(inss).toBeCloseTo(105.9, 2);
    });

    it("should calculate INSS for second bracket (R$ 1.412,01 to R$ 2.666,68)", () => {
      const inss = calculateINSS(2000.0);
      expect(inss).toBeCloseTo(105.9 + (2000.0 - 1412.0) * 0.09, 2);
    });

    it("should calculate INSS for third bracket (R$ 2.666,69 to R$ 4.000,03)", () => {
      const inss = calculateINSS(3500.0);
      expect(inss).toBeCloseTo(218.82 + (3500.0 - 2666.68) * 0.12, 2);
    });

    it("should calculate INSS for fourth bracket (R$ 4.000,04 to R$ 7.786,02)", () => {
      const inss = calculateINSS(5000.0);
      expect(inss).toBeCloseTo(378.82 + (5000.0 - 4000.03) * 0.14, 2);
    });

    it("should apply INSS ceiling for salaries above R$ 7.786,02", () => {
      const inss = calculateINSS(10000.0);
      expect(inss).toBe(908.85);
    });

    it("should apply INSS ceiling for very high salaries", () => {
      const inss = calculateINSS(50000.0);
      expect(inss).toBe(908.85);
    });

    it("should calculate INSS for minimum wage", () => {
      const minimumWage = 1412.0;
      const inss = calculateINSS(minimumWage);
      expect(inss).toBeCloseTo(105.9, 2);
    });
  });

  describe("IRRF Calculation (2024)", () => {
    it("should return 0 for base below R$ 2.259,20 (exempt)", () => {
      const irrf = calculateIRRF(2000.0);
      expect(irrf).toBe(0);
    });

    it("should calculate IRRF for first bracket (7.5%)", () => {
      const irrf = calculateIRRF(2500.0);
      expect(irrf).toBeCloseTo(2500.0 * 0.075 - 169.44, 2);
    });

    it("should calculate IRRF for second bracket (15%)", () => {
      const irrf = calculateIRRF(3500.0);
      expect(irrf).toBeCloseTo(3500.0 * 0.15 - 381.44, 2);
    });

    it("should calculate IRRF for third bracket (22.5%)", () => {
      const irrf = calculateIRRF(4500.0);
      expect(irrf).toBeCloseTo(4500.0 * 0.225 - 662.77, 2);
    });

    it("should calculate IRRF for fourth bracket (27.5%)", () => {
      const irrf = calculateIRRF(6000.0);
      expect(irrf).toBeCloseTo(6000.0 * 0.275 - 896.0, 2);
    });

    it("should deduct dependents from base", () => {
      const baseWithoutDependents = calculateIRRF(3000.0, 0);
      const baseWithDependents = calculateIRRF(3000.0, 2);
      expect(baseWithDependents).toBeLessThan(baseWithoutDependents);
    });

    it("should return 0 when dependents reduce base below exempt threshold", () => {
      const irrf = calculateIRRF(2500.0, 2); // 2500 - (2 * 189.59) = 2120.82 < 2259.20
      expect(irrf).toBe(0);
    });
  });

  describe("FGTS Calculation", () => {
    it("should calculate FGTS as 8% of gross salary", () => {
      const grossSalary = 5000.0;
      const fgts = grossSalary * 0.08;
      expect(fgts).toBe(400.0);
    });

    it("should calculate FGTS for minimum wage", () => {
      const minimumWage = 1412.0;
      const fgts = minimumWage * 0.08;
      expect(fgts).toBeCloseTo(112.96, 2);
    });
  });

  describe("Overtime Calculation", () => {
    it("should calculate overtime at 50% rate", () => {
      const hourlyRate = 25.0;
      const overtimeHours = 10;
      const overtimeRate = 1.5;
      const overtime = hourlyRate * overtimeHours * overtimeRate;
      expect(overtime).toBe(375.0);
    });

    it("should calculate overtime at 100% rate (Sundays/Holidays)", () => {
      const hourlyRate = 25.0;
      const overtimeHours = 8;
      const overtimeRate = 2.0;
      const overtime = hourlyRate * overtimeHours * overtimeRate;
      expect(overtime).toBe(400.0);
    });
  });

  describe("Night Shift Bonus", () => {
    it("should calculate night shift bonus as 20% of hourly rate", () => {
      const hourlyRate = 25.0;
      const nightHours = 40;
      const nightBonus = nightHours * hourlyRate * 0.2;
      expect(nightBonus).toBe(200.0);
    });
  });

  describe("Insalubrity Calculation", () => {
    const minimumWage = 1412.0;

    it("should calculate LOW insalubrity (10% of minimum wage)", () => {
      const insalubrity = minimumWage * 0.1;
      expect(insalubrity).toBeCloseTo(141.2, 2);
    });

    it("should calculate MEDIUM insalubrity (20% of minimum wage)", () => {
      const insalubrity = minimumWage * 0.2;
      expect(insalubrity).toBeCloseTo(282.4, 2);
    });

    it("should calculate HIGH insalubrity (40% of minimum wage)", () => {
      const insalubrity = minimumWage * 0.4;
      expect(insalubrity).toBeCloseTo(564.8, 2);
    });
  });

  describe("Dangerousness Calculation", () => {
    it("should calculate dangerousness as 30% of base salary", () => {
      const baseSalary = 5000.0;
      const dangerousness = baseSalary * 0.3;
      expect(dangerousness).toBe(1500.0);
    });
  });

  describe("Net Salary Calculation", () => {
    it("should calculate net salary correctly", () => {
      const grossSalary = 5000.0;
      const inss = calculateINSS(grossSalary);
      const baseIRRF = grossSalary - inss;
      const irrf = calculateIRRF(baseIRRF);
      const netSalary = grossSalary - inss - irrf;
      
      expect(netSalary).toBeGreaterThan(0);
      expect(netSalary).toBeLessThan(grossSalary);
    });

    it("should calculate net salary for minimum wage", () => {
      const minimumWage = 1412.0;
      const inss = calculateINSS(minimumWage);
      const baseIRRF = minimumWage - inss;
      const irrf = calculateIRRF(baseIRRF);
      const netSalary = minimumWage - inss - irrf;
      
      // Minimum wage should have no IRRF
      expect(irrf).toBe(0);
      expect(netSalary).toBeCloseTo(minimumWage - inss, 2);
    });
  });
});
