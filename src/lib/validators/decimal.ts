import { z } from "zod";

/**
 * Validadores Zod para campos monetários e de quantidade
 * Evita problemas de precisão de ponto flutuante do JavaScript
 * 
 * @see VIO-832 - Enforce Decimal type para campos monetários e de estoque
 */

// Regex para valores monetários (até 2 casas decimais)
const MONETARY_REGEX = /^-?\d+(\.\d{1,2})?$/;

// Regex para quantidades (até 4 casas decimais)
const QUANTITY_REGEX = /^-?\d+(\.\d{1,4})?$/;

// Regex para taxas/percentuais (até 4 casas decimais)
const RATE_REGEX = /^-?\d+(\.\d{1,4})?$/;

// Regex para preços unitários (até 6 casas decimais - para commodities)
const UNIT_PRICE_REGEX = /^-?\d+(\.\d{1,6})?$/;

/**
 * Validador para valores monetários (preços, totais, custos)
 * Aceita string ou number, retorna string para preservar precisão
 */
export const monetarySchema = z
  .union([z.string(), z.number()])
  .transform((val) => {
    if (typeof val === "number") {
      return val.toFixed(2);
    }
    return val;
  })
  .refine((val) => MONETARY_REGEX.test(val), {
    message: "Valor monetário inválido. Use até 2 casas decimais.",
  });

/**
 * Validador para quantidades de estoque
 * Aceita string ou number, retorna string para preservar precisão
 */
export const quantitySchema = z
  .union([z.string(), z.number()])
  .transform((val) => {
    if (typeof val === "number") {
      return val.toString();
    }
    return val;
  })
  .refine((val) => QUANTITY_REGEX.test(val), {
    message: "Quantidade inválida. Use até 4 casas decimais.",
  });

/**
 * Validador para taxas e percentuais (IPI, ICMS, etc.)
 */
export const rateSchema = z
  .union([z.string(), z.number()])
  .transform((val) => {
    if (typeof val === "number") {
      return val.toString();
    }
    return val;
  })
  .refine((val) => RATE_REGEX.test(val), {
    message: "Taxa/percentual inválido. Use até 4 casas decimais.",
  });

/**
 * Validador para preços unitários (commodities, câmbio)
 */
export const unitPriceSchema = z
  .union([z.string(), z.number()])
  .transform((val) => {
    if (typeof val === "number") {
      return val.toString();
    }
    return val;
  })
  .refine((val) => UNIT_PRICE_REGEX.test(val), {
    message: "Preço unitário inválido. Use até 6 casas decimais.",
  });

/**
 * Validador para valores monetários opcionais
 */
export const optionalMonetarySchema = z
  .union([z.string(), z.number(), z.null(), z.undefined()])
  .transform((val) => {
    if (val === null || val === undefined || val === "") {
      return null;
    }
    if (typeof val === "number") {
      return val.toFixed(2);
    }
    return val;
  })
  .refine((val) => val === null || MONETARY_REGEX.test(val), {
    message: "Valor monetário inválido. Use até 2 casas decimais.",
  });

/**
 * Validador para quantidades opcionais
 */
export const optionalQuantitySchema = z
  .union([z.string(), z.number(), z.null(), z.undefined()])
  .transform((val) => {
    if (val === null || val === undefined || val === "") {
      return null;
    }
    if (typeof val === "number") {
      return val.toString();
    }
    return val;
  })
  .refine((val) => val === null || QUANTITY_REGEX.test(val), {
    message: "Quantidade inválida. Use até 4 casas decimais.",
  });

/**
 * Helper para converter Decimal do Prisma para number no frontend
 * Use apenas para exibição, não para cálculos
 */
export function decimalToNumber(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") return parseFloat(value);
  // Prisma Decimal tem método toNumber()
  if (typeof value === "object" && "toNumber" in (value as object)) {
    return (value as { toNumber: () => number }).toNumber();
  }
  return 0;
}

/**
 * Helper para formatar valor monetário para exibição
 */
export function formatDecimal(value: unknown, decimals: number = 2): string {
  const num = decimalToNumber(value);
  return num.toFixed(decimals);
}

/**
 * Campos que precisam migrar de Float para Decimal
 * Documentação para VIO-832
 */
export const FIELDS_TO_MIGRATE = {
  // Campos monetários críticos (preços, custos, totais)
  monetary: [
    "materials.lastPurchasePrice",
    "materials.lastPurchasePriceAvg",
    "inventory.unitCost",
    "inventory.totalCost",
    "inventoryMovement.unitCost",
    "inventoryMovement.totalCost",
    "purchaseOrderItem.unitPrice",
    "purchaseOrderItem.totalPrice",
    "purchaseOrder.freightValue",
    "purchaseOrder.totalValue",
    "quoteItem.unitPrice",
    "quoteItem.totalPrice",
    "quote.freightValue",
    "quote.totalValue",
    "supplierMaterial.lastPrice",
  ],
  // Campos de quantidade
  quantity: [
    "materials.minQuantity",
    "materials.maxQuantity",
    "materials.calculatedMinQuantity",
    "materials.reservedQuantity",
    "materials.monthlyAverage",
    "materials.lastPurchaseQuantity",
    "inventory.quantity",
    "inventory.reservedQty",
    "inventory.availableQty",
    "inventoryMovement.quantity",
    "inventoryMovement.balanceAfter",
    "inventoryReservation.quantity",
    "inventoryReservation.consumedQty",
    "purchaseOrderItem.quantity",
    "quoteItem.quantity",
    "supplierMaterial.minOrderQty",
  ],
  // Campos de taxa/percentual
  rates: [
    "materials.ipiRate",
    "materials.icmsRate",
    "purchaseOrder.discountPercent",
    "quote.discountPercent",
    "supplierMaterial.qualityIndex",
    "supplierMaterial.overallQualityPercent",
    "supplierMaterial.iqfPercent",
  ],
} as const;
