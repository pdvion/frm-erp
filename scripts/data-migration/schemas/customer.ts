import { z } from "zod";

/**
 * Schema de validação para Cliente
 * Usado na migração de dados de sistemas legados
 */
export const customerSchema = z.object({
  // Identificação
  code: z.string().min(1, "Código é obrigatório").max(50).optional(),
  
  // Pessoa Jurídica
  cnpj: z.string().regex(/^\d{14}$/, "CNPJ deve ter 14 dígitos").optional(),
  razaoSocial: z.string().min(1, "Razão Social é obrigatória").max(255),
  nomeFantasia: z.string().max(255).optional(),
  inscricaoEstadual: z.string().max(20).optional(),
  inscricaoMunicipal: z.string().max(20).optional(),
  
  // Pessoa Física
  cpf: z.string().regex(/^\d{11}$/, "CPF deve ter 11 dígitos").optional(),
  rg: z.string().max(20).optional(),
  
  // Contato
  email: z.string().email("Email inválido").optional(),
  telefone: z.string().max(20).optional(),
  celular: z.string().max(20).optional(),
  website: z.string().url().optional(),
  
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
  limiteCredito: z.number().min(0).optional(),
  prazoMedio: z.number().int().min(0).optional(),
  condicaoPagamento: z.string().optional(),
  tabelaPreco: z.string().optional(),
  vendedor: z.string().optional(),
  
  // Fiscal
  contribuinte: z.enum(["SIM", "NAO", "ISENTO"]).optional(),
  regimeTributario: z.enum(["SIMPLES", "LUCRO_PRESUMIDO", "LUCRO_REAL"]).optional(),
  
  // Status
  status: z.enum(["ACTIVE", "INACTIVE", "BLOCKED"]).default("ACTIVE"),
  
  // Metadados
  observacoes: z.string().optional(),
}).refine(
  (data) => data.cnpj || data.cpf,
  { message: "CNPJ ou CPF é obrigatório" }
);

export type CustomerInput = z.infer<typeof customerSchema>;

/**
 * Schema para validação em lote
 */
export const customerBatchSchema = z.array(customerSchema);

/**
 * Valida um cliente
 */
export function validateCustomer(data: unknown): { success: boolean; data?: CustomerInput; errors?: string[] } {
  const result = customerSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    errors: result.error.issues.map((e) => `${String(e.path.join("."))}: ${e.message}`),
  };
}

/**
 * Valida um lote de clientes
 */
export function validateCustomerBatch(data: unknown[]): {
  valid: CustomerInput[];
  invalid: Array<{ index: number; data: unknown; errors: string[] }>;
} {
  const valid: CustomerInput[] = [];
  const invalid: Array<{ index: number; data: unknown; errors: string[] }> = [];

  data.forEach((item, index) => {
    const result = validateCustomer(item);
    if (result.success && result.data) {
      valid.push(result.data);
    } else {
      invalid.push({ index, data: item, errors: result.errors || [] });
    }
  });

  return { valid, invalid };
}
