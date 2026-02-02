import { z } from "zod";

/**
 * Schema de validação para Fornecedor
 * Usado na migração de dados de sistemas legados
 */
export const supplierSchema = z.object({
  // Identificação
  code: z.string().min(1, "Código é obrigatório").max(50).optional(),
  
  // Pessoa Jurídica
  cnpj: z.string().regex(/^\d{14}$/, "CNPJ deve ter 14 dígitos"),
  razaoSocial: z.string().min(1, "Razão Social é obrigatória").max(255),
  nomeFantasia: z.string().max(255).optional(),
  inscricaoEstadual: z.string().max(20).optional(),
  
  // Contato
  email: z.string().email("Email inválido").optional(),
  telefone: z.string().max(20).optional(),
  celular: z.string().max(20).optional(),
  contato: z.string().max(100).optional(),
  
  // Endereço
  endereco: z.object({
    logradouro: z.string().max(255).optional(),
    numero: z.string().max(20).optional(),
    complemento: z.string().max(100).optional(),
    bairro: z.string().max(100).optional(),
    cidade: z.string().max(100).optional(),
    uf: z.string().length(2).optional(),
    cep: z.string().regex(/^\d{8}$/, "CEP deve ter 8 dígitos").optional(),
    codigoMunicipio: z.string().max(10).optional(),
  }).optional(),
  
  // Comercial
  prazoMedio: z.number().int().min(0).optional(),
  condicaoPagamento: z.string().optional(),
  
  // Bancário
  banco: z.string().optional(),
  agencia: z.string().optional(),
  conta: z.string().optional(),
  pix: z.string().optional(),
  
  // Categorização
  categoria: z.string().optional(),
  tipoFornecedor: z.enum(["NACIONAL", "IMPORTADO", "SERVICO"]).optional(),
  
  // Status
  status: z.enum(["ACTIVE", "INACTIVE", "BLOCKED"]).default("ACTIVE"),
  
  // Metadados
  observacoes: z.string().optional(),
});

export type SupplierInput = z.infer<typeof supplierSchema>;

/**
 * Schema para validação em lote
 */
export const supplierBatchSchema = z.array(supplierSchema);

/**
 * Valida um fornecedor
 */
export function validateSupplier(data: unknown): { success: boolean; data?: SupplierInput; errors?: string[] } {
  const result = supplierSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    errors: result.error.issues.map((e) => `${String(e.path.join("."))}: ${e.message}`),
  };
}

/**
 * Valida um lote de fornecedores
 */
export function validateSupplierBatch(data: unknown[]): {
  valid: SupplierInput[];
  invalid: Array<{ index: number; data: unknown; errors: string[] }>;
} {
  const valid: SupplierInput[] = [];
  const invalid: Array<{ index: number; data: unknown; errors: string[] }> = [];

  data.forEach((item, index) => {
    const result = validateSupplier(item);
    if (result.success && result.data) {
      valid.push(result.data);
    } else {
      invalid.push({ index, data: item, errors: result.errors || [] });
    }
  });

  return { valid, invalid };
}
