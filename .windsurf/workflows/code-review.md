---
description: Processo de Code Review e criação de PRs
---

# Workflow: Code Review

## Quando Usar
- Antes de fazer merge de branches
- Para solicitar review do CodeRabbit
- Para validar código antes de produção

## Passo 1: Preparar Branch para PR

```bash
# Garantir que está atualizado com main
git fetch origin
git rebase origin/main

# Executar validações
pnpm type-check && pnpm lint && pnpm test:run
```

## Passo 2: Criar Pull Request

### Título (Conventional Commits)
```
feat(module): VIO-XXX descrição curta
fix(module): VIO-XXX correção de bug
chore(module): VIO-XXX manutenção
```

### Corpo do PR
```markdown
## Objetivo
Breve descrição do que foi feito.

## Mudanças
- Item 1
- Item 2

## Validação
- [ ] `pnpm type-check` - 0 erros
- [ ] `pnpm lint` - 0 erros
- [ ] `pnpm test:run` - testes passando

## Linear
- [VIO-XXX](https://linear.app/vion/issue/VIO-XXX)
```

## Passo 3: CodeRabbit Review

O CodeRabbit faz review automático em PRs para branches:
- `main`
- `develop`
- `develop-base`

### Configuração (.coderabbit.yaml)
```yaml
reviews:
  auto_review:
    enabled: true
    base_branches:
      - main
      - develop
      - develop-base
```

### Aguardar Review
1. CodeRabbit adiciona comentários em ~2-5 minutos
2. Verificar "Summary by CodeRabbit" no PR
3. Responder comentários se necessário

## Passo 4: Corrigir Feedback

### Categorias de Feedback
| Tipo | Ação |
|------|------|
| 🔴 Critical | Corrigir obrigatoriamente |
| 🟠 Warning | Avaliar e corrigir se relevante |
| 🟡 Suggestion | Opcional, mas recomendado |
| 🔵 Nitpick | Opcional |

### Após Correções
```bash
git add -A
git commit -m "fix: address code review feedback"
git push
```

## Passo 5: Merge

### Pré-requisitos
- [ ] CI passou (type-check, lint, tests)
- [ ] CodeRabbit review concluído
- [ ] Feedback crítico resolvido

### Merge
```bash
# Via GitHub UI ou:
git checkout main
git merge --squash feature/branch
git commit -m "feat(module): VIO-XXX descrição"
git push origin main
```

## Checklist Rápido

- [ ] Branch atualizada com main
- [ ] `pnpm type-check` passa
- [ ] `pnpm lint` passa
- [ ] `pnpm test:run` passa
- [ ] PR criado com título correto
- [ ] Linear issue referenciada
- [ ] CodeRabbit review concluído
- [ ] Feedback crítico resolvido

## PRs Pendentes

Para listar PRs abertos:
```bash
gh pr list --state open
```

Ou via Linear MCP:
```
mcp1_list_pull_requests(owner: "pdvion", repo: "frm-erp", state: "open")
```
