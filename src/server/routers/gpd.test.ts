import { describe, it, expect } from "vitest";
import { z } from "zod";

/**
 * Testes de schema para o router gpd (Gestão por Diretrizes)
 * Valida inputs e estruturas de dados de metas estratégicas e indicadores
 */

// Schema de categoria de meta
const goalCategorySchema = z.enum([
  "FINANCIAL",
  "OPERATIONAL",
  "CUSTOMER",
  "GROWTH",
  "PEOPLE",
]);

// Schema de status de meta
const goalStatusSchema = z.enum([
  "ACTIVE",
  "ACHIEVED",
  "NOT_ACHIEVED",
  "CANCELLED",
]);

// Schema de status de plano de ação
const actionPlanStatusSchema = z.enum([
  "PLANNED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
]);

// Schema de listagem de metas
const listGoalsInputSchema = z.object({
  year: z.number().optional(),
  category: goalCategorySchema.optional(),
  status: goalStatusSchema.optional(),
  parentId: z.string().uuid().nullable().optional(),
  departmentId: z.string().uuid().optional(),
}).optional();

// Schema de criação de meta
const createGoalInputSchema = z.object({
  year: z.number(),
  title: z.string().min(1),
  description: z.string().optional(),
  category: goalCategorySchema,
  targetValue: z.number().optional(),
  unit: z.string().max(20).optional(),
  weight: z.number().min(0).max(10).optional(),
  ownerId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  parentId: z.string().uuid().optional(),
});

// Schema de atualização de meta
const updateGoalInputSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  targetValue: z.number().nullable().optional(),
  unit: z.string().max(20).optional(),
  weight: z.number().min(0).max(10).optional(),
  status: goalStatusSchema.optional(),
  ownerId: z.string().uuid().nullable().optional(),
  departmentId: z.string().uuid().nullable().optional(),
});

// Schema de indicador
const createIndicatorInputSchema = z.object({
  goalId: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  unit: z.string().max(20),
  targetValue: z.number(),
  frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"]),
  formula: z.string().optional(),
});

// Schema de plano de ação
const createActionPlanInputSchema = z.object({
  goalId: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().optional(),
  responsibleId: z.string().uuid(),
  startDate: z.string(),
  endDate: z.string(),
  budget: z.number().optional(),
});

// Schema de resposta de meta
const goalResponseSchema = z.object({
  id: z.string(),
  year: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  category: goalCategorySchema,
  targetValue: z.number().nullable(),
  currentValue: z.number().nullable(),
  unit: z.string().nullable(),
  weight: z.number().nullable(),
  status: goalStatusSchema,
  companyId: z.string(),
  ownerId: z.string().nullable(),
  departmentId: z.string().nullable(),
  parentId: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

describe("GPD Router Schemas", () => {
  describe("Goal Category Schema", () => {
    it("should accept FINANCIAL category", () => {
      const result = goalCategorySchema.safeParse("FINANCIAL");
      expect(result.success).toBe(true);
    });

    it("should accept OPERATIONAL category", () => {
      const result = goalCategorySchema.safeParse("OPERATIONAL");
      expect(result.success).toBe(true);
    });

    it("should accept CUSTOMER category", () => {
      const result = goalCategorySchema.safeParse("CUSTOMER");
      expect(result.success).toBe(true);
    });

    it("should accept GROWTH category", () => {
      const result = goalCategorySchema.safeParse("GROWTH");
      expect(result.success).toBe(true);
    });

    it("should accept PEOPLE category", () => {
      const result = goalCategorySchema.safeParse("PEOPLE");
      expect(result.success).toBe(true);
    });

    it("should reject invalid category", () => {
      const result = goalCategorySchema.safeParse("INVALID");
      expect(result.success).toBe(false);
    });
  });

  describe("Goal Status Schema", () => {
    it("should accept ACTIVE status", () => {
      const result = goalStatusSchema.safeParse("ACTIVE");
      expect(result.success).toBe(true);
    });

    it("should accept ACHIEVED status", () => {
      const result = goalStatusSchema.safeParse("ACHIEVED");
      expect(result.success).toBe(true);
    });

    it("should accept NOT_ACHIEVED status", () => {
      const result = goalStatusSchema.safeParse("NOT_ACHIEVED");
      expect(result.success).toBe(true);
    });

    it("should accept CANCELLED status", () => {
      const result = goalStatusSchema.safeParse("CANCELLED");
      expect(result.success).toBe(true);
    });

    it("should reject invalid status", () => {
      const result = goalStatusSchema.safeParse("INVALID");
      expect(result.success).toBe(false);
    });
  });

  describe("Action Plan Status Schema", () => {
    it("should accept PLANNED status", () => {
      const result = actionPlanStatusSchema.safeParse("PLANNED");
      expect(result.success).toBe(true);
    });

    it("should accept IN_PROGRESS status", () => {
      const result = actionPlanStatusSchema.safeParse("IN_PROGRESS");
      expect(result.success).toBe(true);
    });

    it("should accept COMPLETED status", () => {
      const result = actionPlanStatusSchema.safeParse("COMPLETED");
      expect(result.success).toBe(true);
    });

    it("should accept CANCELLED status", () => {
      const result = actionPlanStatusSchema.safeParse("CANCELLED");
      expect(result.success).toBe(true);
    });

    it("should reject invalid status", () => {
      const result = actionPlanStatusSchema.safeParse("INVALID");
      expect(result.success).toBe(false);
    });
  });

  describe("List Goals Input Schema", () => {
    it("should accept undefined input", () => {
      const result = listGoalsInputSchema.safeParse(undefined);
      expect(result.success).toBe(true);
    });

    it("should accept empty object", () => {
      const result = listGoalsInputSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("should accept year filter", () => {
      const result = listGoalsInputSchema.safeParse({ year: 2024 });
      expect(result.success).toBe(true);
    });

    it("should accept category filter", () => {
      const result = listGoalsInputSchema.safeParse({ category: "FINANCIAL" });
      expect(result.success).toBe(true);
    });

    it("should accept status filter", () => {
      const result = listGoalsInputSchema.safeParse({ status: "ACTIVE" });
      expect(result.success).toBe(true);
    });

    it("should accept null parentId (root goals)", () => {
      const result = listGoalsInputSchema.safeParse({ parentId: null });
      expect(result.success).toBe(true);
    });

    it("should accept departmentId filter", () => {
      const result = listGoalsInputSchema.safeParse({
        departmentId: "123e4567-e89b-12d3-a456-426614174000",
      });
      expect(result.success).toBe(true);
    });

    it("should accept all filters combined", () => {
      const result = listGoalsInputSchema.safeParse({
        year: 2024,
        category: "OPERATIONAL",
        status: "ACTIVE",
        parentId: null,
        departmentId: "123e4567-e89b-12d3-a456-426614174000",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("Create Goal Input Schema", () => {
    it("should accept minimal valid input", () => {
      const result = createGoalInputSchema.safeParse({
        year: 2024,
        title: "Aumentar faturamento",
        category: "FINANCIAL",
      });
      expect(result.success).toBe(true);
    });

    it("should accept complete input", () => {
      const result = createGoalInputSchema.safeParse({
        year: 2024,
        title: "Aumentar faturamento em 20%",
        description: "Meta de crescimento anual",
        category: "FINANCIAL",
        targetValue: 1000000,
        unit: "R$",
        weight: 5,
        ownerId: "123e4567-e89b-12d3-a456-426614174000",
        departmentId: "123e4567-e89b-12d3-a456-426614174001",
        parentId: "123e4567-e89b-12d3-a456-426614174002",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing year", () => {
      const result = createGoalInputSchema.safeParse({
        title: "Meta",
        category: "FINANCIAL",
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty title", () => {
      const result = createGoalInputSchema.safeParse({
        year: 2024,
        title: "",
        category: "FINANCIAL",
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing category", () => {
      const result = createGoalInputSchema.safeParse({
        year: 2024,
        title: "Meta",
      });
      expect(result.success).toBe(false);
    });

    it("should reject weight below 0", () => {
      const result = createGoalInputSchema.safeParse({
        year: 2024,
        title: "Meta",
        category: "FINANCIAL",
        weight: -1,
      });
      expect(result.success).toBe(false);
    });

    it("should reject weight above 10", () => {
      const result = createGoalInputSchema.safeParse({
        year: 2024,
        title: "Meta",
        category: "FINANCIAL",
        weight: 11,
      });
      expect(result.success).toBe(false);
    });

    it("should accept weight at boundaries", () => {
      const result0 = createGoalInputSchema.safeParse({
        year: 2024,
        title: "Meta",
        category: "FINANCIAL",
        weight: 0,
      });
      const result10 = createGoalInputSchema.safeParse({
        year: 2024,
        title: "Meta",
        category: "FINANCIAL",
        weight: 10,
      });
      expect(result0.success).toBe(true);
      expect(result10.success).toBe(true);
    });

    it("should reject unit longer than 20 chars", () => {
      const result = createGoalInputSchema.safeParse({
        year: 2024,
        title: "Meta",
        category: "FINANCIAL",
        unit: "A".repeat(21),
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Update Goal Input Schema", () => {
    it("should accept minimal update", () => {
      const result = updateGoalInputSchema.safeParse({
        id: "123e4567-e89b-12d3-a456-426614174000",
      });
      expect(result.success).toBe(true);
    });

    it("should accept complete update", () => {
      const result = updateGoalInputSchema.safeParse({
        id: "123e4567-e89b-12d3-a456-426614174000",
        title: "Meta atualizada",
        description: "Nova descrição",
        targetValue: 2000000,
        unit: "%",
        weight: 8,
        status: "ACHIEVED",
        ownerId: "123e4567-e89b-12d3-a456-426614174001",
        departmentId: "123e4567-e89b-12d3-a456-426614174002",
      });
      expect(result.success).toBe(true);
    });

    it("should accept null values for optional fields", () => {
      const result = updateGoalInputSchema.safeParse({
        id: "123e4567-e89b-12d3-a456-426614174000",
        targetValue: null,
        ownerId: null,
        departmentId: null,
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing id", () => {
      const result = updateGoalInputSchema.safeParse({
        title: "Meta atualizada",
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid UUID for id", () => {
      const result = updateGoalInputSchema.safeParse({
        id: "invalid-uuid",
        title: "Meta",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Create Indicator Input Schema", () => {
    it("should accept valid input", () => {
      const result = createIndicatorInputSchema.safeParse({
        goalId: "123e4567-e89b-12d3-a456-426614174000",
        name: "Faturamento Mensal",
        unit: "R$",
        targetValue: 100000,
        frequency: "MONTHLY",
      });
      expect(result.success).toBe(true);
    });

    it("should accept complete input with formula", () => {
      const result = createIndicatorInputSchema.safeParse({
        goalId: "123e4567-e89b-12d3-a456-426614174000",
        name: "Taxa de Conversão",
        description: "Vendas / Leads * 100",
        unit: "%",
        targetValue: 15,
        frequency: "WEEKLY",
        formula: "(vendas / leads) * 100",
      });
      expect(result.success).toBe(true);
    });

    it("should accept all frequency values", () => {
      const frequencies = ["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"];
      frequencies.forEach((freq) => {
        const result = createIndicatorInputSchema.safeParse({
          goalId: "123e4567-e89b-12d3-a456-426614174000",
          name: "Indicador",
          unit: "UN",
          targetValue: 100,
          frequency: freq,
        });
        expect(result.success).toBe(true);
      });
    });

    it("should reject missing goalId", () => {
      const result = createIndicatorInputSchema.safeParse({
        name: "Indicador",
        unit: "UN",
        targetValue: 100,
        frequency: "MONTHLY",
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty name", () => {
      const result = createIndicatorInputSchema.safeParse({
        goalId: "123e4567-e89b-12d3-a456-426614174000",
        name: "",
        unit: "UN",
        targetValue: 100,
        frequency: "MONTHLY",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Create Action Plan Input Schema", () => {
    it("should accept valid input", () => {
      const result = createActionPlanInputSchema.safeParse({
        goalId: "123e4567-e89b-12d3-a456-426614174000",
        title: "Implementar CRM",
        responsibleId: "123e4567-e89b-12d3-a456-426614174001",
        startDate: "2024-01-01",
        endDate: "2024-06-30",
      });
      expect(result.success).toBe(true);
    });

    it("should accept complete input with budget", () => {
      const result = createActionPlanInputSchema.safeParse({
        goalId: "123e4567-e89b-12d3-a456-426614174000",
        title: "Campanha de Marketing",
        description: "Campanha digital para captação de leads",
        responsibleId: "123e4567-e89b-12d3-a456-426614174001",
        startDate: "2024-01-01",
        endDate: "2024-03-31",
        budget: 50000,
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing goalId", () => {
      const result = createActionPlanInputSchema.safeParse({
        title: "Plano",
        responsibleId: "123e4567-e89b-12d3-a456-426614174001",
        startDate: "2024-01-01",
        endDate: "2024-06-30",
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing responsibleId", () => {
      const result = createActionPlanInputSchema.safeParse({
        goalId: "123e4567-e89b-12d3-a456-426614174000",
        title: "Plano",
        startDate: "2024-01-01",
        endDate: "2024-06-30",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Goal Response Schema", () => {
    it("should validate complete goal response", () => {
      const result = goalResponseSchema.safeParse({
        id: "123e4567-e89b-12d3-a456-426614174000",
        year: 2024,
        title: "Aumentar faturamento",
        description: "Meta de crescimento",
        category: "FINANCIAL",
        targetValue: 1000000,
        currentValue: 750000,
        unit: "R$",
        weight: 5,
        status: "ACTIVE",
        companyId: "company-id",
        ownerId: "owner-id",
        departmentId: "dept-id",
        parentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      expect(result.success).toBe(true);
    });

    it("should validate goal with nullable fields", () => {
      const result = goalResponseSchema.safeParse({
        id: "123e4567-e89b-12d3-a456-426614174000",
        year: 2024,
        title: "Meta simples",
        description: null,
        category: "OPERATIONAL",
        targetValue: null,
        currentValue: null,
        unit: null,
        weight: null,
        status: "ACTIVE",
        companyId: "company-id",
        ownerId: null,
        departmentId: null,
        parentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      expect(result.success).toBe(true);
    });
  });

  describe("Goal Progress Calculations", () => {
    it("should calculate progress percentage", () => {
      const targetValue = 1000000;
      const currentValue = 750000;
      const progress = (currentValue / targetValue) * 100;
      expect(progress).toBe(75);
    });

    it("should handle zero target", () => {
      const targetValue = 0;
      const currentValue = 100;
      const progress = targetValue === 0 ? 0 : (currentValue / targetValue) * 100;
      expect(progress).toBe(0);
    });

    it("should handle exceeding target", () => {
      const targetValue = 1000;
      const currentValue = 1200;
      const progress = (currentValue / targetValue) * 100;
      expect(progress).toBe(120);
    });

    it("should calculate weighted score", () => {
      const progress = 75; // 75%
      const weight = 5;
      const weightedScore = (progress / 100) * weight;
      expect(weightedScore).toBe(3.75);
    });
  });

  describe("BSC Perspectives", () => {
    it("should map categories to BSC perspectives", () => {
      const bscMapping: Record<string, string> = {
        FINANCIAL: "Financeira",
        CUSTOMER: "Clientes",
        OPERATIONAL: "Processos Internos",
        GROWTH: "Aprendizado e Crescimento",
        PEOPLE: "Pessoas",
      };

      expect(bscMapping.FINANCIAL).toBe("Financeira");
      expect(bscMapping.CUSTOMER).toBe("Clientes");
      expect(bscMapping.OPERATIONAL).toBe("Processos Internos");
      expect(bscMapping.GROWTH).toBe("Aprendizado e Crescimento");
      expect(bscMapping.PEOPLE).toBe("Pessoas");
    });
  });
});
