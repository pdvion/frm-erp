import { describe, it, expect } from "vitest";
import type { ImportResult, ImportSummary } from "./entity-importer";

describe("Entity Importer Types", () => {
  describe("ImportResult interface", () => {
    it("should represent supplier creation result", () => {
      const result: ImportResult = {
        entity: "supplier",
        action: "created",
        id: "supplier-123",
        name: "Fornecedor Teste LTDA",
        cnpjCpf: "12.345.678/0001-99",
      };

      expect(result.entity).toBe("supplier");
      expect(result.action).toBe("created");
      expect(result.id).toBe("supplier-123");
    });

    it("should represent customer update result", () => {
      const result: ImportResult = {
        entity: "customer",
        action: "updated",
        id: "customer-456",
        name: "Cliente Teste SA",
        cnpjCpf: "98.765.432/0001-10",
      };

      expect(result.entity).toBe("customer");
      expect(result.action).toBe("updated");
    });

    it("should represent material skip result with reason", () => {
      const result: ImportResult = {
        entity: "material",
        action: "skipped",
        name: "Produto Sem Código",
        reason: "Código ou descrição não informados",
      };

      expect(result.entity).toBe("material");
      expect(result.action).toBe("skipped");
      expect(result.reason).toBe("Código ou descrição não informados");
      expect(result.id).toBeUndefined();
    });

    it("should represent carrier result", () => {
      const result: ImportResult = {
        entity: "carrier",
        action: "created",
        id: "carrier-789",
        name: "Transportadora Express",
        cnpjCpf: "11.222.333/0001-44",
      };

      expect(result.entity).toBe("carrier");
    });

    it("should handle CPF format", () => {
      const result: ImportResult = {
        entity: "customer",
        action: "created",
        id: "customer-pf",
        name: "João da Silva",
        cnpjCpf: "123.456.789-00",
      };

      expect(result.cnpjCpf).toBe("123.456.789-00");
    });
  });

  describe("ImportSummary interface", () => {
    it("should represent empty summary", () => {
      const summary: ImportSummary = {
        suppliers: [],
        customers: [],
        materials: [],
        carriers: [],
        totalCreated: 0,
        totalUpdated: 0,
        totalSkipped: 0,
      };

      expect(summary.totalCreated).toBe(0);
      expect(summary.suppliers).toHaveLength(0);
    });

    it("should represent summary with results", () => {
      const summary: ImportSummary = {
        suppliers: [
          { entity: "supplier", action: "created", name: "Fornecedor 1", id: "s1" },
          { entity: "supplier", action: "skipped", name: "Fornecedor 2", reason: "Já existe" },
        ],
        customers: [
          { entity: "customer", action: "created", name: "Cliente 1", id: "c1" },
        ],
        materials: [
          { entity: "material", action: "created", name: "Material 1", id: "m1" },
          { entity: "material", action: "created", name: "Material 2", id: "m2" },
          { entity: "material", action: "updated", name: "Material 3", id: "m3" },
        ],
        carriers: [],
        totalCreated: 4,
        totalUpdated: 1,
        totalSkipped: 1,
      };

      expect(summary.suppliers).toHaveLength(2);
      expect(summary.customers).toHaveLength(1);
      expect(summary.materials).toHaveLength(3);
      expect(summary.carriers).toHaveLength(0);
      expect(summary.totalCreated).toBe(4);
      expect(summary.totalUpdated).toBe(1);
      expect(summary.totalSkipped).toBe(1);
    });

    it("should calculate totals correctly", () => {
      const summary: ImportSummary = {
        suppliers: [
          { entity: "supplier", action: "created", name: "F1", id: "s1" },
        ],
        customers: [
          { entity: "customer", action: "updated", name: "C1", id: "c1" },
        ],
        materials: [
          { entity: "material", action: "skipped", name: "M1", reason: "Sem código" },
        ],
        carriers: [],
        totalCreated: 1,
        totalUpdated: 1,
        totalSkipped: 1,
      };

      const total = summary.totalCreated + summary.totalUpdated + summary.totalSkipped;
      expect(total).toBe(3);
    });
  });

  describe("Action types", () => {
    it("should support created action", () => {
      const result: ImportResult = {
        entity: "supplier",
        action: "created",
        name: "Test",
      };
      expect(result.action).toBe("created");
    });

    it("should support updated action", () => {
      const result: ImportResult = {
        entity: "customer",
        action: "updated",
        name: "Test",
      };
      expect(result.action).toBe("updated");
    });

    it("should support skipped action", () => {
      const result: ImportResult = {
        entity: "material",
        action: "skipped",
        name: "Test",
      };
      expect(result.action).toBe("skipped");
    });
  });

  describe("Entity types", () => {
    it("should support supplier entity", () => {
      const result: ImportResult = {
        entity: "supplier",
        action: "created",
        name: "Test",
      };
      expect(result.entity).toBe("supplier");
    });

    it("should support customer entity", () => {
      const result: ImportResult = {
        entity: "customer",
        action: "created",
        name: "Test",
      };
      expect(result.entity).toBe("customer");
    });

    it("should support material entity", () => {
      const result: ImportResult = {
        entity: "material",
        action: "created",
        name: "Test",
      };
      expect(result.entity).toBe("material");
    });

    it("should support carrier entity", () => {
      const result: ImportResult = {
        entity: "carrier",
        action: "created",
        name: "Test",
      };
      expect(result.entity).toBe("carrier");
    });
  });
});
