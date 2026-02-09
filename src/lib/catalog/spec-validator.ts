/**
 * Product Specifications Validator (VIO-1034)
 * Phase 1: Informative mode — returns warnings, does not block saves.
 */

import { type AttributeDataType } from "@prisma/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaLike = any;

export interface CategoryAttributeInfo {
  key: string;
  name: string;
  dataType: AttributeDataType;
  unit: string | null;
  enumOptions: string[];
  isRequired: boolean;
}

export interface SpecValidationResult {
  valid: boolean;
  warnings: string[];
}

/**
 * Validates product specifications against category attribute definitions.
 * Phase 1: informative — returns warnings but valid is always true.
 */
export function validateProductSpecs(
  specs: Record<string, unknown> | null | undefined,
  attributes: CategoryAttributeInfo[]
): SpecValidationResult {
  const warnings: string[] = [];

  if (!specs || typeof specs !== "object") {
    const requiredAttrs = attributes.filter((a) => a.isRequired);
    if (requiredAttrs.length > 0) {
      warnings.push(
        `Especificações ausentes. Campos obrigatórios: ${requiredAttrs.map((a) => a.name).join(", ")}`
      );
    }
    return { valid: true, warnings };
  }

  // Check required attributes
  for (const attr of attributes) {
    const value = specs[attr.key];

    if (attr.isRequired && (value === undefined || value === null || value === "")) {
      warnings.push(`Campo obrigatório ausente: ${attr.name} (${attr.key})`);
      continue;
    }

    if (value === undefined || value === null || value === "") continue;

    // Type validation
    switch (attr.dataType) {
      case "FLOAT":
      case "INTEGER": {
        const num = Number(value);
        if (isNaN(num)) {
          warnings.push(`${attr.name}: esperado número, recebido "${String(value)}"`);
        } else if (attr.dataType === "INTEGER" && !Number.isInteger(num)) {
          warnings.push(`${attr.name}: esperado inteiro, recebido ${num}`);
        }
        break;
      }
      case "BOOLEAN": {
        if (typeof value !== "boolean" && value !== "true" && value !== "false") {
          warnings.push(`${attr.name}: esperado booleano, recebido "${String(value)}"`);
        }
        break;
      }
      case "ENUM": {
        if (attr.enumOptions.length > 0 && !attr.enumOptions.includes(String(value))) {
          warnings.push(
            `${attr.name}: valor "${String(value)}" não está entre as opções válidas: ${attr.enumOptions.join(", ")}`
          );
        }
        break;
      }
      case "STRING":
        // No validation needed for strings
        break;
    }
  }

  // Check for extra keys not in attribute definitions
  const knownKeys = new Set(attributes.map((a) => a.key));
  for (const key of Object.keys(specs)) {
    if (!knownKeys.has(key)) {
      warnings.push(`Campo extra não definido no template: ${key}`);
    }
  }

  return { valid: true, warnings };
}

/**
 * Collects all category attributes for a category, including inherited ones
 * from parent categories up the hierarchy.
 */
export async function collectCategoryAttributes(
  prisma: PrismaLike,
  categoryId: string,
  companyId: string | null
): Promise<CategoryAttributeInfo[]> {
  const result: CategoryAttributeInfo[] = [];
  const seenKeys = new Set<string>();

  let currentCategoryId: string | null = categoryId;

  while (currentCategoryId) {
    const attrs = await prisma.categoryAttribute.findMany({
      where: {
        categoryId: currentCategoryId,
        OR: [
          { isShared: true },
          ...(companyId ? [{ companyId }] : []),
        ],
      },
      include: {
        attribute: true,
      },
      orderBy: { displayOrder: "asc" },
    });

    for (const ca of attrs) {
      if (!seenKeys.has(ca.attribute.key)) {
        seenKeys.add(ca.attribute.key);
        result.push({
          key: ca.attribute.key,
          name: ca.attribute.name,
          dataType: ca.attribute.dataType,
          unit: ca.attribute.unit,
          enumOptions: ca.attribute.enumOptions,
          isRequired: ca.isRequired,
        });
      }
    }

    // Walk up the hierarchy
    const cat: { parentId: string | null } | null = await prisma.productCategory.findUnique({
      where: { id: currentCategoryId },
      select: { parentId: true },
    });

    currentCategoryId = cat?.parentId ?? null;
  }

  return result;
}
