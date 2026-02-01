/**
 * Testes unitários para taskConfig
 * VIO-896: AI Router Fase 2 - Roteamento por Tipo de Tarefa
 */

import { describe, it, expect } from "vitest";
import {
  AI_TASK_TYPES,
  DEFAULT_TASK_CONFIG,
  AI_PROVIDERS,
  getTaskConfigKey,
  type AITaskType,
} from "./taskConfig";

describe("AI Task Config", () => {
  describe("AI_TASK_TYPES", () => {
    it("should have all required task types", () => {
      const expectedTasks = [
        "MATERIAL_CLASSIFICATION",
        "PRODUCT_DESCRIPTION",
        "DOCUMENT_ANALYSIS",
        "DATA_EXTRACTION",
        "CHART_GENERATION",
        "COST_CENTER_SUGGESTION",
        "FISCAL_RULE_INFERENCE",
        "CHAT_ASSISTANT",
      ];

      expectedTasks.forEach((task) => {
        expect(AI_TASK_TYPES).toHaveProperty(task);
      });
    });

    it("should have label and description for each task", () => {
      Object.entries(AI_TASK_TYPES).forEach(([key, value]) => {
        expect(value).toHaveProperty("id");
        expect(value).toHaveProperty("label");
        expect(value).toHaveProperty("description");
        expect(value.id).toBe(key);
        expect(value.label.length).toBeGreaterThan(0);
        expect(value.description.length).toBeGreaterThan(0);
      });
    });
  });

  describe("DEFAULT_TASK_CONFIG", () => {
    it("should have config for all task types", () => {
      Object.keys(AI_TASK_TYPES).forEach((task) => {
        expect(DEFAULT_TASK_CONFIG).toHaveProperty(task);
      });
    });

    it("should have valid provider for each task", () => {
      Object.values(DEFAULT_TASK_CONFIG).forEach((config) => {
        expect(AI_PROVIDERS).toContain(config.preferredProvider);
      });
    });

    it("should have valid temperature range for each task", () => {
      Object.values(DEFAULT_TASK_CONFIG).forEach((config) => {
        expect(config.temperature).toBeGreaterThanOrEqual(0);
        expect(config.temperature).toBeLessThanOrEqual(2);
      });
    });

    it("should have reason for each task", () => {
      Object.values(DEFAULT_TASK_CONFIG).forEach((config) => {
        expect(config.reason.length).toBeGreaterThan(0);
      });
    });

    it("should have preferredModel for each task", () => {
      Object.values(DEFAULT_TASK_CONFIG).forEach((config) => {
        expect(config.preferredModel.length).toBeGreaterThan(0);
      });
    });
  });

  describe("AI_PROVIDERS", () => {
    it("should include all major providers", () => {
      expect(AI_PROVIDERS).toContain("openai");
      expect(AI_PROVIDERS).toContain("anthropic");
      expect(AI_PROVIDERS).toContain("google");
    });

    it("should have exactly 3 providers", () => {
      expect(AI_PROVIDERS.length).toBe(3);
    });
  });

  describe("getTaskConfigKey", () => {
    it("should generate correct key for task", () => {
      expect(getTaskConfigKey("MATERIAL_CLASSIFICATION")).toBe(
        "ai_task_material_classification"
      );
      expect(getTaskConfigKey("PRODUCT_DESCRIPTION")).toBe(
        "ai_task_product_description"
      );
      expect(getTaskConfigKey("CHAT_ASSISTANT")).toBe("ai_task_chat_assistant");
    });

    it("should always return lowercase key", () => {
      Object.keys(AI_TASK_TYPES).forEach((task) => {
        const key = getTaskConfigKey(task as AITaskType);
        expect(key).toBe(key.toLowerCase());
      });
    });

    it("should always start with ai_task_ prefix", () => {
      Object.keys(AI_TASK_TYPES).forEach((task) => {
        const key = getTaskConfigKey(task as AITaskType);
        expect(key.startsWith("ai_task_")).toBe(true);
      });
    });
  });

  describe("Task-specific configurations", () => {
    it("MATERIAL_CLASSIFICATION should use anthropic for structured reasoning", () => {
      const config = DEFAULT_TASK_CONFIG.MATERIAL_CLASSIFICATION;
      expect(config.preferredProvider).toBe("anthropic");
      expect(config.temperature).toBeLessThanOrEqual(0.3);
    });

    it("PRODUCT_DESCRIPTION should use higher temperature for creativity", () => {
      const config = DEFAULT_TASK_CONFIG.PRODUCT_DESCRIPTION;
      expect(config.temperature).toBeGreaterThanOrEqual(0.5);
    });

    it("DATA_EXTRACTION should use low temperature for precision", () => {
      const config = DEFAULT_TASK_CONFIG.DATA_EXTRACTION;
      expect(config.temperature).toBeLessThanOrEqual(0.2);
    });

    it("DOCUMENT_ANALYSIS should use google for long context", () => {
      const config = DEFAULT_TASK_CONFIG.DOCUMENT_ANALYSIS;
      expect(config.preferredProvider).toBe("google");
    });

    it("FISCAL_RULE_INFERENCE should use very low temperature for accuracy", () => {
      const config = DEFAULT_TASK_CONFIG.FISCAL_RULE_INFERENCE;
      expect(config.temperature).toBeLessThanOrEqual(0.2);
    });
  });
});
