import { describe, it, expect } from "vitest";
import {
  paginationSchema,
  getPaginationParams,
  createPaginationMeta,
  paginatedResult,
  cursorPaginationSchema,
  cursorPaginatedResult,
} from "./pagination";

describe("paginationSchema", () => {
  it("should parse valid pagination input", () => {
    const result = paginationSchema.safeParse({ page: 2, limit: 50 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(2);
      expect(result.data.limit).toBe(50);
    }
  });

  it("should use default values", () => {
    const result = paginationSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
    }
  });

  it("should reject page < 1", () => {
    const result = paginationSchema.safeParse({ page: 0 });
    expect(result.success).toBe(false);
  });

  it("should reject limit > 100", () => {
    const result = paginationSchema.safeParse({ limit: 150 });
    expect(result.success).toBe(false);
  });

  it("should reject limit < 1", () => {
    const result = paginationSchema.safeParse({ limit: 0 });
    expect(result.success).toBe(false);
  });
});

describe("getPaginationParams", () => {
  it("should calculate skip and take for page 1", () => {
    const params = getPaginationParams({ page: 1, limit: 20 });
    expect(params.skip).toBe(0);
    expect(params.take).toBe(20);
  });

  it("should calculate skip and take for page 2", () => {
    const params = getPaginationParams({ page: 2, limit: 20 });
    expect(params.skip).toBe(20);
    expect(params.take).toBe(20);
  });

  it("should calculate skip and take for page 5 with limit 10", () => {
    const params = getPaginationParams({ page: 5, limit: 10 });
    expect(params.skip).toBe(40);
    expect(params.take).toBe(10);
  });
});

describe("createPaginationMeta", () => {
  it("should calculate pagination metadata", () => {
    const meta = createPaginationMeta(100, 1, 20);
    expect(meta.total).toBe(100);
    expect(meta.page).toBe(1);
    expect(meta.limit).toBe(20);
    expect(meta.totalPages).toBe(5);
    expect(meta.hasNext).toBe(true);
    expect(meta.hasPrev).toBe(false);
  });

  it("should handle last page", () => {
    const meta = createPaginationMeta(100, 5, 20);
    expect(meta.hasNext).toBe(false);
    expect(meta.hasPrev).toBe(true);
  });

  it("should handle middle page", () => {
    const meta = createPaginationMeta(100, 3, 20);
    expect(meta.hasNext).toBe(true);
    expect(meta.hasPrev).toBe(true);
  });

  it("should handle single page", () => {
    const meta = createPaginationMeta(10, 1, 20);
    expect(meta.totalPages).toBe(1);
    expect(meta.hasNext).toBe(false);
    expect(meta.hasPrev).toBe(false);
  });

  it("should handle empty results", () => {
    const meta = createPaginationMeta(0, 1, 20);
    expect(meta.totalPages).toBe(0);
    expect(meta.hasNext).toBe(false);
    expect(meta.hasPrev).toBe(false);
  });
});

describe("paginatedResult", () => {
  it("should create paginated result object", () => {
    const items = [{ id: 1 }, { id: 2 }];
    const result = paginatedResult(items, 50, 1, 20);

    expect(result.items).toEqual(items);
    expect(result.pagination.total).toBe(50);
    expect(result.pagination.page).toBe(1);
    expect(result.pagination.limit).toBe(20);
    expect(result.pagination.totalPages).toBe(3);
  });
});

describe("cursorPaginationSchema", () => {
  it("should parse valid cursor pagination input", () => {
    const result = cursorPaginationSchema.safeParse({
      cursor: "abc123",
      limit: 50,
      direction: "forward",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.cursor).toBe("abc123");
      expect(result.data.limit).toBe(50);
      expect(result.data.direction).toBe("forward");
    }
  });

  it("should use default values", () => {
    const result = cursorPaginationSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.cursor).toBeUndefined();
      expect(result.data.limit).toBe(20);
      expect(result.data.direction).toBe("forward");
    }
  });
});

describe("cursorPaginatedResult", () => {
  it("should create cursor paginated result", () => {
    const items = [
      { id: "a" },
      { id: "b" },
      { id: "c" },
    ];
    const result = cursorPaginatedResult(items, 10);

    expect(result.items).toEqual(items);
    expect(result.nextCursor).toBe("c");
    expect(result.prevCursor).toBe("a");
    expect(result.hasMore).toBe(false);
  });

  it("should indicate hasMore when items exceed limit", () => {
    const items = [
      { id: "a" },
      { id: "b" },
      { id: "c" },
    ];
    const result = cursorPaginatedResult(items, 2);

    expect(result.items.length).toBe(2);
    expect(result.hasMore).toBe(true);
  });

  it("should handle empty items", () => {
    const result = cursorPaginatedResult([], 10);

    expect(result.items).toEqual([]);
    expect(result.nextCursor).toBe(null);
    expect(result.prevCursor).toBe(null);
    expect(result.hasMore).toBe(false);
  });
});
