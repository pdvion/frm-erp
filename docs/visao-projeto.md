# FRM ERP - Visão do Projeto

## Contexto

O projeto FRM ERP nasceu da necessidade de modernizar o sistema legado em Delphi do Grupo FRM. Porém, a visão evoluiu para algo maior: **criar um ERP completo e moderno**, capaz de competir com soluções como Sankhya, TOTVS e SAP Business One.

## Visão

> **Desenvolver um ERP industrial completo, moderno e escalável, que atenda às necessidades do Grupo FRM e possa ser comercializado como produto SaaS.**

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

### 🟡 Fase 2: Operacional (6-12 meses)

| Módulo | Prioridade | Descrição |
|--------|------------|-----------|
| **Produção (MRP)** | Alta | Ordens de produção, apontamentos |
| **Qualidade** | Média | Inspeções, não-conformidades |
| **Manutenção** | Média | Ordens de serviço, preventivas |
| **Expedição** | Alta | Romaneios, rastreamento |

### 🔵 Fase 3: Financeiro (12-18 meses)

| Módulo | Prioridade | Descrição |
|--------|------------|-----------|
| **Contas a Pagar** | Alta | Títulos, baixas, conciliação |
| **Contas a Receber** | Alta | Faturamento, cobrança |
| **Fluxo de Caixa** | Média | Projeções, DRE |
| **Contabilidade** | Baixa | Lançamentos, balancetes |
| **Fiscal** | Alta | SPED, NFe, NFSe |

### 🟣 Fase 4: Comercial (18-24 meses)

| Módulo | Prioridade | Descrição |
|--------|------------|-----------|
| **CRM** | Média | Leads, oportunidades |
| **Vendas** | Alta | Pedidos, orçamentos |
| **Precificação** | Média | Tabelas, políticas |
| **Comissões** | Baixa | Cálculo, relatórios |

### ⚪ Fase 5: RH/DP (24+ meses)

| Módulo | Prioridade | Descrição |
|--------|------------|-----------|
| **Cadastro Pessoal** | Média | Funcionários, cargos |
| **Ponto** | Alta | Marcações, banco de horas |
| **Folha** | Alta | Cálculos, eSocial |
| **Benefícios** | Média | VT, VR, planos |
| **Treinamentos** | Baixa | Cursos, certificações |

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
