import { describe, it, expect, vi, beforeEach } from "vitest";
import { AdmissionNotificationService } from "./admission-notification";

// Mock Prisma client
const mockPrisma = {
  notification: {
    create: vi.fn().mockResolvedValue({ id: "notif-1" }),
  },
  task: {
    create: vi.fn().mockResolvedValue({ id: "task-1" }),
  },
};

const baseCtx = {
  admissionId: "adm-1",
  candidateName: "João Silva",
  companyId: "company-1",
  recruiterId: "recruiter-1",
  managerId: "manager-1",
  userId: "user-1",
};

describe("AdmissionNotificationService", () => {
  let svc: AdmissionNotificationService;

  beforeEach(() => {
    vi.clearAllMocks();
    svc = new AdmissionNotificationService(mockPrisma as never);
  });

  describe("onStatusChange", () => {
    it("should create notification and task when process is created (DRAFT)", async () => {
      const result = await svc.onStatusChange(baseCtx, null, "DRAFT");

      expect(mockPrisma.notification.create).toHaveBeenCalledTimes(1);
      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "recruiter-1",
          companyId: "company-1",
          type: "info",
          category: "business",
          title: expect.stringContaining("João Silva"),
          link: "/hr/admission/adm-1",
        }),
      });

      expect(mockPrisma.task.create).toHaveBeenCalledTimes(1);
      expect(mockPrisma.task.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          companyId: "company-1",
          targetUserId: "recruiter-1",
          entityType: "ADMISSION",
          entityId: "adm-1",
          status: "PENDING",
          title: expect.stringContaining("documentos"),
        }),
      });

      expect(result.notifications).toHaveLength(1);
      expect(result.tasks).toHaveLength(1);
    });

    it("should notify recruiter on DOCUMENTS phase", async () => {
      const result = await svc.onStatusChange(baseCtx, "DRAFT", "DOCUMENTS");

      expect(mockPrisma.notification.create).toHaveBeenCalledTimes(1);
      expect(result.notifications).toHaveLength(1);
      expect(result.tasks).toHaveLength(0);
    });

    it("should create task to schedule exam on EXAM phase", async () => {
      const result = await svc.onStatusChange(baseCtx, "DOCUMENTS", "EXAM");

      expect(mockPrisma.notification.create).toHaveBeenCalledTimes(1);
      expect(mockPrisma.task.create).toHaveBeenCalledTimes(1);
      expect(mockPrisma.task.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: expect.stringContaining("exame admissional"),
          targetUserId: "recruiter-1",
          priority: "HIGH",
        }),
      });

      expect(result.notifications).toHaveLength(1);
      expect(result.tasks).toHaveLength(1);
    });

    it("should notify manager and create approval task on APPROVAL phase", async () => {
      const result = await svc.onStatusChange(baseCtx, "EXAM", "APPROVAL");

      expect(mockPrisma.notification.create).toHaveBeenCalledTimes(1);
      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "manager-1",
          title: expect.stringContaining("Aprovação pendente"),
        }),
      });

      expect(mockPrisma.task.create).toHaveBeenCalledTimes(1);
      expect(mockPrisma.task.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          targetUserId: "manager-1",
          title: expect.stringContaining("Aprovar"),
          priority: "HIGH",
        }),
      });

      expect(result.notifications).toHaveLength(1);
      expect(result.tasks).toHaveLength(1);
    });

    it("should notify recruiter and create contract task on APPROVED", async () => {
      const result = await svc.onStatusChange(baseCtx, "APPROVAL", "APPROVED");

      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "recruiter-1",
          type: "success",
          title: expect.stringContaining("aprovada"),
        }),
      });

      expect(mockPrisma.task.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          targetUserId: "recruiter-1",
          title: expect.stringContaining("contrato"),
        }),
      });

      expect(result.notifications).toHaveLength(1);
      expect(result.tasks).toHaveLength(1);
    });

    it("should notify recruiter on REJECTED", async () => {
      const result = await svc.onStatusChange(baseCtx, "APPROVAL", "REJECTED");

      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "recruiter-1",
          type: "error",
          title: expect.stringContaining("rejeitada"),
        }),
      });

      expect(result.notifications).toHaveLength(1);
      expect(result.tasks).toHaveLength(0);
    });

    it("should notify recruiter and create access task on COMPLETED", async () => {
      const result = await svc.onStatusChange(baseCtx, "APPROVED", "COMPLETED");

      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "recruiter-1",
          type: "success",
          title: expect.stringContaining("concluída"),
        }),
      });

      expect(mockPrisma.task.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: expect.stringContaining("acessos"),
        }),
      });

      expect(result.notifications).toHaveLength(1);
      expect(result.tasks).toHaveLength(1);
    });

    it("should notify recruiter on CANCELLED", async () => {
      const result = await svc.onStatusChange(baseCtx, "DRAFT", "CANCELLED");

      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "recruiter-1",
          type: "warning",
          title: expect.stringContaining("cancelada"),
        }),
      });

      expect(result.notifications).toHaveLength(1);
      expect(result.tasks).toHaveLength(0);
    });

    it("should not create notifications if no recruiterId", async () => {
      const ctxNoRecruiter = { ...baseCtx, recruiterId: null as string | null };
      const result = await svc.onStatusChange(ctxNoRecruiter, null, "DRAFT");

      expect(mockPrisma.notification.create).not.toHaveBeenCalled();
      expect(mockPrisma.task.create).not.toHaveBeenCalled();
      expect(result.notifications).toHaveLength(0);
      expect(result.tasks).toHaveLength(0);
    });

    it("should not create approval task if no managerId", async () => {
      const ctxNoManager = { ...baseCtx, managerId: null as string | null };
      const result = await svc.onStatusChange(ctxNoManager, "EXAM", "APPROVAL");

      expect(mockPrisma.notification.create).not.toHaveBeenCalled();
      expect(mockPrisma.task.create).not.toHaveBeenCalled();
      expect(result.notifications).toHaveLength(0);
      expect(result.tasks).toHaveLength(0);
    });
  });

  describe("onDocumentUploaded", () => {
    it("should notify recruiter and create verification task", async () => {
      const result = await svc.onDocumentUploaded(baseCtx, "CPF");

      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "recruiter-1",
          type: "info",
          title: expect.stringContaining("CPF"),
        }),
      });

      expect(mockPrisma.task.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: expect.stringContaining("CPF"),
          targetUserId: "recruiter-1",
          entityType: "ADMISSION",
        }),
      });

      expect(result.notifications).toHaveLength(1);
      expect(result.tasks).toHaveLength(1);
    });

    it("should not notify if no recruiterId", async () => {
      const ctxNoRecruiter = { ...baseCtx, recruiterId: null as string | null };
      const result = await svc.onDocumentUploaded(ctxNoRecruiter, "CPF");

      expect(mockPrisma.notification.create).not.toHaveBeenCalled();
      expect(result.notifications).toHaveLength(0);
    });
  });

  describe("onDocumentRejected", () => {
    it("should notify recruiter about rejection", async () => {
      const result = await svc.onDocumentRejected(baseCtx, "RG", "Documento ilegível");

      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "recruiter-1",
          type: "warning",
          title: expect.stringContaining("RG"),
          message: expect.stringContaining("ilegível"),
        }),
      });

      expect(result.notifications).toHaveLength(1);
    });
  });

  describe("onExamResult", () => {
    it("should notify manager when exam result is FIT", async () => {
      const result = await svc.onExamResult(baseCtx, "FIT");

      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "manager-1",
          type: "info",
          title: expect.stringContaining("Apto"),
        }),
      });

      expect(mockPrisma.task.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          targetUserId: "manager-1",
          title: expect.stringContaining("Aprovar"),
          priority: "HIGH",
        }),
      });

      expect(result.notifications).toHaveLength(1);
      expect(result.tasks).toHaveLength(1);
    });

    it("should notify manager when exam result is FIT_RESTRICTIONS", async () => {
      const result = await svc.onExamResult(baseCtx, "FIT_RESTRICTIONS");

      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "manager-1",
          title: expect.stringContaining("restrições"),
        }),
      });

      expect(result.notifications).toHaveLength(1);
      expect(result.tasks).toHaveLength(1);
    });

    it("should notify recruiter when exam result is UNFIT", async () => {
      const result = await svc.onExamResult(baseCtx, "UNFIT");

      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "recruiter-1",
          type: "error",
          title: expect.stringContaining("Inapto"),
        }),
      });

      expect(mockPrisma.task.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          targetUserId: "recruiter-1",
          title: expect.stringContaining("inapto"),
          priority: "HIGH",
        }),
      });

      expect(result.notifications).toHaveLength(1);
      expect(result.tasks).toHaveLength(1);
    });

    it("should not notify if no managerId for FIT result", async () => {
      const ctxNoManager = { ...baseCtx, managerId: null as string | null };
      const result = await svc.onExamResult(ctxNoManager, "FIT");

      expect(mockPrisma.notification.create).not.toHaveBeenCalled();
      expect(result.notifications).toHaveLength(0);
    });
  });
});
