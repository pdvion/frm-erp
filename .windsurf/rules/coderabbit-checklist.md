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

## Tratamento de Erros

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

### Dados Compartilhados
- [ ] Usar `isShared: true` para dados visíveis a todas empresas
- [ ] Filtro deve incluir: `OR: [{ companyId }, { isShared: true }]`

## Código Limpo

### Imports
- [ ] Imports sempre no topo do arquivo
- [ ] Remover imports não utilizados
- [ ] Usar `@/` para imports absolutos

### Comentários
- [ ] Não adicionar comentários óbvios
- [ ] Documentar lógica complexa
- [ ] Manter TODOs com contexto

## Antes de Commit

```bash
# Verificar lint
pnpm lint

# Verificar tipos
pnpm type-check

# Verificar build
pnpm build
```

## Referências
- Issues VIO-476 a VIO-493: Correções CodeRabbit PR #1
- Issues VIO-538 a VIO-542: Correções CodeRabbit PR #2
