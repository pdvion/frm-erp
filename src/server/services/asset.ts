/**
 * AssetService
 * Centraliza lógica de negócio do módulo de Patrimônio / Ativo Fixo.
 *
 * Funcionalidades:
 * - Cadastro de ativos imobilizados
 * - Cálculo de depreciação (linear, saldo decrescente, soma dos dígitos)
 * - Processamento mensal de depreciação em lote
 * - Baixa de ativos (venda, descarte, perda)
 * - Transferência entre locais/centros de custo
 * - Relatório de patrimônio
 *
 * @see VIO-1075
 */

import type { PrismaClient } from "@prisma/client";

// ==========================================================================
// TYPES
// ==========================================================================

export type AssetCategory =
  | "MACHINERY"
  | "VEHICLES"
  | "FURNITURE"
  | "IT_EQUIPMENT"
  | "BUILDINGS"
  | "LAND"
  | "OTHER";

export type AssetStatus = "ACTIVE" | "DISPOSED" | "TRANSFERRED" | "FULLY_DEPRECIATED";

export type DepreciationMethod = "STRAIGHT_LINE" | "DECLINING_BALANCE" | "SUM_OF_YEARS";

export type MovementType =
  | "ACQUISITION"
  | "DEPRECIATION"
  | "DISPOSAL"
  | "TRANSFER"
  | "REVALUATION"
  | "IMPAIRMENT";

export interface CreateAssetInput {
  companyId: string;
  name: string;
  description?: string | null;
  category: AssetCategory;
  acquisitionDate: Date;
  acquisitionValue: number;
  residualValue?: number;
  usefulLifeMonths: number;
  depreciationMethod?: DepreciationMethod;
  location?: string | null;
  responsibleId?: string | null;
  costCenterId?: string | null;
  supplier?: string | null;
  invoiceNumber?: string | null;
  serialNumber?: string | null;
  warrantyExpiry?: Date | null;
  notes?: string | null;
  createdBy?: string | null;
}

export interface DepreciationResult {
  assetId: string;
  assetName: string;
  period: Date;
  depreciationValue: number;
  accumulatedValue: number;
  netBookValue: number;
  rate: number;
}

export interface DisposalInput {
  assetId: string;
  disposalDate: Date;
  disposalValue: number;
  disposalReason: string;
  userId?: string | null;
}

export interface TransferInput {
  assetId: string;
  date: Date;
  toLocation?: string | null;
  toCostCenterId?: string | null;
  description: string;
  userId?: string | null;
}

export interface AssetSummary {
  totalAssets: number;
  totalAcquisitionValue: number;
  totalAccumulatedDepreciation: number;
  totalNetBookValue: number;
  byCategory: {
    category: string;
    count: number;
    acquisitionValue: number;
    accumulatedDepreciation: number;
    netBookValue: number;
  }[];
  byStatus: { status: string; count: number }[];
}

// ==========================================================================
// PURE FUNCTIONS
// ==========================================================================

/**
 * Calcula depreciação mensal pelo método linear
 * (Valor Aquisição - Valor Residual) / Vida Útil em meses
 */
export function calculateStraightLineDepreciation(
  acquisitionValue: number,
  residualValue: number,
  usefulLifeMonths: number,
): number {
  if (usefulLifeMonths <= 0) return 0;
  const depreciableBase = acquisitionValue - residualValue;
  if (depreciableBase <= 0) return 0;
  return Math.round((depreciableBase / usefulLifeMonths) * 100) / 100;
}

/**
 * Calcula depreciação mensal pelo método de saldo decrescente (declining balance)
 * Aplica taxa dobrada sobre o valor líquido contábil
 */
export function calculateDecliningBalanceDepreciation(
  netBookValue: number,
  residualValue: number,
  annualRate: number,
): number {
  if (netBookValue <= residualValue) return 0;
  const acceleratedRate = (annualRate * 2) / 12 / 100;
  const depreciation = Math.round(netBookValue * acceleratedRate * 100) / 100;
  // Não depreciar abaixo do valor residual
  const maxDepreciation = Math.round((netBookValue - residualValue) * 100) / 100;
  return Math.min(depreciation, maxDepreciation);
}

/**
 * Calcula depreciação mensal pelo método da soma dos dígitos dos anos
 */
export function calculateSumOfYearsDepreciation(
  acquisitionValue: number,
  residualValue: number,
  usefulLifeMonths: number,
  elapsedMonths: number,
): number {
  if (usefulLifeMonths <= 0) return 0;
  const depreciableBase = acquisitionValue - residualValue;
  if (depreciableBase <= 0) return 0;

  const usefulLifeYears = Math.ceil(usefulLifeMonths / 12);
  const sumOfYears = (usefulLifeYears * (usefulLifeYears + 1)) / 2;
  const currentYear = Math.floor(elapsedMonths / 12);
  const remainingYears = usefulLifeYears - currentYear;

  if (remainingYears <= 0) return 0;

  const annualDepreciation = (depreciableBase * remainingYears) / sumOfYears;
  return Math.round((annualDepreciation / 12) * 100) / 100;
}

/**
 * Calcula taxa anual de depreciação baseada na vida útil
 */
export function calculateAnnualRate(usefulLifeMonths: number): number {
  if (usefulLifeMonths <= 0) return 0;
  return Math.round((12 / usefulLifeMonths) * 100 * 10000) / 10000;
}

/**
 * Calcula taxa mensal a partir da taxa anual
 */
export function calculateMonthlyRate(annualRate: number): number {
  return Math.round((annualRate / 12) * 10000) / 10000;
}

/**
 * Retorna a vida útil padrão (em meses) por categoria de ativo (RFB)
 */
export function getDefaultUsefulLife(category: AssetCategory): number {
  switch (category) {
    case "BUILDINGS":
      return 300; // 25 anos
    case "MACHINERY":
      return 120; // 10 anos
    case "VEHICLES":
      return 60; // 5 anos
    case "FURNITURE":
      return 120; // 10 anos
    case "IT_EQUIPMENT":
      return 60; // 5 anos
    case "LAND":
      return 0; // Terrenos não depreciam
    case "OTHER":
      return 120; // 10 anos padrão
  }
}

/**
 * Calcula ganho/perda na baixa de um ativo
 */
export function calculateDisposalGainLoss(
  netBookValue: number,
  disposalValue: number,
): { gainLoss: number; type: "GAIN" | "LOSS" | "NEUTRAL" } {
  const gainLoss = Math.round((disposalValue - netBookValue) * 100) / 100;
  return {
    gainLoss,
    type: gainLoss > 0 ? "GAIN" : gainLoss < 0 ? "LOSS" : "NEUTRAL",
  };
}

// ==========================================================================
// SERVICE CLASS
// ==========================================================================

export class AssetService {
  constructor(private prisma: PrismaClient) {}

  // ========================================================================
  // CADASTRO
  // ========================================================================

  /**
   * Cria um novo ativo imobilizado
   */
  async createAsset(input: CreateAssetInput) {
    const annualRate = calculateAnnualRate(input.usefulLifeMonths);
    const residualValue = input.residualValue ?? 0;

    // Gerar próximo código
    const lastAsset = await this.prisma.fixedAsset.findFirst({
      where: { companyId: input.companyId },
      orderBy: { code: "desc" },
      select: { code: true },
    });
    const nextCode = (lastAsset?.code ?? 0) + 1;

    const asset = await this.prisma.fixedAsset.create({
      data: {
        companyId: input.companyId,
        code: nextCode,
        name: input.name,
        description: input.description ?? null,
        category: input.category,
        status: "ACTIVE",
        acquisitionDate: input.acquisitionDate,
        acquisitionValue: input.acquisitionValue,
        residualValue,
        usefulLifeMonths: input.usefulLifeMonths,
        depreciationMethod: input.depreciationMethod ?? "STRAIGHT_LINE",
        depreciationRate: annualRate,
        accumulatedDepr: 0,
        netBookValue: input.acquisitionValue,
        location: input.location ?? null,
        responsibleId: input.responsibleId ?? null,
        costCenterId: input.costCenterId ?? null,
        supplier: input.supplier ?? null,
        invoiceNumber: input.invoiceNumber ?? null,
        serialNumber: input.serialNumber ?? null,
        warrantyExpiry: input.warrantyExpiry ?? null,
        notes: input.notes ?? null,
        createdBy: input.createdBy ?? null,
      },
    });

    // Registrar movimento de aquisição
    await this.prisma.assetMovement.create({
      data: {
        assetId: asset.id,
        type: "ACQUISITION",
        date: input.acquisitionDate,
        value: input.acquisitionValue,
        description: `Aquisição: ${input.name}`,
        toLocation: input.location ?? null,
        toCostCenterId: input.costCenterId ?? null,
        createdBy: input.createdBy ?? null,
      },
    });

    return asset;
  }

  // ========================================================================
  // DEPRECIAÇÃO
  // ========================================================================

  /**
   * Calcula depreciação mensal de um ativo específico
   */
  calculateMonthlyDepreciation(
    method: DepreciationMethod,
    acquisitionValue: number,
    residualValue: number,
    usefulLifeMonths: number,
    netBookValue: number,
    annualRate: number,
    elapsedMonths: number,
  ): number {
    if (netBookValue <= residualValue) return 0;

    let depreciation: number;

    switch (method) {
      case "STRAIGHT_LINE":
        depreciation = calculateStraightLineDepreciation(
          acquisitionValue,
          residualValue,
          usefulLifeMonths,
        );
        break;
      case "DECLINING_BALANCE":
        depreciation = calculateDecliningBalanceDepreciation(
          netBookValue,
          residualValue,
          annualRate,
        );
        break;
      case "SUM_OF_YEARS":
        depreciation = calculateSumOfYearsDepreciation(
          acquisitionValue,
          residualValue,
          usefulLifeMonths,
          elapsedMonths,
        );
        break;
    }

    // Não depreciar abaixo do valor residual
    const maxDepreciation = Math.round((netBookValue - residualValue) * 100) / 100;
    return Math.min(depreciation, maxDepreciation);
  }

  /**
   * Processa depreciação mensal para todos os ativos ativos de uma empresa
   */
  async processMonthlyDepreciation(
    companyId: string,
    period: Date,
  ): Promise<DepreciationResult[]> {
    const assets = await this.prisma.fixedAsset.findMany({
      where: {
        companyId,
        status: "ACTIVE",
        category: { not: "LAND" }, // Terrenos não depreciam
      },
    });

    const results: DepreciationResult[] = [];

    for (const asset of assets) {
      const netBookValue = Number(asset.netBookValue);
      const residualValue = Number(asset.residualValue);
      const acquisitionValue = Number(asset.acquisitionValue);
      const annualRate = Number(asset.depreciationRate);

      if (netBookValue <= residualValue) continue;

      // Verificar se já depreciou neste período
      const existing = await this.prisma.assetDepreciation.findUnique({
        where: { assetId_period: { assetId: asset.id, period } },
      });
      if (existing) continue;

      // Calcular meses decorridos
      const acquisitionDate = new Date(asset.acquisitionDate);
      const elapsedMonths =
        (period.getFullYear() - acquisitionDate.getFullYear()) * 12 +
        (period.getMonth() - acquisitionDate.getMonth());

      if (elapsedMonths < 0) continue;

      const depreciationValue = this.calculateMonthlyDepreciation(
        asset.depreciationMethod as DepreciationMethod,
        acquisitionValue,
        residualValue,
        asset.usefulLifeMonths,
        netBookValue,
        annualRate,
        elapsedMonths,
      );

      if (depreciationValue <= 0) continue;

      const newAccumulated = Math.round((Number(asset.accumulatedDepr) + depreciationValue) * 100) / 100;
      const newNetBookValue = Math.round((acquisitionValue - newAccumulated) * 100) / 100;
      const monthlyRate = calculateMonthlyRate(annualRate);

      // Criar registro de depreciação
      await this.prisma.assetDepreciation.create({
        data: {
          assetId: asset.id,
          period,
          depreciationValue,
          accumulatedValue: newAccumulated,
          netBookValue: newNetBookValue,
          rate: monthlyRate,
        },
      });

      // Atualizar ativo
      const newStatus = newNetBookValue <= residualValue ? "FULLY_DEPRECIATED" : "ACTIVE";
      await this.prisma.fixedAsset.update({
        where: { id: asset.id },
        data: {
          accumulatedDepr: newAccumulated,
          netBookValue: newNetBookValue,
          status: newStatus,
        },
      });

      // Registrar movimento
      await this.prisma.assetMovement.create({
        data: {
          assetId: asset.id,
          type: "DEPRECIATION",
          date: period,
          value: depreciationValue,
          description: `Depreciação ${period.toISOString().slice(0, 7)}`,
        },
      });

      results.push({
        assetId: asset.id,
        assetName: asset.name,
        period,
        depreciationValue,
        accumulatedValue: newAccumulated,
        netBookValue: newNetBookValue,
        rate: monthlyRate,
      });
    }

    return results;
  }

  // ========================================================================
  // BAIXA
  // ========================================================================

  /**
   * Realiza baixa de um ativo (venda, descarte, perda)
   */
  async disposeAsset(input: DisposalInput) {
    const asset = await this.prisma.fixedAsset.findUnique({
      where: { id: input.assetId },
    });

    if (!asset) throw new Error("Ativo não encontrado");
    if (asset.status === "DISPOSED") throw new Error("Ativo já foi baixado");

    const netBookValue = Number(asset.netBookValue);
    const { gainLoss, type } = calculateDisposalGainLoss(netBookValue, input.disposalValue);

    // Atualizar ativo
    await this.prisma.fixedAsset.update({
      where: { id: input.assetId },
      data: {
        status: "DISPOSED",
        disposalDate: input.disposalDate,
        disposalValue: input.disposalValue,
        disposalReason: input.disposalReason,
      },
    });

    // Registrar movimento
    await this.prisma.assetMovement.create({
      data: {
        assetId: input.assetId,
        type: "DISPOSAL",
        date: input.disposalDate,
        value: input.disposalValue,
        description: `Baixa: ${input.disposalReason} (${type === "GAIN" ? "Ganho" : type === "LOSS" ? "Perda" : "Neutro"}: R$ ${Math.abs(gainLoss).toFixed(2)})`,
        createdBy: input.userId ?? null,
      },
    });

    return { asset, gainLoss, type };
  }

  // ========================================================================
  // TRANSFERÊNCIA
  // ========================================================================

  /**
   * Transfere ativo entre locais/centros de custo
   */
  async transferAsset(input: TransferInput) {
    const asset = await this.prisma.fixedAsset.findUnique({
      where: { id: input.assetId },
    });

    if (!asset) throw new Error("Ativo não encontrado");
    if (asset.status !== "ACTIVE" && asset.status !== "FULLY_DEPRECIATED") {
      throw new Error("Apenas ativos ativos ou totalmente depreciados podem ser transferidos");
    }

    const fromLocation = asset.location;
    const fromCostCenterId = asset.costCenterId;

    // Atualizar ativo
    await this.prisma.fixedAsset.update({
      where: { id: input.assetId },
      data: {
        location: input.toLocation ?? asset.location,
        costCenterId: input.toCostCenterId ?? asset.costCenterId,
      },
    });

    // Registrar movimento
    await this.prisma.assetMovement.create({
      data: {
        assetId: input.assetId,
        type: "TRANSFER",
        date: input.date,
        value: Number(asset.netBookValue),
        description: input.description,
        fromLocation,
        toLocation: input.toLocation ?? null,
        fromCostCenterId,
        toCostCenterId: input.toCostCenterId ?? null,
        createdBy: input.userId ?? null,
      },
    });

    return asset;
  }

  // ========================================================================
  // RELATÓRIOS
  // ========================================================================

  /**
   * Gera resumo do patrimônio da empresa
   */
  async getSummary(companyId: string): Promise<AssetSummary> {
    const assets = await this.prisma.fixedAsset.findMany({
      where: { companyId },
      select: {
        category: true,
        status: true,
        acquisitionValue: true,
        accumulatedDepr: true,
        netBookValue: true,
      },
    });

    let totalAcquisitionValue = 0;
    let totalAccumulatedDepreciation = 0;
    let totalNetBookValue = 0;

    const categoryMap = new Map<string, { count: number; acq: number; dep: number; net: number }>();
    const statusMap = new Map<string, number>();

    for (const asset of assets) {
      const acq = Number(asset.acquisitionValue);
      const dep = Number(asset.accumulatedDepr);
      const net = Number(asset.netBookValue);

      totalAcquisitionValue += acq;
      totalAccumulatedDepreciation += dep;
      totalNetBookValue += net;

      const cat = categoryMap.get(asset.category) || { count: 0, acq: 0, dep: 0, net: 0 };
      cat.count++;
      cat.acq += acq;
      cat.dep += dep;
      cat.net += net;
      categoryMap.set(asset.category, cat);

      statusMap.set(asset.status, (statusMap.get(asset.status) || 0) + 1);
    }

    return {
      totalAssets: assets.length,
      totalAcquisitionValue: Math.round(totalAcquisitionValue * 100) / 100,
      totalAccumulatedDepreciation: Math.round(totalAccumulatedDepreciation * 100) / 100,
      totalNetBookValue: Math.round(totalNetBookValue * 100) / 100,
      byCategory: Array.from(categoryMap.entries()).map(([category, data]) => ({
        category,
        count: data.count,
        acquisitionValue: Math.round(data.acq * 100) / 100,
        accumulatedDepreciation: Math.round(data.dep * 100) / 100,
        netBookValue: Math.round(data.net * 100) / 100,
      })),
      byStatus: Array.from(statusMap.entries()).map(([status, count]) => ({ status, count })),
    };
  }
}
