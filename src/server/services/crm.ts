/**
 * CrmService
 * Centraliza lógica de negócio do CRM Avançado.
 *
 * Funcionalidades:
 * - Pipelines configuráveis com estágios
 * - Oportunidades (deals) com tracking de valor e probabilidade
 * - Lead scoring automático baseado em regras
 * - Forecasting por período/vendedor/pipeline
 * - Comunicação (log de interações)
 *
 * @see VIO-1076
 */

import type { PrismaClient } from "@prisma/client";

// ==========================================================================
// TYPES
// ==========================================================================

export interface PipelineStage {
  order: number;
  name: string;
  probability: number; // 0-100
}

export interface CreateOpportunityInput {
  companyId: string;
  title: string;
  customerId: string;
  pipelineId: string;
  stage: string;
  value: number;
  probability?: number;
  expectedCloseDate?: Date | null;
  leadId?: string | null;
  assignedTo?: string | null;
  notes?: string | null;
  createdBy?: string | null;
}

export interface MoveOpportunityInput {
  opportunityId: string;
  newStage: string;
  probability?: number;
}

export interface WinOpportunityInput {
  opportunityId: string;
}

export interface LoseOpportunityInput {
  opportunityId: string;
  lostReason: string;
}

export interface ScoringRuleInput {
  companyId: string;
  name: string;
  field: string;
  operator: string;
  value: string;
  score: number;
}

export interface ForecastResult {
  period: string; // YYYY-MM
  pipeline: string;
  totalValue: number;
  weightedValue: number;
  count: number;
  byStage: {
    stage: string;
    value: number;
    weightedValue: number;
    count: number;
  }[];
}

export interface SalesPerformance {
  userId: string;
  userName: string;
  wonCount: number;
  wonValue: number;
  lostCount: number;
  lostValue: number;
  openCount: number;
  openValue: number;
  winRate: number;
  avgDealSize: number;
  targetValue: number;
  actualValue: number;
  targetAchievement: number;
}

// ==========================================================================
// PURE FUNCTIONS
// ==========================================================================

/**
 * Calcula valor ponderado de uma oportunidade (valor * probabilidade / 100)
 */
export function calculateWeightedValue(value: number, probability: number): number {
  return Math.round((value * probability) / 100 * 100) / 100;
}

/**
 * Calcula win rate (oportunidades ganhas / total fechadas)
 */
export function calculateWinRate(won: number, lost: number): number {
  const total = won + lost;
  if (total === 0) return 0;
  return Math.round((won / total) * 100 * 100) / 100;
}

/**
 * Calcula atingimento de meta (actual / target * 100)
 */
export function calculateTargetAchievement(actual: number, target: number): number {
  if (target === 0) return 0;
  return Math.round((actual / target) * 100 * 100) / 100;
}

/**
 * Avalia uma regra de scoring contra um valor de campo do lead
 */
export function evaluateScoringRule(
  fieldValue: string | number | null | undefined,
  operator: string,
  ruleValue: string,
): boolean {
  if (fieldValue === null || fieldValue === undefined) return false;

  const strValue = String(fieldValue).toLowerCase();
  const ruleStr = ruleValue.toLowerCase();

  switch (operator) {
    case "EQUALS":
      return strValue === ruleStr;
    case "NOT_EQUALS":
      return strValue !== ruleStr;
    case "CONTAINS":
      return strValue.includes(ruleStr);
    case "GREATER_THAN":
      return Number(fieldValue) > Number(ruleValue);
    case "LESS_THAN":
      return Number(fieldValue) < Number(ruleValue);
    case "GREATER_EQUAL":
      return Number(fieldValue) >= Number(ruleValue);
    case "LESS_EQUAL":
      return Number(fieldValue) <= Number(ruleValue);
    case "IN": {
      try {
        const list = JSON.parse(ruleValue) as string[];
        return list.map((v) => v.toLowerCase()).includes(strValue);
      } catch {
        return ruleStr.split(",").map((v) => v.trim()).includes(strValue);
      }
    }
    default:
      return false;
  }
}

/**
 * Calcula score total de um lead baseado em regras
 */
export function calculateLeadScore(
  lead: Record<string, unknown>,
  rules: { field: string; operator: string; value: string; score: number }[],
): number {
  let totalScore = 0;
  for (const rule of rules) {
    const fieldValue = lead[rule.field] as string | number | null | undefined;
    if (evaluateScoringRule(fieldValue, rule.operator, rule.value)) {
      totalScore += rule.score;
    }
  }
  return Math.max(0, Math.min(100, totalScore)); // Clamp 0-100
}

/**
 * Gera pipeline padrão com estágios comuns
 */
export function getDefaultPipelineStages(): PipelineStage[] {
  return [
    { order: 1, name: "Prospecção", probability: 10 },
    { order: 2, name: "Qualificação", probability: 25 },
    { order: 3, name: "Proposta", probability: 50 },
    { order: 4, name: "Negociação", probability: 75 },
    { order: 5, name: "Fechamento", probability: 90 },
  ];
}

// ==========================================================================
// SERVICE CLASS
// ==========================================================================

export class CrmService {
  constructor(private prisma: PrismaClient) {}

  // ========================================================================
  // PIPELINES
  // ========================================================================

  /**
   * Cria pipeline com estágios padrão ou customizados
   */
  async createPipeline(
    companyId: string,
    name: string,
    description?: string | null,
    stages?: PipelineStage[],
  ) {
    const pipelineStages = stages ?? getDefaultPipelineStages();

    // Transação para evitar race condition no isDefault
    return this.prisma.$transaction(async (tx) => {
      const existingCount = await tx.salesPipeline.count({
        where: { companyId },
      });

      return tx.salesPipeline.create({
        data: {
          companyId,
          name,
          description: description ?? null,
          isDefault: existingCount === 0,
          stages: JSON.parse(JSON.stringify(pipelineStages)),
        },
      });
    });
  }

  // ========================================================================
  // OPORTUNIDADES
  // ========================================================================

  /**
   * Cria uma nova oportunidade no pipeline
   */
  async createOpportunity(input: CreateOpportunityInput) {
    // Transação para evitar race condition no nextCode
    return this.prisma.$transaction(async (tx) => {
      const lastOpp = await tx.opportunity.findFirst({
        where: { companyId: input.companyId },
        orderBy: { code: "desc" },
        select: { code: true },
      });
      const nextCode = (lastOpp?.code ?? 0) + 1;

      // Buscar probabilidade do estágio no pipeline
      const pipeline = await tx.salesPipeline.findUnique({
        where: { id: input.pipelineId },
        select: { stages: true },
      });

      let probability = input.probability ?? 50;
      if (pipeline?.stages) {
        const stages = pipeline.stages as unknown as PipelineStage[];
        const stageConfig = stages.find((s) => s.name === input.stage);
        if (stageConfig && !input.probability) {
          probability = stageConfig.probability;
        }
      }

      return tx.opportunity.create({
        data: {
          companyId: input.companyId,
          code: nextCode,
          title: input.title,
          customerId: input.customerId,
          pipelineId: input.pipelineId,
          stage: input.stage,
          value: input.value,
          probability,
          expectedCloseDate: input.expectedCloseDate ?? null,
          status: "OPEN",
          leadId: input.leadId ?? null,
          assignedTo: input.assignedTo ?? null,
          notes: input.notes ?? null,
          createdBy: input.createdBy ?? null,
        },
      });
    });
  }

  /**
   * Move oportunidade para outro estágio do pipeline
   */
  async moveOpportunity(input: MoveOpportunityInput & { companyId: string }) {
    const opp = await this.prisma.opportunity.findFirst({
      where: { id: input.opportunityId, companyId: input.companyId },
      include: { pipeline: { select: { stages: true } } },
    });

    if (!opp) throw new Error("Oportunidade não encontrada");
    if (opp.status !== "OPEN") throw new Error("Apenas oportunidades abertas podem ser movidas");

    // Buscar probabilidade do novo estágio
    let probability = input.probability;
    if (!probability && opp.pipeline.stages) {
      const stages = opp.pipeline.stages as unknown as PipelineStage[];
      const stageConfig = stages.find((s) => s.name === input.newStage);
      if (stageConfig) probability = stageConfig.probability;
    }

    return this.prisma.opportunity.update({
      where: { id: input.opportunityId },
      data: {
        stage: input.newStage,
        ...(probability !== undefined && { probability }),
      },
    });
  }

  /**
   * Marca oportunidade como ganha
   */
  async winOpportunity(input: WinOpportunityInput & { companyId: string }) {
    const opp = await this.prisma.opportunity.findFirst({
      where: { id: input.opportunityId, companyId: input.companyId },
    });

    if (!opp) throw new Error("Oportunidade não encontrada");
    if (opp.status !== "OPEN") throw new Error("Apenas oportunidades abertas podem ser ganhas");

    return this.prisma.opportunity.update({
      where: { id: input.opportunityId },
      data: {
        status: "WON",
        probability: 100,
        wonAt: new Date(),
      },
    });
  }

  /**
   * Marca oportunidade como perdida
   */
  async loseOpportunity(input: LoseOpportunityInput & { companyId: string }) {
    const opp = await this.prisma.opportunity.findFirst({
      where: { id: input.opportunityId, companyId: input.companyId },
    });

    if (!opp) throw new Error("Oportunidade não encontrada");
    if (opp.status !== "OPEN") throw new Error("Apenas oportunidades abertas podem ser perdidas");

    return this.prisma.opportunity.update({
      where: { id: input.opportunityId },
      data: {
        status: "LOST",
        probability: 0,
        lostAt: new Date(),
        lostReason: input.lostReason,
      },
    });
  }

  // ========================================================================
  // LEAD SCORING
  // ========================================================================

  /**
   * Calcula score de um lead baseado nas regras ativas da empresa
   */
  async scoreLeadById(companyId: string, leadId: string): Promise<number> {
    const [lead, rules] = await Promise.all([
      this.prisma.lead.findFirst({
        where: { id: leadId, companyId },
      }),
      this.prisma.leadScoringRule.findMany({
        where: { companyId, isActive: true },
      }),
    ]);

    if (!lead) throw new Error("Lead não encontrado");
    if (rules.length === 0) return 0;

    const leadData: Record<string, unknown> = {
      source: lead.source,
      status: lead.status,
      estimatedValue: lead.estimatedValue ? Number(lead.estimatedValue) : null,
      probability: lead.probability,
      email: lead.email,
      phone: lead.phone,
      companyName: lead.companyName,
    };

    return calculateLeadScore(leadData, rules);
  }

  // ========================================================================
  // FORECASTING
  // ========================================================================

  /**
   * Gera forecast de vendas por período
   */
  async getForecast(
    companyId: string,
    startDate: Date,
    endDate: Date,
    pipelineId?: string,
  ): Promise<ForecastResult[]> {
    const where: Record<string, unknown> = {
      companyId,
      status: "OPEN",
      expectedCloseDate: { gte: startDate, lte: endDate },
    };
    if (pipelineId) where.pipelineId = pipelineId;

    const opportunities = await this.prisma.opportunity.findMany({
      where,
      include: {
        pipeline: { select: { name: true } },
      },
    });

    // Agrupar por mês e pipeline
    const grouped = new Map<string, {
      pipeline: string;
      stages: Map<string, { value: number; weightedValue: number; count: number }>;
      totalValue: number;
      weightedValue: number;
      count: number;
    }>();

    for (const opp of opportunities) {
      const closeDate = opp.expectedCloseDate
        ? new Date(opp.expectedCloseDate)
        : new Date();
      const period = `${closeDate.getFullYear()}-${String(closeDate.getMonth() + 1).padStart(2, "0")}`;
      const key = `${period}|${opp.pipeline.name}`;

      const value = Number(opp.value);
      const weighted = calculateWeightedValue(value, opp.probability);

      if (!grouped.has(key)) {
        grouped.set(key, {
          pipeline: opp.pipeline.name,
          stages: new Map(),
          totalValue: 0,
          weightedValue: 0,
          count: 0,
        });
      }

      const group = grouped.get(key)!;
      group.totalValue += value;
      group.weightedValue += weighted;
      group.count++;

      const stageData = group.stages.get(opp.stage) || { value: 0, weightedValue: 0, count: 0 };
      stageData.value += value;
      stageData.weightedValue += weighted;
      stageData.count++;
      group.stages.set(opp.stage, stageData);
    }

    return Array.from(grouped.entries()).map(([key, data]) => ({
      period: key.split("|")[0],
      pipeline: data.pipeline,
      totalValue: Math.round(data.totalValue * 100) / 100,
      weightedValue: Math.round(data.weightedValue * 100) / 100,
      count: data.count,
      byStage: Array.from(data.stages.entries()).map(([stage, s]) => ({
        stage,
        value: Math.round(s.value * 100) / 100,
        weightedValue: Math.round(s.weightedValue * 100) / 100,
        count: s.count,
      })),
    }));
  }

  // ========================================================================
  // PERFORMANCE
  // ========================================================================

  /**
   * Relatório de performance por vendedor
   */
  async getSalesPerformance(
    companyId: string,
    year: number,
    month: number,
  ): Promise<SalesPerformance[]> {
    // Buscar oportunidades do período
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const opportunities = await this.prisma.opportunity.findMany({
      where: {
        companyId,
        assignedTo: { not: null },
        OR: [
          { status: "OPEN", createdAt: { lte: endDate } },
          { wonAt: { gte: startDate, lte: endDate } },
          { lostAt: { gte: startDate, lte: endDate } },
        ],
      },
      include: {
        assignedUser: { select: { id: true, name: true } },
      },
    });

    // Buscar metas
    const targets = await this.prisma.salesTarget.findMany({
      where: { companyId, year, month },
    });
    const targetMap = new Map(targets.map((t: { userId: string | null; targetValue: unknown }) => [t.userId, Number(t.targetValue)]));

    // Agrupar por vendedor
    const performanceMap = new Map<string, SalesPerformance>();

    for (const opp of opportunities) {
      if (!opp.assignedTo || !opp.assignedUser) continue;

      if (!performanceMap.has(opp.assignedTo)) {
        performanceMap.set(opp.assignedTo, {
          userId: opp.assignedTo,
          userName: opp.assignedUser.name,
          wonCount: 0,
          wonValue: 0,
          lostCount: 0,
          lostValue: 0,
          openCount: 0,
          openValue: 0,
          winRate: 0,
          avgDealSize: 0,
          targetValue: targetMap.get(opp.assignedTo) ?? 0,
          actualValue: 0,
          targetAchievement: 0,
        });
      }

      const perf = performanceMap.get(opp.assignedTo)!;
      const value = Number(opp.value);

      if (opp.status === "WON") {
        perf.wonCount++;
        perf.wonValue += value;
        perf.actualValue += value;
      } else if (opp.status === "LOST") {
        perf.lostCount++;
        perf.lostValue += value;
      } else {
        perf.openCount++;
        perf.openValue += value;
      }
    }

    // Calcular métricas derivadas
    return Array.from(performanceMap.values()).map((perf) => ({
      ...perf,
      wonValue: Math.round(perf.wonValue * 100) / 100,
      lostValue: Math.round(perf.lostValue * 100) / 100,
      openValue: Math.round(perf.openValue * 100) / 100,
      actualValue: Math.round(perf.actualValue * 100) / 100,
      winRate: calculateWinRate(perf.wonCount, perf.lostCount),
      avgDealSize: perf.wonCount > 0 ? Math.round((perf.wonValue / perf.wonCount) * 100) / 100 : 0,
      targetAchievement: calculateTargetAchievement(perf.actualValue, perf.targetValue),
    }));
  }
}
