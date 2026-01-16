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
  id        String   @id @default(uuid()) @db.Uuid
  companyId String?  @db.Uuid  // Multi-tenant
  isShared  Boolean  @default(false)  // Compartilhamento
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@map("nome_tabela_snake_case")
}
```

### 2. Criar Router tRPC
Criar arquivo em `src/server/routers/[nome].ts`:

```typescript
import { z } from "zod";
import { createTRPCRouter, tenantProcedure, tenantFilter } from "../trpc";
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
      
      const where = {
        ...tenantFilter(ctx.companyId),
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
      return ctx.prisma.entidade.findFirst({
        where: { id: input.id, ...tenantFilter(ctx.companyId) },
      });
    }),

  // Criar
  create: tenantProcedure
    .input(z.object({
      // campos obrigatórios e opcionais
    }))
    .mutation(async ({ ctx, input }) => {
      const item = await ctx.prisma.entidade.create({
        data: { ...input, companyId: ctx.companyId },
      });

      await auditCreate("Entidade", item, item.code?.toString(), {
        userId: ctx.tenant.userId ?? undefined,
        companyId: ctx.companyId,
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
      
      const old = await ctx.prisma.entidade.findFirst({
        where: { id, ...tenantFilter(ctx.companyId, false) },
      });
      
      if (!old) throw new Error("Não encontrado ou sem permissão");
      
      const item = await ctx.prisma.entidade.update({
        where: { id },
        data,
      });

      await auditUpdate("Entidade", id, item.code?.toString(), old, item, {
        userId: ctx.tenant.userId ?? undefined,
        companyId: ctx.companyId,
      });

      return item;
    }),

  // Deletar
  delete: tenantProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.entidade.findFirst({
        where: { id: input.id, ...tenantFilter(ctx.companyId, false) },
      });
      
      if (!existing) throw new Error("Não encontrado ou sem permissão");
      
      const deleted = await ctx.prisma.entidade.delete({
        where: { id: input.id },
      });

      await auditDelete("Entidade", existing, existing.code?.toString(), {
        userId: ctx.tenant.userId ?? undefined,
        companyId: ctx.companyId,
      });

      return deleted;
    }),
});
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

**Detalhe** (`src/app/[nome]/[id]/page.tsx`):
- Exibição de dados
- Botão Editar
- Relacionamentos

**Edição** (`src/app/[nome]/[id]/edit/page.tsx`):
- Formulário preenchido
- Carregamento de dados existentes
- Botões: Cancelar, Salvar

### 5. Verificar Build
// turbo
```bash
pnpm type-check
```

### 6. Commit e Push
```bash
git add -A
git commit -m "feat([modulo]): [descrição] VIO-XXX"
git push origin main
```

### 7. Atualizar Linear
Usar `mcp3_update_issue` para atualizar status da issue

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
