import { describe, it, expect } from "vitest";
import { z } from "zod";

/**
 * Testes de schema para o router budget (Orçamento)
 * Valida inputs e estruturas de dados de contas orçamentárias e versões
 */

// Schema de tipo de conta orçamentária
const accountTypeSchema = z.enum(["REVENUE", "EXPENSE", "INVESTMENT"]);

// Schema de tipo de versão
const versionTypeSchema = z.enum(["ORIGINAL", "REVISED", "FORECAST"]);

// Schema de status de versão
const versionStatusSchema = z.enum(["DRAFT", "APPROVED", "LOCKED"]);

// Schema de listagem de contas
const listAccountsInputSchema = z.object({
  type: accountTypeSchema.optional(),
  parentId: z.string().uuid().nullable().optional(),
  isActive: z.boolean().optional(),
}).optional();

// Schema de criação de conta
const createAccountSchema = z.object({
  code: z.string().min(1).max(20),
  name: z.string().min(1),
  description: z.string().optional(),
  type: accountTypeSchema,
  parentId: z.string().uuid().optional(),
});

// Schema de atualização de conta
const updateAccountSchema = z.object({
  id: z.string().uuid(),
  code: z.string().min(1).max(20).optional(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

// Schema de listagem de versões
const listVersionsInputSchema = z.object({
  year: z.number().optional(),
  type: versionTypeSchema.optional(),
  status: versionStatusSchema.optional(),
}).optional();

// Schema de criação de versão
const createVersionSchema = z.object({
  name: z.string().min(1),
  year: z.number().min(2020).max(2100),
  type: versionTypeSchema,
  description: z.string().optional(),
  baseVersionId: z.string().uuid().optional(),
});

// Schema de lançamento orçamentário
const createEntrySchema = z.object({
  versionId: z.string().uuid(),
  accountId: z.string().uuid(),
  month: z.number().min(1).max(12),
  plannedValue: z.number(),
  notes: z.string().optional(),
});

// Schema de atualização de lançamento
const updateEntrySchema = z.object({
  id: z.string().uuid(),
  plannedValue: z.number().optional(),
  actualValue: z.number().optional(),
  notes: z.string().optional(),
});

// Schema de resposta de conta
const accountResponseSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  type: accountTypeSchema,
  level: z.number(),
  parentId: z.string().nullable(),
  isActive: z.boolean(),
  companyId: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Schema de resposta de versão
const versionResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  year: z.number(),
  type: versionTypeSchema,
  status: versionStatusSchema,
  description: z.string().nullable(),
  companyId: z.string().nullable(),
  createdBy: z.string().nullable(),
  approvedBy: z.string().nullable(),
  approvedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

describe("Budget Router Schemas", () => {
  describe("Account Type Schema", () => {
    it("should accept REVENUE type", () => {
      const result = accountTypeSchema.safeParse("REVENUE");
      expect(result.success).toBe(true);
    });

    it("should accept EXPENSE type", () => {
      const result = accountTypeSchema.safeParse("EXPENSE");
      expect(result.success).toBe(true);
    });

    it("should accept INVESTMENT type", () => {
      const result = accountTypeSchema.safeParse("INVESTMENT");
      expect(result.success).toBe(true);
    });

    it("should reject invalid type", () => {
      const result = accountTypeSchema.safeParse("INVALID");
      expect(result.success).toBe(false);
    });

    it("should reject lowercase type", () => {
      const result = accountTypeSchema.safeParse("revenue");
      expect(result.success).toBe(false);
    });
  });

  describe("Version Type Schema", () => {
    it("should accept ORIGINAL type", () => {
      const result = versionTypeSchema.safeParse("ORIGINAL");
      expect(result.success).toBe(true);
    });

    it("should accept REVISED type", () => {
      const result = versionTypeSchema.safeParse("REVISED");
      expect(result.success).toBe(true);
    });

    it("should accept FORECAST type", () => {
      const result = versionTypeSchema.safeParse("FORECAST");
      expect(result.success).toBe(true);
    });

    it("should reject invalid type", () => {
      const result = versionTypeSchema.safeParse("BUDGET");
      expect(result.success).toBe(false);
    });
  });

  describe("Version Status Schema", () => {
    it("should accept DRAFT status", () => {
      const result = versionStatusSchema.safeParse("DRAFT");
      expect(result.success).toBe(true);
    });

    it("should accept APPROVED status", () => {
      const result = versionStatusSchema.safeParse("APPROVED");
      expect(result.success).toBe(true);
    });

    it("should accept LOCKED status", () => {
      const result = versionStatusSchema.safeParse("LOCKED");
      expect(result.success).toBe(true);
    });

    it("should reject invalid status", () => {
      const result = versionStatusSchema.safeParse("PENDING");
      expect(result.success).toBe(false);
    });
  });

  describe("List Accounts Input Schema", () => {
    it("should accept empty input", () => {
      const result = listAccountsInputSchema.safeParse(undefined);
      expect(result.success).toBe(true);
    });

    it("should accept type filter", () => {
      const input = { type: "EXPENSE" as const };
      const result = listAccountsInputSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should accept parentId filter", () => {
      const input = { parentId: "550e8400-e29b-41d4-a716-446655440000" };
      const result = listAccountsInputSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should accept null parentId for root accounts", () => {
      const input = { parentId: null };
      const result = listAccountsInputSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should accept isActive filter", () => {
      const input = { isActive: true };
      const result = listAccountsInputSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should accept combined filters", () => {
      const input = {
        type: "REVENUE" as const,
        parentId: null,
        isActive: true,
      };
      const result = listAccountsInputSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });

  describe("Create Account Schema", () => {
    it("should accept minimal account", () => {
      const input = {
        code: "1.1",
        name: "Receitas Operacionais",
        type: "REVENUE" as const,
      };
      const result = createAccountSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should accept complete account", () => {
      const input = {
        code: "1.1.1",
        name: "Vendas de Produtos",
        description: "Receitas com vendas de produtos acabados",
        type: "REVENUE" as const,
        parentId: "550e8400-e29b-41d4-a716-446655440000",
      };
      const result = createAccountSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should reject empty code", () => {
      const input = {
        code: "",
        name: "Conta",
        type: "EXPENSE" as const,
      };
      const result = createAccountSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should reject code longer than 20 characters", () => {
      const input = {
        code: "1.2.3.4.5.6.7.8.9.10.11",
        name: "Conta",
        type: "EXPENSE" as const,
      };
      const result = createAccountSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should reject empty name", () => {
      const input = {
        code: "1.1",
        name: "",
        type: "EXPENSE" as const,
      };
      const result = createAccountSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing type", () => {
      const input = {
        code: "1.1",
        name: "Conta",
      };
      const result = createAccountSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should reject invalid parentId", () => {
      const input = {
        code: "1.1",
        name: "Conta",
        type: "EXPENSE" as const,
        parentId: "not-a-uuid",
      };
      const result = createAccountSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe("Update Account Schema", () => {
    it("should accept update with only id", () => {
      const input = { id: "550e8400-e29b-41d4-a716-446655440000" };
      const result = updateAccountSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should accept partial update", () => {
      const input = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        name: "Novo Nome",
        isActive: false,
      };
      const result = updateAccountSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should accept complete update", () => {
      const input = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        code: "1.2",
        name: "Nome Atualizado",
        description: "Nova descrição",
        isActive: true,
      };
      const result = updateAccountSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should reject invalid UUID", () => {
      const input = { id: "invalid" };
      const result = updateAccountSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing id", () => {
      const input = { name: "Nome" };
      const result = updateAccountSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe("List Versions Input Schema", () => {
    it("should accept empty input", () => {
      const result = listVersionsInputSchema.safeParse(undefined);
      expect(result.success).toBe(true);
    });

    it("should accept year filter", () => {
      const input = { year: 2026 };
      const result = listVersionsInputSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should accept type filter", () => {
      const input = { type: "ORIGINAL" as const };
      const result = listVersionsInputSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should accept status filter", () => {
      const input = { status: "APPROVED" as const };
      const result = listVersionsInputSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should accept combined filters", () => {
      const input = {
        year: 2026,
        type: "REVISED" as const,
        status: "DRAFT" as const,
      };
      const result = listVersionsInputSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });

  describe("Create Version Schema", () => {
    it("should accept minimal version", () => {
      const input = {
        name: "Orçamento 2026",
        year: 2026,
        type: "ORIGINAL" as const,
      };
      const result = createVersionSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should accept complete version", () => {
      const input = {
        name: "Revisão Q2 2026",
        year: 2026,
        type: "REVISED" as const,
        description: "Revisão após resultados do Q1",
        baseVersionId: "550e8400-e29b-41d4-a716-446655440000",
      };
      const result = createVersionSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should reject year before 2020", () => {
      const input = {
        name: "Orçamento Antigo",
        year: 2019,
        type: "ORIGINAL" as const,
      };
      const result = createVersionSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should reject year after 2100", () => {
      const input = {
        name: "Orçamento Futuro",
        year: 2101,
        type: "FORECAST" as const,
      };
      const result = createVersionSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should reject empty name", () => {
      const input = {
        name: "",
        year: 2026,
        type: "ORIGINAL" as const,
      };
      const result = createVersionSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe("Create Entry Schema", () => {
    it("should accept valid entry", () => {
      const input = {
        versionId: "550e8400-e29b-41d4-a716-446655440000",
        accountId: "660e8400-e29b-41d4-a716-446655440001",
        month: 1,
        plannedValue: 50000,
      };
      const result = createEntrySchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should accept entry with notes", () => {
      const input = {
        versionId: "550e8400-e29b-41d4-a716-446655440000",
        accountId: "660e8400-e29b-41d4-a716-446655440001",
        month: 6,
        plannedValue: 75000,
        notes: "Inclui projeção de vendas sazonais",
      };
      const result = createEntrySchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should accept negative values for expenses", () => {
      const input = {
        versionId: "550e8400-e29b-41d4-a716-446655440000",
        accountId: "660e8400-e29b-41d4-a716-446655440001",
        month: 3,
        plannedValue: -25000,
      };
      const result = createEntrySchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should reject month less than 1", () => {
      const input = {
        versionId: "550e8400-e29b-41d4-a716-446655440000",
        accountId: "660e8400-e29b-41d4-a716-446655440001",
        month: 0,
        plannedValue: 50000,
      };
      const result = createEntrySchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should reject month greater than 12", () => {
      const input = {
        versionId: "550e8400-e29b-41d4-a716-446655440000",
        accountId: "660e8400-e29b-41d4-a716-446655440001",
        month: 13,
        plannedValue: 50000,
      };
      const result = createEntrySchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should reject invalid versionId", () => {
      const input = {
        versionId: "invalid",
        accountId: "660e8400-e29b-41d4-a716-446655440001",
        month: 1,
        plannedValue: 50000,
      };
      const result = createEntrySchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe("Update Entry Schema", () => {
    it("should accept update with only id", () => {
      const input = { id: "550e8400-e29b-41d4-a716-446655440000" };
      const result = updateEntrySchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should accept plannedValue update", () => {
      const input = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        plannedValue: 60000,
      };
      const result = updateEntrySchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should accept actualValue update", () => {
      const input = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        actualValue: 55000,
      };
      const result = updateEntrySchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should accept complete update", () => {
      const input = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        plannedValue: 60000,
        actualValue: 58000,
        notes: "Realizado abaixo do previsto",
      };
      const result = updateEntrySchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });

  describe("Account Response Schema", () => {
    it("should validate complete account response", () => {
      const account = {
        id: "uuid-123",
        code: "1.1.1",
        name: "Vendas",
        description: "Receitas de vendas",
        type: "REVENUE" as const,
        level: 3,
        parentId: "uuid-parent",
        isActive: true,
        companyId: "company-123",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const result = accountResponseSchema.safeParse(account);
      expect(result.success).toBe(true);
    });

    it("should validate account with null optional fields", () => {
      const account = {
        id: "uuid-123",
        code: "1",
        name: "Receitas",
        description: null,
        type: "REVENUE" as const,
        level: 1,
        parentId: null,
        isActive: true,
        companyId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const result = accountResponseSchema.safeParse(account);
      expect(result.success).toBe(true);
    });
  });

  describe("Version Response Schema", () => {
    it("should validate complete version response", () => {
      const version = {
        id: "uuid-123",
        name: "Orçamento 2026",
        year: 2026,
        type: "ORIGINAL" as const,
        status: "APPROVED" as const,
        description: "Orçamento anual aprovado",
        companyId: "company-123",
        createdBy: "user-123",
        approvedBy: "user-456",
        approvedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const result = versionResponseSchema.safeParse(version);
      expect(result.success).toBe(true);
    });

    it("should validate draft version with null approval fields", () => {
      const version = {
        id: "uuid-123",
        name: "Orçamento 2026 Draft",
        year: 2026,
        type: "ORIGINAL" as const,
        status: "DRAFT" as const,
        description: null,
        companyId: "company-123",
        createdBy: "user-123",
        approvedBy: null,
        approvedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const result = versionResponseSchema.safeParse(version);
      expect(result.success).toBe(true);
    });
  });

  describe("Budget Account Hierarchy", () => {
    it("should validate root account (level 1)", () => {
      const account = {
        id: "uuid-1",
        code: "1",
        name: "Receitas",
        description: null,
        type: "REVENUE" as const,
        level: 1,
        parentId: null,
        isActive: true,
        companyId: "company-123",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const result = accountResponseSchema.safeParse(account);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.level).toBe(1);
        expect(result.data.parentId).toBeNull();
      }
    });

    it("should validate child account (level 2)", () => {
      const account = {
        id: "uuid-2",
        code: "1.1",
        name: "Receitas Operacionais",
        description: null,
        type: "REVENUE" as const,
        level: 2,
        parentId: "uuid-1",
        isActive: true,
        companyId: "company-123",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const result = accountResponseSchema.safeParse(account);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.level).toBe(2);
        expect(result.data.parentId).toBe("uuid-1");
      }
    });
  });

  describe("Budget Values", () => {
    it("should accept zero values", () => {
      const input = {
        versionId: "550e8400-e29b-41d4-a716-446655440000",
        accountId: "660e8400-e29b-41d4-a716-446655440001",
        month: 1,
        plannedValue: 0,
      };
      const result = createEntrySchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should accept decimal values", () => {
      const input = {
        versionId: "550e8400-e29b-41d4-a716-446655440000",
        accountId: "660e8400-e29b-41d4-a716-446655440001",
        month: 1,
        plannedValue: 12345.67,
      };
      const result = createEntrySchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should accept large values", () => {
      const input = {
        versionId: "550e8400-e29b-41d4-a716-446655440000",
        accountId: "660e8400-e29b-41d4-a716-446655440001",
        month: 1,
        plannedValue: 999999999.99,
      };
      const result = createEntrySchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });
});
