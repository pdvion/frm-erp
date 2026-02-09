import { describe, it, expect, vi } from "vitest";
import { reconcileMaterials } from "./reconcile-materials";

function createMockPrisma(materials: Array<Record<string, unknown>> = []) {
  return {
    material: {
      findMany: vi.fn().mockResolvedValue(materials),
    },
    product: {
      create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: "prod-1", ...data })),
    },
    category: {
      findUnique: vi.fn().mockResolvedValue({ name: "Rolamentos" }),
    },
    productCategory: {
      findFirst: vi.fn().mockResolvedValue({ id: "cat-1" }),
    },
  } as unknown as Parameters<typeof reconcileMaterials>[0];
}

const baseMaterial = {
  id: "mat-1",
  code: 1001,
  description: "Rolamento 6205 2RS",
  ncm: "84821010",
  unit: "UN",
  weight: 0.12,
  manufacturer: "SKF",
  manufacturerCode: "6205-2RS1",
  barcode: "7891234567890",
  lastPurchasePrice: 25.5,
  categoryId: "cat-op-1",
  companyId: "company-1",
  status: "ACTIVE",
  isEpi: false,
  isOfficeSupply: false,
  catalogProducts: [],
};

describe("reconcileMaterials", () => {
  it("should create product for active commercializable material", async () => {
    const prisma = createMockPrisma([baseMaterial]);

    const report = await reconcileMaterials(prisma, {
      companyId: "company-1",
      dryRun: false,
    });

    expect(report.totalAnalyzed).toBe(1);
    expect(report.productsCreated).toBe(1);
    expect(report.errors).toHaveLength(0);
    expect(report.details[0].action).toBe("created");
    expect(report.details[0].productCode).toBe("MAT-1001");
  });

  it("should skip EPI materials", async () => {
    const prisma = createMockPrisma([{ ...baseMaterial, isEpi: true }]);

    const report = await reconcileMaterials(prisma, { companyId: "company-1" });

    expect(report.skippedEpi).toBe(1);
    expect(report.productsCreated).toBe(0);
    expect(report.details[0].reason).toBe("EPI");
  });

  it("should skip office supply materials", async () => {
    const prisma = createMockPrisma([{ ...baseMaterial, isOfficeSupply: true }]);

    const report = await reconcileMaterials(prisma, { companyId: "company-1" });

    expect(report.skippedOfficeSupply).toBe(1);
    expect(report.productsCreated).toBe(0);
    expect(report.details[0].reason).toBe("Material de escritório");
  });

  it("should skip inactive materials", async () => {
    const prisma = createMockPrisma([{ ...baseMaterial, status: "INACTIVE" }]);

    const report = await reconcileMaterials(prisma, { companyId: "company-1" });

    expect(report.skippedInactive).toBe(1);
    expect(report.productsCreated).toBe(0);
  });

  it("should skip materials already linked to products", async () => {
    const prisma = createMockPrisma([
      { ...baseMaterial, catalogProducts: [{ id: "existing-prod" }] },
    ]);

    const report = await reconcileMaterials(prisma, { companyId: "company-1" });

    expect(report.alreadyLinked).toBe(1);
    expect(report.productsCreated).toBe(0);
  });

  it("should handle dry run mode", async () => {
    const prisma = createMockPrisma([baseMaterial]);

    const report = await reconcileMaterials(prisma, {
      companyId: "company-1",
      dryRun: true,
    });

    expect(report.productsCreated).toBe(1);
    expect(prisma.product.create).not.toHaveBeenCalled();
  });

  it("should handle errors gracefully", async () => {
    const prisma = createMockPrisma([baseMaterial]);
    (prisma.product.create as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Unique constraint violation")
    );

    const report = await reconcileMaterials(prisma, {
      companyId: "company-1",
      dryRun: false,
    });

    expect(report.errors).toHaveLength(1);
    expect(report.errors[0]).toContain("Unique constraint violation");
    expect(report.details[0].action).toBe("error");
  });

  it("should process multiple materials with mixed statuses", async () => {
    const materials = [
      baseMaterial,
      { ...baseMaterial, id: "mat-2", code: 1002, description: "Luva EPI", isEpi: true },
      { ...baseMaterial, id: "mat-3", code: 1003, description: "Papel A4", isOfficeSupply: true },
      { ...baseMaterial, id: "mat-4", code: 1004, description: "Retentor", status: "INACTIVE" },
      { ...baseMaterial, id: "mat-5", code: 1005, description: "Mancal", catalogProducts: [{ id: "p1" }] },
    ];
    const prisma = createMockPrisma(materials);

    const report = await reconcileMaterials(prisma, {
      companyId: "company-1",
      dryRun: false,
    });

    expect(report.totalAnalyzed).toBe(5);
    expect(report.productsCreated).toBe(1);
    expect(report.skippedEpi).toBe(1);
    expect(report.skippedOfficeSupply).toBe(1);
    expect(report.skippedInactive).toBe(1);
    expect(report.alreadyLinked).toBe(1);
  });

  it("should build tags from manufacturer info", async () => {
    const prisma = createMockPrisma([baseMaterial]);

    await reconcileMaterials(prisma, {
      companyId: "company-1",
      dryRun: false,
    });

    const createCall = (prisma.product.create as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(createCall.data.tags).toContain("fabricante:SKF");
    expect(createCall.data.tags).toContain("cod-fab:6205-2RS1");
    expect(createCall.data.tags).toContain("ean:7891234567890");
  });

  it("should set product status as DRAFT", async () => {
    const prisma = createMockPrisma([baseMaterial]);

    await reconcileMaterials(prisma, {
      companyId: "company-1",
      dryRun: false,
    });

    const createCall = (prisma.product.create as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(createCall.data.status).toBe("DRAFT");
    expect(createCall.data.isPublished).toBe(false);
  });

  it("should copy material specs to product specifications", async () => {
    const prisma = createMockPrisma([baseMaterial]);

    await reconcileMaterials(prisma, {
      companyId: "company-1",
      dryRun: false,
    });

    const createCall = (prisma.product.create as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(createCall.data.specifications).toEqual({
      ncm: "84821010",
      unit: "UN",
      weight: 0.12,
      manufacturer: "SKF",
      manufacturerCode: "6205-2RS1",
      barcode: "7891234567890",
    });
  });

  it("should handle empty materials list", async () => {
    const prisma = createMockPrisma([]);

    const report = await reconcileMaterials(prisma, { companyId: "company-1" });

    expect(report.totalAnalyzed).toBe(0);
    expect(report.productsCreated).toBe(0);
  });
});
