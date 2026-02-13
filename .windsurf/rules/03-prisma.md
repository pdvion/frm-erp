---
trigger: always
description: Convenções Prisma — nomenclatura, tipos, transações, validação Zod, padrões obrigatórios
---

# Prisma — Convenções e Padrões

## Nomenclatura: camelCase + @map

```prisma
// ✅ CORRETO — camelCase no Prisma, snake_case no banco
model Example {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  companyId String   @map("company_id") @db.Uuid
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @default(now()) @updatedAt @map("updated_at")

  company Company @relation(fields: [companyId], references: [id], onDelete: Cascade, onUpdate: Cascade)

  @@index([companyId])
  @@map("examples")
}

// ❌ ERRADO — snake_case direto
model Example {
  company_id String? @db.Uuid  // ❌
}
```

Enums também: `@@map("enum_name_snake_case")`.

## Campos Padrão Obrigatórios em Todo Novo Model

```prisma
id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
companyId String   @map("company_id") @db.Uuid          // NOT NULL
createdAt DateTime @default(now()) @map("created_at")
updatedAt DateTime @default(now()) @updatedAt @map("updated_at")  // COM @updatedAt

company Company @relation(fields: [companyId], references: [id], onDelete: Cascade, onUpdate: Cascade)

@@index([companyId])
@@map("table_name_snake_case")
```

- `onDelete` e `onUpdate` explícitos em TODAS as relações
- Não duplicar índices (se `@@unique` já inclui `companyId`, `@@index([companyId])` é redundante)

## Decimal NUNCA Float

```prisma
// ✅ Monetário, quantidade, peso, medida → Decimal
totalValue Decimal @map("total_value") @db.Decimal(15, 2)
quantity   Decimal @map("quantity") @db.Decimal(15, 4)
weight     Decimal @map("weight") @db.Decimal(15, 6)

// ❌ Float apenas para GPS, OEE, posições UI
latitude Float?
```

No TypeScript — converter Decimal→number:
```typescript
Number(invoice.totalValue)     // ✅
Number(x ?? 0)                 // ✅ nullish ANTES do Number
Number(x) ?? 0                 // ❌ BUG: Number() nunca retorna null
```

## $transaction Obrigatória para 2+ Writes

```typescript
// ✅ CORRETO — atomicidade garantida
await ctx.prisma.$transaction(async (tx) => {
  await tx.item.update({ where: { id }, data: { status: "SEPARATED" } });
  await tx.inventory.update({ where: { id: inv.id }, data: { quantity: { decrement: qty } } });
});

// ❌ ERRADO — se o segundo falhar, o primeiro já persistiu
await ctx.prisma.item.update(...);
await ctx.prisma.inventory.update(...);
```

Cenários: delete+create, pai+filhos, decrementar estoque, gerar código sequencial.

## TOCTOU Prevention — Validação DENTRO da Transação

```typescript
// ✅ CORRETO — leitura e escrita na mesma transação
await ctx.prisma.$transaction(async (tx) => {
  const item = await tx.reservation.findFirst({ where: { id, status: "ACTIVE" } });
  if (!item) throw new Error("Not found");
  await tx.reservation.update({ where: { id }, data: { status: "CONSUMED" } });
});

// ❌ ERRADO — entre findFirst e $transaction, outro request pode mudar o estado
const item = await ctx.prisma.reservation.findFirst({ where: { id, status: "ACTIVE" } });
if (!item) throw new Error("Not found");
await ctx.prisma.$transaction(async (tx) => { ... });
```

## Filtros de Data — NUNCA Spread Separado

```typescript
// ❌ ERRADO — endDate sobrescreve startDate
const where = {
  ...(startDate && { createdAt: { gte: new Date(startDate) } }),
  ...(endDate && { createdAt: { lte: new Date(endDate) } }),
};

// ✅ CORRETO — combinar num único objeto
const where = {
  ...((startDate || endDate) && {
    createdAt: {
      ...(startDate && { gte: new Date(startDate) }),
      ...(endDate && { lte: new Date(endDate) }),
    },
  }),
};
```

## Código Sequencial — Dentro de $transaction

```typescript
await ctx.prisma.$transaction(async (tx) => {
  const last = await tx.invoice.findFirst({
    where: { companyId },
    orderBy: { code: "desc" },
    select: { code: true },
  });
  const nextCode = (last?.code ?? 0) + 1;
  return tx.invoice.create({ data: { code: nextCode, companyId, ...rest } });
});
```

Para retry em caso de unique constraint: usar `withCodeRetry` de `src/server/utils/next-code.ts`.

## Validação Zod

```typescript
startDate: z.coerce.date(),                    // ✅ datas
operator: z.enum(["EQUALS", "CONTAINS"]),       // ✅ enums
take: options.limit ?? 100,                      // ✅ ?? preserva zero (não ||)
```

## catch(e: unknown) — OBRIGATÓRIO

```typescript
// ✅ CORRETO
try { ... } catch (e: unknown) {
  console.warn("Contexto:", e instanceof Error ? e.message : String(e));
}

// ❌ ERRADO
catch (e) { console.log(e.message); }  // implicit any
catch (e) { /* silencioso */ }          // swallowed
```

## Upsert com Índice Parcial

Para `systemSettings` e similares, usar `findFirst` + `create/update`:
```typescript
const existing = await prisma.systemSetting.findFirst({ where: { key, companyId } });
if (existing) {
  await prisma.systemSetting.update({ where: { id: existing.id }, data: { value } });
} else {
  await prisma.systemSetting.create({ data: { key, value, companyId } });
}
```

## pgvector — Prisma Não Suporta `vector`

Usar `$queryRaw` para campos vetoriais:
```typescript
const results = await prisma.$queryRaw`
  SELECT * FROM match_embeddings(${embedding}::vector(1536), ${entityType}, ${companyId}::uuid)
`;
```

## AI API Keys — Helper Centralizado

```typescript
import { getOpenAIKey } from "@/server/services/getAIApiKey";
const apiKey = await getOpenAIKey(ctx.prisma, ctx.companyId); // ✅

// ❌ NUNCA buscar tokens diretamente do systemSettings
```

## TypeScript Patterns

```typescript
{ contains: search, mode: "insensitive" as const }  // ✅ as const
data: { metadata: obj as Prisma.InputJsonValue }     // ✅ JSON cast
userId: ctx.tenant.userId ?? undefined,               // ✅ null→undefined
```

## Schema Modularizado

Schema em `prisma/schema/*.prisma` (18 arquivos). Ao criar novo model, colocar no arquivo do domínio correto. Após mudanças: `pnpm prisma generate && pnpm type-check`.
