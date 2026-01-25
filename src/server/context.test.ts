import { describe, it, expect } from "vitest";
import { 
  hasPermission, 
  canShare, 
  canClone,
  type TenantContext,
  type SystemModule,
  type PermissionLevel,
} from "./context";

describe("Context Utilities", () => {
  describe("hasPermission", () => {
    const createContext = (
      module: SystemModule, 
      level: PermissionLevel
    ): TenantContext => ({
      userId: "user-123",
      companyId: "company-123",
      companies: [],
      permissions: new Map([[module, { level, canShare: false, canClone: false }]]),
    });

    it("should return false when no permission exists", () => {
      const ctx: TenantContext = {
        userId: "user-123",
        companyId: "company-123",
        companies: [],
        permissions: new Map(),
      };
      expect(hasPermission(ctx, "MATERIALS", "VIEW")).toBe(false);
    });

    it("should return true when user has FULL and requires VIEW", () => {
      const ctx = createContext("MATERIALS", "FULL");
      expect(hasPermission(ctx, "MATERIALS", "VIEW")).toBe(true);
    });

    it("should return true when user has FULL and requires EDIT", () => {
      const ctx = createContext("MATERIALS", "FULL");
      expect(hasPermission(ctx, "MATERIALS", "EDIT")).toBe(true);
    });

    it("should return true when user has FULL and requires FULL", () => {
      const ctx = createContext("MATERIALS", "FULL");
      expect(hasPermission(ctx, "MATERIALS", "FULL")).toBe(true);
    });

    it("should return false when user has VIEW and requires EDIT", () => {
      const ctx = createContext("MATERIALS", "VIEW");
      expect(hasPermission(ctx, "MATERIALS", "EDIT")).toBe(false);
    });

    it("should return false when user has VIEW and requires FULL", () => {
      const ctx = createContext("MATERIALS", "VIEW");
      expect(hasPermission(ctx, "MATERIALS", "FULL")).toBe(false);
    });

    it("should return true when user has EDIT and requires VIEW", () => {
      const ctx = createContext("MATERIALS", "EDIT");
      expect(hasPermission(ctx, "MATERIALS", "VIEW")).toBe(true);
    });

    it("should return true when user has EDIT and requires EDIT", () => {
      const ctx = createContext("MATERIALS", "EDIT");
      expect(hasPermission(ctx, "MATERIALS", "EDIT")).toBe(true);
    });

    it("should return false when user has EDIT and requires FULL", () => {
      const ctx = createContext("MATERIALS", "EDIT");
      expect(hasPermission(ctx, "MATERIALS", "FULL")).toBe(false);
    });

    it("should return false when user has NONE", () => {
      const ctx = createContext("MATERIALS", "NONE");
      expect(hasPermission(ctx, "MATERIALS", "VIEW")).toBe(false);
    });

    it("should check correct module", () => {
      const ctx = createContext("MATERIALS", "FULL");
      expect(hasPermission(ctx, "SUPPLIERS", "VIEW")).toBe(false);
    });
  });

  describe("canShare", () => {
    it("should return false when no permission exists", () => {
      const ctx: TenantContext = {
        userId: "user-123",
        companyId: "company-123",
        companies: [],
        permissions: new Map(),
      };
      expect(canShare(ctx, "MATERIALS")).toBe(false);
    });

    it("should return true when canShare is true", () => {
      const ctx: TenantContext = {
        userId: "user-123",
        companyId: "company-123",
        companies: [],
        permissions: new Map([
          ["MATERIALS", { level: "FULL" as PermissionLevel, canShare: true, canClone: false }],
        ]),
      };
      expect(canShare(ctx, "MATERIALS")).toBe(true);
    });

    it("should return false when canShare is false", () => {
      const ctx: TenantContext = {
        userId: "user-123",
        companyId: "company-123",
        companies: [],
        permissions: new Map([
          ["MATERIALS", { level: "FULL" as PermissionLevel, canShare: false, canClone: false }],
        ]),
      };
      expect(canShare(ctx, "MATERIALS")).toBe(false);
    });
  });

  describe("canClone", () => {
    it("should return false when no permission exists", () => {
      const ctx: TenantContext = {
        userId: "user-123",
        companyId: "company-123",
        companies: [],
        permissions: new Map(),
      };
      expect(canClone(ctx, "MATERIALS")).toBe(false);
    });

    it("should return true when canClone is true", () => {
      const ctx: TenantContext = {
        userId: "user-123",
        companyId: "company-123",
        companies: [],
        permissions: new Map([
          ["MATERIALS", { level: "FULL" as PermissionLevel, canShare: false, canClone: true }],
        ]),
      };
      expect(canClone(ctx, "MATERIALS")).toBe(true);
    });

    it("should return false when canClone is false", () => {
      const ctx: TenantContext = {
        userId: "user-123",
        companyId: "company-123",
        companies: [],
        permissions: new Map([
          ["MATERIALS", { level: "FULL" as PermissionLevel, canShare: false, canClone: false }],
        ]),
      };
      expect(canClone(ctx, "MATERIALS")).toBe(false);
    });
  });

  describe("TenantContext type", () => {
    it("should represent empty context", () => {
      const ctx: TenantContext = {
        userId: null,
        companyId: null,
        companies: [],
        permissions: new Map(),
      };
      expect(ctx.userId).toBeNull();
      expect(ctx.companyId).toBeNull();
    });

    it("should represent context with user and company", () => {
      const ctx: TenantContext = {
        userId: "user-123",
        companyId: "company-456",
        companies: [
          { id: "company-456", code: 1, name: "Empresa 1", isDefault: true },
          { id: "company-789", code: 2, name: "Empresa 2", isDefault: false },
        ],
        permissions: new Map([
          ["MATERIALS", { level: "FULL" as PermissionLevel, canShare: true, canClone: true }],
          ["SUPPLIERS", { level: "EDIT" as PermissionLevel, canShare: false, canClone: false }],
        ]),
      };

      expect(ctx.userId).toBe("user-123");
      expect(ctx.companyId).toBe("company-456");
      expect(ctx.companies).toHaveLength(2);
      expect(ctx.permissions.size).toBe(2);
    });
  });

  describe("SystemModule type", () => {
    it("should accept all valid modules", () => {
      const modules: SystemModule[] = [
        "MATERIALS",
        "SUPPLIERS",
        "QUOTES",
        "RECEIVING",
        "MATERIAL_OUT",
        "INVENTORY",
        "REPORTS",
        "SETTINGS",
      ];
      expect(modules).toHaveLength(8);
    });
  });

  describe("PermissionLevel type", () => {
    it("should accept all valid levels", () => {
      const levels: PermissionLevel[] = ["NONE", "VIEW", "EDIT", "FULL"];
      expect(levels).toHaveLength(4);
    });

    it("should have correct order for permission hierarchy", () => {
      const levels: PermissionLevel[] = ["NONE", "VIEW", "EDIT", "FULL"];
      expect(levels.indexOf("NONE")).toBeLessThan(levels.indexOf("VIEW"));
      expect(levels.indexOf("VIEW")).toBeLessThan(levels.indexOf("EDIT"));
      expect(levels.indexOf("EDIT")).toBeLessThan(levels.indexOf("FULL"));
    });
  });
});
