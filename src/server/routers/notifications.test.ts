import { describe, it, expect } from "vitest";
import { z } from "zod";

/**
 * Testes de schema para o router notifications
 * Valida inputs e estruturas de dados de notificações
 */

// Schema de tipo de notificação
const notificationTypeSchema = z.enum(["info", "success", "warning", "error"]);

// Schema de categoria de notificação
const notificationCategorySchema = z.enum(["system", "business", "error"]);

// Schema de input para listagem
const listInputSchema = z.object({
  page: z.number().default(1),
  limit: z.number().default(20),
  category: notificationCategorySchema.optional(),
  unreadOnly: z.boolean().default(false),
}).optional();

// Schema de input para não lidas
const unreadInputSchema = z.object({
  limit: z.number().default(10),
}).optional();

// Schema de input para marcar como lida
const markAsReadInputSchema = z.object({
  id: z.string(),
});

// Schema de input para criar notificação
const createInputSchema = z.object({
  userId: z.string().optional(),
  companyId: z.string().optional(),
  type: notificationTypeSchema,
  category: notificationCategorySchema,
  title: z.string(),
  message: z.string().optional(),
  link: z.string().optional(),
});

// Schema de notificação
const notificationSchema = z.object({
  id: z.string(),
  userId: z.string().nullable(),
  companyId: z.string().nullable(),
  type: notificationTypeSchema,
  category: notificationCategorySchema,
  title: z.string(),
  message: z.string().nullable(),
  link: z.string().nullable(),
  isRead: z.boolean(),
  readAt: z.date().nullable(),
  createdAt: z.date(),
});

// Schema de resposta de listagem
const listResponseSchema = z.object({
  notifications: z.array(notificationSchema),
  total: z.number(),
  pages: z.number(),
  page: z.number(),
});

describe("Notifications Router Schemas", () => {
  describe("Notification Type Schema", () => {
    it("should accept info type", () => {
      const result = notificationTypeSchema.safeParse("info");
      expect(result.success).toBe(true);
    });

    it("should accept success type", () => {
      const result = notificationTypeSchema.safeParse("success");
      expect(result.success).toBe(true);
    });

    it("should accept warning type", () => {
      const result = notificationTypeSchema.safeParse("warning");
      expect(result.success).toBe(true);
    });

    it("should accept error type", () => {
      const result = notificationTypeSchema.safeParse("error");
      expect(result.success).toBe(true);
    });

    it("should reject invalid type", () => {
      const result = notificationTypeSchema.safeParse("alert");
      expect(result.success).toBe(false);
    });
  });

  describe("Notification Category Schema", () => {
    it("should accept system category", () => {
      const result = notificationCategorySchema.safeParse("system");
      expect(result.success).toBe(true);
    });

    it("should accept business category", () => {
      const result = notificationCategorySchema.safeParse("business");
      expect(result.success).toBe(true);
    });

    it("should accept error category", () => {
      const result = notificationCategorySchema.safeParse("error");
      expect(result.success).toBe(true);
    });

    it("should reject invalid category", () => {
      const result = notificationCategorySchema.safeParse("user");
      expect(result.success).toBe(false);
    });
  });

  describe("List Input Schema", () => {
    it("should accept empty input", () => {
      const result = listInputSchema.safeParse(undefined);
      expect(result.success).toBe(true);
    });

    it("should accept empty object with defaults", () => {
      const result = listInputSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
        expect(result.data.unreadOnly).toBe(false);
      }
    });

    it("should accept pagination parameters", () => {
      const input = { page: 2, limit: 50 };
      const result = listInputSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should accept category filter", () => {
      const input = { category: "business" as const };
      const result = listInputSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should accept unreadOnly filter", () => {
      const input = { unreadOnly: true };
      const result = listInputSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should accept combined filters", () => {
      const input = {
        page: 1,
        limit: 10,
        category: "system" as const,
        unreadOnly: true,
      };
      const result = listInputSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });

  describe("Unread Input Schema", () => {
    it("should accept empty input", () => {
      const result = unreadInputSchema.safeParse(undefined);
      expect(result.success).toBe(true);
    });

    it("should accept limit parameter", () => {
      const input = { limit: 5 };
      const result = unreadInputSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should apply default limit", () => {
      const result = unreadInputSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.limit).toBe(10);
      }
    });
  });

  describe("Mark As Read Input Schema", () => {
    it("should accept valid id", () => {
      const input = { id: "notification-123" };
      const result = markAsReadInputSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should accept UUID id", () => {
      const input = { id: "550e8400-e29b-41d4-a716-446655440000" };
      const result = markAsReadInputSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should reject missing id", () => {
      const result = markAsReadInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("should reject non-string id", () => {
      const input = { id: 123 };
      const result = markAsReadInputSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe("Create Input Schema", () => {
    it("should accept minimal notification", () => {
      const input = {
        type: "info" as const,
        category: "system" as const,
        title: "Nova atualização disponível",
      };
      const result = createInputSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should accept complete notification", () => {
      const input = {
        userId: "user-123",
        companyId: "company-456",
        type: "success" as const,
        category: "business" as const,
        title: "Pedido aprovado",
        message: "O pedido #123 foi aprovado com sucesso.",
        link: "/orders/123",
      };
      const result = createInputSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should accept global notification (no userId)", () => {
      const input = {
        type: "warning" as const,
        category: "system" as const,
        title: "Manutenção programada",
        message: "O sistema estará em manutenção das 22h às 23h.",
      };
      const result = createInputSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should accept error notification", () => {
      const input = {
        userId: "user-123",
        type: "error" as const,
        category: "error" as const,
        title: "Falha na importação",
        message: "Erro ao importar arquivo: formato inválido.",
        link: "/imports/failed",
      };
      const result = createInputSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should reject missing title", () => {
      const input = {
        type: "info" as const,
        category: "system" as const,
      };
      const result = createInputSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing type", () => {
      const input = {
        category: "system" as const,
        title: "Título",
      };
      const result = createInputSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should reject missing category", () => {
      const input = {
        type: "info" as const,
        title: "Título",
      };
      const result = createInputSchema.safeParse(input);
      expect(result.success).toBe(false);
    });
  });

  describe("Notification Schema", () => {
    it("should validate complete notification", () => {
      const notification = {
        id: "notif-123",
        userId: "user-456",
        companyId: "company-789",
        type: "success" as const,
        category: "business" as const,
        title: "Operação concluída",
        message: "A operação foi concluída com sucesso.",
        link: "/operations/123",
        isRead: false,
        readAt: null,
        createdAt: new Date(),
      };
      const result = notificationSchema.safeParse(notification);
      expect(result.success).toBe(true);
    });

    it("should validate read notification", () => {
      const notification = {
        id: "notif-123",
        userId: "user-456",
        companyId: null,
        type: "info" as const,
        category: "system" as const,
        title: "Informação",
        message: null,
        link: null,
        isRead: true,
        readAt: new Date(),
        createdAt: new Date(),
      };
      const result = notificationSchema.safeParse(notification);
      expect(result.success).toBe(true);
    });

    it("should validate global notification (null userId)", () => {
      const notification = {
        id: "notif-123",
        userId: null,
        companyId: null,
        type: "warning" as const,
        category: "system" as const,
        title: "Aviso global",
        message: "Mensagem para todos os usuários",
        link: null,
        isRead: false,
        readAt: null,
        createdAt: new Date(),
      };
      const result = notificationSchema.safeParse(notification);
      expect(result.success).toBe(true);
    });
  });

  describe("List Response Schema", () => {
    it("should validate empty list response", () => {
      const response = {
        notifications: [],
        total: 0,
        pages: 0,
        page: 1,
      };
      const result = listResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });

    it("should validate list response with notifications", () => {
      const response = {
        notifications: [
          {
            id: "notif-1",
            userId: "user-1",
            companyId: null,
            type: "info" as const,
            category: "system" as const,
            title: "Notificação 1",
            message: null,
            link: null,
            isRead: false,
            readAt: null,
            createdAt: new Date(),
          },
          {
            id: "notif-2",
            userId: "user-1",
            companyId: null,
            type: "success" as const,
            category: "business" as const,
            title: "Notificação 2",
            message: "Detalhes",
            link: "/link",
            isRead: true,
            readAt: new Date(),
            createdAt: new Date(),
          },
        ],
        total: 2,
        pages: 1,
        page: 1,
      };
      const result = listResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });

    it("should validate paginated response", () => {
      const response = {
        notifications: [],
        total: 100,
        pages: 5,
        page: 3,
      };
      const result = listResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });
  });

  describe("Notification Types Usage", () => {
    it("should use info for general information", () => {
      const notification = {
        type: "info" as const,
        category: "system" as const,
        title: "Nova versão disponível",
      };
      const result = createInputSchema.safeParse(notification);
      expect(result.success).toBe(true);
    });

    it("should use success for completed operations", () => {
      const notification = {
        type: "success" as const,
        category: "business" as const,
        title: "Pedido enviado com sucesso",
      };
      const result = createInputSchema.safeParse(notification);
      expect(result.success).toBe(true);
    });

    it("should use warning for attention required", () => {
      const notification = {
        type: "warning" as const,
        category: "business" as const,
        title: "Estoque baixo",
        message: "5 itens abaixo do mínimo",
      };
      const result = createInputSchema.safeParse(notification);
      expect(result.success).toBe(true);
    });

    it("should use error for failures", () => {
      const notification = {
        type: "error" as const,
        category: "error" as const,
        title: "Falha no processamento",
        message: "Erro ao processar arquivo",
      };
      const result = createInputSchema.safeParse(notification);
      expect(result.success).toBe(true);
    });
  });

  describe("Notification Categories Usage", () => {
    it("should use system for platform notifications", () => {
      const notification = {
        type: "info" as const,
        category: "system" as const,
        title: "Manutenção programada",
      };
      const result = createInputSchema.safeParse(notification);
      expect(result.success).toBe(true);
    });

    it("should use business for operational notifications", () => {
      const notification = {
        type: "success" as const,
        category: "business" as const,
        title: "Cotação aprovada",
      };
      const result = createInputSchema.safeParse(notification);
      expect(result.success).toBe(true);
    });

    it("should use error for error notifications", () => {
      const notification = {
        type: "error" as const,
        category: "error" as const,
        title: "Erro de integração",
      };
      const result = createInputSchema.safeParse(notification);
      expect(result.success).toBe(true);
    });
  });
});
