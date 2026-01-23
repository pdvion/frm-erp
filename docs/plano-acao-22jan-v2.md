# Plano de Ação - 22/01/2026 (Sessão 2)

## Análise das Solicitações

### 1. VIO-595 - Relatórios Gerenciais

**Pergunta:** Cada usuário poderia salvar seu próprio relatório?

**Proposta de Arquitetura:**

```
┌─────────────────────────────────────────────────────────────┐
│                    RELATÓRIOS GERENCIAIS                     │
├─────────────────────────────────────────────────────────────┤
│  Relatórios Padrão (Sistema)    │  Relatórios Salvos (User) │
│  - Posição de Estoque           │  - Meus Relatórios        │
│  - Curva ABC                    │  - Favoritos              │
│  - Aging Contas                 │  - Compartilhados         │
│  - Fluxo de Caixa               │                           │
│  - Compras por Fornecedor       │                           │
│  - Headcount                    │                           │
├─────────────────────────────────────────────────────────────┤
│                     FUNCIONALIDADES                          │
│  ✅ Filtros por período e empresa                           │
│  ✅ Gráficos interativos (Recharts)                         │
│  🔄 Salvar configuração de filtros (por usuário)            │
│  🔄 Export PDF/Excel                                        │
│  🔄 Agendamento de envio por email                          │
└─────────────────────────────────────────────────────────────┘
```

**Modelo de Dados Proposto:**
```prisma
model SavedReport {
  id          String   @id @default(uuid())
  userId      String   @db.Uuid
  companyId   String   @db.Uuid
  reportType  String   // "inventory-position", "cash-flow", etc.
  name        String   // Nome personalizado
  filters     Json     // Filtros salvos
  isDefault   Boolean  @default(false)
  isShared    Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**Decisão necessária:** Implementar relatórios salvos por usuário? (Sim/Não)

---

### 2. VIO-463 - Proteção de Senhas Vazadas

**Status:** ✅ Confirmado habilitado pelo usuário

**Verificação Supabase:** Não há mais erros de segurança críticos (RLS). Apenas WARNs sobre políticas permissivas (aceitável para acesso via backend).

**Ação:** Marcar VIO-463 como Done no Linear.

---

### 3. Integração SEFAZ - Busca Automática de NFe

**Status:** ⏸️ Aguardando certificado digital

**Issue a criar no Linear:**
```
Título: [FEATURE] Integração SEFAZ - Busca Automática de NFe
Prioridade: Medium
Labels: Feature, Integration

Descrição:
## Objetivo
Implementar busca automática de NFe na SEFAZ via webservice.

## Pré-requisitos (Ação do Usuário)
- [ ] Certificado digital A1 ou A3 da empresa
- [ ] Configuração do certificado no servidor
- [ ] Homologação na SEFAZ

## Escopo Técnico
- Consulta de NFe destinadas (DistribuiçãoDFe)
- Download automático de XMLs
- Manifestação do destinatário
- Integração com módulo de recebimento

## Status
⏸️ Aguardando - Depende de certificado digital
```

---

### 4. Integração Bancária - API DDA

**Status:** 🔄 Aguardando cadastro nos bancos

**Issue a criar/atualizar no Linear:**
```
Título: [FEATURE] Integração Bancária - API DDA Real
Prioridade: High
Labels: Feature, Integration

Descrição:
## Objetivo
Implementar integração real com APIs bancárias para DDA.

## Pré-requisitos (Ação do Usuário - Paulo)
- [ ] Cadastro no portal de desenvolvedores dos bancos
- [ ] Obter documentação das APIs
- [ ] Obter chaves de API/credenciais
- [ ] Definir bancos prioritários (Itaú, Bradesco, BB, Santander?)

## Bancos a Cadastrar
| Banco | Portal | Status |
|-------|--------|--------|
| Itaú | developers.itau.com.br | ⏳ Pendente |
| Bradesco | developers.bradesco.com.br | ⏳ Pendente |
| Banco do Brasil | developers.bb.com.br | ⏳ Pendente |
| Santander | developer.santander.com.br | ⏳ Pendente |

## Estrutura Existente
- Tabelas DDA criadas (dda_boletos, dda_config, dda_sync_log)
- Router DDA implementado
- Página UI em /treasury/dda

## Próximos Passos (após credenciais)
1. Implementar client para cada banco
2. Sincronização automática de boletos
3. Conciliação com contas a pagar
```

---

### 5. Arquivo sped.ts

**Status:** ✅ Arquivo salvo e completo (331 linhas)

O arquivo `@/Users/pdv/CascadeProjects/poc-delphi-frm/src/server/services/sped.ts:1-331` está íntegro. O conteúdo visualizado no IDE corresponde ao arquivo salvo.

**Funcionalidades implementadas:**
- `gerarArquivoSped()` - Gera arquivo SPED Fiscal
- `listarPeriodosDisponiveis()` - Lista períodos com dados
- Suporte a entradas, saídas e inventário

---

## Plano de Ação - Próximos Passos

### Prioridade Alta (Esta Semana)

| # | Tarefa | Issue | Responsável | Status |
|---|--------|-------|-------------|--------|
| 1 | Marcar VIO-463 como Done | VIO-463 | Cascade | 🔄 |
| 2 | Criar issue Integração SEFAZ | Nova | Cascade | 🔄 |
| 3 | Criar/atualizar issue DDA Bancário | Nova | Cascade | 🔄 |
| 4 | Decidir arquitetura relatórios salvos | VIO-595 | Paulo | ⏳ |

### Prioridade Média (Próximas 2 Semanas)

| # | Tarefa | Issue | Dependência |
|---|--------|-------|-------------|
| 5 | Páginas individuais de relatórios | VIO-595 | Decisão #4 |
| 6 | Export PDF/Excel nos relatórios | VIO-595 | #5 |
| 7 | Testes E2E automatizados | Nova | - |

### Prioridade Baixa (Backlog)

| # | Tarefa | Dependência |
|---|--------|-------------|
| 8 | Integração SEFAZ real | Certificado digital |
| 9 | Integração DDA real | Credenciais bancárias |
| 10 | App mobile para almoxarifado | - |

---

## Ações do Usuário Pendentes

1. **VIO-595:** Confirmar se deseja relatórios salvos por usuário
2. **Integração SEFAZ:** Providenciar certificado digital quando necessário
3. **Integração DDA:** Efetuar cadastro nos portais dos bancos e obter credenciais

---

## Issues a Criar no Linear

### Issue 1: Integração SEFAZ
- **Título:** `[FEATURE] Integração SEFAZ - Busca Automática de NFe`
- **Prioridade:** Medium
- **Status:** Backlog (aguardando certificado)

### Issue 2: Integração DDA Bancário
- **Título:** `[FEATURE] Integração Bancária - API DDA Real`
- **Prioridade:** High
- **Descrição:** Incluir demanda do usuário para cadastro nos bancos

---

*Documento gerado em 22/01/2026 às 17:45*
