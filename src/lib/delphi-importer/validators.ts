/**
 * Delphi Importer - Validators
 * Validação estrita de dados legados com Zod
 * VIO-820, VIO-821
 */

import { z } from "zod";

/**
 * Schema para documento (CNPJ ou CPF)
 */
const documentSchema = z
  .string()
  .transform((val) => val.replace(/\D/g, ""))
  .refine((val) => val.length === 11 || val.length === 14, {
    message: "Documento deve ser CPF (11 dígitos) ou CNPJ (14 dígitos)",
  });

/**
 * Schema para data no formato brasileiro ou ISO
 */
const dateSchema = z
  .string()
  .transform((val) => {
    if (!val) return null;
    const isoDate = new Date(val);
    if (!isNaN(isoDate.getTime())) return isoDate;
    const brMatch = val.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (brMatch) {
      return new Date(
        parseInt(brMatch[3]),
        parseInt(brMatch[2]) - 1,
        parseInt(brMatch[1])
      );
    }
    return null;
  })
  .refine((val) => val !== null, {
    message: "Data inválida. Use formato DD/MM/YYYY ou ISO",
  });

/**
 * Schema para data opcional
 */
const optionalDateSchema = z
  .string()
  .optional()
  .nullable()
  .transform((val) => {
    if (!val) return null;
    const isoDate = new Date(val);
    if (!isNaN(isoDate.getTime())) return isoDate;
    const brMatch = val.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (brMatch) {
      return new Date(
        parseInt(brMatch[3]),
        parseInt(brMatch[2]) - 1,
        parseInt(brMatch[1])
      );
    }
    return null;
  });

/**
 * Schema para valor monetário (aceita vírgula como decimal)
 */
const monetarySchema = z
  .string()
  .transform((val) => {
    if (!val) return 0;
    return parseFloat(val.replace(/\./g, "").replace(",", ".")) || 0;
  })
  .refine((val) => val >= 0, {
    message: "Valor monetário não pode ser negativo",
  });

/**
 * Schema para quantidade (aceita vírgula como decimal)
 */
const quantitySchema = z
  .string()
  .transform((val) => {
    if (!val) return 0;
    return parseFloat(val.replace(",", ".")) || 0;
  })
  .refine((val) => val >= 0, {
    message: "Quantidade não pode ser negativa",
  });

/**
 * Schema para cliente do Delphi
 */
export const delphiClienteSchema = z.object({
  codCliente: z.string().min(1, "Código do cliente é obrigatório"),
  cliente: z.string().min(1, "Nome do cliente é obrigatório"),
  bairro: z.string().optional().nullable(),
  logradouro: z.string().optional().nullable(),
  complemento: z.string().optional().nullable(),
  numero: z.string().optional().nullable(),
  zipcode: z.string().optional().nullable().transform((val) => val?.replace(/\D/g, "") || null),
  codCNPJ: documentSchema.optional().nullable(),
  cidade: z.string().optional().nullable(),
  stateUf: z.string().optional().nullable(),
  ativo: z.string().optional().nullable(),
  dataInicio: optionalDateSchema,
  codTipoCliente: z.string().optional().nullable(),
});

export type ValidatedDelphiCliente = z.infer<typeof delphiClienteSchema>;

/**
 * Schema para NFe emitida do Delphi
 */
export const delphiNFeEmitidaSchema = z.object({
  codEmissaoNF: z.string().min(1, "Código da emissão é obrigatório"),
  tipoEmissao: z.string().optional().nullable(),
  numNF: z.string().min(1, "Número da NF é obrigatório"),
  codEmpresa: z.string().optional().nullable(),
  chaveNFe: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || val.replace(/\D/g, "").length === 44, {
      message: "Chave NFe deve ter 44 dígitos",
    }),
  dtEmissao: dateSchema,
  codCliente: z.string().optional().nullable(),
  CNPJDestino: z.string().optional().nullable(),
  vlrTotalProd: monetarySchema,
  vlrNfe: monetarySchema,
  numStatusGeral: z.string().optional().nullable(),
});

export type ValidatedDelphiNFeEmitida = z.infer<typeof delphiNFeEmitidaSchema>;

/**
 * Schema para item de NFe do Delphi
 */
export const delphiNFeItemSchema = z.object({
  codEmissaoNF: z.string().min(1, "Código da emissão é obrigatório"),
  numItem: z.string().min(1, "Número do item é obrigatório"),
  codProduto: z.string().min(1, "Código do produto é obrigatório"),
  descricao: z.string().min(1, "Descrição é obrigatória"),
  ncm: z
    .string()
    .optional()
    .nullable()
    .refine((val) => !val || val.replace(/\D/g, "").length === 8, {
      message: "NCM deve ter 8 dígitos",
    }),
  cfop: z
    .string()
    .transform((val) => parseInt(val.replace(/\D/g, ""), 10))
    .refine((val) => val >= 1000 && val <= 7999, {
      message: "CFOP deve estar entre 1000 e 7999",
    }),
  unidade: z.string().min(1, "Unidade é obrigatória"),
  quantidade: quantitySchema,
  valorUnitario: monetarySchema,
  valorTotal: monetarySchema,
  valorDesconto: monetarySchema.optional(),
  cstIcms: z.string().optional().nullable(),
  aliquotaIcms: monetarySchema.optional(),
  valorIcms: monetarySchema.optional(),
});

export type ValidatedDelphiNFeItem = z.infer<typeof delphiNFeItemSchema>;

/**
 * Schema para movimento de estoque do Delphi
 */
export const delphiMovimentoEstoqueSchema = z.object({
  codMovimento: z.string().min(1, "Código do movimento é obrigatório"),
  codProduto: z.string().min(1, "Código do produto é obrigatório"),
  tipoMovimento: z.enum(["E", "S", "ENTRADA", "SAIDA"]),
  quantidade: quantitySchema,
  valorUnitario: monetarySchema.optional(),
  dataMovimento: dateSchema,
  documentoRef: z.string().optional().nullable(),
  observacao: z.string().optional().nullable(),
});

export type ValidatedDelphiMovimentoEstoque = z.infer<typeof delphiMovimentoEstoqueSchema>;

/**
 * Resultado da validação de um registro
 */
export interface ValidationResult<T> {
  valid: boolean;
  data?: T;
  errors?: z.ZodIssue[];
  rawData: unknown;
  index: number;
}

/**
 * Relatório de validação de lote
 */
export interface BatchValidationReport<T> {
  entity: string;
  total: number;
  valid: number;
  invalid: number;
  validRecords: T[];
  invalidRecords: Array<{
    index: number;
    rawData: unknown;
    errors: z.ZodIssue[];
  }>;
  summary: {
    errorsByField: Record<string, number>;
    mostCommonErrors: Array<{ message: string; count: number }>;
  };
}

/**
 * Valida um lote de registros contra um schema Zod
 */
export function validateBatch<T>(
  data: unknown[],
  schema: z.ZodSchema<T>,
  entityName: string
): BatchValidationReport<T> {
  const validRecords: T[] = [];
  const invalidRecords: Array<{
    index: number;
    rawData: unknown;
    errors: z.ZodIssue[];
  }> = [];
  const errorsByField: Record<string, number> = {};
  const errorMessages: Record<string, number> = {};

  for (let i = 0; i < data.length; i++) {
    const result = schema.safeParse(data[i]);

    if (result.success) {
      validRecords.push(result.data);
    } else {
      invalidRecords.push({
        index: i,
        rawData: data[i],
        errors: result.error.issues,
      });

      for (const error of result.error.issues) {
        const fieldPath = error.path.join(".");
        errorsByField[fieldPath] = (errorsByField[fieldPath] || 0) + 1;
        errorMessages[error.message] = (errorMessages[error.message] || 0) + 1;
      }
    }
  }

  const mostCommonErrors = Object.entries(errorMessages)
    .map(([message, count]) => ({ message, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    entity: entityName,
    total: data.length,
    valid: validRecords.length,
    invalid: invalidRecords.length,
    validRecords,
    invalidRecords,
    summary: {
      errorsByField,
      mostCommonErrors,
    },
  };
}

/**
 * Valida clientes do Delphi
 */
export function validateDelphiClientes(
  data: unknown[]
): BatchValidationReport<ValidatedDelphiCliente> {
  return validateBatch(data, delphiClienteSchema, "clientes");
}

/**
 * Valida NFes emitidas do Delphi
 */
export function validateDelphiNFes(
  data: unknown[]
): BatchValidationReport<ValidatedDelphiNFeEmitida> {
  return validateBatch(data, delphiNFeEmitidaSchema, "nfes");
}

/**
 * Valida itens de NFe do Delphi
 */
export function validateDelphiNFeItems(
  data: unknown[]
): BatchValidationReport<ValidatedDelphiNFeItem> {
  return validateBatch(data, delphiNFeItemSchema, "nfe_items");
}

/**
 * Valida movimentos de estoque do Delphi
 */
export function validateDelphiMovimentosEstoque(
  data: unknown[]
): BatchValidationReport<ValidatedDelphiMovimentoEstoque> {
  return validateBatch(data, delphiMovimentoEstoqueSchema, "movimentos_estoque");
}

/**
 * Gera relatório de validação em formato texto
 */
export function generateValidationReport<T>(
  report: BatchValidationReport<T>
): string {
  const lines: string[] = [];

  lines.push(`=== Relatório de Validação: ${report.entity.toUpperCase()} ===`);
  lines.push("");
  lines.push(`Total de registros: ${report.total}`);
  lines.push(`Válidos: ${report.valid} (${((report.valid / report.total) * 100).toFixed(1)}%)`);
  lines.push(`Inválidos: ${report.invalid} (${((report.invalid / report.total) * 100).toFixed(1)}%)`);
  lines.push("");

  if (report.invalid > 0) {
    lines.push("--- Erros por Campo ---");
    for (const [field, count] of Object.entries(report.summary.errorsByField)) {
      lines.push(`  ${field}: ${count} erros`);
    }
    lines.push("");

    lines.push("--- Erros Mais Comuns ---");
    for (const { message, count } of report.summary.mostCommonErrors) {
      lines.push(`  ${message}: ${count} ocorrências`);
    }
    lines.push("");

    if (report.invalidRecords.length <= 10) {
      lines.push("--- Registros Inválidos ---");
      for (const record of report.invalidRecords) {
        lines.push(`  Linha ${record.index + 1}:`);
        for (const error of record.errors) {
          lines.push(`    - ${error.path.join(".")}: ${error.message}`);
        }
      }
    } else {
      lines.push(`--- Primeiros 10 Registros Inválidos (de ${report.invalidRecords.length}) ---`);
      for (const record of report.invalidRecords.slice(0, 10)) {
        lines.push(`  Linha ${record.index + 1}:`);
        for (const error of record.errors) {
          lines.push(`    - ${error.path.join(".")}: ${error.message}`);
        }
      }
    }
  }

  return lines.join("\n");
}
