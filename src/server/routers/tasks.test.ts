import { describe, expect, it } from "vitest";
import { z } from "zod";

const taskPrioritySchema = z.enum(["URGENT", "HIGH", "NORMAL", "LOW"]);
const taskStatusFilterSchema = z.enum([
  "PENDING",
  "ACCEPTED",
  "IN_PROGRESS",
  "ON_HOLD",
  "COMPLETED",
  "CANCELLED",
  "ALL",
]);

const taskEntityTypeSchema = z.enum([
  "NFE",
  "REQUISITION",
  "PURCHASE_ORDER",
  "QUOTE",
  "PAYABLE",
  "RECEIVABLE",
  "PRODUCTION_ORDER",
  "OTHER",
]);

const targetTypeSchema = z.enum(["user", "department", "group", "permission"]);

const listInputSchema = z.object({
  search: z.string().optional(),
  status: taskStatusFilterSchema.optional(),
  priority: taskPrioritySchema.optional(),
  ownerId: z.string().optional(),
  targetType: targetTypeSchema.optional(),
  myTasks: z.boolean().optional(),
  availableTasks: z.boolean().optional(),
  page: z.number().default(1),
  limit: z.number().default(20),
});

const getByIdInputSchema = z.object({ id: z.string() });

const createInputSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  priority: taskPrioritySchema.optional(),
  targetType: targetTypeSchema,
  targetUserId: z.string().optional(),
  targetDepartmentId: z.string().optional(),
  targetGroupId: z.string().optional(),
  targetPermission: z.string().optional(),
  deadline: z.date().optional(),
  slaAcceptHours: z.number().optional(),
  slaResolveHours: z.number().optional(),
  entityType: taskEntityTypeSchema.optional(),
  entityId: z.string().optional(),
});

const acceptInputSchema = z.object({ taskId: z.string() });
const startInputSchema = z.object({ taskId: z.string() });
const completeInputSchema = z.object({ taskId: z.string(), resolution: z.string().optional() });
const delegateInputSchema = z.object({ taskId: z.string(), toUserId: z.string(), comment: z.string().optional() });
const cancelInputSchema = z.object({ taskId: z.string(), reason: z.string().optional() });
const addCommentInputSchema = z.object({ taskId: z.string(), comment: z.string().min(1) });

function calcPages(total: number, limit: number): number {
  return Math.ceil(total / limit);
}

describe("Tasks Router Schemas", () => {
  describe("list input", () => {
    it("accepts defaults", () => {
      const parsed = listInputSchema.parse({});
      expect(parsed.page).toBe(1);
      expect(parsed.limit).toBe(20);
    });

    it("accepts all filters", () => {
      const result = listInputSchema.safeParse({
        search: "nfe",
        status: "PENDING",
        priority: "HIGH",
        ownerId: "user-1",
        targetType: "group",
        myTasks: true,
        availableTasks: true,
        page: 2,
        limit: 50,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("getById input", () => {
    it("requires id", () => {
      expect(getByIdInputSchema.safeParse({}).success).toBe(false);
      expect(getByIdInputSchema.safeParse({ id: "task-1" }).success).toBe(true);
    });
  });

  describe("create input", () => {
    it("accepts minimal input", () => {
      const result = createInputSchema.safeParse({
        title: "Revisar NFe",
        targetType: "user",
      });
      expect(result.success).toBe(true);
    });

    it("accepts complete input", () => {
      const result = createInputSchema.safeParse({
        title: "Aprovar requisição",
        description: "Validar saldo e liberar",
        priority: "URGENT",
        targetType: "permission",
        targetPermission: "inventory.exit",
        deadline: new Date("2026-02-01"),
        slaAcceptHours: 4,
        slaResolveHours: 24,
        entityType: "REQUISITION",
        entityId: "req-123",
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty title", () => {
      expect(
        createInputSchema.safeParse({ title: "", targetType: "department", targetDepartmentId: "dep-1" }).success
      ).toBe(false);
    });
  });

  describe("action inputs", () => {
    it("accept input", () => {
      expect(acceptInputSchema.safeParse({ taskId: "task-1" }).success).toBe(true);
    });

    it("start input", () => {
      expect(startInputSchema.safeParse({ taskId: "task-1" }).success).toBe(true);
    });

    it("complete input", () => {
      expect(completeInputSchema.safeParse({ taskId: "task-1" }).success).toBe(true);
      expect(completeInputSchema.safeParse({ taskId: "task-1", resolution: "Resolvido" }).success).toBe(true);
    });

    it("delegate input", () => {
      expect(delegateInputSchema.safeParse({ taskId: "task-1", toUserId: "user-2" }).success).toBe(true);
    });

    it("cancel input", () => {
      expect(cancelInputSchema.safeParse({ taskId: "task-1" }).success).toBe(true);
      expect(cancelInputSchema.safeParse({ taskId: "task-1", reason: "Duplicada" }).success).toBe(true);
    });

    it("addComment input", () => {
      expect(addCommentInputSchema.safeParse({ taskId: "task-1", comment: "Ok" }).success).toBe(true);
      expect(addCommentInputSchema.safeParse({ taskId: "task-1", comment: "" }).success).toBe(false);
    });
  });

  describe("status/priority enums", () => {
    it("allows valid priority", () => {
      expect(taskPrioritySchema.safeParse("NORMAL").success).toBe(true);
      expect(taskPrioritySchema.safeParse("CRITICAL").success).toBe(false);
    });

    it("allows ALL filter", () => {
      expect(taskStatusFilterSchema.safeParse("ALL").success).toBe(true);
    });

    it("allows valid entity types", () => {
      expect(taskEntityTypeSchema.safeParse("NFE").success).toBe(true);
      expect(taskEntityTypeSchema.safeParse("INVALID").success).toBe(false);
    });
  });

  describe("pagination helper", () => {
    it("calculates pages", () => {
      expect(calcPages(0, 20)).toBe(0);
      expect(calcPages(1, 20)).toBe(1);
      expect(calcPages(21, 20)).toBe(2);
    });
  });
});
