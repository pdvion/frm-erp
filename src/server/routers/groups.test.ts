import { describe, expect, it } from "vitest";
import { z } from "zod";
import { hasPermissionInList, SYSTEM_PERMISSIONS } from "./groups";

const listInputSchema = z
  .object({
    includeMembers: z.boolean().default(false),
  })
  .optional();

const byIdInputSchema = z.object({ id: z.string().uuid() });

const createInputSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().optional(),
  permissions: z.array(z.string()),
});

const updateInputSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2).max(100).optional(),
  description: z.string().optional(),
  permissions: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

const deleteInputSchema = z.object({ id: z.string().uuid() });

const addMemberInputSchema = z.object({
  groupId: z.string().uuid(),
  userId: z.string().uuid(),
});

const removeMemberInputSchema = z.object({
  groupId: z.string().uuid(),
  userId: z.string().uuid(),
});

describe("Groups Router Schemas", () => {
  describe("SYSTEM_PERMISSIONS", () => {
    it("has wildcard admin permission", () => {
      expect(SYSTEM_PERMISSIONS["*"]).toBeDefined();
    });

    it("has module permissions", () => {
      expect(SYSTEM_PERMISSIONS["materials.view"]).toBeDefined();
      expect(SYSTEM_PERMISSIONS["groups.*"]).toBeDefined();
    });
  });

  describe("hasPermissionInList", () => {
    it("grants admin", () => {
      expect(hasPermissionInList(["*"], "materials.view")).toBe(true);
    });

    it("grants exact permission", () => {
      expect(hasPermissionInList(["materials.view"], "materials.view")).toBe(true);
      expect(hasPermissionInList(["materials.view"], "materials.edit")).toBe(false);
    });

    it("grants module wildcard", () => {
      expect(hasPermissionInList(["materials.*"], "materials.view")).toBe(true);
      expect(hasPermissionInList(["materials.*"], "materials.delete")).toBe(true);
    });

    it("denies unrelated module wildcard", () => {
      expect(hasPermissionInList(["suppliers.*"], "materials.view")).toBe(false);
    });

    it("grants generic view wildcard", () => {
      expect(hasPermissionInList(["*.view"], "materials.view")).toBe(true);
      expect(hasPermissionInList(["*.view"], "materials.edit")).toBe(false);
    });
  });

  describe("inputs", () => {
    it("list input defaults", () => {
      const parsed = listInputSchema.parse(undefined);
      expect(parsed).toBeUndefined();

      const parsed2 = listInputSchema.parse({});
      expect(parsed2?.includeMembers).toBe(false);
    });

    it("byId requires uuid", () => {
      expect(byIdInputSchema.safeParse({ id: "not-uuid" }).success).toBe(false);
      expect(byIdInputSchema.safeParse({ id: "123e4567-e89b-12d3-a456-426614174000" }).success).toBe(true);
    });

    it("create validates name length", () => {
      expect(createInputSchema.safeParse({ name: "A", permissions: [] }).success).toBe(false);
      expect(createInputSchema.safeParse({ name: "Compras", permissions: ["materials.view"] }).success).toBe(true);
    });

    it("update allows partial", () => {
      expect(
        updateInputSchema.safeParse({ id: "123e4567-e89b-12d3-a456-426614174000", isActive: false }).success
      ).toBe(true);
    });

    it("delete requires uuid", () => {
      expect(deleteInputSchema.safeParse({ id: "123e4567-e89b-12d3-a456-426614174000" }).success).toBe(true);
    });

    it("addMember requires uuids", () => {
      expect(
        addMemberInputSchema.safeParse({
          groupId: "123e4567-e89b-12d3-a456-426614174000",
          userId: "123e4567-e89b-12d3-a456-426614174001",
        }).success
      ).toBe(true);
    });

    it("removeMember requires uuids", () => {
      expect(
        removeMemberInputSchema.safeParse({
          groupId: "123e4567-e89b-12d3-a456-426614174000",
          userId: "123e4567-e89b-12d3-a456-426614174001",
        }).success
      ).toBe(true);
    });
  });
});
