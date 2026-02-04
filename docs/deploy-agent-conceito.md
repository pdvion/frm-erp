# Deploy Agent - Conceito e Arquitetura

> *"Pelo passado preparamos o presente para evoluir com o futuro."*

## Visão Geral

O **Deploy Agent** é um agente de inteligência artificial projetado para acelerar a implantação do ERP. Ele analisa documentos fiscais (XMLs de NFe de entrada e saída) e a estrutura da empresa para configurar automaticamente regras fiscais, cadastros e parâmetros, permitindo que a empresa comece a operar rapidamente.

**Localização**: `/setup/deploy-agent` (integrado ao fluxo de criação de empresa em `/settings/companies/new`)

## Deploy Agent vs Módulo Fiscal

| Característica | Deploy Agent (IA) | Módulo Fiscal (Operacional) |
|----------------|-------------------|----------------------------|
| **Objetivo** | Implementação e Agilidade | Operação e Compliance |
| **Fase de Uso** | Implantação (Dia Zero) | Uso Contínuo (Dia a Dia) |
| **Tecnologia** | Inteligência Artificial | Regras de Negócio ERP |
| **Ações** | Importação de dados, configuração automática | Emissão de notas, cálculo de impostos, SPED |
| **Benefício** | Reduzir tempo de implantação | Conformidade com o fisco |

### Analogia

- **Deploy Agent**: Prepara a casa (configura o ERP com IA)
- **Módulo Fiscal**: A casa pronta onde a equipe trabalha diariamente

## Fluxo do Deploy Agent

```
┌─────────────────────────────────────────────────────────────────┐
│                    1. COLETA DE DADOS                           │
│  Upload em volume de XMLs (NFe entrada + saída)                 │
│  TODO o histórico fiscal da empresa (independente do período)   │
│  Suporte a todas as versões de XML de NFe                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    2. ANÁLISE INTELIGENTE (IA)                  │
│                                                                 │
│  Modelos utilizados:                                            │
│  - Claude 3.5 Sonnet: Classificação, inferência fiscal          │
│  - Claude 3.5 Haiku: Tarefas rápidas, batch processing          │
│  - Gemini 1.5 Pro: Análise de grandes volumes (1M tokens)       │
│                                                                 │
│  Análises realizadas:                                           │
│  - Identificar fornecedores recorrentes                         │
│  - Identificar clientes                                         │
│  - Mapear materiais/produtos                                    │
│  - Detectar regime tributário                                   │
│  - Identificar NCMs utilizados                                  │
│  - Mapear CFOPs e alíquotas                                     │
│  - Detectar formas de pagamento                                 │
│  - Inferir regras fiscais (CST, CSOSN, etc.)                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    3. SUGESTÕES DE CONFIGURAÇÃO                 │
│  - Cadastros: fornecedores, clientes, materiais                 │
│  - Fiscal: regime, alíquotas, CFOPs                             │
│  - Financeiro: formas de pagamento, prazos                      │
│  - Estoque: unidades, grupos, categorias                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    4. REVISÃO E APROVAÇÃO                       │
│  Usuário revisa sugestões e aprova/ajusta                       │
│  Aplicação das configurações no tenant                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    5. GO-LIVE                                   │
│  ERP configurado e pronto para operação                         │
│  Módulo Fiscal assume operação diária                           │
└─────────────────────────────────────────────────────────────────┘
```

## Fluxo do Módulo Fiscal (Operacional)

```
┌─────────────────────────────────────────────────────────────────┐
│                    OPERAÇÃO DIÁRIA                              │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│  ENTRADA      │    │  SAÍDA        │    │  OBRIGAÇÕES   │
│  - Importar   │    │  - Emitir NFe │    │  - SPED       │
│    XML NFe    │    │  - Emitir NFS │    │  - Apuração   │
│  - Conferir   │    │  - Cancelar   │    │  - GIA        │
│  - Aprovar    │    │  - Inutilizar │    │  - DCTF       │
└───────────────┘    └───────────────┘    └───────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  ANÁLISE E MODERAÇÃO (similar ao Deploy Agent)                  │
│  - Novo fornecedor? → Sugerir cadastro                          │
│  - Novo material? → Sugerir cadastro                            │
│  - Nova configuração fiscal? → Sugerir parametrização           │
└─────────────────────────────────────────────────────────────────┘
```

## Estrutura de Páginas

### Deploy Agent (`/setup/deploy-agent`)

| Página | Propósito |
|--------|-----------|
| `/setup/deploy-agent` | Dashboard: status da implantação, pendências |
| `/setup/deploy-agent/wizard` | Wizard guiado: upload → análise → revisão → aplicar |
| `/setup/deploy-agent/analysis` | Visualização detalhada das análises |
| `/setup/deploy-agent/[id]` | Detalhes de uma importação específica |

**Integração**: Acessível via `/settings/companies/new` como passo do onboarding de nova empresa.

### Módulo Fiscal (`/fiscal`)

| Página | Propósito |
|--------|-----------|
| `/fiscal` | Menu principal do módulo |
| `/fiscal/nfe` | Lista de NFe recebidas |
| `/fiscal/nfe/import` | Importar XML (operação diária) |
| `/fiscal/nfe/[id]` | Detalhes da NFe |
| `/fiscal/sped` | Geração de SPED Fiscal |
| `/fiscal/dashboard` | Dashboard fiscal operacional |

## Diferença na Importação de XML

| Aspecto | Deploy Agent | Módulo Fiscal |
|---------|--------------|---------------|
| **Volume** | Alto (histórico) | Unitário (dia a dia) |
| **Objetivo** | Configurar sistema | Registrar operação |
| **Resultado** | Cadastros + Configs | NFe + Estoque + Financeiro |
| **Frequência** | Uma vez (implantação) | Contínuo |

## Entidades Criadas/Configuradas

### Deploy Agent cria/configura:
- `Supplier` (fornecedores)
- `Customer` (clientes)
- `Material` (materiais/produtos)
- `TaxConfiguration` (configurações fiscais)
- `PaymentMethod` (formas de pagamento)
- `NCM` (classificações fiscais)
- `CFOP` (códigos fiscais)

### Módulo Fiscal cria:
- `SupplierInvoice` (NFe de entrada)
- `CustomerInvoice` (NFe de saída)
- `InventoryMovement` (movimentação de estoque)
- `Payable` (contas a pagar)
- `Receivable` (contas a receber)
- `SpedFile` (arquivos SPED)

## Tecnologias Utilizadas

### Parser XML
- Extração de dados de NFe (entrada e saída)
- Suporte a todas as versões de layout de NFe
- Validação de schema XSD

### Inteligência Artificial

| Tarefa | Provider | Modelo | Motivo |
|--------|----------|--------|--------|
| Classificação de Materiais | Anthropic | Claude 3.5 Sonnet | Melhor em raciocínio estruturado |
| Inferência Fiscal (CFOP, CST) | Anthropic | Claude 3.5 Sonnet | Precisão em regras fiscais |
| Detecção de Regime Tributário | Anthropic | Claude 3.5 Haiku | Rápido, tarefa simples |
| Sugestão de Cadastros | Anthropic | Claude 3.5 Haiku | Batch processing eficiente |
| Análise de Padrões (histórico grande) | Google | Gemini 1.5 Pro | Contexto 1M tokens |

**Configuração padrão**: `src/lib/ai/taskConfig.ts`

### Validação
- Regras fiscais brasileiras
- Validação de CNPJ/CPF
- Validação de NCM, CFOP, CST

### Batch Processing
- Processamento em lote de XMLs
- Queue para grandes volumes
- Progress tracking em tempo real

## Versões de XML Suportadas

| Versão | Layout | Status |
|--------|--------|--------|
| 1.10 | Legado | ✅ Suportado |
| 2.00 | Legado | ✅ Suportado |
| 3.10 | Anterior | ✅ Suportado |
| 4.00 | Atual | ✅ Suportado |

O parser detecta automaticamente a versão do XML e aplica o schema correto.
