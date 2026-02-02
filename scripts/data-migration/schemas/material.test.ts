import { describe, it, expect } from "vitest";
import { validateMaterial, validateMaterialBatch } from "./material";

describe("Material Schema", () => {
  describe("validateMaterial", () => {
    it("should validate a complete material", () => {
      const material = {
        code: "MAT-001",
        description: "Material de Teste",
        unit: "UN",
        ncm: "84818099",
        status: "ACTIVE",
      };

      const result = validateMaterial(material);
      expect(result.success).toBe(true);
      expect(result.data?.code).toBe("MAT-001");
    });

    it("should validate a minimal material", () => {
      const material = {
        code: "MAT-002",
        description: "Material Mínimo",
        unit: "KG",
      };

      const result = validateMaterial(material);
      expect(result.success).toBe(true);
    });

    it("should reject material without code", () => {
      const material = {
        description: "Sem Código",
        unit: "UN",
      };

      const result = validateMaterial(material);
      expect(result.success).toBe(false);
      expect(result.errors).toContain("code: Código é obrigatório");
    });

    it("should reject material without description", () => {
      const material = {
        code: "MAT-003",
        unit: "UN",
      };

      const result = validateMaterial(material);
      expect(result.success).toBe(false);
      expect(result.errors).toContain("description: Descrição é obrigatória");
    });

    it("should reject material without unit", () => {
      const material = {
        code: "MAT-004",
        description: "Sem Unidade",
      };

      const result = validateMaterial(material);
      expect(result.success).toBe(false);
      expect(result.errors).toContain("unit: Unidade é obrigatória");
    });

    it("should reject invalid NCM format", () => {
      const material = {
        code: "MAT-005",
        description: "NCM Inválido",
        unit: "UN",
        ncm: "1234",
      };

      const result = validateMaterial(material);
      expect(result.success).toBe(false);
      expect(result.errors?.[0]).toContain("NCM deve ter 8 dígitos");
    });

    it("should validate material with all optional fields", () => {
      const material = {
        code: "MAT-006",
        description: "Material Completo",
        unit: "UN",
        category: "Matéria Prima",
        type: "MATERIA_PRIMA",
        ncm: "84818099",
        cest: "1234567",
        origem: "0",
        minStock: 10,
        maxStock: 100,
        reorderPoint: 20,
        leadTime: 5,
        lastPurchasePrice: 50.00,
        averageCost: 45.00,
        weight: 1.5,
        status: "ACTIVE",
        barcode: "7891234567890",
        notes: "Observações do material",
      };

      const result = validateMaterial(material);
      expect(result.success).toBe(true);
    });
  });

  describe("validateMaterialBatch", () => {
    it("should validate a batch of materials", () => {
      const materials = [
        { code: "MAT-001", description: "Material 1", unit: "UN" },
        { code: "MAT-002", description: "Material 2", unit: "KG" },
        { code: "MAT-003", description: "Material 3", unit: "M" },
      ];

      const result = validateMaterialBatch(materials);
      expect(result.valid.length).toBe(3);
      expect(result.invalid.length).toBe(0);
    });

    it("should separate valid and invalid materials", () => {
      const materials = [
        { code: "MAT-001", description: "Material 1", unit: "UN" },
        { description: "Sem Código", unit: "KG" },
        { code: "MAT-003", description: "Material 3", unit: "M" },
      ];

      const result = validateMaterialBatch(materials);
      expect(result.valid.length).toBe(2);
      expect(result.invalid.length).toBe(1);
      expect(result.invalid[0].index).toBe(1);
    });
  });
});
