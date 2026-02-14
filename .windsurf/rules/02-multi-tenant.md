---
activation: always_on
description: Regras de isolamento multi-tenant — RLS, IDOR prevention, companyId obrigatório
trigger: always_on
---

# Multi-Tenant — Regra Mais Crítica do Projeto

## RLS + Audit Extensions — INTEGRADOS no `tenantProcedure`

O `tenantProcedure` em `src/server/trpc.ts` já compõe automaticamente:

1. **`createTenantPrisma`** (`src/lib/prisma-rls.ts`) — injeta `companyId` em todas as queries de TENANT_MODELS
2. **`createAuditedPrisma`** (`src/lib/prisma-audit.ts`) — registra CREATE/UPDATE/DELETE em AUDITED_MODELS

```typescript
// trpc.ts — já implementado (linhas 189-202)
const tenantPrisma = createTenantPrisma(ctx.prisma, ctx.tenant.companyId);
const auditedPrisma = createAuditedPrisma(tenantPrisma, {
  userId: ctx.tenant.userId,
  companyId: ctx.tenant.companyId,
});
return next({ ctx: { ...ctx, prisma: auditedPrisma } });
```

Feature flag: `ENABLE_PRISMA_RLS` (ON by default). Todos os routers usam `ctx.prisma`.

## companyId é NOT NULL

Todos os models de negócio têm `companyId String` (não `String?`). Sempre incluir ao criar registros.

```typescript
// ✅ CORRETO
await ctx.prisma.entidade.create({
  data: { ...input, companyId: ctx.companyId },
});

// ❌ ERRADO — esqueceu companyId
await ctx.prisma.entidade.create({
  data: { ...input },
});
```

## IDOR Prevention

Em **TODA** operação update/delete, verificar ownership ANTES de operar:

```typescript
// ✅ CORRETO — findFirst com companyId, depois opera
const existing = await ctx.prisma.entidade.findFirst({
  where: { id: input.id, companyId: ctx.companyId },
});
if (!existing) {
  throw new TRPCError({ code: "NOT_FOUND", message: "Não encontrado" });
}
await ctx.prisma.entidade.update({ where: { id: input.id }, data });

// ❌ ERRADO — confia apenas no id do input
await ctx.prisma.entidade.update({
  where: { id: input.id },
  data,
});
```

## Lookups com companyId

Ao buscar entidades relacionadas (pipeline, customer, supplier), **SEMPRE** filtrar por `companyId`. Usar `findFirst` (não `findUnique`, que não aceita filtros compostos).

```typescript
// ❌ ERRADO — permite usar pipeline de outra empresa
const pipeline = await ctx.prisma.salesPipeline.findUnique({
  where: { id: input.pipelineId },
});

// ✅ CORRETO — garante isolamento
const pipeline = await ctx.prisma.salesPipeline.findFirst({
  where: { id: input.pipelineId, companyId: ctx.companyId },
});
if (!pipeline) throw new TRPCError({ code: "NOT_FOUND" });
```

## `tenantFilter()` é DEPRECATED

```typescript
// ❌ DEPRECATED — não usar em código novo
import { tenantFilter } from "../trpc";
where: { ...tenantFilter(ctx.companyId) }

// ✅ CORRETO — companyId direto
where: { companyId: ctx.companyId }
```

Se encontrar em código existente, não bloquear mas marcar para refatoração.

## Dados Compartilhados (isShared)

Para models com `isShared` (Material, CargoType, Incoterm, etc.):

```typescript
// ✅ Leitura — incluir registros compartilhados
where: {
  OR: [
    { companyId: ctx.companyId },
    { isShared: true },
  ],
}

// ✅ Escrita — NUNCA permitir editar/deletar registros shared
const existing = await ctx.prisma.entidade.findFirst({
  where: { id, companyId: ctx.companyId, isShared: false },
});
if (!existing) throw new TRPCError({ code: "NOT_FOUND" });
```

## AuditLog

Com `createAuditedPrisma` integrado no `tenantProcedure`, mutations em AUDITED_MODELS são auditadas automaticamente. Para audit manual (ex: API routes fora do tRPC):

```typescript
import { auditCreate, auditUpdate, auditDelete } from "../services/audit";

await auditUpdate("Entidade", id, label, oldValues, newValues, {
  userId: ctx.tenant.userId ?? undefined,
  companyId: ctx.companyId,
});
```

### PII Redaction no Audit

Campos sensíveis DEVEM ser redactados antes de auditar:

```typescript
const PII_FIELDS = [
  "candidateCpf", "candidateRg", "candidateBankAccount",
  "candidatePixKey", "candidateEmail", "candidatePhone",
] as const;

const redact = <T extends Record<string, unknown>>(obj: T): T => {
  const copy = { ...obj };
  for (const f of PII_FIELDS) if (f in copy) (copy as Record<string, unknown>)[f] = "[REDACTED]";
  return copy;
};

await auditUpdate("Entity", id, label, redact(old), redact(updated), auditCtx);
```
