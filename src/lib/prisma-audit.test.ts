/**
 * VIO-1066: Testes da Prisma Extension Audit (createAuditedPrisma)
 *
 * Testa isoladamente a Extension de auditoria antes de integrar no tenantProcedure.
 * Usa mocks para simular o PrismaClient sem acessar o banco.
 *
 * Cenários:
 * - CREATE gera log com newValues
 * - UPDATE gera log com oldValues, newValues, changedFields
 * - UPDATE sem mudanças reais NÃO gera log
 * - DELETE gera log com oldValues
 * - Campos sensíveis são redactados
 * - Non-audited models não geram log
 * - Audit log é assíncrono (não bloqueia operação principal)
 */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { createAuditedPrisma, type AuditContext } from "./prisma-audit";
import type { PrismaClient } from "@prisma/client";

const AUDIT_CONTEXT: AuditContext = {
  userId: "user-1",
  userEmail: "test@test.com",
  userName: "Test User",
  companyId: "company-a",
  companyName: "Empresa A",
  ipAddress: "127.0.0.1",
  requestPath: "/api/trpc/materials.create",
  requestMethod: "POST",
};

// Mock do auditLog.create
const mockAuditLogCreate = vi.fn().mockReturnValue({
  catch: vi.fn(),
});

// Mock do findUnique para buscar old values
const mockFindUnique = vi.fn();

function createMockPrisma() {
  const queryFn = vi.fn();

  const mockPrisma = {
    // O audit extension usa prisma.auditLog.create internamente
    auditLog: {
      create: mockAuditLogCreate,
    },
    $extends: vi.fn().mockImplementation((extension: { query: { $allModels: Record<string, unknown> } }) => {
      return new Proxy(mockPrisma, {
        get(target, prop) {
          if (prop === "$extends") return target.$extends;
          if (prop === "auditLog") return target.auditLog;
          if (prop === "_extension") return extension;

          return new Proxy(
            {},
            {
              get(_modelTarget, method) {
                return async (args: Record<string, unknown> = {}) => {
                  const hook = extension.query.$allModels[method as string];
                  if (hook) {
                    const modelName = String(prop).charAt(0).toUpperCase() + String(prop).slice(1);
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    return await (hook as (...a: any[]) => any)({
                      model: modelName,
                      args,
                      query: queryFn,
                    });
                  }
                  return queryFn(args);
                };
              },
            }
          );
        },
      });
    }),
  } as unknown as PrismaClient;

  // Mock dynamic model access for old value lookup (e.g., prisma.material.findUnique)
  // The audit extension accesses prisma[modelName.toLowerCase()].findUnique
  const handler = {
    get(target: typeof mockPrisma, prop: string | symbol) {
      if (prop === "$extends") return target.$extends;
      if (prop === "auditLog") return target.auditLog;
      // For dynamic model access like prisma.material, prisma.lead, etc.
      if (typeof prop === "string" && prop.charAt(0) === prop.charAt(0).toLowerCase()) {
        return { findUnique: mockFindUnique };
      }
      return undefined;
    },
  };

  const proxiedPrisma = new Proxy(mockPrisma, handler) as unknown as PrismaClient;

  return { mockPrisma: proxiedPrisma, queryFn };
}

describe("createAuditedPrisma — Audit Extension", () => {
  let mockPrisma: PrismaClient;
  let queryFn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    const mocks = createMockPrisma();
    mockPrisma = mocks.mockPrisma;
    queryFn = mocks.queryFn;
  });

  describe("CREATE — audited model", () => {
    it("creates audit log with newValues after successful create", async () => {
      const createdEntity = { id: "m1", code: 1, description: "Material A", companyId: "company-a" };
      queryFn.mockResolvedValueOnce(createdEntity);

      const auditedPrisma = createAuditedPrisma(mockPrisma, AUDIT_CONTEXT);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (auditedPrisma as any).material.create({
        data: { description: "Material A", companyId: "company-a" },
      });

      // Wait for async audit log
      await new Promise((r) => setTimeout(r, 10));

      expect(mockAuditLogCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: "CREATE",
            entityType: "Material",
            entityId: "m1",
            userId: "user-1",
            userEmail: "test@test.com",
            companyId: "company-a",
            newValues: expect.objectContaining({
              id: "m1",
              description: "Material A",
            }),
          }),
        })
      );
    });

    it("returns the created entity without blocking", async () => {
      const createdEntity = { id: "m1", description: "Material A" };
      queryFn.mockResolvedValueOnce(createdEntity);

      const auditedPrisma = createAuditedPrisma(mockPrisma, AUDIT_CONTEXT);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (auditedPrisma as any).material.create({
        data: { description: "Material A" },
      });

      expect(result).toEqual(createdEntity);
    });
  });

  describe("CREATE — non-audited model", () => {
    it("does NOT create audit log for non-audited models", async () => {
      const createdEntity = { id: "n1", message: "Test notification" };
      queryFn.mockResolvedValueOnce(createdEntity);

      const auditedPrisma = createAuditedPrisma(mockPrisma, AUDIT_CONTEXT);

      // Notification is NOT in AUDITED_MODELS
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (auditedPrisma as any).notification.create({
        data: { message: "Test" },
      });

      await new Promise((r) => setTimeout(r, 10));

      expect(mockAuditLogCreate).not.toHaveBeenCalled();
    });
  });

  describe("UPDATE — audited model", () => {
    it("creates audit log with oldValues, newValues, and changedFields", async () => {
      const oldEntity = { id: "m1", description: "Old Name", unit: "KG", companyId: "company-a" };
      const newEntity = { id: "m1", description: "New Name", unit: "KG", companyId: "company-a" };

      // Mock findUnique for old values
      mockFindUnique.mockResolvedValueOnce(oldEntity);
      // Mock the actual update query
      queryFn.mockResolvedValueOnce(newEntity);

      const auditedPrisma = createAuditedPrisma(mockPrisma, AUDIT_CONTEXT);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (auditedPrisma as any).material.update({
        where: { id: "m1" },
        data: { description: "New Name" },
      });

      await new Promise((r) => setTimeout(r, 10));

      expect(mockAuditLogCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: "UPDATE",
            entityType: "Material",
            entityId: "m1",
            changedFields: expect.arrayContaining(["description"]),
            oldValues: expect.objectContaining({ description: "Old Name" }),
            newValues: expect.objectContaining({ description: "New Name" }),
          }),
        })
      );
    });

    it("does NOT create audit log when no fields actually changed", async () => {
      const entity = { id: "m1", description: "Same", unit: "KG" };

      mockFindUnique.mockResolvedValueOnce(entity);
      queryFn.mockResolvedValueOnce(entity); // Same values returned

      const auditedPrisma = createAuditedPrisma(mockPrisma, AUDIT_CONTEXT);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (auditedPrisma as any).material.update({
        where: { id: "m1" },
        data: { description: "Same" },
      });

      await new Promise((r) => setTimeout(r, 10));

      expect(mockAuditLogCreate).not.toHaveBeenCalled();
    });
  });

  describe("DELETE — audited model", () => {
    it("creates audit log with oldValues before deletion", async () => {
      const oldEntity = { id: "m1", description: "Deleted Material", code: 42, companyId: "company-a" };

      mockFindUnique.mockResolvedValueOnce(oldEntity);
      queryFn.mockResolvedValueOnce(oldEntity);

      const auditedPrisma = createAuditedPrisma(mockPrisma, AUDIT_CONTEXT);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (auditedPrisma as any).material.delete({
        where: { id: "m1" },
      });

      await new Promise((r) => setTimeout(r, 10));

      expect(mockAuditLogCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: "DELETE",
            entityType: "Material",
            entityId: "m1",
            oldValues: expect.objectContaining({
              description: "Deleted Material",
            }),
          }),
        })
      );
    });
  });

  describe("sensitive fields redaction", () => {
    it("redacts password and token fields in audit log", async () => {
      const createdEntity = {
        id: "u1",
        email: "user@test.com",
        password: "secret123",
        token: "jwt-token-xyz",
        name: "Test User",
      };
      queryFn.mockResolvedValueOnce(createdEntity);

      const auditedPrisma = createAuditedPrisma(mockPrisma, AUDIT_CONTEXT);

      // User IS in AUDITED_MODELS
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (auditedPrisma as any).user.create({
        data: { email: "user@test.com", password: "secret123" },
      });

      await new Promise((r) => setTimeout(r, 10));

      expect(mockAuditLogCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            newValues: expect.objectContaining({
              password: "[REDACTED]",
              token: "[REDACTED]",
              name: "Test User",
              email: "user@test.com",
            }),
          }),
        })
      );
    });
  });

  describe("audit context propagation", () => {
    it("includes full audit context in log entry", async () => {
      const createdEntity = { id: "m1", description: "Test" };
      queryFn.mockResolvedValueOnce(createdEntity);

      const auditedPrisma = createAuditedPrisma(mockPrisma, AUDIT_CONTEXT);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (auditedPrisma as any).material.create({
        data: { description: "Test" },
      });

      await new Promise((r) => setTimeout(r, 10));

      expect(mockAuditLogCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: "user-1",
            userEmail: "test@test.com",
            userName: "Test User",
            companyId: "company-a",
            companyName: "Empresa A",
            ipAddress: "127.0.0.1",
            requestPath: "/api/trpc/materials.create",
            requestMethod: "POST",
          }),
        })
      );
    });
  });

  describe("audit log failure resilience", () => {
    it("does not throw when audit log creation fails", async () => {
      const createdEntity = { id: "m1", description: "Test" };
      queryFn.mockResolvedValueOnce(createdEntity);

      // Make audit log creation fail
      mockAuditLogCreate.mockReturnValueOnce({
        catch: (fn: (err: Error) => void) => fn(new Error("DB error")),
      });

      const auditedPrisma = createAuditedPrisma(mockPrisma, AUDIT_CONTEXT);

      // Should NOT throw — audit failure should not break the main operation
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (auditedPrisma as any).material.create({
        data: { description: "Test" },
      });

      expect(result).toEqual(createdEntity);
    });
  });
});
