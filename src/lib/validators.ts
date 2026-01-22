import { z } from "zod";

// ============================================
// CPF Validation
// ============================================

function validateCPFDigits(cpf: string): boolean {
  const digits = cpf.replace(/\D/g, "");
  if (digits.length !== 11) return false;
  
  // Check for known invalid patterns
  if (/^(\d)\1{10}$/.test(digits)) return false;
  
  // Calculate first check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits[i]) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(digits[9])) return false;
  
  // Calculate second check digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits[i]) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(digits[10])) return false;
  
  return true;
}

export const cpfSchema = z
  .string()
  .transform((val) => val.replace(/\D/g, ""))
  .refine((val) => val.length === 11, {
    message: "CPF deve ter 11 dígitos",
  })
  .refine(validateCPFDigits, {
    message: "CPF inválido",
  });

export const cpfOptionalSchema = z
  .string()
  .optional()
  .nullable()
  .transform((val) => (val ? val.replace(/\D/g, "") : null))
  .refine((val) => !val || (val.length === 11 && validateCPFDigits(val)), {
    message: "CPF inválido",
  });

// ============================================
// CNPJ Validation
// ============================================

function validateCNPJDigits(cnpj: string): boolean {
  const digits = cnpj.replace(/\D/g, "");
  if (digits.length !== 14) return false;
  
  // Check for known invalid patterns
  if (/^(\d)\1{13}$/.test(digits)) return false;
  
  // Calculate first check digit
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(digits[i]) * weights1[i];
  }
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;
  if (digit1 !== parseInt(digits[12])) return false;
  
  // Calculate second check digit
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(digits[i]) * weights2[i];
  }
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;
  if (digit2 !== parseInt(digits[13])) return false;
  
  return true;
}

export const cnpjSchema = z
  .string()
  .transform((val) => val.replace(/\D/g, ""))
  .refine((val) => val.length === 14, {
    message: "CNPJ deve ter 14 dígitos",
  })
  .refine(validateCNPJDigits, {
    message: "CNPJ inválido",
  });

export const cnpjOptionalSchema = z
  .string()
  .optional()
  .nullable()
  .transform((val) => (val ? val.replace(/\D/g, "") : null))
  .refine((val) => !val || (val.length === 14 && validateCNPJDigits(val)), {
    message: "CNPJ inválido",
  });

// CPF ou CNPJ
export const cpfCnpjSchema = z
  .string()
  .transform((val) => val.replace(/\D/g, ""))
  .refine((val) => val.length === 11 || val.length === 14, {
    message: "Documento deve ter 11 (CPF) ou 14 (CNPJ) dígitos",
  })
  .refine(
    (val) =>
      val.length === 11 ? validateCPFDigits(val) : validateCNPJDigits(val),
    {
      message: "CPF/CNPJ inválido",
    }
  );

// ============================================
// Phone Validation
// ============================================

export const phoneSchema = z
  .string()
  .transform((val) => val.replace(/\D/g, ""))
  .refine((val) => val.length >= 10 && val.length <= 11, {
    message: "Telefone deve ter 10 ou 11 dígitos (com DDD)",
  });

export const phoneOptionalSchema = z
  .string()
  .optional()
  .nullable()
  .transform((val) => (val ? val.replace(/\D/g, "") : null))
  .refine((val) => !val || (val.length >= 10 && val.length <= 11), {
    message: "Telefone deve ter 10 ou 11 dígitos (com DDD)",
  });

// ============================================
// CEP Validation
// ============================================

export const cepSchema = z
  .string()
  .transform((val) => val.replace(/\D/g, ""))
  .refine((val) => val.length === 8, {
    message: "CEP deve ter 8 dígitos",
  });

export const cepOptionalSchema = z
  .string()
  .optional()
  .nullable()
  .transform((val) => (val ? val.replace(/\D/g, "") : null))
  .refine((val) => !val || val.length === 8, {
    message: "CEP deve ter 8 dígitos",
  });

// ============================================
// Email Validation
// ============================================

export const emailSchema = z
  .string()
  .email({ message: "Email inválido" })
  .transform((val) => val.toLowerCase().trim());

export const emailOptionalSchema = z
  .string()
  .optional()
  .nullable()
  .transform((val) => (val ? val.toLowerCase().trim() : null))
  .refine((val) => !val || z.string().email().safeParse(val).success, {
    message: "Email inválido",
  });

// ============================================
// Date Validation
// ============================================

export const dateSchema = z.coerce.date({ message: "Data inválida" });

export const dateOptionalSchema = z.coerce.date().optional().nullable();

export const futureDateSchema = z.coerce.date().refine(
  (date) => date > new Date(),
  { message: "Data deve ser no futuro" }
);

export const pastDateSchema = z.coerce.date().refine(
  (date) => date < new Date(),
  { message: "Data deve ser no passado" }
);

export const dateRangeSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
}).refine(
  (data) => data.endDate >= data.startDate,
  { message: "Data final deve ser maior ou igual à data inicial" }
);

// ============================================
// Money/Currency Validation
// ============================================

export const moneySchema = z
  .number()
  .nonnegative({ message: "Valor não pode ser negativo" })
  .multipleOf(0.01, { message: "Valor deve ter no máximo 2 casas decimais" });

export const moneyPositiveSchema = z
  .number()
  .positive({ message: "Valor deve ser maior que zero" })
  .multipleOf(0.01, { message: "Valor deve ter no máximo 2 casas decimais" });

export const moneyOptionalSchema = z
  .number()
  .nonnegative({ message: "Valor não pode ser negativo" })
  .multipleOf(0.01, { message: "Valor deve ter no máximo 2 casas decimais" })
  .optional()
  .nullable();

// ============================================
// Quantity Validation
// ============================================

export const quantitySchema = z
  .number()
  .positive({ message: "Quantidade deve ser maior que zero" });

export const quantityOptionalSchema = z
  .number()
  .nonnegative({ message: "Quantidade não pode ser negativa" })
  .optional()
  .nullable();

// ============================================
// Percentage Validation
// ============================================

export const percentageSchema = z
  .number()
  .min(0, { message: "Percentual não pode ser negativo" })
  .max(100, { message: "Percentual não pode ser maior que 100%" });

export const percentageOptionalSchema = z
  .number()
  .min(0, { message: "Percentual não pode ser negativo" })
  .max(100, { message: "Percentual não pode ser maior que 100%" })
  .optional()
  .nullable();

// ============================================
// Brazilian State (UF) Validation
// ============================================

export const UF_LIST = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO",
  "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI",
  "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;

export const ufSchema = z.enum(UF_LIST, { message: "UF inválida" });

export const ufOptionalSchema = z.enum(UF_LIST).optional().nullable();

// ============================================
// Inscrição Estadual (IE) Validation
// ============================================

export const ieSchema = z
  .string()
  .transform((val) => val.replace(/\D/g, ""))
  .refine((val) => val.length >= 8 && val.length <= 14, {
    message: "Inscrição Estadual deve ter entre 8 e 14 dígitos",
  });

export const ieOptionalSchema = z
  .string()
  .optional()
  .nullable()
  .transform((val) => (val ? val.replace(/\D/g, "") : null))
  .refine((val) => !val || (val.length >= 8 && val.length <= 14), {
    message: "Inscrição Estadual deve ter entre 8 e 14 dígitos",
  });

// ============================================
// NF-e Access Key Validation
// ============================================

export const nfeAccessKeySchema = z
  .string()
  .transform((val) => val.replace(/\D/g, ""))
  .refine((val) => val.length === 44, {
    message: "Chave de acesso deve ter 44 dígitos",
  });

// ============================================
// Bank Account Validation
// ============================================

export const bankCodeSchema = z
  .string()
  .regex(/^\d{3}$/, { message: "Código do banco deve ter 3 dígitos" });

export const agencySchema = z
  .string()
  .regex(/^\d{4,5}(-\d)?$/, { message: "Agência inválida" });

export const accountNumberSchema = z
  .string()
  .regex(/^\d{5,12}(-\d)?$/, { message: "Número da conta inválido" });

// ============================================
// Password Validation
// ============================================

export const passwordSchema = z
  .string()
  .min(8, { message: "Senha deve ter no mínimo 8 caracteres" })
  .regex(/[A-Z]/, { message: "Senha deve conter pelo menos uma letra maiúscula" })
  .regex(/[a-z]/, { message: "Senha deve conter pelo menos uma letra minúscula" })
  .regex(/[0-9]/, { message: "Senha deve conter pelo menos um número" });

export const passwordOptionalSchema = z
  .string()
  .min(8, { message: "Senha deve ter no mínimo 8 caracteres" })
  .regex(/[A-Z]/, { message: "Senha deve conter pelo menos uma letra maiúscula" })
  .regex(/[a-z]/, { message: "Senha deve conter pelo menos uma letra minúscula" })
  .regex(/[0-9]/, { message: "Senha deve conter pelo menos um número" })
  .optional()
  .nullable();

// ============================================
// ID Validation (CUID)
// ============================================

export const idSchema = z.string().cuid({ message: "ID inválido" });

export const idOptionalSchema = z.string().cuid().optional().nullable();

// ============================================
// Pagination Validation
// ============================================

export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export const cursorPaginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(20),
});

// ============================================
// Search/Filter Validation
// ============================================

export const searchSchema = z
  .string()
  .max(100, { message: "Busca muito longa" })
  .optional();

export const sortOrderSchema = z.enum(["asc", "desc"]).default("desc");

// ============================================
// Common Entity Schemas
// ============================================

export const addressSchema = z.object({
  street: z.string().min(1, { message: "Logradouro obrigatório" }),
  number: z.string().min(1, { message: "Número obrigatório" }),
  complement: z.string().optional().nullable(),
  neighborhood: z.string().min(1, { message: "Bairro obrigatório" }),
  city: z.string().min(1, { message: "Cidade obrigatória" }),
  state: ufSchema,
  zipCode: cepSchema,
});

export const addressOptionalSchema = z.object({
  street: z.string().optional().nullable(),
  number: z.string().optional().nullable(),
  complement: z.string().optional().nullable(),
  neighborhood: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: ufOptionalSchema,
  zipCode: cepOptionalSchema,
}).optional().nullable();

export const contactSchema = z.object({
  name: z.string().min(1, { message: "Nome obrigatório" }),
  email: emailOptionalSchema,
  phone: phoneOptionalSchema,
  mobile: phoneOptionalSchema,
});

// ============================================
// Utility Functions
// ============================================

export function formatCPF(cpf: string): string {
  const digits = cpf.replace(/\D/g, "");
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

export function formatCNPJ(cnpj: string): string {
  const digits = cnpj.replace(/\D/g, "");
  return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
}

export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 11) {
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }
  return digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
}

export function formatCEP(cep: string): string {
  const digits = cep.replace(/\D/g, "");
  return digits.replace(/(\d{5})(\d{3})/, "$1-$2");
}

export function isValidCPF(cpf: string): boolean {
  return cpfSchema.safeParse(cpf).success;
}

export function isValidCNPJ(cnpj: string): boolean {
  return cnpjSchema.safeParse(cnpj).success;
}

export function isValidCPFOrCNPJ(doc: string): boolean {
  return cpfCnpjSchema.safeParse(doc).success;
}
