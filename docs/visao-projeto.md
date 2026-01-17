# FRM ERP - Visão do Projeto

## Contexto

O projeto FRM ERP nasceu da necessidade de modernizar o sistema legado em Delphi do Grupo FRM. Porém, a visão evoluiu para algo maior: **criar um ERP completo, avançado e moderno**, capaz de competir com soluções como Sankhya, TOTVS e SAP Business One.

## Visão

> **Desenvolver um ERP industrial COMPLETO E AVANÇADO, moderno e escalável, que atenda às necessidades do Grupo FRM e possa ser comercializado como produto SaaS.**

## Princípio Fundamental

> ⚠️ **TODOS OS MÓDULOS DEVEM SER AVANÇADOS E COMPLETOS**
> 
> Não aceitamos implementações básicas ou simplificadas. Cada módulo deve ser desenvolvido com funcionalidades de nível enterprise, equivalentes ou superiores às soluções de mercado como Sankhya, TOTVS e SAP.

## Comparativo: Desenvolver vs Contratar

### Opção 1: Contratar Sankhya

| Aspecto | Avaliação |
|---------|-----------|
| **Custo inicial** | Alto (licenciamento + implantação) |
| **Custo mensal** | Alto (por usuário) |
| **Customização** | Limitada (via SDK/Add-ons) |
| **Dependência** | Total do fornecedor |
| **Time to market** | Rápido (meses) |
| **Propriedade** | Nenhuma |

### Opção 2: Desenvolver FRM ERP

| Aspecto | Avaliação |
|---------|-----------|
| **Custo inicial** | Médio (desenvolvimento) |
| **Custo mensal** | Baixo (infraestrutura) |
| **Customização** | Total |
| **Dependência** | Nenhuma |
| **Time to market** | Lento (1-2 anos) |
| **Propriedade** | Total (ativo da empresa) |

### Recomendação

**Desenvolver o FRM ERP** se:
- Há capacidade técnica interna ou parceria
- O sistema legado já funciona (pode migrar gradualmente)
- Há visão de comercializar o produto
- Customizações específicas são críticas

## Módulos do ERP Completo

Baseado na análise da Sankhya e necessidades industriais:

### 🟢 Fase 1: Core (Atual - 6 meses)

| Módulo | Status | Descrição |
|--------|--------|-----------|
| **Cadastros Básicos** | ✅ Feito | Materiais, Fornecedores, Categorias |
| **Compras** | 🔄 Parcial | Cotações, Pedidos, Entrada NFe |
| **Estoque** | ✅ Feito | Movimentações, Saldos |
| **Autenticação** | ✅ Feito | Login, MFA, Sessões, Audit |
| **Multi-Tenant** | ✅ Feito | Múltiplas empresas |

### 🟡 Fase 2: Operacional Completo (6-12 meses)

| Módulo | Prioridade | Descrição |
|--------|------------|-----------|
| **Engenharia** | Alta | BOM multinível, roteiros, centros de trabalho |
| **MRP** | Alta | Explosão de necessidades, sugestões de OPs e OCs |
| **Produção (MES)** | Alta | Ordens, programação Gantt, apontamentos |
| **Apontamentos** | Alta | Produção, MO, máquina, paradas, rastreabilidade |
| **OEE** | Alta | Dashboard tempo real, indicadores |
| **Qualidade** | Alta | Inspeções, laudos, não-conformidades, ações corretivas |
| **Manutenção** | Alta | Preventiva, corretiva, MTBF/MTTR |
| **Expedição** | Alta | Romaneios, rastreamento, integração transportadoras |

> ⚠️ **Nota**: O módulo de Produção deve ser **completo e avançado** (MRP/MES), equivalente ao módulo Produção/W da Sankhya. Não aceitamos implementações básicas.

### 🔵 Fase 3: Financeiro Completo (12-18 meses)

| Módulo | Prioridade | Descrição |
|--------|------------|-----------|
| **Contas a Pagar** | Alta | Títulos, autorização multinível, baixas, CNAB |
| **Contas a Receber** | Alta | Faturamento, boletos, cobrança automática, CNAB |
| **Tesouraria** | Alta | Contas bancárias, conciliação OFX, transferências |
| **Fluxo de Caixa** | Alta | Realizado e projetado, DRE gerencial |
| **Integração Bancária** | Alta | Boletos, remessa/retorno CNAB 240/400, PIX |
| **Contabilidade** | Média | Lançamentos automáticos, balancetes, DRE |
| **Fiscal** | Alta | SPED, NFe entrada/saída, NFSe, manifestação |

> ⚠️ **Nota**: O módulo Financeiro deve ser **completo e avançado**, equivalente ao módulo Financeiro da Sankhya (100+ telas). Não aceitamos implementações básicas.

### 🟣 Fase 4: Comercial (18-24 meses)

| Módulo | Prioridade | Descrição |
|--------|------------|-----------|
| **CRM** | Média | Leads, oportunidades |
| **Vendas** | Alta | Pedidos, orçamentos |
| **Precificação** | Média | Tabelas, políticas |
| **Comissões** | Baixa | Cálculo, relatórios |

### ⚪ Fase 5: RH/DP Completo (24+ meses)

| Módulo | Prioridade | Descrição |
|--------|------------|-----------|
| **Admissão Digital** | Alta | Workflow completo, documentos, eSocial |
| **Ponto Eletrônico** | Alta | REP, mobile, banco de horas, escalas |
| **Folha de Pagamento** | Alta | Cálculos completos, eventos, integração contábil |
| **Férias e 13º** | Alta | Programação, cálculo automático, eSocial |
| **Rescisões** | Alta | TRCT, GRRF, homologação |
| **Benefícios** | Alta | VT, VA, plano saúde, cálculo automático |
| **eSocial** | Alta | Todos os eventos (tabelas, periódicos, não-periódicos) |
| **Portal Colaborador** | Média | Holerite, férias, ponto online |
| **App Mobile RH** | Média | Ponto, holerite, solicitações |
| **Treinamentos** | Média | Cursos, certificações, matriz polivalência |

> ⚠️ **Nota**: O módulo de RH/DP deve ser **completo e avançado**, equivalente ao Pessoas+ da Sankhya. Não aceitamos implementações básicas.

## Funcionalidades Transversais

| Funcionalidade | Status | Descrição |
|----------------|--------|-----------|
| **Multi-Tenant** | ✅ | Múltiplas empresas |
| **Permissões** | ✅ | Granular por módulo |
| **Auditoria** | ✅ | Logs de todas ações |
| **API REST** | 🔄 | tRPC (interno) |
| **Integrações** | 📋 | SEFAZ, Bancos, Contábil |
| **Relatórios** | 📋 | Dashboards, exports |
| **Mobile** | 📋 | PWA ou React Native |
| **BI** | 📋 | Dashboards gerenciais |

## Arquitetura Técnica

### Stack Atual
- **Frontend**: Next.js 16, React 19, TypeScript, TailwindCSS
- **Backend**: tRPC, Next.js API Routes
- **Banco**: Supabase (PostgreSQL)
- **ORM**: Prisma
- **Auth**: Supabase Auth
- **Deploy**: Vercel

### Evolução Planejada
- **Microservices**: Separar módulos críticos (Fiscal, Financeiro)
- **Message Queue**: RabbitMQ/Redis para processamento assíncrono
- **Cache**: Redis para performance
- **Search**: Elasticsearch para buscas complexas
- **Storage**: S3 para arquivos (XMLs, PDFs)

## Comparativo com Sankhya

### Módulos da API Sankhya

| Módulo Sankhya | FRM ERP | Status |
|----------------|---------|--------|
| Autenticação | ✅ | Implementado |
| Cadastros Básicos | ✅ | Implementado |
| Clientes | 📋 | Planejado |
| Estoque | ✅ | Implementado |
| Financeiros Cadastros | 📋 | Planejado |
| Financeiros Movimentos | 📋 | Planejado |
| Fiscal | 📋 | Planejado |
| HCM (RH) | 📋 | Fase 5 |
| Logística | 📋 | Planejado |
| Preços | 📋 | Planejado |
| Produtos | ✅ | Implementado (Materiais) |
| Vendas Pedidos | 📋 | Planejado |
| Vendas NFC-e/CF-e | 📋 | Planejado |
| Gestão de Caixa | 📋 | Planejado |

### O que a documentação Sankhya NÃO mostra

A API da Sankhya é apenas a **ponta do iceberg**. Um ERP completo inclui:

1. **Regras de negócio complexas** - Cálculos fiscais, validações
2. **Workflows** - Aprovações, alçadas
3. **Relatórios** - Centenas de relatórios gerenciais
4. **Integrações** - Bancos, SEFAZ, contabilidade
5. **Customizações** - Campos, telas, processos
6. **Suporte** - Atualizações fiscais, legislação

## Roadmap Simplificado

```
2024 Q1-Q2: Core (Compras, Estoque, Auth) ✅
2024 Q3-Q4: Produção + Fiscal básico
2025 Q1-Q2: Financeiro completo
2025 Q3-Q4: Comercial + Integrações
2026+: RH/DP + BI + Mobile
```

## Métricas de Sucesso

| Métrica | Meta |
|---------|------|
| Módulos core funcionando | 100% |
| Usuários ativos | 50+ |
| Uptime | 99.9% |
| Tempo de resposta | < 200ms |
| Satisfação usuário | > 4.0/5.0 |

## Riscos e Mitigações

| Risco | Probabilidade | Mitigação |
|-------|---------------|-----------|
| Escopo muito grande | Alta | Fases incrementais |
| Falta de recursos | Média | Priorização rigorosa |
| Mudanças fiscais | Alta | Arquitetura flexível |
| Concorrência | Média | Foco em industrial |

## Conclusão

O FRM ERP tem potencial para ser um **produto completo e competitivo**. A documentação da Sankhya mostra que um ERP moderno precisa de:

1. **APIs bem definidas** - Já temos com tRPC
2. **Módulos integrados** - Arquitetura multi-tenant pronta
3. **Segurança robusta** - Autenticação completa
4. **Escalabilidade** - Stack moderna permite

A decisão de desenvolver vs contratar depende de:
- **Tempo disponível** - Sankhya é mais rápido
- **Orçamento** - Desenvolvimento é mais barato a longo prazo
- **Visão estratégica** - Produto próprio é ativo da empresa

**Recomendação**: Continuar o desenvolvimento do FRM ERP com foco em módulos críticos (Compras, Produção, Fiscal), enquanto avalia-se a possibilidade de comercialização futura.
