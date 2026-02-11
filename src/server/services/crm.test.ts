import { describe, it, expect, vi, beforeEach } from "vitest";
import type { PrismaClient } from "@prisma/client";
import {
  calculateWeightedValue,
  calculateWinRate,
  calculateTargetAchievement,
  evaluateScoringRule,
  calculateLeadScore,
  getDefaultPipelineStages,
  CrmService,
} from "./crm";

// ==========================================================================
// PURE FUNCTIONS
// ==========================================================================

describe("calculateWeightedValue", () => {
  it("calcula valor ponderado corretamente", () => {
    expect(calculateWeightedValue(100000, 50)).toBe(50000);
    expect(calculateWeightedValue(100000, 100)).toBe(100000);
    expect(calculateWeightedValue(100000, 0)).toBe(0);
    expect(calculateWeightedValue(75000, 25)).toBe(18750);
  });

  it("arredonda para 2 casas decimais", () => {
    expect(calculateWeightedValue(33333, 33)).toBe(10999.89);
  });
});

describe("calculateWinRate", () => {
  it("calcula win rate corretamente", () => {
    expect(calculateWinRate(3, 7)).toBe(30);
    expect(calculateWinRate(5, 5)).toBe(50);
    expect(calculateWinRate(10, 0)).toBe(100);
  });

  it("retorna 0 quando não há deals fechados", () => {
    expect(calculateWinRate(0, 0)).toBe(0);
  });
});

describe("calculateTargetAchievement", () => {
  it("calcula atingimento de meta", () => {
    expect(calculateTargetAchievement(50000, 100000)).toBe(50);
    expect(calculateTargetAchievement(120000, 100000)).toBe(120);
    expect(calculateTargetAchievement(100000, 100000)).toBe(100);
  });

  it("retorna 0 quando meta é zero", () => {
    expect(calculateTargetAchievement(50000, 0)).toBe(0);
  });
});

describe("evaluateScoringRule", () => {
  it("EQUALS — case insensitive", () => {
    expect(evaluateScoringRule("WEBSITE", "EQUALS", "website")).toBe(true);
    expect(evaluateScoringRule("REFERRAL", "EQUALS", "website")).toBe(false);
  });

  it("NOT_EQUALS", () => {
    expect(evaluateScoringRule("WEBSITE", "NOT_EQUALS", "referral")).toBe(true);
    expect(evaluateScoringRule("WEBSITE", "NOT_EQUALS", "website")).toBe(false);
  });

  it("CONTAINS", () => {
    expect(evaluateScoringRule("Empresa ABC Ltda", "CONTAINS", "abc")).toBe(true);
    expect(evaluateScoringRule("Empresa XYZ", "CONTAINS", "abc")).toBe(false);
  });

  it("GREATER_THAN / LESS_THAN", () => {
    expect(evaluateScoringRule(50000, "GREATER_THAN", "10000")).toBe(true);
    expect(evaluateScoringRule(5000, "GREATER_THAN", "10000")).toBe(false);
    expect(evaluateScoringRule(5000, "LESS_THAN", "10000")).toBe(true);
  });

  it("GREATER_EQUAL / LESS_EQUAL", () => {
    expect(evaluateScoringRule(10000, "GREATER_EQUAL", "10000")).toBe(true);
    expect(evaluateScoringRule(10000, "LESS_EQUAL", "10000")).toBe(true);
  });

  it("IN — JSON array", () => {
    expect(evaluateScoringRule("WEBSITE", "IN", '["website","referral"]')).toBe(true);
    expect(evaluateScoringRule("COLD_CALL", "IN", '["website","referral"]')).toBe(false);
  });

  it("IN — comma-separated fallback", () => {
    expect(evaluateScoringRule("WEBSITE", "IN", "website,referral")).toBe(true);
  });

  it("retorna false para null/undefined", () => {
    expect(evaluateScoringRule(null, "EQUALS", "test")).toBe(false);
    expect(evaluateScoringRule(undefined, "EQUALS", "test")).toBe(false);
  });

  it("retorna false para operador desconhecido", () => {
    expect(evaluateScoringRule("test", "UNKNOWN_OP", "test")).toBe(false);
  });
});

describe("calculateLeadScore", () => {
  const rules = [
    { field: "source", operator: "IN", value: '["website","referral"]', score: 20 },
    { field: "estimatedValue", operator: "GREATER_THAN", value: "50000", score: 30 },
    { field: "email", operator: "CONTAINS", value: "@", score: 10 },
    { field: "phone", operator: "NOT_EQUALS", value: "", score: 10 },
  ];

  it("soma scores de regras que passam", () => {
    const lead = {
      source: "WEBSITE",
      estimatedValue: 100000,
      email: "contato@empresa.com",
      phone: "11999999999",
    };
    expect(calculateLeadScore(lead, rules)).toBe(70);
  });

  it("clamp entre 0 e 100", () => {
    const manyRules = [
      { field: "source", operator: "EQUALS", value: "WEBSITE", score: 60 },
      { field: "email", operator: "CONTAINS", value: "@", score: 60 },
    ];
    const lead = { source: "WEBSITE", email: "a@b.com" };
    expect(calculateLeadScore(lead, manyRules)).toBe(100);
  });

  it("retorna 0 quando nenhuma regra passa", () => {
    const lead = { source: "OTHER", estimatedValue: 1000, email: null, phone: null };
    expect(calculateLeadScore(lead, rules)).toBe(0);
  });

  it("não fica negativo com scores negativos", () => {
    const negRules = [
      { field: "source", operator: "EQUALS", value: "COLD_CALL", score: -50 },
    ];
    const lead = { source: "COLD_CALL" };
    expect(calculateLeadScore(lead, negRules)).toBe(0);
  });
});

describe("getDefaultPipelineStages", () => {
  it("retorna 5 estágios padrão", () => {
    const stages = getDefaultPipelineStages();
    expect(stages).toHaveLength(5);
    expect(stages[0].name).toBe("Prospecção");
    expect(stages[4].name).toBe("Fechamento");
    expect(stages[4].probability).toBe(90);
  });

  it("estágios estão ordenados", () => {
    const stages = getDefaultPipelineStages();
    for (let i = 1; i < stages.length; i++) {
      expect(stages[i].order).toBeGreaterThan(stages[i - 1].order);
      expect(stages[i].probability).toBeGreaterThan(stages[i - 1].probability);
    }
  });
});

// ==========================================================================
// SERVICE CLASS
// ==========================================================================

function createMockPrisma() {
  const mock = {
    salesPipeline: {
      count: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    opportunity: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    lead: {
      findFirst: vi.fn(),
    },
    leadScoringRule: {
      findMany: vi.fn(),
    },
    salesTarget: {
      findMany: vi.fn(),
    },
    communicationLog: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    $transaction: vi.fn().mockImplementation((fn: any) => fn(mock)),
  } as unknown as PrismaClient;
  return mock;
}

describe("CrmService", () => {
  let prisma: ReturnType<typeof createMockPrisma>;
  let service: CrmService;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new CrmService(prisma as unknown as PrismaClient);
  });

  // ========================================================================
  // PIPELINES
  // ========================================================================

  describe("createPipeline", () => {
    it("cria pipeline com estágios padrão quando nenhum existe", async () => {
      (prisma.salesPipeline.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);
      (prisma.salesPipeline.create as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "pipe-1",
        name: "Vendas",
        isDefault: true,
      });

      const result = await service.createPipeline("comp-1", "Vendas");

      expect(prisma.salesPipeline.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          companyId: "comp-1",
          name: "Vendas",
          isDefault: true,
          stages: expect.arrayContaining([
            expect.objectContaining({ name: "Prospecção" }),
          ]),
        }),
      });
      expect(result.isDefault).toBe(true);
    });

    it("não marca como default se já existem pipelines", async () => {
      (prisma.salesPipeline.count as ReturnType<typeof vi.fn>).mockResolvedValue(2);
      (prisma.salesPipeline.create as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "pipe-2",
        name: "Pós-Venda",
        isDefault: false,
      });

      await service.createPipeline("comp-1", "Pós-Venda");

      expect(prisma.salesPipeline.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ isDefault: false }),
      });
    });

    it("aceita estágios customizados", async () => {
      (prisma.salesPipeline.count as ReturnType<typeof vi.fn>).mockResolvedValue(0);
      (prisma.salesPipeline.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "pipe-3" });

      const customStages = [
        { order: 1, name: "Lead", probability: 10 },
        { order: 2, name: "Demo", probability: 50 },
        { order: 3, name: "Close", probability: 90 },
      ];

      await service.createPipeline("comp-1", "Custom", null, customStages);

      expect(prisma.salesPipeline.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          stages: customStages,
        }),
      });
    });
  });

  // ========================================================================
  // OPORTUNIDADES
  // ========================================================================

  describe("createOpportunity", () => {
    it("gera código sequencial e usa probabilidade do estágio", async () => {
      (prisma.opportunity.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ code: 5 });
      (prisma.salesPipeline.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
        stages: [
          { order: 1, name: "Prospecção", probability: 10 },
          { order: 2, name: "Qualificação", probability: 25 },
        ],
      });
      (prisma.opportunity.create as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "opp-1",
        code: 6,
        probability: 25,
      });

      const result = await service.createOpportunity({
        companyId: "comp-1",
        title: "Deal ABC",
        customerId: "cust-1",
        pipelineId: "pipe-1",
        stage: "Qualificação",
        value: 50000,
      });

      expect(prisma.opportunity.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          code: 6,
          probability: 25,
          status: "OPEN",
        }),
      });
      expect(result.code).toBe(6);
    });

    it("usa probabilidade explícita quando fornecida", async () => {
      (prisma.opportunity.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      (prisma.salesPipeline.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
        stages: [{ order: 1, name: "Prospecção", probability: 10 }],
      });
      (prisma.opportunity.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "opp-2" });

      await service.createOpportunity({
        companyId: "comp-1",
        title: "Deal XYZ",
        customerId: "cust-1",
        pipelineId: "pipe-1",
        stage: "Prospecção",
        value: 30000,
        probability: 80,
      });

      expect(prisma.opportunity.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ probability: 80 }),
      });
    });
  });

  describe("moveOpportunity", () => {
    it("move para novo estágio e atualiza probabilidade", async () => {
      (prisma.opportunity.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "opp-1",
        status: "OPEN",
        pipeline: {
          stages: [
            { order: 1, name: "Prospecção", probability: 10 },
            { order: 2, name: "Proposta", probability: 50 },
          ],
        },
      });
      (prisma.opportunity.update as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "opp-1",
        stage: "Proposta",
        probability: 50,
      });

      await service.moveOpportunity({
        opportunityId: "opp-1",
        companyId: "comp-1",
        newStage: "Proposta",
      });

      expect(prisma.opportunity.update).toHaveBeenCalledWith({
        where: { id: "opp-1" },
        data: { stage: "Proposta", probability: 50 },
      });
    });

    it("rejeita se oportunidade não está OPEN", async () => {
      (prisma.opportunity.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "opp-1",
        status: "WON",
        pipeline: { stages: [] },
      });

      await expect(
        service.moveOpportunity({ opportunityId: "opp-1", companyId: "comp-1", newStage: "Proposta" }),
      ).rejects.toThrow("Apenas oportunidades abertas podem ser movidas");
    });

    it("rejeita se oportunidade não existe", async () => {
      (prisma.opportunity.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);

      await expect(
        service.moveOpportunity({ opportunityId: "opp-999", companyId: "comp-1", newStage: "X" }),
      ).rejects.toThrow("Oportunidade não encontrada");
    });
  });

  describe("winOpportunity", () => {
    it("marca como WON com probabilidade 100", async () => {
      (prisma.opportunity.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "opp-1",
        status: "OPEN",
      });
      (prisma.opportunity.update as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "opp-1",
        status: "WON",
      });

      await service.winOpportunity({ opportunityId: "opp-1", companyId: "comp-1" });

      expect(prisma.opportunity.update).toHaveBeenCalledWith({
        where: { id: "opp-1" },
        data: expect.objectContaining({
          status: "WON",
          probability: 100,
          wonAt: expect.any(Date),
        }),
      });
    });

    it("rejeita se não está OPEN", async () => {
      (prisma.opportunity.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "opp-1",
        status: "LOST",
      });

      await expect(
        service.winOpportunity({ opportunityId: "opp-1", companyId: "comp-1" }),
      ).rejects.toThrow("Apenas oportunidades abertas podem ser ganhas");
    });
  });

  describe("loseOpportunity", () => {
    it("marca como LOST com motivo", async () => {
      (prisma.opportunity.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "opp-1",
        status: "OPEN",
      });
      (prisma.opportunity.update as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "opp-1",
        status: "LOST",
      });

      await service.loseOpportunity({
        opportunityId: "opp-1",
        companyId: "comp-1",
        lostReason: "Preço alto",
      });

      expect(prisma.opportunity.update).toHaveBeenCalledWith({
        where: { id: "opp-1" },
        data: expect.objectContaining({
          status: "LOST",
          probability: 0,
          lostReason: "Preço alto",
          lostAt: expect.any(Date),
        }),
      });
    });
  });

  // ========================================================================
  // LEAD SCORING
  // ========================================================================

  describe("scoreLeadById", () => {
    it("calcula score baseado em regras ativas", async () => {
      (prisma.lead.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
        id: "lead-1",
        source: "WEBSITE",
        status: "QUALIFIED",
        estimatedValue: { toNumber: () => 100000 },
        probability: 70,
        email: "contato@empresa.com",
        phone: "11999999999",
        companyName: "Empresa ABC",
      });
      (prisma.leadScoringRule.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        { field: "source", operator: "IN", value: '["WEBSITE","REFERRAL"]', score: 20, isActive: true },
        { field: "email", operator: "CONTAINS", value: "@", score: 15, isActive: true },
      ]);

      const score = await service.scoreLeadById("comp-1", "lead-1");
      expect(score).toBe(35);
    });

    it("retorna 0 quando não há regras", async () => {
      (prisma.lead.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "lead-1" });
      (prisma.leadScoringRule.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const score = await service.scoreLeadById("comp-1", "lead-1");
      expect(score).toBe(0);
    });

    it("rejeita se lead não existe", async () => {
      (prisma.lead.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
      (prisma.leadScoringRule.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      await expect(
        service.scoreLeadById("comp-1", "lead-999"),
      ).rejects.toThrow("Lead não encontrado");
    });
  });

  // ========================================================================
  // FORECASTING
  // ========================================================================

  describe("getForecast", () => {
    it("agrupa oportunidades por mês e pipeline", async () => {
      (prisma.opportunity.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        {
          id: "opp-1",
          value: 100000,
          probability: 50,
          stage: "Proposta",
          expectedCloseDate: new Date("2026-03-15"),
          pipeline: { name: "Vendas" },
        },
        {
          id: "opp-2",
          value: 50000,
          probability: 75,
          stage: "Negociação",
          expectedCloseDate: new Date("2026-03-20"),
          pipeline: { name: "Vendas" },
        },
        {
          id: "opp-3",
          value: 80000,
          probability: 25,
          stage: "Qualificação",
          expectedCloseDate: new Date("2026-04-10"),
          pipeline: { name: "Vendas" },
        },
      ]);

      const result = await service.getForecast(
        "comp-1",
        new Date("2026-03-01"),
        new Date("2026-04-30"),
      );

      expect(result).toHaveLength(2);

      const march = result.find((r) => r.period === "2026-03");
      expect(march).toBeDefined();
      expect(march!.count).toBe(2);
      expect(march!.totalValue).toBe(150000);
      expect(march!.weightedValue).toBe(87500); // 50000 + 37500

      const april = result.find((r) => r.period === "2026-04");
      expect(april).toBeDefined();
      expect(april!.count).toBe(1);
      expect(april!.weightedValue).toBe(20000); // 80000 * 0.25
    });

    it("retorna array vazio quando não há oportunidades", async () => {
      (prisma.opportunity.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const result = await service.getForecast(
        "comp-1",
        new Date("2026-01-01"),
        new Date("2026-12-31"),
      );

      expect(result).toEqual([]);
    });
  });

  // ========================================================================
  // PERFORMANCE
  // ========================================================================

  describe("getSalesPerformance", () => {
    it("calcula métricas por vendedor", async () => {
      (prisma.opportunity.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        {
          assignedTo: "user-1",
          assignedUser: { id: "user-1", name: "João" },
          status: "WON",
          value: 50000,
          wonAt: new Date("2026-03-10"),
          lostAt: null,
        },
        {
          assignedTo: "user-1",
          assignedUser: { id: "user-1", name: "João" },
          status: "WON",
          value: 30000,
          wonAt: new Date("2026-03-15"),
          lostAt: null,
        },
        {
          assignedTo: "user-1",
          assignedUser: { id: "user-1", name: "João" },
          status: "LOST",
          value: 20000,
          wonAt: null,
          lostAt: new Date("2026-03-20"),
        },
        {
          assignedTo: "user-1",
          assignedUser: { id: "user-1", name: "João" },
          status: "OPEN",
          value: 40000,
          wonAt: null,
          lostAt: null,
        },
      ]);
      (prisma.salesTarget.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
        { userId: "user-1", targetValue: 100000 },
      ]);

      const result = await service.getSalesPerformance("comp-1", 2026, 3);

      expect(result).toHaveLength(1);
      const joao = result[0];
      expect(joao.userName).toBe("João");
      expect(joao.wonCount).toBe(2);
      expect(joao.wonValue).toBe(80000);
      expect(joao.lostCount).toBe(1);
      expect(joao.openCount).toBe(1);
      expect(joao.winRate).toBe(66.67);
      expect(joao.avgDealSize).toBe(40000);
    });

    it("retorna array vazio quando não há oportunidades atribuídas", async () => {
      (prisma.opportunity.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
      (prisma.salesTarget.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

      const result = await service.getSalesPerformance("comp-1", 2026, 3);
      expect(result).toEqual([]);
    });
  });
});
