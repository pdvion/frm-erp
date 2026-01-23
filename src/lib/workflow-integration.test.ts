import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock do Prisma
const mockFindFirst = vi.fn();
const mockFindUnique = vi.fn();
const mockFindMany = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    workflowDefinition: {
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
    },
    workflowInstance: {
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      create: (...args: unknown[]) => mockCreate(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
    workflowStepHistory: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      create: (...args: unknown[]) => mockCreate(...args),
    },
    workflowTransition: {
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
    },
    purchaseOrder: {
      update: (...args: unknown[]) => mockUpdate(...args),
    },
    materialRequisition: {
      update: (...args: unknown[]) => mockUpdate(...args),
    },
    quote: {
      update: (...args: unknown[]) => mockUpdate(...args),
    },
    timeClockAdjustment: {
      update: (...args: unknown[]) => mockUpdate(...args),
    },
    approvalLevel: {
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
    },
  },
}));

import {
  startWorkflowForEntity,
  hasActiveWorkflow,
  getWorkflowStatus,
  onWorkflowCompleted,
  getPendingApprovalsForUser,
  requiresApproval,
  type WorkflowEntityType,
} from "./workflow-integration";

describe("Workflow Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("startWorkflowForEntity", () => {
    it("deve retornar NO_WORKFLOW_CONFIGURED quando não há workflow", async () => {
      mockFindFirst.mockResolvedValueOnce(null);

      const result = await startWorkflowForEntity({
        companyId: "company-1",
        entityType: "PURCHASE_ORDER",
        entityId: "order-1",
        startedBy: "user-1",
      });

      expect(result.success).toBe(true);
      expect(result.error).toBe("NO_WORKFLOW_CONFIGURED");
    });

    it("deve retornar erro quando workflow não tem etapa inicial", async () => {
      mockFindFirst.mockResolvedValueOnce({
        id: "def-1",
        steps: [],
      });

      const result = await startWorkflowForEntity({
        companyId: "company-1",
        entityType: "PURCHASE_ORDER",
        entityId: "order-1",
        startedBy: "user-1",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Workflow não possui etapa inicial");
    });

    it("deve retornar WORKFLOW_ALREADY_EXISTS quando já existe instância ativa", async () => {
      mockFindFirst
        .mockResolvedValueOnce({
          id: "def-1",
          steps: [{ id: "step-1", type: "START" }],
        })
        .mockResolvedValueOnce({
          id: "instance-1",
          code: "WF000001",
        });

      const result = await startWorkflowForEntity({
        companyId: "company-1",
        entityType: "PURCHASE_ORDER",
        entityId: "order-1",
        startedBy: "user-1",
      });

      expect(result.success).toBe(true);
      expect(result.error).toBe("WORKFLOW_ALREADY_EXISTS");
      expect(result.instanceId).toBe("instance-1");
    });
  });

  describe("hasActiveWorkflow", () => {
    it("deve retornar false quando não há workflow ativo", async () => {
      mockFindFirst.mockResolvedValue(null);

      const result = await hasActiveWorkflow("company-1", "PURCHASE_ORDER", "order-1");

      expect(result.hasWorkflow).toBe(false);
      expect(result.instanceId).toBeUndefined();
    });

    it("deve retornar true quando há workflow ativo", async () => {
      mockFindFirst.mockResolvedValue({
        id: "instance-1",
        status: "IN_PROGRESS",
      });

      const result = await hasActiveWorkflow("company-1", "PURCHASE_ORDER", "order-1");

      expect(result.hasWorkflow).toBe(true);
      expect(result.instanceId).toBe("instance-1");
      expect(result.status).toBe("IN_PROGRESS");
    });
  });

  describe("getWorkflowStatus", () => {
    it("deve retornar hasWorkflow false quando não há instância", async () => {
      mockFindFirst.mockResolvedValue(null);

      const result = await getWorkflowStatus("company-1", "PURCHASE_ORDER", "order-1");

      expect(result.hasWorkflow).toBe(false);
      expect(result.instance).toBeUndefined();
    });

    it("deve retornar dados da instância quando existe", async () => {
      const startedAt = new Date();
      mockFindFirst.mockResolvedValue({
        id: "instance-1",
        code: "WF000001",
        status: "IN_PROGRESS",
        currentStep: { name: "Aprovação Gerente" },
        startedAt,
      });

      const result = await getWorkflowStatus("company-1", "PURCHASE_ORDER", "order-1");

      expect(result.hasWorkflow).toBe(true);
      expect(result.instance?.id).toBe("instance-1");
      expect(result.instance?.code).toBe("WF000001");
      expect(result.instance?.currentStep).toBe("Aprovação Gerente");
    });
  });

  describe("onWorkflowCompleted", () => {
    it("deve não fazer nada quando instância não existe", async () => {
      mockFindUnique.mockResolvedValue(null);

      await onWorkflowCompleted("instance-1", "APPROVED");

      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it("deve não fazer nada quando entityType ou entityId são nulos", async () => {
      mockFindUnique.mockResolvedValue({
        entityType: null,
        entityId: null,
        companyId: "company-1",
      });

      await onWorkflowCompleted("instance-1", "APPROVED");

      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it("deve atualizar PURCHASE_ORDER para APPROVED", async () => {
      mockFindUnique.mockResolvedValue({
        entityType: "PURCHASE_ORDER",
        entityId: "order-1",
        companyId: "company-1",
      });

      await onWorkflowCompleted("instance-1", "APPROVED");

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: "order-1" },
        data: { status: "APPROVED" },
      });
    });

    it("deve atualizar PURCHASE_ORDER para CANCELLED quando rejeitado", async () => {
      mockFindUnique.mockResolvedValue({
        entityType: "PURCHASE_ORDER",
        entityId: "order-1",
        companyId: "company-1",
      });

      await onWorkflowCompleted("instance-1", "REJECTED");

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: "order-1" },
        data: { status: "CANCELLED" },
      });
    });

    it("deve atualizar REQUISITION para APPROVED", async () => {
      mockFindUnique.mockResolvedValue({
        entityType: "REQUISITION",
        entityId: "req-1",
        companyId: "company-1",
      });

      await onWorkflowCompleted("instance-1", "APPROVED");

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: "req-1" },
        data: { status: "APPROVED" },
      });
    });

    it("deve atualizar QUOTE para APPROVED", async () => {
      mockFindUnique.mockResolvedValue({
        entityType: "QUOTE",
        entityId: "quote-1",
        companyId: "company-1",
      });

      await onWorkflowCompleted("instance-1", "APPROVED");

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: "quote-1" },
        data: { status: "APPROVED" },
      });
    });

    it("deve atualizar TIMECLOCK_ADJUSTMENT para APPROVED com reviewedAt", async () => {
      mockFindUnique.mockResolvedValue({
        entityType: "TIMECLOCK_ADJUSTMENT",
        entityId: "adj-1",
        companyId: "company-1",
      });

      await onWorkflowCompleted("instance-1", "APPROVED");

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: "adj-1" },
        data: { status: "APPROVED", reviewedAt: expect.any(Date) },
      });
    });
  });

  describe("getPendingApprovalsForUser", () => {
    it("deve retornar array vazio quando não há aprovações pendentes", async () => {
      mockFindMany.mockResolvedValue([]);

      const result = await getPendingApprovalsForUser("user-1", "company-1");

      expect(result).toEqual([]);
    });

    it("deve retornar aprovações pendentes formatadas", async () => {
      const startedAt = new Date();
      const dueAt = new Date();
      mockFindMany.mockResolvedValue([
        {
          instance: {
            id: "instance-1",
            code: "WF000001",
            entityType: "PURCHASE_ORDER",
            entityId: "order-1",
            definition: { name: "Aprovação de Compras" },
          },
          step: { name: "Aprovação Gerente" },
          dueAt,
          startedAt,
        },
      ]);

      const result = await getPendingApprovalsForUser("user-1", "company-1");

      expect(result).toHaveLength(1);
      expect(result[0].instanceId).toBe("instance-1");
      expect(result[0].instanceCode).toBe("WF000001");
      expect(result[0].workflowName).toBe("Aprovação de Compras");
      expect(result[0].stepName).toBe("Aprovação Gerente");
    });
  });

  describe("requiresApproval", () => {
    it("deve retornar required false quando não há alçada configurada", async () => {
      mockFindFirst.mockResolvedValueOnce(null);

      const result = await requiresApproval("company-1", "PURCHASE_ORDER", 1000);

      expect(result.required).toBe(false);
    });

    it("deve retornar required false quando não há workflow para a categoria", async () => {
      mockFindFirst
        .mockResolvedValueOnce({ id: "level-1" }) // approvalLevel
        .mockResolvedValueOnce(null); // workflowDefinition

      const result = await requiresApproval("company-1", "PURCHASE_ORDER", 1000);

      expect(result.required).toBe(false);
    });

    it("deve retornar required true com workflowCode quando há workflow", async () => {
      mockFindFirst
        .mockResolvedValueOnce({ id: "level-1" }) // approvalLevel
        .mockResolvedValueOnce({ code: "WF-COMPRAS" }); // workflowDefinition

      const result = await requiresApproval("company-1", "PURCHASE_ORDER", 1000);

      expect(result.required).toBe(true);
      expect(result.workflowCode).toBe("WF-COMPRAS");
    });
  });

  describe("Entity type mapping", () => {
    const entityTypes: WorkflowEntityType[] = [
      "PURCHASE_ORDER",
      "REQUISITION",
      "PAYABLE",
      "QUOTE",
      "PRODUCTION_ORDER",
      "VACATION_REQUEST",
      "TIMECLOCK_ADJUSTMENT",
    ];

    it.each(entityTypes)("deve aceitar entityType %s", async (entityType) => {
      mockFindFirst.mockResolvedValue(null);

      const result = await hasActiveWorkflow("company-1", entityType, "entity-1");

      expect(result.hasWorkflow).toBe(false);
    });
  });
});
