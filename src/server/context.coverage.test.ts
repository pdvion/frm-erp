import { describe, expect, it, vi } from "vitest";
import type { PermissionLevel, SystemModule, TenantContext } from "./context";

interface MockUserCompanyRow {
  isDefault: boolean;
  company: {
    id: string;
    code: number;
    name: string;
  };
}

interface MockUserCompanyPermissionRow {
  companyId: string;
  module: string;
  permission: string;
  canShare: boolean;
  canClone: boolean;
}

const prismaMock = {
  userCompany: {
    findMany: vi.fn<
      (args: unknown) => Promise<MockUserCompanyRow[]>
    >(),
  },
  userCompanyPermission: {
    findMany: vi.fn<
      (args: unknown) => Promise<MockUserCompanyPermissionRow[]>
    >(),
  },
};

vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));

describe("context coverage", () => {
  it("returns empty context when userId is null", async () => {
    vi.resetModules();
    const { getTenantContext } = await import("./context");

    const result = await getTenantContext(null, null);
    expect(result.userId).toBeNull();
    expect(result.companyId).toBeNull();
    expect(result.companies).toHaveLength(0);
  });

  it("returns userId with empty companies when user has no active companies", async () => {
    vi.resetModules();
    const { getTenantContext } = await import("./context");

    prismaMock.userCompany.findMany.mockResolvedValueOnce([]);
    prismaMock.userCompanyPermission.findMany.mockResolvedValueOnce([]);

    const result = await getTenantContext("user-1", null);
    expect(result.userId).toBe("user-1");
    expect(result.companyId).toBeNull();
    expect(result.companies).toHaveLength(0);
  });

  it("selects default company when activeCompanyId is missing", async () => {
    vi.resetModules();
    const { getTenantContext } = await import("./context");

    prismaMock.userCompany.findMany.mockResolvedValueOnce([
      {
        isDefault: true,
        company: { id: "c1", code: 1, name: "C1" },
      },
      {
        isDefault: false,
        company: { id: "c2", code: 2, name: "C2" },
      },
    ]);

    prismaMock.userCompanyPermission.findMany.mockResolvedValueOnce([
      {
        companyId: "c1",
        module: "SETTINGS",
        permission: "FULL",
        canShare: true,
        canClone: false,
      },
      {
        companyId: "c2",
        module: "MATERIALS",
        permission: "VIEW",
        canShare: false,
        canClone: true,
      },
    ]);

    const result = await getTenantContext("user-1", null);
    expect(result.companyId).toBe("c1");
    expect(result.permissions.get("SETTINGS")?.level).toBe("FULL");
    expect(result.permissions.get("MATERIALS")).toBeUndefined();
  });

  it("falls back to first company when activeCompanyId is invalid and no default exists", async () => {
    vi.resetModules();
    const { getTenantContext } = await import("./context");

    prismaMock.userCompany.findMany.mockResolvedValueOnce([
      {
        isDefault: false,
        company: { id: "c1", code: 1, name: "C1" },
      },
      {
        isDefault: false,
        company: { id: "c2", code: 2, name: "C2" },
      },
    ]);

    prismaMock.userCompanyPermission.findMany.mockResolvedValueOnce([]);

    const result = await getTenantContext("user-1", "invalid");
    expect(result.companyId).toBe("c1");
  });

  it("uses cache on subsequent calls", async () => {
    vi.resetModules();
    const { getTenantContext } = await import("./context");

    prismaMock.userCompany.findMany.mockClear();
    prismaMock.userCompanyPermission.findMany.mockClear();

    prismaMock.userCompany.findMany.mockResolvedValueOnce([
      {
        isDefault: true,
        company: { id: "c1", code: 1, name: "C1" },
      },
    ]);

    prismaMock.userCompanyPermission.findMany.mockResolvedValueOnce([]);

    const first = await getTenantContext("user-1", null);
    const second = await getTenantContext("user-1", null);

    expect(first.companyId).toBe("c1");
    expect(second.companyId).toBe("c1");
    expect(prismaMock.userCompany.findMany).toHaveBeenCalledTimes(1);
    expect(prismaMock.userCompanyPermission.findMany).toHaveBeenCalledTimes(1);
  });

  it("hasPermission/canShare/canClone branch behavior", async () => {
    vi.resetModules();
    const { hasPermission, canShare, canClone } = await import("./context");

    const permissions = new Map<SystemModule, {
      level: PermissionLevel;
      canShare: boolean;
      canClone: boolean;
    }>();

    permissions.set("SETTINGS", {
      level: "EDIT",
      canShare: true,
      canClone: false,
    });

    const ctx: TenantContext = {
      userId: "user-1",
      companyId: "c1",
      companies: [],
      permissions,
    };

    expect(hasPermission(ctx, "MATERIALS", "VIEW")).toBe(false);
    expect(hasPermission(ctx, "SETTINGS", "FULL")).toBe(false);
    expect(hasPermission(ctx, "SETTINGS", "VIEW")).toBe(true);

    expect(canShare(ctx, "SETTINGS")).toBe(true);
    expect(canClone(ctx, "SETTINGS")).toBe(false);
    expect(canShare(ctx, "MATERIALS")).toBe(false);
  });
});
