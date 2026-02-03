# Plano de Integração: IA para Criação de Workflows em Linguagem Natural

## Visão Geral

Permitir que usuários criem workflows completos descrevendo o processo em linguagem natural, como:

> "Crie um fluxo de aprovação de reajuste salarial onde o funcionário solicita, o gestor analisa e justifica, depois o RH aprova e por fim o DP executa a alteração no sistema"

A IA interpreta a descrição e gera automaticamente:
- Nós do workflow (Start, Approval, Action, Condition, Notification, End)
- Conexões entre os nós
- Campos de formulário para cada etapa
- Configurações de aprovadores

---

## Arquitetura Proposta

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend                                  │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────┐                     │
│  │ Chat/Prompt Box │───▶│ WorkflowEditor  │                     │
│  │ (linguagem      │    │ (React Flow)    │                     │
│  │  natural)       │    │                 │                     │
│  └─────────────────┘    └─────────────────┘                     │
│           │                      ▲                               │
│           ▼                      │                               │
│  ┌─────────────────────────────────────────┐                    │
│  │         tRPC: workflow.generateFromAI   │                    │
│  └─────────────────────────────────────────┘                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Backend                                   │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────┐                    │
│  │         AI Workflow Generator           │                    │
│  │  src/lib/ai/workflowGenerator.ts        │                    │
│  └─────────────────────────────────────────┘                    │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────────────────────────────┐                    │
│  │         OpenAI / Anthropic API          │                    │
│  │         (structured output)             │                    │
│  └─────────────────────────────────────────┘                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Fases de Implementação

### Fase 1: Gerador de Workflows com IA (Backend)

**Arquivo:** `src/lib/ai/workflowGenerator.ts`

```typescript
interface GeneratedWorkflow {
  name: string;
  description: string;
  category: "PURCHASE" | "PAYMENT" | "HR" | "PRODUCTION" | "SALES" | "GENERAL";
  steps: GeneratedStep[];
  transitions: GeneratedTransition[];
}

interface GeneratedStep {
  id: string;
  code: string;
  name: string;
  type: "START" | "END" | "ACTION" | "CONDITION" | "APPROVAL" | "NOTIFICATION";
  assigneeType?: "USER" | "ROLE" | "DEPARTMENT" | "DYNAMIC";
  assigneeRole?: string;
  formFields?: FormField[];
  position: { x: number; y: number };
}

interface GeneratedTransition {
  fromStepId: string;
  toStepId: string;
  condition?: string;
  label?: string;
}

async function generateWorkflowFromPrompt(
  prompt: string,
  context?: { companyId: string; userId: string }
): Promise<GeneratedWorkflow>
```

**Prompt Engineering:**
```
Você é um especialista em modelagem de processos de negócio (BPMN).
Dado a descrição de um processo, gere um workflow estruturado.

Regras:
1. Todo workflow começa com um nó START e termina com um nó END
2. Use APPROVAL para etapas que precisam de aprovação humana
3. Use ACTION para tarefas executadas por alguém
4. Use CONDITION para decisões (ex: valor > 1000)
5. Use NOTIFICATION para alertas
6. Posicione os nós verticalmente (y += 120 para cada nível)
7. Gere campos de formulário relevantes para cada etapa

Descrição do processo:
{prompt}

Responda em JSON seguindo o schema fornecido.
```

### Fase 2: Endpoint tRPC

**Arquivo:** `src/server/routers/workflow.ts`

```typescript
generateFromAI: tenantProcedure
  .input(z.object({
    prompt: z.string().min(10).max(2000),
    refine: z.boolean().optional(), // Para refinamentos iterativos
    existingWorkflowId: z.string().optional(), // Para modificar workflow existente
  }))
  .mutation(async ({ input, ctx }) => {
    const workflow = await generateWorkflowFromPrompt(input.prompt, {
      companyId: ctx.companyId,
      userId: ctx.tenant?.userId ?? "",
    });
    return workflow;
  }),
```

### Fase 3: Interface de Chat no Editor Visual

**Arquivo:** `src/components/workflow/AIChatPanel.tsx`

```tsx
interface AIChatPanelProps {
  onWorkflowGenerated: (workflow: GeneratedWorkflow) => void;
  currentWorkflow?: GeneratedWorkflow;
}

function AIChatPanel({ onWorkflowGenerated, currentWorkflow }: AIChatPanelProps) {
  // Chat com histórico de mensagens
  // Sugestões de prompts
  // Botão "Aplicar ao Canvas"
  // Refinamentos: "Adicione uma etapa de notificação por email"
}
```

**Exemplos de Prompts Sugeridos:**
- "Aprovação de compras com alçada por valor"
- "Solicitação de férias com aprovação do gestor"
- "Onboarding de novo funcionário"
- "Requisição de reajuste salarial"
- "Aprovação de despesas de viagem"

### Fase 4: Refinamento Iterativo

Permitir que o usuário refine o workflow gerado:

```
Usuário: "Crie um fluxo de aprovação de compras"
IA: [Gera workflow básico]

Usuário: "Adicione uma condição: se valor > R$ 5.000, precisa de aprovação da diretoria"
IA: [Adiciona nó CONDITION e nó APPROVAL extra]

Usuário: "Inclua notificação por email quando aprovado"
IA: [Adiciona nó NOTIFICATION]
```

---

## Componentes a Criar

| Componente | Descrição | Prioridade |
|------------|-----------|------------|
| `src/lib/ai/workflowGenerator.ts` | Gerador de workflows com OpenAI | Alta |
| `src/server/routers/workflow.ts` | Endpoint `generateFromAI` | Alta |
| `src/components/workflow/AIChatPanel.tsx` | Painel de chat no editor | Alta |
| `src/components/workflow/PromptSuggestions.tsx` | Sugestões de prompts | Média |
| `src/lib/ai/workflowRefiner.ts` | Refinamento iterativo | Média |
| `src/components/workflow/AIPreview.tsx` | Preview antes de aplicar | Baixa |

---

## Fluxo de Uso

```
1. Usuário acessa /workflow/definitions/new/visual
2. Clica em "Criar com IA" ou ícone de chat
3. Abre painel lateral com chat
4. Digita descrição do processo desejado
5. IA gera workflow e mostra preview
6. Usuário pode:
   a) Aplicar ao canvas
   b) Refinar com mais instruções
   c) Editar manualmente após aplicar
7. Salva workflow normalmente
```

---

## Estimativa de Esforço

| Fase | Descrição | Tempo Estimado |
|------|-----------|----------------|
| 1 | Gerador de Workflows (backend) | 4h |
| 2 | Endpoint tRPC | 1h |
| 3 | Interface de Chat | 4h |
| 4 | Refinamento Iterativo | 3h |
| 5 | Testes e Ajustes | 2h |
| **Total** | | **14h** |

---

## Dependências

- OpenAI SDK (já instalado: v6.16.0)
- Tokens de IA configurados em `/settings/ai`
- React Flow (já instalado: @xyflow/react v12.10.0)

---

## Próximos Passos

1. [ ] Criar `src/lib/ai/workflowGenerator.ts`
2. [ ] Adicionar endpoint `generateFromAI` no router
3. [ ] Criar componente `AIChatPanel`
4. [ ] Integrar chat no editor visual
5. [ ] Adicionar sugestões de prompts
6. [ ] Implementar refinamento iterativo
7. [ ] Testes com diferentes tipos de workflows

---

## Exemplos de Uso

### Exemplo 1: Aprovação de Compras
```
Prompt: "Crie um fluxo de aprovação de compras onde o solicitante preenche 
a requisição, o gestor aprova, e se o valor for maior que R$ 10.000 precisa 
de aprovação da diretoria. Após aprovado, o comprador executa a compra."

Resultado:
- START → Requisição de Compra (ACTION)
- → Aprovação Gestor (APPROVAL)
- → Condição Valor > 10000 (CONDITION)
  - Sim → Aprovação Diretoria (APPROVAL)
  - Não → Execução Compra (ACTION)
- → Execução Compra (ACTION)
- → END
```

### Exemplo 2: Reajuste Salarial
```
Prompt: "Fluxo de reajuste salarial: funcionário solicita, gestor justifica 
e aprova, RH valida, DP executa no sistema e notifica o funcionário."

Resultado:
- START → Solicitação (ACTION com form: motivo, percentual)
- → Análise Gestor (APPROVAL com form: justificativa, parecer)
- → Validação RH (APPROVAL)
- → Execução DP (ACTION)
- → Notificação Funcionário (NOTIFICATION)
- → END
```
