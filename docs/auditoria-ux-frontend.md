# Auditoria de UX/UI - FRM ERP

**Data:** 24/01/2026  
**Versão:** 1.0

## Resumo Executivo

Esta auditoria identifica problemas de UX/UI no sistema FRM ERP e propõe melhorias baseadas em boas práticas de design.

---

## 1. Problemas Identificados

### 1.1 URLs Não Amigáveis ❌

**Problema:** URLs com UUIDs expostos são confusas para usuários.

```
❌ /hr/employees/b6f3f452-7453-475d-be73-428639ebd97e
❌ /materials/a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

**Solução:** Implementar slugs ou códigos amigáveis.

```
✅ /hr/employees/123 (código do funcionário)
✅ /materials/MAT-001 (código do material)
```

### 1.2 Inconsistência de Padrões Visuais ❌

**Problemas encontrados:**
- Algumas páginas usam `PageHeader` do componente, outras criam headers customizados
- Cores de botões primários variam: `bg-blue-600`, `bg-purple-600`, `bg-green-600`
- Espaçamentos inconsistentes entre páginas
- Alguns inputs não têm `min-height: 44px` (padrão mobile)

**Páginas com headers customizados (não padronizados):**
- `/hr/employees/page.tsx` - header inline
- Várias outras páginas

### 1.3 Formulários Complexos sem Wizard ❌

**Problema:** Cadastro de materiais tem 5 abas com muitos campos, mas:
- Não indica quais campos são obrigatórios em cada aba
- Não valida antes de salvar
- Usuário pode salvar sem preencher campos obrigatórios em outras abas
- Não há indicação de progresso

**Recomendação:** Implementar Wizard para cadastros complexos com:
- Indicador de progresso
- Validação por etapa
- Campos obrigatórios destacados
- Resumo antes de salvar

### 1.4 Falta de Feedback Visual ❌

**Problemas:**
- Loading states inconsistentes
- Toasts não padronizados
- Falta confirmação visual após ações
- Estados vazios sem ilustrações

### 1.5 Contraste e Acessibilidade ❌

**Problemas:**
- Texto `text-theme-muted` pode ter contraste insuficiente
- Alguns botões não têm estados de foco visíveis
- Falta de `aria-labels` em alguns elementos interativos
- Skip links não implementados globalmente

### 1.6 Responsividade ❌

**Problemas:**
- Tabelas não têm scroll horizontal em mobile
- Alguns formulários quebram em telas pequenas
- Menu lateral não colapsa adequadamente

### 1.7 Navegação e Breadcrumbs ❌

**Problemas:**
- Breadcrumbs não implementados globalmente
- Usuário se perde em páginas profundas
- Botão "Voltar" inconsistente

---

## 2. Boas Práticas de UX a Implementar

### 2.1 Hierarquia Visual
- [ ] Títulos claros e consistentes
- [ ] Espaçamento padronizado (8px grid)
- [ ] Cores semânticas consistentes

### 2.2 Feedback ao Usuário
- [ ] Loading skeletons em vez de spinners
- [ ] Toasts para todas as ações
- [ ] Confirmação antes de ações destrutivas
- [ ] Estados vazios informativos

### 2.3 Formulários
- [ ] Labels sempre visíveis (não só placeholder)
- [ ] Indicação clara de campos obrigatórios
- [ ] Validação em tempo real
- [ ] Mensagens de erro claras e próximas ao campo
- [ ] Auto-save em formulários longos

### 2.4 Navegação
- [ ] Breadcrumbs em todas as páginas
- [ ] URLs amigáveis
- [ ] Histórico de navegação
- [ ] Atalhos de teclado

### 2.5 Acessibilidade (WCAG 2.1)
- [ ] Contraste mínimo 4.5:1 para texto
- [ ] Foco visível em todos elementos interativos
- [ ] Navegação por teclado
- [ ] Screen reader friendly

---

## 3. Plano de Ação

### Fase 1: Padronização Global (Prioridade Alta)
1. Criar sistema de design tokens
2. Padronizar componentes de formulário
3. Implementar breadcrumbs global
4. Corrigir contrastes

### Fase 2: Melhorias de UX (Prioridade Média)
1. Implementar Wizard para cadastros complexos
2. URLs amigáveis
3. Loading skeletons
4. Estados vazios

### Fase 3: Acessibilidade (Prioridade Média)
1. Auditoria WCAG
2. Implementar skip links
3. Melhorar navegação por teclado

---

## 4. Componentes a Criar/Melhorar

### 4.1 Novos Componentes
- `Breadcrumbs` - navegação hierárquica
- `Wizard` - formulários multi-etapa
- `Skeleton` - loading states
- `EmptyState` - estados vazios
- `ConfirmDialog` - confirmações

### 4.2 Componentes a Melhorar
- `PageHeader` - adicionar breadcrumbs
- `Input` - melhorar acessibilidade
- `Button` - padronizar cores
- `Table` - melhorar responsividade

---

## 5. Métricas de Sucesso

- [ ] 100% das páginas com breadcrumbs
- [ ] 0 erros de contraste (WCAG AA)
- [ ] Tempo médio de cadastro reduzido em 30%
- [ ] NPS de usabilidade > 8

---

## Anexo: Checklist de UX por Módulo

### Materiais
- [ ] Wizard de cadastro
- [ ] Campos obrigatórios destacados
- [ ] Validação por etapa
- [ ] URL amigável `/materials/MAT-001`

### Funcionários
- [ ] URL amigável `/hr/employees/123`
- [ ] Breadcrumbs
- [ ] Header padronizado

### Fornecedores
- [ ] URL amigável `/suppliers/FOR-001`
- [ ] Breadcrumbs
- [ ] Estados vazios

### Pedidos de Compra
- [ ] Wizard de criação
- [ ] Timeline de status
- [ ] Notificações de aprovação
