---
description: Expandir campos de um módulo baseado no sistema Delphi
---

# Workflow: Expandir Campos de Módulo

## Pré-requisitos
- Consultar `docs/analise-campos-delphi.md` para ver campos faltantes
- Verificar issue correspondente no Linear (VIO-639 a VIO-646)

## Passos

### 1. Identificar Campos
```bash
# Consultar documento de análise
cat docs/analise-campos-delphi.md | grep -A 50 "MÓDULO_NOME"
```

### 2. Atualizar Schema Prisma
```prisma
// prisma/schema.prisma
model NomeModelo {
  // Adicionar novos campos aqui
  novoCampo String?
}
```

### 3. Criar Migration
// turbo
```bash
# Usar Supabase MCP para criar migration
# mcp7_apply_migration com nome descritivo
```

### 4. Gerar Cliente Prisma
// turbo
```bash
pnpm prisma generate
```

### 5. Atualizar Router tRPC
```typescript
// src/server/routers/[modulo].ts
// Adicionar campos no input Zod de create e update
```

### 6. Atualizar Páginas Frontend

#### 6.1 Formulário de Criação
- `src/app/[modulo]/new/page.tsx`
- Adicionar campos na interface
- Adicionar campos no estado inicial
- Adicionar campos na mutation
- Adicionar campos no JSX

#### 6.2 Formulário de Edição
- `src/app/[modulo]/[id]/edit/page.tsx`
- Adicionar campos na interface
- Adicionar campos no useEffect de carregamento
- Adicionar campos na mutation
- Adicionar campos no JSX

#### 6.3 Página de Detalhes
- `src/app/[modulo]/[id]/page.tsx`
- Adicionar exibição dos novos campos

### 7. Validar CI
// turbo
```bash
pnpm type-check && pnpm lint && pnpm build
```

### 8. Commit e Push
```bash
git add -A
git commit -m "feat([modulo]): VIO-XXX adicionar campos [descrição]"
git push origin main
```

### 9. Atualizar Linear
- Marcar issue como Done
- Adicionar comentário com resumo das alterações

## Referências
- Análise completa: `docs/analise-campos-delphi.md`
- Issue principal: VIO-638
- Regra de sincronização: Memory ID e29912c3-8fbb-4866-9d0b-6fb4bb313891
