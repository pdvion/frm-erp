---
description: Regras obrigatórias de qualidade de código para prevenir bugs sistêmicos detectados pelo CodeRabbit
---

# Regras de Qualidade — Prevenção de Bugs Sistêmicos

Estas regras são **OBRIGATÓRIAS** ao escrever código novo ou modificar código existente.
Foram criadas a partir da análise de ~60 issues do CodeRabbit nos PRs #44-#54.

---

## 🔴 REGRA 1: Transações obrigatórias em operações compostas

**Toda operação que faz 2+ escritas no banco DEVE usar `$transaction`.**

```typescript
// ❌ ERRADO — se o segundo update falhar, o primeiro já foi persistido
await ctx.prisma.item.update({ where: { id }, data: { status: "SEPARATED" } });
await ctx.prisma.inventory.update({ where: { id: inv.id }, data: { quantity: { decrement: qty } } });

// ✅ CORRETO — atomicidade garantida
await ctx.prisma.$transaction(async (tx) => {
  await tx.item.update({ where: { id }, data: { status: "SEPARATED" } });
  await tx.inventory.update({ where: { id: inv.id }, data: { quantity: { decrement: qty } } });
});
```

**Cenários que EXIGEM transação:**
- Delete + Create/Update (ex: deletar itens antigos e criar novos)
- Atualizar entidade pai + filhos
- Decrementar estoque + criar movimentação
- Gerar código sequencial + criar registro
- Qualquer operação que envolva consistência entre 2+ tabelas

---

## 🔴 REGRA 2: NUNCA fazer validação fora da transação (TOCTOU)

**Se você lê um registro para validar e depois modifica, a leitura DEVE estar dentro da transação.**

```typescript
// ❌ ERRADO — entre o findFirst e o $transaction, outro request pode mudar o estado
const item = await ctx.prisma.reservation.findFirst({ where: { id, status: "ACTIVE" } });
if (!item) throw new Error("Not found");
await ctx.prisma.$transaction(async (tx) => {
  await tx.reservation.update({ where: { id }, data: { status: "CONSUMED" } });
});

// ✅ CORRETO — leitura e escrita na mesma transação
await ctx.prisma.$transaction(async (tx) => {
  const item = await tx.reservation.findFirst({ where: { id, status: "ACTIVE" } });
  if (!item) throw new Error("Not found");
  await tx.reservation.update({ where: { id }, data: { status: "CONSUMED" } });
});
```

---

## 🔴 REGRA 3: Filtros de data — NUNCA usar spread separado

**Quando `startDate` e `endDate` filtram o MESMO campo, combinar num único objeto.**

```typescript
// ❌ ERRADO — endDate sobrescreve startDate (o spread de endDate substitui createdAt inteiro)
const where = {
  ...(startDate && { createdAt: { gte: new Date(startDate) } }),
  ...(endDate && { createdAt: { lte: new Date(endDate) } }),
};

// ✅ CORRETO — combinar num único objeto createdAt
const where = {
  ...((startDate || endDate) && {
    createdAt: {
      ...(startDate && { gte: new Date(startDate) }),
      ...(endDate && { lte: new Date(endDate) }),
    },
  }),
};
```

**Isso se aplica a QUALQUER campo de data:** `createdAt`, `returnDate`, `dueDate`, `issueDate`, etc.

---

## 🔴 REGRA 4: Lookup de entidades relacionadas SEMPRE com companyId

**Ao buscar uma entidade referenciada (ex: pipeline, customer, supplier), SEMPRE filtrar por `companyId`.**

```typescript
// ❌ ERRADO — permite usar pipeline de outra empresa
const pipeline = await tx.salesPipeline.findUnique({
  where: { id: input.pipelineId },
});

// ✅ CORRETO — garante isolamento de tenant
const pipeline = await tx.salesPipeline.findFirst({
  where: { id: input.pipelineId, companyId },
});
if (!pipeline) throw new Error("Pipeline não encontrado");
```

**Nota:** `findUnique` só aceita campos `@unique`. Para filtrar por `id` + `companyId`, usar `findFirst`.

---

## 🔴 REGRA 5: Geração de código sequencial — usar transação

**O padrão `findFirst(orderBy: code desc) + create(code: lastCode + 1)` DEVE estar dentro de `$transaction`.**

```typescript
// ❌ ERRADO — race condition: dois requests podem gerar o mesmo código
const last = await ctx.prisma.invoice.findFirst({ orderBy: { code: "desc" } });
const nextCode = (last?.code ?? 0) + 1;
await ctx.prisma.invoice.create({ data: { code: nextCode, ... } });

// ✅ CORRETO — transação garante serialização
await ctx.prisma.$transaction(async (tx) => {
  const last = await tx.invoice.findFirst({
    where: { companyId },
    orderBy: { code: "desc" },
    select: { code: true },
  });
  const nextCode = (last?.code ?? 0) + 1;
  return tx.invoice.create({ data: { code: nextCode, companyId, ... } });
});
```

**Futuro (VIO-1091):** Migrar para PostgreSQL sequences para eliminar o problema por completo.

---

## 🟠 REGRA 6: Schema Prisma — checklist para novos modelos

Ao criar um novo modelo Prisma, verificar **TODOS** os itens:

- [ ] `companyId String @map("company_id") @db.Uuid` — obrigatório em modelos de negócio
- [ ] `updatedAt DateTime @default(now()) @updatedAt @map("updated_at")` — **com `@updatedAt`**
- [ ] `@@index([companyId])` — índice de tenant
- [ ] `@@map("table_name")` — nome da tabela em snake_case
- [ ] Relação `company Company @relation(fields: [companyId], references: [id])` declarada
- [ ] `onDelete` e `onUpdate` explícitos em TODAS as relações
- [ ] Não duplicar índices (verificar se já existe `@@index` ou `@@unique` na mesma coluna)
- [ ] Campos sensíveis (password, token, secret) — NUNCA retornar ao client sem redação

---

## 🟠 REGRA 7: Validação de input — usar tipos Zod corretos

```typescript
// ❌ ERRADO — aceita qualquer string, pode gerar Invalid Date
startDate: z.string(),

// ✅ CORRETO — valida e converte automaticamente
startDate: z.coerce.date(),

// ❌ ERRADO — aceita qualquer string para campo enum
operator: z.string(),

// ✅ CORRETO — restringe aos valores válidos
operator: z.enum(["EQUALS", "NOT_EQUALS", "CONTAINS", "GREATER_THAN"]),

// ❌ ERRADO — limit 0 é tratado como falsy
take: options.limit || 100,

// ✅ CORRETO — nullish coalescing preserva 0
take: options.limit ?? 100,
```

---

## 🟠 REGRA 8: Credenciais — NUNCA expor em responses

```typescript
// ❌ ERRADO — retorna password/token em plaintext
return ctx.prisma.nfseConfig.findUnique({ where: { companyId } });

// ✅ CORRETO — redactar campos sensíveis
const config = await ctx.prisma.nfseConfig.findUnique({ where: { companyId } });
if (!config) return null;
return {
  ...config,
  password: config.password ? "••••••••" : null,
  token: config.token ? "••••••••" : null,
};
```

---

## 🔴 REGRA 9: Schema Prisma — TODA mudança EXIGE migration SQL

**NUNCA alterar `prisma/schema/*.prisma` sem aplicar a migration SQL correspondente no banco.**

Este é o bug mais grave já encontrado no projeto: PRs #39 e #43 adicionaram `legacyId`, `deletedAt`, `deletedBy` ao schema Prisma mas **sem migration SQL**. Resultado: testes passaram (usam mocks), CI passou, mas o banco real ficou dessincronizado, causando 500 errors em produção.

```
# ❌ ERRADO — alterar schema sem migration
1. Editar prisma/schema/xxx.prisma (adicionar campo)
2. pnpm prisma generate
3. git commit && git push
# → tsc ✅, vitest ✅, lint ✅, build ✅ — TUDO PASSA
# → Mas o banco real NÃO tem a coluna → 500 error em runtime

# ✅ CORRETO — schema + migration SEMPRE juntos
1. Editar prisma/schema/xxx.prisma (adicionar campo)
2. Aplicar migration via mcp7_apply_migration (ver /db-migration)
3. pnpm prisma generate
4. pnpm test:drift  ← VALIDAR contra o banco real
5. git commit && git push
```

**Checklist obrigatório ao alterar schema:**
- [ ] Novo campo/tabela → `ALTER TABLE` / `CREATE TABLE` aplicado via `/db-migration`
- [ ] Novo index → `CREATE INDEX` aplicado
- [ ] Novo unique constraint → `ALTER TABLE ADD CONSTRAINT` aplicado
- [ ] RLS habilitado em tabelas novas → `ALTER TABLE ENABLE ROW LEVEL SECURITY`
- [ ] `pnpm test:drift` executado e passando (conecta ao banco real)

**Por que os testes unitários NÃO detectam isso:**
- `vitest.setup.ts` mocka `@/lib/prisma` globalmente
- Todos os testes usam `vi.fn()` — nenhum toca o banco real
- `tsc` valida tipos do Prisma Client (gerado), não do banco
- Resultado: drift silencioso que só aparece em runtime

---

## Referências

- VIO-1080 a VIO-1095: Issues criadas no Linear para todos os itens pendentes
- VIO-1091: Race condition sistêmica em nextCode (fix global planejado)
- VIO-1086: @updatedAt faltando em modelos HR/Quality
- VIO-1087: TOCTOU em InventoryService reservations
