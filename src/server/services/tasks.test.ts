import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    task: {
      create: vi.fn().mockResolvedValue({
        id: "task-1",
        title: "Test Task",
        status: "PENDING",
        companyId: "company-1",
      }),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    taskHistory: {
      create: vi.fn().mockResolvedValue({ id: "history-1" }),
    },
    employee: {
      findMany: vi.fn().mockResolvedValue([
        { userId: "user-1" },
        { userId: "user-2" },
      ]),
    },
    notificationGroupMember: {
      findMany: vi.fn().mockResolvedValue([
        { userId: "user-1" },
        { userId: "user-2" },
      ]),
    },
    userCompanyPermission: {
      findMany: vi.fn().mockResolvedValue([
        { userId: "user-1" },
        { userId: "user-2" },
      ]),
    },
  },
}));

// Mock notification service
vi.mock("./notifications", () => ({
  notificationService: {
    notifyUser: vi.fn().mockResolvedValue({ id: "notif-1" }),
  },
}));

import { taskService } from "./tasks";
import { prisma } from "@/lib/prisma";

describe("TaskService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("create", () => {
    it("should create a task with default values", async () => {
      const input = {
        companyId: "company-1",
        title: "Test Task",
        targetType: "user" as const,
        targetUserId: "user-1",
      };

      await taskService.create(input);

      expect(prisma.task.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          companyId: "company-1",
          title: "Test Task",
          priority: "NORMAL",
          status: "PENDING",
          slaAcceptHours: 24,
          slaResolveHours: 72,
        }),
      });
    });

    it("should create task history entry", async () => {
      const input = {
        companyId: "company-1",
        title: "Test Task",
        targetType: "user" as const,
        targetUserId: "user-1",
        createdById: "creator-1",
      };

      await taskService.create(input);

      expect(prisma.taskHistory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: "created",
          newStatus: "PENDING",
        }),
      });
    });

    it("should use custom priority when provided", async () => {
      const input = {
        companyId: "company-1",
        title: "Urgent Task",
        targetType: "user" as const,
        targetUserId: "user-1",
        priority: "URGENT" as const,
      };

      await taskService.create(input);

      expect(prisma.task.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          priority: "URGENT",
        }),
      });
    });

    it("should use custom SLA values when provided", async () => {
      const input = {
        companyId: "company-1",
        title: "Custom SLA Task",
        targetType: "user" as const,
        targetUserId: "user-1",
        slaAcceptHours: 4,
        slaResolveHours: 8,
      };

      await taskService.create(input);

      expect(prisma.task.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          slaAcceptHours: 4,
          slaResolveHours: 8,
        }),
      });
    });
  });

  describe("accept", () => {
    it("should accept a pending task", async () => {
      vi.mocked(prisma.task.findUnique).mockResolvedValue({
        id: "task-1",
        status: "PENDING",
      } as never);

      vi.mocked(prisma.task.update).mockResolvedValue({
        id: "task-1",
        status: "ACCEPTED",
        ownerId: "user-1",
      } as never);

      const result = await taskService.accept({
        taskId: "task-1",
        userId: "user-1",
      });

      expect(prisma.task.update).toHaveBeenCalledWith({
        where: { id: "task-1" },
        data: expect.objectContaining({
          status: "ACCEPTED",
          ownerId: "user-1",
        }),
      });

      expect(result.status).toBe("ACCEPTED");
    });

    it("should throw error if task not found", async () => {
      vi.mocked(prisma.task.findUnique).mockResolvedValue(null);

      await expect(
        taskService.accept({ taskId: "invalid", userId: "user-1" })
      ).rejects.toThrow("Tarefa não encontrada");
    });

    it("should throw error if task already accepted", async () => {
      vi.mocked(prisma.task.findUnique).mockResolvedValue({
        id: "task-1",
        status: "ACCEPTED",
      } as never);

      await expect(
        taskService.accept({ taskId: "task-1", userId: "user-1" })
      ).rejects.toThrow("Tarefa já foi aceita ou não está disponível");
    });
  });

  describe("start", () => {
    it("should start an accepted task", async () => {
      vi.mocked(prisma.task.findUnique).mockResolvedValue({
        id: "task-1",
        status: "ACCEPTED",
        ownerId: "user-1",
      } as never);

      vi.mocked(prisma.task.update).mockResolvedValue({
        id: "task-1",
        status: "IN_PROGRESS",
      } as never);

      const result = await taskService.start("task-1", "user-1");

      expect(prisma.task.update).toHaveBeenCalledWith({
        where: { id: "task-1" },
        data: { status: "IN_PROGRESS" },
      });

      expect(result.status).toBe("IN_PROGRESS");
    });

    it("should throw error if not the owner", async () => {
      vi.mocked(prisma.task.findUnique).mockResolvedValue({
        id: "task-1",
        status: "ACCEPTED",
        ownerId: "user-2",
      } as never);

      await expect(taskService.start("task-1", "user-1")).rejects.toThrow(
        "Apenas o proprietário pode iniciar a tarefa"
      );
    });

    it("should throw error if task not accepted", async () => {
      vi.mocked(prisma.task.findUnique).mockResolvedValue({
        id: "task-1",
        status: "PENDING",
        ownerId: "user-1",
      } as never);

      await expect(taskService.start("task-1", "user-1")).rejects.toThrow(
        "Tarefa precisa estar aceita para iniciar"
      );
    });
  });

  describe("complete", () => {
    it("should complete a task", async () => {
      vi.mocked(prisma.task.findUnique).mockResolvedValue({
        id: "task-1",
        status: "IN_PROGRESS",
        ownerId: "user-1",
      } as never);

      vi.mocked(prisma.task.update).mockResolvedValue({
        id: "task-1",
        status: "COMPLETED",
      } as never);

      const result = await taskService.complete({
        taskId: "task-1",
        userId: "user-1",
        resolution: "Task completed successfully",
      });

      expect(prisma.task.update).toHaveBeenCalledWith({
        where: { id: "task-1" },
        data: expect.objectContaining({
          status: "COMPLETED",
          resolution: "Task completed successfully",
        }),
      });

      expect(result.status).toBe("COMPLETED");
    });

    it("should throw error if not the owner", async () => {
      vi.mocked(prisma.task.findUnique).mockResolvedValue({
        id: "task-1",
        status: "IN_PROGRESS",
        ownerId: "user-2",
      } as never);

      await expect(
        taskService.complete({ taskId: "task-1", userId: "user-1" })
      ).rejects.toThrow("Apenas o proprietário pode completar a tarefa");
    });
  });

  describe("delegate", () => {
    it("should delegate a task to another user", async () => {
      vi.mocked(prisma.task.findUnique).mockResolvedValue({
        id: "task-1",
        title: "Test Task",
        ownerId: "user-1",
      } as never);

      vi.mocked(prisma.task.update).mockResolvedValue({
        id: "task-1",
        ownerId: "user-2",
      } as never);

      const result = await taskService.delegate({
        taskId: "task-1",
        fromUserId: "user-1",
        toUserId: "user-2",
        comment: "Please handle this",
      });

      expect(prisma.task.update).toHaveBeenCalledWith({
        where: { id: "task-1" },
        data: { ownerId: "user-2" },
      });

      expect(result.ownerId).toBe("user-2");
    });

    it("should throw error if not the owner", async () => {
      vi.mocked(prisma.task.findUnique).mockResolvedValue({
        id: "task-1",
        ownerId: "user-3",
      } as never);

      await expect(
        taskService.delegate({
          taskId: "task-1",
          fromUserId: "user-1",
          toUserId: "user-2",
        })
      ).rejects.toThrow("Apenas o proprietário pode delegar a tarefa");
    });
  });

  describe("cancel", () => {
    it("should cancel a task", async () => {
      vi.mocked(prisma.task.findUnique).mockResolvedValue({
        id: "task-1",
        status: "PENDING",
      } as never);

      vi.mocked(prisma.task.update).mockResolvedValue({
        id: "task-1",
        status: "CANCELLED",
      } as never);

      const result = await taskService.cancel("task-1", "user-1", "No longer needed");

      expect(prisma.task.update).toHaveBeenCalledWith({
        where: { id: "task-1" },
        data: { status: "CANCELLED" },
      });

      expect(result.status).toBe("CANCELLED");
    });

    it("should throw error if task not found", async () => {
      vi.mocked(prisma.task.findUnique).mockResolvedValue(null);

      await expect(taskService.cancel("invalid", "user-1")).rejects.toThrow(
        "Tarefa não encontrada"
      );
    });
  });

  describe("addComment", () => {
    it("should add a comment to a task", async () => {
      await taskService.addComment("task-1", "user-1", "This is a comment");

      expect(prisma.taskHistory.create).toHaveBeenCalledWith({
        data: {
          taskId: "task-1",
          userId: "user-1",
          action: "comment",
          comment: "This is a comment",
        },
      });
    });
  });

  describe("calculateSlaMetrics", () => {
    it("should return null if task not found", async () => {
      vi.mocked(prisma.task.findUnique).mockResolvedValue(null);

      const result = await taskService.calculateSlaMetrics("invalid");

      expect(result).toBeNull();
    });

    it("should calculate SLA metrics for completed task", async () => {
      const createdAt = new Date("2026-01-25T10:00:00Z");
      const acceptedAt = new Date("2026-01-25T12:00:00Z"); // 2 hours later
      const completedAt = new Date("2026-01-25T18:00:00Z"); // 6 hours after accept

      vi.mocked(prisma.task.findUnique).mockResolvedValue({
        id: "task-1",
        createdAt,
        acceptedAt,
        completedAt,
        slaAcceptHours: 24,
        slaResolveHours: 72,
        history: [],
      } as never);

      const result = await taskService.calculateSlaMetrics("task-1");

      expect(result).not.toBeNull();
      expect(result?.timeToAcceptHours).toBe(2);
      expect(result?.timeToCompleteHours).toBe(6);
      expect(result?.slaAcceptMet).toBe(true);
      expect(result?.slaResolveMet).toBe(true);
    });

    it("should detect SLA breach", async () => {
      const createdAt = new Date("2026-01-25T10:00:00Z");
      const acceptedAt = new Date("2026-01-26T12:00:00Z"); // 26 hours later (breach)
      const completedAt = new Date("2026-01-30T18:00:00Z"); // 102 hours after accept (breach)

      vi.mocked(prisma.task.findUnique).mockResolvedValue({
        id: "task-1",
        createdAt,
        acceptedAt,
        completedAt,
        slaAcceptHours: 24,
        slaResolveHours: 72,
        history: [],
      } as never);

      const result = await taskService.calculateSlaMetrics("task-1");

      expect(result?.slaAcceptMet).toBe(false);
      expect(result?.slaResolveMet).toBe(false);
    });
  });
});
