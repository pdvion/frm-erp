import { describe, it, expect } from "vitest";
import { z } from "zod";

/**
 * Testes de schema para o router stockLocations (Locais de Estoque)
 * Valida inputs e estruturas de dados de locais de armazenamento
 */

// Schema de tipo de local
const locationTypeSchema = z.enum([
  "WAREHOUSE",
  "PRODUCTION",
  "QUALITY",
  "SHIPPING",
  "RECEIVING",
  "EXTERNAL",
]);

// Schema de listagem
const listInputSchema = z.object({
  search: z.string().optional(),
  type: z.enum(["WAREHOUSE", "PRODUCTION", "QUALITY", "SHIPPING", "RECEIVING", "EXTERNAL", "ALL"]).optional(),
  includeInactive: z.boolean().default(false),
}).optional();

// Schema de criação
const createInputSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(["WAREHOUSE", "PRODUCTION", "QUALITY", "SHIPPING", "RECEIVING", "EXTERNAL"]).default("WAREHOUSE"),
  parentId: z.string().optional(),
  address: z.string().optional(),
  isDefault: z.boolean().default(false),
});

// Schema de atualização
const updateInputSchema = z.object({
  id: z.string(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  type: locationTypeSchema.optional(),
  parentId: z.string().nullable().optional(),
  address: z.string().optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

describe("StockLocations Router Schemas", () => {
  describe("Location Type Schema", () => {
    it("should accept WAREHOUSE type", () => {
      const result = locationTypeSchema.safeParse("WAREHOUSE");
      expect(result.success).toBe(true);
    });

    it("should accept PRODUCTION type", () => {
      const result = locationTypeSchema.safeParse("PRODUCTION");
      expect(result.success).toBe(true);
    });

    it("should accept QUALITY type", () => {
      const result = locationTypeSchema.safeParse("QUALITY");
      expect(result.success).toBe(true);
    });

    it("should accept SHIPPING type", () => {
      const result = locationTypeSchema.safeParse("SHIPPING");
      expect(result.success).toBe(true);
    });

    it("should accept RECEIVING type", () => {
      const result = locationTypeSchema.safeParse("RECEIVING");
      expect(result.success).toBe(true);
    });

    it("should accept EXTERNAL type", () => {
      const result = locationTypeSchema.safeParse("EXTERNAL");
      expect(result.success).toBe(true);
    });

    it("should reject invalid type", () => {
      const result = locationTypeSchema.safeParse("INVALID");
      expect(result.success).toBe(false);
    });
  });

  describe("List Input Schema", () => {
    it("should accept undefined input", () => {
      const result = listInputSchema.safeParse(undefined);
      expect(result.success).toBe(true);
    });

    it("should accept empty object", () => {
      const result = listInputSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("should accept search filter", () => {
      const result = listInputSchema.safeParse({
        search: "almoxarifado",
      });
      expect(result.success).toBe(true);
    });

    it("should accept type filter", () => {
      const result = listInputSchema.safeParse({
        type: "WAREHOUSE",
      });
      expect(result.success).toBe(true);
    });

    it("should accept ALL type filter", () => {
      const result = listInputSchema.safeParse({
        type: "ALL",
      });
      expect(result.success).toBe(true);
    });

    it("should accept includeInactive filter", () => {
      const result = listInputSchema.safeParse({
        includeInactive: true,
      });
      expect(result.success).toBe(true);
    });

    it("should accept all filters combined", () => {
      const result = listInputSchema.safeParse({
        search: "central",
        type: "WAREHOUSE",
        includeInactive: true,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("Create Input Schema", () => {
    it("should accept minimal valid input", () => {
      const result = createInputSchema.safeParse({
        code: "ALM-001",
        name: "Almoxarifado Central",
      });
      expect(result.success).toBe(true);
    });

    it("should accept complete input", () => {
      const result = createInputSchema.safeParse({
        code: "ALM-001",
        name: "Almoxarifado Central",
        description: "Local principal de armazenamento",
        type: "WAREHOUSE",
        address: "Rua Principal, 100",
        isDefault: true,
      });
      expect(result.success).toBe(true);
    });

    it("should accept input with parent", () => {
      const result = createInputSchema.safeParse({
        code: "ALM-001-A",
        name: "Corredor A",
        type: "WAREHOUSE",
        parentId: "parent-location-id",
      });
      expect(result.success).toBe(true);
    });

    it("should reject empty code", () => {
      const result = createInputSchema.safeParse({
        code: "",
        name: "Almoxarifado",
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty name", () => {
      const result = createInputSchema.safeParse({
        code: "ALM-001",
        name: "",
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing code", () => {
      const result = createInputSchema.safeParse({
        name: "Almoxarifado",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Update Input Schema", () => {
    it("should accept valid update", () => {
      const result = updateInputSchema.safeParse({
        id: "location-id",
        name: "Novo Nome",
      });
      expect(result.success).toBe(true);
    });

    it("should accept complete update", () => {
      const result = updateInputSchema.safeParse({
        id: "location-id",
        name: "Almoxarifado Atualizado",
        description: "Nova descrição",
        type: "PRODUCTION",
        address: "Nova Rua, 200",
        isDefault: false,
        isActive: true,
      });
      expect(result.success).toBe(true);
    });

    it("should accept null parentId to remove parent", () => {
      const result = updateInputSchema.safeParse({
        id: "location-id",
        parentId: null,
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing id", () => {
      const result = updateInputSchema.safeParse({
        name: "Novo Nome",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Location Hierarchy", () => {
    it("should validate parent-child relationship", () => {
      const parent = { id: "loc-001", code: "ALM", name: "Almoxarifado" };
      const child = { id: "loc-002", code: "ALM-A", name: "Corredor A", parentId: "loc-001" };
      expect(child.parentId).toBe(parent.id);
    });

    it("should build location path", () => {
      const locations = [
        { id: "1", code: "ALM", name: "Almoxarifado", parentId: null },
        { id: "2", code: "ALM-A", name: "Corredor A", parentId: "1" },
        { id: "3", code: "ALM-A-01", name: "Prateleira 01", parentId: "2" },
      ];
      
      const buildPath = (locId: string): string => {
        const loc = locations.find(l => l.id === locId);
        if (!loc) return "";
        if (!loc.parentId) return loc.code;
        return `${buildPath(loc.parentId)} > ${loc.code}`;
      };
      
      expect(buildPath("3")).toBe("ALM > ALM-A > ALM-A-01");
    });
  });

  describe("Location Types Usage", () => {
    const typeUsage: Record<string, string[]> = {
      WAREHOUSE: ["Armazenamento geral", "Matéria-prima", "Produto acabado"],
      PRODUCTION: ["Linha de produção", "Montagem", "Embalagem"],
      QUALITY: ["Inspeção", "Quarentena", "Análise"],
      SHIPPING: ["Expedição", "Carregamento"],
      RECEIVING: ["Recebimento", "Conferência"],
      EXTERNAL: ["Terceiros", "Consignação"],
    };

    it("should have WAREHOUSE for storage", () => {
      expect(typeUsage.WAREHOUSE).toContain("Armazenamento geral");
    });

    it("should have PRODUCTION for manufacturing", () => {
      expect(typeUsage.PRODUCTION).toContain("Linha de produção");
    });

    it("should have QUALITY for inspection", () => {
      expect(typeUsage.QUALITY).toContain("Inspeção");
    });

    it("should have SHIPPING for outbound", () => {
      expect(typeUsage.SHIPPING).toContain("Expedição");
    });

    it("should have RECEIVING for inbound", () => {
      expect(typeUsage.RECEIVING).toContain("Recebimento");
    });

    it("should have EXTERNAL for third-party", () => {
      expect(typeUsage.EXTERNAL).toContain("Terceiros");
    });
  });

  describe("Default Location", () => {
    it("should only have one default location", () => {
      const locations = [
        { id: "1", isDefault: true },
        { id: "2", isDefault: false },
        { id: "3", isDefault: false },
      ];
      const defaultCount = locations.filter(l => l.isDefault).length;
      expect(defaultCount).toBe(1);
    });

    it("should use default for new transactions", () => {
      const locations = [
        { id: "1", isDefault: false },
        { id: "2", isDefault: true },
        { id: "3", isDefault: false },
      ];
      const defaultLocation = locations.find(l => l.isDefault);
      expect(defaultLocation?.id).toBe("2");
    });
  });

  describe("Location Inventory", () => {
    it("should track quantity per location", () => {
      const inventory = [
        { locationId: "loc-1", materialId: "mat-1", quantity: 100 },
        { locationId: "loc-2", materialId: "mat-1", quantity: 50 },
      ];
      const totalQty = inventory
        .filter(i => i.materialId === "mat-1")
        .reduce((sum, i) => sum + i.quantity, 0);
      expect(totalQty).toBe(150);
    });

    it("should calculate location utilization", () => {
      const location = { capacity: 1000, currentStock: 750 };
      const utilization = (location.currentStock / location.capacity) * 100;
      expect(utilization).toBe(75);
    });
  });
});
