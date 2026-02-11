/**
 * Serviço Fiscal Completo
 * @see VIO-1077 - Fiscal Completo (eSocial, EFD-Reinf, NFS-e, DIFAL/ST, Bloco K)
 */

import type { PrismaClient } from "@prisma/client";

// ============================================================================
// TIPOS
// ============================================================================

export interface ObligationDef {
  code: string;
  name: string;
  /** Dia de vencimento no mês seguinte (0 = mesmo mês) */
  dueDay: number;
  /** Meses de offset para o vencimento (1 = mês seguinte) */
  dueMonthOffset: number;
}

export interface DifalInput {
  productValue: number;
  icmsOrigemRate: number;
  icmsDestinoRate: number;
  icmsInterRate: number;
  fcpRate?: number;
}

export interface DifalResult {
  difalValue: number;
  difalOrigem: number;
  difalDestino: number;
  fcp: number;
  totalDue: number;
}

export interface IcmsStInput {
  productValue: number;
  icmsRate: number;
  mva: number;
  icmsStInternalRate: number;
  reductionBase?: number;
}

export interface IcmsStResult {
  icmsStBase: number;
  icmsOwn: number;
  icmsStValue: number;
}

export interface NfseCalculationInput {
  serviceValue: number;
  deductionValue?: number;
  issRate: number;
  issWithheld?: boolean;
  pisRate?: number;
  cofinsRate?: number;
  irRate?: number;
  csllRate?: number;
  inssRate?: number;
}

export interface NfseCalculationResult {
  baseValue: number;
  issValue: number;
  pisValue: number;
  cofinsValue: number;
  irValue: number;
  csllValue: number;
  inssValue: number;
  totalDeductions: number;
  netValue: number;
}

export interface ApurationSummary {
  taxType: string;
  debitTotal: number;
  creditTotal: number;
  balance: number;
  previousCredit: number;
  amountDue: number;
}

export interface FiscalCalendarItem {
  code: string;
  name: string;
  year: number;
  month: number;
  dueDate: Date;
  status: string;
}

// ============================================================================
// CONSTANTES
// ============================================================================

/** Obrigações acessórias brasileiras padrão */
export const OBLIGATION_DEFINITIONS: ObligationDef[] = [
  { code: "SPED_FISCAL", name: "SPED Fiscal (EFD ICMS/IPI)", dueDay: 20, dueMonthOffset: 1 },
  { code: "SPED_CONTRIBUICOES", name: "SPED Contribuições (PIS/COFINS)", dueDay: 10, dueMonthOffset: 2 },
  { code: "EFD_REINF", name: "EFD-Reinf", dueDay: 15, dueMonthOffset: 1 },
  { code: "ESOCIAL", name: "eSocial", dueDay: 15, dueMonthOffset: 1 },
  { code: "DCTF", name: "DCTF", dueDay: 15, dueMonthOffset: 2 },
  { code: "GIA", name: "GIA (SP)", dueDay: 15, dueMonthOffset: 1 },
  { code: "SINTEGRA", name: "SINTEGRA", dueDay: 15, dueMonthOffset: 1 },
  { code: "DIRF", name: "DIRF", dueDay: 28, dueMonthOffset: 2 },
  { code: "ECF", name: "ECF (Escrituração Contábil Fiscal)", dueDay: 31, dueMonthOffset: 7 },
  { code: "ECD", name: "ECD (Escrituração Contábil Digital)", dueDay: 31, dueMonthOffset: 5 },
];

/** Alíquotas interestaduais de ICMS por UF de origem */
export const ICMS_INTERSTATE_RATES: Record<string, Record<string, number>> = {
  // Origem Sul/Sudeste (exceto ES) → destino
  SP: { DEFAULT: 12, NORTH_NORTHEAST: 7 },
  RJ: { DEFAULT: 12, NORTH_NORTHEAST: 7 },
  MG: { DEFAULT: 12, NORTH_NORTHEAST: 7 },
  PR: { DEFAULT: 12, NORTH_NORTHEAST: 7 },
  SC: { DEFAULT: 12, NORTH_NORTHEAST: 7 },
  RS: { DEFAULT: 12, NORTH_NORTHEAST: 7 },
  // Demais estados
  DEFAULT: { DEFAULT: 12, NORTH_NORTHEAST: 12 },
};

const NORTH_NORTHEAST_STATES = new Set([
  "AC", "AL", "AM", "AP", "BA", "CE", "ES", "GO", "MA", "MS", "MT",
  "PA", "PB", "PE", "PI", "RN", "RO", "RR", "SE", "TO", "DF",
]);

// ============================================================================
// PURE FUNCTIONS
// ============================================================================

/**
 * Calcula DIFAL (Diferencial de Alíquota) para operações interestaduais
 */
export function calculateDifal(input: DifalInput): DifalResult {
  const { productValue, icmsDestinoRate, icmsInterRate, fcpRate = 0 } = input;

  const difalValue = productValue * (icmsDestinoRate - icmsInterRate) / 100;
  const fcp = productValue * fcpRate / 100;

  // Desde 2019, 100% do DIFAL vai para o destino
  const difalOrigem = 0;
  const difalDestino = difalValue;

  return {
    difalValue: round2(Math.max(0, difalValue)),
    difalOrigem: round2(difalOrigem),
    difalDestino: round2(Math.max(0, difalDestino)),
    fcp: round2(fcp),
    totalDue: round2(Math.max(0, difalValue) + fcp),
  };
}

/**
 * Calcula ICMS-ST (Substituição Tributária)
 */
export function calculateIcmsSt(input: IcmsStInput): IcmsStResult {
  const { productValue, icmsRate, mva, icmsStInternalRate, reductionBase = 100 } = input;

  const icmsOwn = productValue * icmsRate / 100;
  const stBase = productValue * (1 + mva / 100) * (reductionBase / 100);
  const icmsStTotal = stBase * icmsStInternalRate / 100;
  const icmsStValue = Math.max(0, icmsStTotal - icmsOwn);

  return {
    icmsStBase: round2(stBase),
    icmsOwn: round2(icmsOwn),
    icmsStValue: round2(icmsStValue),
  };
}

/**
 * Calcula impostos de NFS-e (Nota Fiscal de Serviço eletrônica)
 */
export function calculateNfse(input: NfseCalculationInput): NfseCalculationResult {
  const {
    serviceValue,
    deductionValue = 0,
    issRate,
    issWithheld = false,
    pisRate = 0,
    cofinsRate = 0,
    irRate = 0,
    csllRate = 0,
    inssRate = 0,
  } = input;

  const baseValue = serviceValue - deductionValue;
  const issValue = round2(baseValue * issRate / 100);
  const pisValue = round2(baseValue * pisRate / 100);
  const cofinsValue = round2(baseValue * cofinsRate / 100);
  const irValue = round2(baseValue * irRate / 100);
  const csllValue = round2(baseValue * csllRate / 100);
  const inssValue = round2(baseValue * inssRate / 100);

  const totalDeductions = pisValue + cofinsValue + irValue + csllValue + inssValue
    + (issWithheld ? issValue : 0);

  const netValue = round2(serviceValue - totalDeductions);

  return {
    baseValue: round2(baseValue),
    issValue,
    pisValue,
    cofinsValue,
    irValue,
    csllValue,
    inssValue,
    totalDeductions: round2(totalDeductions),
    netValue,
  };
}

/**
 * Determina a alíquota interestadual de ICMS entre duas UFs
 */
export function getInterstateRate(ufOrigem: string, ufDestino: string): number {
  if (ufOrigem === ufDestino) return 0;

  const originRates = ICMS_INTERSTATE_RATES[ufOrigem] || ICMS_INTERSTATE_RATES.DEFAULT;
  const isNorthNortheast = NORTH_NORTHEAST_STATES.has(ufDestino);

  return isNorthNortheast
    ? (originRates.NORTH_NORTHEAST ?? 12)
    : (originRates.DEFAULT ?? 12);
}

/**
 * Calcula a data de vencimento de uma obrigação acessória
 */
export function calculateObligationDueDate(
  year: number,
  month: number,
  dueDay: number,
  dueMonthOffset: number,
): Date {
  let targetMonth = month - 1 + dueMonthOffset; // JS months are 0-indexed
  let targetYear = year;

  while (targetMonth > 11) {
    targetMonth -= 12;
    targetYear++;
  }

  // Clamp day to last day of month
  const lastDay = new Date(targetYear, targetMonth + 1, 0).getDate();
  const day = Math.min(dueDay, lastDay);

  return new Date(targetYear, targetMonth, day);
}

/**
 * Calcula o saldo da apuração: débito - crédito - crédito anterior
 */
export function calculateApurationBalance(
  debitValue: number,
  creditValue: number,
  previousCredit: number,
): { balance: number; amountDue: number; carryForwardCredit: number } {
  const balance = debitValue - creditValue - previousCredit;

  if (balance > 0) {
    return { balance: round2(balance), amountDue: round2(balance), carryForwardCredit: 0 };
  }

  return { balance: round2(balance), amountDue: 0, carryForwardCredit: round2(Math.abs(balance)) };
}

/**
 * Gera o calendário fiscal para um ano/mês
 */
export function generateFiscalCalendar(year: number, month: number): FiscalCalendarItem[] {
  return OBLIGATION_DEFINITIONS.map(def => ({
    code: def.code,
    name: def.name,
    year,
    month,
    dueDate: calculateObligationDueDate(year, month, def.dueDay, def.dueMonthOffset),
    status: "PENDING",
  }));
}

/** Arredonda para 2 casas decimais */
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

// ============================================================================
// FISCAL SERVICE (CLASS)
// ============================================================================

export class FiscalService {
  constructor(private readonly prisma: PrismaClient) {}

  // --------------------------------------------------------------------------
  // OBRIGAÇÕES ACESSÓRIAS
  // --------------------------------------------------------------------------

  /**
   * Gera obrigações acessórias para um período
   */
  async generateObligations(
    companyId: string,
    year: number,
    month: number,
    codes?: string[],
  ) {
    const defs = codes
      ? OBLIGATION_DEFINITIONS.filter(d => codes.includes(d.code))
      : OBLIGATION_DEFINITIONS;

    const results = [];

    for (const def of defs) {
      const dueDate = calculateObligationDueDate(year, month, def.dueDay, def.dueMonthOffset);

      const existing = await (this.prisma as unknown as { fiscalObligation: { findFirst: (args: Record<string, unknown>) => Promise<unknown> } }).fiscalObligation.findFirst({
        where: { companyId, code: def.code, year, month },
      });

      if (existing) {
        results.push(existing);
        continue;
      }

      const created = await (this.prisma as unknown as { fiscalObligation: { create: (args: Record<string, unknown>) => Promise<unknown> } }).fiscalObligation.create({
        data: {
          companyId,
          code: def.code,
          name: def.name,
          year,
          month,
          dueDate,
          status: "PENDING",
        },
      });

      results.push(created);
    }

    return results;
  }

  /**
   * Atualiza status de uma obrigação
   */
  async updateObligationStatus(
    id: string,
    companyId: string,
    status: string,
    extra?: { receiptNumber?: string; fileName?: string; fileContent?: string; errorMessage?: string },
  ) {
    const obligation = await (this.prisma as unknown as { fiscalObligation: { findFirst: (args: Record<string, unknown>) => Promise<Record<string, unknown> | null> } }).fiscalObligation.findFirst({
      where: { id, companyId },
    });

    if (!obligation) {
      throw new Error("Obrigação fiscal não encontrada");
    }

    return (this.prisma as unknown as { fiscalObligation: { update: (args: Record<string, unknown>) => Promise<unknown> } }).fiscalObligation.update({
      where: { id },
      data: {
        status,
        ...(status === "TRANSMITTED" && { transmittedAt: new Date() }),
        ...extra,
      },
    });
  }

  // --------------------------------------------------------------------------
  // APURAÇÃO DE IMPOSTOS
  // --------------------------------------------------------------------------

  /**
   * Cria ou obtém apuração de imposto para um período
   */
  async getOrCreateApuration(companyId: string, taxType: string, year: number, month: number) {
    const existing = await (this.prisma as unknown as { taxApuration: { findFirst: (args: Record<string, unknown>) => Promise<unknown> } }).taxApuration.findFirst({
      where: { companyId, taxType, year, month },
      include: { items: true },
    });

    if (existing) return existing;

    return (this.prisma as unknown as { taxApuration: { create: (args: Record<string, unknown>) => Promise<unknown> } }).taxApuration.create({
      data: { companyId, taxType, year, month, status: "OPEN" },
      include: { items: true },
    });
  }

  /**
   * Adiciona item à apuração (débito ou crédito)
   */
  async addApurationItem(
    apurationId: string,
    item: {
      documentType: string;
      documentId?: string;
      documentNumber?: string;
      cfop?: string;
      baseValue: number;
      rate: number;
      taxValue: number;
      nature: "CREDIT" | "DEBIT";
      description?: string;
    },
  ) {
    return (this.prisma as unknown as { taxApurationItem: { create: (args: Record<string, unknown>) => Promise<unknown> } }).taxApurationItem.create({
      data: {
        apurationId,
        ...item,
      },
    });
  }

  /**
   * Calcula e fecha a apuração de um período
   */
  async closeApuration(companyId: string, taxType: string, year: number, month: number) {
    const apuration = await (this.prisma as unknown as { taxApuration: { findFirst: (args: Record<string, unknown>) => Promise<Record<string, unknown> | null> } }).taxApuration.findFirst({
      where: { companyId, taxType, year, month },
      include: { items: true },
    });

    if (!apuration) {
      throw new Error(`Apuração ${taxType} ${month}/${year} não encontrada`);
    }

    if ((apuration as Record<string, unknown>).status === "CLOSED") {
      throw new Error("Apuração já está fechada");
    }

    const items = (apuration as Record<string, unknown>).items as Array<Record<string, unknown>>;

    let debitValue = 0;
    let creditValue = 0;

    for (const item of items) {
      const val = Number(item.taxValue);
      if (item.nature === "DEBIT") debitValue += val;
      else creditValue += val;
    }

    const previousCredit = Number((apuration as Record<string, unknown>).previousCredit) || 0;
    const { balance, amountDue, carryForwardCredit } = calculateApurationBalance(
      debitValue,
      creditValue,
      previousCredit,
    );

    const updated = await (this.prisma as unknown as { taxApuration: { update: (args: Record<string, unknown>) => Promise<unknown> } }).taxApuration.update({
      where: { id: (apuration as Record<string, unknown>).id as string },
      data: {
        debitValue: round2(debitValue),
        creditValue: round2(creditValue),
        balanceValue: balance,
        amountDue,
        status: "CLOSED",
      },
      include: { items: true },
    });

    // Propagar crédito acumulado para o próximo período
    if (carryForwardCredit > 0) {
      let nextMonth = month + 1;
      let nextYear = year;
      if (nextMonth > 12) { nextMonth = 1; nextYear++; }

      const nextApuration = await (this.prisma as unknown as { taxApuration: { findFirst: (args: Record<string, unknown>) => Promise<Record<string, unknown> | null> } }).taxApuration.findFirst({
        where: { companyId, taxType, year: nextYear, month: nextMonth },
      });

      if (nextApuration) {
        await (this.prisma as unknown as { taxApuration: { update: (args: Record<string, unknown>) => Promise<unknown> } }).taxApuration.update({
          where: { id: nextApuration.id as string },
          data: { previousCredit: carryForwardCredit },
        });
      }
    }

    return updated;
  }

  /**
   * Retorna resumo de apurações para um período
   */
  async getApurationSummary(companyId: string, year: number, month: number): Promise<ApurationSummary[]> {
    const apurations = await (this.prisma as unknown as { taxApuration: { findMany: (args: Record<string, unknown>) => Promise<Array<Record<string, unknown>>> } }).taxApuration.findMany({
      where: { companyId, year, month },
      include: { items: true },
    });

    return apurations.map((ap: Record<string, unknown>) => {
      const items = ap.items as Array<Record<string, unknown>>;
      let debitTotal = 0;
      let creditTotal = 0;

      for (const item of items) {
        const val = Number(item.taxValue);
        if (item.nature === "DEBIT") debitTotal += val;
        else creditTotal += val;
      }

      const previousCredit = Number(ap.previousCredit) || 0;
      const { balance, amountDue } = calculateApurationBalance(debitTotal, creditTotal, previousCredit);

      return {
        taxType: ap.taxType as string,
        debitTotal: round2(debitTotal),
        creditTotal: round2(creditTotal),
        balance,
        previousCredit,
        amountDue,
      };
    });
  }

  // --------------------------------------------------------------------------
  // DIFAL
  // --------------------------------------------------------------------------

  /**
   * Calcula e persiste DIFAL para um documento
   */
  async calculateAndSaveDifal(
    companyId: string,
    params: {
      documentType: string;
      documentId?: string;
      documentNumber?: string;
      ufOrigem: string;
      ufDestino: string;
      productValue: number;
      icmsOrigemRate: number;
      icmsDestinoRate: number;
      fcpRate?: number;
    },
  ) {
    const icmsInterRate = getInterstateRate(params.ufOrigem, params.ufDestino);

    const result = calculateDifal({
      productValue: params.productValue,
      icmsOrigemRate: params.icmsOrigemRate,
      icmsDestinoRate: params.icmsDestinoRate,
      icmsInterRate,
      fcpRate: params.fcpRate,
    });

    return (this.prisma as unknown as { difalCalculation: { create: (args: Record<string, unknown>) => Promise<unknown> } }).difalCalculation.create({
      data: {
        companyId,
        documentType: params.documentType,
        documentId: params.documentId ?? null,
        documentNumber: params.documentNumber ?? null,
        ufOrigem: params.ufOrigem,
        ufDestino: params.ufDestino,
        productValue: params.productValue,
        icmsOrigemRate: params.icmsOrigemRate,
        icmsDestinoRate: params.icmsDestinoRate,
        icmsInterRate,
        fcp: result.fcp,
        difalValue: result.difalValue,
        difalOrigem: result.difalOrigem,
        difalDestino: result.difalDestino,
      },
    });
  }

  // --------------------------------------------------------------------------
  // NFS-e
  // --------------------------------------------------------------------------

  /**
   * Cria uma NFS-e com cálculos automáticos
   */
  async createNfse(
    companyId: string,
    params: {
      customerId: string;
      serviceCode: string;
      cnae?: string;
      description: string;
      competenceDate: Date;
      serviceValue: number;
      deductionValue?: number;
      issRate: number;
      issWithheld?: boolean;
      pisRate?: number;
      cofinsRate?: number;
      irRate?: number;
      csllRate?: number;
      inssRate?: number;
      createdBy?: string;
    },
  ) {
    const calc = calculateNfse({
      serviceValue: params.serviceValue,
      deductionValue: params.deductionValue,
      issRate: params.issRate,
      issWithheld: params.issWithheld,
      pisRate: params.pisRate,
      cofinsRate: params.cofinsRate,
      irRate: params.irRate,
      csllRate: params.csllRate,
      inssRate: params.inssRate,
    });

    // Gerar próximo código
    const lastNfse = await (this.prisma as unknown as { nfseIssued: { findFirst: (args: Record<string, unknown>) => Promise<Record<string, unknown> | null> } }).nfseIssued.findFirst({
      where: { companyId },
      orderBy: { code: "desc" },
      select: { code: true },
    });

    const nextCode = lastNfse ? (lastNfse.code as number) + 1 : 1;

    return (this.prisma as unknown as { nfseIssued: { create: (args: Record<string, unknown>) => Promise<unknown> } }).nfseIssued.create({
      data: {
        companyId,
        code: nextCode,
        customerId: params.customerId,
        serviceCode: params.serviceCode,
        cnae: params.cnae ?? null,
        description: params.description,
        competenceDate: params.competenceDate,
        serviceValue: params.serviceValue,
        deductionValue: params.deductionValue ?? 0,
        baseValue: calc.baseValue,
        issRate: params.issRate,
        issValue: calc.issValue,
        issWithheld: params.issWithheld ?? false,
        pisValue: calc.pisValue,
        cofinsValue: calc.cofinsValue,
        irValue: calc.irValue,
        csllValue: calc.csllValue,
        inssValue: calc.inssValue,
        netValue: calc.netValue,
        status: "DRAFT",
        createdBy: params.createdBy ?? null,
      },
    });
  }

  // --------------------------------------------------------------------------
  // BLOCO K
  // --------------------------------------------------------------------------

  /**
   * Gera registros do Bloco K a partir de ordens de produção do período
   */
  async generateBlocoKRecords(companyId: string, year: number, month: number) {
    // Limpar registros anteriores pendentes
    await (this.prisma as unknown as { blocoKRecord: { deleteMany: (args: Record<string, unknown>) => Promise<unknown> } }).blocoKRecord.deleteMany({
      where: { companyId, year, month, status: "PENDING" },
    });

    // Buscar ordens de produção do período
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const productionOrders = await (this.prisma as unknown as { productionOrder: { findMany: (args: Record<string, unknown>) => Promise<Array<Record<string, unknown>>> } }).productionOrder.findMany({
      where: {
        companyId,
        status: "COMPLETED",
        completedAt: { gte: startDate, lte: endDate },
      },
      include: {
        material: true,
        consumptions: { include: { material: true } },
      },
    });

    const records = [];

    for (const order of productionOrders) {
      // K230 - Itens produzidos
      const produced = await (this.prisma as unknown as { blocoKRecord: { create: (args: Record<string, unknown>) => Promise<unknown> } }).blocoKRecord.create({
        data: {
          companyId,
          year,
          month,
          recordType: "K230",
          materialId: (order.material as Record<string, unknown>)?.id as string ?? (order as Record<string, unknown>).materialId as string,
          quantity: (order as Record<string, unknown>).producedQuantity as number ?? (order as Record<string, unknown>).quantity as number,
          productionOrderId: (order as Record<string, unknown>).id as string,
          movementDate: (order as Record<string, unknown>).completedAt as Date,
          movementType: "PRODUCTION",
          status: "PENDING",
        },
      });
      records.push(produced);

      // K235 - Insumos consumidos
      const consumptions = (order as Record<string, unknown>).consumptions as Array<Record<string, unknown>> | undefined;
      if (consumptions) {
        for (const consumption of consumptions) {
          const consumed = await (this.prisma as unknown as { blocoKRecord: { create: (args: Record<string, unknown>) => Promise<unknown> } }).blocoKRecord.create({
            data: {
              companyId,
              year,
              month,
              recordType: "K235",
              materialId: (consumption.material as Record<string, unknown>)?.id as string ?? consumption.materialId as string,
              quantity: consumption.quantity as number,
              productionOrderId: (order as Record<string, unknown>).id as string,
              movementDate: (order as Record<string, unknown>).completedAt as Date,
              movementType: "CONSUMPTION",
              status: "PENDING",
            },
          });
          records.push(consumed);
        }
      }
    }

    return records;
  }

  // --------------------------------------------------------------------------
  // CALENDÁRIO FISCAL
  // --------------------------------------------------------------------------

  /**
   * Retorna calendário fiscal com status das obrigações
   */
  async getFiscalCalendar(companyId: string, year: number, month: number): Promise<FiscalCalendarItem[]> {
    const calendar = generateFiscalCalendar(year, month);

    const obligations = await (this.prisma as unknown as { fiscalObligation: { findMany: (args: Record<string, unknown>) => Promise<Array<Record<string, unknown>>> } }).fiscalObligation.findMany({
      where: { companyId, year, month },
    });

    const statusMap = new Map<string, string>();
    for (const ob of obligations) {
      statusMap.set(ob.code as string, ob.status as string);
    }

    return calendar.map(item => ({
      ...item,
      status: statusMap.get(item.code) || "PENDING",
    }));
  }
}
