/**
 * VIO-706: Testes do router documents (GED)
 */

import { describe, expect, it, vi, beforeEach } from "vitest";

import { createCallerFactory } from "../trpc";
import { appRouter } from "./index";
import { prisma } from "@/lib/prisma";
import type { PrismaClient } from "@prisma/client";

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

const COMPANY_ID = "company-test-id";
const USER_ID = "user-test-id";

function createTestContext(): TestCtx {
  return {
    prisma: prisma as PrismaClient,
    tenant: {
      userId: USER_ID,
      companyId: COMPANY_ID,
      companies: [{ id: COMPANY_ID, code: 1, name: "Test Company", isDefault: true }],
      permissions: new Map([
        ["DOCUMENTS", { level: "FULL", canShare: true, canClone: true }],
      ]),
    },
    supabaseUser: null,
    headers: new Headers(),
  };
}

function createCaller(ctx: TestCtx) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createCallerFactory(appRouter)(ctx as any);
}

describe("documents router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("list", () => {
    it("returns paginated documents with correct structure", async () => {
      const ctx = createTestContext();
      const mockDocuments = [
        { id: "doc1", title: "Doc 1", fileName: "doc1.pdf", companyId: COMPANY_ID, category: null, _count: { versions: 0, accessLogs: 0 } },
      ];

      const mockFindMany = vi.fn().mockResolvedValue(mockDocuments);
      const mockCount = vi.fn().mockResolvedValue(1);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ctx.prisma as any).gedDocument = {
        findMany: mockFindMany,
        count: mockCount,
      };

      const caller = createCaller(ctx);
      const result = await caller.documents.list({});

      expect(result.documents).toHaveLength(1);
      expect(result.pagination).toMatchObject({
        page: 1,
        pageSize: 20,
        total: 1,
        totalPages: 1,
      });
    });

    it("applies search filter correctly", async () => {
      const ctx = createTestContext();
      const mockFindMany = vi.fn().mockResolvedValue([]);
      const mockCount = vi.fn().mockResolvedValue(0);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ctx.prisma as any).gedDocument = {
        findMany: mockFindMany,
        count: mockCount,
      };

      const caller = createCaller(ctx);
      await caller.documents.list({ search: "contrato" });

      expect(mockFindMany).toHaveBeenCalled();
      const whereArg = mockFindMany.mock.calls[0][0].where;
      expect(whereArg.OR).toBeDefined();
      expect(whereArg.OR.length).toBe(4); // title, description, fileName, tags
    });

    it("applies category filter", async () => {
      const ctx = createTestContext();
      const mockFindMany = vi.fn().mockResolvedValue([]);
      const mockCount = vi.fn().mockResolvedValue(0);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ctx.prisma as any).gedDocument = {
        findMany: mockFindMany,
        count: mockCount,
      };

      const caller = createCaller(ctx);
      const categoryId = "550e8400-e29b-41d4-a716-446655440000";
      await caller.documents.list({ categoryId });

      const whereArg = mockFindMany.mock.calls[0][0].where;
      expect(whereArg.categoryId).toBe(categoryId);
    });

    it("applies entity type and id filters", async () => {
      const ctx = createTestContext();
      const mockFindMany = vi.fn().mockResolvedValue([]);
      const mockCount = vi.fn().mockResolvedValue(0);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ctx.prisma as any).gedDocument = {
        findMany: mockFindMany,
        count: mockCount,
      };

      const caller = createCaller(ctx);
      const entityId = "550e8400-e29b-41d4-a716-446655440001";
      await caller.documents.list({ entityType: "SUPPLIER", entityId });

      const whereArg = mockFindMany.mock.calls[0][0].where;
      expect(whereArg.entityType).toBe("SUPPLIER");
      expect(whereArg.entityId).toBe(entityId);
    });

    it("applies tags filter", async () => {
      const ctx = createTestContext();
      const mockFindMany = vi.fn().mockResolvedValue([]);
      const mockCount = vi.fn().mockResolvedValue(0);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ctx.prisma as any).gedDocument = {
        findMany: mockFindMany,
        count: mockCount,
      };

      const caller = createCaller(ctx);
      await caller.documents.list({ tags: ["contrato", "2026"] });

      const whereArg = mockFindMany.mock.calls[0][0].where;
      expect(whereArg.tags).toEqual({ hasSome: ["contrato", "2026"] });
    });
  });

  describe("byId", () => {
    it("returns document and logs access", async () => {
      const ctx = createTestContext();
      const mockDocument = {
        id: "doc1",
        title: "Test Doc",
        fileName: "test.pdf",
        companyId: COMPANY_ID,
        category: null,
        versions: [],
        accessLogs: [],
      };

      const mockFindFirst = vi.fn().mockResolvedValue(mockDocument);
      const mockCreate = vi.fn().mockResolvedValue({ id: "log1" });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ctx.prisma as any).gedDocument = { findFirst: mockFindFirst };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ctx.prisma as any).gedAccessLog = { create: mockCreate };

      const caller = createCaller(ctx);
      const result = await caller.documents.byId({ id: "550e8400-e29b-41d4-a716-446655440000" });

      expect(result.id).toBe("doc1");
      expect(mockCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          documentId: "doc1",
          action: "VIEW",
          userId: USER_ID,
        }),
      });
    });

    it("throws NOT_FOUND for non-existent document", async () => {
      const ctx = createTestContext();
      const mockFindFirst = vi.fn().mockResolvedValue(null);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ctx.prisma as any).gedDocument = { findFirst: mockFindFirst };

      const caller = createCaller(ctx);

      await expect(
        caller.documents.byId({ id: "550e8400-e29b-41d4-a716-446655440000" })
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });
  });

  describe("create", () => {
    it("creates document with companyId from context", async () => {
      const ctx = createTestContext();
      const mockDocument = {
        id: "new-doc",
        title: "New Document",
        fileName: "new.pdf",
        companyId: COMPANY_ID,
        category: null,
      };

      const mockCreate = vi.fn().mockResolvedValue(mockDocument);
      const mockLogCreate = vi.fn().mockResolvedValue({ id: "log1" });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ctx.prisma as any).gedDocument = { create: mockCreate };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ctx.prisma as any).gedAccessLog = { create: mockLogCreate };

      const caller = createCaller(ctx);
      const result = await caller.documents.create({
        title: "New Document",
        fileName: "new.pdf",
        fileType: "application/pdf",
        fileSize: 1024,
        fileUrl: "https://storage.example.com/new.pdf",
        filePath: "documents/new.pdf",
      });

      expect(result.id).toBe("new-doc");
      
      const createCall = mockCreate.mock.calls[0][0];
      expect(createCall.data.companyId).toBe(COMPANY_ID);
      expect(createCall.data.createdBy).toBe(USER_ID);
    });
  });

  describe("update", () => {
    it("updates document and logs edit action", async () => {
      const ctx = createTestContext();
      const existingDoc = { id: "doc1", title: "Old Title", companyId: COMPANY_ID };
      const updatedDoc = { id: "doc1", title: "New Title", companyId: COMPANY_ID, category: null };

      const mockFindFirst = vi.fn().mockResolvedValue(existingDoc);
      const mockUpdate = vi.fn().mockResolvedValue(updatedDoc);
      const mockLogCreate = vi.fn().mockResolvedValue({ id: "log1" });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ctx.prisma as any).gedDocument = {
        findFirst: mockFindFirst,
        update: mockUpdate,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ctx.prisma as any).gedAccessLog = { create: mockLogCreate };

      const caller = createCaller(ctx);
      const result = await caller.documents.update({
        id: "550e8400-e29b-41d4-a716-446655440000",
        title: "New Title",
      });

      expect(result.title).toBe("New Title");
      expect(mockLogCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: "EDIT",
        }),
      });
    });

    it("throws NOT_FOUND for non-existent document", async () => {
      const ctx = createTestContext();
      const mockFindFirst = vi.fn().mockResolvedValue(null);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ctx.prisma as any).gedDocument = { findFirst: mockFindFirst };

      const caller = createCaller(ctx);

      await expect(
        caller.documents.update({ id: "550e8400-e29b-41d4-a716-446655440000", title: "New" })
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });
  });

  describe("delete", () => {
    it("soft deletes document (sets status to DELETED)", async () => {
      const ctx = createTestContext();
      const existingDoc = { id: "doc1", companyId: COMPANY_ID };
      const deletedDoc = { id: "doc1", status: "DELETED", deletedAt: new Date() };

      const mockFindFirst = vi.fn().mockResolvedValue(existingDoc);
      const mockUpdate = vi.fn().mockResolvedValue(deletedDoc);
      const mockLogCreate = vi.fn().mockResolvedValue({ id: "log1" });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ctx.prisma as any).gedDocument = {
        findFirst: mockFindFirst,
        update: mockUpdate,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ctx.prisma as any).gedAccessLog = { create: mockLogCreate };

      const caller = createCaller(ctx);
      const result = await caller.documents.delete({ id: "550e8400-e29b-41d4-a716-446655440000" });

      expect(result.status).toBe("DELETED");
      
      const updateCall = mockUpdate.mock.calls[0][0];
      expect(updateCall.data.status).toBe("DELETED");
      expect(updateCall.data.deletedAt).toBeDefined();
    });
  });

  describe("uploadVersion", () => {
    it("creates new version and marks old as not latest", async () => {
      const ctx = createTestContext();
      const parentDoc = {
        id: "doc1",
        title: "Original",
        version: 1,
        parentId: null,
        companyId: COMPANY_ID,
        categoryId: null,
        tags: ["tag1"],
        entityType: "SUPPLIER",
        entityId: "sup1",
        isShared: false,
        description: "Desc",
      };
      const newVersionDoc = { id: "doc2", version: 2, parentId: "doc1", category: null };

      const mockFindFirst = vi.fn().mockResolvedValue(parentDoc);
      const mockUpdate = vi.fn().mockResolvedValue({ ...parentDoc, isLatestVersion: false });
      const mockCreate = vi.fn().mockResolvedValue(newVersionDoc);
      const mockLogCreate = vi.fn().mockResolvedValue({ id: "log1" });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ctx.prisma as any).gedDocument = {
        findFirst: mockFindFirst,
        update: mockUpdate,
        create: mockCreate,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ctx.prisma as any).gedAccessLog = { create: mockLogCreate };

      const caller = createCaller(ctx);
      const result = await caller.documents.uploadVersion({
        parentId: "550e8400-e29b-41d4-a716-446655440000",
        fileName: "new-version.pdf",
        fileType: "application/pdf",
        fileSize: 2048,
        fileUrl: "https://storage.example.com/v2.pdf",
        filePath: "documents/v2.pdf",
      });

      expect(result.version).toBe(2);
      
      // Verify old version marked as not latest
      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: "doc1" },
        data: { isLatestVersion: false },
      });
      
      // Verify new version created with incremented version number
      const createCall = mockCreate.mock.calls[0][0];
      expect(createCall.data.version).toBe(2);
      expect(createCall.data.isLatestVersion).toBe(true);
    });

    it("throws NOT_FOUND for non-existent parent", async () => {
      const ctx = createTestContext();
      const mockFindFirst = vi.fn().mockResolvedValue(null);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ctx.prisma as any).gedDocument = { findFirst: mockFindFirst };

      const caller = createCaller(ctx);

      await expect(
        caller.documents.uploadVersion({
          parentId: "550e8400-e29b-41d4-a716-446655440000",
          fileName: "v2.pdf",
          fileType: "application/pdf",
          fileSize: 1024,
          fileUrl: "https://example.com/v2.pdf",
          filePath: "docs/v2.pdf",
        })
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });
  });

  describe("logDownload", () => {
    it("creates download log entry", async () => {
      const ctx = createTestContext();
      const mockCreate = vi.fn().mockResolvedValue({ id: "log1" });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ctx.prisma as any).gedAccessLog = { create: mockCreate };

      const caller = createCaller(ctx);
      const result = await caller.documents.logDownload({ id: "550e8400-e29b-41d4-a716-446655440000" });

      expect(result.success).toBe(true);
      expect(mockCreate).toHaveBeenCalledWith({
        data: {
          documentId: "550e8400-e29b-41d4-a716-446655440000",
          userId: USER_ID,
          action: "DOWNLOAD",
        },
      });
    });
  });

  describe("listCategories", () => {
    it("returns root categories with children", async () => {
      const ctx = createTestContext();
      const mockCategories = [
        { id: "cat1", name: "Contratos", parentId: null, _count: { documents: 5, children: 2 }, children: [] },
        { id: "cat2", name: "Notas Fiscais", parentId: null, _count: { documents: 10, children: 0 }, children: [] },
      ];

      const mockFindMany = vi.fn().mockResolvedValue(mockCategories);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ctx.prisma as any).gedCategory = { findMany: mockFindMany };

      const caller = createCaller(ctx);
      const result = await caller.documents.listCategories({});

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("Contratos");
      expect(result[1].name).toBe("Notas Fiscais");
    });
  });

  describe("createCategory", () => {
    it("creates new category with companyId", async () => {
      const ctx = createTestContext();
      const mockCategory = { id: "cat-new", name: "Nova Categoria", companyId: COMPANY_ID };

      const mockFindFirst = vi.fn().mockResolvedValue(null);
      const mockCreate = vi.fn().mockResolvedValue(mockCategory);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ctx.prisma as any).gedCategory = {
        findFirst: mockFindFirst,
        create: mockCreate,
      };

      const caller = createCaller(ctx);
      const result = await caller.documents.createCategory({
        name: "Nova Categoria",
        color: "#FF0000",
        icon: "folder",
      });

      expect(result.name).toBe("Nova Categoria");
      
      const createCall = mockCreate.mock.calls[0][0];
      expect(createCall.data.companyId).toBe(COMPANY_ID);
    });

    it("throws CONFLICT for duplicate name", async () => {
      const ctx = createTestContext();
      const existingCategory = { id: "cat1", name: "Contratos" };

      const mockFindFirst = vi.fn().mockResolvedValue(existingCategory);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ctx.prisma as any).gedCategory = { findFirst: mockFindFirst };

      const caller = createCaller(ctx);

      await expect(
        caller.documents.createCategory({ name: "Contratos" })
      ).rejects.toMatchObject({
        code: "CONFLICT",
      });
    });
  });

  describe("updateCategory", () => {
    it("updates category fields", async () => {
      const ctx = createTestContext();
      const existingCat = { id: "cat1", name: "Old Name", companyId: COMPANY_ID };
      const updatedCat = { id: "cat1", name: "New Name", companyId: COMPANY_ID };

      const mockFindFirst = vi.fn()
        .mockResolvedValueOnce(existingCat)  // First call: check exists
        .mockResolvedValueOnce(null);         // Second call: check duplicate

      const mockUpdate = vi.fn().mockResolvedValue(updatedCat);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ctx.prisma as any).gedCategory = {
        findFirst: mockFindFirst,
        update: mockUpdate,
      };

      const caller = createCaller(ctx);
      const result = await caller.documents.updateCategory({
        id: "550e8400-e29b-41d4-a716-446655440000",
        name: "New Name",
      });

      expect(result.name).toBe("New Name");
    });
  });

  describe("deleteCategory", () => {
    it("deletes empty category", async () => {
      const ctx = createTestContext();
      const mockCategory = {
        id: "cat1",
        name: "Empty",
        companyId: COMPANY_ID,
        _count: { documents: 0, children: 0 },
      };

      const mockFindFirst = vi.fn().mockResolvedValue(mockCategory);
      const mockDelete = vi.fn().mockResolvedValue(mockCategory);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ctx.prisma as any).gedCategory = {
        findFirst: mockFindFirst,
        delete: mockDelete,
      };

      const caller = createCaller(ctx);
      const result = await caller.documents.deleteCategory({ id: "550e8400-e29b-41d4-a716-446655440000" });

      expect(result.success).toBe(true);
    });

    it("throws PRECONDITION_FAILED if category has documents", async () => {
      const ctx = createTestContext();
      const mockCategory = {
        id: "cat1",
        companyId: COMPANY_ID,
        _count: { documents: 5, children: 0 },
      };

      const mockFindFirst = vi.fn().mockResolvedValue(mockCategory);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ctx.prisma as any).gedCategory = { findFirst: mockFindFirst };

      const caller = createCaller(ctx);

      await expect(
        caller.documents.deleteCategory({ id: "550e8400-e29b-41d4-a716-446655440000" })
      ).rejects.toMatchObject({
        code: "PRECONDITION_FAILED",
      });
    });

    it("throws PRECONDITION_FAILED if category has children", async () => {
      const ctx = createTestContext();
      const mockCategory = {
        id: "cat1",
        companyId: COMPANY_ID,
        _count: { documents: 0, children: 3 },
      };

      const mockFindFirst = vi.fn().mockResolvedValue(mockCategory);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ctx.prisma as any).gedCategory = { findFirst: mockFindFirst };

      const caller = createCaller(ctx);

      await expect(
        caller.documents.deleteCategory({ id: "550e8400-e29b-41d4-a716-446655440000" })
      ).rejects.toMatchObject({
        code: "PRECONDITION_FAILED",
      });
    });
  });

  describe("stats", () => {
    it("returns document statistics", async () => {
      const ctx = createTestContext();

      const mockDocCount = vi.fn().mockResolvedValue(100);
      const mockCatCount = vi.fn().mockResolvedValue(10);
      const mockAggregate = vi.fn().mockResolvedValue({ _sum: { fileSize: 1024000 } });
      const mockGroupBy = vi.fn()
        .mockResolvedValueOnce([{ status: "ACTIVE", _count: 90 }])
        .mockResolvedValueOnce([{ entityType: "SUPPLIER", _count: 30 }]);
      const mockFindMany = vi.fn().mockResolvedValue([
        { id: "doc1", title: "Recent 1", fileName: "r1.pdf", createdAt: new Date() },
      ]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ctx.prisma as any).gedDocument = {
        count: mockDocCount,
        aggregate: mockAggregate,
        groupBy: mockGroupBy,
        findMany: mockFindMany,
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (ctx.prisma as any).gedCategory = { count: mockCatCount };

      const caller = createCaller(ctx);
      const result = await caller.documents.stats();

      expect(result.totalDocuments).toBe(100);
      expect(result.totalCategories).toBe(10);
      expect(result.totalSizeBytes).toBe(1024000);
      expect(result.totalSizeMB).toBeCloseTo(0.98, 1);
      expect(result.recentUploads).toHaveLength(1);
    });
  });
});
