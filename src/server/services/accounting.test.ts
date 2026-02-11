/**
 * Tests for AccountingService
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  AccountingService,
  getDefaultNature,
  calculateAccountLevel,
  validateDoubleEntry,
  calculateAccountBalance,
  deriveParentCode,
} from "./accounting";

// ==========================================================================
// PURE FUNCTION TESTS
// ==========================================================================

describe("getDefaultNature", () => {
  it("should return DEBIT for ASSET", () => {
    expect(getDefaultNature("ASSET")).toBe("DEBIT");
  });

  it("should return DEBIT for EXPENSE", () => {
    expect(getDefaultNature("EXPENSE")).toBe("DEBIT");
  });

  it("should return CREDIT for LIABILITY", () => {
    expect(getDefaultNature("LIABILITY")).toBe("CREDIT");
  });

  it("should return CREDIT for EQUITY", () => {
    expect(getDefaultNature("EQUITY")).toBe("CREDIT");
  });

  it("should return CREDIT for REVENUE", () => {
    expect(getDefaultNature("REVENUE")).toBe("CREDIT");
  });
});

describe("calculateAccountLevel", () => {
  it("should return 1 for top-level code", () => {
    expect(calculateAccountLevel("1")).toBe(1);
  });

  it("should return 2 for second-level code", () => {
    expect(calculateAccountLevel("1.1")).toBe(2);
  });

  it("should return 3 for third-level code", () => {
    expect(calculateAccountLevel("1.1.01")).toBe(3);
  });

  it("should return 4 for fourth-level code", () => {
    expect(calculateAccountLevel("1.1.01.001")).toBe(4);
  });
});

describe("validateDoubleEntry", () => {
  it("should validate balanced entry", () => {
    const result = validateDoubleEntry([
      { accountId: "a1", type: "DEBIT", amount: 1000 },
      { accountId: "a2", type: "CREDIT", amount: 1000 },
    ]);
    expect(result.valid).toBe(true);
    expect(result.totalDebit).toBe(1000);
    expect(result.totalCredit).toBe(1000);
    expect(result.difference).toBe(0);
  });

  it("should detect unbalanced entry", () => {
    const result = validateDoubleEntry([
      { accountId: "a1", type: "DEBIT", amount: 1000 },
      { accountId: "a2", type: "CREDIT", amount: 900 },
    ]);
    expect(result.valid).toBe(false);
    expect(result.difference).toBe(100);
  });

  it("should handle multiple debits and credits", () => {
    const result = validateDoubleEntry([
      { accountId: "a1", type: "DEBIT", amount: 500 },
      { accountId: "a2", type: "DEBIT", amount: 500 },
      { accountId: "a3", type: "CREDIT", amount: 700 },
      { accountId: "a4", type: "CREDIT", amount: 300 },
    ]);
    expect(result.valid).toBe(true);
    expect(result.totalDebit).toBe(1000);
    expect(result.totalCredit).toBe(1000);
  });

  it("should handle floating point precision", () => {
    const result = validateDoubleEntry([
      { accountId: "a1", type: "DEBIT", amount: 33.33 },
      { accountId: "a2", type: "DEBIT", amount: 33.33 },
      { accountId: "a3", type: "DEBIT", amount: 33.34 },
      { accountId: "a4", type: "CREDIT", amount: 100 },
    ]);
    expect(result.valid).toBe(true);
  });

  it("should handle empty items", () => {
    const result = validateDoubleEntry([]);
    expect(result.valid).toBe(true);
    expect(result.totalDebit).toBe(0);
    expect(result.totalCredit).toBe(0);
  });
});

describe("calculateAccountBalance", () => {
  it("should calculate DEBIT nature balance (debit > credit)", () => {
    expect(calculateAccountBalance("DEBIT", 1000, 300)).toBe(700);
  });

  it("should calculate DEBIT nature balance (credit > debit)", () => {
    expect(calculateAccountBalance("DEBIT", 300, 1000)).toBe(-700);
  });

  it("should calculate CREDIT nature balance (credit > debit)", () => {
    expect(calculateAccountBalance("CREDIT", 300, 1000)).toBe(700);
  });

  it("should calculate CREDIT nature balance (debit > credit)", () => {
    expect(calculateAccountBalance("CREDIT", 1000, 300)).toBe(-700);
  });

  it("should return 0 for equal amounts", () => {
    expect(calculateAccountBalance("DEBIT", 500, 500)).toBe(0);
    expect(calculateAccountBalance("CREDIT", 500, 500)).toBe(0);
  });

  it("should handle decimal precision", () => {
    expect(calculateAccountBalance("DEBIT", 100.55, 50.22)).toBe(50.33);
  });
});

describe("deriveParentCode", () => {
  it("should return null for top-level code", () => {
    expect(deriveParentCode("1")).toBeNull();
  });

  it("should return parent for second-level code", () => {
    expect(deriveParentCode("1.1")).toBe("1");
  });

  it("should return parent for third-level code", () => {
    expect(deriveParentCode("1.1.01")).toBe("1.1");
  });

  it("should return parent for fourth-level code", () => {
    expect(deriveParentCode("1.1.01.001")).toBe("1.1.01");
  });
});

// ==========================================================================
// SERVICE CLASS TESTS
// ==========================================================================

describe("AccountingService", () => {
  let service: AccountingService;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      chartOfAccounts: {
        create: vi.fn().mockResolvedValue({ id: "acc-1", code: "1.1.01", name: "Caixa" }),
        findFirst: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([]),
      },
      accountingEntry: {
        create: vi.fn().mockResolvedValue({
          id: "entry-1",
          code: 1,
          status: "DRAFT",
          items: [],
        }),
        findFirst: vi.fn().mockResolvedValue(null),
        findUnique: vi.fn().mockResolvedValue(null),
        update: vi.fn().mockResolvedValue({}),
      },
      accountingEntryItem: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    };
    service = new AccountingService(mockPrisma as never);
  });

  describe("createAccount", () => {
    it("should create an account with correct data", async () => {
      await service.createAccount({
        companyId: "company-1",
        code: "1.1.01",
        name: "Caixa",
        type: "ASSET",
        nature: "DEBIT",
      });

      expect(mockPrisma.chartOfAccounts.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            companyId: "company-1",
            code: "1.1.01",
            name: "Caixa",
            type: "ASSET",
            nature: "DEBIT",
            level: 3,
            isAnalytical: true,
          }),
        }),
      );
    });

    it("should auto-calculate level from code", async () => {
      await service.createAccount({
        companyId: "company-1",
        code: "1",
        name: "ATIVO",
        type: "ASSET",
        nature: "DEBIT",
      });

      expect(mockPrisma.chartOfAccounts.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ level: 1 }),
        }),
      );
    });
  });

  describe("createEntry", () => {
    it("should create a balanced entry", async () => {
      await service.createEntry({
        companyId: "company-1",
        date: new Date(2026, 0, 15),
        description: "Pagamento fornecedor",
        items: [
          { accountId: "acc-1", type: "DEBIT", amount: 1000 },
          { accountId: "acc-2", type: "CREDIT", amount: 1000 },
        ],
      });

      expect(mockPrisma.accountingEntry.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            totalDebit: 1000,
            totalCredit: 1000,
            status: "DRAFT",
          }),
        }),
      );
    });

    it("should reject unbalanced entry", async () => {
      await expect(
        service.createEntry({
          companyId: "company-1",
          date: new Date(2026, 0, 15),
          description: "Teste",
          items: [
            { accountId: "acc-1", type: "DEBIT", amount: 1000 },
            { accountId: "acc-2", type: "CREDIT", amount: 500 },
          ],
        }),
      ).rejects.toThrow("Lançamento não balanceado");
    });

    it("should reject entry with less than 2 items", async () => {
      await expect(
        service.createEntry({
          companyId: "company-1",
          date: new Date(2026, 0, 15),
          description: "Teste",
          items: [{ accountId: "acc-1", type: "DEBIT", amount: 1000 }],
        }),
      ).rejects.toThrow("pelo menos 2 partidas");
    });
  });

  describe("postEntry", () => {
    it("should post a draft entry", async () => {
      mockPrisma.accountingEntry.findUnique = vi.fn().mockResolvedValue({
        id: "entry-1",
        status: "DRAFT",
      });

      await service.postEntry("entry-1", "user-1");

      expect(mockPrisma.accountingEntry.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "POSTED",
            postedBy: "user-1",
          }),
        }),
      );
    });

    it("should reject posting non-draft entry", async () => {
      mockPrisma.accountingEntry.findUnique = vi.fn().mockResolvedValue({
        id: "entry-1",
        status: "POSTED",
      });

      await expect(service.postEntry("entry-1", "user-1")).rejects.toThrow(
        "Apenas lançamentos em rascunho",
      );
    });

    it("should reject posting non-existent entry", async () => {
      await expect(service.postEntry("non-existent", "user-1")).rejects.toThrow(
        "Lançamento não encontrado",
      );
    });
  });

  describe("reverseEntry", () => {
    it("should reverse a posted entry with inverted items", async () => {
      mockPrisma.accountingEntry.findUnique = vi.fn().mockResolvedValue({
        id: "entry-1",
        companyId: "company-1",
        code: 1,
        description: "Pagamento",
        status: "POSTED",
        totalDebit: 1000,
        totalCredit: 1000,
        items: [
          { accountId: "acc-1", type: "DEBIT", amount: 1000, costCenterId: null, description: "D" },
          { accountId: "acc-2", type: "CREDIT", amount: 1000, costCenterId: null, description: "C" },
        ],
      });

      await service.reverseEntry("entry-1", "user-1");

      // Should create reversal with inverted types
      expect(mockPrisma.accountingEntry.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            description: "Estorno: Pagamento",
            totalDebit: 1000, // was totalCredit
            totalCredit: 1000, // was totalDebit
            status: "POSTED",
            reversalOf: "entry-1",
          }),
        }),
      );

      // Should mark original as REVERSED
      expect(mockPrisma.accountingEntry.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "entry-1" },
          data: expect.objectContaining({ status: "REVERSED" }),
        }),
      );
    });

    it("should reject reversing non-posted entry", async () => {
      mockPrisma.accountingEntry.findUnique = vi.fn().mockResolvedValue({
        id: "entry-1",
        status: "DRAFT",
      });

      await expect(service.reverseEntry("entry-1", "user-1")).rejects.toThrow(
        "Apenas lançamentos efetivados",
      );
    });
  });

  describe("getLedger", () => {
    it("should return ledger with opening balance and entries", async () => {
      mockPrisma.chartOfAccounts.findFirst = vi.fn().mockResolvedValue({
        id: "acc-1",
        code: "1.1.01",
        name: "Caixa",
        nature: "DEBIT",
      });

      // Previous period: 5000 debit, 2000 credit → opening = 3000
      mockPrisma.accountingEntryItem.findMany = vi
        .fn()
        .mockResolvedValueOnce([
          { type: "DEBIT", amount: 5000 },
          { type: "CREDIT", amount: 2000 },
        ])
        .mockResolvedValueOnce([
          {
            type: "DEBIT",
            amount: 1000,
            description: "Recebimento",
            entry: {
              code: 10,
              date: new Date(2026, 0, 15),
              description: "Recebimento cliente",
              documentType: "MANUAL",
              documentNumber: "10",
            },
          },
        ]);

      const result = await service.getLedger(
        "company-1",
        "acc-1",
        new Date(2026, 0, 1),
        new Date(2026, 0, 31),
      );

      expect(result.accountCode).toBe("1.1.01");
      expect(result.openingBalance).toBe(3000);
      expect(result.entries).toHaveLength(1);
      expect(result.entries[0].debit).toBe(1000);
      expect(result.entries[0].balance).toBe(4000);
      expect(result.closingBalance).toBe(4000);
    });

    it("should throw if account not found", async () => {
      await expect(
        service.getLedger("company-1", "non-existent", new Date(), new Date()),
      ).rejects.toThrow("Conta não encontrada");
    });
  });

  describe("getTrialBalance", () => {
    it("should return trial balance with totals", async () => {
      mockPrisma.chartOfAccounts.findMany = vi.fn().mockResolvedValue([
        { id: "acc-1", code: "1.1.01", name: "Caixa", type: "ASSET", nature: "DEBIT", level: 3, isAnalytical: true, isActive: true },
        { id: "acc-2", code: "2.1.01", name: "Fornecedores", type: "LIABILITY", nature: "CREDIT", level: 3, isAnalytical: true, isActive: true },
      ]);

      // Previous items
      mockPrisma.accountingEntryItem.findMany = vi
        .fn()
        .mockResolvedValueOnce([
          { accountId: "acc-1", type: "DEBIT", amount: 5000 },
        ])
        .mockResolvedValueOnce([
          { accountId: "acc-1", type: "DEBIT", amount: 1000 },
          { accountId: "acc-2", type: "CREDIT", amount: 1000 },
        ]);

      const result = await service.getTrialBalance(
        "company-1",
        new Date(2026, 0, 1),
        new Date(2026, 0, 31),
      );

      expect(result.rows).toHaveLength(2);
      expect(result.rows[0].accountCode).toBe("1.1.01");
      expect(result.rows[0].previousBalance).toBe(5000);
      expect(result.rows[0].debit).toBe(1000);
      expect(result.rows[0].currentBalance).toBe(6000);
      expect(result.rows[1].accountCode).toBe("2.1.01");
      expect(result.rows[1].credit).toBe(1000);
      expect(result.rows[1].currentBalance).toBe(1000);
    });
  });

  describe("getIncomeStatement", () => {
    it("should return DRE with revenue, expenses and net income", async () => {
      mockPrisma.chartOfAccounts.findMany = vi.fn().mockResolvedValue([
        { id: "acc-r1", code: "4.1.01", name: "Receita de Vendas", type: "REVENUE", nature: "CREDIT", level: 3, isAnalytical: true, isActive: true },
        { id: "acc-e1", code: "5.1.01", name: "CMV", type: "EXPENSE", nature: "DEBIT", level: 3, isAnalytical: true, isActive: true },
        { id: "acc-e2", code: "5.2.01", name: "Despesas com Pessoal", type: "EXPENSE", nature: "DEBIT", level: 3, isAnalytical: true, isActive: true },
      ]);

      mockPrisma.accountingEntryItem.findMany = vi.fn().mockResolvedValue([
        { accountId: "acc-r1", type: "CREDIT", amount: 50000 },
        { accountId: "acc-e1", type: "DEBIT", amount: 30000 },
        { accountId: "acc-e2", type: "DEBIT", amount: 10000 },
      ]);

      const result = await service.getIncomeStatement(
        "company-1",
        new Date(2026, 0, 1),
        new Date(2026, 0, 31),
      );

      expect(result.revenue).toHaveLength(1);
      expect(result.totalRevenue).toBe(50000);
      expect(result.expenses).toHaveLength(2);
      expect(result.totalExpenses).toBe(40000);
      expect(result.netIncome).toBe(10000);
    });

    it("should handle negative net income (loss)", async () => {
      mockPrisma.chartOfAccounts.findMany = vi.fn().mockResolvedValue([
        { id: "acc-r1", code: "4.1.01", name: "Receita", type: "REVENUE", nature: "CREDIT", level: 3, isAnalytical: true, isActive: true },
        { id: "acc-e1", code: "5.1.01", name: "CMV", type: "EXPENSE", nature: "DEBIT", level: 3, isAnalytical: true, isActive: true },
      ]);

      mockPrisma.accountingEntryItem.findMany = vi.fn().mockResolvedValue([
        { accountId: "acc-r1", type: "CREDIT", amount: 10000 },
        { accountId: "acc-e1", type: "DEBIT", amount: 15000 },
      ]);

      const result = await service.getIncomeStatement(
        "company-1",
        new Date(2026, 0, 1),
        new Date(2026, 0, 31),
      );

      expect(result.netIncome).toBe(-5000);
    });
  });

  describe("seedDefaultChartOfAccounts", () => {
    it("should create all default accounts", async () => {
      let callCount = 0;
      mockPrisma.chartOfAccounts.create = vi.fn().mockImplementation(({ data }) => {
        callCount++;
        return Promise.resolve({ id: `acc-${callCount}`, code: data.code, name: data.name });
      });

      const result = await service.seedDefaultChartOfAccounts("company-1");

      expect(result.accountsCreated).toBeGreaterThan(30);
      expect(mockPrisma.chartOfAccounts.create).toHaveBeenCalledTimes(result.accountsCreated);
    });
  });
});
