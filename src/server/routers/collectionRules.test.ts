import { describe, it, expect } from "vitest";
import { z } from "zod";

// Schemas extraídos do router para testes
const listInputSchema = z.object({
  isActive: z.boolean().optional(),
  search: z.string().optional(),
  page: z.number().default(1),
  limit: z.number().default(20),
}).optional();

const byIdInputSchema = z.object({ id: z.string() });

const stepSchema = z.object({
  stepOrder: z.number(),
  name: z.string().min(1),
  daysOffset: z.number(),
  actionType: z.enum([
    "EMAIL",
    "SMS",
    "WHATSAPP",
    "PHONE",
    "LETTER",
    "NEGATIVATION",
    "PROTEST",
    "LEGAL",
    "INTERNAL",
  ]),
  templateId: z.string().optional(),
  notes: z.string().optional(),
});

const createInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
  steps: z.array(stepSchema).min(1),
});

const updateInputSchema = z.object({
  id: z.string(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
});

const addStepInputSchema = z.object({
  ruleId: z.string(),
  stepOrder: z.number(),
  name: z.string().min(1),
  daysOffset: z.number(),
  actionType: z.enum([
    "EMAIL",
    "SMS",
    "WHATSAPP",
    "PHONE",
    "LETTER",
    "NEGATIVATION",
    "PROTEST",
    "LEGAL",
    "INTERNAL",
  ]),
  templateId: z.string().optional(),
  notes: z.string().optional(),
});

const updateStepInputSchema = z.object({
  id: z.string(),
  stepOrder: z.number().optional(),
  name: z.string().min(1).optional(),
  daysOffset: z.number().optional(),
  actionType: z.enum([
    "EMAIL",
    "SMS",
    "WHATSAPP",
    "PHONE",
    "LETTER",
    "NEGATIVATION",
    "PROTEST",
    "LEGAL",
    "INTERNAL",
  ]).optional(),
  templateId: z.string().optional(),
  notes: z.string().optional(),
});

const removeStepInputSchema = z.object({ id: z.string() });

const deleteInputSchema = z.object({ id: z.string() });

const executeRuleInputSchema = z.object({
  ruleId: z.string(),
  receivableId: z.string(),
  stepOrder: z.number().optional(),
});

const listActionsInputSchema = z.object({
  receivableId: z.string().optional(),
  ruleId: z.string().optional(),
  status: z.enum(["PENDING", "EXECUTED", "FAILED", "SKIPPED", "ALL"]).optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  page: z.number().default(1),
  limit: z.number().default(20),
}).optional();

describe("CollectionRules Router Schemas", () => {
  describe("list input", () => {
    it("should accept empty input", () => {
      const result = listInputSchema.safeParse(undefined);
      expect(result.success).toBe(true);
    });

    it("should apply defaults", () => {
      const result = listInputSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.page).toBe(1);
        expect(result.data?.limit).toBe(20);
      }
    });

    it("should accept isActive filter", () => {
      const result = listInputSchema.safeParse({ isActive: true });
      expect(result.success).toBe(true);
    });

    it("should accept search string", () => {
      const result = listInputSchema.safeParse({ search: "cobrança" });
      expect(result.success).toBe(true);
    });

    it("should accept custom pagination", () => {
      const result = listInputSchema.safeParse({ page: 3, limit: 50 });
      expect(result.success).toBe(true);
    });
  });

  describe("byId input", () => {
    it("should accept valid id", () => {
      const result = byIdInputSchema.safeParse({ id: "rule-123" });
      expect(result.success).toBe(true);
    });

    it("should reject missing id", () => {
      const result = byIdInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("create input", () => {
    it("should accept valid input", () => {
      const result = createInputSchema.safeParse({
        name: "Régua Padrão",
        steps: [
          { stepOrder: 1, name: "Lembrete", daysOffset: -3, actionType: "EMAIL" },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("should apply defaults", () => {
      const result = createInputSchema.safeParse({
        name: "Régua Padrão",
        steps: [
          { stepOrder: 1, name: "Lembrete", daysOffset: -3, actionType: "EMAIL" },
        ],
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isActive).toBe(true);
        expect(result.data.isDefault).toBe(false);
      }
    });

    it("should accept all actionType values", () => {
      const actionTypes = ["EMAIL", "SMS", "WHATSAPP", "PHONE", "LETTER", "NEGATIVATION", "PROTEST", "LEGAL", "INTERNAL"];
      for (const actionType of actionTypes) {
        const result = createInputSchema.safeParse({
          name: `Régua ${actionType}`,
          steps: [{ stepOrder: 1, name: "Passo 1", daysOffset: 0, actionType }],
        });
        expect(result.success).toBe(true);
      }
    });

    it("should accept full input with multiple steps", () => {
      const result = createInputSchema.safeParse({
        name: "Régua Completa",
        description: "Régua de cobrança completa",
        isActive: true,
        isDefault: true,
        steps: [
          { stepOrder: 1, name: "Lembrete", daysOffset: -3, actionType: "EMAIL", templateId: "tpl-001" },
          { stepOrder: 2, name: "Vencimento", daysOffset: 0, actionType: "SMS", notes: "Enviar no dia" },
          { stepOrder: 3, name: "Atraso 5 dias", daysOffset: 5, actionType: "WHATSAPP" },
          { stepOrder: 4, name: "Atraso 15 dias", daysOffset: 15, actionType: "PHONE" },
          { stepOrder: 5, name: "Negativação", daysOffset: 30, actionType: "NEGATIVATION" },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("should reject empty name", () => {
      const result = createInputSchema.safeParse({
        name: "",
        steps: [{ stepOrder: 1, name: "Passo", daysOffset: 0, actionType: "EMAIL" }],
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty steps array", () => {
      const result = createInputSchema.safeParse({
        name: "Régua",
        steps: [],
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid actionType", () => {
      const result = createInputSchema.safeParse({
        name: "Régua",
        steps: [{ stepOrder: 1, name: "Passo", daysOffset: 0, actionType: "INVALID" }],
      });
      expect(result.success).toBe(false);
    });

    it("should accept negative daysOffset (before due date)", () => {
      const result = createInputSchema.safeParse({
        name: "Régua",
        steps: [{ stepOrder: 1, name: "Lembrete", daysOffset: -7, actionType: "EMAIL" }],
      });
      expect(result.success).toBe(true);
    });

    it("should accept positive daysOffset (after due date)", () => {
      const result = createInputSchema.safeParse({
        name: "Régua",
        steps: [{ stepOrder: 1, name: "Cobrança", daysOffset: 10, actionType: "PHONE" }],
      });
      expect(result.success).toBe(true);
    });
  });

  describe("update input", () => {
    it("should accept id only", () => {
      const result = updateInputSchema.safeParse({ id: "rule-123" });
      expect(result.success).toBe(true);
    });

    it("should accept partial update", () => {
      const result = updateInputSchema.safeParse({
        id: "rule-123",
        name: "Novo Nome",
        isActive: false,
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing id", () => {
      const result = updateInputSchema.safeParse({
        name: "Sem ID",
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty name on update", () => {
      const result = updateInputSchema.safeParse({
        id: "rule-123",
        name: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("addStep input", () => {
    it("should accept valid input", () => {
      const result = addStepInputSchema.safeParse({
        ruleId: "rule-123",
        stepOrder: 3,
        name: "Novo Passo",
        daysOffset: 7,
        actionType: "SMS",
      });
      expect(result.success).toBe(true);
    });

    it("should accept with optional fields", () => {
      const result = addStepInputSchema.safeParse({
        ruleId: "rule-123",
        stepOrder: 3,
        name: "Novo Passo",
        daysOffset: 7,
        actionType: "EMAIL",
        templateId: "tpl-001",
        notes: "Enviar pela manhã",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing ruleId", () => {
      const result = addStepInputSchema.safeParse({
        stepOrder: 3,
        name: "Passo",
        daysOffset: 7,
        actionType: "SMS",
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty name", () => {
      const result = addStepInputSchema.safeParse({
        ruleId: "rule-123",
        stepOrder: 3,
        name: "",
        daysOffset: 7,
        actionType: "SMS",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("updateStep input", () => {
    it("should accept id only", () => {
      const result = updateStepInputSchema.safeParse({ id: "step-123" });
      expect(result.success).toBe(true);
    });

    it("should accept partial update", () => {
      const result = updateStepInputSchema.safeParse({
        id: "step-123",
        daysOffset: 10,
        actionType: "WHATSAPP",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing id", () => {
      const result = updateStepInputSchema.safeParse({
        daysOffset: 10,
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty name on update", () => {
      const result = updateStepInputSchema.safeParse({
        id: "step-123",
        name: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("removeStep input", () => {
    it("should accept valid id", () => {
      const result = removeStepInputSchema.safeParse({ id: "step-123" });
      expect(result.success).toBe(true);
    });

    it("should reject missing id", () => {
      const result = removeStepInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("delete input", () => {
    it("should accept valid id", () => {
      const result = deleteInputSchema.safeParse({ id: "rule-123" });
      expect(result.success).toBe(true);
    });

    it("should reject missing id", () => {
      const result = deleteInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("executeRule input", () => {
    it("should accept valid input", () => {
      const result = executeRuleInputSchema.safeParse({
        ruleId: "rule-123",
        receivableId: "recv-456",
      });
      expect(result.success).toBe(true);
    });

    it("should accept with stepOrder", () => {
      const result = executeRuleInputSchema.safeParse({
        ruleId: "rule-123",
        receivableId: "recv-456",
        stepOrder: 2,
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing ruleId", () => {
      const result = executeRuleInputSchema.safeParse({
        receivableId: "recv-456",
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing receivableId", () => {
      const result = executeRuleInputSchema.safeParse({
        ruleId: "rule-123",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("listActions input", () => {
    it("should accept empty input", () => {
      const result = listActionsInputSchema.safeParse(undefined);
      expect(result.success).toBe(true);
    });

    it("should apply defaults", () => {
      const result = listActionsInputSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.page).toBe(1);
        expect(result.data?.limit).toBe(20);
      }
    });

    it("should accept all status values", () => {
      const statuses = ["PENDING", "EXECUTED", "FAILED", "SKIPPED", "ALL"];
      for (const status of statuses) {
        const result = listActionsInputSchema.safeParse({ status });
        expect(result.success).toBe(true);
      }
    });

    it("should reject invalid status", () => {
      const result = listActionsInputSchema.safeParse({ status: "INVALID" });
      expect(result.success).toBe(false);
    });

    it("should accept date range", () => {
      const result = listActionsInputSchema.safeParse({
        dateFrom: new Date("2026-01-01"),
        dateTo: new Date("2026-01-31"),
      });
      expect(result.success).toBe(true);
    });

    it("should accept receivableId filter", () => {
      const result = listActionsInputSchema.safeParse({
        receivableId: "recv-123",
      });
      expect(result.success).toBe(true);
    });

    it("should accept ruleId filter", () => {
      const result = listActionsInputSchema.safeParse({
        ruleId: "rule-123",
      });
      expect(result.success).toBe(true);
    });
  });
});
