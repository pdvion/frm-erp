# Relatório de Testes - 22/01/2026

## 1. Testes E2E Playwright

### Resultado Geral
- **Total**: 67 testes
- **Passou**: 62 testes ✅
- **Falhou**: 5 testes ❌

### Testes que Falharam

| Teste | Arquivo | Motivo |
|-------|---------|--------|
| deve exibir formulários em layout vertical | mobile.spec.ts:150 | Layout de formulário não está em coluna única em mobile |
| deve ter formulários em 2 colunas | mobile.spec.ts:325 | Layout de formulário em tablet não está em 2 colunas |
| deve exibir seletor de empresa no header | multi-tenant.spec.ts:12 | Timeout - seletor não encontrado |
| deve usar filtros e manter estado na URL | navigation.spec.ts:126 | Filtros não persistem na URL |
| deve navegar entre abas em página de detalhes | navigation.spec.ts:103 | Abas não encontradas |

### Erros de WebServer
```
Error: aborted (ECONNRESET)
```
Ocorreu durante execução de alguns testes, mas não afetou o resultado final.

---

## 2. Supabase Advisors

### Segurança (WARN) - 36 políticas RLS permissivas

Tabelas com políticas `USING (true)` ou `WITH CHECK (true)`:
- `employee_schedules` (INSERT, UPDATE, DELETE)
- `holidays` (INSERT, UPDATE, DELETE)
- `hours_bank` (INSERT, UPDATE, DELETE)
- `sefaz_manifestacao_logs` (INSERT, UPDATE, DELETE)
- `time_clock_adjustments` (INSERT, UPDATE, DELETE)
- `vacations` (INSERT, UPDATE, DELETE)
- `work_schedules` (INSERT, UPDATE, DELETE)
- `work_shifts` (INSERT, UPDATE, DELETE)

**Nota**: Isso é intencional pois a autenticação é feita via tRPC/Prisma com `tenantProcedure`. Ver issue VIO-563.

### Performance (INFO) - ~60 índices não utilizados

Índices criados mas ainda não utilizados (esperado em sistema novo):
- `audit_logs_*` (3 índices)
- `received_invoices_*` (4 índices)
- `purchase_order_items_*` (2 índices)
- E outros...

**Ação**: Reavaliar após 30 dias de uso em produção (VIO-562).

---

## 3. Testes Browser Produção (frm-erp.vercel.app)

### Responsividade

| Viewport | Largura | Status | Observações |
|----------|---------|--------|-------------|
| Mobile (iPhone SE) | 375px | ✅ OK | Dashboard e tabelas responsivas |
| Tablet (iPad) | 768px | ✅ OK | Layout intermediário funcional |
| Desktop | 1280px | ✅ OK | Todas as colunas visíveis |

### Páginas Testadas

| Página | URL | Status | Observações |
|--------|-----|--------|-------------|
| Dashboard | /dashboard | ✅ OK | Cards e módulos carregam corretamente |
| Materiais | /materials | ✅ OK | Tabela responsiva, busca funciona |
| Produção | /production | ✅ OK | Links para MRP, MES, OEE funcionam |
| Financeiro | /payables | ✅ OK | Cards de resumo carregam |
| RH | /hr/employees | ⚠️ WARN | Erro 404 no console (RSC) |

### Erros de Console

```
[ERROR] Failed to load resource: 404 @ /hr/employees/new?_rsc=pttiq:0
```

**Causa**: Possível problema com React Server Components (RSC) na página de novo funcionário.

### Performance

- **Tempo de carregamento inicial**: ~2-3s (aceitável)
- **Navegação entre páginas**: ~1s (bom)
- **Carregamento de dados**: ~1-2s (aceitável)

---

## 4. Bugs Encontrados

### BUG-001: Erro 404 em /hr/employees/new (RSC)
- **Severidade**: Média
- **Página**: /hr/employees
- **Descrição**: Erro 404 no console ao acessar página de funcionários
- **Impacto**: Pode afetar criação de novos funcionários

### BUG-002: Formulários não responsivos em mobile
- **Severidade**: Baixa
- **Página**: Formulários de criação/edição
- **Descrição**: Layout não muda para coluna única em mobile
- **Impacto**: UX em dispositivos móveis

### BUG-003: Filtros não persistem na URL
- **Severidade**: Baixa
- **Página**: Listagens com filtros
- **Descrição**: Ao aplicar filtros, estado não é salvo na URL
- **Impacto**: Não é possível compartilhar links filtrados

### BUG-004: Abas não encontradas em detalhes
- **Severidade**: Baixa
- **Página**: Páginas de detalhes
- **Descrição**: Navegação entre abas não funciona como esperado
- **Impacto**: UX em páginas de detalhes

---

## 5. Melhorias Sugeridas

### Alta Prioridade
1. Corrigir erro 404 em /hr/employees/new
2. Implementar persistência de filtros na URL

### Média Prioridade
3. Melhorar layout de formulários em mobile
4. Adicionar navegação por abas em páginas de detalhes

### Baixa Prioridade
5. Otimizar índices não utilizados (após 30 dias)
6. Implementar RLS restritivo (se necessário acesso direto ao DB)

---

## 6. Próximos Passos

1. ✅ Testes E2E executados
2. ✅ Supabase advisors verificados
3. ✅ Testes browser em produção
4. ⏳ Corrigir bugs encontrados
5. ⏳ VIO-568: Manifestação do Destinatário
6. ⏳ VIO-569: Devolução a Fornecedor
7. ⏳ VIO-571: Régua de Cobrança
