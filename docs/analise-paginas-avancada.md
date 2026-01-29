# Análise Avançada de Páginas - FRM ERP

## Resumo Executivo

- **Total de páginas**: 245
- **Páginas Placeholder**: 11
- **Páginas Funcionais**: 234

## Páginas Placeholder (Requerem Implementação)

| Página | Módulo | Prioridade | Justificativa |
|--------|--------|------------|---------------|
| `/settings/email-integration` | Settings | Alta | Integração de email para importação automática de NFes |
| `/locations/new` | Estoque | Alta | Cadastro de localizações é essencial para WMS |
| `/hr/vacations/new` | RH | Média | Solicitação de férias pelos funcionários |
| `/hr/terminations/new` | RH | Média | Processo de desligamento |
| `/hr/timeclock/schedules` | RH | Média | Escalas de trabalho |
| `/hr/timesheet/register` | RH | Média | Registro de ponto |
| `/payables/boletos/new` | Financeiro | Alta | Geração de boletos é crítico |
| `/bi/sales` | BI | Baixa | Dashboard de vendas |
| `/bi/production` | BI | Baixa | Dashboard de produção |
| `/bi/reports` | BI | Baixa | Relatórios gerenciais |
| `/treasury/accounts/new` | Tesouraria | Alta | Cadastro de contas bancárias |

## Análise por Módulo

### 1. COMPRAS (Materials, Suppliers, Quotes, POs, Receiving)
**Status**: ✅ Completo

| Funcionalidade | Tem | Deve Ter | Status |
|----------------|-----|----------|--------|
| CRUD Materiais | ✅ | ✅ | OK |
| CRUD Fornecedores | ✅ | ✅ | OK |
| Cotações com comparação | ✅ | ✅ | OK |
| Pedidos de Compra | ✅ | ✅ | OK |
| Recebimento | ✅ | ✅ | OK |
| Exportação Excel/PDF | ❌ | ✅ | **FALTA** |
| Filtros avançados salvos | ❌ | ✅ | **FALTA** |

### 2. ESTOQUE (Inventory, Locations, Transfers)
**Status**: ⚠️ Parcial

| Funcionalidade | Tem | Deve Ter | Status |
|----------------|-----|----------|--------|
| Listagem de estoque | ✅ | ✅ | OK |
| Movimentações | ✅ | ✅ | OK |
| Entrada/Saída | ✅ | ✅ | OK |
| Reservas | ✅ | ✅ | OK |
| Nova Localização | ❌ | ✅ | **PLACEHOLDER** |
| Dashboard estoque | ✅ | ✅ | OK |

### 3. FINANCEIRO (Payables, Receivables, Treasury)
**Status**: ⚠️ Parcial

| Funcionalidade | Tem | Deve Ter | Status |
|----------------|-----|----------|--------|
| Contas a Pagar | ✅ | ✅ | OK |
| Contas a Receber | ✅ | ✅ | OK |
| Fluxo de Caixa | ✅ | ✅ | OK |
| CNAB | ✅ | ✅ | OK |
| PIX | ✅ | ✅ | OK |
| Novo Boleto | ❌ | ✅ | **PLACEHOLDER** |
| Nova Conta Bancária | ❌ | ✅ | **PLACEHOLDER** |
| Conciliação bancária | ❌ | ✅ | **FALTA** |

### 4. RH (Employees, Payroll, Timeclock)
**Status**: ⚠️ Parcial

| Funcionalidade | Tem | Deve Ter | Status |
|----------------|-----|----------|--------|
| Funcionários | ✅ | ✅ | OK |
| Folha de Pagamento | ✅ | ✅ | OK |
| Ponto Eletrônico | ⚠️ | ✅ | Parcial |
| Férias | ⚠️ | ✅ | Falta /new |
| Rescisões | ⚠️ | ✅ | Falta /new |
| Escalas | ❌ | ✅ | **PLACEHOLDER** |
| Registro de Ponto | ❌ | ✅ | **PLACEHOLDER** |

### 5. CONFIGURAÇÕES (Settings)
**Status**: ⚠️ Parcial

| Funcionalidade | Tem | Deve Ter | Status |
|----------------|-----|----------|--------|
| Empresas | ✅ | ✅ | OK |
| Usuários | ✅ | ✅ | OK |
| Contas Bancárias | ✅ | ✅ | OK |
| SEFAZ | ✅ | ✅ | OK |
| IA Tokens | ✅ | ✅ | OK |
| Notificações | ✅ | ✅ | OK |
| Integração Email | ❌ | ✅ | **PLACEHOLDER** |

### 6. BI (Business Intelligence)
**Status**: ⚠️ Parcial

| Funcionalidade | Tem | Deve Ter | Status |
|----------------|-----|----------|--------|
| Dashboard Principal | ✅ | ✅ | OK |
| KPIs | ✅ | ✅ | OK |
| Analytics | ✅ | ✅ | OK |
| Financeiro | ✅ | ✅ | OK |
| Estoque | ✅ | ✅ | OK |
| Vendas | ❌ | ✅ | **PLACEHOLDER** |
| Produção | ❌ | ✅ | **PLACEHOLDER** |
| Relatórios | ❌ | ✅ | **PLACEHOLDER** |

## Funcionalidades Globais Faltantes

### 1. Exportação de Dados
**Prioridade**: Alta
- Exportar para Excel (.xlsx)
- Exportar para PDF
- Componente `ExportButtons` existe mas não está implementado em todas as páginas

### 2. Filtros Avançados com Salvamento
**Prioridade**: Média
- Salvar filtros favoritos
- Carregar filtros salvos
- Componente `AdvancedFilters` existe mas não está implementado

### 3. Impressão Otimizada
**Prioridade**: Média
- CSS de impressão
- Layout específico para impressão
- Ocultar elementos não imprimíveis

### 4. Atalhos de Teclado
**Prioridade**: Baixa
- Ctrl+N para novo
- Ctrl+S para salvar
- Esc para cancelar

### 5. Tour/Onboarding
**Prioridade**: Baixa
- Tour guiado para novos usuários
- Dicas contextuais

## Plano de Implementação

### Fase 1 - Placeholders Críticos (Alta Prioridade)
1. `/settings/email-integration` - Integração de email
2. `/locations/new` - Nova localização
3. `/payables/boletos/new` - Novo boleto
4. `/treasury/accounts/new` - Nova conta bancária

### Fase 2 - Placeholders RH (Média Prioridade)
5. `/hr/vacations/new` - Nova solicitação de férias
6. `/hr/terminations/new` - Nova rescisão
7. `/hr/timeclock/schedules` - Escalas de trabalho
8. `/hr/timesheet/register` - Registro de ponto

### Fase 3 - BI Dashboards (Baixa Prioridade)
9. `/bi/sales` - Dashboard de vendas
10. `/bi/production` - Dashboard de produção
11. `/bi/reports` - Relatórios gerenciais

### Fase 4 - Funcionalidades Globais
12. Implementar exportação Excel/PDF em páginas de listagem
13. Implementar filtros avançados com salvamento
14. Adicionar CSS de impressão

## Issues a Criar no Linear

1. **VIO-762**: Implementar /settings/email-integration
2. **VIO-763**: Implementar /locations/new
3. **VIO-764**: Implementar /payables/boletos/new
4. **VIO-765**: Implementar /treasury/accounts/new
5. **VIO-766**: Implementar páginas RH faltantes (férias, rescisões, escalas, ponto)
6. **VIO-767**: Implementar dashboards BI (vendas, produção, relatórios)
7. **VIO-768**: Adicionar exportação Excel/PDF em listagens
8. **VIO-769**: Implementar filtros avançados com salvamento
