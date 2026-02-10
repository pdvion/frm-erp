/**
 * Material → Product Reconciliation (VIO-1035)
 * Identifies commercializable materials and creates draft Products.
 */

import { type PrismaClient, type ProductStatus, type Prisma } from "@prisma/client";

export interface ReconciliationOptions {
  companyId: string | null;
  dryRun?: boolean;
  limit?: number;
}

export interface ReconciliationReport {
  totalAnalyzed: number;
  productsCreated: number;
  alreadyLinked: number;
  skippedEpi: number;
  skippedOfficeSupply: number;
  skippedInactive: number;
  errors: string[];
  details: Array<{
    materialCode: number;
    materialDescription: string;
    action: "created" | "skipped" | "error";
    reason?: string;
    productCode?: string;
  }>;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Find the best matching ProductCategory for a Material based on its Category.
 * Falls back to null if no match found.
 */
async function findBestProductCategory(
  prisma: PrismaClient,
  material: { categoryId: string | null; description: string }
): Promise<string | null> {
  if (!material.categoryId) return null;

  // Get the material's operational category
  const category = await prisma.category.findUnique({
    where: { id: material.categoryId },
    select: { name: true },
  });

  if (!category) return null;

  // Try to find a matching ProductCategory by name similarity
  const productCategory = await prisma.productCategory.findFirst({
    where: {
      name: { contains: category.name, mode: "insensitive" },
      isActive: true,
    },
    select: { id: true },
  });

  return productCategory?.id ?? null;
}

/**
 * Reconcile Materials to Products.
 * Creates draft Products for commercializable materials without existing links.
 */
export async function reconcileMaterials(
  prisma: PrismaClient,
  options: ReconciliationOptions
): Promise<ReconciliationReport> {
  const report: ReconciliationReport = {
    totalAnalyzed: 0,
    productsCreated: 0,
    alreadyLinked: 0,
    skippedEpi: 0,
    skippedOfficeSupply: 0,
    skippedInactive: 0,
    errors: [],
    details: [],
  };

  const companyFilter = options.companyId
    ? { OR: [{ companyId: options.companyId }, { isShared: true }] }
    : {};

  // Fetch all materials for the company
  const materials = await prisma.material.findMany({
    where: {
      ...companyFilter,
    },
    select: {
      id: true,
      code: true,
      description: true,
      ncm: true,
      unit: true,
      weight: true,
      manufacturer: true,
      manufacturerCode: true,
      barcode: true,
      lastPurchasePrice: true,
      categoryId: true,
      companyId: true,
      status: true,
      isEpi: true,
      isOfficeSupply: true,
      catalogProducts: { select: { id: true }, take: 1 },
    },
    orderBy: { code: "asc" },
    ...(options.limit ? { take: options.limit } : {}),
  });

  report.totalAnalyzed = materials.length;

  for (const material of materials) {
    // Skip inactive
    if (material.status !== "ACTIVE") {
      report.skippedInactive++;
      report.details.push({
        materialCode: material.code,
        materialDescription: material.description,
        action: "skipped",
        reason: `Status: ${material.status}`,
      });
      continue;
    }

    // Skip EPIs
    if (material.isEpi) {
      report.skippedEpi++;
      report.details.push({
        materialCode: material.code,
        materialDescription: material.description,
        action: "skipped",
        reason: "EPI",
      });
      continue;
    }

    // Skip office supplies
    if (material.isOfficeSupply) {
      report.skippedOfficeSupply++;
      report.details.push({
        materialCode: material.code,
        materialDescription: material.description,
        action: "skipped",
        reason: "Material de escritório",
      });
      continue;
    }

    // Skip already linked
    if (material.catalogProducts.length > 0) {
      report.alreadyLinked++;
      report.details.push({
        materialCode: material.code,
        materialDescription: material.description,
        action: "skipped",
        reason: "Já possui produto vinculado",
      });
      continue;
    }

    if (options.dryRun) {
      report.productsCreated++;
      report.details.push({
        materialCode: material.code,
        materialDescription: material.description,
        action: "created",
        productCode: `MAT-${material.code}`,
      });
      continue;
    }

    // Create Product
    try {
      const productCode = `MAT-${material.code}`;
      const baseSlug = generateSlug(material.description);
      const slug = `${baseSlug}-${material.code}`;

      const categoryId = await findBestProductCategory(prisma, material);

      // Build tags from manufacturer info
      const tags: string[] = [];
      if (material.manufacturer) tags.push(`fabricante:${material.manufacturer}`);
      if (material.manufacturerCode) tags.push(`cod-fab:${material.manufacturerCode}`);
      if (material.barcode) tags.push(`ean:${material.barcode}`);

      // Build specifications from material data
      const specifications: Record<string, unknown> = {};
      if (material.ncm) specifications.ncm = material.ncm;
      if (material.unit) specifications.unit = material.unit;
      if (material.weight) specifications.weight = material.weight;
      if (material.manufacturer) specifications.manufacturer = material.manufacturer;
      if (material.manufacturerCode) specifications.manufacturerCode = material.manufacturerCode;
      if (material.barcode) specifications.barcode = material.barcode;

      await prisma.product.create({
        data: {
          code: productCode,
          name: material.description,
          slug,
          shortDescription: material.description,
          specifications: specifications as Prisma.InputJsonValue,
          categoryId,
          materialId: material.id,
          tags,
          status: "DRAFT" as ProductStatus,
          isPublished: false,
          companyId: material.companyId,
        },
      });

      report.productsCreated++;
      report.details.push({
        materialCode: material.code,
        materialDescription: material.description,
        action: "created",
        productCode,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      report.errors.push(`Material ${material.code}: ${msg}`);
      report.details.push({
        materialCode: material.code,
        materialDescription: material.description,
        action: "error",
        reason: msg,
      });
    }
  }

  return report;
}
