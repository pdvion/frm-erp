/**
 * VIO-1066: Testes da Prisma Extension RLS (createTenantPrisma)
 *
 * Testa isoladamente a Extension antes de integrar no tenantProcedure.
 * Usa mocks para simular o PrismaClient sem acessar o banco.
 *
 * Cenários:
 * - findMany/findFirst injetam companyId no where
 * - findUnique bloqueia registros de outra empresa (post-query)
 * - create/createMany injetam companyId no data
 * - update/delete injetam companyId no where
 * - upsert injeta companyId no where e create
 * - Shared models usam OR filter (companyId | null | isShared)
 * - Non-tenant models não são filtrados
 * - null companyId retorna prisma original
 */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { createTenantPrisma } from "./prisma-rls";
import type { PrismaClient } from "@prisma/client";

const COMPANY_A = "company-a-uuid";
const COMPANY_B = "company-b-uuid";

// Helper: cria um mock de PrismaClient com $extends funcional
function createMockPrisma() {
  const queryFn = vi.fn();

  // Simula $extends retornando um proxy que intercepta chamadas
  const mockPrisma = {
    $extends: vi.fn().mockImplementation((extension: { query: { $allModels: Record<string, unknown> } }) => {
      // Retorna um proxy que, ao acessar um model, retorna métodos que chamam os hooks da extension
      return new Proxy(mockPrisma, {
        get(target, prop) {
          if (prop === "$extends") return target.$extends;
          if (prop === "_extension") return extension;

          // Para qualquer model (ex: material, lead), retorna métodos mockados
          return new Proxy(
            {},
            {
              get(_modelTarget, method) {
                // Retorna uma função que executa o hook da extension
                return async (args: Record<string, unknown> = {}) => {
                  const hook = extension.query.$allModels[method as string];
                  if (hook) {
                    // O hook recebe { model, args, query }
                    // model é o PascalCase do prop (ex: "material" → "Material")
                    const modelName = String(prop).charAt(0).toUpperCase() + String(prop).slice(1);
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const result = await (hook as (...a: any[]) => any)({
                      model: modelName,
                      args,
                      query: queryFn.mockImplementation(async (a: unknown) => a),
                    });
                    return result;
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

  return { mockPrisma, queryFn };
}

describe("createTenantPrisma — RLS Extension", () => {
  let mockPrisma: PrismaClient;
  let queryFn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    const mocks = createMockPrisma();
    mockPrisma = mocks.mockPrisma;
    queryFn = mocks.queryFn;
  });

  describe("null companyId", () => {
    it("returns original prisma when companyId is null", () => {
      const result = createTenantPrisma(mockPrisma, null);
      expect(result).toBe(mockPrisma);
      expect(mockPrisma.$extends).not.toHaveBeenCalled();
    });
  });

  describe("findMany — tenant model", () => {
    it("injects companyId OR filter into where clause", async () => {
      const tenantPrisma = createTenantPrisma(mockPrisma, COMPANY_A);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (tenantPrisma as any).material.findMany({ where: { unit: "KG" } });

      // O queryFn recebe os args modificados
      expect(queryFn).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            unit: "KG",
            OR: expect.arrayContaining([
              { companyId: COMPANY_A },
              { companyId: null },
            ]),
          }),
        })
      );
    });

    it("works with empty where clause", async () => {
      const tenantPrisma = createTenantPrisma(mockPrisma, COMPANY_A);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (tenantPrisma as any).material.findMany({});

      expect(queryFn).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { companyId: COMPANY_A },
              { companyId: null },
            ]),
          }),
        })
      );
    });
  });

  describe("findMany — shared model", () => {
    it("includes isShared: true in OR filter for shared models", async () => {
      const tenantPrisma = createTenantPrisma(mockPrisma, COMPANY_A);

      // Material is in SHARED_MODELS
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (tenantPrisma as any).material.findMany({ where: {} });

      expect(queryFn).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { companyId: COMPANY_A },
              { companyId: null },
              { isShared: true },
            ]),
          }),
        })
      );
    });
  });

  describe("findMany — non-tenant model", () => {
    it("does NOT inject filter for models not in TENANT_MODELS", async () => {
      const tenantPrisma = createTenantPrisma(mockPrisma, COMPANY_A);

      // "User" is not in TENANT_MODELS
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (tenantPrisma as any).user.findMany({ where: { email: "test@test.com" } });

      expect(queryFn).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { email: "test@test.com" },
        })
      );
    });
  });

  describe("findFirst — tenant model", () => {
    it("injects companyId filter", async () => {
      const tenantPrisma = createTenantPrisma(mockPrisma, COMPANY_A);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (tenantPrisma as any).lead.findFirst({ where: { id: "lead-1" } });

      expect(queryFn).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: "lead-1",
            OR: expect.arrayContaining([
              { companyId: COMPANY_A },
            ]),
          }),
        })
      );
    });
  });

  describe("findUnique — tenant model (post-query check)", () => {
    it("returns result when companyId matches", async () => {
      const tenantPrisma = createTenantPrisma(mockPrisma, COMPANY_A);

      // Mock query to return a record from Company A
      queryFn.mockResolvedValueOnce({ id: "m1", companyId: COMPANY_A, description: "Test" });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (tenantPrisma as any).material.findUnique({ where: { id: "m1" } });

      expect(result).toEqual({ id: "m1", companyId: COMPANY_A, description: "Test" });
    });

    it("returns null when companyId does NOT match (IDOR prevention)", async () => {
      const tenantPrisma = createTenantPrisma(mockPrisma, COMPANY_A);

      // Mock query to return a record from Company B
      queryFn.mockResolvedValueOnce({ id: "m2", companyId: COMPANY_B, description: "Other" });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (tenantPrisma as any).material.findUnique({ where: { id: "m2" } });

      expect(result).toBeNull();
    });

    it("returns shared record even from different company", async () => {
      const tenantPrisma = createTenantPrisma(mockPrisma, COMPANY_A);

      // Mock query to return a shared record from Company B
      queryFn.mockResolvedValueOnce({ id: "m3", companyId: COMPANY_B, isShared: true, description: "Shared" });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (tenantPrisma as any).material.findUnique({ where: { id: "m3" } });

      expect(result).toEqual({ id: "m3", companyId: COMPANY_B, isShared: true, description: "Shared" });
    });

    it("returns null record as-is", async () => {
      const tenantPrisma = createTenantPrisma(mockPrisma, COMPANY_A);

      queryFn.mockResolvedValueOnce(null);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (tenantPrisma as any).material.findUnique({ where: { id: "nonexistent" } });

      expect(result).toBeNull();
    });
  });

  describe("count — tenant model", () => {
    it("injects companyId filter", async () => {
      const tenantPrisma = createTenantPrisma(mockPrisma, COMPANY_A);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (tenantPrisma as any).inventory.count({ where: {} });

      expect(queryFn).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { companyId: COMPANY_A },
            ]),
          }),
        })
      );
    });
  });

  describe("aggregate — tenant model", () => {
    it("injects companyId filter", async () => {
      const tenantPrisma = createTenantPrisma(mockPrisma, COMPANY_A);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (tenantPrisma as any).accountsPayable.aggregate({
        where: { status: "PENDING" },
        _sum: { amount: true },
      });

      expect(queryFn).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: "PENDING",
            OR: expect.arrayContaining([
              { companyId: COMPANY_A },
            ]),
          }),
        })
      );
    });
  });

  describe("groupBy — tenant model", () => {
    it("injects companyId filter", async () => {
      const tenantPrisma = createTenantPrisma(mockPrisma, COMPANY_A);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (tenantPrisma as any).lead.groupBy({
        by: ["status"],
        where: {},
        _count: true,
      });

      expect(queryFn).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { companyId: COMPANY_A },
            ]),
          }),
        })
      );
    });
  });

  describe("create — tenant model", () => {
    it("injects companyId into data when not provided", async () => {
      const tenantPrisma = createTenantPrisma(mockPrisma, COMPANY_A);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (tenantPrisma as any).material.create({
        data: { description: "New Material", unit: "KG" },
      });

      expect(queryFn).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            description: "New Material",
            unit: "KG",
            companyId: COMPANY_A,
          }),
        })
      );
    });

    it("does NOT override companyId if already provided", async () => {
      const tenantPrisma = createTenantPrisma(mockPrisma, COMPANY_A);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (tenantPrisma as any).material.create({
        data: { description: "New Material", companyId: COMPANY_A },
      });

      expect(queryFn).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            description: "New Material",
            companyId: COMPANY_A,
          }),
        })
      );
    });
  });

  describe("createMany — tenant model", () => {
    it("injects companyId into each record", async () => {
      const tenantPrisma = createTenantPrisma(mockPrisma, COMPANY_A);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (tenantPrisma as any).material.createMany({
        data: [
          { description: "Material 1" },
          { description: "Material 2", companyId: COMPANY_A },
        ],
      });

      expect(queryFn).toHaveBeenCalledWith(
        expect.objectContaining({
          data: [
            { description: "Material 1", companyId: COMPANY_A },
            { description: "Material 2", companyId: COMPANY_A },
          ],
        })
      );
    });
  });

  describe("update — tenant model", () => {
    it("injects companyId filter into where", async () => {
      const tenantPrisma = createTenantPrisma(mockPrisma, COMPANY_A);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (tenantPrisma as any).lead.update({
        where: { id: "lead-1" },
        data: { status: "WON" },
      });

      expect(queryFn).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: "lead-1",
            OR: expect.arrayContaining([
              { companyId: COMPANY_A },
            ]),
          }),
        })
      );
    });
  });

  describe("delete — tenant model", () => {
    it("injects companyId filter into where", async () => {
      const tenantPrisma = createTenantPrisma(mockPrisma, COMPANY_A);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (tenantPrisma as any).lead.delete({
        where: { id: "lead-1" },
      });

      expect(queryFn).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: "lead-1",
            OR: expect.arrayContaining([
              { companyId: COMPANY_A },
            ]),
          }),
        })
      );
    });
  });

  describe("upsert — tenant model", () => {
    it("injects companyId in where and create", async () => {
      const tenantPrisma = createTenantPrisma(mockPrisma, COMPANY_A);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (tenantPrisma as any).material.upsert({
        where: { id: "m1" },
        create: { description: "New", unit: "KG" },
        update: { description: "Updated" },
      });

      expect(queryFn).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: "m1",
            OR: expect.arrayContaining([
              { companyId: COMPANY_A },
            ]),
          }),
          create: expect.objectContaining({
            description: "New",
            unit: "KG",
            companyId: COMPANY_A,
          }),
        })
      );
    });
  });

  describe("IDOR prevention — cross-tenant scenarios", () => {
    it("findFirst with Company A context cannot see Company B data", async () => {
      const tenantPrisma = createTenantPrisma(mockPrisma, COMPANY_A);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (tenantPrisma as any).lead.findFirst({ where: { id: "lead-from-b" } });

      // The filter should include Company A's companyId, not B's
      const calledArgs = queryFn.mock.calls[0][0];
      expect(calledArgs.where.OR).toContainEqual({ companyId: COMPANY_A });
      expect(calledArgs.where.OR).not.toContainEqual({ companyId: COMPANY_B });
    });

    it("update with Company A context cannot modify Company B data", async () => {
      const tenantPrisma = createTenantPrisma(mockPrisma, COMPANY_A);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (tenantPrisma as any).accountsPayable.update({
        where: { id: "payable-from-b" },
        data: { status: "PAID" },
      });

      const calledArgs = queryFn.mock.calls[0][0];
      expect(calledArgs.where.OR).toContainEqual({ companyId: COMPANY_A });
    });

    it("delete with Company A context cannot delete Company B data", async () => {
      const tenantPrisma = createTenantPrisma(mockPrisma, COMPANY_A);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (tenantPrisma as any).salesOrder.delete({
        where: { id: "order-from-b" },
      });

      const calledArgs = queryFn.mock.calls[0][0];
      expect(calledArgs.where.OR).toContainEqual({ companyId: COMPANY_A });
    });
  });
});
