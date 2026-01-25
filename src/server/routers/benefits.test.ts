import { describe, it, expect } from "vitest";
import { z } from "zod";

/**
 * Testes de schema para o router benefits (Benefícios e Treinamentos)
 * Valida inputs e estruturas de dados de benefícios de funcionários
 */

// Schema de categoria de benefício
const benefitCategorySchema = z.enum([
  "TRANSPORT",
  "MEAL",
  "FOOD",
  "HEALTH",
  "DENTAL",
  "LIFE_INSURANCE",
  "PENSION",
  "EDUCATION",
  "CHILDCARE",
  "OTHER",
]);

// Schema de status de benefício
const benefitStatusSchema = z.enum(["ACTIVE", "SUSPENDED", "CANCELLED"]);

// Schema de tipo de cálculo
const calculationTypeSchema = z.enum([
  "FIXED",
  "PERCENTAGE",
  "PER_DAY",
  "PER_DEPENDENT",
]);

// Schema de status de treinamento
const trainingStatusSchema = z.enum([
  "SCHEDULED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
  "EXPIRED",
]);

// Schema de listagem de tipos de benefício
const listBenefitTypesInputSchema = z.object({
  category: benefitCategorySchema.optional(),
  includeInactive: z.boolean().default(false),
}).optional();

// Schema de criação de tipo de benefício
const createBenefitTypeInputSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  category: benefitCategorySchema,
  calculationType: calculationTypeSchema.default("FIXED"),
  defaultValue: z.number().optional(),
  defaultPercentage: z.number().optional(),
  employeeDiscountPercent: z.number().optional(),
  isTaxable: z.boolean().default(false),
  affectsInss: z.boolean().default(false),
  affectsIrrf: z.boolean().default(false),
  affectsFgts: z.boolean().default(false),
});

// Schema de atribuição de benefício
const assignBenefitInputSchema = z.object({
  employeeId: z.string().uuid(),
  benefitTypeId: z.string().uuid(),
  value: z.number().optional(),
  startDate: z.string(),
  endDate: z.string().optional(),
  notes: z.string().optional(),
});

// Schema de treinamento
const createTrainingInputSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string(),
  duration: z.number().positive(),
  durationUnit: z.enum(["HOURS", "DAYS"]),
  isMandatory: z.boolean().default(false),
  validityMonths: z.number().optional(),
  maxParticipants: z.number().optional(),
});

// Schema de inscrição em treinamento
const enrollTrainingInputSchema = z.object({
  trainingId: z.string().uuid(),
  employeeId: z.string().uuid(),
  scheduledDate: z.string(),
  notes: z.string().optional(),
});

// Constante de desconto de VT
const VT_DISCOUNT_PERCENTAGE = 0.06;

describe("Benefits Router Schemas", () => {
  describe("Benefit Category Schema", () => {
    it("should accept TRANSPORT category", () => {
      const result = benefitCategorySchema.safeParse("TRANSPORT");
      expect(result.success).toBe(true);
    });

    it("should accept MEAL category", () => {
      const result = benefitCategorySchema.safeParse("MEAL");
      expect(result.success).toBe(true);
    });

    it("should accept FOOD category", () => {
      const result = benefitCategorySchema.safeParse("FOOD");
      expect(result.success).toBe(true);
    });

    it("should accept HEALTH category", () => {
      const result = benefitCategorySchema.safeParse("HEALTH");
      expect(result.success).toBe(true);
    });

    it("should accept DENTAL category", () => {
      const result = benefitCategorySchema.safeParse("DENTAL");
      expect(result.success).toBe(true);
    });

    it("should accept LIFE_INSURANCE category", () => {
      const result = benefitCategorySchema.safeParse("LIFE_INSURANCE");
      expect(result.success).toBe(true);
    });

    it("should accept PENSION category", () => {
      const result = benefitCategorySchema.safeParse("PENSION");
      expect(result.success).toBe(true);
    });

    it("should accept EDUCATION category", () => {
      const result = benefitCategorySchema.safeParse("EDUCATION");
      expect(result.success).toBe(true);
    });

    it("should accept CHILDCARE category", () => {
      const result = benefitCategorySchema.safeParse("CHILDCARE");
      expect(result.success).toBe(true);
    });

    it("should accept OTHER category", () => {
      const result = benefitCategorySchema.safeParse("OTHER");
      expect(result.success).toBe(true);
    });

    it("should reject invalid category", () => {
      const result = benefitCategorySchema.safeParse("INVALID");
      expect(result.success).toBe(false);
    });
  });

  describe("Benefit Status Schema", () => {
    it("should accept ACTIVE status", () => {
      const result = benefitStatusSchema.safeParse("ACTIVE");
      expect(result.success).toBe(true);
    });

    it("should accept SUSPENDED status", () => {
      const result = benefitStatusSchema.safeParse("SUSPENDED");
      expect(result.success).toBe(true);
    });

    it("should accept CANCELLED status", () => {
      const result = benefitStatusSchema.safeParse("CANCELLED");
      expect(result.success).toBe(true);
    });

    it("should reject invalid status", () => {
      const result = benefitStatusSchema.safeParse("INVALID");
      expect(result.success).toBe(false);
    });
  });

  describe("Calculation Type Schema", () => {
    it("should accept FIXED type", () => {
      const result = calculationTypeSchema.safeParse("FIXED");
      expect(result.success).toBe(true);
    });

    it("should accept PERCENTAGE type", () => {
      const result = calculationTypeSchema.safeParse("PERCENTAGE");
      expect(result.success).toBe(true);
    });

    it("should accept PER_DAY type", () => {
      const result = calculationTypeSchema.safeParse("PER_DAY");
      expect(result.success).toBe(true);
    });

    it("should accept PER_DEPENDENT type", () => {
      const result = calculationTypeSchema.safeParse("PER_DEPENDENT");
      expect(result.success).toBe(true);
    });

    it("should reject invalid type", () => {
      const result = calculationTypeSchema.safeParse("INVALID");
      expect(result.success).toBe(false);
    });
  });

  describe("Training Status Schema", () => {
    it("should accept SCHEDULED status", () => {
      const result = trainingStatusSchema.safeParse("SCHEDULED");
      expect(result.success).toBe(true);
    });

    it("should accept IN_PROGRESS status", () => {
      const result = trainingStatusSchema.safeParse("IN_PROGRESS");
      expect(result.success).toBe(true);
    });

    it("should accept COMPLETED status", () => {
      const result = trainingStatusSchema.safeParse("COMPLETED");
      expect(result.success).toBe(true);
    });

    it("should accept CANCELLED status", () => {
      const result = trainingStatusSchema.safeParse("CANCELLED");
      expect(result.success).toBe(true);
    });

    it("should accept EXPIRED status", () => {
      const result = trainingStatusSchema.safeParse("EXPIRED");
      expect(result.success).toBe(true);
    });

    it("should reject invalid status", () => {
      const result = trainingStatusSchema.safeParse("INVALID");
      expect(result.success).toBe(false);
    });
  });

  describe("List Benefit Types Input Schema", () => {
    it("should accept undefined input", () => {
      const result = listBenefitTypesInputSchema.safeParse(undefined);
      expect(result.success).toBe(true);
    });

    it("should accept empty object", () => {
      const result = listBenefitTypesInputSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("should accept category filter", () => {
      const result = listBenefitTypesInputSchema.safeParse({
        category: "HEALTH",
      });
      expect(result.success).toBe(true);
    });

    it("should accept includeInactive filter", () => {
      const result = listBenefitTypesInputSchema.safeParse({
        includeInactive: true,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("Create Benefit Type Input Schema", () => {
    it("should accept minimal valid input", () => {
      const result = createBenefitTypeInputSchema.safeParse({
        code: "VT",
        name: "Vale Transporte",
        category: "TRANSPORT",
      });
      expect(result.success).toBe(true);
    });

    it("should accept complete input", () => {
      const result = createBenefitTypeInputSchema.safeParse({
        code: "PS",
        name: "Plano de Saúde",
        description: "Plano de saúde empresarial",
        category: "HEALTH",
        calculationType: "FIXED",
        defaultValue: 500,
        employeeDiscountPercent: 30,
        isTaxable: false,
        affectsInss: false,
        affectsIrrf: false,
        affectsFgts: false,
      });
      expect(result.success).toBe(true);
    });

    it("should reject empty code", () => {
      const result = createBenefitTypeInputSchema.safeParse({
        code: "",
        name: "Vale Transporte",
        category: "TRANSPORT",
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty name", () => {
      const result = createBenefitTypeInputSchema.safeParse({
        code: "VT",
        name: "",
        category: "TRANSPORT",
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing category", () => {
      const result = createBenefitTypeInputSchema.safeParse({
        code: "VT",
        name: "Vale Transporte",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Assign Benefit Input Schema", () => {
    it("should accept valid input", () => {
      const result = assignBenefitInputSchema.safeParse({
        employeeId: "123e4567-e89b-12d3-a456-426614174000",
        benefitTypeId: "123e4567-e89b-12d3-a456-426614174001",
        startDate: "2024-01-01",
      });
      expect(result.success).toBe(true);
    });

    it("should accept complete input", () => {
      const result = assignBenefitInputSchema.safeParse({
        employeeId: "123e4567-e89b-12d3-a456-426614174000",
        benefitTypeId: "123e4567-e89b-12d3-a456-426614174001",
        value: 500,
        startDate: "2024-01-01",
        endDate: "2024-12-31",
        notes: "Benefício anual",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing employeeId", () => {
      const result = assignBenefitInputSchema.safeParse({
        benefitTypeId: "123e4567-e89b-12d3-a456-426614174001",
        startDate: "2024-01-01",
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing benefitTypeId", () => {
      const result = assignBenefitInputSchema.safeParse({
        employeeId: "123e4567-e89b-12d3-a456-426614174000",
        startDate: "2024-01-01",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Create Training Input Schema", () => {
    it("should accept valid input", () => {
      const result = createTrainingInputSchema.safeParse({
        code: "NR35",
        name: "Trabalho em Altura",
        category: "SEGURANÇA",
        duration: 8,
        durationUnit: "HOURS",
      });
      expect(result.success).toBe(true);
    });

    it("should accept complete input", () => {
      const result = createTrainingInputSchema.safeParse({
        code: "NR10",
        name: "Segurança em Instalações Elétricas",
        description: "Treinamento obrigatório NR-10",
        category: "SEGURANÇA",
        duration: 40,
        durationUnit: "HOURS",
        isMandatory: true,
        validityMonths: 24,
        maxParticipants: 20,
      });
      expect(result.success).toBe(true);
    });

    it("should reject zero duration", () => {
      const result = createTrainingInputSchema.safeParse({
        code: "NR35",
        name: "Trabalho em Altura",
        category: "SEGURANÇA",
        duration: 0,
        durationUnit: "HOURS",
      });
      expect(result.success).toBe(false);
    });

    it("should reject negative duration", () => {
      const result = createTrainingInputSchema.safeParse({
        code: "NR35",
        name: "Trabalho em Altura",
        category: "SEGURANÇA",
        duration: -8,
        durationUnit: "HOURS",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Enroll Training Input Schema", () => {
    it("should accept valid input", () => {
      const result = enrollTrainingInputSchema.safeParse({
        trainingId: "123e4567-e89b-12d3-a456-426614174000",
        employeeId: "123e4567-e89b-12d3-a456-426614174001",
        scheduledDate: "2024-02-15",
      });
      expect(result.success).toBe(true);
    });

    it("should accept input with notes", () => {
      const result = enrollTrainingInputSchema.safeParse({
        trainingId: "123e4567-e89b-12d3-a456-426614174000",
        employeeId: "123e4567-e89b-12d3-a456-426614174001",
        scheduledDate: "2024-02-15",
        notes: "Prioridade alta",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing trainingId", () => {
      const result = enrollTrainingInputSchema.safeParse({
        employeeId: "123e4567-e89b-12d3-a456-426614174001",
        scheduledDate: "2024-02-15",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Vale Transporte Calculations", () => {
    it("should calculate VT discount correctly", () => {
      const salary = 3000;
      const vtValue = 300;
      const maxDiscount = salary * VT_DISCOUNT_PERCENTAGE;
      const actualDiscount = Math.min(vtValue, maxDiscount);
      expect(maxDiscount).toBe(180);
      expect(actualDiscount).toBe(180);
    });

    it("should cap VT discount at 6%", () => {
      const salary = 2000;
      const vtValue = 500;
      const maxDiscount = salary * VT_DISCOUNT_PERCENTAGE;
      const actualDiscount = Math.min(vtValue, maxDiscount);
      expect(maxDiscount).toBe(120);
      expect(actualDiscount).toBe(120);
    });

    it("should use full VT value when below 6%", () => {
      const salary = 5000;
      const vtValue = 200;
      const maxDiscount = salary * VT_DISCOUNT_PERCENTAGE;
      const actualDiscount = Math.min(vtValue, maxDiscount);
      expect(maxDiscount).toBe(300);
      expect(actualDiscount).toBe(200);
    });
  });

  describe("Benefit Tax Impact", () => {
    it("should identify taxable benefits", () => {
      const benefits = [
        { name: "Vale Transporte", isTaxable: false },
        { name: "Vale Alimentação", isTaxable: false },
        { name: "Auxílio Moradia", isTaxable: true },
        { name: "Plano de Saúde", isTaxable: false },
      ];
      const taxable = benefits.filter((b) => b.isTaxable);
      expect(taxable.length).toBe(1);
      expect(taxable[0].name).toBe("Auxílio Moradia");
    });

    it("should identify benefits affecting INSS", () => {
      const benefits = [
        { name: "Vale Transporte", affectsInss: false },
        { name: "Comissão", affectsInss: true },
        { name: "Hora Extra", affectsInss: true },
      ];
      const affectsInss = benefits.filter((b) => b.affectsInss);
      expect(affectsInss.length).toBe(2);
    });
  });

  describe("Training Validity", () => {
    it("should check if training is expired", () => {
      const completedDate = new Date("2022-01-15");
      const validityMonths = 24;
      const expirationDate = new Date(completedDate);
      expirationDate.setMonth(expirationDate.getMonth() + validityMonths);
      const today = new Date("2024-06-15");
      const isExpired = today > expirationDate;
      expect(isExpired).toBe(true);
    });

    it("should check if training is still valid", () => {
      const completedDate = new Date("2023-06-15");
      const validityMonths = 24;
      const expirationDate = new Date(completedDate);
      expirationDate.setMonth(expirationDate.getMonth() + validityMonths);
      const today = new Date("2024-06-15");
      const isExpired = today > expirationDate;
      expect(isExpired).toBe(false);
    });

    it("should calculate days until expiration", () => {
      const expirationDate = new Date("2024-12-31");
      const today = new Date("2024-06-15");
      const daysUntilExpiration = Math.ceil(
        (expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      expect(daysUntilExpiration).toBe(199);
    });
  });
});
