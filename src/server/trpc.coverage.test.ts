import { describe, expect, it, vi } from "vitest";

vi.mock("./context", async () => {
  return {
    getTenantContext: vi.fn(async (userId: string | null, companyId: string | null) => {
      return {
        userId,
        companyId,
        companies: companyId ? [{ id: companyId }] : [],
        permissions: new Map(),
      };
    }),
    hasPermission: vi.fn(() => true),
  };
});

import { createTRPCContext, tenantFilter, tenantFilterShared } from "./trpc";
import { prisma } from "@/lib/prisma";
import { createServerClient } from "@supabase/ssr";

const mockedCreateServerClient = vi.mocked(createServerClient);

describe("trpc coverage", () => {
  it("tenantFilter returns empty when companyId is null", () => {
    expect(tenantFilter(null)).toEqual({});
  });

  it("tenantFilter returns simple companyId filter", () => {
    expect(tenantFilter("company-1")).toEqual({ companyId: "company-1" });
  });

  it("tenantFilterShared includes shared data", () => {
    expect(tenantFilterShared("company-1")).toEqual({
      OR: [{ companyId: "company-1" }, { companyId: null }, { isShared: true }],
    });
  });

  it("createTRPCContext returns empty tenant when no supabase user email", async () => {
    mockedCreateServerClient.mockReturnValue({
      auth: {
        getUser: vi.fn(async () => ({ data: { user: null } })),
      },
    } as unknown as ReturnType<typeof createServerClient>);

    const ctx = await createTRPCContext({ headers: new Headers() });
    expect(ctx.tenant.userId).toBeNull();
    expect(ctx.tenant.companyId).toBeNull();
    expect(ctx.supabaseUser).toBeNull();
  });

  it("createTRPCContext uses local user id when found", async () => {
    mockedCreateServerClient.mockReturnValue({
      auth: {
        getUser: vi.fn(async () => ({ data: { user: { email: "u@example.com" } } })),
      },
    } as unknown as ReturnType<typeof createServerClient>);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma.user.findUnique as any).mockResolvedValue({ id: "user-1" });

    const headers = new Headers({ "x-company-id": "company-1" });
    const ctx = await createTRPCContext({ headers });

    expect(ctx.tenant.userId).toBe("user-1");
    expect(ctx.tenant.companyId).toBe("company-1");
    expect(ctx.supabaseUser?.email).toBe("u@example.com");
  });

  it("createTRPCContext falls back to x-user-id header", async () => {
    mockedCreateServerClient.mockReturnValue({
      auth: {
        getUser: vi.fn(async () => ({ data: { user: { email: "u2@example.com" } } })),
      },
    } as unknown as ReturnType<typeof createServerClient>);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma.user.findUnique as any).mockResolvedValue(null);

    const headers = new Headers({
      "x-user-id": "user-from-header",
      "x-company-id": "company-2",
    });
    const ctx = await createTRPCContext({ headers });

    expect(ctx.tenant.userId).toBe("user-from-header");
    expect(ctx.tenant.companyId).toBe("company-2");
  });

  it("createTRPCContext returns empty tenant on internal error", async () => {
    mockedCreateServerClient.mockImplementationOnce(() => {
      throw new Error("boom");
    });

    const ctx = await createTRPCContext({ headers: new Headers() });
    expect(ctx.tenant.userId).toBeNull();
    expect(ctx.supabaseUser).toBeNull();
  });
});
