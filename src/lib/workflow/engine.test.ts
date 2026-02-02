/**
 * VIO-817: Enterprise Workflow Engine - Unit Tests
 */

import { describe, it, expect } from "vitest";
import {
  evaluateExpression,
  evaluateConditionRules,
  determineNextSteps,
  mergeContext,
  generateZodSchema,
  validateStepData,
  type WorkflowContext,
  type ConditionRule,
  type WorkflowNode,
  type WorkflowEdge,
  type FormField,
} from "./engine";

describe("Workflow Engine", () => {
  describe("evaluateExpression", () => {
    it("should evaluate numeric comparison", () => {
      const context: WorkflowContext = { value: 5000 };
      expect(evaluateExpression("payload.value > 1000", context)).toBe(true);
      expect(evaluateExpression("payload.value > 10000", context)).toBe(false);
      expect(evaluateExpression("payload.value >= 5000", context)).toBe(true);
      expect(evaluateExpression("payload.value < 10000", context)).toBe(true);
    });

    it("should evaluate truthy check", () => {
      const context: WorkflowContext = { approved: true, rejected: false };
      expect(evaluateExpression("payload.approved", context)).toBe(true);
      expect(evaluateExpression("payload.rejected", context)).toBe(false);
    });

    it("should handle invalid expressions gracefully", () => {
      const context: WorkflowContext = {};
      expect(evaluateExpression("invalid.syntax.here", context)).toBe(false);
    });

    it("should support context alias", () => {
      const context: WorkflowContext = { amount: 100 };
      expect(evaluateExpression("context.amount > 50", context)).toBe(true);
    });
  });

  describe("evaluateConditionRules", () => {
    it("should evaluate single rule with eq operator", () => {
      const rules: ConditionRule[] = [
        { field: "status", operator: "eq", value: "active" },
      ];
      expect(evaluateConditionRules(rules, { status: "active" })).toBe(true);
      expect(evaluateConditionRules(rules, { status: "inactive" })).toBe(false);
    });

    it("should evaluate multiple rules with AND logic", () => {
      const rules: ConditionRule[] = [
        { field: "status", operator: "eq", value: "active", logic: "AND" },
        { field: "amount", operator: "gt", value: 100 },
      ];
      expect(evaluateConditionRules(rules, { status: "active", amount: 200 })).toBe(true);
      expect(evaluateConditionRules(rules, { status: "active", amount: 50 })).toBe(false);
      expect(evaluateConditionRules(rules, { status: "inactive", amount: 200 })).toBe(false);
    });

    it("should evaluate rules with OR logic", () => {
      const rules: ConditionRule[] = [
        { field: "priority", operator: "eq", value: "high", logic: "OR" },
        { field: "urgent", operator: "eq", value: true },
      ];
      expect(evaluateConditionRules(rules, { priority: "high", urgent: false })).toBe(true);
      expect(evaluateConditionRules(rules, { priority: "low", urgent: true })).toBe(true);
      expect(evaluateConditionRules(rules, { priority: "low", urgent: false })).toBe(false);
    });

    it("should evaluate contains operator", () => {
      const rules: ConditionRule[] = [
        { field: "description", operator: "contains", value: "urgent" },
      ];
      expect(evaluateConditionRules(rules, { description: "This is urgent!" })).toBe(true);
      expect(evaluateConditionRules(rules, { description: "Normal task" })).toBe(false);
    });

    it("should evaluate in operator", () => {
      const rules: ConditionRule[] = [
        { field: "category", operator: "in", value: ["A", "B", "C"] },
      ];
      expect(evaluateConditionRules(rules, { category: "A" })).toBe(true);
      expect(evaluateConditionRules(rules, { category: "D" })).toBe(false);
    });

    it("should return true for empty rules", () => {
      expect(evaluateConditionRules([], {})).toBe(true);
    });
  });

  describe("determineNextSteps", () => {
    const createNode = (id: string, type: string): WorkflowNode => ({
      id,
      type,
      code: `node_${id}`,
      name: `Node ${id}`,
      positionX: 0,
      positionY: 0,
      config: {},
    });

    const createEdge = (
      id: string,
      fromStepId: string,
      toStepId: string,
      options: Partial<WorkflowEdge> = {}
    ): WorkflowEdge => ({
      id,
      fromStepId,
      toStepId,
      conditionType: "ALWAYS",
      isDefault: false,
      priority: 0,
      ...options,
    });

    it("should return next step for regular node", () => {
      const node = createNode("1", "TASK");
      const edges = [createEdge("e1", "1", "2")];
      const result = determineNextSteps(node, edges, {});
      expect(result).toEqual(["2"]);
    });

    it("should handle exclusive gateway (XOR) - takes first matching", () => {
      const node = createNode("1", "GATEWAY_EXCLUSIVE");
      const edges = [
        createEdge("e1", "1", "2", { 
          conditionType: "EXPRESSION", 
          conditionJson: { type: "EXPRESSION", rules: [{ field: "approved", operator: "eq", value: true }] },
        }),
        createEdge("e2", "1", "3", { isDefault: true }),
      ];
      
      // Should take approved path when condition matches
      expect(determineNextSteps(node, edges, { approved: true })).toEqual(["2"]);
    });

    it("should handle exclusive gateway (XOR) - uses default when only default exists", () => {
      const node = createNode("1", "GATEWAY_EXCLUSIVE");
      const edges = [
        createEdge("e1", "1", "3", { isDefault: true }),
      ];
      
      // Should take default path
      expect(determineNextSteps(node, edges, {})).toEqual(["3"]);
    });

    it("should handle parallel gateway (AND)", () => {
      const node = createNode("1", "GATEWAY_PARALLEL");
      const edges = [
        createEdge("e1", "1", "2"),
        createEdge("e2", "1", "3"),
        createEdge("e3", "1", "4"),
      ];
      const result = determineNextSteps(node, edges, {});
      expect(result).toEqual(["2", "3", "4"]);
    });

    it("should handle inclusive gateway with ALWAYS conditions", () => {
      const node = createNode("1", "GATEWAY_INCLUSIVE");
      const edges = [
        createEdge("e1", "1", "2", { conditionType: "ALWAYS" }),
        createEdge("e2", "1", "3", { conditionType: "ALWAYS" }),
      ];
      
      // All ALWAYS conditions should be included
      const result = determineNextSteps(node, edges, {});
      expect(result).toContain("2");
      expect(result).toContain("3");
    });

    it("should use default when no conditions match in inclusive gateway", () => {
      const node = createNode("1", "GATEWAY_INCLUSIVE");
      const edges = [
        createEdge("e1", "1", "2", { isDefault: true }),
      ];
      
      const result = determineNextSteps(node, edges, {});
      expect(result).toEqual(["2"]);
    });

    it("should return empty array when no outgoing transitions", () => {
      const node = createNode("1", "END");
      const result = determineNextSteps(node, [], {});
      expect(result).toEqual([]);
    });
  });

  describe("mergeContext", () => {
    it("should merge step data into context", () => {
      const current: WorkflowContext = { step1: "value1" };
      const stepData = { step2: "value2" };
      const result = mergeContext(current, stepData);
      
      expect(result.step1).toBe("value1");
      expect(result.step2).toBe("value2");
      expect(result._lastUpdated).toBeDefined();
    });

    it("should override existing values", () => {
      const current: WorkflowContext = { value: "old" };
      const stepData = { value: "new" };
      const result = mergeContext(current, stepData);
      
      expect(result.value).toBe("new");
    });
  });

  describe("generateZodSchema", () => {
    it("should generate schema for text field", () => {
      const fields: FormField[] = [
        { name: "name", type: "text", label: "Name", required: true },
      ];
      const schema = generateZodSchema(fields);
      
      expect(schema.safeParse({ name: "John" }).success).toBe(true);
      expect(schema.safeParse({ name: "" }).success).toBe(false);
    });

    it("should generate schema for number field with validation", () => {
      const fields: FormField[] = [
        { name: "amount", type: "number", label: "Amount", required: true, validation: { min: 0, max: 1000 } },
      ];
      const schema = generateZodSchema(fields);
      
      expect(schema.safeParse({ amount: 500 }).success).toBe(true);
      expect(schema.safeParse({ amount: -1 }).success).toBe(false);
      expect(schema.safeParse({ amount: 1001 }).success).toBe(false);
    });

    it("should generate schema for optional field", () => {
      const fields: FormField[] = [
        { name: "notes", type: "textarea", label: "Notes", required: false },
      ];
      const schema = generateZodSchema(fields);
      
      expect(schema.safeParse({}).success).toBe(true);
      expect(schema.safeParse({ notes: "Some notes" }).success).toBe(true);
    });

    it("should generate schema for checkbox field", () => {
      const fields: FormField[] = [
        { name: "agree", type: "checkbox", label: "Agree", required: true },
      ];
      const schema = generateZodSchema(fields);
      
      expect(schema.safeParse({ agree: true }).success).toBe(true);
      expect(schema.safeParse({ agree: false }).success).toBe(true);
    });
  });

  describe("validateStepData", () => {
    it("should return valid for correct data", () => {
      const fields: FormField[] = [
        { name: "name", type: "text", label: "Name", required: true },
        { name: "amount", type: "number", label: "Amount", required: true },
      ];
      const data = { name: "Test", amount: 100 };
      const result = validateStepData(data, fields);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should return errors for invalid data", () => {
      const fields: FormField[] = [
        { name: "name", type: "text", label: "Name", required: true },
      ];
      const data = { name: "" };
      const result = validateStepData(data, fields);
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should validate string length constraints", () => {
      const fields: FormField[] = [
        { name: "code", type: "text", label: "Code", required: true, validation: { minLength: 3, maxLength: 10 } },
      ];
      
      expect(validateStepData({ code: "AB" }, fields).valid).toBe(false);
      expect(validateStepData({ code: "ABC" }, fields).valid).toBe(true);
      expect(validateStepData({ code: "ABCDEFGHIJK" }, fields).valid).toBe(false);
    });
  });
});
