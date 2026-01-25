import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock prisma before importing the module
vi.mock("@/lib/prisma", () => ({
  prisma: {
    notification: {
      create: vi.fn().mockResolvedValue({ id: "notif-1" }),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    userCompany: {
      findMany: vi.fn().mockResolvedValue([
        { userId: "user-1" },
        { userId: "user-2" },
      ]),
    },
  },
}));

import { notificationService, notifications } from "./notifications";
import { prisma } from "@/lib/prisma";

describe("NotificationService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("create", () => {
    it("should create a notification", async () => {
      await notificationService.create({
        userId: "user-1",
        type: "info",
        category: "system",
        title: "Test Notification",
        message: "Test message",
      });

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "user-1",
          type: "info",
          category: "system",
          title: "Test Notification",
          message: "Test message",
        }),
      });
    });

    it("should handle optional fields", async () => {
      await notificationService.create({
        type: "warning",
        category: "business",
        title: "Warning",
      });

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: "warning",
          category: "business",
          title: "Warning",
          metadata: {},
        }),
      });
    });
  });

  describe("notifyUser", () => {
    it("should notify a specific user", async () => {
      await notificationService.notifyUser({
        userId: "user-123",
        type: "success",
        category: "business",
        title: "Success!",
        message: "Operation completed",
      });

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "user-123",
          type: "success",
        }),
      });
    });
  });

  describe("notifyCompany", () => {
    it("should notify all users in a company", async () => {
      await notificationService.notifyCompany({
        companyId: "company-1",
        type: "info",
        category: "system",
        title: "Company Update",
      });

      expect(prisma.userCompany.findMany).toHaveBeenCalledWith({
        where: {
          companyId: "company-1",
          isActive: true,
        },
        select: { userId: true },
      });

      // Should create notification for each user
      expect(prisma.notification.create).toHaveBeenCalledTimes(2);
    });
  });

  describe("notifyError", () => {
    it("should create an error notification", async () => {
      await notificationService.notifyError({
        userId: "user-1",
        title: "Error Occurred",
        message: "Something went wrong",
        errorCode: "ERR001",
      });

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: "error",
          category: "error",
          title: "Error Occurred",
          message: "Something went wrong",
        }),
      });
    });
  });

  describe("broadcast", () => {
    it("should create a global notification", async () => {
      await notificationService.broadcast({
        type: "info",
        category: "system",
        title: "System Maintenance",
        message: "Scheduled maintenance tonight",
      });

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: undefined,
          companyId: undefined,
          type: "info",
          title: "System Maintenance",
        }),
      });
    });
  });

  describe("markAsRead", () => {
    it("should mark a notification as read", async () => {
      await notificationService.markAsRead("notif-1", "user-1");

      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: {
          id: "notif-1",
          userId: "user-1",
        },
        data: {
          isRead: true,
          readAt: expect.any(Date),
        },
      });
    });
  });

  describe("markAllAsRead", () => {
    it("should mark all user notifications as read", async () => {
      await notificationService.markAllAsRead("user-1");

      expect(prisma.notification.updateMany).toHaveBeenCalledWith({
        where: {
          userId: "user-1",
          isRead: false,
        },
        data: {
          isRead: true,
          readAt: expect.any(Date),
        },
      });
    });
  });

  describe("getUnread", () => {
    it("should get unread notifications with default limit", async () => {
      await notificationService.getUnread("user-1");

      expect(prisma.notification.findMany).toHaveBeenCalledWith({
        where: {
          OR: [{ userId: "user-1" }, { userId: null }],
          isRead: false,
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      });
    });

    it("should get unread notifications with custom limit", async () => {
      await notificationService.getUnread("user-1", 5);

      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
        })
      );
    });
  });

  describe("countUnread", () => {
    it("should count unread notifications", async () => {
      await notificationService.countUnread("user-1");

      expect(prisma.notification.count).toHaveBeenCalledWith({
        where: {
          OR: [{ userId: "user-1" }, { userId: null }],
          isRead: false,
        },
      });
    });
  });

  describe("cleanup", () => {
    it("should delete old read notifications", async () => {
      await notificationService.cleanup(30);

      expect(prisma.notification.deleteMany).toHaveBeenCalledWith({
        where: {
          createdAt: { lt: expect.any(Date) },
          isRead: true,
        },
      });
    });

    it("should use default 30 days", async () => {
      await notificationService.cleanup();

      expect(prisma.notification.deleteMany).toHaveBeenCalled();
    });
  });
});

describe("notifications convenience functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("nfeReceived", () => {
    it("should create NFe received notification", async () => {
      await notifications.nfeReceived("user-1", "12345", "Fornecedor ABC");

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "user-1",
          type: "success",
          category: "business",
          title: "Nova NFe Recebida",
          link: "/receiving",
        }),
      });
    });
  });

  describe("lowStock", () => {
    it("should create low stock notification", async () => {
      await notifications.lowStock("company-1", "Material XYZ", 5, 10);

      expect(prisma.userCompany.findMany).toHaveBeenCalled();
      expect(prisma.notification.create).toHaveBeenCalled();
    });
  });

  describe("payableDue", () => {
    it("should create payable due notification", async () => {
      const dueDate = new Date("2026-02-01");
      await notifications.payableDue("user-1", "Fornecedor ABC", 1500.5, dueDate);

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "user-1",
          type: "warning",
          category: "business",
          title: "Título Vencendo",
          link: "/payables",
        }),
      });
    });
  });

  describe("requisitionPending", () => {
    it("should create requisition pending notification", async () => {
      await notifications.requisitionPending("user-1", 123, "João Silva");

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "user-1",
          type: "info",
          category: "business",
          title: "Requisição Pendente de Aprovação",
          link: "/requisitions",
        }),
      });
    });
  });

  describe("systemError", () => {
    it("should create system error notification", async () => {
      await notifications.systemError("Erro Crítico", "Falha no sistema", "ERR500");

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: "error",
          category: "error",
          title: "Erro Crítico",
          message: "Falha no sistema",
        }),
      });
    });
  });

  describe("newUser", () => {
    it("should create new user notification", async () => {
      await notifications.newUser("company-1", "Maria Santos");

      expect(prisma.userCompany.findMany).toHaveBeenCalled();
      expect(prisma.notification.create).toHaveBeenCalled();
    });
  });
});
