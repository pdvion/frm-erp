import OpenAI from "openai";

export interface FormField {
  id: string;
  name: string;
  label: string;
  type: "text" | "textarea" | "number" | "select" | "date" | "checkbox";
  required: boolean;
  options?: string[];
}

export interface GeneratedStep {
  id: string;
  code: string;
  name: string;
  type: "START" | "END" | "ACTION" | "CONDITION" | "APPROVAL" | "NOTIFICATION";
  assigneeType?: "USER" | "ROLE" | "DEPARTMENT" | "MANAGER";
  assigneeRole?: string;
  formFields?: FormField[];
  config?: Record<string, unknown>;
  position: { x: number; y: number };
}

export interface GeneratedTransition {
  id: string;
  fromStepId: string;
  toStepId: string;
  condition?: string;
  label?: string;
}

export interface GeneratedWorkflow {
  name: string;
  description: string;
  category: "PURCHASE" | "PAYMENT" | "HR" | "PRODUCTION" | "SALES" | "GENERAL";
  steps: GeneratedStep[];
  transitions: GeneratedTransition[];
}

const SYSTEM_PROMPT = `Você é um especialista em modelagem de processos de negócio (BPMN/Workflow).
Dado a descrição de um processo em linguagem natural, gere um workflow estruturado em JSON.

REGRAS IMPORTANTES:
1. Todo workflow DEVE começar com exatamente UM nó START e terminar com exatamente UM nó END
2. Use APPROVAL para etapas que precisam de aprovação/validação humana
3. Use ACTION para tarefas executadas por alguém (preencher formulário, executar ação)
4. Use CONDITION para decisões/bifurcações (ex: valor > 1000, aprovado/rejeitado)
5. Use NOTIFICATION para alertas e notificações (email, push, etc)
6. Posicione os nós em layout vertical: x=250 para todos, y começa em 50 e incrementa 120 para cada nível
7. Para bifurcações (CONDITION), posicione ramos em x=100 (esquerda) e x=400 (direita)
8. Gere campos de formulário relevantes para cada etapa ACTION e APPROVAL
9. IDs devem ser únicos no formato: start-1, end-1, approval-1, action-1, condition-1, notification-1
10. Códigos devem ser sequenciais: STEP_1, STEP_2, etc.

TIPOS DE ASSIGNEE:
- MANAGER: Gestor direto do solicitante
- DEPARTMENT: Departamento específico (ex: RH, Financeiro, DP)
- ROLE: Cargo específico (ex: Diretor, Gerente)
- USER: Usuário específico

CAMPOS DE FORMULÁRIO COMUNS:
- Para solicitações: motivo, justificativa, valor, data_desejada
- Para aprovações: parecer, observacoes, aprovado (checkbox)
- Para RH: percentual_reajuste, novo_salario, data_vigencia
- Para notificações: não precisa de campos

CATEGORIAS:
- PURCHASE: Compras, requisições de materiais
- PAYMENT: Pagamentos, reembolsos, despesas
- HR: RH, férias, reajustes, admissões, demissões
- PRODUCTION: Produção, qualidade, manutenção
- SALES: Vendas, propostas, contratos
- GENERAL: Outros processos

Responda APENAS com o JSON válido, sem markdown ou explicações.`;

const EXAMPLE_OUTPUT = `{
  "name": "Aprovação de Reajuste Salarial",
  "description": "Fluxo de aprovação para solicitações de reajuste salarial",
  "category": "HR",
  "steps": [
    {
      "id": "start-1",
      "code": "STEP_1",
      "name": "Início",
      "type": "START",
      "position": { "x": 250, "y": 50 }
    },
    {
      "id": "action-1",
      "code": "STEP_2",
      "name": "Solicitação de Reajuste",
      "type": "ACTION",
      "assigneeType": "USER",
      "formFields": [
        { "id": "f1", "name": "motivo", "label": "Motivo do Reajuste", "type": "textarea", "required": true },
        { "id": "f2", "name": "percentual_solicitado", "label": "Percentual Solicitado (%)", "type": "number", "required": true }
      ],
      "position": { "x": 250, "y": 170 }
    },
    {
      "id": "approval-1",
      "code": "STEP_3",
      "name": "Aprovação do Gestor",
      "type": "APPROVAL",
      "assigneeType": "MANAGER",
      "formFields": [
        { "id": "f3", "name": "justificativa", "label": "Justificativa", "type": "textarea", "required": true },
        { "id": "f4", "name": "percentual_aprovado", "label": "Percentual Aprovado (%)", "type": "number", "required": true }
      ],
      "position": { "x": 250, "y": 290 }
    },
    {
      "id": "approval-2",
      "code": "STEP_4",
      "name": "Validação RH",
      "type": "APPROVAL",
      "assigneeType": "DEPARTMENT",
      "assigneeRole": "RH",
      "formFields": [
        { "id": "f5", "name": "parecer", "label": "Parecer", "type": "textarea", "required": true }
      ],
      "position": { "x": 250, "y": 410 }
    },
    {
      "id": "action-2",
      "code": "STEP_5",
      "name": "Execução no Sistema",
      "type": "ACTION",
      "assigneeType": "DEPARTMENT",
      "assigneeRole": "DP",
      "formFields": [
        { "id": "f6", "name": "data_vigencia", "label": "Data de Vigência", "type": "date", "required": true }
      ],
      "position": { "x": 250, "y": 530 }
    },
    {
      "id": "notification-1",
      "code": "STEP_6",
      "name": "Notificar Funcionário",
      "type": "NOTIFICATION",
      "config": { "channel": "email", "template": "reajuste_aprovado" },
      "position": { "x": 250, "y": 650 }
    },
    {
      "id": "end-1",
      "code": "STEP_7",
      "name": "Fim",
      "type": "END",
      "position": { "x": 250, "y": 770 }
    }
  ],
  "transitions": [
    { "id": "t1", "fromStepId": "start-1", "toStepId": "action-1" },
    { "id": "t2", "fromStepId": "action-1", "toStepId": "approval-1" },
    { "id": "t3", "fromStepId": "approval-1", "toStepId": "approval-2" },
    { "id": "t4", "fromStepId": "approval-2", "toStepId": "action-2" },
    { "id": "t5", "fromStepId": "action-2", "toStepId": "notification-1" },
    { "id": "t6", "fromStepId": "notification-1", "toStepId": "end-1" }
  ]
}`;

export async function generateWorkflowFromPrompt(
  prompt: string,
  apiKey: string
): Promise<GeneratedWorkflow> {
  const openai = new OpenAI({ apiKey });

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Exemplo de saída esperada:\n${EXAMPLE_OUTPUT}\n\nAgora gere um workflow para:\n${prompt}`,
      },
    ],
    temperature: 0.7,
    max_tokens: 4000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Resposta vazia da IA");
  }

  // Remove markdown code blocks if present
  const jsonStr = content
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  try {
    const workflow = JSON.parse(jsonStr) as GeneratedWorkflow;
    return validateAndFixWorkflow(workflow);
  } catch {
    throw new Error(`Erro ao parsear resposta da IA: ${content.substring(0, 200)}`);
  }
}

function validateAndFixWorkflow(workflow: GeneratedWorkflow): GeneratedWorkflow {
  // Ensure required fields
  if (!workflow.name) {
    workflow.name = "Novo Workflow";
  }
  if (!workflow.description) {
    workflow.description = "";
  }
  if (!workflow.category) {
    workflow.category = "GENERAL";
  }
  if (!workflow.steps || workflow.steps.length === 0) {
    throw new Error("Workflow deve ter pelo menos um passo");
  }
  if (!workflow.transitions) {
    workflow.transitions = [];
  }

  // Ensure START and END nodes exist
  const hasStart = workflow.steps.some((s) => s.type === "START");
  const hasEnd = workflow.steps.some((s) => s.type === "END");

  if (!hasStart) {
    workflow.steps.unshift({
      id: "start-auto",
      code: "STEP_0",
      name: "Início",
      type: "START",
      position: { x: 250, y: 50 },
    });
  }

  if (!hasEnd) {
    const maxY = Math.max(...workflow.steps.map((s) => s.position?.y || 0));
    workflow.steps.push({
      id: "end-auto",
      code: `STEP_${workflow.steps.length + 1}`,
      name: "Fim",
      type: "END",
      position: { x: 250, y: maxY + 120 },
    });
  }

  // Ensure all steps have positions
  workflow.steps = workflow.steps.map((step, index) => ({
    ...step,
    position: step.position || { x: 250, y: 50 + index * 120 },
  }));

  // Ensure all transitions have IDs
  workflow.transitions = workflow.transitions.map((t, index) => ({
    ...t,
    id: t.id || `t-auto-${index}`,
  }));

  return workflow;
}

export async function refineWorkflow(
  currentWorkflow: GeneratedWorkflow,
  refinementPrompt: string,
  apiKey: string
): Promise<GeneratedWorkflow> {
  const openai = new OpenAI({ apiKey });

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Workflow atual:\n${JSON.stringify(currentWorkflow, null, 2)}\n\nRefinamento solicitado:\n${refinementPrompt}\n\nGere o workflow atualizado com as modificações solicitadas.`,
      },
    ],
    temperature: 0.7,
    max_tokens: 4000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Resposta vazia da IA");
  }

  const jsonStr = content
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  try {
    const workflow = JSON.parse(jsonStr) as GeneratedWorkflow;
    return validateAndFixWorkflow(workflow);
  } catch {
    throw new Error(`Erro ao parsear resposta da IA: ${content.substring(0, 200)}`);
  }
}

export const PROMPT_SUGGESTIONS = [
  {
    title: "Aprovação de Compras",
    prompt: "Crie um fluxo de aprovação de compras onde o solicitante preenche a requisição, o gestor aprova, e se o valor for maior que R$ 5.000 precisa de aprovação da diretoria. Após aprovado, o comprador executa a compra.",
  },
  {
    title: "Reajuste Salarial",
    prompt: "Fluxo de reajuste salarial: funcionário solicita com justificativa, gestor analisa e aprova com parecer, RH valida, DP executa no sistema e notifica o funcionário por email.",
  },
  {
    title: "Solicitação de Férias",
    prompt: "Processo de solicitação de férias: funcionário solicita período desejado, gestor aprova considerando a equipe, RH valida saldo de dias, e sistema agenda as férias.",
  },
  {
    title: "Aprovação de Despesas",
    prompt: "Fluxo de reembolso de despesas: funcionário envia comprovantes e valores, gestor aprova, financeiro valida documentação, e efetua o pagamento.",
  },
  {
    title: "Onboarding de Funcionário",
    prompt: "Processo de admissão: RH cadastra novo funcionário, TI cria acessos, gestor define treinamentos, funcionário confirma recebimento de equipamentos.",
  },
  {
    title: "Aprovação de Proposta Comercial",
    prompt: "Fluxo de proposta comercial: vendedor cria proposta, gerente comercial aprova desconto se houver, diretoria aprova se valor acima de R$ 50.000, cliente recebe proposta.",
  },
];
