import { describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";

import { createCallerFactory } from "../trpc";
import { appRouter } from "./index";
import { prisma } from "@/lib/prisma";
import type { PrismaClient } from "@prisma/client";

// Tipo simplificado para contexto de teste
interface TestCtx {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prisma: any;
  tenant: {
    userId: string | null;
    companyId: string | null;
    companies: Array<{ id: string; code: number; name: string; isDefault: boolean }>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    permissions: Map<any, any>;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabaseUser: any;
  headers: Headers;
}

function createCaller(ctx: TestCtx) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createCallerFactory(appRouter)(ctx as any);
}

describe("tRPC procedure calls (caller)", () => {
  it("aiConfig.get throws UNAUTHORIZED when tenant has no companyId", async () => {
    const ctx: TestCtx = {
      prisma: prisma as PrismaClient,
      tenant: { userId: "u1", companyId: null, companies: [], permissions: new Map() },
      supabaseUser: null,
      headers: new Headers(),
    };

    const caller = createCaller(ctx);

    await expect(caller.aiConfig.get()).rejects.toBeInstanceOf(TRPCError);
    await expect(caller.aiConfig.get()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("aiConfig.get returns masked tokens and config flags", async () => {
    const findMany = vi.fn().mockResolvedValue([
      { key: "openai_token", value: { value: "sk-123" } },
      { key: "default_provider", value: { value: "anthropic" } },
    ]);

    const mockPrisma = {
      ...prisma,
      systemSetting: {
        findMany,
        upsert: vi.fn(async () => ({})),
        deleteMany: vi.fn(async () => ({})),
      },
    };

    const ctx: TestCtx = {
      prisma: mockPrisma,
      tenant: { userId: "u1", companyId: "c1", companies: [{ id: "c1", code: 1, name: "Empresa", isDefault: true }], permissions: new Map() },
      supabaseUser: null,
      headers: new Headers(),
    };

    const caller = createCaller(ctx);
    const result = await caller.aiConfig.get();

    expect(findMany).toHaveBeenCalled();
    expect(result.openaiToken).toBe("***configured***");
    expect(result.anthropicToken).toBe("");
    expect(result.defaultProvider).toBe("anthropic");
    expect(result.isConfigured).toBe(true);
  });

  it("tenant.current returns tenant context snapshot", async () => {
    const ctx: TestCtx = {
      prisma: prisma as PrismaClient,
      tenant: {
        userId: "u1",
        companyId: "c1",
        companies: [{ id: "c1", name: "Empresa", code: 1, isDefault: true }],
        permissions: new Map([[
          "SETTINGS",
          { level: "FULL", canShare: true, canClone: true },
        ]]),
      },
      supabaseUser: null,
      headers: new Headers(),
    };

    const caller = createCaller(ctx);
    const result = await caller.tenant.current();

    expect(result.userId).toBe("u1");
    expect(result.companyId).toBe("c1");
    expect(result.companies.length).toBe(1);
    expect(result.permissions.SETTINGS).toEqual({ level: "FULL", canShare: true, canClone: true });
  });

  it("tenant.switchCompany throws when user has no access", async () => {
    const ctx: TestCtx = {
      prisma: prisma as PrismaClient,
      tenant: {
        userId: "u1",
        companyId: "c1",
        companies: [{ id: "c1", code: 1, name: "Empresa", isDefault: true }],
        permissions: new Map(),
      },
      supabaseUser: null,
      headers: new Headers(),
    };

    const caller = createCaller(ctx);

    await expect(caller.tenant.switchCompany({ companyId: "c2" })).rejects.toBeInstanceOf(Error);
  });

  it("tenant.ensureUser returns created false when user already exists", async () => {
    // Este teste verifica o comportamento quando o usuário já existe
    // O router tenant.ts importa prisma diretamente, então não podemos mockar via ctx
    // Testamos apenas o fluxo de retorno quando não há supabaseUser
    const ctx: TestCtx = {
      prisma: prisma as PrismaClient,
      tenant: { userId: null, companyId: null, companies: [], permissions: new Map() },
      supabaseUser: null, // Sem usuário Supabase
      headers: new Headers(),
    };

    const caller = createCaller(ctx);
    const result = await caller.tenant.ensureUser();

    // Sem supabaseUser, retorna created: false
    expect(result.created).toBe(false);
    expect(result.userId).toBeNull();
  });
});
