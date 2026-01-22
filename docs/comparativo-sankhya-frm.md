# Comparativo Sankhya vs FRM ERP

## Objetivo

Comparar funcionalidades do FRM ERP com a Sankhya para identificar gaps e oportunidades de melhoria.

**Issue**: VIO-527  
**Data**: 22/01/2026

---

## Legenda

| Símbolo | Significado |
|---------|-------------|
| ✅ | Implementado e funcional |
| 🔄 | Implementado, precisa melhorias |
| 📋 | Planejado/Em backlog |
| ❌ | Não implementado |
| ➖ | Não aplicável ao FRM |

---

## 1. COMPRAS E SUPRIMENTOS

### 1.1 Cadastros Básicos

| Funcionalidade | Sankhya | FRM ERP | Status | Observação |
|----------------|---------|---------|--------|------------|
| Cadastro de Materiais | ✅ | ✅ | Completo | `/materials` - CRUD completo |
| Categorias de Materiais | ✅ | ✅ | Completo | Hierarquia de categorias |
| Unidades de Medida | ✅ | ✅ | Completo | UN, KG, M, L, etc. |
| Cadastro de Fornecedores | ✅ | ✅ | Completo | `/suppliers` - CRUD completo |
| Qualificação de Fornecedores | ✅ | 🔄 | Básico | IQF implementado, falta avaliação detalhada |
| Grupos de Compras | ✅ | ❌ | Não impl. | Criar issue |
| Condições de Pagamento | ✅ | 🔄 | Básico | Campo texto, falta tabela estruturada |

### 1.2 Cotações

| Funcionalidade | Sankhya | FRM ERP | Status | Observação |
|----------------|---------|---------|--------|------------|
| Solicitação de Cotação | ✅ | ✅ | Completo | `/quotes/new` |
| Envio para Fornecedores | ✅ | 🔄 | Parcial | Falta envio automático por email |
| Mapa de Cotação | ✅ | ✅ | Completo | `/quotes/compare` |
| Aprovação de Cotação | ✅ | ✅ | Completo | Workflow de status |
| Histórico de Preços | ✅ | 🔄 | Parcial | Falta relatório de evolução |

### 1.3 Pedidos de Compra

| Funcionalidade | Sankhya | FRM ERP | Status | Observação |
|----------------|---------|---------|--------|------------|
| Geração de Pedido | ✅ | ✅ | Completo | `/purchase-orders/new` |
| Aprovação de Pedido | ✅ | ✅ | Completo | Workflow de status |
| Acompanhamento de Entrega | ✅ | 🔄 | Básico | Falta tracking detalhado |
| Recebimento Parcial | ✅ | ✅ | Completo | `/receiving` |
| Devolução a Fornecedor | ✅ | ❌ | Não impl. | Criar issue |

### 1.4 Recebimento

| Funcionalidade | Sankhya | FRM ERP | Status | Observação |
|----------------|---------|---------|--------|------------|
| Conferência de Recebimento | ✅ | ✅ | Completo | `/receiving` |
| Vinculação com NF-e | ✅ | ✅ | Completo | Importação XML |
| Inspeção de Qualidade | ✅ | 🔄 | Básico | Flag `requiresQualityCheck` |
| Laudo de Recebimento | ✅ | ❌ | Não impl. | Criar issue |

---

## 2. ESTOQUE E INVENTÁRIO

### 2.1 Gestão de Estoque

| Funcionalidade | Sankhya | FRM ERP | Status | Observação |
|----------------|---------|---------|--------|------------|
| Posição de Estoque | ✅ | ✅ | Completo | `/inventory` |
| Múltiplos Almoxarifados | ✅ | ✅ | Completo | `locations` |
| Endereçamento (WMS) | ✅ | 🔄 | Básico | Campo `location` simples |
| Lote e Validade | ✅ | 🔄 | Parcial | Lote implementado, validade parcial |
| Número de Série | ✅ | ❌ | Não impl. | Criar issue |
| Estoque Mínimo/Máximo | ✅ | ✅ | Completo | Alertas implementados |
| Curva ABC | ✅ | ❌ | Não impl. | Criar issue |

### 2.2 Movimentações

| Funcionalidade | Sankhya | FRM ERP | Status | Observação |
|----------------|---------|---------|--------|------------|
| Entrada de Materiais | ✅ | ✅ | Completo | Via recebimento |
| Saída/Requisição | ✅ | ✅ | Completo | `/requisitions` |
| Transferência entre Locais | ✅ | ✅ | Completo | `/transfers` |
| Ajuste de Inventário | ✅ | 🔄 | Básico | Falta workflow de aprovação |
| Reserva de Estoque | ✅ | ❌ | Não impl. | Criar issue |

### 2.3 Inventário

| Funcionalidade | Sankhya | FRM ERP | Status | Observação |
|----------------|---------|---------|--------|------------|
| Contagem de Inventário | ✅ | 🔄 | Básico | Falta módulo dedicado |
| Inventário Rotativo | ✅ | ❌ | Não impl. | Criar issue |
| Inventário Cego | ✅ | ❌ | Não impl. | Criar issue |
| Acerto de Inventário | ✅ | 🔄 | Básico | Via ajuste manual |

---

## 3. PRODUÇÃO (MRP/MES)

### 3.1 Cadastros de Produção

| Funcionalidade | Sankhya | FRM ERP | Status | Observação |
|----------------|---------|---------|--------|------------|
| Estrutura de Produto (BOM) | ✅ | ✅ | Completo | `/engineering` |
| Roteiros de Produção | ✅ | ✅ | Completo | Operações e tempos |
| Centros de Trabalho | ✅ | ✅ | Completo | Máquinas/Recursos |
| Calendário de Produção | ✅ | 🔄 | Básico | Falta calendário visual |

### 3.2 Planejamento (MRP)

| Funcionalidade | Sankhya | FRM ERP | Status | Observação |
|----------------|---------|---------|--------|------------|
| Cálculo MRP | ✅ | ✅ | Completo | `/production/mrp` |
| Explosão de Necessidades | ✅ | ✅ | Completo | Multinível |
| Sugestão de Compras | ✅ | ✅ | Completo | Geração automática |
| Sugestão de Produção | ✅ | ✅ | Completo | Geração de OPs |
| Capacidade Finita | ✅ | 🔄 | Básico | Falta APS avançado |

### 3.3 Execução (MES)

| Funcionalidade | Sankhya | FRM ERP | Status | Observação |
|----------------|---------|---------|--------|------------|
| Ordens de Produção | ✅ | ✅ | Completo | `/production` |
| Apontamento de Produção | ✅ | ✅ | Completo | `/production/mes` |
| Apontamento por Operação | ✅ | ✅ | Completo | Tempos e quantidades |
| Paradas de Máquina | ✅ | ✅ | Completo | Motivos catalogados |
| Refugo/Retrabalho | ✅ | ✅ | Completo | Controle de perdas |

### 3.4 Indicadores

| Funcionalidade | Sankhya | FRM ERP | Status | Observação |
|----------------|---------|---------|--------|------------|
| Dashboard OEE | ✅ | ✅ | Completo | `/production/oee` |
| Disponibilidade | ✅ | ✅ | Completo | Tempo produtivo |
| Performance | ✅ | ✅ | Completo | Velocidade real vs padrão |
| Qualidade | ✅ | ✅ | Completo | % aprovado |

---

## 4. FINANCEIRO

### 4.1 Contas a Pagar

| Funcionalidade | Sankhya | FRM ERP | Status | Observação |
|----------------|---------|---------|--------|------------|
| Lançamento de Títulos | ✅ | ✅ | Completo | `/payables` |
| Parcelamento | ✅ | ✅ | Completo | Múltiplas parcelas |
| Programação de Pagamento | ✅ | ✅ | Completo | Agenda financeira |
| Baixa de Títulos | ✅ | ✅ | Completo | Manual e automática |
| Borderô de Pagamento | ✅ | 🔄 | Básico | Falta geração CNAB completa |
| Aprovação de Pagamentos | ✅ | 🔄 | Básico | Falta workflow multinível |

### 4.2 Contas a Receber

| Funcionalidade | Sankhya | FRM ERP | Status | Observação |
|----------------|---------|---------|--------|------------|
| Lançamento de Títulos | ✅ | ✅ | Completo | `/receivables` |
| Cobrança | ✅ | 🔄 | Básico | Falta régua de cobrança |
| Baixa de Recebimentos | ✅ | ✅ | Completo | Manual e automática |
| Boletos | ✅ | 🔄 | Parcial | Geração básica, falta API |
| Remessa/Retorno CNAB | ✅ | ✅ | Completo | CNAB 240/400 |

### 4.3 Tesouraria

| Funcionalidade | Sankhya | FRM ERP | Status | Observação |
|----------------|---------|---------|--------|------------|
| Contas Bancárias | ✅ | ✅ | Completo | `/treasury` |
| Movimentações | ✅ | ✅ | Completo | Entradas/Saídas |
| Transferências | ✅ | ✅ | Completo | Entre contas |
| Conciliação Bancária | ✅ | 🔄 | Básico | Falta importação OFX |
| Fluxo de Caixa | ✅ | ✅ | Completo | Projetado e realizado |

---

## 5. FISCAL

### 5.1 Documentos Fiscais

| Funcionalidade | Sankhya | FRM ERP | Status | Observação |
|----------------|---------|---------|--------|------------|
| Importação XML NF-e | ✅ | ✅ | Completo | `/invoices` |
| Manifestação Destinatário | ✅ | 📋 | Planejado | Criar issue |
| Emissão NF-e | ✅ | ❌ | Não impl. | Crítico - Criar issue |
| Emissão NFS-e | ✅ | ❌ | Não impl. | Criar issue |
| Emissão NFC-e | ✅ | ➖ | N/A | Não aplicável (indústria) |
| CT-e | ✅ | ➖ | N/A | Não aplicável |

### 5.2 Obrigações Acessórias

| Funcionalidade | Sankhya | FRM ERP | Status | Observação |
|----------------|---------|---------|--------|------------|
| SPED Fiscal | ✅ | ❌ | Não impl. | Crítico - Criar issue |
| SPED Contribuições | ✅ | ❌ | Não impl. | Criar issue |
| EFD Reinf | ✅ | ❌ | Não impl. | Criar issue |
| DCTF | ✅ | ❌ | Não impl. | Criar issue |

---

## 6. RH/DP

### 6.1 Cadastros

| Funcionalidade | Sankhya | FRM ERP | Status | Observação |
|----------------|---------|---------|--------|------------|
| Funcionários | ✅ | ✅ | Completo | `/hr/employees` |
| Departamentos | ✅ | ✅ | Completo | `/hr/departments` |
| Cargos | ✅ | ✅ | Completo | Estrutura de cargos |
| Escalas de Trabalho | ✅ | ✅ | Completo | Turnos configuráveis |

### 6.2 Ponto

| Funcionalidade | Sankhya | FRM ERP | Status | Observação |
|----------------|---------|---------|--------|------------|
| Marcação de Ponto | ✅ | ✅ | Completo | `/hr/timesheet` |
| Tratamento de Ponto | ✅ | ✅ | Completo | Ajustes e justificativas |
| Banco de Horas | ✅ | ✅ | Completo | Saldo e compensação |
| Espelho de Ponto | ✅ | ✅ | Completo | Relatório mensal |

### 6.3 Folha de Pagamento

| Funcionalidade | Sankhya | FRM ERP | Status | Observação |
|----------------|---------|---------|--------|------------|
| Cálculo de Folha | ✅ | ❌ | Não impl. | VIO-381 - Epic RH |
| Férias | ✅ | ❌ | Não impl. | Criar issue |
| 13º Salário | ✅ | ❌ | Não impl. | Criar issue |
| Rescisão | ✅ | ❌ | Não impl. | Criar issue |
| Holerite | ✅ | ❌ | Não impl. | Criar issue |

### 6.4 eSocial

| Funcionalidade | Sankhya | FRM ERP | Status | Observação |
|----------------|---------|---------|--------|------------|
| Eventos de Tabelas | ✅ | ❌ | Não impl. | VIO-407 |
| Eventos Não-Periódicos | ✅ | ❌ | Não impl. | VIO-407 |
| Eventos Periódicos | ✅ | ❌ | Não impl. | VIO-407 |
| Transmissão | ✅ | ❌ | Não impl. | VIO-407 |

---

## 7. VENDAS E CRM

### 7.1 Vendas

| Funcionalidade | Sankhya | FRM ERP | Status | Observação |
|----------------|---------|---------|--------|------------|
| Cadastro de Clientes | ✅ | ✅ | Completo | `/customers` |
| Pedido de Venda | ✅ | ✅ | Básico | `/sales` |
| Orçamento | ✅ | 🔄 | Básico | Falta conversão automática |
| Tabela de Preços | ✅ | ❌ | Não impl. | Criar issue |
| Comissões | ✅ | ❌ | Não impl. | Criar issue |

### 7.2 CRM

| Funcionalidade | Sankhya | FRM ERP | Status | Observação |
|----------------|---------|---------|--------|------------|
| Gestão de Leads | ✅ | ❌ | Não impl. | VIO-397 |
| Funil de Vendas | ✅ | ❌ | Não impl. | VIO-397 |
| Oportunidades | ✅ | ❌ | Não impl. | VIO-397 |
| Atividades/Follow-up | ✅ | ❌ | Não impl. | VIO-397 |

---

## 8. FUNCIONALIDADES TRANSVERSAIS

### 8.1 Segurança e Auditoria

| Funcionalidade | Sankhya | FRM ERP | Status | Observação |
|----------------|---------|---------|--------|------------|
| Autenticação | ✅ | ✅ | Completo | NextAuth + MFA |
| Multi-Tenant | ✅ | ✅ | Completo | Isolamento por empresa |
| Permissões por Módulo | ✅ | ✅ | Completo | RBAC implementado |
| Auditoria de Ações | ✅ | ✅ | Completo | `/audit` |
| RLS (Row Level Security) | ✅ | 🔄 | Básico | VIO-563 |

### 8.2 Relatórios e BI

| Funcionalidade | Sankhya | FRM ERP | Status | Observação |
|----------------|---------|---------|--------|------------|
| Relatórios Padrão | ✅ | ✅ | Completo | `/reports` |
| Relatórios Customizados | ✅ | 🔄 | Básico | Falta builder visual |
| Dashboard | ✅ | ✅ | Completo | `/dashboard` |
| BI/Analytics | ✅ | 🔄 | Básico | `/bi` - Falta IA |
| Exportação Excel/PDF | ✅ | ✅ | Completo | Implementado |

### 8.3 Integrações

| Funcionalidade | Sankhya | FRM ERP | Status | Observação |
|----------------|---------|---------|--------|------------|
| API REST | ✅ | ✅ | Completo | tRPC |
| Webhooks | ✅ | ❌ | Não impl. | Criar issue |
| Importação de Dados | ✅ | 🔄 | Parcial | XML NF-e, falta CSV |
| E-mail Automático | ✅ | ✅ | Completo | IMAP para XMLs |

### 8.4 Workflows

| Funcionalidade | Sankhya | FRM ERP | Status | Observação |
|----------------|---------|---------|--------|------------|
| Aprovações | ✅ | ✅ | Completo | Status-based |
| Notificações | ✅ | ✅ | Completo | `/notifications` |
| Tarefas | ✅ | ✅ | Completo | `/tasks` |
| Editor Visual | ✅ | ❌ | Não impl. | VIO-528 |

---

## Resumo Executivo

### O que TEMOS (Implementado)

1. **Compras Completo**: Materiais, Fornecedores, Cotações, Pedidos, Recebimento
2. **Estoque Funcional**: Posição, Movimentações, Múltiplos Locais
3. **Produção Avançada**: MRP, MES, OEE, Apontamentos
4. **Financeiro Básico**: Pagar, Receber, Tesouraria, CNAB
5. **RH Básico**: Funcionários, Ponto, Banco de Horas
6. **Infraestrutura**: Auth, Multi-tenant, Auditoria, Relatórios

### O que NÃO TEMOS (Gaps Críticos)

1. **Fiscal**: Emissão NF-e, SPED, EFD (CRÍTICO)
2. **Folha de Pagamento**: Cálculo, Férias, 13º, Rescisão
3. **eSocial**: Eventos e transmissão
4. **CRM**: Leads, Funil, Oportunidades
5. **WMS Avançado**: Endereçamento, Picking, Packing

### O que QUEREMOS TER (Roadmap)

#### Fase Imediata (Q1 2026)
- [ ] Emissão NF-e (CRÍTICO)
- [ ] SPED Fiscal básico
- [ ] Manifestação do Destinatário

#### Fase 2 (Q2 2026)
- [ ] Folha de Pagamento
- [ ] eSocial eventos básicos
- [ ] CRM básico

#### Fase 3 (Q3 2026)
- [ ] WMS completo
- [ ] BI com IA
- [ ] Editor de Workflows

---

## Issues a Criar

### Prioridade URGENTE
1. `[FEATURE] Emissão de NF-e` - Integração SEFAZ
2. `[FEATURE] SPED Fiscal` - EFD ICMS/IPI
3. `[FEATURE] Manifestação do Destinatário`

### Prioridade ALTA
4. `[FEATURE] Folha de Pagamento Completa`
5. `[FEATURE] Devolução a Fornecedor`
6. `[FEATURE] Laudo de Recebimento`
7. `[FEATURE] Régua de Cobrança`

### Prioridade MÉDIA
8. `[FEATURE] Grupos de Compras`
9. `[FEATURE] Número de Série em Estoque`
10. `[FEATURE] Curva ABC`
11. `[FEATURE] Inventário Rotativo`
12. `[FEATURE] Reserva de Estoque`
13. `[FEATURE] Tabela de Preços`
14. `[FEATURE] Comissões de Vendas`
15. `[FEATURE] Webhooks`

### Prioridade BAIXA
16. `[IMPROVEMENT] Condições de Pagamento Estruturadas`
17. `[IMPROVEMENT] Histórico de Preços com Gráfico`
18. `[IMPROVEMENT] Tracking de Entrega`
19. `[IMPROVEMENT] Importação OFX`
20. `[IMPROVEMENT] Builder de Relatórios`
