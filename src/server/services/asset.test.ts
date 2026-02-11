/**
 * Testes do AssetService
 * @see VIO-1075
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  calculateStraightLineDepreciation,
  calculateDecliningBalanceDepreciation,
  calculateSumOfYearsDepreciation,
  calculateAnnualRate,
  calculateMonthlyRate,
  getDefaultUsefulLife,
  calculateDisposalGainLoss,
  AssetService,
} from "./asset";

// ==========================================================================
// PURE FUNCTIONS
// ==========================================================================

describe("calculateStraightLineDepreciation", () => {
  it("should calculate monthly depreciation correctly", () => {
    // R$ 120.000 - R$ 12.000 = R$ 108.000 / 120 meses = R$ 900/mês
    expect(calculateStraightLineDepreciation(120000, 12000, 120)).toBe(900);
  });

  it("should return 0 for zero useful life", () => {
    expect(calculateStraightLineDepreciation(100000, 0, 0)).toBe(0);
  });

  it("should return 0 when residual >= acquisition", () => {
    expect(calculateStraightLineDepreciation(10000, 10000, 60)).toBe(0);
    expect(calculateStraightLineDepreciation(10000, 15000, 60)).toBe(0);
  });

  it("should handle no residual value", () => {
    // R$ 60.000 / 60 meses = R$ 1.000/mês
    expect(calculateStraightLineDepreciation(60000, 0, 60)).toBe(1000);
  });
});

describe("calculateDecliningBalanceDepreciation", () => {
  it("should apply double rate on net book value", () => {
    // Taxa anual 10%, acelerada 20%, mensal ~1.6667%
    // R$ 100.000 * (10 * 2 / 12 / 100) = R$ 1.666,67
    const result = calculateDecliningBalanceDepreciation(100000, 10000, 10);
    expect(result).toBeCloseTo(1666.67, 1);
  });

  it("should return 0 when net book value <= residual", () => {
    expect(calculateDecliningBalanceDepreciation(10000, 10000, 10)).toBe(0);
    expect(calculateDecliningBalanceDepreciation(5000, 10000, 10)).toBe(0);
  });

  it("should not depreciate below residual value", () => {
    // Net book value very close to residual
    const result = calculateDecliningBalanceDepreciation(10100, 10000, 10);
    expect(result).toBeLessThanOrEqual(100);
  });
});

describe("calculateSumOfYearsDepreciation", () => {
  it("should calculate depreciation with decreasing fraction", () => {
    // 5 years useful life, sum = 15
    // Year 1: (100000 - 10000) * 5/15 / 12 = 2500
    const result = calculateSumOfYearsDepreciation(100000, 10000, 60, 0);
    expect(result).toBe(2500);
  });

  it("should decrease over time", () => {
    const year1 = calculateSumOfYearsDepreciation(100000, 10000, 60, 0);
    const year2 = calculateSumOfYearsDepreciation(100000, 10000, 60, 12);
    const year3 = calculateSumOfYearsDepreciation(100000, 10000, 60, 24);
    expect(year1).toBeGreaterThan(year2);
    expect(year2).toBeGreaterThan(year3);
  });

  it("should return 0 when useful life exhausted", () => {
    expect(calculateSumOfYearsDepreciation(100000, 10000, 60, 60)).toBe(0);
  });

  it("should return 0 for zero useful life", () => {
    expect(calculateSumOfYearsDepreciation(100000, 0, 0, 0)).toBe(0);
  });
});

describe("calculateAnnualRate", () => {
  it("should calculate rate for 10-year life", () => {
    // 12/120 * 100 = 10%
    expect(calculateAnnualRate(120)).toBe(10);
  });

  it("should calculate rate for 5-year life", () => {
    // 12/60 * 100 = 20%
    expect(calculateAnnualRate(60)).toBe(20);
  });

  it("should return 0 for zero months", () => {
    expect(calculateAnnualRate(0)).toBe(0);
  });
});

describe("calculateMonthlyRate", () => {
  it("should divide annual rate by 12", () => {
    expect(calculateMonthlyRate(12)).toBe(1);
    expect(calculateMonthlyRate(10)).toBeCloseTo(0.8333, 3);
  });
});

describe("getDefaultUsefulLife", () => {
  it("should return correct values per category", () => {
    expect(getDefaultUsefulLife("BUILDINGS")).toBe(300);
    expect(getDefaultUsefulLife("MACHINERY")).toBe(120);
    expect(getDefaultUsefulLife("VEHICLES")).toBe(60);
    expect(getDefaultUsefulLife("FURNITURE")).toBe(120);
    expect(getDefaultUsefulLife("IT_EQUIPMENT")).toBe(60);
    expect(getDefaultUsefulLife("LAND")).toBe(0);
    expect(getDefaultUsefulLife("OTHER")).toBe(120);
  });
});

describe("calculateDisposalGainLoss", () => {
  it("should detect gain when disposal > net book value", () => {
    const result = calculateDisposalGainLoss(50000, 60000);
    expect(result.gainLoss).toBe(10000);
    expect(result.type).toBe("GAIN");
  });

  it("should detect loss when disposal < net book value", () => {
    const result = calculateDisposalGainLoss(50000, 30000);
    expect(result.gainLoss).toBe(-20000);
    expect(result.type).toBe("LOSS");
  });

  it("should detect neutral when equal", () => {
    const result = calculateDisposalGainLoss(50000, 50000);
    expect(result.gainLoss).toBe(0);
    expect(result.type).toBe("NEUTRAL");
  });
});

// ==========================================================================
// SERVICE CLASS TESTS
// ==========================================================================

describe("AssetService", () => {
  let service: AssetService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      fixedAsset: {
        findFirst: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([]),
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockImplementation(({ data }) => Promise.resolve({
          id: "asset-1",
          ...data,
          netBookValue: data.acquisitionValue,
          accumulatedDepr: 0,
        })),
        update: vi.fn().mockImplementation(({ data }) => Promise.resolve(data)),
      },
      assetDepreciation: {
        create: vi.fn().mockResolvedValue({}),
        findUnique: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([]),
      },
      assetMovement: {
        create: vi.fn().mockResolvedValue({}),
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      $transaction: vi.fn().mockImplementation((fn: any) => fn(mockPrisma)),
    };
    service = new AssetService(mockPrisma);
  });

  describe("createAsset", () => {
    it("should create asset with auto-generated code", async () => {
      mockPrisma.fixedAsset.findFirst.mockResolvedValue({ code: 5 });

      await service.createAsset({
        companyId: "comp-1",
        name: "Torno CNC",
        category: "MACHINERY",
        acquisitionDate: new Date("2026-01-15"),
        acquisitionValue: 150000,
        usefulLifeMonths: 120,
      });

      expect(mockPrisma.fixedAsset.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          code: 6,
          name: "Torno CNC",
          category: "MACHINERY",
          acquisitionValue: 150000,
          depreciationRate: 10, // 12/120 * 100
          netBookValue: 150000,
          accumulatedDepr: 0,
          status: "ACTIVE",
        }),
      });
    });

    it("should start code at 1 when no assets exist", async () => {
      mockPrisma.fixedAsset.findFirst.mockResolvedValue(null);

      await service.createAsset({
        companyId: "comp-1",
        name: "Mesa",
        category: "FURNITURE",
        acquisitionDate: new Date("2026-01-01"),
        acquisitionValue: 2000,
        usefulLifeMonths: 120,
      });

      expect(mockPrisma.fixedAsset.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ code: 1 }),
      });
    });

    it("should register acquisition movement", async () => {
      await service.createAsset({
        companyId: "comp-1",
        name: "Computador",
        category: "IT_EQUIPMENT",
        acquisitionDate: new Date("2026-02-01"),
        acquisitionValue: 5000,
        usefulLifeMonths: 60,
      });

      expect(mockPrisma.assetMovement.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: "ACQUISITION",
          value: 5000,
        }),
      });
    });
  });

  describe("calculateMonthlyDepreciation", () => {
    it("should use straight line method", () => {
      const result = service.calculateMonthlyDepreciation(
        "STRAIGHT_LINE", 120000, 12000, 120, 120000, 10, 0,
      );
      expect(result).toBe(900);
    });

    it("should use declining balance method", () => {
      const result = service.calculateMonthlyDepreciation(
        "DECLINING_BALANCE", 100000, 10000, 120, 100000, 10, 0,
      );
      expect(result).toBeGreaterThan(0);
    });

    it("should use sum of years method", () => {
      const result = service.calculateMonthlyDepreciation(
        "SUM_OF_YEARS", 100000, 10000, 60, 100000, 20, 0,
      );
      expect(result).toBe(2500);
    });

    it("should return 0 when fully depreciated", () => {
      const result = service.calculateMonthlyDepreciation(
        "STRAIGHT_LINE", 100000, 10000, 120, 10000, 10, 120,
      );
      expect(result).toBe(0);
    });

    it("should not depreciate below residual value", () => {
      const result = service.calculateMonthlyDepreciation(
        "STRAIGHT_LINE", 100000, 99500, 120, 99600, 10, 0,
      );
      expect(result).toBeLessThanOrEqual(100);
    });
  });

  describe("processMonthlyDepreciation", () => {
    it("should depreciate all active assets", async () => {
      const mockAssets = [
        {
          id: "asset-1",
          name: "Máquina A",
          netBookValue: 100000,
          residualValue: 10000,
          acquisitionValue: 100000,
          depreciationRate: 10,
          accumulatedDepr: 0,
          depreciationMethod: "STRAIGHT_LINE",
          usefulLifeMonths: 120,
          acquisitionDate: new Date("2025-01-01"),
        },
      ];
      mockPrisma.fixedAsset.findMany.mockResolvedValue(mockAssets);

      const period = new Date("2026-02-01");
      const results = await service.processMonthlyDepreciation("comp-1", period);

      expect(results).toHaveLength(1);
      expect(results[0].depreciationValue).toBe(750);
      expect(mockPrisma.assetDepreciation.create).toHaveBeenCalled();
      expect(mockPrisma.fixedAsset.update).toHaveBeenCalled();
      expect(mockPrisma.assetMovement.create).toHaveBeenCalled();
    });

    it("should skip already depreciated periods", async () => {
      mockPrisma.fixedAsset.findMany.mockResolvedValue([
        {
          id: "asset-1",
          name: "Máquina A",
          netBookValue: 100000,
          residualValue: 10000,
          acquisitionValue: 100000,
          depreciationRate: 10,
          accumulatedDepr: 0,
          depreciationMethod: "STRAIGHT_LINE",
          usefulLifeMonths: 120,
          acquisitionDate: new Date("2025-01-01"),
        },
      ]);
      mockPrisma.assetDepreciation.findMany.mockResolvedValue([{ assetId: "asset-1" }]);

      const results = await service.processMonthlyDepreciation("comp-1", new Date("2026-02-01"));
      expect(results).toHaveLength(0);
    });

    it("should skip LAND category", async () => {
      const results = await service.processMonthlyDepreciation("comp-1", new Date("2026-02-01"));
      expect(mockPrisma.fixedAsset.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          category: { not: "LAND" },
        }),
      });
      expect(results).toHaveLength(0);
    });

    it("should mark asset as FULLY_DEPRECIATED when net book value reaches residual", async () => {
      mockPrisma.fixedAsset.findMany.mockResolvedValue([
        {
          id: "asset-1",
          name: "Máquina A",
          netBookValue: 10750,
          residualValue: 10000,
          acquisitionValue: 100000,
          depreciationRate: 10,
          accumulatedDepr: 89250,
          depreciationMethod: "STRAIGHT_LINE",
          usefulLifeMonths: 120,
          acquisitionDate: new Date("2015-01-01"),
        },
      ]);

      await service.processMonthlyDepreciation("comp-1", new Date("2026-02-01"));

      expect(mockPrisma.fixedAsset.update).toHaveBeenCalledWith({
        where: { id: "asset-1" },
        data: expect.objectContaining({
          status: "FULLY_DEPRECIATED",
        }),
      });
    });
  });

  describe("disposeAsset", () => {
    it("should dispose asset and calculate gain", async () => {
      mockPrisma.fixedAsset.findFirst.mockResolvedValue({
        id: "asset-1",
        status: "ACTIVE",
        netBookValue: 50000,
      });

      const result = await service.disposeAsset({
        assetId: "asset-1",
        companyId: "comp-1",
        disposalDate: new Date("2026-03-01"),
        disposalValue: 60000,
        disposalReason: "Venda",
      });

      expect(result.gainLoss).toBe(10000);
      expect(result.type).toBe("GAIN");
      expect(mockPrisma.fixedAsset.update).toHaveBeenCalledWith({
        where: { id: "asset-1" },
        data: expect.objectContaining({ status: "DISPOSED" }),
      });
    });

    it("should dispose asset and calculate loss", async () => {
      mockPrisma.fixedAsset.findFirst.mockResolvedValue({
        id: "asset-1",
        status: "ACTIVE",
        netBookValue: 50000,
      });

      const result = await service.disposeAsset({
        assetId: "asset-1",
        companyId: "comp-1",
        disposalDate: new Date("2026-03-01"),
        disposalValue: 30000,
        disposalReason: "Descarte",
      });

      expect(result.gainLoss).toBe(-20000);
      expect(result.type).toBe("LOSS");
    });

    it("should throw if asset not found", async () => {
      await expect(
        service.disposeAsset({
          assetId: "nonexistent",
          companyId: "comp-1",
          disposalDate: new Date(),
          disposalValue: 0,
          disposalReason: "test",
        }),
      ).rejects.toThrow("Ativo não encontrado");
    });

    it("should throw if asset already disposed", async () => {
      mockPrisma.fixedAsset.findFirst.mockResolvedValue({
        id: "asset-1",
        status: "DISPOSED",
      });

      await expect(
        service.disposeAsset({
          assetId: "asset-1",
          companyId: "comp-1",
          disposalDate: new Date(),
          disposalValue: 0,
          disposalReason: "test",
        }),
      ).rejects.toThrow("Ativo já foi baixado");
    });

    it("should register disposal movement", async () => {
      mockPrisma.fixedAsset.findFirst.mockResolvedValue({
        id: "asset-1",
        status: "ACTIVE",
        netBookValue: 50000,
      });

      await service.disposeAsset({
        assetId: "asset-1",
        companyId: "comp-1",
        disposalDate: new Date("2026-03-01"),
        disposalValue: 50000,
        disposalReason: "Venda",
        userId: "user-1",
      });

      expect(mockPrisma.assetMovement.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: "DISPOSAL",
          createdBy: "user-1",
        }),
      });
    });
  });

  describe("transferAsset", () => {
    it("should transfer active asset", async () => {
      mockPrisma.fixedAsset.findFirst.mockResolvedValue({
        id: "asset-1",
        status: "ACTIVE",
        location: "Galpão A",
        costCenterId: "cc-1",
        netBookValue: 80000,
      });

      await service.transferAsset({
        assetId: "asset-1",
        companyId: "comp-1",
        date: new Date("2026-03-01"),
        toLocation: "Galpão B",
        toCostCenterId: "cc-2",
        description: "Transferência para nova unidade",
      });

      expect(mockPrisma.fixedAsset.update).toHaveBeenCalledWith({
        where: { id: "asset-1" },
        data: { location: "Galpão B", costCenterId: "cc-2" },
      });

      expect(mockPrisma.assetMovement.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: "TRANSFER",
          fromLocation: "Galpão A",
          toLocation: "Galpão B",
          fromCostCenterId: "cc-1",
          toCostCenterId: "cc-2",
        }),
      });
    });

    it("should throw if asset not found", async () => {
      await expect(
        service.transferAsset({
          assetId: "nonexistent",
          companyId: "comp-1",
          date: new Date(),
          description: "test",
        }),
      ).rejects.toThrow("Ativo não encontrado");
    });

    it("should throw if asset is disposed", async () => {
      mockPrisma.fixedAsset.findFirst.mockResolvedValue({
        id: "asset-1",
        status: "DISPOSED",
      });

      await expect(
        service.transferAsset({
          assetId: "asset-1",
          companyId: "comp-1",
          date: new Date(),
          description: "test",
        }),
      ).rejects.toThrow("Apenas ativos ativos ou totalmente depreciados podem ser transferidos");
    });

    it("should allow transfer of fully depreciated asset", async () => {
      mockPrisma.fixedAsset.findFirst.mockResolvedValue({
        id: "asset-1",
        status: "FULLY_DEPRECIATED",
        location: "Sala 1",
        costCenterId: null,
        netBookValue: 0,
      });

      await service.transferAsset({
        assetId: "asset-1",
        companyId: "comp-1",
        date: new Date(),
        toLocation: "Sala 2",
        description: "Remanejamento",
      });

      expect(mockPrisma.fixedAsset.update).toHaveBeenCalled();
    });
  });

  describe("getSummary", () => {
    it("should aggregate asset data correctly", async () => {
      mockPrisma.fixedAsset.findMany.mockResolvedValue([
        { category: "MACHINERY", status: "ACTIVE", acquisitionValue: 100000, accumulatedDepr: 20000, netBookValue: 80000 },
        { category: "MACHINERY", status: "ACTIVE", acquisitionValue: 50000, accumulatedDepr: 10000, netBookValue: 40000 },
        { category: "VEHICLES", status: "DISPOSED", acquisitionValue: 80000, accumulatedDepr: 60000, netBookValue: 20000 },
      ]);

      const summary = await service.getSummary("comp-1");

      expect(summary.totalAssets).toBe(3);
      expect(summary.totalAcquisitionValue).toBe(230000);
      expect(summary.totalAccumulatedDepreciation).toBe(90000);
      expect(summary.totalNetBookValue).toBe(140000);
      expect(summary.byCategory).toHaveLength(2);
      expect(summary.byStatus).toHaveLength(2);

      const machinery = summary.byCategory.find((c) => c.category === "MACHINERY");
      expect(machinery?.count).toBe(2);
      expect(machinery?.acquisitionValue).toBe(150000);
    });

    it("should return empty summary when no assets", async () => {
      const summary = await service.getSummary("comp-1");

      expect(summary.totalAssets).toBe(0);
      expect(summary.totalAcquisitionValue).toBe(0);
      expect(summary.byCategory).toHaveLength(0);
      expect(summary.byStatus).toHaveLength(0);
    });
  });
});
