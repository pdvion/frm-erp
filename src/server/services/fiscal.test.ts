/**
 * Testes do FiscalService
 * @see VIO-1077 - Fiscal Completo
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { PrismaClient } from "@prisma/client";
import {
  calculateDifal,
  calculateIcmsSt,
  calculateNfse,
  getInterstateRate,
  calculateObligationDueDate,
  calculateApurationBalance,
  generateFiscalCalendar,
  OBLIGATION_DEFINITIONS,
  FiscalService,
} from "./fiscal";

// ============================================================================
// PURE FUNCTIONS
// ============================================================================

describe("calculateDifal", () => {
  it("deve calcular DIFAL corretamente para operação interestadual", () => {
    const result = calculateDifal({
      productValue: 1000,
      icmsOrigemRate: 18,
      icmsDestinoRate: 18,
      icmsInterRate: 12,
    });

    expect(result.difalValue).toBe(60); // 1000 * (18 - 12) / 100
    expect(result.difalOrigem).toBe(0); // Desde 2019, 100% destino
    expect(result.difalDestino).toBe(60);
    expect(result.fcp).toBe(0);
    expect(result.totalDue).toBe(60);
  });

  it("deve incluir FCP no cálculo", () => {
    const result = calculateDifal({
      productValue: 1000,
      icmsOrigemRate: 18,
      icmsDestinoRate: 18,
      icmsInterRate: 7,
      fcpRate: 2,
    });

    expect(result.difalValue).toBe(110); // 1000 * (18 - 7) / 100
    expect(result.fcp).toBe(20); // 1000 * 2 / 100
    expect(result.totalDue).toBe(130); // 110 + 20
  });

  it("deve retornar zero quando alíquota destino <= interestadual", () => {
    const result = calculateDifal({
      productValue: 1000,
      icmsOrigemRate: 12,
      icmsDestinoRate: 12,
      icmsInterRate: 12,
    });

    expect(result.difalValue).toBe(0);
    expect(result.totalDue).toBe(0);
  });
});

describe("calculateIcmsSt", () => {
  it("deve calcular ICMS-ST corretamente", () => {
    const result = calculateIcmsSt({
      productValue: 1000,
      icmsRate: 12,
      mva: 40,
      icmsStInternalRate: 18,
    });

    // Base ST = 1000 * (1 + 40/100) = 1400
    // ICMS próprio = 1000 * 12/100 = 120
    // ICMS ST total = 1400 * 18/100 = 252
    // ICMS ST a recolher = 252 - 120 = 132
    expect(result.icmsStBase).toBe(1400);
    expect(result.icmsOwn).toBe(120);
    expect(result.icmsStValue).toBe(132);
  });

  it("deve aplicar redução de base", () => {
    const result = calculateIcmsSt({
      productValue: 1000,
      icmsRate: 12,
      mva: 40,
      icmsStInternalRate: 18,
      reductionBase: 80, // 80% da base
    });

    // Base ST = 1000 * 1.4 * 0.8 = 1120
    expect(result.icmsStBase).toBe(1120);
    expect(result.icmsOwn).toBe(120);
    // ICMS ST total = 1120 * 18/100 = 201.6
    // ICMS ST = 201.6 - 120 = 81.6
    expect(result.icmsStValue).toBe(81.6);
  });

  it("deve retornar zero quando ICMS próprio >= ICMS ST total", () => {
    const result = calculateIcmsSt({
      productValue: 1000,
      icmsRate: 18,
      mva: 10,
      icmsStInternalRate: 12,
    });

    // ICMS próprio = 180, ST total = 1100 * 12/100 = 132
    // 132 - 180 < 0 → 0
    expect(result.icmsStValue).toBe(0);
  });
});

describe("calculateNfse", () => {
  it("deve calcular impostos de NFS-e corretamente", () => {
    const result = calculateNfse({
      serviceValue: 10000,
      issRate: 5,
      pisRate: 0.65,
      cofinsRate: 3,
    });

    expect(result.baseValue).toBe(10000);
    expect(result.issValue).toBe(500);
    expect(result.pisValue).toBe(65);
    expect(result.cofinsValue).toBe(300);
    expect(result.irValue).toBe(0);
    expect(result.csllValue).toBe(0);
    expect(result.inssValue).toBe(0);
    // Sem ISS retido: deduções = PIS + COFINS = 365
    expect(result.totalDeductions).toBe(365);
    expect(result.netValue).toBe(9635);
  });

  it("deve considerar ISS retido nas deduções", () => {
    const result = calculateNfse({
      serviceValue: 10000,
      issRate: 5,
      issWithheld: true,
    });

    expect(result.issValue).toBe(500);
    expect(result.totalDeductions).toBe(500); // ISS retido
    expect(result.netValue).toBe(9500);
  });

  it("deve aplicar dedução na base de cálculo", () => {
    const result = calculateNfse({
      serviceValue: 10000,
      deductionValue: 2000,
      issRate: 5,
    });

    expect(result.baseValue).toBe(8000);
    expect(result.issValue).toBe(400); // 8000 * 5%
  });

  it("deve calcular todos os impostos retidos", () => {
    const result = calculateNfse({
      serviceValue: 10000,
      issRate: 5,
      issWithheld: true,
      pisRate: 0.65,
      cofinsRate: 3,
      irRate: 1.5,
      csllRate: 1,
      inssRate: 11,
    });

    expect(result.issValue).toBe(500);
    expect(result.pisValue).toBe(65);
    expect(result.cofinsValue).toBe(300);
    expect(result.irValue).toBe(150);
    expect(result.csllValue).toBe(100);
    expect(result.inssValue).toBe(1100);
    // Total = 500 + 65 + 300 + 150 + 100 + 1100 = 2215
    expect(result.totalDeductions).toBe(2215);
    expect(result.netValue).toBe(7785);
  });
});

describe("getInterstateRate", () => {
  it("deve retornar 0 para mesma UF", () => {
    expect(getInterstateRate("SP", "SP")).toBe(0);
  });

  it("deve retornar 7% de SP para estados do Norte/Nordeste", () => {
    expect(getInterstateRate("SP", "BA")).toBe(7);
    expect(getInterstateRate("SP", "CE")).toBe(7);
    expect(getInterstateRate("SP", "AM")).toBe(7);
  });

  it("deve retornar 12% de SP para estados do Sul/Sudeste", () => {
    expect(getInterstateRate("SP", "RJ")).toBe(12);
    expect(getInterstateRate("SP", "PR")).toBe(12);
  });

  it("deve retornar 12% para estados não mapeados", () => {
    expect(getInterstateRate("XX", "YY")).toBe(12);
  });
});

describe("calculateObligationDueDate", () => {
  it("deve calcular vencimento no mês seguinte", () => {
    const date = calculateObligationDueDate(2026, 1, 20, 1);
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(1); // Fevereiro (0-indexed)
    expect(date.getDate()).toBe(20);
  });

  it("deve ajustar para último dia do mês quando necessário", () => {
    // Fevereiro não tem dia 31
    const date = calculateObligationDueDate(2026, 1, 31, 1);
    expect(date.getMonth()).toBe(1);
    expect(date.getDate()).toBe(28); // 2026 não é bissexto
  });

  it("deve virar o ano quando necessário", () => {
    const date = calculateObligationDueDate(2026, 12, 15, 2);
    expect(date.getFullYear()).toBe(2027);
    expect(date.getMonth()).toBe(1); // Fevereiro
    expect(date.getDate()).toBe(15);
  });
});

describe("calculateApurationBalance", () => {
  it("deve calcular saldo a pagar quando débito > crédito", () => {
    const result = calculateApurationBalance(10000, 6000, 0);
    expect(result.balance).toBe(4000);
    expect(result.amountDue).toBe(4000);
    expect(result.carryForwardCredit).toBe(0);
  });

  it("deve gerar crédito acumulado quando crédito > débito", () => {
    const result = calculateApurationBalance(6000, 10000, 0);
    expect(result.balance).toBe(-4000);
    expect(result.amountDue).toBe(0);
    expect(result.carryForwardCredit).toBe(4000);
  });

  it("deve considerar crédito do período anterior", () => {
    const result = calculateApurationBalance(10000, 6000, 2000);
    expect(result.balance).toBe(2000);
    expect(result.amountDue).toBe(2000);
    expect(result.carryForwardCredit).toBe(0);
  });

  it("deve acumular crédito quando anterior + atual > débito", () => {
    const result = calculateApurationBalance(5000, 6000, 2000);
    expect(result.balance).toBe(-3000);
    expect(result.amountDue).toBe(0);
    expect(result.carryForwardCredit).toBe(3000);
  });
});

describe("generateFiscalCalendar", () => {
  it("deve gerar calendário com todas as obrigações", () => {
    const calendar = generateFiscalCalendar(2026, 1);
    expect(calendar).toHaveLength(OBLIGATION_DEFINITIONS.length);
    expect(calendar.every(item => item.year === 2026 && item.month === 1)).toBe(true);
    expect(calendar.every(item => item.status === "PENDING")).toBe(true);
  });

  it("deve ter datas de vencimento corretas", () => {
    const calendar = generateFiscalCalendar(2026, 1);
    const spedFiscal = calendar.find(c => c.code === "SPED_FISCAL");
    expect(spedFiscal).toBeDefined();
    // SPED Fiscal: dia 20 do mês seguinte
    expect(spedFiscal!.dueDate.getMonth()).toBe(1); // Fevereiro
    expect(spedFiscal!.dueDate.getDate()).toBe(20);
  });
});

// ============================================================================
// FISCAL SERVICE (CLASS)
// ============================================================================

describe("FiscalService", () => {
  let service: FiscalService;
  let mockPrisma: Record<string, unknown>;

  beforeEach(() => {
    mockPrisma = {
      fiscalObligation: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      taxApuration: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      taxApurationItem: {
        create: vi.fn(),
      },
      difalCalculation: {
        create: vi.fn(),
      },
      nfseIssued: {
        findFirst: vi.fn(),
        create: vi.fn(),
      },
      blocoKRecord: {
        deleteMany: vi.fn(),
        create: vi.fn(),
      },
      productionOrder: {
        findMany: vi.fn(),
      },
    };

    service = new FiscalService(mockPrisma as unknown as PrismaClient);
  });

  // --------------------------------------------------------------------------
  // OBRIGAÇÕES
  // --------------------------------------------------------------------------

  describe("generateObligations", () => {
    it("deve gerar todas as obrigações para um período", async () => {
      const mockFindFirst = mockPrisma.fiscalObligation as { findFirst: ReturnType<typeof vi.fn> };
      mockFindFirst.findFirst.mockResolvedValue(null);

      const mockCreate = mockPrisma.fiscalObligation as { create: ReturnType<typeof vi.fn> };
      mockCreate.create.mockImplementation(async (args: Record<string, unknown>) => {
        const data = args.data as Record<string, unknown>;
        return { id: "ob-1", ...data };
      });

      const result = await service.generateObligations("comp-1", 2026, 1);

      expect(result).toHaveLength(OBLIGATION_DEFINITIONS.length);
      expect(mockCreate.create).toHaveBeenCalledTimes(OBLIGATION_DEFINITIONS.length);
    });

    it("deve reutilizar obrigações existentes", async () => {
      const existing = { id: "ob-existing", code: "SPED_FISCAL", status: "GENERATED" };
      const mockFindFirst = mockPrisma.fiscalObligation as { findFirst: ReturnType<typeof vi.fn> };
      mockFindFirst.findFirst.mockResolvedValue(existing);

      const result = await service.generateObligations("comp-1", 2026, 1, ["SPED_FISCAL"]);

      expect(result).toHaveLength(1);
      expect(result[0]).toBe(existing);
      const mockCreate = mockPrisma.fiscalObligation as { create: ReturnType<typeof vi.fn> };
      expect(mockCreate.create).not.toHaveBeenCalled();
    });

    it("deve filtrar por códigos quando fornecidos", async () => {
      const mockFindFirst = mockPrisma.fiscalObligation as { findFirst: ReturnType<typeof vi.fn> };
      mockFindFirst.findFirst.mockResolvedValue(null);

      const mockCreate = mockPrisma.fiscalObligation as { create: ReturnType<typeof vi.fn> };
      mockCreate.create.mockImplementation(async (args: Record<string, unknown>) => {
        const data = args.data as Record<string, unknown>;
        return { id: "ob-1", ...data };
      });

      const result = await service.generateObligations("comp-1", 2026, 1, ["SPED_FISCAL", "GIA"]);

      expect(result).toHaveLength(2);
      expect(mockCreate.create).toHaveBeenCalledTimes(2);
    });
  });

  describe("updateObligationStatus", () => {
    it("deve atualizar status de obrigação", async () => {
      const mockFindFirst = mockPrisma.fiscalObligation as { findFirst: ReturnType<typeof vi.fn> };
      mockFindFirst.findFirst.mockResolvedValue({ id: "ob-1", companyId: "comp-1" });

      const mockUpdate = mockPrisma.fiscalObligation as { update: ReturnType<typeof vi.fn> };
      mockUpdate.update.mockResolvedValue({ id: "ob-1", status: "GENERATED" });

      const result = await service.updateObligationStatus("ob-1", "comp-1", "GENERATED", {
        fileName: "sped_012026.txt",
      });

      expect(result).toEqual({ id: "ob-1", status: "GENERATED" });
      expect(mockUpdate.update).toHaveBeenCalledWith({
        where: { id: "ob-1" },
        data: expect.objectContaining({ status: "GENERATED", fileName: "sped_012026.txt" }),
      });
    });

    it("deve lançar erro se obrigação não encontrada", async () => {
      const mockFindFirst = mockPrisma.fiscalObligation as { findFirst: ReturnType<typeof vi.fn> };
      mockFindFirst.findFirst.mockResolvedValue(null);

      await expect(
        service.updateObligationStatus("ob-999", "comp-1", "GENERATED"),
      ).rejects.toThrow("Obrigação fiscal não encontrada");
    });

    it("deve adicionar transmittedAt quando status é TRANSMITTED", async () => {
      const mockFindFirst = mockPrisma.fiscalObligation as { findFirst: ReturnType<typeof vi.fn> };
      mockFindFirst.findFirst.mockResolvedValue({ id: "ob-1", companyId: "comp-1" });

      const mockUpdate = mockPrisma.fiscalObligation as { update: ReturnType<typeof vi.fn> };
      mockUpdate.update.mockResolvedValue({ id: "ob-1", status: "TRANSMITTED" });

      await service.updateObligationStatus("ob-1", "comp-1", "TRANSMITTED", {
        receiptNumber: "REC-123",
      });

      expect(mockUpdate.update).toHaveBeenCalledWith({
        where: { id: "ob-1" },
        data: expect.objectContaining({
          status: "TRANSMITTED",
          transmittedAt: expect.any(Date),
          receiptNumber: "REC-123",
        }),
      });
    });
  });

  // --------------------------------------------------------------------------
  // APURAÇÃO
  // --------------------------------------------------------------------------

  describe("getOrCreateApuration", () => {
    it("deve retornar apuração existente", async () => {
      const existing = { id: "ap-1", taxType: "ICMS", items: [] };
      const mockFindFirst = mockPrisma.taxApuration as { findFirst: ReturnType<typeof vi.fn> };
      mockFindFirst.findFirst.mockResolvedValue(existing);

      const result = await service.getOrCreateApuration("comp-1", "ICMS", 2026, 1);

      expect(result).toBe(existing);
    });

    it("deve criar nova apuração se não existir", async () => {
      const mockFindFirst = mockPrisma.taxApuration as { findFirst: ReturnType<typeof vi.fn> };
      mockFindFirst.findFirst.mockResolvedValue(null);

      const created = { id: "ap-new", taxType: "ICMS", status: "OPEN", items: [] };
      const mockCreate = mockPrisma.taxApuration as { create: ReturnType<typeof vi.fn> };
      mockCreate.create.mockResolvedValue(created);

      const result = await service.getOrCreateApuration("comp-1", "ICMS", 2026, 1);

      expect(result).toBe(created);
      expect(mockCreate.create).toHaveBeenCalledWith({
        data: { companyId: "comp-1", taxType: "ICMS", year: 2026, month: 1, status: "OPEN" },
        include: { items: true },
      });
    });
  });

  describe("closeApuration", () => {
    it("deve fechar apuração e calcular saldo", async () => {
      const apuration = {
        id: "ap-1",
        companyId: "comp-1",
        taxType: "ICMS",
        status: "OPEN",
        previousCredit: 0,
        items: [
          { taxValue: 5000, nature: "DEBIT" },
          { taxValue: 3000, nature: "CREDIT" },
          { taxValue: 1000, nature: "CREDIT" },
        ],
      };

      const mockFindFirst = mockPrisma.taxApuration as { findFirst: ReturnType<typeof vi.fn> };
      mockFindFirst.findFirst.mockResolvedValue(apuration);

      const mockUpdate = mockPrisma.taxApuration as { update: ReturnType<typeof vi.fn> };
      mockUpdate.update.mockResolvedValue({ ...apuration, status: "CLOSED" });

      await service.closeApuration("comp-1", "ICMS", 2026, 1);

      expect(mockUpdate.update).toHaveBeenCalledWith({
        where: { id: "ap-1" },
        data: expect.objectContaining({
          debitValue: 5000,
          creditValue: 4000,
          balanceValue: 1000,
          amountDue: 1000,
          status: "CLOSED",
        }),
        include: { items: true },
      });
    });

    it("deve lançar erro se apuração não encontrada", async () => {
      const mockFindFirst = mockPrisma.taxApuration as { findFirst: ReturnType<typeof vi.fn> };
      mockFindFirst.findFirst.mockResolvedValue(null);

      await expect(
        service.closeApuration("comp-1", "ICMS", 2026, 1),
      ).rejects.toThrow("Apuração ICMS 1/2026 não encontrada");
    });

    it("deve lançar erro se apuração já fechada", async () => {
      const mockFindFirst = mockPrisma.taxApuration as { findFirst: ReturnType<typeof vi.fn> };
      mockFindFirst.findFirst.mockResolvedValue({
        id: "ap-1",
        status: "CLOSED",
        items: [],
        previousCredit: 0,
      });

      await expect(
        service.closeApuration("comp-1", "ICMS", 2026, 1),
      ).rejects.toThrow("Apuração já está fechada");
    });

    it("deve propagar crédito acumulado para próximo período", async () => {
      const apuration = {
        id: "ap-1",
        companyId: "comp-1",
        taxType: "ICMS",
        status: "OPEN",
        previousCredit: 0,
        items: [
          { taxValue: 3000, nature: "DEBIT" },
          { taxValue: 8000, nature: "CREDIT" },
        ],
      };

      const mockFindFirst = mockPrisma.taxApuration as { findFirst: ReturnType<typeof vi.fn> };
      // First call: find current apuration; Second call: find next period
      mockFindFirst.findFirst
        .mockResolvedValueOnce(apuration)
        .mockResolvedValueOnce({ id: "ap-next", companyId: "comp-1" });

      const mockUpdate = mockPrisma.taxApuration as { update: ReturnType<typeof vi.fn> };
      mockUpdate.update.mockResolvedValue({ ...apuration, status: "CLOSED" });

      await service.closeApuration("comp-1", "ICMS", 2026, 1);

      // Deve atualizar o próximo período com crédito acumulado de 5000
      expect(mockUpdate.update).toHaveBeenCalledTimes(2);
      expect(mockUpdate.update).toHaveBeenLastCalledWith({
        where: { id: "ap-next" },
        data: { previousCredit: 5000 },
      });
    });
  });

  describe("getApurationSummary", () => {
    it("deve retornar resumo de apurações", async () => {
      const mockFindMany = mockPrisma.taxApuration as { findMany: ReturnType<typeof vi.fn> };
      mockFindMany.findMany.mockResolvedValue([
        {
          taxType: "ICMS",
          previousCredit: 1000,
          items: [
            { taxValue: 5000, nature: "DEBIT" },
            { taxValue: 3000, nature: "CREDIT" },
          ],
        },
        {
          taxType: "PIS",
          previousCredit: 0,
          items: [
            { taxValue: 650, nature: "DEBIT" },
            { taxValue: 200, nature: "CREDIT" },
          ],
        },
      ]);

      const result = await service.getApurationSummary("comp-1", 2026, 1);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        taxType: "ICMS",
        debitTotal: 5000,
        creditTotal: 3000,
        balance: 1000,
        previousCredit: 1000,
        amountDue: 1000,
      });
      expect(result[1]).toEqual({
        taxType: "PIS",
        debitTotal: 650,
        creditTotal: 200,
        balance: 450,
        previousCredit: 0,
        amountDue: 450,
      });
    });
  });

  // --------------------------------------------------------------------------
  // DIFAL
  // --------------------------------------------------------------------------

  describe("calculateAndSaveDifal", () => {
    it("deve calcular e salvar DIFAL", async () => {
      const mockCreate = mockPrisma.difalCalculation as { create: ReturnType<typeof vi.fn> };
      mockCreate.create.mockImplementation(async (args: Record<string, unknown>) => {
        const data = args.data as Record<string, unknown>;
        return { id: "difal-1", ...data };
      });

      const result = await service.calculateAndSaveDifal("comp-1", {
        documentType: "NFE_SAIDA",
        ufOrigem: "SP",
        ufDestino: "BA",
        productValue: 1000,
        icmsOrigemRate: 18,
        icmsDestinoRate: 18,
      }) as Record<string, unknown>;

      expect(result.difalValue).toBe(110); // 18 - 7 = 11%
      expect(result.icmsInterRate).toBe(7); // SP → BA = 7%
      expect(mockCreate.create).toHaveBeenCalled();
    });
  });

  // --------------------------------------------------------------------------
  // NFS-e
  // --------------------------------------------------------------------------

  describe("createNfse", () => {
    it("deve criar NFS-e com cálculos automáticos", async () => {
      const mockFindFirst = mockPrisma.nfseIssued as { findFirst: ReturnType<typeof vi.fn> };
      mockFindFirst.findFirst.mockResolvedValue({ code: 42 });

      const mockCreate = mockPrisma.nfseIssued as { create: ReturnType<typeof vi.fn> };
      mockCreate.create.mockImplementation(async (args: Record<string, unknown>) => {
        const data = args.data as Record<string, unknown>;
        return { id: "nfse-1", ...data };
      });

      const result = await service.createNfse("comp-1", {
        customerId: "cust-1",
        serviceCode: "1.01",
        description: "Consultoria em TI",
        competenceDate: new Date("2026-01-15"),
        serviceValue: 10000,
        issRate: 5,
        pisRate: 0.65,
        cofinsRate: 3,
      }) as Record<string, unknown>;

      expect(result.code).toBe(43); // 42 + 1
      expect(result.issValue).toBe(500);
      expect(result.pisValue).toBe(65);
      expect(result.cofinsValue).toBe(300);
      expect(result.netValue).toBe(9635);
      expect(result.status).toBe("DRAFT");
    });

    it("deve iniciar código em 1 quando não há NFS-e anterior", async () => {
      const mockFindFirst = mockPrisma.nfseIssued as { findFirst: ReturnType<typeof vi.fn> };
      mockFindFirst.findFirst.mockResolvedValue(null);

      const mockCreate = mockPrisma.nfseIssued as { create: ReturnType<typeof vi.fn> };
      mockCreate.create.mockImplementation(async (args: Record<string, unknown>) => {
        const data = args.data as Record<string, unknown>;
        return { id: "nfse-1", ...data };
      });

      const result = await service.createNfse("comp-1", {
        customerId: "cust-1",
        serviceCode: "1.01",
        description: "Serviço",
        competenceDate: new Date("2026-01-15"),
        serviceValue: 5000,
        issRate: 2,
      }) as Record<string, unknown>;

      expect(result.code).toBe(1);
    });
  });

  // --------------------------------------------------------------------------
  // BLOCO K
  // --------------------------------------------------------------------------

  describe("generateBlocoKRecords", () => {
    it("deve gerar registros K230 e K235 a partir de ordens de produção", async () => {
      const mockDeleteMany = mockPrisma.blocoKRecord as { deleteMany: ReturnType<typeof vi.fn> };
      mockDeleteMany.deleteMany.mockResolvedValue({ count: 0 });

      const mockFindMany = mockPrisma.productionOrder as { findMany: ReturnType<typeof vi.fn> };
      mockFindMany.findMany.mockResolvedValue([
        {
          id: "po-1",
          materialId: "mat-1",
          material: { id: "mat-1" },
          producedQuantity: 100,
          completedAt: new Date("2026-01-15"),
          consumptions: [
            { materialId: "mat-2", material: { id: "mat-2" }, quantity: 50 },
            { materialId: "mat-3", material: { id: "mat-3" }, quantity: 30 },
          ],
        },
      ]);

      const mockCreate = mockPrisma.blocoKRecord as { create: ReturnType<typeof vi.fn> };
      mockCreate.create.mockImplementation(async (args: Record<string, unknown>) => {
        const data = args.data as Record<string, unknown>;
        return { id: `bk-${Math.random()}`, ...data };
      });

      const result = await service.generateBlocoKRecords("comp-1", 2026, 1);

      // 1 K230 (produção) + 2 K235 (consumos)
      expect(result).toHaveLength(3);
      expect(mockCreate.create).toHaveBeenCalledTimes(3);

      // Verifica K230
      const k230Call = mockCreate.create.mock.calls[0][0] as Record<string, unknown>;
      const k230Data = k230Call.data as Record<string, unknown>;
      expect(k230Data.recordType).toBe("K230");
      expect(k230Data.movementType).toBe("PRODUCTION");

      // Verifica K235
      const k235Call = mockCreate.create.mock.calls[1][0] as Record<string, unknown>;
      const k235Data = k235Call.data as Record<string, unknown>;
      expect(k235Data.recordType).toBe("K235");
      expect(k235Data.movementType).toBe("CONSUMPTION");
    });

    it("deve limpar registros pendentes antes de gerar novos", async () => {
      const mockDeleteMany = mockPrisma.blocoKRecord as { deleteMany: ReturnType<typeof vi.fn> };
      mockDeleteMany.deleteMany.mockResolvedValue({ count: 5 });

      const mockFindMany = mockPrisma.productionOrder as { findMany: ReturnType<typeof vi.fn> };
      mockFindMany.findMany.mockResolvedValue([]);

      const result = await service.generateBlocoKRecords("comp-1", 2026, 1);

      expect(result).toHaveLength(0);
      expect(mockDeleteMany.deleteMany).toHaveBeenCalledWith({
        where: { companyId: "comp-1", year: 2026, month: 1, status: "PENDING" },
      });
    });
  });

  // --------------------------------------------------------------------------
  // CALENDÁRIO FISCAL
  // --------------------------------------------------------------------------

  describe("getFiscalCalendar", () => {
    it("deve retornar calendário com status das obrigações existentes", async () => {
      const mockFindMany = mockPrisma.fiscalObligation as { findMany: ReturnType<typeof vi.fn> };
      mockFindMany.findMany.mockResolvedValue([
        { code: "SPED_FISCAL", status: "GENERATED" },
        { code: "GIA", status: "TRANSMITTED" },
      ]);

      const result = await service.getFiscalCalendar("comp-1", 2026, 1);

      expect(result).toHaveLength(OBLIGATION_DEFINITIONS.length);

      const spedFiscal = result.find(r => r.code === "SPED_FISCAL");
      expect(spedFiscal?.status).toBe("GENERATED");

      const gia = result.find(r => r.code === "GIA");
      expect(gia?.status).toBe("TRANSMITTED");

      const dctf = result.find(r => r.code === "DCTF");
      expect(dctf?.status).toBe("PENDING"); // Não existe, default
    });
  });
});
