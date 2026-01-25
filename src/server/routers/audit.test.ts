import { describe, it, expect } from "vitest";
import { z } from "zod";

/**
 * Testes de schema para o router audit
 * Valida inputs e estruturas de dados de auditoria
 */

// Schema de ações de auditoria
const auditActionSchema = z.enum([
  "CREATE", 
  "UPDATE", 
  "DELETE", 
  "VIEW", 
  "LOGIN", 
  "LOGOUT", 
  "EXPORT", 
  "IMPORT"
]);

// Schema de input para listagem
const listInputSchema = z.object({
  userId: z.string().optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  action: auditActionSchema.optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  search: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(50),
}).optional();

// Schema de input para busca por ID
const byIdInputSchema = z.object({
  id: z.string(),
});

// Schema de input para estatísticas
const statsInputSchema = z.object({
  startDate: z.date().optional(),
  endDate: z.date().optional(),
}).optional();

// Schema de log de auditoria
const auditLogSchema = z.object({
  id: z.string(),
  companyId: z.string().nullable(),
  userId: z.string().nullable(),
  userName: z.string().nullable(),
  userEmail: z.string().nullable(),
  action: auditActionSchema,
  entityType: z.string(),
  entityId: z.string().nullable(),
  entityCode: z.string().nullable(),
  description: z.string().nullable(),
  oldValues: z.any().nullable(),
  newValues: z.any().nullable(),
  changedFields: z.array(z.string()),
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
  createdAt: z.date(),
});

// Schema de paginação
const paginationSchema = z.object({
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  totalPages: z.number(),
});

// Schema de resposta de listagem
const listResponseSchema = z.object({
  logs: z.array(auditLogSchema.extend({
    user: z.object({
      id: z.string(),
      name: z.string().nullable(),
      email: z.string(),
    }).nullable(),
  })),
  pagination: paginationSchema,
});

// Schema de estatísticas
const statsResponseSchema = z.object({
  totalLogs: z.number(),
  byAction: z.array(z.object({
    action: z.string(),
    count: z.number(),
  })),
  byEntityType: z.array(z.object({
    entityType: z.string(),
    count: z.number(),
  })),
  byUser: z.array(z.object({
    userId: z.string().nullable(),
    userName: z.string().nullable(),
    count: z.number(),
  })),
});

describe("Audit Router Schemas", () => {
  describe("Audit Action Schema", () => {
    it("should accept CREATE action", () => {
      const result = auditActionSchema.safeParse("CREATE");
      expect(result.success).toBe(true);
    });

    it("should accept UPDATE action", () => {
      const result = auditActionSchema.safeParse("UPDATE");
      expect(result.success).toBe(true);
    });

    it("should accept DELETE action", () => {
      const result = auditActionSchema.safeParse("DELETE");
      expect(result.success).toBe(true);
    });

    it("should accept VIEW action", () => {
      const result = auditActionSchema.safeParse("VIEW");
      expect(result.success).toBe(true);
    });

    it("should accept LOGIN action", () => {
      const result = auditActionSchema.safeParse("LOGIN");
      expect(result.success).toBe(true);
    });

    it("should accept LOGOUT action", () => {
      const result = auditActionSchema.safeParse("LOGOUT");
      expect(result.success).toBe(true);
    });

    it("should accept EXPORT action", () => {
      const result = auditActionSchema.safeParse("EXPORT");
      expect(result.success).toBe(true);
    });

    it("should accept IMPORT action", () => {
      const result = auditActionSchema.safeParse("IMPORT");
      expect(result.success).toBe(true);
    });

    it("should reject invalid action", () => {
      const result = auditActionSchema.safeParse("INVALID");
      expect(result.success).toBe(false);
    });

    it("should reject lowercase action", () => {
      const result = auditActionSchema.safeParse("create");
      expect(result.success).toBe(false);
    });
  });

  describe("List Input Schema", () => {
    it("should accept empty input (undefined)", () => {
      const result = listInputSchema.safeParse(undefined);
      expect(result.success).toBe(true);
    });

    it("should accept empty object", () => {
      const result = listInputSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("should accept complete filter", () => {
      const input = {
        userId: "user-123",
        entityType: "Material",
        entityId: "mat-456",
        action: "CREATE" as const,
        startDate: new Date("2026-01-01"),
        endDate: new Date("2026-01-31"),
        search: "teste",
        page: 1,
        limit: 20,
      };

      const result = listInputSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should apply default page value", () => {
      const input = { limit: 20 };
      const result = listInputSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.page).toBe(1);
      }
    });

    it("should apply default limit value", () => {
      const input = { page: 1 };
      const result = listInputSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.limit).toBe(50);
      }
    });

    it("should reject page less than 1", () => {
      const input = { page: 0 };
      const result = listInputSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should reject negative page", () => {
      const input = { page: -1 };
      const result = listInputSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should reject limit greater than 100", () => {
      const input = { limit: 101 };
      const result = listInputSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should reject limit less than 1", () => {
      const input = { limit: 0 };
      const result = listInputSchema.safeParse(input);
      expect(result.success).toBe(false);
    });

    it("should accept date range filter", () => {
      const input = {
        startDate: new Date("2026-01-01"),
        endDate: new Date("2026-01-31"),
      };

      const result = listInputSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should accept search filter", () => {
      const input = { search: "material" };
      const result = listInputSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });

  describe("ById Input Schema", () => {
    it("should accept valid id", () => {
      const result = byIdInputSchema.safeParse({ id: "uuid-123" });
      expect(result.success).toBe(true);
    });

    it("should reject missing id", () => {
      const result = byIdInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("should reject non-string id", () => {
      const result = byIdInputSchema.safeParse({ id: 123 });
      expect(result.success).toBe(false);
    });
  });

  describe("Stats Input Schema", () => {
    it("should accept empty input", () => {
      const result = statsInputSchema.safeParse(undefined);
      expect(result.success).toBe(true);
    });

    it("should accept date range", () => {
      const input = {
        startDate: new Date("2026-01-01"),
        endDate: new Date("2026-01-31"),
      };

      const result = statsInputSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should accept only startDate", () => {
      const input = { startDate: new Date("2026-01-01") };
      const result = statsInputSchema.safeParse(input);
      expect(result.success).toBe(true);
    });

    it("should accept only endDate", () => {
      const input = { endDate: new Date("2026-01-31") };
      const result = statsInputSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });

  describe("Audit Log Schema", () => {
    it("should validate complete audit log", () => {
      const log = {
        id: "log-123",
        companyId: "company-456",
        userId: "user-789",
        userName: "João Silva",
        userEmail: "joao@empresa.com",
        action: "CREATE" as const,
        entityType: "Material",
        entityId: "mat-001",
        entityCode: "MAT-001",
        description: "Material criado",
        oldValues: null,
        newValues: { code: "MAT-001", description: "Parafuso" },
        changedFields: ["code", "description"],
        ipAddress: "192.168.1.1",
        userAgent: "Mozilla/5.0",
        createdAt: new Date(),
      };

      const result = auditLogSchema.safeParse(log);
      expect(result.success).toBe(true);
    });

    it("should validate audit log with null optional fields", () => {
      const log = {
        id: "log-123",
        companyId: null,
        userId: null,
        userName: null,
        userEmail: null,
        action: "VIEW" as const,
        entityType: "Dashboard",
        entityId: null,
        entityCode: null,
        description: null,
        oldValues: null,
        newValues: null,
        changedFields: [],
        ipAddress: null,
        userAgent: null,
        createdAt: new Date(),
      };

      const result = auditLogSchema.safeParse(log);
      expect(result.success).toBe(true);
    });

    it("should validate UPDATE action with old and new values", () => {
      const log = {
        id: "log-456",
        companyId: "company-123",
        userId: "user-456",
        userName: "Maria",
        userEmail: "maria@empresa.com",
        action: "UPDATE" as const,
        entityType: "Supplier",
        entityId: "sup-001",
        entityCode: "FORN-001",
        description: "Fornecedor atualizado",
        oldValues: { phone: "11999999999" },
        newValues: { phone: "11888888888" },
        changedFields: ["phone"],
        ipAddress: "10.0.0.1",
        userAgent: "Chrome",
        createdAt: new Date(),
      };

      const result = auditLogSchema.safeParse(log);
      expect(result.success).toBe(true);
    });

    it("should validate DELETE action", () => {
      const log = {
        id: "log-789",
        companyId: "company-123",
        userId: "user-456",
        userName: "Admin",
        userEmail: "admin@empresa.com",
        action: "DELETE" as const,
        entityType: "Quote",
        entityId: "quote-001",
        entityCode: "COT-001",
        description: "Cotação excluída",
        oldValues: { status: "DRAFT", totalValue: 1500 },
        newValues: null,
        changedFields: [],
        ipAddress: "192.168.0.100",
        userAgent: "Firefox",
        createdAt: new Date(),
      };

      const result = auditLogSchema.safeParse(log);
      expect(result.success).toBe(true);
    });

    it("should reject missing required fields", () => {
      const log = {
        id: "log-123",
        action: "CREATE",
        // missing entityType, changedFields, createdAt
      };

      const result = auditLogSchema.safeParse(log);
      expect(result.success).toBe(false);
    });
  });

  describe("Pagination Schema", () => {
    it("should validate pagination", () => {
      const pagination = {
        total: 100,
        page: 1,
        limit: 20,
        totalPages: 5,
      };

      const result = paginationSchema.safeParse(pagination);
      expect(result.success).toBe(true);
    });

    it("should validate empty results pagination", () => {
      const pagination = {
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      };

      const result = paginationSchema.safeParse(pagination);
      expect(result.success).toBe(true);
    });

    it("should reject missing total", () => {
      const pagination = {
        page: 1,
        limit: 20,
        totalPages: 5,
      };

      const result = paginationSchema.safeParse(pagination);
      expect(result.success).toBe(false);
    });
  });

  describe("List Response Schema", () => {
    it("should validate empty list response", () => {
      const response = {
        logs: [],
        pagination: {
          total: 0,
          page: 1,
          limit: 20,
          totalPages: 0,
        },
      };

      const result = listResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });

    it("should validate list response with logs", () => {
      const response = {
        logs: [
          {
            id: "log-1",
            companyId: "company-1",
            userId: "user-1",
            userName: "User 1",
            userEmail: "user1@test.com",
            action: "CREATE" as const,
            entityType: "Material",
            entityId: "mat-1",
            entityCode: "MAT-001",
            description: "Created",
            oldValues: null,
            newValues: {},
            changedFields: [],
            ipAddress: "127.0.0.1",
            userAgent: "Test",
            createdAt: new Date(),
            user: {
              id: "user-1",
              name: "User 1",
              email: "user1@test.com",
            },
          },
        ],
        pagination: {
          total: 1,
          page: 1,
          limit: 20,
          totalPages: 1,
        },
      };

      const result = listResponseSchema.safeParse(response);
      expect(result.success).toBe(true);
    });
  });

  describe("Stats Response Schema", () => {
    it("should validate stats response", () => {
      const stats = {
        totalLogs: 1000,
        byAction: [
          { action: "CREATE", count: 400 },
          { action: "UPDATE", count: 350 },
          { action: "DELETE", count: 100 },
          { action: "VIEW", count: 150 },
        ],
        byEntityType: [
          { entityType: "Material", count: 300 },
          { entityType: "Supplier", count: 200 },
          { entityType: "Quote", count: 500 },
        ],
        byUser: [
          { userId: "user-1", userName: "Admin", count: 500 },
          { userId: "user-2", userName: "Operador", count: 500 },
        ],
      };

      const result = statsResponseSchema.safeParse(stats);
      expect(result.success).toBe(true);
    });

    it("should validate empty stats", () => {
      const stats = {
        totalLogs: 0,
        byAction: [],
        byEntityType: [],
        byUser: [],
      };

      const result = statsResponseSchema.safeParse(stats);
      expect(result.success).toBe(true);
    });

    it("should validate stats with null userId", () => {
      const stats = {
        totalLogs: 10,
        byAction: [{ action: "LOGIN", count: 10 }],
        byEntityType: [{ entityType: "Session", count: 10 }],
        byUser: [{ userId: null, userName: null, count: 10 }],
      };

      const result = statsResponseSchema.safeParse(stats);
      expect(result.success).toBe(true);
    });
  });

  describe("Entity Types", () => {
    it("should accept common entity types", () => {
      const entityTypes = [
        "Material",
        "Supplier",
        "Quote",
        "PurchaseOrder",
        "ReceivedInvoice",
        "AccountsPayable",
        "Inventory",
        "Employee",
        "User",
        "Company",
      ];

      entityTypes.forEach(entityType => {
        const log = {
          id: "log-1",
          companyId: "company-1",
          userId: "user-1",
          userName: "Test",
          userEmail: "test@test.com",
          action: "VIEW" as const,
          entityType,
          entityId: "entity-1",
          entityCode: "CODE-001",
          description: `Viewed ${entityType}`,
          oldValues: null,
          newValues: null,
          changedFields: [],
          ipAddress: null,
          userAgent: null,
          createdAt: new Date(),
        };

        const result = auditLogSchema.safeParse(log);
        expect(result.success).toBe(true);
      });
    });
  });

  describe("Changed Fields", () => {
    it("should accept empty changed fields for VIEW action", () => {
      const log = {
        id: "log-1",
        companyId: "company-1",
        userId: "user-1",
        userName: "Test",
        userEmail: "test@test.com",
        action: "VIEW" as const,
        entityType: "Material",
        entityId: "mat-1",
        entityCode: null,
        description: null,
        oldValues: null,
        newValues: null,
        changedFields: [],
        ipAddress: null,
        userAgent: null,
        createdAt: new Date(),
      };

      const result = auditLogSchema.safeParse(log);
      expect(result.success).toBe(true);
    });

    it("should accept multiple changed fields for UPDATE action", () => {
      const log = {
        id: "log-1",
        companyId: "company-1",
        userId: "user-1",
        userName: "Test",
        userEmail: "test@test.com",
        action: "UPDATE" as const,
        entityType: "Supplier",
        entityId: "sup-1",
        entityCode: "FORN-001",
        description: "Updated supplier",
        oldValues: { phone: "111", email: "old@test.com", address: "Old St" },
        newValues: { phone: "222", email: "new@test.com", address: "New St" },
        changedFields: ["phone", "email", "address"],
        ipAddress: "192.168.1.1",
        userAgent: "Chrome",
        createdAt: new Date(),
      };

      const result = auditLogSchema.safeParse(log);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.changedFields).toHaveLength(3);
      }
    });
  });
});
