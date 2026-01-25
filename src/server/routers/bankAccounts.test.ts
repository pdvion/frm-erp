import { describe, it, expect } from "vitest";
import { z } from "zod";

// Schemas extraídos do router para testes
const listInputSchema = z.object({
  search: z.string().optional(),
  includeInactive: z.boolean().default(false),
  accountType: z.enum(["CHECKING", "SAVINGS", "INVESTMENT", "CASH"]).optional(),
}).optional();

const byIdInputSchema = z.object({ id: z.string() });

const createInputSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  bankCode: z.string().optional(),
  bankName: z.string().optional(),
  agency: z.string().optional(),
  agencyDigit: z.string().optional(),
  accountNumber: z.string().optional(),
  accountDigit: z.string().optional(),
  accountType: z.enum(["CHECKING", "SAVINGS", "INVESTMENT", "CASH"]).default("CHECKING"),
  initialBalance: z.number().default(0),
  creditLimit: z.number().optional(),
  isDefault: z.boolean().default(false),
  notes: z.string().optional(),
});

const updateInputSchema = z.object({
  id: z.string(),
  code: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  bankCode: z.string().optional(),
  bankName: z.string().optional(),
  agency: z.string().optional(),
  agencyDigit: z.string().optional(),
  accountNumber: z.string().optional(),
  accountDigit: z.string().optional(),
  accountType: z.enum(["CHECKING", "SAVINGS", "INVESTMENT", "CASH"]).optional(),
  creditLimit: z.number().optional(),
  isDefault: z.boolean().optional(),
  isActive: z.boolean().optional(),
  notes: z.string().optional(),
});

const deleteInputSchema = z.object({ id: z.string() });

const transactionsListInputSchema = z.object({
  accountId: z.string(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  type: z.enum(["CREDIT", "DEBIT", "TRANSFER"]).optional(),
  page: z.number().default(1),
  limit: z.number().default(50),
});

const createTransactionInputSchema = z.object({
  accountId: z.string(),
  type: z.enum(["CREDIT", "DEBIT", "TRANSFER"]),
  amount: z.number().positive(),
  date: z.date(),
  description: z.string().min(1),
  category: z.string().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

const importOfxInputSchema = z.object({
  accountId: z.string(),
  ofxContent: z.string().min(1),
});

const reconcileInputSchema = z.object({
  transactionId: z.string(),
  payableId: z.string().optional(),
  receivableId: z.string().optional(),
  notes: z.string().optional(),
});

describe("BankAccounts Router Schemas", () => {
  describe("list input", () => {
    it("should accept empty input", () => {
      const result = listInputSchema.safeParse(undefined);
      expect(result.success).toBe(true);
    });

    it("should accept search string", () => {
      const result = listInputSchema.safeParse({ search: "bradesco" });
      expect(result.success).toBe(true);
    });

    it("should default includeInactive to false", () => {
      const result = listInputSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.includeInactive).toBe(false);
      }
    });

    it("should accept includeInactive true", () => {
      const result = listInputSchema.safeParse({ includeInactive: true });
      expect(result.success).toBe(true);
    });

    it("should accept accountType CHECKING", () => {
      const result = listInputSchema.safeParse({ accountType: "CHECKING" });
      expect(result.success).toBe(true);
    });

    it("should accept accountType SAVINGS", () => {
      const result = listInputSchema.safeParse({ accountType: "SAVINGS" });
      expect(result.success).toBe(true);
    });

    it("should accept accountType INVESTMENT", () => {
      const result = listInputSchema.safeParse({ accountType: "INVESTMENT" });
      expect(result.success).toBe(true);
    });

    it("should accept accountType CASH", () => {
      const result = listInputSchema.safeParse({ accountType: "CASH" });
      expect(result.success).toBe(true);
    });

    it("should reject invalid accountType", () => {
      const result = listInputSchema.safeParse({ accountType: "INVALID" });
      expect(result.success).toBe(false);
    });
  });

  describe("byId input", () => {
    it("should accept valid id", () => {
      const result = byIdInputSchema.safeParse({ id: "acc-123" });
      expect(result.success).toBe(true);
    });

    it("should reject missing id", () => {
      const result = byIdInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("create input", () => {
    it("should accept minimal valid input", () => {
      const result = createInputSchema.safeParse({
        code: "001",
        name: "Conta Principal",
      });
      expect(result.success).toBe(true);
    });

    it("should apply defaults", () => {
      const result = createInputSchema.safeParse({
        code: "002",
        name: "Conta Secundária",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.accountType).toBe("CHECKING");
        expect(result.data.initialBalance).toBe(0);
        expect(result.data.isDefault).toBe(false);
      }
    });

    it("should accept full input", () => {
      const result = createInputSchema.safeParse({
        code: "003",
        name: "Conta Bradesco",
        bankCode: "237",
        bankName: "Bradesco",
        agency: "1234",
        agencyDigit: "5",
        accountNumber: "12345",
        accountDigit: "6",
        accountType: "CHECKING",
        initialBalance: 10000,
        creditLimit: 5000,
        isDefault: true,
        notes: "Conta principal da empresa",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing code", () => {
      const result = createInputSchema.safeParse({
        name: "Conta sem código",
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty code", () => {
      const result = createInputSchema.safeParse({
        code: "",
        name: "Conta código vazio",
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing name", () => {
      const result = createInputSchema.safeParse({
        code: "004",
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty name", () => {
      const result = createInputSchema.safeParse({
        code: "005",
        name: "",
      });
      expect(result.success).toBe(false);
    });

    it("should accept all account types", () => {
      const types = ["CHECKING", "SAVINGS", "INVESTMENT", "CASH"];
      for (const type of types) {
        const result = createInputSchema.safeParse({
          code: `ACC-${type}`,
          name: `Conta ${type}`,
          accountType: type,
        });
        expect(result.success).toBe(true);
      }
    });
  });

  describe("update input", () => {
    it("should accept id only", () => {
      const result = updateInputSchema.safeParse({ id: "acc-123" });
      expect(result.success).toBe(true);
    });

    it("should accept partial update", () => {
      const result = updateInputSchema.safeParse({
        id: "acc-123",
        name: "Novo Nome",
        isActive: false,
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing id", () => {
      const result = updateInputSchema.safeParse({
        name: "Sem ID",
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty code on update", () => {
      const result = updateInputSchema.safeParse({
        id: "acc-123",
        code: "",
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty name on update", () => {
      const result = updateInputSchema.safeParse({
        id: "acc-123",
        name: "",
      });
      expect(result.success).toBe(false);
    });

    it("should accept isDefault change", () => {
      const result = updateInputSchema.safeParse({
        id: "acc-123",
        isDefault: true,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("delete input", () => {
    it("should accept valid id", () => {
      const result = deleteInputSchema.safeParse({ id: "acc-123" });
      expect(result.success).toBe(true);
    });

    it("should reject missing id", () => {
      const result = deleteInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("transactions list input", () => {
    it("should accept accountId only", () => {
      const result = transactionsListInputSchema.safeParse({
        accountId: "acc-123",
      });
      expect(result.success).toBe(true);
    });

    it("should apply defaults", () => {
      const result = transactionsListInputSchema.safeParse({
        accountId: "acc-123",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(50);
      }
    });

    it("should accept date range", () => {
      const result = transactionsListInputSchema.safeParse({
        accountId: "acc-123",
        startDate: new Date("2026-01-01"),
        endDate: new Date("2026-01-31"),
      });
      expect(result.success).toBe(true);
    });

    it("should accept type CREDIT", () => {
      const result = transactionsListInputSchema.safeParse({
        accountId: "acc-123",
        type: "CREDIT",
      });
      expect(result.success).toBe(true);
    });

    it("should accept type DEBIT", () => {
      const result = transactionsListInputSchema.safeParse({
        accountId: "acc-123",
        type: "DEBIT",
      });
      expect(result.success).toBe(true);
    });

    it("should accept type TRANSFER", () => {
      const result = transactionsListInputSchema.safeParse({
        accountId: "acc-123",
        type: "TRANSFER",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing accountId", () => {
      const result = transactionsListInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("createTransaction input", () => {
    it("should accept valid transaction", () => {
      const result = createTransactionInputSchema.safeParse({
        accountId: "acc-123",
        type: "CREDIT",
        amount: 1000,
        date: new Date(),
        description: "Depósito",
      });
      expect(result.success).toBe(true);
    });

    it("should accept full input", () => {
      const result = createTransactionInputSchema.safeParse({
        accountId: "acc-123",
        type: "DEBIT",
        amount: 500,
        date: new Date(),
        description: "Pagamento fornecedor",
        category: "Fornecedores",
        reference: "NF-12345",
        notes: "Pagamento parcial",
      });
      expect(result.success).toBe(true);
    });

    it("should reject zero amount", () => {
      const result = createTransactionInputSchema.safeParse({
        accountId: "acc-123",
        type: "CREDIT",
        amount: 0,
        date: new Date(),
        description: "Valor zero",
      });
      expect(result.success).toBe(false);
    });

    it("should reject negative amount", () => {
      const result = createTransactionInputSchema.safeParse({
        accountId: "acc-123",
        type: "CREDIT",
        amount: -100,
        date: new Date(),
        description: "Valor negativo",
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty description", () => {
      const result = createTransactionInputSchema.safeParse({
        accountId: "acc-123",
        type: "CREDIT",
        amount: 100,
        date: new Date(),
        description: "",
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid type", () => {
      const result = createTransactionInputSchema.safeParse({
        accountId: "acc-123",
        type: "INVALID",
        amount: 100,
        date: new Date(),
        description: "Tipo inválido",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("importOfx input", () => {
    it("should accept valid input", () => {
      const result = importOfxInputSchema.safeParse({
        accountId: "acc-123",
        ofxContent: "<OFX>...</OFX>",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing accountId", () => {
      const result = importOfxInputSchema.safeParse({
        ofxContent: "<OFX>...</OFX>",
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing ofxContent", () => {
      const result = importOfxInputSchema.safeParse({
        accountId: "acc-123",
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty ofxContent", () => {
      const result = importOfxInputSchema.safeParse({
        accountId: "acc-123",
        ofxContent: "",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("reconcile input", () => {
    it("should accept with payableId", () => {
      const result = reconcileInputSchema.safeParse({
        transactionId: "txn-123",
        payableId: "pay-456",
      });
      expect(result.success).toBe(true);
    });

    it("should accept with receivableId", () => {
      const result = reconcileInputSchema.safeParse({
        transactionId: "txn-123",
        receivableId: "rec-456",
      });
      expect(result.success).toBe(true);
    });

    it("should accept with notes", () => {
      const result = reconcileInputSchema.safeParse({
        transactionId: "txn-123",
        payableId: "pay-456",
        notes: "Conciliação manual",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing transactionId", () => {
      const result = reconcileInputSchema.safeParse({
        payableId: "pay-456",
      });
      expect(result.success).toBe(false);
    });
  });
});
