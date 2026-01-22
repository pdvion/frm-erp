---
description: Validação pré-commit para evitar problemas do CI/CodeRabbit
---

# Workflow: Pre-Commit Check

Execute este workflow **ANTES** de fazer commit para evitar falhas no CI.

## ⚠️ REGRA OBRIGATÓRIA

**NUNCA fazer push sem executar os 3 comandos abaixo e todos passarem:**

```bash
pnpm type-check && pnpm lint && pnpm build
```

## Passos Obrigatórios

### 1. Verificar Tipos TypeScript
// turbo
```bash
pnpm type-check
```

### 2. Verificar Lint
// turbo
```bash
pnpm lint
```

### 3. Verificar Build
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
- [ ] Usar `_` prefix para variáveis intencionalmente não usadas
- [ ] Não usar `console.log` em produção (usar logger)

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
   pnpm type-check && pnpm lint && pnpm build
   ```
3. Corrigir TODOS os erros
4. Fazer novo commit com fix
5. Verificar novamente antes do push
