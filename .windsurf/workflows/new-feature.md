---
description: Workflow completo para criar uma nova feature no projeto FRM ERP
---

# Workflow: Nova Feature

## Pré-requisitos
- Verificar se existe issue no Linear relacionada
- Entender o escopo da feature

## Passos

### 1. Criar/Atualizar Schema (se necessário)
Se a feature precisa de novas tabelas ou campos:

1. Editar `prisma/schema.prisma`
2. Seguir workflow `/db-migration` para aplicar

**Padrões obrigatórios:**
```prisma
model NovaEntidade {
  id        String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  companyId String    @map("company_id") @db.Uuid  // NOT NULL (padrão v1)
  isShared  Boolean   @default(false) @map("is_shared")
  isActive  Boolean   @default(true) @map("is_active")
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @default(now()) @updatedAt @map("updated_at")
  
  // Soft delete (opcional, recomendado para entidades críticas)
  deletedAt DateTime? @map("deleted_at")
  deletedBy String?   @map("deleted_by") @db.Uuid
  
  // Legacy ID (se migração Delphi)
  legacyId  Int?      @map("legacy_id")
  
  // Campos monetários — SEMPRE Decimal, NUNCA Float
  // totalValue Decimal @map("total_value") @db.Decimal(15, 2)
  
  @@index([companyId])
  @@unique([companyId, legacyId])  // Se tiver legacyId
  @@map("nome_tabela_snake_case")
}
```

### 2. Criar Router tRPC
Criar arquivo em `src/server/routers/[nome].ts`:

```typescript
import { z } from "zod";
import { createTRPCRouter, tenantProcedure } from "../trpc";
import { auditCreate, auditUpdate, auditDelete } from "../services/audit";

export const nomeRouter = createTRPCRouter({
  // Listar com filtro de tenant
  list: tenantProcedure
    .input(z.object({
      search: z.string().optional(),
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(20),
    }).optional())
    .query(async ({ ctx, input }) => {
      const { search, page = 1, limit = 20 } = input ?? {};
      
      const companyId = ctx.tenant.companyId!;
      const where = {
        companyId,
        ...(search && {
          OR: [
            { campo: { contains: search, mode: "insensitive" as const } },
          ],
        }),
      };

      const [items, total] = await Promise.all([
        ctx.prisma.entidade.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
        ctx.prisma.entidade.count({ where }),
      ]);

      return {
        items,
        pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      };
    }),

  // Buscar por ID
  byId: tenantProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const companyId = ctx.tenant.companyId!;
      return ctx.prisma.entidade.findFirst({
        where: { id: input.id, companyId },
      });
    }),

  // Criar
  create: tenantProcedure
    .input(z.object({
      // campos obrigatórios e opcionais
    }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.tenant.companyId!;
      const item = await ctx.prisma.entidade.create({
        data: { ...input, companyId },
      });

      await auditCreate("Entidade", item, item.code?.toString(), {
        userId: ctx.tenant.userId ?? undefined,
        companyId,
      });

      return item;
    }),

  // Atualizar
  update: tenantProcedure
    .input(z.object({
      id: z.string(),
      // campos atualizáveis
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      
      const companyId = ctx.tenant.companyId!;
      const old = await ctx.prisma.entidade.findFirst({
        where: { id, companyId },
      });
      
      if (!old) throw new Error("Não encontrado ou sem permissão");
      
      const item = await ctx.prisma.entidade.update({
        where: { id },
        data,
      });

      await auditUpdate("Entidade", id, item.code?.toString(), old, item, {
        userId: ctx.tenant.userId ?? undefined,
        companyId,
      });

      return item;
    }),

  // Deletar
  delete: tenantProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const companyId = ctx.tenant.companyId!;
      const existing = await ctx.prisma.entidade.findFirst({
        where: { id: input.id, companyId },
      });
      
      if (!existing) throw new Error("Não encontrado ou sem permissão");
      
      const deleted = await ctx.prisma.entidade.delete({
        where: { id: input.id },
      });

      await auditDelete("Entidade", existing, existing.code?.toString(), {
        userId: ctx.tenant.userId ?? undefined,
        companyId,
      });

      return deleted;
    }),
});
```

### 2b. Se a feature usa IA (OpenAI, embeddings, etc.)

**OBRIGATÓRIO**: Usar o helper centralizado para API keys:
```typescript
import { getOpenAIKey, getAIApiKey } from "@/server/services/getAIApiKey";

// Buscar API key OpenAI (com fallback para outros providers)
const apiKey = await getOpenAIKey(ctx.prisma, ctx.companyId);

// Ou buscar provider específico
const result = await getAIApiKey(ctx.prisma, ctx.companyId, {
  provider: "openai",
  fallbackProviders: ["anthropic"],
});
// result?.apiKey, result?.provider
```

**NUNCA** buscar tokens diretamente do `systemSettings`:
```typescript
// ❌ ERRADO — padrão antigo, inconsistente
const setting = await ctx.prisma.systemSetting.findFirst({
  where: { key: "openai_token", companyId: ctx.companyId },
});
const apiKey = (setting?.value as { value: string }).value;

// ✅ CORRETO — helper centralizado
const apiKey = await getOpenAIKey(ctx.prisma, ctx.companyId);
```

**Para embeddings vetoriais**, usar raw SQL (Prisma não suporta `vector`):
```typescript
// Busca por similaridade
const results = await ctx.prisma.$queryRaw`
  SELECT * FROM match_embeddings(
    ${embedding}::vector(1536), ${entityType}, ${companyId}::uuid
  )
`;
```

### 3. Registrar Router
Editar `src/server/routers/index.ts`:

```typescript
import { nomeRouter } from "./nome";

export const appRouter = createTRPCRouter({
  // ... outros routers
  nome: nomeRouter,
});
```

### 4. Criar Páginas

**Listagem** (`src/app/[nome]/page.tsx`):
- Header com título e botão "Novo"
- Filtros (busca, status)
- Tabela com paginação
- Ações: visualizar, editar, excluir

**Criação** (`src/app/[nome]/new/page.tsx`):
- Formulário com validação
- Botões: Cancelar, Salvar
- Redirect após sucesso
- **OBRIGATÓRIO**: onError handler na mutation

**Detalhe** (`src/app/[nome]/[id]/page.tsx`):
- Exibição de dados
- Botão Editar
- Relacionamentos

**Edição** (`src/app/[nome]/[id]/edit/page.tsx`):
- Formulário preenchido
- Carregamento de dados existentes
- Botões: Cancelar, Salvar
- **OBRIGATÓRIO**: onError handler na mutation

**Padrão de Mutations com onError:**
```typescript
const createMutation = trpc.modulo.create.useMutation({
  onSuccess: (data) => {
    router.push(`/modulo/${data.id}`);
  },
  onError: (error) => {
    alert(`Erro ao criar: ${error.message}`);
  },
});
```

### 5. Criar Service Layer (para módulos complexos)
Se a feature tem lógica de negócio significativa, criar service em `src/server/services/[nome].ts`:

```typescript
import type { PrismaClient } from "@prisma/client";

// Pure functions (testáveis sem mock)
export function calculateSomething(input: number): number {
  return input * 2;
}

// Service class (usa Prisma)
export class NomeService {
  constructor(private readonly prisma: PrismaClient) {}

  async createItem(companyId: string, data: { ... }) {
    // Para models novos que o TS não reconhece no PrismaClient:
    return (this.prisma as unknown as { entidade: { create: (args: Record<string, unknown>) => Promise<unknown> } }).entidade.create({
      data: { companyId, ...data },
    });
  }
}
```

E testes em `src/server/services/[nome].test.ts` com mocks do Prisma.

### 6. Verificar Build
// turbo
```bash
NODE_OPTIONS="--max-old-space-size=4096" npx tsc --noEmit
```

### 7. Commit e Push
```bash
git add -A
git commit -m "feat([modulo]): [descrição] VIO-XXX"
git push origin main
```

### 8. Atualizar Linear
Usar `mcp2_update_issue` para atualizar status da issue

## Erros Comuns

### Lint: "mode: 'insensitive'" em queries
```typescript
// CORRETO - usar "as const"
{ contains: search, mode: "insensitive" as const }
```

### Tipo null vs undefined
```typescript
// ctx.tenant.userId pode ser null, mas auditoria espera undefined
userId: ctx.tenant.userId ?? undefined,
```

### Import de tipos Prisma
```typescript
// Para tipos JSON
import { Prisma } from "@prisma/client";
data as Prisma.InputJsonValue
```

### "use client" obrigatório
Páginas com hooks (useState, useEffect) ou eventos precisam:
```typescript
"use client";
// no topo do arquivo
```
