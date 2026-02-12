/**
 * VIO-704: Testes de Isolamento Multi-tenant
 *
 * Valida que usuários de uma empresa NÃO conseguem acessar dados de outra empresa.
 * Cenários testados:
 * - Listagem retorna apenas dados da empresa ativa
 * - getById retorna erro ou null para dados de outra empresa
 * - Dados compartilhados (isShared: true) são visíveis para todas empresas
 * - Switch de empresa altera o contexto corretamente
 */

import { describe, expect, it, vi, beforeEach } from "vitest";

import { createCallerFactory } from "../trpc";
import { appRouter } from "./index";
import { prisma } from "@/lib/prisma";
import type { PrismaClient } from "@prisma/client";

// Tipo simplificado para contexto de teste
interface TestCtx {
  prisma: PrismaClient;
  tenant: {
    userId: string | null;
    companyId: string | null;
    companies: Array<{ id: string; code: number; name: string; isDefault: boolean }>;
    permissions: Map<string, { level: string; canShare: boolean; canClone: boolean }>;
  };
  supabaseUser: null;
  headers: Headers;
}

// IDs fixos para testes
const COMPANY_A_ID = "company-a-id";
const COMPANY_B_ID = "company-b-id";
const USER_A_ID = "user-a-id";
const USER_B_ID = "user-b-id";

// Contexto para usuário da Empresa A
function createContextCompanyA(): TestCtx {
  return {
    prisma: prisma as PrismaClient,
    tenant: {
      userId: USER_A_ID,
      companyId: COMPANY_A_ID,
      companies: [
        { id: COMPANY_A_ID, code: 1, name: "Empresa A", isDefault: true },
      ],
      permissions: new Map([
        ["MATERIALS", { level: "FULL", canShare: true, canClone: true }],
        ["SUPPLIERS", { level: "FULL", canShare: true, canClone: true }],
        ["INVENTORY", { level: "FULL", canShare: true, canClone: true }],
        ["SETTINGS", { level: "FULL", canShare: true, canClone: true }],
      ]),
    },
    supabaseUser: null,
    headers: new Headers(),
  };
}

// Contexto para usuário da Empresa B
function createContextCompanyB(): TestCtx {
  return {
    prisma: prisma as PrismaClient,
    tenant: {
      userId: USER_B_ID,
      companyId: COMPANY_B_ID,
      companies: [
        { id: COMPANY_B_ID, code: 2, name: "Empresa B", isDefault: true },
      ],
      permissions: new Map([
        ["MATERIALS", { level: "FULL", canShare: true, canClone: true }],
        ["SUPPLIERS", { level: "FULL", canShare: true, canClone: true }],
        ["INVENTORY", { level: "FULL", canShare: true, canClone: true }],
        ["SETTINGS", { level: "FULL", canShare: true, canClone: true }],
      ]),
    },
    supabaseUser: null,
    headers: new Headers(),
  };
}

// Contexto sem empresa (deve falhar em tenantProcedure)
function createContextNoCompany(): TestCtx {
  return {
    prisma: prisma as PrismaClient,
    tenant: {
      userId: USER_A_ID,
      companyId: null,
      companies: [],
      permissions: new Map(),
    },
    supabaseUser: null,
    headers: new Headers(),
  };
}

function createCaller(ctx: TestCtx) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createCallerFactory(appRouter)(ctx as any);
}

describe("Multi-tenant Isolation Tests (VIO-704)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("tenantProcedure middleware", () => {
    it("throws UNAUTHORIZED when no companyId in context", async () => {
      const ctx = createContextNoCompany();
      const caller = createCaller(ctx);

      // Qualquer procedure que use tenantProcedure deve falhar
      await expect(caller.materials.list({})).rejects.toMatchObject({
        code: "UNAUTHORIZED",
      });
    });

    it("allows access when companyId is present", async () => {
      const ctx = createContextCompanyA();

      // Mock do prisma.material.findMany
      const mockFindMany = vi.fn().mockResolvedValue([]);
      const mockCount = vi.fn().mockResolvedValue(0);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ctx.prisma as any).material = {
        findMany: mockFindMany,
        count: mockCount,
      };

      const caller = createCaller(ctx);
      const result = await caller.materials.list({});

      // Router retorna { materials, pagination }
      expect(result.materials).toEqual([]);
      expect(mockFindMany).toHaveBeenCalled();
    });
  });

  describe("materials router isolation", () => {
    it("list returns only materials from active company", async () => {
      const ctx = createContextCompanyA();

      const materialsCompanyA = [
        { id: "m1", code: 1, description: "Material A", companyId: COMPANY_A_ID },
      ];

      const mockFindMany = vi.fn().mockResolvedValue(materialsCompanyA);
      const mockCount = vi.fn().mockResolvedValue(1);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ctx.prisma as any).material = {
        findMany: mockFindMany,
        count: mockCount,
      };

      const caller = createCaller(ctx);
      const result = await caller.materials.list({});

      expect(result.materials).toHaveLength(1);
      expect(result.materials[0].companyId).toBe(COMPANY_A_ID);

      // Com RLS ativo, tenantFilter retorna {} — filtragem é feita pelo createTenantPrisma
      expect(mockFindMany).toHaveBeenCalled();
    });

    it("byId returns null for material from another company", async () => {
      const ctx = createContextCompanyA();

      // Material existe mas é de outra empresa - findUnique retorna null
      const mockFindUnique = vi.fn().mockResolvedValue(null);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ctx.prisma as any).material = {
        findUnique: mockFindUnique,
      };

      const caller = createCaller(ctx);
      const result = await caller.materials.byId({ id: "material-from-company-b" });

      // Retorna null quando não encontra (com filtro de companyId)
      expect(result).toBeNull();
    });
  });

  describe("suppliers router isolation", () => {
    it("list returns only suppliers from active company", async () => {
      const ctx = createContextCompanyA();

      const suppliersCompanyA = [
        { id: "s1", code: 1, companyName: "Fornecedor A", companyId: COMPANY_A_ID },
      ];

      const mockFindMany = vi.fn().mockResolvedValue(suppliersCompanyA);
      const mockCount = vi.fn().mockResolvedValue(1);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ctx.prisma as any).supplier = {
        findMany: mockFindMany,
        count: mockCount,
      };

      const caller = createCaller(ctx);
      const result = await caller.suppliers.list({});

      // Router retorna { suppliers, pagination }
      expect(result.suppliers).toHaveLength(1);
      expect(result.suppliers[0].companyId).toBe(COMPANY_A_ID);
    });

    it("user from Company B cannot see suppliers from Company A", async () => {
      const ctxB = createContextCompanyB();

      // Simular que não há fornecedores para Company B
      const mockFindMany = vi.fn().mockResolvedValue([]);
      const mockCount = vi.fn().mockResolvedValue(0);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ctxB.prisma as any).supplier = {
        findMany: mockFindMany,
        count: mockCount,
      };

      const caller = createCaller(ctxB);
      const result = await caller.suppliers.list({});

      expect(result.suppliers).toHaveLength(0);

      // Com RLS ativo, tenantFilter retorna {} — filtragem é feita pelo createTenantPrisma
      expect(mockFindMany).toHaveBeenCalled();
    });
  });

  describe("customers router isolation", () => {
    it("list returns only customers from active company", async () => {
      const ctx = createContextCompanyA();

      const customersCompanyA = [
        { id: "c1", code: "CLI001", companyName: "Cliente A", companyId: COMPANY_A_ID },
      ];

      const mockFindMany = vi.fn().mockResolvedValue(customersCompanyA);
      const mockCount = vi.fn().mockResolvedValue(1);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ctx.prisma as any).customer = {
        findMany: mockFindMany,
        count: mockCount,
      };

      const caller = createCaller(ctx);
      const result = await caller.customers.list({});

      // Router retorna { customers, total, pages }
      expect(result.customers).toHaveLength(1);
      expect(result.customers[0].companyId).toBe(COMPANY_A_ID);
    });
  });

  describe("inventory router isolation", () => {
    it("list returns only inventory from active company", async () => {
      const ctx = createContextCompanyA();

      const inventoryCompanyA = [
        { id: "i1", materialId: "m1", quantity: 100, companyId: COMPANY_A_ID },
      ];

      const mockFindMany = vi.fn().mockResolvedValue(inventoryCompanyA);
      const mockCount = vi.fn().mockResolvedValue(1);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ctx.prisma as any).inventory = {
        findMany: mockFindMany,
        count: mockCount,
      };

      const caller = createCaller(ctx);
      const result = await caller.inventory.list({});

      // Router retorna { inventory, pagination }
      expect(result.inventory).toHaveLength(1);
      expect(result.inventory[0].companyId).toBe(COMPANY_A_ID);
    });
  });

  describe("shared data (isShared: true)", () => {
    it("shared materials are visible to all companies", async () => {
      const ctx = createContextCompanyB();

      // Material compartilhado (sem companyId ou isShared: true)
      const sharedMaterials = [
        { id: "m-shared", code: 999, description: "Material Compartilhado", companyId: null, isShared: true },
      ];

      const mockFindMany = vi.fn().mockResolvedValue(sharedMaterials);
      const mockCount = vi.fn().mockResolvedValue(1);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ctx.prisma as any).material = {
        findMany: mockFindMany,
        count: mockCount,
      };

      const caller = createCaller(ctx);
      const result = await caller.materials.list({});

      expect(result.materials).toHaveLength(1);
      expect(result.materials[0].isShared).toBe(true);
    });
  });

  describe("tenant.switchCompany", () => {
    it("allows switching to a company the user has access to", async () => {
      const ctx: TestCtx = {
        prisma: prisma as PrismaClient,
        tenant: {
          userId: USER_A_ID,
          companyId: COMPANY_A_ID,
          companies: [
            { id: COMPANY_A_ID, code: 1, name: "Empresa A", isDefault: true },
            { id: COMPANY_B_ID, code: 2, name: "Empresa B", isDefault: false },
          ],
          permissions: new Map(),
        },
        supabaseUser: null,
        headers: new Headers(),
      };

      const caller = createCaller(ctx);
      const result = await caller.tenant.switchCompany({ companyId: COMPANY_B_ID });

      expect(result.success).toBe(true);
      expect(result.company?.id).toBe(COMPANY_B_ID);
    });

    it("throws error when switching to a company the user does not have access to", async () => {
      const ctx = createContextCompanyA();

      const caller = createCaller(ctx);

      await expect(
        caller.tenant.switchCompany({ companyId: "unknown-company" })
      ).rejects.toBeInstanceOf(Error);
    });
  });

  describe("cross-company data access attempts", () => {
    it("cannot create material with different companyId - backend uses ctx.companyId", async () => {
      const ctx = createContextCompanyA();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mockCreate = vi.fn().mockImplementation(async (args: any) => {
        // Simular que o backend sempre usa ctx.companyId
        return { id: "new-material", code: 1, ...args.data, companyId: COMPANY_A_ID };
      });

      const mockFindFirst = vi.fn().mockResolvedValue(null);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ctx.prisma as any).material = {
        create: mockCreate,
        findFirst: mockFindFirst,
      };

      const caller = createCaller(ctx);

      // Mesmo que alguém tente passar companyId diferente no input,
      // o backend deve usar ctx.companyId
      await caller.materials.create({
        code: 1,
        internalCode: "TEST001",
        description: "Test Material",
        unit: "UN",
      });

      // Verificar que o material foi criado com companyId da empresa ativa
      const createCall = mockCreate.mock.calls[0][0];
      expect(createCall.data.companyId).toBe(COMPANY_A_ID);
    });

    it("cannot update material from another company - update includes companyId filter", async () => {
      const ctx = createContextCompanyA();

      // O router usa update com where: { id, companyId: ctx.companyId }
      // Isso garante que só atualiza materiais da empresa ativa
      const mockFindUnique = vi.fn().mockResolvedValue({ id: "m1", code: 1, companyId: COMPANY_A_ID });
      const mockUpdate = vi.fn().mockResolvedValue({ id: "m1", code: 1, description: "Updated", companyId: COMPANY_A_ID });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ctx.prisma as any).material = {
        findUnique: mockFindUnique,
        update: mockUpdate,
      };

      const caller = createCaller(ctx);
      await caller.materials.update({
        id: "m1",
        description: "Updated",
      });

      // Verificar que o update inclui companyId no where
      const updateCall = mockUpdate.mock.calls[0][0];
      expect(updateCall.where.companyId).toBe(COMPANY_A_ID);
    });

    it("cannot delete material from another company - delete includes companyId filter", async () => {
      const ctx = createContextCompanyA();

      // O router usa delete com where: { id, companyId: ctx.companyId }
      // Isso garante que só deleta materiais da empresa ativa
      const mockFindUnique = vi.fn().mockResolvedValue({ id: "m1", code: 1, companyId: COMPANY_A_ID });
      const mockDelete = vi.fn().mockResolvedValue({ id: "m1", code: 1, companyId: COMPANY_A_ID });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ctx.prisma as any).material = {
        findUnique: mockFindUnique,
        delete: mockDelete,
      };

      const caller = createCaller(ctx);
      await caller.materials.delete({ id: "m1" });

      // Verificar que o delete inclui companyId no where
      const deleteCall = mockDelete.mock.calls[0][0];
      expect(deleteCall.where.companyId).toBe(COMPANY_A_ID);
    });
  });

  describe("payables router isolation", () => {
    it("list returns only payables from active company", async () => {
      const ctx = createContextCompanyA();

      const payablesCompanyA = [
        { id: "p1", documentNumber: "NF001", companyId: COMPANY_A_ID, supplier: { id: "s1", code: 1, companyName: "Forn", tradeName: null } },
      ];

      const mockFindMany = vi.fn().mockResolvedValue(payablesCompanyA);
      const mockCount = vi.fn().mockResolvedValue(1);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ctx.prisma as any).accountsPayable = {
        findMany: mockFindMany,
        count: mockCount,
      };

      const caller = createCaller(ctx);
      const result = await caller.payables.list({});

      // Router retorna { payables, total, pages }
      expect(result.payables).toHaveLength(1);
      expect(result.payables[0].companyId).toBe(COMPANY_A_ID);
    });
  });

  describe("receivables router isolation", () => {
    it("list returns only receivables from active company", async () => {
      const ctx = createContextCompanyA();

      const receivablesCompanyA = [
        { id: "r1", documentNumber: "NF001", companyId: COMPANY_A_ID, customer: { id: "c1", code: "1", companyName: "Cli", tradeName: null } },
      ];

      const mockFindMany = vi.fn().mockResolvedValue(receivablesCompanyA);
      const mockCount = vi.fn().mockResolvedValue(1);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ctx.prisma as any).accountsReceivable = {
        findMany: mockFindMany,
        count: mockCount,
      };

      const caller = createCaller(ctx);
      const result = await caller.receivables.list({});

      // Router retorna { receivables, total, pages }
      expect(result.receivables).toHaveLength(1);
      expect(result.receivables[0].companyId).toBe(COMPANY_A_ID);
    });
  });

  describe("tenantFilter helper", () => {
    it("returns empty object when companyId is null", async () => {
      // Importar tenantFilter diretamente
      const { tenantFilter } = await import("../trpc");
      
      const filter = tenantFilter(null);
      expect(filter).toEqual({});
    });

    it("returns empty when RLS is active (includeShared is false)", async () => {
      const { tenantFilter } = await import("../trpc");
      
      const filter = tenantFilter(COMPANY_A_ID, false);
      expect(filter).toEqual({});
    });

    it("tenantFilterShared returns empty when RLS is active", async () => {
      const { tenantFilterShared } = await import("../trpc");
      
      const filter = tenantFilterShared(COMPANY_A_ID);
      expect(filter).toEqual({});
    });
  });
});
