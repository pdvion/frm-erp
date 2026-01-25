import { describe, it, expect } from "vitest";
import { z } from "zod";

// Schemas extraídos do router para testes
const listLevelsInputSchema = z.object({
  includeInactive: z.boolean().default(false),
}).optional();

const getLevelByIdInputSchema = z.object({ id: z.string().uuid() });

const createLevelInputSchema = z.object({
  code: z.string().min(1).max(50),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  minValue: z.number().min(0).default(0),
  maxValue: z.number().optional(),
  requiresAllApprovers: z.boolean().default(false),
  approvers: z.array(
    z.object({
      userId: z.string().uuid(),
      canApprove: z.boolean().default(true),
      canReject: z.boolean().default(true),
    })
  ).min(1),
});

const updateLevelInputSchema = z.object({
  id: z.string().uuid(),
  code: z.string().min(1).max(50).optional(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  minValue: z.number().min(0).optional(),
  maxValue: z.number().optional(),
  requiresAllApprovers: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

const addApproverInputSchema = z.object({
  levelId: z.string().uuid(),
  userId: z.string().uuid(),
  canApprove: z.boolean().default(true),
  canReject: z.boolean().default(true),
});

const removeApproverInputSchema = z.object({
  levelId: z.string().uuid(),
  userId: z.string().uuid(),
});

const deleteLevelInputSchema = z.object({ id: z.string().uuid() });

const listPendingRequestsInputSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "CANCELLED", "ALL"]).optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  page: z.number().default(1),
  limit: z.number().default(20),
}).optional();

const getRequestByIdInputSchema = z.object({ id: z.string().uuid() });

const createPaymentRequestInputSchema = z.object({
  payableId: z.string().uuid(),
  notes: z.string().optional(),
  urgency: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
});

const approveRequestInputSchema = z.object({
  requestId: z.string().uuid(),
  notes: z.string().optional(),
});

const rejectRequestInputSchema = z.object({
  requestId: z.string().uuid(),
  reason: z.string().min(1),
});

const cancelRequestInputSchema = z.object({
  requestId: z.string().uuid(),
  reason: z.string().min(1),
});

describe("Approvals Router Schemas", () => {
  describe("listLevels input", () => {
    it("should accept empty input", () => {
      const result = listLevelsInputSchema.safeParse(undefined);
      expect(result.success).toBe(true);
    });

    it("should default includeInactive to false", () => {
      const result = listLevelsInputSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.includeInactive).toBe(false);
      }
    });

    it("should accept includeInactive true", () => {
      const result = listLevelsInputSchema.safeParse({ includeInactive: true });
      expect(result.success).toBe(true);
    });
  });

  describe("getLevelById input", () => {
    it("should accept valid uuid", () => {
      const result = getLevelByIdInputSchema.safeParse({
        id: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid uuid", () => {
      const result = getLevelByIdInputSchema.safeParse({
        id: "invalid-uuid",
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing id", () => {
      const result = getLevelByIdInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("createLevel input", () => {
    it("should accept valid input", () => {
      const result = createLevelInputSchema.safeParse({
        code: "NIVEL1",
        name: "Nível 1 - Até R$ 1.000",
        approvers: [
          { userId: "550e8400-e29b-41d4-a716-446655440000" },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("should apply defaults", () => {
      const result = createLevelInputSchema.safeParse({
        code: "NIVEL1",
        name: "Nível 1",
        approvers: [
          { userId: "550e8400-e29b-41d4-a716-446655440000" },
        ],
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.minValue).toBe(0);
        expect(result.data.requiresAllApprovers).toBe(false);
        expect(result.data.approvers[0].canApprove).toBe(true);
        expect(result.data.approvers[0].canReject).toBe(true);
      }
    });

    it("should accept full input", () => {
      const result = createLevelInputSchema.safeParse({
        code: "NIVEL2",
        name: "Nível 2 - R$ 1.001 a R$ 10.000",
        description: "Aprovação de valores médios",
        minValue: 1001,
        maxValue: 10000,
        requiresAllApprovers: true,
        approvers: [
          { userId: "550e8400-e29b-41d4-a716-446655440001", canApprove: true, canReject: true },
          { userId: "550e8400-e29b-41d4-a716-446655440002", canApprove: true, canReject: false },
        ],
      });
      expect(result.success).toBe(true);
    });

    it("should reject empty code", () => {
      const result = createLevelInputSchema.safeParse({
        code: "",
        name: "Nível",
        approvers: [{ userId: "550e8400-e29b-41d4-a716-446655440000" }],
      });
      expect(result.success).toBe(false);
    });

    it("should reject code too long", () => {
      const result = createLevelInputSchema.safeParse({
        code: "A".repeat(51),
        name: "Nível",
        approvers: [{ userId: "550e8400-e29b-41d4-a716-446655440000" }],
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty name", () => {
      const result = createLevelInputSchema.safeParse({
        code: "NIVEL1",
        name: "",
        approvers: [{ userId: "550e8400-e29b-41d4-a716-446655440000" }],
      });
      expect(result.success).toBe(false);
    });

    it("should reject name too long", () => {
      const result = createLevelInputSchema.safeParse({
        code: "NIVEL1",
        name: "A".repeat(101),
        approvers: [{ userId: "550e8400-e29b-41d4-a716-446655440000" }],
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty approvers array", () => {
      const result = createLevelInputSchema.safeParse({
        code: "NIVEL1",
        name: "Nível 1",
        approvers: [],
      });
      expect(result.success).toBe(false);
    });

    it("should reject negative minValue", () => {
      const result = createLevelInputSchema.safeParse({
        code: "NIVEL1",
        name: "Nível 1",
        minValue: -100,
        approvers: [{ userId: "550e8400-e29b-41d4-a716-446655440000" }],
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid approver userId", () => {
      const result = createLevelInputSchema.safeParse({
        code: "NIVEL1",
        name: "Nível 1",
        approvers: [{ userId: "invalid-uuid" }],
      });
      expect(result.success).toBe(false);
    });
  });

  describe("updateLevel input", () => {
    it("should accept id only", () => {
      const result = updateLevelInputSchema.safeParse({
        id: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(result.success).toBe(true);
    });

    it("should accept partial update", () => {
      const result = updateLevelInputSchema.safeParse({
        id: "550e8400-e29b-41d4-a716-446655440000",
        name: "Novo Nome",
        maxValue: 5000,
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid id", () => {
      const result = updateLevelInputSchema.safeParse({
        id: "invalid-uuid",
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing id", () => {
      const result = updateLevelInputSchema.safeParse({
        name: "Sem ID",
      });
      expect(result.success).toBe(false);
    });

    it("should accept isActive change", () => {
      const result = updateLevelInputSchema.safeParse({
        id: "550e8400-e29b-41d4-a716-446655440000",
        isActive: false,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("addApprover input", () => {
    it("should accept valid input", () => {
      const result = addApproverInputSchema.safeParse({
        levelId: "550e8400-e29b-41d4-a716-446655440000",
        userId: "550e8400-e29b-41d4-a716-446655440001",
      });
      expect(result.success).toBe(true);
    });

    it("should apply defaults", () => {
      const result = addApproverInputSchema.safeParse({
        levelId: "550e8400-e29b-41d4-a716-446655440000",
        userId: "550e8400-e29b-41d4-a716-446655440001",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.canApprove).toBe(true);
        expect(result.data.canReject).toBe(true);
      }
    });

    it("should reject invalid levelId", () => {
      const result = addApproverInputSchema.safeParse({
        levelId: "invalid-uuid",
        userId: "550e8400-e29b-41d4-a716-446655440001",
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid userId", () => {
      const result = addApproverInputSchema.safeParse({
        levelId: "550e8400-e29b-41d4-a716-446655440000",
        userId: "invalid-uuid",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("removeApprover input", () => {
    it("should accept valid input", () => {
      const result = removeApproverInputSchema.safeParse({
        levelId: "550e8400-e29b-41d4-a716-446655440000",
        userId: "550e8400-e29b-41d4-a716-446655440001",
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid levelId", () => {
      const result = removeApproverInputSchema.safeParse({
        levelId: "invalid-uuid",
        userId: "550e8400-e29b-41d4-a716-446655440001",
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing userId", () => {
      const result = removeApproverInputSchema.safeParse({
        levelId: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("deleteLevel input", () => {
    it("should accept valid uuid", () => {
      const result = deleteLevelInputSchema.safeParse({
        id: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid uuid", () => {
      const result = deleteLevelInputSchema.safeParse({
        id: "invalid-uuid",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("listPendingRequests input", () => {
    it("should accept empty input", () => {
      const result = listPendingRequestsInputSchema.safeParse(undefined);
      expect(result.success).toBe(true);
    });

    it("should apply defaults", () => {
      const result = listPendingRequestsInputSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data?.page).toBe(1);
        expect(result.data?.limit).toBe(20);
      }
    });

    it("should accept all status values", () => {
      const statuses = ["PENDING", "APPROVED", "REJECTED", "CANCELLED", "ALL"];
      for (const status of statuses) {
        const result = listPendingRequestsInputSchema.safeParse({ status });
        expect(result.success).toBe(true);
      }
    });

    it("should reject invalid status", () => {
      const result = listPendingRequestsInputSchema.safeParse({ status: "INVALID" });
      expect(result.success).toBe(false);
    });

    it("should accept date range", () => {
      const result = listPendingRequestsInputSchema.safeParse({
        dateFrom: new Date("2026-01-01"),
        dateTo: new Date("2026-01-31"),
      });
      expect(result.success).toBe(true);
    });
  });

  describe("getRequestById input", () => {
    it("should accept valid uuid", () => {
      const result = getRequestByIdInputSchema.safeParse({
        id: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid uuid", () => {
      const result = getRequestByIdInputSchema.safeParse({
        id: "invalid-uuid",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("createPaymentRequest input", () => {
    it("should accept valid input", () => {
      const result = createPaymentRequestInputSchema.safeParse({
        payableId: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(result.success).toBe(true);
    });

    it("should apply default urgency", () => {
      const result = createPaymentRequestInputSchema.safeParse({
        payableId: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.urgency).toBe("NORMAL");
      }
    });

    it("should accept all urgency values", () => {
      const urgencies = ["LOW", "NORMAL", "HIGH", "URGENT"];
      for (const urgency of urgencies) {
        const result = createPaymentRequestInputSchema.safeParse({
          payableId: "550e8400-e29b-41d4-a716-446655440000",
          urgency,
        });
        expect(result.success).toBe(true);
      }
    });

    it("should accept with notes", () => {
      const result = createPaymentRequestInputSchema.safeParse({
        payableId: "550e8400-e29b-41d4-a716-446655440000",
        notes: "Pagamento urgente",
        urgency: "URGENT",
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid payableId", () => {
      const result = createPaymentRequestInputSchema.safeParse({
        payableId: "invalid-uuid",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("approveRequest input", () => {
    it("should accept valid input", () => {
      const result = approveRequestInputSchema.safeParse({
        requestId: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(result.success).toBe(true);
    });

    it("should accept with notes", () => {
      const result = approveRequestInputSchema.safeParse({
        requestId: "550e8400-e29b-41d4-a716-446655440000",
        notes: "Aprovado conforme política",
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid requestId", () => {
      const result = approveRequestInputSchema.safeParse({
        requestId: "invalid-uuid",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("rejectRequest input", () => {
    it("should accept valid input", () => {
      const result = rejectRequestInputSchema.safeParse({
        requestId: "550e8400-e29b-41d4-a716-446655440000",
        reason: "Valor acima do orçamento",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing reason", () => {
      const result = rejectRequestInputSchema.safeParse({
        requestId: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty reason", () => {
      const result = rejectRequestInputSchema.safeParse({
        requestId: "550e8400-e29b-41d4-a716-446655440000",
        reason: "",
      });
      expect(result.success).toBe(false);
    });

    it("should reject invalid requestId", () => {
      const result = rejectRequestInputSchema.safeParse({
        requestId: "invalid-uuid",
        reason: "Motivo",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("cancelRequest input", () => {
    it("should accept valid input", () => {
      const result = cancelRequestInputSchema.safeParse({
        requestId: "550e8400-e29b-41d4-a716-446655440000",
        reason: "Solicitação duplicada",
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing reason", () => {
      const result = cancelRequestInputSchema.safeParse({
        requestId: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty reason", () => {
      const result = cancelRequestInputSchema.safeParse({
        requestId: "550e8400-e29b-41d4-a716-446655440000",
        reason: "",
      });
      expect(result.success).toBe(false);
    });
  });
});
