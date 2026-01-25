import { describe, it, expect } from "vitest";
import { z } from "zod";

/**
 * Testes de schema para o router workflow (Workflows de Aprovação)
 * Valida inputs e estruturas de dados de definições e instâncias de workflow
 */

// Schema de categoria de workflow
const workflowCategorySchema = z.enum([
  "PURCHASE",
  "PAYMENT",
  "HR",
  "PRODUCTION",
  "SALES",
  "GENERAL",
]);

// Schema de tipo de trigger
const triggerTypeSchema = z.enum(["MANUAL", "AUTOMATIC", "SCHEDULED"]);

// Schema de tipo de etapa
const stepTypeSchema = z.enum([
  "APPROVAL",
  "NOTIFICATION",
  "TASK",
  "CONDITION",
  "PARALLEL",
]);

// Schema de status de instância
const instanceStatusSchema = z.enum([
  "PENDING",
  "IN_PROGRESS",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
  "EXPIRED",
]);

// Schema de listagem de definições
const listDefinitionsInputSchema = z.object({
  category: workflowCategorySchema.optional(),
  isActive: z.boolean().optional(),
}).optional();

// Schema de criação de definição
const createDefinitionInputSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1),
  description: z.string().optional(),
  category: workflowCategorySchema,
  triggerType: triggerTypeSchema,
  triggerConfig: z.record(z.string(), z.unknown()).optional(),
});

// Schema de criação de etapa
const createStepInputSchema = z.object({
  definitionId: z.string().uuid(),
  code: z.string().min(1).max(50),
  name: z.string().min(1),
  description: z.string().optional(),
  stepType: stepTypeSchema,
  sequence: z.number().min(1),
  approverType: z.enum(["USER", "ROLE", "DEPARTMENT", "HIERARCHY"]).optional(),
  approverId: z.string().optional(),
  timeoutHours: z.number().optional(),
  escalationUserId: z.string().optional(),
});

// Schema de criação de transição
const createTransitionInputSchema = z.object({
  definitionId: z.string().uuid(),
  fromStepId: z.string().uuid(),
  toStepId: z.string().uuid(),
  condition: z.string().optional(),
  action: z.enum(["APPROVE", "REJECT", "RETURN", "FORWARD"]),
});

// Schema de início de instância
const startInstanceInputSchema = z.object({
  definitionId: z.string().uuid(),
  entityType: z.string(),
  entityId: z.string(),
  data: z.record(z.string(), z.unknown()).optional(),
});

describe("Workflow Router Schemas", () => {
  describe("Workflow Category Schema", () => {
    it("should accept PURCHASE category", () => {
      const result = workflowCategorySchema.safeParse("PURCHASE");
      expect(result.success).toBe(true);
    });

    it("should accept PAYMENT category", () => {
      const result = workflowCategorySchema.safeParse("PAYMENT");
      expect(result.success).toBe(true);
    });

    it("should accept HR category", () => {
      const result = workflowCategorySchema.safeParse("HR");
      expect(result.success).toBe(true);
    });

    it("should accept PRODUCTION category", () => {
      const result = workflowCategorySchema.safeParse("PRODUCTION");
      expect(result.success).toBe(true);
    });

    it("should accept SALES category", () => {
      const result = workflowCategorySchema.safeParse("SALES");
      expect(result.success).toBe(true);
    });

    it("should accept GENERAL category", () => {
      const result = workflowCategorySchema.safeParse("GENERAL");
      expect(result.success).toBe(true);
    });

    it("should reject invalid category", () => {
      const result = workflowCategorySchema.safeParse("INVALID");
      expect(result.success).toBe(false);
    });
  });

  describe("Trigger Type Schema", () => {
    it("should accept MANUAL trigger", () => {
      const result = triggerTypeSchema.safeParse("MANUAL");
      expect(result.success).toBe(true);
    });

    it("should accept AUTOMATIC trigger", () => {
      const result = triggerTypeSchema.safeParse("AUTOMATIC");
      expect(result.success).toBe(true);
    });

    it("should accept SCHEDULED trigger", () => {
      const result = triggerTypeSchema.safeParse("SCHEDULED");
      expect(result.success).toBe(true);
    });

    it("should reject invalid trigger", () => {
      const result = triggerTypeSchema.safeParse("INVALID");
      expect(result.success).toBe(false);
    });
  });

  describe("Step Type Schema", () => {
    it("should accept all step types", () => {
      const types = ["APPROVAL", "NOTIFICATION", "TASK", "CONDITION", "PARALLEL"];
      types.forEach((type) => {
        const result = stepTypeSchema.safeParse(type);
        expect(result.success).toBe(true);
      });
    });

    it("should reject invalid step type", () => {
      const result = stepTypeSchema.safeParse("INVALID");
      expect(result.success).toBe(false);
    });
  });

  describe("Instance Status Schema", () => {
    it("should accept PENDING status", () => {
      const result = instanceStatusSchema.safeParse("PENDING");
      expect(result.success).toBe(true);
    });

    it("should accept IN_PROGRESS status", () => {
      const result = instanceStatusSchema.safeParse("IN_PROGRESS");
      expect(result.success).toBe(true);
    });

    it("should accept APPROVED status", () => {
      const result = instanceStatusSchema.safeParse("APPROVED");
      expect(result.success).toBe(true);
    });

    it("should accept REJECTED status", () => {
      const result = instanceStatusSchema.safeParse("REJECTED");
      expect(result.success).toBe(true);
    });

    it("should accept CANCELLED status", () => {
      const result = instanceStatusSchema.safeParse("CANCELLED");
      expect(result.success).toBe(true);
    });

    it("should accept EXPIRED status", () => {
      const result = instanceStatusSchema.safeParse("EXPIRED");
      expect(result.success).toBe(true);
    });

    it("should reject invalid status", () => {
      const result = instanceStatusSchema.safeParse("INVALID");
      expect(result.success).toBe(false);
    });
  });

  describe("List Definitions Input Schema", () => {
    it("should accept undefined input", () => {
      const result = listDefinitionsInputSchema.safeParse(undefined);
      expect(result.success).toBe(true);
    });

    it("should accept empty object", () => {
      const result = listDefinitionsInputSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("should accept category filter", () => {
      const result = listDefinitionsInputSchema.safeParse({
        category: "PURCHASE",
      });
      expect(result.success).toBe(true);
    });

    it("should accept isActive filter", () => {
      const result = listDefinitionsInputSchema.safeParse({
        isActive: true,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("Create Definition Input Schema", () => {
    it("should accept valid input", () => {
      const result = createDefinitionInputSchema.safeParse({
        code: "WF-COMPRA",
        name: "Aprovação de Compras",
        category: "PURCHASE",
        triggerType: "AUTOMATIC",
      });
      expect(result.success).toBe(true);
    });

    it("should accept complete input", () => {
      const result = createDefinitionInputSchema.safeParse({
        code: "WF-PGTO",
        name: "Aprovação de Pagamentos",
        description: "Workflow para aprovação de pagamentos acima de R$ 10.000",
        category: "PAYMENT",
        triggerType: "AUTOMATIC",
        triggerConfig: { minValue: 10000 },
      });
      expect(result.success).toBe(true);
    });

    it("should reject empty code", () => {
      const result = createDefinitionInputSchema.safeParse({
        code: "",
        name: "Workflow",
        category: "GENERAL",
        triggerType: "MANUAL",
      });
      expect(result.success).toBe(false);
    });

    it("should reject code longer than 50 chars", () => {
      const result = createDefinitionInputSchema.safeParse({
        code: "A".repeat(51),
        name: "Workflow",
        category: "GENERAL",
        triggerType: "MANUAL",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Create Step Input Schema", () => {
    it("should accept valid input", () => {
      const result = createStepInputSchema.safeParse({
        definitionId: "123e4567-e89b-12d3-a456-426614174000",
        code: "STEP-01",
        name: "Aprovação Gerente",
        stepType: "APPROVAL",
        sequence: 1,
      });
      expect(result.success).toBe(true);
    });

    it("should accept complete input", () => {
      const result = createStepInputSchema.safeParse({
        definitionId: "123e4567-e89b-12d3-a456-426614174000",
        code: "STEP-02",
        name: "Aprovação Diretor",
        description: "Aprovação final do diretor financeiro",
        stepType: "APPROVAL",
        sequence: 2,
        approverType: "ROLE",
        approverId: "role-diretor-financeiro",
        timeoutHours: 48,
        escalationUserId: "123e4567-e89b-12d3-a456-426614174001",
      });
      expect(result.success).toBe(true);
    });

    it("should reject sequence less than 1", () => {
      const result = createStepInputSchema.safeParse({
        definitionId: "123e4567-e89b-12d3-a456-426614174000",
        code: "STEP-01",
        name: "Etapa",
        stepType: "APPROVAL",
        sequence: 0,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Create Transition Input Schema", () => {
    it("should accept valid input", () => {
      const result = createTransitionInputSchema.safeParse({
        definitionId: "123e4567-e89b-12d3-a456-426614174000",
        fromStepId: "123e4567-e89b-12d3-a456-426614174001",
        toStepId: "123e4567-e89b-12d3-a456-426614174002",
        action: "APPROVE",
      });
      expect(result.success).toBe(true);
    });

    it("should accept transition with condition", () => {
      const result = createTransitionInputSchema.safeParse({
        definitionId: "123e4567-e89b-12d3-a456-426614174000",
        fromStepId: "123e4567-e89b-12d3-a456-426614174001",
        toStepId: "123e4567-e89b-12d3-a456-426614174002",
        condition: "value > 10000",
        action: "APPROVE",
      });
      expect(result.success).toBe(true);
    });

    it("should accept all action types", () => {
      const actions = ["APPROVE", "REJECT", "RETURN", "FORWARD"];
      actions.forEach((action) => {
        const result = createTransitionInputSchema.safeParse({
          definitionId: "123e4567-e89b-12d3-a456-426614174000",
          fromStepId: "123e4567-e89b-12d3-a456-426614174001",
          toStepId: "123e4567-e89b-12d3-a456-426614174002",
          action,
        });
        expect(result.success).toBe(true);
      });
    });
  });

  describe("Start Instance Input Schema", () => {
    it("should accept valid input", () => {
      const result = startInstanceInputSchema.safeParse({
        definitionId: "123e4567-e89b-12d3-a456-426614174000",
        entityType: "PurchaseOrder",
        entityId: "po-123",
      });
      expect(result.success).toBe(true);
    });

    it("should accept input with data", () => {
      const result = startInstanceInputSchema.safeParse({
        definitionId: "123e4567-e89b-12d3-a456-426614174000",
        entityType: "PurchaseOrder",
        entityId: "po-123",
        data: { totalValue: 15000, supplierId: "sup-001" },
      });
      expect(result.success).toBe(true);
    });
  });

  describe("Workflow Execution", () => {
    it("should validate step sequence", () => {
      const steps = [
        { sequence: 1, name: "Gerente" },
        { sequence: 2, name: "Diretor" },
        { sequence: 3, name: "Presidente" },
      ];
      const sorted = [...steps].sort((a, b) => a.sequence - b.sequence);
      expect(sorted[0].name).toBe("Gerente");
      expect(sorted[2].name).toBe("Presidente");
    });

    it("should check timeout expiration", () => {
      const startedAt = new Date("2024-01-15T10:00:00");
      const timeoutHours = 48;
      const expiresAt = new Date(startedAt.getTime() + timeoutHours * 60 * 60 * 1000);
      const now = new Date("2024-01-17T12:00:00");
      const isExpired = now > expiresAt;
      expect(isExpired).toBe(true);
    });

    it("should not be expired within timeout", () => {
      const startedAt = new Date("2024-01-15T10:00:00");
      const timeoutHours = 48;
      const expiresAt = new Date(startedAt.getTime() + timeoutHours * 60 * 60 * 1000);
      const now = new Date("2024-01-16T12:00:00");
      const isExpired = now > expiresAt;
      expect(isExpired).toBe(false);
    });
  });

  describe("Approval Rules", () => {
    it("should check value-based approval level", () => {
      const rules = [
        { maxValue: 1000, approver: "Supervisor" },
        { maxValue: 10000, approver: "Gerente" },
        { maxValue: 50000, approver: "Diretor" },
        { maxValue: Infinity, approver: "Presidente" },
      ];
      const value = 25000;
      const approver = rules.find((r) => value <= r.maxValue)?.approver;
      expect(approver).toBe("Diretor");
    });

    it("should require multiple approvers for high values", () => {
      const value = 100000;
      const threshold = 50000;
      const requiresMultipleApprovers = value > threshold;
      expect(requiresMultipleApprovers).toBe(true);
    });
  });

  describe("Workflow Status Transitions", () => {
    const validTransitions: Record<string, string[]> = {
      PENDING: ["IN_PROGRESS", "CANCELLED"],
      IN_PROGRESS: ["APPROVED", "REJECTED", "CANCELLED", "EXPIRED"],
      APPROVED: [],
      REJECTED: [],
      CANCELLED: [],
      EXPIRED: [],
    };

    it("should allow PENDING to IN_PROGRESS", () => {
      expect(validTransitions.PENDING.includes("IN_PROGRESS")).toBe(true);
    });

    it("should allow IN_PROGRESS to APPROVED", () => {
      expect(validTransitions.IN_PROGRESS.includes("APPROVED")).toBe(true);
    });

    it("should allow IN_PROGRESS to REJECTED", () => {
      expect(validTransitions.IN_PROGRESS.includes("REJECTED")).toBe(true);
    });

    it("should not allow APPROVED to any status", () => {
      expect(validTransitions.APPROVED.length).toBe(0);
    });

    it("should not allow REJECTED to any status", () => {
      expect(validTransitions.REJECTED.length).toBe(0);
    });
  });
});
