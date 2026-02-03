---
name: Criar Testes Unitários Router
description: Cria testes unitários para um router tRPC seguindo padrões do projeto
---

# Skill: Criar Testes Unitários para Router tRPC

## Estrutura de Arquivo

```
src/server/routers/__tests__/<router>.test.ts
```

## Template Base

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { z } from "zod";

// Mock do Prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    <modelo>: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
      aggregate: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";

describe("<Router>Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("list", () => {
    it("should return paginated items", async () => {
      const mockItems = [
        { id: "1", name: "Item 1", companyId: "company-1" },
        { id: "2", name: "Item 2", companyId: "company-1" },
      ];

      vi.mocked(prisma.<modelo>.findMany).mockResolvedValue(mockItems);
      vi.mocked(prisma.<modelo>.count).mockResolvedValue(2);

      // Simular chamada do router
      const result = {
        items: mockItems,
        pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
      };

      expect(result.items).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
    });

    it("should filter by search term", async () => {
      const mockItems = [{ id: "1", name: "Test Item", companyId: "company-1" }];

      vi.mocked(prisma.<modelo>.findMany).mockResolvedValue(mockItems);
      vi.mocked(prisma.<modelo>.count).mockResolvedValue(1);

      // Verificar que o filtro foi aplicado
      expect(prisma.<modelo>.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            name: expect.objectContaining({
              contains: "Test",
              mode: "insensitive",
            }),
          }),
        })
      );
    });
  });

  describe("getById", () => {
    it("should return item by id", async () => {
      const mockItem = { id: "1", name: "Item 1", companyId: "company-1" };

      vi.mocked(prisma.<modelo>.findFirst).mockResolvedValue(mockItem);

      expect(mockItem.id).toBe("1");
    });

    it("should throw error if item not found", async () => {
      vi.mocked(prisma.<modelo>.findFirst).mockResolvedValue(null);

      // Esperar erro TRPCError NOT_FOUND
    });
  });

  describe("create", () => {
    it("should create new item", async () => {
      const input = { name: "New Item" };
      const mockCreated = { id: "new-id", ...input, companyId: "company-1" };

      vi.mocked(prisma.<modelo>.create).mockResolvedValue(mockCreated);

      expect(mockCreated.name).toBe("New Item");
    });

    it("should validate required fields", async () => {
      const invalidInput = { name: "" };

      // Esperar erro de validação Zod
    });
  });

  describe("update", () => {
    it("should update existing item", async () => {
      const mockExisting = { id: "1", name: "Old Name", companyId: "company-1" };
      const mockUpdated = { ...mockExisting, name: "New Name" };

      vi.mocked(prisma.<modelo>.findFirst).mockResolvedValue(mockExisting);
      vi.mocked(prisma.<modelo>.update).mockResolvedValue(mockUpdated);

      expect(mockUpdated.name).toBe("New Name");
    });

    it("should throw error if item not found", async () => {
      vi.mocked(prisma.<modelo>.findFirst).mockResolvedValue(null);

      // Esperar erro TRPCError NOT_FOUND
    });
  });

  describe("delete", () => {
    it("should delete item", async () => {
      const mockItem = { id: "1", name: "Item", companyId: "company-1" };

      vi.mocked(prisma.<modelo>.findFirst).mockResolvedValue(mockItem);
      vi.mocked(prisma.<modelo>.delete).mockResolvedValue(mockItem);

      expect(prisma.<modelo>.delete).toHaveBeenCalledWith({
        where: { id: "1" },
      });
    });
  });
});

// Testes de Schema Zod
describe("<Router> Schemas", () => {
  describe("createInput", () => {
    const schema = z.object({
      name: z.string().min(1),
      // outros campos
    });

    it("should accept valid input", () => {
      const result = schema.safeParse({ name: "Valid Name" });
      expect(result.success).toBe(true);
    });

    it("should reject empty name", () => {
      const result = schema.safeParse({ name: "" });
      expect(result.success).toBe(false);
    });
  });
});
```

## Padrões Obrigatórios

### 1. Mock do Prisma
```typescript
vi.mock("@/lib/prisma", () => ({
  prisma: {
    <modelo>: {
      findMany: vi.fn(),
      // ...
    },
  },
}));
```

### 2. Limpar Mocks
```typescript
beforeEach(() => {
  vi.clearAllMocks();
});
```

### 3. Testar Multi-Tenancy
```typescript
it("should filter by companyId", async () => {
  expect(prisma.<modelo>.findMany).toHaveBeenCalledWith(
    expect.objectContaining({
      where: expect.objectContaining({
        companyId: "company-1",
      }),
    })
  );
});
```

### 4. Testar Erros
```typescript
it("should throw NOT_FOUND error", async () => {
  vi.mocked(prisma.<modelo>.findFirst).mockResolvedValue(null);
  
  await expect(async () => {
    // chamar procedure
  }).rejects.toThrow("NOT_FOUND");
});
```

## Checklist

- [ ] Criar arquivo de teste em `__tests__/<router>.test.ts`
- [ ] Mock do Prisma para todos os métodos usados
- [ ] Testes para `list` (paginação, filtros)
- [ ] Testes para `getById` (sucesso, não encontrado)
- [ ] Testes para `create` (sucesso, validação)
- [ ] Testes para `update` (sucesso, não encontrado)
- [ ] Testes para `delete` (sucesso, não encontrado)
- [ ] Testes de schema Zod
- [ ] Testes de multi-tenancy (companyId)
- [ ] Executar `pnpm test:run`

## Comandos

```bash
# Executar testes do router específico
pnpm test:run src/server/routers/__tests__/<router>.test.ts

# Executar todos os testes
pnpm test:run

# Verificar cobertura
pnpm test:coverage
```
