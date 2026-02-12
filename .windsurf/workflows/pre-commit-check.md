---
description: Validação pré-commit para evitar problemas do CI/CodeRabbit
---

# Workflow: Pre-Commit Check

Execute este workflow **ANTES** de fazer commit para evitar falhas no CI.

## ⚠️ REGRA OBRIGATÓRIA

**NUNCA fazer push sem executar os 4 comandos abaixo e todos passarem:**

```bash
NODE_OPTIONS="--max-old-space-size=4096" npx tsc --noEmit && pnpm lint && npx vitest run && pnpm build
```

> **Nota:** O schema Prisma é grande (~6000+ linhas), por isso o `tsc` precisa de `--max-old-space-size=4096`.

Se você alterou testes/configuração de testes/áreas críticas (ex.: `src/lib`, `src/server`), execute também:

```bash
pnpm test:coverage
```

## ⚠️ APÓS MUDANÇAS NO SCHEMA PRISMA

Se você alterou `prisma/schema/*.prisma`, execute OBRIGATORIAMENTE:

```bash
# 1. Aplicar migration SQL no banco (ver /db-migration)
#    NUNCA alterar schema sem migration — ver REGRA 9 em /code-quality-rules

# 2. Regenerar cliente Prisma
pnpm prisma generate

# 3. Verificar tipos em TODO o projeto (não apenas arquivos alterados)
pnpm type-check

# 4. Validar schema contra o banco real (detecta drift)
pnpm test:drift
```

**Por que isso é crítico?**
- Mudanças no schema podem quebrar código em arquivos NÃO modificados
- Testes unitários usam mocks e NÃO detectam erros de tipo do Prisma
- **`pnpm test:drift` é o ÚNICO gate que conecta ao banco real** — sem ele, drift passa silenciosamente
- O CI pode passar mas o código em produção pode ter comportamento inesperado

## Passos Obrigatórios

### 1. Verificar Tipos TypeScript
// turbo
```bash
NODE_OPTIONS="--max-old-space-size=4096" npx tsc --noEmit
```

### 2. Verificar Lint
// turbo
```bash
pnpm lint
```

### 3. Executar Testes
// turbo
```bash
npx vitest run
```

### 4. Verificar Build
// turbo
```bash
pnpm build
```

Se QUALQUER comando falhar, **NÃO FAÇA COMMIT**. Corrija os erros primeiro.

## Checklist de Erros Comuns

### TypeScript - Campos do Prisma Schema
- [ ] Verificar se campos usados existem no schema (`prisma/schema.prisma`)
- [ ] Usar `ie` em vez de `stateRegistration` para Company
- [ ] Usar `hireDate` em vez de `admissionDate` para Employee
- [ ] Converter `code` (number) para String quando necessário
- [ ] Após mudanças no schema: `pnpm prisma generate`
- [ ] **NUNCA usar snake_case direto** - sempre camelCase + `@map("snake_case")`
- [ ] Verificar convenções: `/prisma-conventions`

### Prisma Schema - Validação Obrigatória
Antes de commitar mudanças no schema, verificar campos snake_case sem @map:
// turbo
```bash
grep -E "^\s+[a-z]+_[a-z]+\s+\w+" prisma/schema.prisma | grep -v "@map" | head -10
```
Se retornar resultados, corrigir para camelCase + @map antes de commitar.

### TypeScript - tRPC Routers
- [ ] Verificar se métodos chamados existem no router
- [ ] Verificar tipos de retorno (ex: `items` vs array direto)
- [ ] Usar tipos corretos nos inputs do mutation
- [ ] Usar `mode: "insensitive" as const` em buscas case-insensitive

### TypeScript - Imports
- [ ] Imports sempre no topo do arquivo
- [ ] Não importar bibliotecas no meio do código
- [ ] Verificar se imports de tipos do Prisma estão corretos
- [ ] Usar `import type` para tipos quando possível

### TypeScript - Tipos
- [ ] NUNCA usar `any` - sempre tipos explícitos
- [ ] Usar `as const` para literais de tipo
- [ ] Converter null para undefined: `value ?? undefined`
- [ ] Cast para Prisma.InputJsonValue quando necessário

### React/Next.js
- [ ] `"use client"` no topo de componentes com hooks
- [ ] Não usar hooks em Server Components
- [ ] Usar Suspense para componentes que usam useSearchParams

### ESLint
- [ ] Não deixar variáveis não utilizadas
- [ ] Não usar `console.log` em produção (usar logger)
- [ ] Executar `pnpm lint --fix` para corrigir indentação automaticamente

### Multi-Tenant
- [ ] SEMPRE filtrar por `companyId` em queries de dados
- [ ] Usar `tenantProcedure` em vez de `publicProcedure`
- [ ] Usar `ctx.tenant.companyId!` (NÃO `ctx.companyId` — deprecated)
- [ ] `tenantFilter()` está deprecated — usar `companyId` direto no where
- [ ] Incluir `companyId` ao criar novos registros
- [ ] `companyId` é NOT NULL (Schema v1) — não usar `String?`

### Design System
- [ ] Usar componentes de `src/components/ui/` (Button, Card, etc.)
- [ ] Incluir classes dark mode em todos os elementos
- [ ] Usar PageHeader para cabeçalhos de página
- [ ] Ícones sempre do Lucide

## Erros Frequentes e Soluções

### Erro: "Module has no exported member 'X'"
```bash
pnpm prisma generate
```

### Erro: "Type 'null' is not assignable to type 'string | undefined'"
```typescript
// ERRADO
userId: ctx.tenant.userId,

// CORRETO
userId: ctx.tenant.userId ?? undefined,
```

### Erro: "Type 'Record<string, unknown>' is not assignable to type 'InputJsonValue'"
```typescript
import { Prisma } from "@prisma/client";

// CORRETO
oldValues: oldValues as Prisma.InputJsonValue ?? undefined,
```

### Erro: "Argument of type 'string' is not assignable to parameter of type '...'"
```typescript
// ERRADO
{ contains: search, mode: "insensitive" }

// CORRETO
{ contains: search, mode: "insensitive" as const }
```

### Erro: "Argument of type 'Decimal' is not assignable to parameter of type 'number'"
```typescript
// ERRADO - Prisma retorna Decimal, não number
formatCurrency(invoice.totalValue)

// CORRETO - Converter para Number
formatCurrency(Number(invoice.totalValue))
```

### Erro: "Type 'X | null' cannot be used as an index type"
```typescript
// ERRADO
const config = statusConfig[item.status];

// CORRETO - Type assertion
const config = statusConfig[item.status as keyof typeof statusConfig];
```

### Erro: "Type 'boolean | null' is not assignable to type 'boolean'"
```typescript
// ERRADO
checked={pref.isActive}

// CORRETO - Null coalescing
checked={pref.isActive ?? false}
```

## Commit com Conventional Commits

```bash
git add -A
git commit -m "tipo(escopo): VIO-XXX descrição"
```

Tipos válidos:
- `feat` - nova funcionalidade
- `fix` - correção de bug
- `docs` - documentação
- `chore` - manutenção
- `refactor` - refatoração

## Push

```bash
git push origin main
```

## Se o CI Falhar

1. **NÃO faça mais commits** até resolver
2. Executar localmente:
   ```bash
   NODE_OPTIONS="--max-old-space-size=4096" npx tsc --noEmit && pnpm lint && npx vitest run && pnpm build
   ```
3. Corrigir TODOS os erros
4. Fazer novo commit com fix
5. Verificar novamente antes do push
