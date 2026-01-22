---
description: Validação pré-commit para evitar problemas do CI/CodeRabbit
---

# Workflow: Pre-Commit Check

Execute este workflow **ANTES** de fazer commit para evitar falhas no CI.

## Passos Obrigatórios

### 1. Verificar Lint
// turbo
```bash
pnpm lint
```

### 2. Verificar Tipos TypeScript
// turbo
```bash
pnpm type-check
```

Se houver erros, corrija antes de continuar.

### 3. Verificar Build (opcional mas recomendado)
```bash
pnpm build
```

## Checklist de Erros Comuns

### TypeScript - Campos do Prisma Schema
- [ ] Verificar se campos usados existem no schema (`prisma/schema.prisma`)
- [ ] Usar `ie` em vez de `stateRegistration` para Company
- [ ] Usar `hireDate` em vez de `admissionDate` para Employee
- [ ] Converter `code` (number) para String quando necessário

### TypeScript - tRPC Routers
- [ ] Verificar se métodos chamados existem no router
- [ ] Verificar tipos de retorno (ex: `items` vs array direto)
- [ ] Usar tipos corretos nos inputs do mutation

### TypeScript - Arquivos de Serviço
- [ ] Garantir que arquivos `.ts` têm exports válidos
- [ ] Verificar imports de tipos do Prisma
- [ ] Usar `as const` para literais de tipo

### React/Next.js
- [ ] `"use client"` no topo de componentes com hooks
- [ ] Não usar hooks em Server Components

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

1. Verificar logs do GitHub Actions
2. Executar `pnpm type-check` localmente
3. Corrigir erros e fazer novo commit
4. **NUNCA** fazer push sem passar no type-check local
