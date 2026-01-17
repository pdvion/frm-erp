# Análise dos Módulos Delphi FRM vs Sankhya

## Visão Geral

O sistema FRM SUITE em Delphi possui **57 módulos** organizados por área. Este documento cruza os módulos existentes com as funcionalidades da Sankhya para definir prioridades de migração.

---

## Módulos Delphi FRM por Área

### 🏢 Administração (A00)

| Código | Módulo Delphi | Equivalente Sankhya | Status Migração |
|--------|---------------|---------------------|-----------------|
| A00 | FRM Suite (Menu Principal) | Navegador Sankhya | ✅ Migrado (Dashboard) |
| A00 | Acesso/Login | Autenticação | ✅ Migrado |
| A00 | Avisos | Notificações | 📋 Planejado |
| A00 | Tarefas | Workflow/Flow | 📋 Planejado |
| A00 | Consulta SEFAZ | Fiscal | 📋 Crítico |
| A00 | Dependências | Configurações | ✅ Parcial |
| A00 | FRM Coleta Fácil | App Mobile | 📋 Futuro |
| A00 | FRM WS (Web Service) | API/Integrações | ✅ tRPC |

### 🛒 Compras (CP)

| Código | Módulo Delphi | Equivalente Sankhya | Status Migração |
|--------|---------------|---------------------|-----------------|
| CP10 | Materiais | Produtos | ✅ Migrado |
| CP10 | Gravar Mov Estoque | Estoque | ✅ Migrado |
| CP11 | Fornecedores | Parceiros | ✅ Migrado |
| CP11 | Preview XML NFe | Fiscal - Importação | 🔴 Crítico |
| CP12 | Orçamentos/Cotações | Cotação | ✅ Migrado |
| CP12 | Sol Orçamentos | Requisição de Compra | 📋 Planejado |
| CP13 | Ordens de Compra | Pedido de Compra | ✅ Migrado |
| CP13 | Controle Pendências OC | Acompanhamento | 📋 Planejado |
| CP14 | Entrada Materiais/NFe | Recebimento | 🔴 **CRÍTICO** |
| CP14 | Mobile Entrada | App Recebimento | 📋 Futuro |
| CP15 | Saídas Materiais | Requisição Interna | 🔴 Crítico |
| CP16 | Ativos | Imobilizado | 🟡 Baixa prioridade |
| CP60 | Controle Contábil | Contabilização | 🟡 Baixa prioridade |
| CP00 | Relatórios Compras | Relatórios | 📋 Planejado |

### 📦 Estoque (EST)

| Código | Módulo Delphi | Equivalente Sankhya | Status Migração |
|--------|---------------|---------------------|-----------------|
| EST10 | Estoques Produtos | Estoque | ✅ Migrado |
| EG10 | Produtos | Produtos | ✅ Migrado (Materials) |
| EX15 | Etiqueta Registrada | WMS - Etiquetas | 📋 Futuro |

### 🏭 Produção (OP/P)

| Código | Módulo Delphi | Equivalente Sankhya | Status Migração |
|--------|---------------|---------------------|-----------------|
| OP10 | Ordens Produção | Ordem de Produção | 🔴 **CRÍTICO** |
| OP15 | Alim Produção | Requisição p/ Produção | 📋 Planejado |
| OP20 | Tela Produção | Apontamento | 📋 Planejado |
| OP30 | Gestão MO | Mão de Obra | 📋 Planejado |
| OP50 | OS Ferramentaria | Manutenção | 📋 Planejado |
| P1 | Ficha Fundição | Apontamento Específico | 📋 Específico FRM |
| P5 | Ficha Produção | Apontamento | 📋 Planejado |
| P35 | Cabine Pintura | Apontamento Específico | 📋 Específico FRM |
| P35 | Estoque Pintura | Estoque WIP | 📋 Planejado |
| CM10 | Cot. Inicial Prod | Custo Estimado | 📋 Planejado |
| - | Tela Montagem | Apontamento Montagem | 📋 Específico FRM |
| - | Tela Ord Compra Fund | Compra Fundição | 📋 Específico FRM |
| - | Tela Produtos Pré PCP | Planejamento | 📋 Planejado |
| - | Apontamento Montagem | Apontamento | 📋 Específico FRM |

### 💰 Financeiro (FN)

| Código | Módulo Delphi | Equivalente Sankhya | Status Migração |
|--------|---------------|---------------------|-----------------|
| FN10 | Ordens Pgto (Contas a Pagar) | Financeiro - Despesas | 🔴 **CRÍTICO** |
| - | Contas a Receber | Financeiro - Receitas | 📋 Planejado |
| - | Fluxo de Caixa | Fluxo de Caixa | 📋 Planejado |
| - | Conciliação Bancária | Conciliação | 📋 Planejado |

### 💼 Vendas (PV/VD)

| Código | Módulo Delphi | Equivalente Sankhya | Status Migração |
|--------|---------------|---------------------|-----------------|
| PV10 | Pedido Vendas | Pedido de Venda | 📋 Planejado |
| PV15 | Controle NF Venda | Faturamento | 📋 Planejado |
| VD10 | Orçamentos Venda | Orçamento | 📋 Planejado |
| PV03 | Importar PV Cobol | Migração Legado | ❌ Não aplicável |

### 👥 RH/DP

| Código | Módulo Delphi | Equivalente Sankhya | Status Migração |
|--------|---------------|---------------------|-----------------|
| DP00 | Dpto Pessoal | Pessoas+ | 📋 Fase 5 |
| DP04 | Cargos | Cadastro de Cargos | 📋 Fase 5 |
| FP41 | Folha Ponto | Ponto Eletrônico | 📋 Fase 5 |
| FR10 | Férias | Férias | 📋 Fase 5 |
| VA10 | Vale Alimentação | Benefícios | 📋 Fase 5 |
| VT10 | Vale Transporte | Benefícios | 📋 Fase 5 |
| TR10 | Treinamentos | Treinamentos | 📋 Fase 5 |
| PR30 | Prêmio | Remuneração Variável | 📋 Fase 5 |
| MP10 | Matriz Polivalência | Competências | 📋 Específico FRM |

### 🔧 Qualidade/Manutenção

| Código | Módulo Delphi | Equivalente Sankhya | Status Migração |
|--------|---------------|---------------------|-----------------|
| CQ10 | Controle Qualidade | Qualidade | 📋 Planejado |
| MT10 | Manutenção | Manutenção | 📋 Planejado |

### 🔗 Integrações

| Código | Módulo Delphi | Equivalente Sankhya | Status Migração |
|--------|---------------|---------------------|-----------------|
| BNR01 | Importar Benner | Integração RH | 📋 Específico FRM |

---

## Funcionalidades Específicas do FRM (Não existem na Sankhya)

Estas são funcionalidades **customizadas** para a indústria FRM que precisam ser preservadas:

### Fundição
- **P1 - Ficha Fundição**: Controle específico de fundição
- **Tela Ord Compra Fund**: Compras específicas para fundição

### Pintura
- **P35 - Cabine Pintura**: Controle de cabine de pintura
- **P35 - Estoque Pintura**: Estoque em processo de pintura

### Montagem
- **Apontamento Montagem**: Apontamento específico de montagem
- **Tela Montagem**: Interface de montagem

### RH Específico
- **MP10 - Matriz Polivalência**: Controle de habilidades dos funcionários

### Integrações Específicas
- **BNR01 - Benner**: Integração com sistema Benner (RH)

---

## Priorização de Migração

### 🔴 Fase 1: Crítico (Próximos 3 meses)

| Prioridade | Módulo | Justificativa |
|------------|--------|---------------|
| 1 | **CP14 - Entrada NFe** | Operação diária crítica |
| 2 | **CP15 - Saída Materiais** | Requisições internas |
| 3 | **FN10 - Contas a Pagar** | Financeiro básico |
| 4 | **CP11 - Preview XML NFe** | Suporte à entrada |

### 🟡 Fase 2: Importante (3-6 meses)

| Prioridade | Módulo | Justificativa |
|------------|--------|---------------|
| 5 | **OP10 - Ordens Produção** | Core da produção |
| 6 | **OP20 - Tela Produção** | Apontamentos |
| 7 | **PV10 - Pedido Vendas** | Comercial |
| 8 | **CQ10 - Controle Qualidade** | Qualidade |

### 🟢 Fase 3: Desejável (6-12 meses)

| Prioridade | Módulo | Justificativa |
|------------|--------|---------------|
| 9 | P1/P5 - Fichas Produção | Apontamentos específicos |
| 10 | MT10 - Manutenção | Manutenção preventiva |
| 11 | VD10 - Orçamentos Venda | Comercial |
| 12 | CP00 - Relatórios | Relatórios gerenciais |

### ⚪ Fase 4: Futuro (12+ meses)

| Prioridade | Módulo | Justificativa |
|------------|--------|---------------|
| 13+ | RH/DP completo | Folha, férias, ponto |
| 14+ | Integrações específicas | Benner, SEFAZ |
| 15+ | Mobile apps | Coleta fácil, entrada mobile |

---

## Comparativo: O que o FRM tem que a Sankhya não tem

| Funcionalidade FRM | Descrição | Valor |
|--------------------|-----------|-------|
| **Ficha Fundição** | Controle específico de fundição | Alto (diferencial) |
| **Cabine Pintura** | Controle de processo de pintura | Alto (diferencial) |
| **Matriz Polivalência** | Gestão de competências | Médio |
| **Integração Benner** | RH terceirizado | Específico |
| **Coleta Fácil Mobile** | App de coleta de dados | Alto |

---

## Comparativo: O que a Sankhya tem que o FRM não tem

| Funcionalidade Sankhya | Descrição | Prioridade FRM |
|------------------------|-----------|----------------|
| **WMS completo** | Endereçamento, picking | Média |
| **BI/Analytics AI** | Dashboards inteligentes | Alta |
| **E-commerce** | Loja virtual | Baixa |
| **CRM** | Gestão de clientes | Média |
| **Workflow/Flow** | Automação de processos | Alta |
| **eSocial integrado** | Obrigações trabalhistas | Alta (RH) |
| **SPED completo** | Obrigações fiscais | Alta |
| **Conciliação bancária** | Automática | Alta |
| **Boleto/PIX** | Cobrança integrada | Alta |

---

## Recomendação de Issues no Linear

### Epic: Módulo Fiscal (NFe/Entrada)
1. **CP14 - Entrada de NFe** - Importar XML, validar, dar entrada
2. **CP11 - Preview XML** - Visualizar e validar XMLs
3. **Consulta SEFAZ** - Consultar situação de NFe

### Epic: Módulo Financeiro
1. **FN10 - Contas a Pagar** - Títulos, baixas, programação
2. **Contas a Receber** - Faturamento, cobrança
3. **Fluxo de Caixa** - Projeções

### Epic: Módulo Produção (MRP)
1. **OP10 - Ordens de Produção** - Geração, programação
2. **OP20 - Apontamento** - Registro de produção
3. **P1/P5 - Fichas Específicas** - Fundição, produção

### Epic: Módulo Requisições
1. **CP15 - Saída de Materiais** - Requisições internas
2. **CP12 - Sol Orçamentos** - Solicitação de compra

---

## Conclusão

O FRM SUITE em Delphi possui **57 módulos** que cobrem:
- ✅ **Compras**: Bem desenvolvido (14 módulos)
- ✅ **Produção**: Específico para indústria (10 módulos)
- 🟡 **Financeiro**: Básico (apenas Contas a Pagar)
- 🟡 **Vendas**: Básico (4 módulos)
- 🟡 **RH**: Parcial (8 módulos, alguns terceirizados)
- ❌ **Fiscal**: Limitado (sem SPED, eSocial)
- ❌ **BI**: Inexistente
- ❌ **WMS**: Inexistente

### Vantagens do FRM sobre Sankhya
1. **Processos específicos de fundição e pintura**
2. **Conhecimento do negócio já implementado**
3. **Integrações específicas (Benner)**

### Gaps a preencher
1. **Fiscal completo** (NFe, SPED, eSocial)
2. **Financeiro robusto** (Receber, Conciliação, Boletos)
3. **BI/Dashboards**
4. **Workflows de aprovação**
