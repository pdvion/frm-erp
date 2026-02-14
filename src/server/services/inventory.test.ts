import { describe, it, expect, vi, beforeEach } from "vitest";
import { InventoryService } from "./inventory";
import type { CreateMovementInput, CreateReservationInput } from "./inventory";

// ==========================================================================
// MOCK HELPERS
// ==========================================================================

function createMockInventory(overrides = {}) {
  return {
    id: "inv-1",
    materialId: "mat-1",
    companyId: "company-1",
    inventoryType: "RAW_MATERIAL",
    quantity: 100,
    availableQty: 80,
    reservedQty: 20,
    unitCost: 10,
    totalCost: 1000,
    version: 1,
    lastMovementAt: new Date(),
    material: {
      id: "mat-1",
      code: 1,
      description: "Aço Inox 304",
      unit: "KG",
      minQuantity: 50,
      lastPurchasePrice: 10,
      category: { name: "Matéria-Prima" },
    },
    ...overrides,
  };
}

function createMockReservation(overrides = {}) {
  return {
    id: "res-1",
    code: 1,
    companyId: "company-1",
    inventoryId: "inv-1",
    materialId: "mat-1",
    quantity: 10,
    consumedQty: 0,
    documentType: "PRODUCTION_ORDER",
    documentId: "po-1",
    documentNumber: "OP-001",
    status: "ACTIVE",
    createdBy: "user-1",
    inventory: createMockInventory(),
    material: { id: "mat-1", code: 1, description: "Aço Inox 304", unit: "KG" },
    ...overrides,
  };
}

function createMockTx() {
  return {
    inventory: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    inventoryMovement: {
      create: vi.fn(),
    },
    stockReservation: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  };
}

function createMockPrisma(txOverrides?: ReturnType<typeof createMockTx>) {
  const tx = txOverrides ?? createMockTx();

  const prisma = {
    inventory: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    inventoryMovement: {
      create: vi.fn(),
    },
    stockReservation: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    $transaction: vi.fn(async (fn: (tx: any) => Promise<unknown>) => {
      return fn(tx);
    }),
  } as unknown as import("@prisma/client").PrismaClient;

  return { prisma, tx };
}

// ==========================================================================
// TESTS
// ==========================================================================

describe("InventoryService", () => {
  let service: InventoryService;
  let prisma: ReturnType<typeof createMockPrisma>["prisma"];
  let tx: ReturnType<typeof createMockTx>;

  beforeEach(() => {
    vi.clearAllMocks();
    const mocks = createMockPrisma();
    prisma = mocks.prisma;
    tx = mocks.tx;
    service = new InventoryService(prisma);
  });

  // ========================================================================
  // createMovement
  // ========================================================================

  describe("createMovement", () => {
    const baseInput: CreateMovementInput = {
      materialId: "mat-1",
      inventoryType: "RAW_MATERIAL",
      movementType: "ENTRY",
      quantity: 50,
      unitCost: 12,
      companyId: "company-1",
    };

    it("should create entry movement and update stock with weighted average cost", async () => {
      const inventory = createMockInventory();
      tx.inventory.findFirst.mockResolvedValue(inventory);
      tx.inventoryMovement.create.mockResolvedValue({
        id: "mov-1",
        inventory: { ...inventory, material: inventory.material },
      });
      tx.inventory.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.createMovement(baseInput);

      expect(result).toBeDefined();
      expect(tx.inventoryMovement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            movementType: "ENTRY",
            quantity: 50,
            unitCost: 12,
            balanceAfter: 150, // 100 + 50
          }),
        }),
      );

      // Verify optimistic locking
      expect(tx.inventory.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "inv-1", version: 1 },
          data: expect.objectContaining({
            quantity: 150,
            version: 2,
          }),
        }),
      );
    });

    it("should create inventory record if it does not exist", async () => {
      tx.inventory.findFirst.mockResolvedValue(null);
      const newInventory = createMockInventory({ quantity: 0, availableQty: 0, reservedQty: 0, unitCost: 0, totalCost: 0 });
      tx.inventory.create.mockResolvedValue(newInventory);
      tx.inventoryMovement.create.mockResolvedValue({ id: "mov-1", inventory: newInventory });
      tx.inventory.updateMany.mockResolvedValue({ count: 1 });

      await service.createMovement(baseInput);

      expect(tx.inventory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            materialId: "mat-1",
            inventoryType: "RAW_MATERIAL",
            companyId: "company-1",
            quantity: 0,
            version: 1,
          }),
        }),
      );
    });

    it("should reject exit movement when balance is insufficient", async () => {
      const inventory = createMockInventory({ quantity: 10 });
      tx.inventory.findFirst.mockResolvedValue(inventory);

      await expect(
        service.createMovement({ ...baseInput, movementType: "EXIT", quantity: 20 }),
      ).rejects.toThrow("Saldo insuficiente");
    });

    it("should throw CONFLICT on optimistic lock failure", async () => {
      const inventory = createMockInventory();
      tx.inventory.findFirst.mockResolvedValue(inventory);
      tx.inventoryMovement.create.mockResolvedValue({ id: "mov-1", inventory });
      tx.inventory.updateMany.mockResolvedValue({ count: 0 }); // Lock conflict

      await expect(service.createMovement(baseInput)).rejects.toThrow("Conflito de concorrência");
    });

    it("should handle RETURN as entry type", async () => {
      const inventory = createMockInventory();
      tx.inventory.findFirst.mockResolvedValue(inventory);
      tx.inventoryMovement.create.mockResolvedValue({ id: "mov-1", inventory });
      tx.inventory.updateMany.mockResolvedValue({ count: 1 });

      await service.createMovement({ ...baseInput, movementType: "RETURN" });

      expect(tx.inventoryMovement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            balanceAfter: 150, // 100 + 50 (entry)
          }),
        }),
      );
    });

    it("should handle PRODUCTION as entry type", async () => {
      const inventory = createMockInventory();
      tx.inventory.findFirst.mockResolvedValue(inventory);
      tx.inventoryMovement.create.mockResolvedValue({ id: "mov-1", inventory });
      tx.inventory.updateMany.mockResolvedValue({ count: 1 });

      await service.createMovement({ ...baseInput, movementType: "PRODUCTION" });

      expect(tx.inventoryMovement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            balanceAfter: 150,
          }),
        }),
      );
    });

    it("should handle EXIT movement correctly (decrement)", async () => {
      const inventory = createMockInventory();
      tx.inventory.findFirst.mockResolvedValue(inventory);
      tx.inventoryMovement.create.mockResolvedValue({ id: "mov-1", inventory });
      tx.inventory.updateMany.mockResolvedValue({ count: 1 });

      await service.createMovement({ ...baseInput, movementType: "EXIT", quantity: 30 });

      expect(tx.inventoryMovement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            balanceAfter: 70, // 100 - 30
          }),
        }),
      );
    });

    it("should not recalculate average cost for entries with zero unitCost", async () => {
      const inventory = createMockInventory();
      tx.inventory.findFirst.mockResolvedValue(inventory);
      tx.inventoryMovement.create.mockResolvedValue({ id: "mov-1", inventory });
      tx.inventory.updateMany.mockResolvedValue({ count: 1 });

      await service.createMovement({ ...baseInput, unitCost: 0 });

      const updateCall = tx.inventory.updateMany.mock.calls[0][0];
      expect(updateCall.data).not.toHaveProperty("unitCost");
    });

    it("should pass optional fields (documentType, notes, etc)", async () => {
      const inventory = createMockInventory();
      tx.inventory.findFirst.mockResolvedValue(inventory);
      tx.inventoryMovement.create.mockResolvedValue({ id: "mov-1", inventory });
      tx.inventory.updateMany.mockResolvedValue({ count: 1 });

      await service.createMovement({
        ...baseInput,
        documentType: "NF",
        documentNumber: "12345",
        notes: "Entrada por NF",
        userId: "user-1",
      });

      expect(tx.inventoryMovement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            documentType: "NF",
            documentNumber: "12345",
            notes: "Entrada por NF",
            userId: "user-1",
          }),
        }),
      );
    });
  });

  // ========================================================================
  // checkLowStock
  // ========================================================================

  describe("checkLowStock", () => {
    it("should return empty alerts when all stock is above minimum", async () => {
      (prisma.inventory.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        createMockInventory({ quantity: 100 }), // minQuantity=50, above
      ]);

      const result = await service.checkLowStock("company-1");

      expect(result.totalAlerts).toBe(0);
      expect(result.alerts).toHaveLength(0);
    });

    it("should classify critical severity for zero stock", async () => {
      (prisma.inventory.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        createMockInventory({ quantity: 0 }),
      ]);

      const result = await service.checkLowStock("company-1");

      expect(result.totalAlerts).toBe(1);
      expect(result.critical).toBe(1);
      expect(result.alerts[0].severity).toBe("critical");
    });

    it("should classify high severity for stock below 50% of minimum", async () => {
      (prisma.inventory.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        createMockInventory({ quantity: 20 }), // minQuantity=50, 20 < 25 (50%)
      ]);

      const result = await service.checkLowStock("company-1");

      expect(result.alerts[0].severity).toBe("high");
    });

    it("should classify medium severity for stock below minimum but above 50%", async () => {
      (prisma.inventory.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        createMockInventory({ quantity: 40 }), // minQuantity=50, 40 > 25 (50%)
      ]);

      const result = await service.checkLowStock("company-1");

      expect(result.alerts[0].severity).toBe("medium");
    });

    it("should sort by severity then by deficit", async () => {
      (prisma.inventory.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        createMockInventory({ id: "inv-medium", quantity: 40, material: { ...createMockInventory().material, id: "m1", minQuantity: 50 } }),
        createMockInventory({ id: "inv-critical", quantity: 0, material: { ...createMockInventory().material, id: "m2", minQuantity: 100 } }),
        createMockInventory({ id: "inv-high", quantity: 10, material: { ...createMockInventory().material, id: "m3", minQuantity: 50 } }),
      ]);

      const result = await service.checkLowStock("company-1");

      expect(result.alerts[0].severity).toBe("critical");
      expect(result.alerts[1].severity).toBe("high");
      expect(result.alerts[2].severity).toBe("medium");
    });

    it("should skip materials without minQuantity", async () => {
      (prisma.inventory.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        createMockInventory({ quantity: 5, material: { ...createMockInventory().material, minQuantity: null } }),
      ]);

      const result = await service.checkLowStock("company-1");

      expect(result.totalAlerts).toBe(0);
    });

    it("should calculate deficit and percentOfMin correctly", async () => {
      (prisma.inventory.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        createMockInventory({ quantity: 30 }), // minQuantity=50
      ]);

      const result = await service.checkLowStock("company-1");

      expect(result.alerts[0].deficit).toBe(20); // 50 - 30
      expect(result.alerts[0].percentOfMin).toBe(60); // 30/50 * 100
    });
  });

  // ========================================================================
  // createReservation
  // ========================================================================

  describe("createReservation", () => {
    const baseInput: CreateReservationInput = {
      materialId: "mat-1",
      quantity: 10,
      documentType: "PRODUCTION_ORDER",
      documentId: "po-1",
      companyId: "company-1",
      userId: "user-1",
    };

    it("should create reservation and update available qty", async () => {
      const inventory = createMockInventory();
      (prisma.inventory.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(inventory);
      (prisma.stockReservation.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      const reservation = createMockReservation();
      tx.stockReservation.create.mockResolvedValue(reservation);
      tx.inventory.update.mockResolvedValue({});

      const result = await service.createReservation(baseInput);

      expect(result).toEqual(reservation);
      expect(tx.inventory.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            reservedQty: 30, // 20 + 10
            availableQty: 70, // 80 - 10
          }),
        }),
      );
    });

    it("should reject when material not found in stock", async () => {
      (prisma.inventory.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await expect(service.createReservation(baseInput)).rejects.toThrow("Material não encontrado");
    });

    it("should reject when available qty is insufficient", async () => {
      const inventory = createMockInventory({ availableQty: 5 });
      (prisma.inventory.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(inventory);

      await expect(service.createReservation(baseInput)).rejects.toThrow("Quantidade disponível insuficiente");
    });

    it("should auto-increment reservation code", async () => {
      const inventory = createMockInventory();
      (prisma.inventory.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(inventory);
      (prisma.stockReservation.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ code: 42 });
      tx.stockReservation.create.mockResolvedValue(createMockReservation({ code: 43 }));
      tx.inventory.update.mockResolvedValue({});

      await service.createReservation(baseInput);

      expect(tx.stockReservation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ code: 43 }),
        }),
      );
    });
  });

  // ========================================================================
  // releaseReservation
  // ========================================================================

  describe("releaseReservation", () => {
    it("should release reservation and restore available qty", async () => {
      const reservation = createMockReservation();
      tx.stockReservation.findFirst.mockResolvedValue(reservation);
      tx.stockReservation.update.mockResolvedValue({ ...reservation, status: "RELEASED" });
      tx.inventory.update.mockResolvedValue({});

      const result = await service.releaseReservation({
        reservationId: "res-1",
        companyId: "company-1",
        userId: "user-1",
        reason: "Cancelamento da OP",
      });

      expect(result.status).toBe("RELEASED");
      expect(tx.inventory.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            reservedQty: 10, // 20 - 10
            availableQty: 90, // 80 + 10
          }),
        }),
      );
    });

    it("should reject when reservation not found", async () => {
      tx.stockReservation.findFirst.mockResolvedValue(null);

      await expect(
        service.releaseReservation({ reservationId: "res-999", companyId: "company-1" }),
      ).rejects.toThrow("Reserva não encontrada");
    });
  });

  // ========================================================================
  // consumeReservation
  // ========================================================================

  describe("consumeReservation", () => {
    it("should fully consume reservation when no quantity specified", async () => {
      const reservation = createMockReservation();
      tx.stockReservation.findFirst.mockResolvedValue(reservation);
      tx.inventoryMovement.create.mockResolvedValue({});
      tx.inventory.update.mockResolvedValue({});
      tx.stockReservation.update.mockResolvedValue({ ...reservation, status: "CONSUMED", quantity: 0 });

      const result = await service.consumeReservation({
        reservationId: "res-1",
        companyId: "company-1",
        userId: "user-1",
      });

      expect(result.status).toBe("CONSUMED");

      // Should create EXIT movement
      expect(tx.inventoryMovement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            movementType: "EXIT",
            quantity: 10, // full reservation qty
          }),
        }),
      );
    });

    it("should partially consume reservation", async () => {
      const reservation = createMockReservation({ quantity: 20 });
      tx.stockReservation.findFirst.mockResolvedValue(reservation);
      tx.inventoryMovement.create.mockResolvedValue({});
      tx.inventory.update.mockResolvedValue({});
      tx.stockReservation.update.mockResolvedValue({ ...reservation, status: "ACTIVE", quantity: 15 });

      await service.consumeReservation({
        reservationId: "res-1",
        quantity: 5,
        companyId: "company-1",
      });

      expect(tx.stockReservation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            quantity: 15, // 20 - 5
            status: "ACTIVE", // still active
          }),
        }),
      );
    });

    it("should reject when quantity exceeds reservation", async () => {
      const reservation = createMockReservation({ quantity: 10 });
      tx.stockReservation.findFirst.mockResolvedValue(reservation);

      await expect(
        service.consumeReservation({ reservationId: "res-1", quantity: 20, companyId: "company-1" }),
      ).rejects.toThrow("Quantidade a consumir maior que a reservada");
    });

    it("should reject when reservation not found", async () => {
      tx.stockReservation.findFirst.mockResolvedValue(null);

      await expect(
        service.consumeReservation({ reservationId: "res-999", companyId: "company-1" }),
      ).rejects.toThrow("Reserva não encontrada");
    });

    it("should set consumedAt when fully consumed", async () => {
      const reservation = createMockReservation({ quantity: 10 });
      tx.stockReservation.findFirst.mockResolvedValue(reservation);
      tx.inventoryMovement.create.mockResolvedValue({});
      tx.inventory.update.mockResolvedValue({});
      tx.stockReservation.update.mockResolvedValue({});

      await service.consumeReservation({
        reservationId: "res-1",
        companyId: "company-1",
      });

      expect(tx.stockReservation.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "CONSUMED",
            consumedAt: expect.any(Date),
          }),
        }),
      );
    });
  });

  // ========================================================================
  // getOrCreateInventory
  // ========================================================================

  describe("getOrCreateInventory", () => {
    it("should return existing inventory", async () => {
      const inventory = createMockInventory();
      const mockTx = createMockTx();
      mockTx.inventory.findFirst.mockResolvedValue(inventory);

      const result = await service.getOrCreateInventory(mockTx as never, "mat-1", "company-1", "FINISHED");

      expect(result).toEqual(inventory);
      expect(mockTx.inventory.create).not.toHaveBeenCalled();
    });

    it("should create inventory when not found", async () => {
      const mockTx = createMockTx();
      mockTx.inventory.findFirst.mockResolvedValue(null);
      const newInventory = createMockInventory({ quantity: 0 });
      mockTx.inventory.create.mockResolvedValue(newInventory);

      const result = await service.getOrCreateInventory(mockTx as never, "mat-1", "company-1", "FINISHED");

      expect(result).toEqual(newInventory);
      expect(mockTx.inventory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            materialId: "mat-1",
            companyId: "company-1",
            inventoryType: "FINISHED",
            quantity: 0,
          }),
        }),
      );
    });
  });

  // ========================================================================
  // recordProductionEntry
  // ========================================================================

  describe("recordProductionEntry", () => {
    it("should create entry movement and increment inventory", async () => {
      const mockTx = createMockTx();
      mockTx.inventoryMovement.create.mockResolvedValue({});
      mockTx.inventory.update.mockResolvedValue({});

      await service.recordProductionEntry(mockTx as never, {
        inventoryId: "inv-1",
        currentQuantity: 100,
        quantity: 50,
        unitCost: 15,
        documentNumber: "1001",
        documentId: "op-1",
        productDescription: "Produto Acabado A",
        userId: "user-1",
      });

      expect(mockTx.inventoryMovement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            movementType: "ENTRY",
            quantity: 50,
            unitCost: 15,
            totalCost: 750, // 15 * 50
            balanceAfter: 150, // 100 + 50
            documentType: "OP",
          }),
        }),
      );

      expect(mockTx.inventory.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            quantity: { increment: 50 },
          }),
        }),
      );
    });
  });

  // ========================================================================
  // recordProductionConsumption
  // ========================================================================

  describe("recordProductionConsumption", () => {
    it("should create exit movement and decrement inventory", async () => {
      const mockTx = createMockTx();
      mockTx.inventoryMovement.create.mockResolvedValue({});
      mockTx.inventory.update.mockResolvedValue({});

      await service.recordProductionConsumption(mockTx as never, {
        inventoryId: "inv-1",
        currentQuantity: 100,
        quantity: 30,
        unitCost: 10,
        totalCost: 300,
        documentNumber: "1001",
        documentId: "op-1",
        materialDescription: "Aço Inox 304",
        userId: "user-1",
      });

      expect(mockTx.inventoryMovement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            movementType: "EXIT",
            quantity: 30,
            balanceAfter: 70, // 100 - 30
            documentType: "OP",
          }),
        }),
      );

      expect(mockTx.inventory.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            quantity: { decrement: 30 },
            totalCost: { decrement: 300 },
          }),
        }),
      );
    });
  });
});
