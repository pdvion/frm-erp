---
description: Cria uma issue no Linear seguindo padrões do projeto FRM
---

# Skill: Criar Issue Linear

## Parâmetros
- **tipo**: feature, bug, chore, epic
- **titulo**: Título descritivo
- **descricao**: Descrição detalhada em Markdown

## Padrões de Título

### Features
`[FEATURE] Descrição da funcionalidade`

### Bugs
`[BUG] Descrição do problema`

### Épicos
`[ÉPICO] Nome do épico`

### Chores
`[CHORE] Descrição da tarefa`

## Template de Descrição

### Feature
```markdown
## Descrição
Breve descrição da funcionalidade.

## Requisitos
- [ ] Requisito 1
- [ ] Requisito 2

## Critérios de Aceite
- [ ] Critério 1
- [ ] Critério 2

## Arquivos Afetados
- `path/to/file1.ts`
- `path/to/file2.tsx`
```

### Bug
```markdown
## Descrição
O que está acontecendo.

## Passos para Reproduzir
1. Passo 1
2. Passo 2

## Comportamento Esperado
O que deveria acontecer.

## Comportamento Atual
O que está acontecendo.

## Ambiente
- Browser: 
- OS:
```

### Épico
```markdown
## Descrição
Visão geral do épico.

## Módulos/Features
- [ ] Feature 1
- [ ] Feature 2

## Status
- ✅ Concluído
- 🔄 Em progresso
- ⏳ Pendente
```

## Uso do MCP

```typescript
mcp2_create_issue({
  team: "Vion",
  title: "[TIPO] Título",
  description: "Descrição em Markdown",
  project: "POC Delphi FRM - Migração ERP",
  state: "Backlog" | "Todo" | "In Progress" | "Done",
  labels: ["feature", "bug", "chore"],
})
```

## Atualizar Issue Existente

```typescript
mcp2_update_issue({
  id: "VIO-XXX",
  description: "Nova descrição",
  state: "Done",
})
```

## Convenções de Commits

Sempre referenciar a issue no commit:
```
feat(modulo): descrição VIO-XXX
fix(modulo): descrição VIO-XXX
chore: descrição VIO-XXX
```
