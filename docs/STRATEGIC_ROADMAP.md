# FRM ERP - Análise Estratégica e Roadmap

**Data**: 26/01/2026  
**Versão**: 1.0

---

## 1. Estado Atual do Sistema

### Módulos Implementados (✅ Produção)

| Área | Módulos | Status |
|------|---------|--------|
| **Compras** | Pedidos, Cotações, Recebimento, Devolução Fornecedor | ✅ |
| **Estoque** | Materiais, Inventário, Transferências, Requisições, Picking | ✅ |
| **Financeiro** | Contas a Pagar/Receber, Tesouraria, CNAB, DDA, Régua de Cobrança | ✅ |
| **Fiscal** | NFe (entrada/saída), SEFAZ, SPED | ✅ |
| **RH/DP** | Funcionários, Admissão, Férias, Rescisão, Folha, 13º, Benefícios | ✅ |
| **Produção** | Ordens, BOM, MRP, MES, OEE, Custos | ✅ |
| **Vendas** | Pedidos, Orçamentos, Leads, Faturamento | ✅ |
| **Qualidade** | Inspeções, GPD | ✅ |
| **BI** | Dashboards, Relatórios Salvos | ✅ |
| **Configurações** | Empresas, Usuários, Permissões, Workflows, Tutoriais | ✅ |

### Métricas Técnicas

- **3477 testes** unitários passando
- **108 arquivos** de teste
- **Coverage**: 82.61% lines / 78.52% branches
- **55+ routers** tRPC
- **150+ models** Prisma
- **CI/CD**: GitHub Actions + Vercel

---

## 2. Backlog Linear Atual

### Em Progresso (5 issues)
| Issue | Título | Prioridade |
|-------|--------|------------|
| VIO-586 | Cobertura de testes 80% | High |
| VIO-376 | EPIC Fiscal - NFe/SEFAZ | Urgent |
| VIO-377 | EPIC Financeiro Completo | Urgent |
| VIO-450 | Integração SEFAZ Automática | High |
| VIO-247 | Alias Vercel Produção | High |

### Backlog (14 issues)
| Issue | Título | Prioridade | Bloqueio |
|-------|--------|------------|----------|
| VIO-597 | API DDA Real | High | APIs bancárias |
| VIO-407 | eSocial Completo | High | Certificado digital |
| VIO-596 | SEFAZ Busca Automática | Medium | Certificado digital |
| VIO-528 | Editor Visual Workflows | Medium | - |
| VIO-402 | App Mobile Requisições | Medium | - |
| VIO-408 | Portal Colaborador RH | Medium | - |
| VIO-531 | Editor Gráficos IA | Low | - |
| VIO-563 | RLS Restritivas | Low | - |
| VIO-475 | Tutoriais Duplicados | Low | - |
| VIO-698 | Índices Supabase | Low | 3 meses |
| VIO-416 | Vercel Auth | Urgent | Plano Pro |

---

## 3. Análise das Novas Iniciativas

### 3.1 BPMN (Business Process Model and Notation)

**O que temos**: Router `workflow.ts` com workflows básicos (aprovações, requisições)

**Avaliação**:
- ⚠️ **NÃO implantar agora** como BPMN completo
- Já temos VIO-528 (Editor Visual Workflows) no backlog
- BPMN é complexo e requer engine dedicada (Camunda, Flowable)
- **Recomendação**: Evoluir o editor visual existente incrementalmente

**Prioridade**: Média (após estabilizar módulos core)

---

### 3.2 Omnichannel

**O que temos**: Router `notifications.ts` (notificações internas), `emailIntegration.ts`

**Avaliação**:
| Canal | Complexidade | Custo | Prioridade |
|-------|--------------|-------|------------|
| Email (SMTP/IMAP) | Baixa | Baixo | ✅ Já temos |
| WhatsApp Business API | Alta | Alto (~$0.05/msg) | Média |
| Teams | Média | Baixo (webhook) | Baixa |
| Chat interno | Média | Baixo | Média |
| Chatbot IA | Alta | Médio | Baixa |

**Estratégia Recomendada**:
1. **Fase 1**: Twilio para SMS/WhatsApp (notificações críticas)
2. **Fase 2**: Webhook Teams/Slack para integrações
3. **Fase 3**: Chat interno com histórico
4. **Fase 4**: Chatbot IA (após agentes funcionando)

**Prioridade**: Média-Alta (após integrações fiscais)

---

### 3.3 Facilities (Gestão de Serviços)

**O que temos**: Nada específico

**Conceito**:
- Facilities = Gestão de instalações, manutenção predial, serviços terceirizados
- Diferente de terceirização de mão de obra (que seria RH)

**Avaliação**:
- ⚠️ **NÃO priorizar agora**
- FRM é indústria, não empresa de facilities
- Se necessário, criar módulo simples de "Manutenção Predial"
- Terceirização de mão de obra → expandir módulo RH

**Prioridade**: Baixa

---

### 3.4 GED (Gestão Eletrônica de Documentos)

**O que temos**: Router `storage.ts` (upload/download Supabase Storage)

**Análise**:

| Componente | Status | Recomendação |
|------------|--------|--------------|
| Armazenamento | ✅ Supabase Storage | Manter |
| Versionamento | ❌ Não tem | Implementar |
| OCR/Indexação | ❌ Não tem | Fase 2 |
| Assinatura Digital | ❌ Não tem | Integrar serviço |
| Gestão de Contratos | ❌ Não tem | Novo módulo |

**Assinatura Eletrônica - Opções**:
| Serviço | Custo | Integração | Recomendação |
|---------|-------|------------|--------------|
| DocuSign | Alto | API REST | Enterprise |
| Zoho Sign | Médio | API REST | ✅ Recomendado |
| Clicksign | Médio | API REST | Alternativa BR |
| ICP-Brasil | Baixo | Complexa | Obrigatório p/ NFe |
| Construir do zero | Alto | - | ❌ Não recomendado |

**Gestão de Contratos vs GED**:
- **GED** = Infraestrutura (armazenamento, busca, versionamento)
- **Gestão de Contratos** = Aplicação sobre GED (vigência, renovação, alertas)
- São complementares, não excludentes

**Prioridade**: Alta (contratos RH e fornecedores são críticos)

---

### 3.5 E-Learning

**O que temos**: Router `tutorials.ts` (tutoriais do sistema)

**Avaliação**:
- Tutoriais existentes são para o ERP, não treinamento corporativo
- E-Learning corporativo requer: LMS, SCORM, trilhas, certificados
- ⚠️ **NÃO construir do zero**

**Recomendação**:
- Integrar com LMS existente (Moodle, Litmos, TalentLMS)
- Ou usar Notion/Confluence para documentação
- Foco do ERP deve ser gestão, não treinamento

**Prioridade**: Baixa (usar ferramenta externa)

---

### 3.6 ImpEx (Importação/Exportação)

**O que temos**: Nada específico

**Análise do módulo Sankhya ImpEx**:
- Cadastro de portos, tipos de carga
- Contratos cambiais (importação/exportação)
- Follow-up de importação
- Cálculo de Antidumping
- Integração com pré-nota

**Relevância para FRM**:
- ✅ FRM tem volume considerável de importações
- Necessário para: DI, LI, DUIMP, controle cambial, custos de importação

**Recomendação**:
- **Fase 1**: Cadastros básicos (portos, despachantes, NCM)
- **Fase 2**: Controle de processos de importação
- **Fase 3**: Integração com Siscomex (se viável)
- **Fase 4**: Custos de importação integrados ao estoque

**Prioridade**: Alta (impacto direto no negócio FRM)

---

### 3.7 Low-Code / No-Code

**O que temos**: Nada específico

**Avaliação**:
- Low-code para ERP = usuários criarem telas/relatórios sem código
- Requer: schema dinâmico, form builder, query builder
- Complexidade muito alta

**Recomendação**:
- ⚠️ **NÃO implementar agora**
- Alternativa: Relatórios customizáveis (já temos `savedReports`)
- Alternativa: Integração com ferramentas BI (Metabase, Superset)

**Prioridade**: Baixa (alto esforço, baixo ROI imediato)

---

### 3.8 Gestão de Frotas

**O que temos**: Nada específico

**Análise**:
- Gestão de Frotas ≠ WMS (são módulos distintos)
- WMS = Armazém (picking, endereçamento, inventário)
- Frotas = Veículos (manutenção, abastecimento, rastreamento, motoristas)

**Escopo sugerido**:
- Cadastro de veículos
- Controle de manutenção preventiva
- Registro de abastecimentos
- Controle de multas
- Integração com rastreadores (opcional)

**Prioridade**: Média (se FRM tem frota própria significativa)

---

### 3.9 Agentes de IA

**O que temos**: Router `aiConfig.ts` (configuração de providers), `deploy-agent.ts` (importação NFe)

**Oportunidades de Agentes IA**:

| Agente | Função | Complexidade | Impacto |
|--------|--------|--------------|---------|
| Classificador NFe | Auto-categorizar itens importados | Média | Alto |
| Assistente Compras | Sugerir fornecedores, prever demanda | Alta | Alto |
| Cobrador Inteligente | Régua de cobrança adaptativa | Média | Alto |
| Analista Financeiro | Insights de fluxo de caixa | Média | Médio |
| RH Assistant | Responder dúvidas de funcionários | Baixa | Médio |
| Chatbot Suporte | Atendimento inicial | Média | Médio |

**Recomendação**:
- Já temos infraestrutura de IA (aiConfig)
- Começar com agentes de classificação/sugestão
- Evoluir para agentes conversacionais

**Prioridade**: Alta (diferencial competitivo)

---

### 3.10 Micro-serviços

**O que temos**: Monolito Next.js + tRPC

**Análise**:
- Arquitetura atual é adequada para o tamanho do sistema
- Micro-serviços adicionam complexidade operacional
- Next.js + tRPC já serve API via `/api/trpc`

**Quando migrar para micro-serviços**:
- Equipe > 10 desenvolvedores
- Necessidade de escalar módulos independentemente
- Diferentes stacks por módulo

**Recomendação**:
- ⚠️ **NÃO migrar agora**
- Manter monolito modular (routers separados)
- Extrair serviços apenas se necessário (ex: processamento NFe pesado)

**Prioridade**: Baixa (não há necessidade atual)

---

### 3.11 Testes Permissionados (Multi-tenant)

**O que temos**: 
- `tenantProcedure` com `companyId`
- `tenantFilter` para queries
- Testes unitários de schemas

**Análise**:
- ❌ **NÃO temos testes de isolamento multi-tenant**
- Cenário: Usuário X da Empresa Y acessa dados da Empresa Z?

**Recomendação**:
- Criar suite de testes E2E para isolamento
- Testar: CRUD cross-company, permissões, RLS

**Prioridade**: Alta (segurança crítica)

---

### 3.12 Portais (Clientes, Fornecedores, Carreiras)

**O que temos**: 
- VIO-408 (Portal Colaborador) no backlog
- Nada para clientes/fornecedores

**Análise**:

| Portal | Funcionalidades | Prioridade |
|--------|-----------------|------------|
| Colaborador | Holerite, férias, ponto, documentos | Alta |
| Fornecedor | Pedidos, pagamentos, documentos | Média |
| Cliente | Pedidos, faturas, suporte | Média |
| Carreiras | Vagas, candidaturas | Baixa |

**Recomendação**:
- Portal Colaborador já está no backlog (VIO-408)
- Portais externos requerem autenticação separada
- Considerar subdomínios: `portal.frm.com.br`, `fornecedor.frm.com.br`

**Prioridade**: Média-Alta (Portal Colaborador primeiro)

---

## 4. Matriz de Priorização

### Critérios
- **Impacto no Negócio**: 1-5
- **Esforço**: 1-5 (1=baixo, 5=alto)
- **Dependências**: Bloqueios externos
- **ROI**: Retorno sobre investimento

### Ranking Final

| # | Iniciativa | Impacto | Esforço | Bloqueio | Recomendação |
|---|------------|---------|---------|----------|--------------|
| 1 | Testes Permissionados | 5 | 2 | Não | ✅ Fazer agora |
| 2 | ImpEx (Importação) | 5 | 4 | Não | ✅ Próximo ciclo |
| 3 | GED + Contratos | 4 | 3 | Não | ✅ Próximo ciclo |
| 4 | Agentes IA | 4 | 3 | Não | ✅ Paralelo |
| 5 | Omnichannel (WhatsApp) | 4 | 3 | Twilio | ⏳ Após ImpEx |
| 6 | Portal Colaborador | 4 | 4 | Não | ⏳ VIO-408 existe |
| 7 | Gestão de Frotas | 3 | 3 | Não | ⏳ Se necessário |
| 8 | Editor Workflows | 3 | 4 | Não | ⏳ VIO-528 existe |
| 9 | Portais Externos | 3 | 4 | Não | ⏳ Após Portal RH |
| 10 | Facilities | 2 | 3 | Não | ❌ Não priorizar |
| 11 | E-Learning | 2 | 4 | Não | ❌ Usar externo |
| 12 | Low-Code | 3 | 5 | Não | ❌ Não priorizar |
| 13 | BPMN Completo | 3 | 5 | Não | ❌ Evoluir gradual |
| 14 | Micro-serviços | 2 | 5 | Não | ❌ Não necessário |

---

## 5. Roadmap Proposto

### Q1 2026 (Jan-Mar) - Estabilização

**Foco**: Qualidade, segurança, integrações fiscais

| Semana | Atividade |
|--------|-----------|
| S1-2 | Finalizar VIO-586 (cobertura testes) |
| S3-4 | Testes Permissionados Multi-tenant |
| S5-6 | VIO-596/450 (SEFAZ) - se certificado disponível |
| S7-8 | Iniciar ImpEx (cadastros básicos) |

### Q2 2026 (Abr-Jun) - Expansão Operacional

**Foco**: ImpEx, GED, Agentes IA

| Mês | Atividade |
|-----|-----------|
| Abril | ImpEx Fase 1 (processos importação) |
| Maio | GED + Gestão de Contratos |
| Junho | Agentes IA (classificador NFe, sugestões) |

### Q3 2026 (Jul-Set) - Comunicação e Portais

**Foco**: Omnichannel, Portal Colaborador

| Mês | Atividade |
|-----|-----------|
| Julho | Integração Twilio (WhatsApp/SMS) |
| Agosto | Portal Colaborador (VIO-408) |
| Setembro | Chat interno + notificações |

### Q4 2026 (Out-Dez) - Automação e IA

**Foco**: Workflows avançados, IA conversacional

| Mês | Atividade |
|-----|-----------|
| Outubro | Editor Visual Workflows (VIO-528) |
| Novembro | Chatbot IA |
| Dezembro | Portais externos (Fornecedor/Cliente) |

---

## 6. Próximas Ações Imediatas

### Esta Semana
1. ✅ Finalizar VIO-586 (testes)
2. 🆕 Criar issue: Testes Permissionados Multi-tenant
3. 🆕 Criar issue: Módulo ImpEx - Fase 1

### Próxima Semana
1. Implementar testes de isolamento multi-tenant
2. Definir escopo detalhado ImpEx
3. Avaliar necessidade de Gestão de Frotas com stakeholders

---

## 7. Issues a Criar no Linear

| Título | Tipo | Prioridade |
|--------|------|------------|
| [TEST] Testes Permissionados Multi-tenant | Improvement | Urgent |
| [EPIC] Módulo ImpEx - Importação/Exportação | Feature | High |
| [FEATURE] GED - Gestão Eletrônica de Documentos | Feature | High |
| [FEATURE] Gestão de Contratos | Feature | High |
| [FEATURE] Agentes IA - Classificador NFe | Feature | Medium |
| [FEATURE] Omnichannel - Integração Twilio | Feature | Medium |
| [FEATURE] Gestão de Frotas | Feature | Low |

---

## 8. Decisões Pendentes (Requer Input)

1. **Certificado Digital**: Quando estará disponível para SEFAZ/eSocial?
2. **Twilio**: Aprovar orçamento para WhatsApp Business API?
3. **Zoho Sign**: Aprovar integração para assinatura eletrônica?
4. **Frotas**: FRM tem frota própria significativa que justifique módulo?
5. **ImpEx**: Quais processos de importação são prioritários?

---

*Documento gerado em 26/01/2026 - Atualizar conforme evolução do projeto*
