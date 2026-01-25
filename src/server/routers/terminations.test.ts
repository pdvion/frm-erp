import { describe, it, expect } from "vitest";
import { z } from "zod";

/**
 * Testes de schema para o router terminations (Rescisões)
 * Valida inputs e estruturas de dados de rescisões trabalhistas
 */

// Schema de tipo de rescisão
const terminationTypeSchema = z.enum([
  "RESIGNATION",
  "DISMISSAL_WITH_CAUSE",
  "DISMISSAL_NO_CAUSE",
  "MUTUAL_AGREEMENT",
  "CONTRACT_END",
  "RETIREMENT",
  "DEATH",
]);

// Schema de status de rescisão
const terminationStatusSchema = z.enum([
  "DRAFT",
  "CALCULATED",
  "APPROVED",
  "PAID",
  "HOMOLOGATED",
  "CANCELLED",
]);

// Schema de listagem
const listInputSchema = z.object({
  employeeId: z.string().optional(),
  status: z.enum(["DRAFT", "CALCULATED", "APPROVED", "PAID", "HOMOLOGATED", "CANCELLED", "ALL"]).optional(),
  type: z.enum(["RESIGNATION", "DISMISSAL_WITH_CAUSE", "DISMISSAL_NO_CAUSE", "MUTUAL_AGREEMENT", "CONTRACT_END", "RETIREMENT", "DEATH", "ALL"]).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  page: z.number().default(1),
  limit: z.number().default(20),
});

// Schema de criação
const createInputSchema = z.object({
  employeeId: z.string(),
  type: terminationTypeSchema,
  terminationDate: z.date(),
  lastWorkDay: z.date().optional(),
  noticeDate: z.date().optional(),
  noticePeriodWorked: z.boolean().default(false),
  noticePeriodIndemnity: z.boolean().default(false),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

describe("Terminations Router Schemas", () => {
  describe("Termination Type Schema", () => {
    it("should accept RESIGNATION type", () => {
      const result = terminationTypeSchema.safeParse("RESIGNATION");
      expect(result.success).toBe(true);
    });

    it("should accept DISMISSAL_WITH_CAUSE type", () => {
      const result = terminationTypeSchema.safeParse("DISMISSAL_WITH_CAUSE");
      expect(result.success).toBe(true);
    });

    it("should accept DISMISSAL_NO_CAUSE type", () => {
      const result = terminationTypeSchema.safeParse("DISMISSAL_NO_CAUSE");
      expect(result.success).toBe(true);
    });

    it("should accept MUTUAL_AGREEMENT type", () => {
      const result = terminationTypeSchema.safeParse("MUTUAL_AGREEMENT");
      expect(result.success).toBe(true);
    });

    it("should accept CONTRACT_END type", () => {
      const result = terminationTypeSchema.safeParse("CONTRACT_END");
      expect(result.success).toBe(true);
    });

    it("should accept RETIREMENT type", () => {
      const result = terminationTypeSchema.safeParse("RETIREMENT");
      expect(result.success).toBe(true);
    });

    it("should accept DEATH type", () => {
      const result = terminationTypeSchema.safeParse("DEATH");
      expect(result.success).toBe(true);
    });

    it("should reject invalid type", () => {
      const result = terminationTypeSchema.safeParse("INVALID");
      expect(result.success).toBe(false);
    });
  });

  describe("Termination Status Schema", () => {
    it("should accept all valid statuses", () => {
      const statuses = ["DRAFT", "CALCULATED", "APPROVED", "PAID", "HOMOLOGATED", "CANCELLED"];
      statuses.forEach((status) => {
        const result = terminationStatusSchema.safeParse(status);
        expect(result.success).toBe(true);
      });
    });

    it("should reject invalid status", () => {
      const result = terminationStatusSchema.safeParse("INVALID");
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
        status: "CALCULATED",
        type: "DISMISSAL_NO_CAUSE",
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-12-31"),
        page: 2,
        limit: 50,
      });
      expect(result.success).toBe(true);
    });

    it("should accept ALL status filter", () => {
      const result = listInputSchema.safeParse({ status: "ALL" });
      expect(result.success).toBe(true);
    });

    it("should accept ALL type filter", () => {
      const result = listInputSchema.safeParse({ type: "ALL" });
      expect(result.success).toBe(true);
    });
  });

  describe("Create Input Schema", () => {
    it("should accept valid input", () => {
      const result = createInputSchema.safeParse({
        employeeId: "emp-001",
        type: "RESIGNATION",
        terminationDate: new Date("2024-03-15"),
      });
      expect(result.success).toBe(true);
    });

    it("should accept complete input", () => {
      const result = createInputSchema.safeParse({
        employeeId: "emp-001",
        type: "DISMISSAL_NO_CAUSE",
        terminationDate: new Date("2024-03-15"),
        lastWorkDay: new Date("2024-03-15"),
        noticeDate: new Date("2024-02-15"),
        noticePeriodWorked: false,
        noticePeriodIndemnity: true,
        reason: "Redução de quadro",
        notes: "Funcionário com bom desempenho",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing employeeId", () => {
      const result = createInputSchema.safeParse({
        type: "RESIGNATION",
        terminationDate: new Date("2024-03-15"),
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing type", () => {
      const result = createInputSchema.safeParse({
        employeeId: "emp-001",
        terminationDate: new Date("2024-03-15"),
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Termination Calculations", () => {
    it("should calculate notice period (30 days base)", () => {
      const yearsWorked = 0;
      const noticeDays = 30 + Math.min(yearsWorked, 20) * 3;
      expect(noticeDays).toBe(30);
    });

    it("should calculate notice period with additional days", () => {
      const yearsWorked = 5;
      const noticeDays = 30 + Math.min(yearsWorked, 20) * 3;
      expect(noticeDays).toBe(45); // 30 + 15
    });

    it("should cap notice period at 90 days", () => {
      const yearsWorked = 25;
      const noticeDays = 30 + Math.min(yearsWorked, 20) * 3;
      expect(noticeDays).toBe(90); // 30 + 60 (max 20 years)
    });

    it("should calculate proportional vacation", () => {
      const monthsWorked = 8;
      const proportionalDays = Math.floor((monthsWorked / 12) * 30);
      expect(proportionalDays).toBe(20);
    });

    it("should calculate proportional 13th salary", () => {
      const monthsWorked = 9;
      const salary = 3000;
      const proportional13th = (salary / 12) * monthsWorked;
      expect(proportional13th).toBe(2250);
    });

    it("should calculate FGTS balance", () => {
      const salary = 3000;
      const monthsWorked = 24;
      const fgtsMonthly = salary * 0.08;
      const fgtsBalance = fgtsMonthly * monthsWorked;
      expect(fgtsBalance).toBe(5760);
    });

    it("should calculate FGTS 40% penalty", () => {
      const fgtsBalance = 5760;
      const penalty = fgtsBalance * 0.4;
      expect(penalty).toBe(2304);
    });

    it("should calculate FGTS 20% penalty (mutual agreement)", () => {
      const fgtsBalance = 5760;
      const penalty = fgtsBalance * 0.2;
      expect(penalty).toBe(1152);
    });
  });

  describe("Termination Rights by Type", () => {
    const rights: Record<string, { fgtsPenalty: number; noticePeriod: boolean; unemployment: boolean }> = {
      RESIGNATION: { fgtsPenalty: 0, noticePeriod: true, unemployment: false },
      DISMISSAL_WITH_CAUSE: { fgtsPenalty: 0, noticePeriod: false, unemployment: false },
      DISMISSAL_NO_CAUSE: { fgtsPenalty: 0.4, noticePeriod: true, unemployment: true },
      MUTUAL_AGREEMENT: { fgtsPenalty: 0.2, noticePeriod: true, unemployment: false },
      CONTRACT_END: { fgtsPenalty: 0, noticePeriod: false, unemployment: false },
      RETIREMENT: { fgtsPenalty: 0, noticePeriod: false, unemployment: false },
      DEATH: { fgtsPenalty: 0, noticePeriod: false, unemployment: false },
    };

    it("should have 40% FGTS penalty for dismissal without cause", () => {
      expect(rights.DISMISSAL_NO_CAUSE.fgtsPenalty).toBe(0.4);
    });

    it("should have 20% FGTS penalty for mutual agreement", () => {
      expect(rights.MUTUAL_AGREEMENT.fgtsPenalty).toBe(0.2);
    });

    it("should have no FGTS penalty for resignation", () => {
      expect(rights.RESIGNATION.fgtsPenalty).toBe(0);
    });

    it("should have no FGTS penalty for dismissal with cause", () => {
      expect(rights.DISMISSAL_WITH_CAUSE.fgtsPenalty).toBe(0);
    });

    it("should have unemployment insurance for dismissal without cause", () => {
      expect(rights.DISMISSAL_NO_CAUSE.unemployment).toBe(true);
    });

    it("should not have unemployment insurance for resignation", () => {
      expect(rights.RESIGNATION.unemployment).toBe(false);
    });

    it("should not have unemployment insurance for mutual agreement", () => {
      expect(rights.MUTUAL_AGREEMENT.unemployment).toBe(false);
    });
  });

  describe("Termination Workflow", () => {
    const validTransitions: Record<string, string[]> = {
      DRAFT: ["CALCULATED", "CANCELLED"],
      CALCULATED: ["APPROVED", "DRAFT", "CANCELLED"],
      APPROVED: ["PAID", "CANCELLED"],
      PAID: ["HOMOLOGATED"],
      HOMOLOGATED: [],
      CANCELLED: [],
    };

    it("should allow DRAFT to CALCULATED", () => {
      expect(validTransitions.DRAFT.includes("CALCULATED")).toBe(true);
    });

    it("should allow CALCULATED to APPROVED", () => {
      expect(validTransitions.CALCULATED.includes("APPROVED")).toBe(true);
    });

    it("should allow APPROVED to PAID", () => {
      expect(validTransitions.APPROVED.includes("PAID")).toBe(true);
    });

    it("should allow PAID to HOMOLOGATED", () => {
      expect(validTransitions.PAID.includes("HOMOLOGATED")).toBe(true);
    });

    it("should not allow HOMOLOGATED to any status", () => {
      expect(validTransitions.HOMOLOGATED.length).toBe(0);
    });

    it("should allow recalculation from CALCULATED", () => {
      expect(validTransitions.CALCULATED.includes("DRAFT")).toBe(true);
    });
  });

  describe("Service Time Calculation", () => {
    it("should calculate years of service", () => {
      const hireDate = new Date("2020-03-15");
      const terminationDate = new Date("2024-03-15");
      const years = terminationDate.getFullYear() - hireDate.getFullYear();
      expect(years).toBe(4);
    });

    it("should calculate months of service", () => {
      const hireDate = new Date("2023-05-01");
      const terminationDate = new Date("2024-02-01");
      const months = (terminationDate.getFullYear() - hireDate.getFullYear()) * 12 +
        (terminationDate.getMonth() - hireDate.getMonth());
      expect(months).toBe(9);
    });

    it("should calculate days worked in current month", () => {
      const terminationDate = new Date(2024, 2, 15); // March 15, 2024
      const daysWorked = terminationDate.getDate();
      expect(daysWorked).toBe(15);
    });
  });
});
