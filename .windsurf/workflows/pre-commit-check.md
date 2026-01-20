---
description: Validação pré-commit para evitar problemas do CodeRabbit
---

# Workflow: Pre-Commit Check

Execute este workflow antes de fazer commit para evitar problemas recorrentes.

## Passos

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

### 3. Verificar Build
```bash
pnpm build
```

### 4. Revisar Checklist de Segurança

Antes de commitar, verifique:

- [ ] Não há `dangerouslySetInnerHTML` sem sanitização
- [ ] Não há `any` no código TypeScript
- [ ] Todas as mutations tRPC têm `onError`
- [ ] Inputs têm labels ou aria-labels
- [ ] Queries filtram por `companyId` (multi-tenant)

### 5. Commit com Conventional Commits

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
- `test` - testes

### 6. Push

```bash
git push origin main
```
