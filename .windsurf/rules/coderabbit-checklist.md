---
activation: always_on
description: CodeRabbit Checklist — verificações de segurança, performance e padrões recorrentes
trigger: always_on
---

# CodeRabbit Checklist - Problemas Recorrentes

## Objetivo
Checklist de verificação para evitar problemas identificados pelo CodeRabbit em code reviews anteriores.

## Segurança (CRÍTICO)

### XSS Prevention
- [ ] NUNCA usar `dangerouslySetInnerHTML` sem sanitização
- [ ] Usar bibliotecas como `DOMPurify` se precisar renderizar HTML
- [ ] Preferir componentes React em vez de HTML raw

### Autenticação
- [ ] Validar código MFA (6 dígitos) ANTES de enviar ao servidor
- [ ] Tratar erros de clipboard (navigator.clipboard pode falhar)
- [ ] Usar `aria-labels` em todos os inputs de autenticação

### Dados Sensíveis
- [ ] Nunca logar dados sensíveis (senhas, tokens, PIIs)
- [ ] Usar variáveis de ambiente para secrets
- [ ] Marcar documentos internos como "CONFIDENCIAL"
- [ ] API keys de IA: usar `getOpenAIKey()` de `@/server/services/getAIApiKey`
- [ ] NUNCA buscar tokens diretamente do `systemSettings` — usar o helper centralizado
- [ ] Futuro: migrar secrets para Supabase Vault (`src/server/services/secrets.ts`)

## Tratamento de Erros

### catch(e: unknown) — OBRIGATÓRIO
- [ ] SEMPRE usar `catch (e: unknown)` em vez de `catch (e)` ou `catch (e: any)`
- [ ] Dentro do catch, usar `e instanceof Error ? e.message : String(e)`
- [ ] NUNCA silenciar catches — usar `console.warn()` no mínimo

### Mutations tRPC
- [ ] Sempre incluir `onError` em mutations
- [ ] Mostrar toast/feedback ao usuário em caso de erro
- [ ] Logar erros para debugging

### Queries tRPC
- [ ] Tratar estados de loading, error e empty
- [ ] Usar `isLoading` e `isError` do React Query
- [ ] Mostrar skeleton/loading state adequado

## Acessibilidade (A11y)

### Formulários
- [ ] Todo `<input>` deve ter `<label>` associado (htmlFor/id)
- [ ] Usar `aria-label` quando label visual não for possível
- [ ] Usar `aria-describedby` para mensagens de erro

### Navegação
- [ ] Links devem ter texto descritivo (não "clique aqui")
- [ ] Botões de ícone devem ter `aria-label`
- [ ] Modais devem ter `aria-modal="true"` e `role="dialog"`

### Teclado
- [ ] Elementos interativos devem ser focáveis
- [ ] Usar `onKeyDown` para Enter/Space em elementos clicáveis
- [ ] Manter ordem de foco lógica

## Performance

### Queries Prisma
- [ ] Usar `select` para limitar campos retornados
- [ ] Usar `include` apenas quando necessário
- [ ] Evitar N+1 queries (usar `include` em vez de queries separadas)

### React
- [ ] Usar `useMemo` para cálculos pesados
- [ ] Usar `useCallback` para funções passadas como props
- [ ] Evitar re-renders desnecessários

## TypeScript

### Tipos
- [ ] NUNCA usar `any` - sempre tipos explícitos
- [ ] Usar `unknown` em vez de `any` quando tipo é desconhecido
- [ ] Importar tipos do Prisma Client quando necessário

### Null Safety
- [ ] Usar optional chaining (`?.`) para acessos seguros
- [ ] Usar nullish coalescing (`??`) para defaults
- [ ] Verificar arrays antes de `.map()` ou `.filter()`

## Multi-Tenant

### Queries
- [ ] SEMPRE filtrar por `companyId` em queries de dados
- [ ] Usar `tenantProcedure` em vez de `publicProcedure`
- [ ] Incluir `companyId` ao criar novos registros
- [ ] `companyId` é NOT NULL (Schema v1) — não usar `String?`

### IDOR Prevention (CRÍTICO)
- [ ] Em updates/deletes, SEMPRE verificar `companyId` antes de operar
- [ ] Usar `findFirst({ where: { id, companyId } })` antes de `update/delete`
- [ ] NUNCA confiar apenas no `id` do input — validar ownership

### Dados Compartilhados
- [ ] Usar `isShared: true` para dados visíveis a todas as empresas
- [ ] Filtro deve incluir: `OR: [{ companyId }, { isShared: true }]`

## Tipos Numéricos (Decimal)

### Decimal → Number
- [ ] Prisma retorna `Decimal` (objeto), não `number`
- [ ] SEMPRE converter com `Number(value)` antes de operações matemáticas
- [ ] `Number(x) ?? 0` é BUG — `Number()` nunca retorna null. Usar `Number(x ?? 0)`
- [ ] `value.toFixed(2)` → `Number(value).toFixed(2)` para Decimals
- [ ] Comparações: `Number(a) > Number(b)`, não `a > b` (string comparison)

## Design System / Cores

### Theme Tokens
- [ ] Usar theme tokens (`bg-theme-card`, `text-theme`, `border-theme`) em vez de cores hardcoded
- [ ] NUNCA usar cores dark-only sem par light (ex: `bg-green-900/50 text-green-400`)
- [ ] Badges: usar `<Badge variant="...">` ou `<StatusBadge status="...">` do DS
- [ ] NUNCA usar `<span className="bg-green-100 text-green-800...">` para status
- [ ] 13 variantes de Badge: default, success, warning, error, info, purple, orange, cyan, pink, indigo, emerald, amber, rose + outline
- [ ] Mensagens de erro: usar `<Alert variant="error">` do DS
- [ ] Testar visual no tema claro E escuro
- [ ] Usar `Button` com `variant` explícito (default é `primary` = fundo azul)
- [ ] Para icon buttons em tabelas: usar `variant="ghost" size="icon"`

## Código Limpo

### Imports
- [ ] Imports sempre no topo do arquivo
- [ ] Remover imports não utilizados
- [ ] Usar `@/` para imports absolutos

### Comentários
- [ ] Não adicionar comentários óbvios
- [ ] Documentar lógica complexa
- [ ] Manter TODOs com contexto

## Testes (OBRIGATÓRIO)

### Backend
- [ ] ALWAYS run related unit tests after modifying backend logic
- [ ] Rodar `pnpm test` para testes unitários do módulo alterado
- [ ] Verificar cobertura de testes para novas funções

### Frontend
- [ ] Run strict linting after modifying UI components
- [ ] Rodar `pnpm lint` e `pnpm type-check` após alterações
- [ ] Para alterações críticas de UI, rodar testes E2E relacionados

### E2E
- [ ] Rodar testes E2E específicos para fluxos alterados
- [ ] Comando: `npx playwright test tests/e2e/<spec>.spec.ts`
- [ ] Verificar que testes passam antes de commit

## Antes de Commit

```bash
# Verificar lint
pnpm lint

# Verificar tipos
pnpm type-check

# Rodar testes unitários (se houver)
pnpm test

# Verificar build
pnpm build
```

## Referências
- Issues VIO-476 a VIO-493: Correções CodeRabbit PR #1
- Issues VIO-538 a VIO-542: Correções CodeRabbit PR #2
- Issues VIO-1039: Badge DS migration
- Issues VIO-1046: Schema v1 Fase 3 (indexes, legacyId, softDelete)
- Issues VIO-1051–1058: Security audit (IDOR, XSS, CSRF, catch typing)
