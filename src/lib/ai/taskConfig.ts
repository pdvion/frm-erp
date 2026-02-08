/**
 * Configuração de IA por Tipo de Tarefa
 * VIO-896: AI Router Fase 2 - Roteamento por Tipo de Tarefa
 */

export const AI_TASK_TYPES = {
  MATERIAL_CLASSIFICATION: {
    id: "MATERIAL_CLASSIFICATION",
    label: "Classificação de Materiais",
    description: "Classificar itens de NFe para materiais do estoque",
  },
  PRODUCT_DESCRIPTION: {
    id: "PRODUCT_DESCRIPTION",
    label: "Descrição de Produtos",
    description: "Gerar descrições para o catálogo de produtos",
  },
  DOCUMENT_ANALYSIS: {
    id: "DOCUMENT_ANALYSIS",
    label: "Análise de Documentos",
    description: "Analisar documentos do GED (contratos, relatórios)",
  },
  DATA_EXTRACTION: {
    id: "DATA_EXTRACTION",
    label: "Extração de Dados",
    description: "Extrair dados estruturados de XML e documentos",
  },
  CHART_GENERATION: {
    id: "CHART_GENERATION",
    label: "Geração de Gráficos",
    description: "Gerar configurações de gráficos a partir de dados",
  },
  COST_CENTER_SUGGESTION: {
    id: "COST_CENTER_SUGGESTION",
    label: "Sugestão de Centro de Custo",
    description: "Sugerir centro de custo para lançamentos",
  },
  FISCAL_RULE_INFERENCE: {
    id: "FISCAL_RULE_INFERENCE",
    label: "Inferência de Regras Fiscais",
    description: "Inferir regras fiscais (CFOP, CST, etc.)",
  },
  CHAT_ASSISTANT: {
    id: "CHAT_ASSISTANT",
    label: "Assistente de Chat",
    description: "Assistente geral para perguntas e respostas",
  },
} as const;

export type AITaskType = keyof typeof AI_TASK_TYPES;

export interface AITaskConfig {
  preferredProvider: "openai" | "anthropic" | "google";
  preferredModel: string;
  reason: string;
  temperature: number;
}

export const DEFAULT_TASK_CONFIG: Record<AITaskType, AITaskConfig> = {
  MATERIAL_CLASSIFICATION: {
    preferredProvider: "google",
    preferredModel: "gemini-2.0-flash-exp",
    reason: "Rápido e preciso para classificação estruturada",
    temperature: 0.2,
  },
  PRODUCT_DESCRIPTION: {
    preferredProvider: "google",
    preferredModel: "gemini-1.5-pro",
    reason: "Contexto amplo e criativo para textos de marketing",
    temperature: 0.7,
  },
  DOCUMENT_ANALYSIS: {
    preferredProvider: "google",
    preferredModel: "gemini-1.5-pro",
    reason: "Contexto de 1M tokens para documentos longos",
    temperature: 0.3,
  },
  DATA_EXTRACTION: {
    preferredProvider: "google",
    preferredModel: "gemini-2.0-flash-exp",
    reason: "Rápido e preciso para extração estruturada",
    temperature: 0.1,
  },
  CHART_GENERATION: {
    preferredProvider: "google",
    preferredModel: "gemini-2.0-flash-exp",
    reason: "Rápido em gerar JSON estruturado",
    temperature: 0.3,
  },
  COST_CENTER_SUGGESTION: {
    preferredProvider: "google",
    preferredModel: "gemini-2.0-flash-exp",
    reason: "Rápido para sugestões simples",
    temperature: 0.2,
  },
  FISCAL_RULE_INFERENCE: {
    preferredProvider: "google",
    preferredModel: "gemini-1.5-pro",
    reason: "Preciso em regras fiscais complexas",
    temperature: 0.1,
  },
  CHAT_ASSISTANT: {
    preferredProvider: "google",
    preferredModel: "gemini-1.5-pro",
    reason: "Natural e seguro para conversação",
    temperature: 0.5,
  },
};

export const AI_PROVIDERS = ["openai", "anthropic", "google"] as const;
export type AIProvider = (typeof AI_PROVIDERS)[number];

export function getTaskConfigKey(task: AITaskType): string {
  return `ai_task_${task.toLowerCase()}`;
}
