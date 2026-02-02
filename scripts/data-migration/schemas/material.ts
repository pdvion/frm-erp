import { z } from "zod";

/**
 * Schema de validação para Material
 * Usado na migração de dados de sistemas legados
 */
export const materialSchema = z.object({
  // Identificação
  code: z.string().min(1, "Código é obrigatório").max(50),
  description: z.string().min(1, "Descrição é obrigatória").max(255),
  
  // Classificação
  category: z.string().optional(),
  subcategory: z.string().optional(),
  type: z.enum(["MATERIA_PRIMA", "PRODUTO_ACABADO", "INSUMO", "EMBALAGEM", "OUTROS"]).optional(),
  
  // Unidade e conversão
  unit: z.string().min(1, "Unidade é obrigatória").max(10),
  unitConversion: z.number().positive().optional(),
  
  // Fiscal
  ncm: z.string().regex(/^\d{8}$/, "NCM deve ter 8 dígitos").optional(),
  cest: z.string().regex(/^\d{7}$/, "CEST deve ter 7 dígitos").optional(),
  origem: z.enum(["0", "1", "2", "3", "4", "5", "6", "7", "8"]).optional(),
  
  // Estoque
  minStock: z.number().min(0).optional(),
  maxStock: z.number().min(0).optional(),
  reorderPoint: z.number().min(0).optional(),
  leadTime: z.number().int().min(0).optional(),
  
  // Custos
  lastPurchasePrice: z.number().min(0).optional(),
  averageCost: z.number().min(0).optional(),
  standardCost: z.number().min(0).optional(),
  
  // Dimensões
  weight: z.number().min(0).optional(),
  height: z.number().min(0).optional(),
  width: z.number().min(0).optional(),
  length: z.number().min(0).optional(),
  
  // Status
  status: z.enum(["ACTIVE", "INACTIVE", "BLOCKED"]).default("ACTIVE"),
  
  // Metadados
  barcode: z.string().optional(),
  supplierCode: z.string().optional(),
  notes: z.string().optional(),
});

export type MaterialInput = z.infer<typeof materialSchema>;

/**
 * Schema para validação em lote
 */
export const materialBatchSchema = z.array(materialSchema);

/**
 * Valida um material
 */
export function validateMaterial(data: unknown): { success: boolean; data?: MaterialInput; errors?: string[] } {
  const result = materialSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    errors: result.error.issues.map((e) => `${String(e.path.join("."))}: ${e.message}`),
  };
}

/**
 * Valida um lote de materiais
 */
export function validateMaterialBatch(data: unknown[]): {
  valid: MaterialInput[];
  invalid: Array<{ index: number; data: unknown; errors: string[] }>;
} {
  const valid: MaterialInput[] = [];
  const invalid: Array<{ index: number; data: unknown; errors: string[] }> = [];

  data.forEach((item, index) => {
    const result = validateMaterial(item);
    if (result.success && result.data) {
      valid.push(result.data);
    } else {
      invalid.push({ index, data: item, errors: result.errors || [] });
    }
  });

  return { valid, invalid };
}
