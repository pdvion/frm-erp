/**
 * AccountingService
 * Centraliza lógica de negócio do módulo de Contabilidade.
 *
 * Funcionalidades:
 * - Plano de Contas (hierárquico, com código referencial RFB)
 * - Lançamentos Contábeis (partidas dobradas)
 * - Razão Contábil (extrato por conta)
 * - Balancete de Verificação
 * - DRE (Demonstração do Resultado do Exercício)
 *
 * @see VIO-1074
 */

import type { PrismaClient } from "@prisma/client";

// ==========================================================================
// TYPES
// ==========================================================================

export type AccountType = "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";
export type AccountNature = "DEBIT" | "CREDIT";
export type EntryStatus = "DRAFT" | "POSTED" | "REVERSED";

export interface CreateAccountInput {
  companyId: string;
  code: string;
  name: string;
  type: AccountType;
  nature: AccountNature;
  level?: number;
  parentId?: string | null;
  isAnalytical?: boolean;
  referenceCode?: string | null;
  description?: string | null;
}

export interface CreateEntryInput {
  companyId: string;
  date: Date;
  description: string;
  documentType?: string | null;
  documentId?: string | null;
  documentNumber?: string | null;
  notes?: string | null;
  createdBy?: string | null;
  items: CreateEntryItemInput[];
}

export interface CreateEntryItemInput {
  accountId: string;
  type: "DEBIT" | "CREDIT";
  amount: number;
  costCenterId?: string | null;
  description?: string | null;
}

export interface LedgerEntry {
  date: Date;
  entryCode: number;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  documentType: string | null;
  documentNumber: string | null;
}

export interface LedgerResult {
  accountCode: string;
  accountName: string;
  openingBalance: number;
  entries: LedgerEntry[];
  closingBalance: number;
  totalDebit: number;
  totalCredit: number;
}

export interface TrialBalanceRow {
  accountCode: string;
  accountName: string;
  accountType: string;
  level: number;
  previousBalance: number;
  debit: number;
  credit: number;
  currentBalance: number;
}

export interface TrialBalanceResult {
  period: { startDate: Date; endDate: Date };
  rows: TrialBalanceRow[];
  totals: {
    previousBalance: { debit: number; credit: number };
    movements: { debit: number; credit: number };
    currentBalance: { debit: number; credit: number };
  };
}

export interface IncomeStatementRow {
  accountCode: string;
  accountName: string;
  level: number;
  amount: number;
  isSubtotal: boolean;
}

export interface IncomeStatementResult {
  period: { startDate: Date; endDate: Date };
  revenue: IncomeStatementRow[];
  totalRevenue: number;
  expenses: IncomeStatementRow[];
  totalExpenses: number;
  netIncome: number;
}

// ==========================================================================
// PURE FUNCTIONS
// ==========================================================================

/**
 * Determina a natureza padrão de uma conta pelo tipo
 */
export function getDefaultNature(type: AccountType): AccountNature {
  switch (type) {
    case "ASSET":
    case "EXPENSE":
      return "DEBIT";
    case "LIABILITY":
    case "EQUITY":
    case "REVENUE":
      return "CREDIT";
  }
}

/**
 * Calcula nível da conta pelo código (ex: "1" = 1, "1.1" = 2, "1.1.01" = 3)
 */
export function calculateAccountLevel(code: string): number {
  return code.split(".").length;
}

/**
 * Valida que um lançamento tem partidas dobradas (débito = crédito)
 */
export function validateDoubleEntry(
  items: CreateEntryItemInput[],
): { valid: boolean; totalDebit: number; totalCredit: number; difference: number } {
  let totalDebit = 0;
  let totalCredit = 0;

  for (const item of items) {
    if (item.type === "DEBIT") {
      totalDebit += item.amount;
    } else {
      totalCredit += item.amount;
    }
  }

  totalDebit = Math.round(totalDebit * 100) / 100;
  totalCredit = Math.round(totalCredit * 100) / 100;
  const difference = Math.round(Math.abs(totalDebit - totalCredit) * 100) / 100;

  return {
    valid: difference === 0,
    totalDebit,
    totalCredit,
    difference,
  };
}

/**
 * Calcula saldo de uma conta baseado na natureza e movimentações
 */
export function calculateAccountBalance(
  nature: AccountNature,
  totalDebit: number,
  totalCredit: number,
): number {
  if (nature === "DEBIT") {
    return Math.round((totalDebit - totalCredit) * 100) / 100;
  }
  return Math.round((totalCredit - totalDebit) * 100) / 100;
}

/**
 * Deriva o código pai de um código de conta
 * Ex: "1.1.01" → "1.1", "1.1" → "1", "1" → null
 */
export function deriveParentCode(code: string): string | null {
  const parts = code.split(".");
  if (parts.length <= 1) return null;
  return parts.slice(0, -1).join(".");
}

// ==========================================================================
// SERVICE CLASS
// ==========================================================================

export class AccountingService {
  constructor(private prisma: PrismaClient) {}

  // ========================================================================
  // PLANO DE CONTAS
  // ========================================================================

  /**
   * Cria uma conta no plano de contas
   */
  async createAccount(input: CreateAccountInput) {
    const level = input.level ?? calculateAccountLevel(input.code);
    const nature = input.nature ?? getDefaultNature(input.type);

    return this.prisma.chartOfAccounts.create({
      data: {
        companyId: input.companyId,
        code: input.code,
        name: input.name,
        type: input.type,
        nature,
        level,
        parentId: input.parentId ?? null,
        isAnalytical: input.isAnalytical ?? true,
        referenceCode: input.referenceCode ?? null,
        description: input.description ?? null,
      },
    });
  }

  /**
   * Cria plano de contas padrão para uma empresa
   */
  async seedDefaultChartOfAccounts(companyId: string) {
    const defaultAccounts: Omit<CreateAccountInput, "companyId">[] = [
      // Nível 1 — Grupos
      { code: "1", name: "ATIVO", type: "ASSET", nature: "DEBIT", isAnalytical: false },
      { code: "2", name: "PASSIVO", type: "LIABILITY", nature: "CREDIT", isAnalytical: false },
      { code: "3", name: "PATRIMÔNIO LÍQUIDO", type: "EQUITY", nature: "CREDIT", isAnalytical: false },
      { code: "4", name: "RECEITAS", type: "REVENUE", nature: "CREDIT", isAnalytical: false },
      { code: "5", name: "CUSTOS E DESPESAS", type: "EXPENSE", nature: "DEBIT", isAnalytical: false },

      // Nível 2 — Subgrupos
      { code: "1.1", name: "Ativo Circulante", type: "ASSET", nature: "DEBIT", isAnalytical: false },
      { code: "1.2", name: "Ativo Não Circulante", type: "ASSET", nature: "DEBIT", isAnalytical: false },
      { code: "2.1", name: "Passivo Circulante", type: "LIABILITY", nature: "CREDIT", isAnalytical: false },
      { code: "2.2", name: "Passivo Não Circulante", type: "LIABILITY", nature: "CREDIT", isAnalytical: false },
      { code: "3.1", name: "Capital Social", type: "EQUITY", nature: "CREDIT", isAnalytical: false },
      { code: "3.2", name: "Reservas", type: "EQUITY", nature: "CREDIT", isAnalytical: false },
      { code: "4.1", name: "Receita Operacional", type: "REVENUE", nature: "CREDIT", isAnalytical: false },
      { code: "4.2", name: "Outras Receitas", type: "REVENUE", nature: "CREDIT", isAnalytical: false },
      { code: "5.1", name: "Custos Operacionais", type: "EXPENSE", nature: "DEBIT", isAnalytical: false },
      { code: "5.2", name: "Despesas Operacionais", type: "EXPENSE", nature: "DEBIT", isAnalytical: false },
      { code: "5.3", name: "Despesas Financeiras", type: "EXPENSE", nature: "DEBIT", isAnalytical: false },

      // Nível 3 — Contas analíticas
      { code: "1.1.01", name: "Caixa", type: "ASSET", nature: "DEBIT" },
      { code: "1.1.02", name: "Bancos Conta Movimento", type: "ASSET", nature: "DEBIT" },
      { code: "1.1.03", name: "Clientes", type: "ASSET", nature: "DEBIT" },
      { code: "1.1.04", name: "Estoques", type: "ASSET", nature: "DEBIT" },
      { code: "1.1.05", name: "Impostos a Recuperar", type: "ASSET", nature: "DEBIT" },
      { code: "1.2.01", name: "Imobilizado", type: "ASSET", nature: "DEBIT" },
      { code: "1.2.02", name: "(-) Depreciação Acumulada", type: "ASSET", nature: "CREDIT" },
      { code: "1.2.03", name: "Intangível", type: "ASSET", nature: "DEBIT" },
      { code: "2.1.01", name: "Fornecedores", type: "LIABILITY", nature: "CREDIT" },
      { code: "2.1.02", name: "Salários a Pagar", type: "LIABILITY", nature: "CREDIT" },
      { code: "2.1.03", name: "Impostos a Recolher", type: "LIABILITY", nature: "CREDIT" },
      { code: "2.1.04", name: "Encargos Sociais a Recolher", type: "LIABILITY", nature: "CREDIT" },
      { code: "2.2.01", name: "Empréstimos e Financiamentos", type: "LIABILITY", nature: "CREDIT" },
      { code: "3.1.01", name: "Capital Social Integralizado", type: "EQUITY", nature: "CREDIT" },
      { code: "3.2.01", name: "Lucros Acumulados", type: "EQUITY", nature: "CREDIT" },
      { code: "4.1.01", name: "Receita de Vendas", type: "REVENUE", nature: "CREDIT" },
      { code: "4.1.02", name: "(-) Deduções de Vendas", type: "REVENUE", nature: "DEBIT" },
      { code: "4.2.01", name: "Receitas Financeiras", type: "REVENUE", nature: "CREDIT" },
      { code: "5.1.01", name: "Custo das Mercadorias Vendidas", type: "EXPENSE", nature: "DEBIT" },
      { code: "5.1.02", name: "Custo dos Produtos Vendidos", type: "EXPENSE", nature: "DEBIT" },
      { code: "5.2.01", name: "Despesas com Pessoal", type: "EXPENSE", nature: "DEBIT" },
      { code: "5.2.02", name: "Despesas Administrativas", type: "EXPENSE", nature: "DEBIT" },
      { code: "5.2.03", name: "Despesas Comerciais", type: "EXPENSE", nature: "DEBIT" },
      { code: "5.3.01", name: "Juros e Multas", type: "EXPENSE", nature: "DEBIT" },
      { code: "5.3.02", name: "Tarifas Bancárias", type: "EXPENSE", nature: "DEBIT" },
    ];

    // Criar contas em ordem (pais primeiro)
    const createdAccounts = new Map<string, string>();

    for (const account of defaultAccounts) {
      const parentCode = deriveParentCode(account.code);
      const parentId = parentCode ? createdAccounts.get(parentCode) ?? null : null;

      const created = await this.prisma.chartOfAccounts.create({
        data: {
          companyId,
          code: account.code,
          name: account.name,
          type: account.type,
          nature: account.nature,
          level: calculateAccountLevel(account.code),
          parentId,
          isAnalytical: account.isAnalytical ?? true,
        },
      });

      createdAccounts.set(account.code, created.id);
    }

    return { accountsCreated: createdAccounts.size };
  }

  // ========================================================================
  // LANÇAMENTOS CONTÁBEIS
  // ========================================================================

  /**
   * Cria um lançamento contábil com partidas dobradas
   */
  async createEntry(input: CreateEntryInput) {
    if (input.items.length < 2) {
      throw new Error("Lançamento deve ter pelo menos 2 partidas (débito e crédito)");
    }

    // Validar partidas dobradas
    const validation = validateDoubleEntry(input.items);
    if (!validation.valid) {
      throw new Error(
        `Lançamento não balanceado: Débito=${validation.totalDebit}, Crédito=${validation.totalCredit}, Diferença=${validation.difference}`,
      );
    }

    // Gerar próximo código
    const lastEntry = await this.prisma.accountingEntry.findFirst({
      where: { companyId: input.companyId },
      orderBy: { code: "desc" },
      select: { code: true },
    });
    const nextCode = (lastEntry?.code ?? 0) + 1;

    return this.prisma.accountingEntry.create({
      data: {
        companyId: input.companyId,
        code: nextCode,
        date: input.date,
        description: input.description,
        documentType: input.documentType,
        documentId: input.documentId,
        documentNumber: input.documentNumber,
        notes: input.notes,
        createdBy: input.createdBy,
        totalDebit: validation.totalDebit,
        totalCredit: validation.totalCredit,
        status: "DRAFT",
        items: {
          create: input.items.map((item, index) => ({
            accountId: item.accountId,
            type: item.type,
            amount: item.amount,
            costCenterId: item.costCenterId ?? null,
            description: item.description ?? null,
            sequence: index + 1,
          })),
        },
      },
      include: { items: { include: { account: true } } },
    });
  }

  /**
   * Efetiva (posta) um lançamento contábil
   */
  async postEntry(entryId: string, userId: string) {
    const entry = await this.prisma.accountingEntry.findUnique({
      where: { id: entryId },
    });

    if (!entry) throw new Error("Lançamento não encontrado");
    if (entry.status !== "DRAFT") throw new Error("Apenas lançamentos em rascunho podem ser efetivados");

    return this.prisma.accountingEntry.update({
      where: { id: entryId },
      data: {
        status: "POSTED",
        postedBy: userId,
        postedAt: new Date(),
      },
    });
  }

  /**
   * Estorna um lançamento contábil (cria lançamento inverso)
   */
  async reverseEntry(entryId: string, userId: string) {
    const entry = await this.prisma.accountingEntry.findUnique({
      where: { id: entryId },
      include: { items: true },
    });

    if (!entry) throw new Error("Lançamento não encontrado");
    if (entry.status !== "POSTED") throw new Error("Apenas lançamentos efetivados podem ser estornados");

    // Gerar próximo código
    const lastEntry = await this.prisma.accountingEntry.findFirst({
      where: { companyId: entry.companyId },
      orderBy: { code: "desc" },
      select: { code: true },
    });
    const nextCode = (lastEntry?.code ?? 0) + 1;

    // Criar lançamento inverso
    const reversal = await this.prisma.accountingEntry.create({
      data: {
        companyId: entry.companyId,
        code: nextCode,
        date: new Date(),
        description: `Estorno: ${entry.description}`,
        documentType: "REVERSAL",
        documentId: entry.id,
        documentNumber: String(entry.code),
        reversalOf: entry.id,
        totalDebit: entry.totalCredit,
        totalCredit: entry.totalDebit,
        status: "POSTED",
        postedBy: userId,
        postedAt: new Date(),
        createdBy: userId,
        items: {
          create: entry.items.map((item, index) => ({
            accountId: item.accountId,
            type: item.type === "DEBIT" ? "CREDIT" : "DEBIT",
            amount: item.amount,
            costCenterId: item.costCenterId,
            description: `Estorno: ${item.description || ""}`,
            sequence: index + 1,
          })),
        },
      },
      include: { items: { include: { account: true } } },
    });

    // Marcar original como estornado
    await this.prisma.accountingEntry.update({
      where: { id: entryId },
      data: { status: "REVERSED", reversedBy: reversal.id },
    });

    return reversal;
  }

  // ========================================================================
  // RAZÃO CONTÁBIL
  // ========================================================================

  /**
   * Gera razão contábil (extrato) de uma conta em um período
   */
  async getLedger(
    companyId: string,
    accountId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<LedgerResult> {
    const account = await this.prisma.chartOfAccounts.findFirst({
      where: { id: accountId, companyId },
    });

    if (!account) throw new Error("Conta não encontrada");

    // Saldo anterior ao período
    const previousItems = await this.prisma.accountingEntryItem.findMany({
      where: {
        accountId,
        entry: {
          companyId,
          status: "POSTED",
          date: { lt: startDate },
        },
      },
      select: { type: true, amount: true },
    });

    let prevDebit = 0;
    let prevCredit = 0;
    for (const item of previousItems) {
      if (item.type === "DEBIT") prevDebit += Number(item.amount);
      else prevCredit += Number(item.amount);
    }
    const openingBalance = calculateAccountBalance(
      account.nature as AccountNature,
      prevDebit,
      prevCredit,
    );

    // Movimentações do período
    const periodItems = await this.prisma.accountingEntryItem.findMany({
      where: {
        accountId,
        entry: {
          companyId,
          status: "POSTED",
          date: { gte: startDate, lte: endDate },
        },
      },
      include: {
        entry: {
          select: { code: true, date: true, description: true, documentType: true, documentNumber: true },
        },
      },
      orderBy: { entry: { date: "asc" } },
    });

    let runningBalance = openingBalance;
    let totalDebit = 0;
    let totalCredit = 0;

    const entries: LedgerEntry[] = periodItems.map((item) => {
      const debit = item.type === "DEBIT" ? Number(item.amount) : 0;
      const credit = item.type === "CREDIT" ? Number(item.amount) : 0;
      totalDebit += debit;
      totalCredit += credit;

      if (account.nature === "DEBIT") {
        runningBalance += debit - credit;
      } else {
        runningBalance += credit - debit;
      }

      return {
        date: item.entry.date,
        entryCode: item.entry.code,
        description: item.description || item.entry.description,
        debit,
        credit,
        balance: Math.round(runningBalance * 100) / 100,
        documentType: item.entry.documentType,
        documentNumber: item.entry.documentNumber,
      };
    });

    return {
      accountCode: account.code,
      accountName: account.name,
      openingBalance: Math.round(openingBalance * 100) / 100,
      entries,
      closingBalance: Math.round(runningBalance * 100) / 100,
      totalDebit: Math.round(totalDebit * 100) / 100,
      totalCredit: Math.round(totalCredit * 100) / 100,
    };
  }

  // ========================================================================
  // BALANCETE DE VERIFICAÇÃO
  // ========================================================================

  /**
   * Gera balancete de verificação para um período
   */
  async getTrialBalance(
    companyId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<TrialBalanceResult> {
    // Buscar todas as contas analíticas
    const accounts = await this.prisma.chartOfAccounts.findMany({
      where: { companyId, isAnalytical: true, isActive: true },
      orderBy: { code: "asc" },
    });

    // Buscar saldos anteriores
    const previousItems = await this.prisma.accountingEntryItem.findMany({
      where: {
        entry: { companyId, status: "POSTED", date: { lt: startDate } },
      },
      select: { accountId: true, type: true, amount: true },
    });

    // Buscar movimentações do período
    const periodItems = await this.prisma.accountingEntryItem.findMany({
      where: {
        entry: { companyId, status: "POSTED", date: { gte: startDate, lte: endDate } },
      },
      select: { accountId: true, type: true, amount: true },
    });

    // Agregar por conta
    const prevByAccount = new Map<string, { debit: number; credit: number }>();
    for (const item of previousItems) {
      const acc = prevByAccount.get(item.accountId) || { debit: 0, credit: 0 };
      if (item.type === "DEBIT") acc.debit += Number(item.amount);
      else acc.credit += Number(item.amount);
      prevByAccount.set(item.accountId, acc);
    }

    const periodByAccount = new Map<string, { debit: number; credit: number }>();
    for (const item of periodItems) {
      const acc = periodByAccount.get(item.accountId) || { debit: 0, credit: 0 };
      if (item.type === "DEBIT") acc.debit += Number(item.amount);
      else acc.credit += Number(item.amount);
      periodByAccount.set(item.accountId, acc);
    }

    const totals = {
      previousBalance: { debit: 0, credit: 0 },
      movements: { debit: 0, credit: 0 },
      currentBalance: { debit: 0, credit: 0 },
    };

    const rows: TrialBalanceRow[] = accounts
      .map((account) => {
        const prev = prevByAccount.get(account.id) || { debit: 0, credit: 0 };
        const period = periodByAccount.get(account.id) || { debit: 0, credit: 0 };

        const previousBalance = calculateAccountBalance(
          account.nature as AccountNature,
          prev.debit,
          prev.credit,
        );
        const currentBalance = calculateAccountBalance(
          account.nature as AccountNature,
          prev.debit + period.debit,
          prev.credit + period.credit,
        );

        return {
          accountCode: account.code,
          accountName: account.name,
          accountType: account.type,
          level: account.level,
          previousBalance,
          debit: Math.round(period.debit * 100) / 100,
          credit: Math.round(period.credit * 100) / 100,
          currentBalance,
        };
      })
      .filter((row) => row.previousBalance !== 0 || row.debit !== 0 || row.credit !== 0);

    for (const row of rows) {
      if (row.previousBalance > 0) totals.previousBalance.debit += row.previousBalance;
      else totals.previousBalance.credit += Math.abs(row.previousBalance);
      totals.movements.debit += row.debit;
      totals.movements.credit += row.credit;
      if (row.currentBalance > 0) totals.currentBalance.debit += row.currentBalance;
      else totals.currentBalance.credit += Math.abs(row.currentBalance);
    }

    // Round totals
    for (const key of Object.keys(totals) as Array<keyof typeof totals>) {
      totals[key].debit = Math.round(totals[key].debit * 100) / 100;
      totals[key].credit = Math.round(totals[key].credit * 100) / 100;
    }

    return { period: { startDate, endDate }, rows, totals };
  }

  // ========================================================================
  // DRE — DEMONSTRAÇÃO DO RESULTADO DO EXERCÍCIO
  // ========================================================================

  /**
   * Gera DRE para um período
   */
  async getIncomeStatement(
    companyId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<IncomeStatementResult> {
    // Buscar contas de receita e despesa
    const accounts = await this.prisma.chartOfAccounts.findMany({
      where: {
        companyId,
        isActive: true,
        type: { in: ["REVENUE", "EXPENSE"] },
      },
      orderBy: { code: "asc" },
    });

    // Buscar movimentações do período
    const accountIds = accounts.map((a) => a.id);
    const items = await this.prisma.accountingEntryItem.findMany({
      where: {
        accountId: { in: accountIds },
        entry: { companyId, status: "POSTED", date: { gte: startDate, lte: endDate } },
      },
      select: { accountId: true, type: true, amount: true },
    });

    // Agregar por conta
    const byAccount = new Map<string, { debit: number; credit: number }>();
    for (const item of items) {
      const acc = byAccount.get(item.accountId) || { debit: 0, credit: 0 };
      if (item.type === "DEBIT") acc.debit += Number(item.amount);
      else acc.credit += Number(item.amount);
      byAccount.set(item.accountId, acc);
    }

    const revenue: IncomeStatementRow[] = [];
    const expenses: IncomeStatementRow[] = [];
    let totalRevenue = 0;
    let totalExpenses = 0;

    for (const account of accounts) {
      const movements = byAccount.get(account.id);
      if (!movements) continue;

      const balance = calculateAccountBalance(
        account.nature as AccountNature,
        movements.debit,
        movements.credit,
      );

      if (balance === 0) continue;

      const row: IncomeStatementRow = {
        accountCode: account.code,
        accountName: account.name,
        level: account.level,
        amount: Math.round(balance * 100) / 100,
        isSubtotal: !account.isAnalytical,
      };

      if (account.type === "REVENUE") {
        revenue.push(row);
        totalRevenue += balance;
      } else {
        expenses.push(row);
        totalExpenses += balance;
      }
    }

    return {
      period: { startDate, endDate },
      revenue,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      expenses,
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      netIncome: Math.round((totalRevenue - totalExpenses) * 100) / 100,
    };
  }
}
