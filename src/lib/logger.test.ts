import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock prisma antes de importar logger
vi.mock("@/lib/prisma", () => ({
  prisma: {
    systemLog: {
      create: vi.fn().mockResolvedValue({ id: "log-1" }),
    },
  },
}));

// Mock notification service
vi.mock("@/server/services/notifications", () => ({
  notificationService: {
    notifyUser: vi.fn().mockResolvedValue(undefined),
    broadcast: vi.fn().mockResolvedValue(undefined),
  },
}));

import { logger, createRequestLogger, createModuleLogger } from "./logger";
import { prisma } from "@/lib/prisma";
import { notificationService } from "@/server/services/notifications";

describe("Logger", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    logger.clearContext();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Log levels", () => {
    it("deve logar mensagem de debug", () => {
      const consoleSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
      logger.debug("Debug message");
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("deve logar mensagem de info", () => {
      const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});
      logger.info("Info message");
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("deve logar mensagem de warn", () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      logger.warn("Warning message");
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("deve logar mensagem de error", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      logger.error("Error message");
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("deve logar mensagem de fatal", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      logger.fatal("Fatal message");
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("Context", () => {
    it("deve definir contexto padrão", () => {
      const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});
      logger.setContext({ userId: "user-1", companyId: "company-1" });
      logger.info("Test message");
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("deve limpar contexto", () => {
      logger.setContext({ userId: "user-1" });
      logger.clearContext();
      const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});
      logger.info("Test message");
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("deve mesclar contexto com contexto da chamada", () => {
      const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});
      logger.setContext({ userId: "user-1" });
      logger.info("Test message", { requestId: "req-1" });
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("Child logger", () => {
    it("deve criar logger filho com contexto adicional", () => {
      const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});
      const childLogger = logger.child({ source: "test-module" });
      childLogger.info("Child message");
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("deve herdar contexto do pai", () => {
      const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});
      logger.setContext({ companyId: "company-1" });
      const childLogger = logger.child({ source: "test-module" });
      childLogger.info("Child message");
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("time", () => {
    it("deve medir tempo de execução", async () => {
      const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});
      const endTimer = logger.time("operation");
      await new Promise((resolve) => setTimeout(resolve, 10));
      endTimer();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("Error logging", () => {
    it("deve logar erro com stack trace", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const testError = new Error("Test error");
      logger.error("Error occurred", { error: testError } as Parameters<typeof logger.error>[1]);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("deve logar fatal com stack trace", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const testError = new Error("Fatal error");
      logger.fatal("Fatal occurred", { error: testError } as Parameters<typeof logger.fatal>[1]);
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("Database persistence", () => {
    it("deve salvar log no banco para nível info ou superior", async () => {
      const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});
      logger.info("Info message", { userId: "user-1" });
      
      // Aguardar operação assíncrona
      await new Promise((resolve) => setTimeout(resolve, 50));
      
      expect(prisma.systemLog.create).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("Notifications", () => {
    it("deve enviar notificação para erro com userId", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      logger.error("Error message", { userId: "user-1" });
      
      // Aguardar operação assíncrona
      await new Promise((resolve) => setTimeout(resolve, 50));
      
      expect(notificationService.notifyUser).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("deve fazer broadcast para erro sem userId", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      logger.error("Error message");
      
      // Aguardar operação assíncrona
      await new Promise((resolve) => setTimeout(resolve, 50));
      
      expect(notificationService.broadcast).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});

describe("Logger Factory Functions", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("createRequestLogger", () => {
    it("deve criar logger com requestId", () => {
      const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});
      const reqLogger = createRequestLogger("req-123");
      reqLogger.info("Request log");
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("deve criar logger com requestId, userId e companyId", () => {
      const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});
      const reqLogger = createRequestLogger("req-123", "user-1", "company-1");
      reqLogger.info("Request log");
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("createModuleLogger", () => {
    it("deve criar logger com source", () => {
      const consoleSpy = vi.spyOn(console, "info").mockImplementation(() => {});
      const modLogger = createModuleLogger("auth");
      modLogger.info("Module log");
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
