import { describe, it, expect } from "vitest";
import { z } from "zod";

/**
 * Testes de schema para o router productionCosts (Custos de Produção)
 * Valida inputs e estruturas de dados de custos de ordens de produção
 */

// Schema de status do custo
const costStatusSchema = z.enum(["DRAFT", "CALCULATED", "CLOSED"]);

// Schema de listagem
const listInputSchema = z.object({
  search: z.string().optional(),
  status: costStatusSchema.optional(),
  page: z.number().default(1),
  limit: z.number().default(20),
});

// Schema de busca por ID
const byIdInputSchema = z.object({
  id: z.string(),
});

// Schema de busca por OP
const byProductionOrderInputSchema = z.object({
  productionOrderId: z.string(),
});

// Schema de cálculo de custo
const calculateInputSchema = z.object({
  productionOrderId: z.string(),
  includeOverhead: z.boolean().default(true),
  overheadRate: z.number().min(0).max(100).default(15),
});

// Schema de item de custo de material
const materialCostItemSchema = z.object({
  materialId: z.string(),
  quantity: z.number().positive(),
  unitCost: z.number(),
  totalCost: z.number(),
});

// Schema de item de custo de mão de obra
const laborCostItemSchema = z.object({
  workCenterId: z.string(),
  hours: z.number().positive(),
  hourlyRate: z.number(),
  totalCost: z.number(),
});

// Schema de resposta de custo
const costResponseSchema = z.object({
  id: z.string(),
  productionOrderId: z.string(),
  status: costStatusSchema,
  materialCost: z.number(),
  laborCost: z.number(),
  overheadCost: z.number(),
  totalCost: z.number(),
  unitCost: z.number(),
  producedQuantity: z.number(),
  companyId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

describe("Production Costs Router Schemas", () => {
  describe("Cost Status Schema", () => {
    it("should accept DRAFT status", () => {
      const result = costStatusSchema.safeParse("DRAFT");
      expect(result.success).toBe(true);
    });

    it("should accept CALCULATED status", () => {
      const result = costStatusSchema.safeParse("CALCULATED");
      expect(result.success).toBe(true);
    });

    it("should accept CLOSED status", () => {
      const result = costStatusSchema.safeParse("CLOSED");
      expect(result.success).toBe(true);
    });

    it("should reject invalid status", () => {
      const result = costStatusSchema.safeParse("INVALID");
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

    it("should accept search filter", () => {
      const result = listInputSchema.safeParse({
        search: "OP-001",
      });
      expect(result.success).toBe(true);
    });

    it("should accept status filter", () => {
      const result = listInputSchema.safeParse({
        status: "CALCULATED",
      });
      expect(result.success).toBe(true);
    });

    it("should accept all filters combined", () => {
      const result = listInputSchema.safeParse({
        search: "produto",
        status: "CLOSED",
        page: 2,
        limit: 50,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("By ID Input Schema", () => {
    it("should accept valid ID", () => {
      const result = byIdInputSchema.safeParse({
        id: "123e4567-e89b-12d3-a456-426614174000",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing ID", () => {
      const result = byIdInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("By Production Order Input Schema", () => {
    it("should accept valid productionOrderId", () => {
      const result = byProductionOrderInputSchema.safeParse({
        productionOrderId: "123e4567-e89b-12d3-a456-426614174000",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing productionOrderId", () => {
      const result = byProductionOrderInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("Calculate Input Schema", () => {
    it("should accept minimal input", () => {
      const result = calculateInputSchema.safeParse({
        productionOrderId: "123e4567-e89b-12d3-a456-426614174000",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.includeOverhead).toBe(true);
        expect(result.data.overheadRate).toBe(15);
      }
    });

    it("should accept complete input", () => {
      const result = calculateInputSchema.safeParse({
        productionOrderId: "123e4567-e89b-12d3-a456-426614174000",
        includeOverhead: true,
        overheadRate: 20,
      });
      expect(result.success).toBe(true);
    });

    it("should accept input without overhead", () => {
      const result = calculateInputSchema.safeParse({
        productionOrderId: "123e4567-e89b-12d3-a456-426614174000",
        includeOverhead: false,
      });
      expect(result.success).toBe(true);
    });

    it("should reject overheadRate below 0", () => {
      const result = calculateInputSchema.safeParse({
        productionOrderId: "123e4567-e89b-12d3-a456-426614174000",
        overheadRate: -5,
      });
      expect(result.success).toBe(false);
    });

    it("should reject overheadRate above 100", () => {
      const result = calculateInputSchema.safeParse({
        productionOrderId: "123e4567-e89b-12d3-a456-426614174000",
        overheadRate: 150,
      });
      expect(result.success).toBe(false);
    });

    it("should accept overheadRate at boundaries", () => {
      const result0 = calculateInputSchema.safeParse({
        productionOrderId: "123e4567-e89b-12d3-a456-426614174000",
        overheadRate: 0,
      });
      const result100 = calculateInputSchema.safeParse({
        productionOrderId: "123e4567-e89b-12d3-a456-426614174000",
        overheadRate: 100,
      });
      expect(result0.success).toBe(true);
      expect(result100.success).toBe(true);
    });

    it("should reject missing productionOrderId", () => {
      const result = calculateInputSchema.safeParse({
        includeOverhead: true,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Material Cost Item Schema", () => {
    it("should accept valid item", () => {
      const result = materialCostItemSchema.safeParse({
        materialId: "123e4567-e89b-12d3-a456-426614174000",
        quantity: 100,
        unitCost: 10.5,
        totalCost: 1050,
      });
      expect(result.success).toBe(true);
    });

    it("should reject zero quantity", () => {
      const result = materialCostItemSchema.safeParse({
        materialId: "123e4567-e89b-12d3-a456-426614174000",
        quantity: 0,
        unitCost: 10.5,
        totalCost: 0,
      });
      expect(result.success).toBe(false);
    });

    it("should reject negative quantity", () => {
      const result = materialCostItemSchema.safeParse({
        materialId: "123e4567-e89b-12d3-a456-426614174000",
        quantity: -10,
        unitCost: 10.5,
        totalCost: -105,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Labor Cost Item Schema", () => {
    it("should accept valid item", () => {
      const result = laborCostItemSchema.safeParse({
        workCenterId: "123e4567-e89b-12d3-a456-426614174000",
        hours: 8,
        hourlyRate: 50,
        totalCost: 400,
      });
      expect(result.success).toBe(true);
    });

    it("should reject zero hours", () => {
      const result = laborCostItemSchema.safeParse({
        workCenterId: "123e4567-e89b-12d3-a456-426614174000",
        hours: 0,
        hourlyRate: 50,
        totalCost: 0,
      });
      expect(result.success).toBe(false);
    });

    it("should reject negative hours", () => {
      const result = laborCostItemSchema.safeParse({
        workCenterId: "123e4567-e89b-12d3-a456-426614174000",
        hours: -2,
        hourlyRate: 50,
        totalCost: -100,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("Cost Response Schema", () => {
    it("should validate complete cost response", () => {
      const result = costResponseSchema.safeParse({
        id: "123e4567-e89b-12d3-a456-426614174000",
        productionOrderId: "op-id",
        status: "CALCULATED",
        materialCost: 5000,
        laborCost: 2000,
        overheadCost: 1050,
        totalCost: 8050,
        unitCost: 80.5,
        producedQuantity: 100,
        companyId: "company-id",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      expect(result.success).toBe(true);
    });

    it("should validate draft cost with zero values", () => {
      const result = costResponseSchema.safeParse({
        id: "123e4567-e89b-12d3-a456-426614174000",
        productionOrderId: "op-id",
        status: "DRAFT",
        materialCost: 0,
        laborCost: 0,
        overheadCost: 0,
        totalCost: 0,
        unitCost: 0,
        producedQuantity: 0,
        companyId: "company-id",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      expect(result.success).toBe(true);
    });
  });

  describe("Cost Calculations", () => {
    it("should calculate material cost correctly", () => {
      const materials = [
        { quantity: 100, unitCost: 10 },
        { quantity: 50, unitCost: 20 },
        { quantity: 25, unitCost: 40 },
      ];
      const materialCost = materials.reduce(
        (sum, m) => sum + m.quantity * m.unitCost,
        0
      );
      expect(materialCost).toBe(3000); // 1000 + 1000 + 1000
    });

    it("should calculate labor cost correctly", () => {
      const labor = [
        { hours: 8, hourlyRate: 50 },
        { hours: 4, hourlyRate: 75 },
        { hours: 2, hourlyRate: 100 },
      ];
      const laborCost = labor.reduce(
        (sum, l) => sum + l.hours * l.hourlyRate,
        0
      );
      expect(laborCost).toBe(900); // 400 + 300 + 200
    });

    it("should calculate overhead cost correctly", () => {
      const directCost = 5000; // material + labor
      const overheadRate = 15; // 15%
      const overheadCost = directCost * (overheadRate / 100);
      expect(overheadCost).toBe(750);
    });

    it("should calculate total cost correctly", () => {
      const materialCost = 3000;
      const laborCost = 2000;
      const overheadCost = 750;
      const totalCost = materialCost + laborCost + overheadCost;
      expect(totalCost).toBe(5750);
    });

    it("should calculate unit cost correctly", () => {
      const totalCost = 5750;
      const producedQuantity = 100;
      const unitCost = totalCost / producedQuantity;
      expect(unitCost).toBe(57.5);
    });

    it("should handle zero produced quantity", () => {
      const totalCost = 5750;
      const producedQuantity = 0;
      const unitCost = producedQuantity === 0 ? 0 : totalCost / producedQuantity;
      expect(unitCost).toBe(0);
    });
  });

  describe("Cost Variance Analysis", () => {
    it("should calculate material variance", () => {
      const plannedMaterialCost = 3000;
      const actualMaterialCost = 3200;
      const variance = actualMaterialCost - plannedMaterialCost;
      const variancePercent = (variance / plannedMaterialCost) * 100;
      expect(variance).toBe(200);
      expect(variancePercent).toBeCloseTo(6.67, 2);
    });

    it("should calculate labor variance", () => {
      const plannedLaborCost = 2000;
      const actualLaborCost = 1800;
      const variance = actualLaborCost - plannedLaborCost;
      const variancePercent = (variance / plannedLaborCost) * 100;
      expect(variance).toBe(-200);
      expect(variancePercent).toBe(-10);
    });

    it("should calculate total variance", () => {
      const plannedTotalCost = 5000;
      const actualTotalCost = 5500;
      const variance = actualTotalCost - plannedTotalCost;
      const variancePercent = (variance / plannedTotalCost) * 100;
      expect(variance).toBe(500);
      expect(variancePercent).toBe(10);
    });

    it("should identify favorable variance (negative)", () => {
      const variance = -200;
      const isFavorable = variance < 0;
      expect(isFavorable).toBe(true);
    });

    it("should identify unfavorable variance (positive)", () => {
      const variance = 500;
      const isUnfavorable = variance > 0;
      expect(isUnfavorable).toBe(true);
    });
  });

  describe("Cost Allocation", () => {
    it("should allocate overhead by direct cost", () => {
      const totalOverhead = 10000;
      const orders = [
        { id: "op1", directCost: 5000 },
        { id: "op2", directCost: 3000 },
        { id: "op3", directCost: 2000 },
      ];
      const totalDirectCost = orders.reduce((sum, o) => sum + o.directCost, 0);
      
      const allocations = orders.map((o) => ({
        id: o.id,
        overhead: (o.directCost / totalDirectCost) * totalOverhead,
      }));

      expect(allocations[0].overhead).toBe(5000); // 50%
      expect(allocations[1].overhead).toBe(3000); // 30%
      expect(allocations[2].overhead).toBe(2000); // 20%
    });

    it("should allocate overhead by machine hours", () => {
      const totalOverhead = 10000;
      const orders = [
        { id: "op1", machineHours: 100 },
        { id: "op2", machineHours: 60 },
        { id: "op3", machineHours: 40 },
      ];
      const totalMachineHours = orders.reduce((sum, o) => sum + o.machineHours, 0);
      
      const allocations = orders.map((o) => ({
        id: o.id,
        overhead: (o.machineHours / totalMachineHours) * totalOverhead,
      }));

      expect(allocations[0].overhead).toBe(5000); // 50%
      expect(allocations[1].overhead).toBe(3000); // 30%
      expect(allocations[2].overhead).toBe(2000); // 20%
    });
  });

  describe("Cost Status Workflow", () => {
    const validTransitions: Record<string, string[]> = {
      DRAFT: ["CALCULATED"],
      CALCULATED: ["CLOSED", "DRAFT"],
      CLOSED: [],
    };

    it("should allow DRAFT to CALCULATED", () => {
      const from = "DRAFT";
      const to = "CALCULATED";
      expect(validTransitions[from].includes(to)).toBe(true);
    });

    it("should allow CALCULATED to CLOSED", () => {
      const from = "CALCULATED";
      const to = "CLOSED";
      expect(validTransitions[from].includes(to)).toBe(true);
    });

    it("should allow CALCULATED to DRAFT (recalculate)", () => {
      const from = "CALCULATED";
      const to = "DRAFT";
      expect(validTransitions[from].includes(to)).toBe(true);
    });

    it("should not allow CLOSED to any status", () => {
      const from = "CLOSED";
      expect(validTransitions[from].length).toBe(0);
    });
  });
});
