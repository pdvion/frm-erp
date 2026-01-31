/**
 * Configuração de modelos de IA por provider
 * VIO-893: AI Router - Seleção de Modelo
 */

export const AI_PROVIDERS = ["openai", "anthropic", "google"] as const;
export type AIProvider = (typeof AI_PROVIDERS)[number];

export interface AIModel {
  id: string;
  name: string;
  description: string;
  contextWindow: number;
  recommended?: boolean;
  fastest?: boolean;
  cheapest?: boolean;
  costPer1MInput: number; // USD por 1M tokens de input
  costPer1MOutput: number; // USD por 1M tokens de output
}

export const AI_MODELS: Record<AIProvider, AIModel[]> = {
  openai: [
    {
      id: "gpt-4o",
      name: "GPT-4o",
      description: "Mais capaz, multimodal",
      contextWindow: 128000,
      recommended: true,
      costPer1MInput: 2.5,
      costPer1MOutput: 10.0,
    },
    {
      id: "gpt-4o-mini",
      name: "GPT-4o Mini",
      description: "Rápido e econômico",
      contextWindow: 128000,
      fastest: true,
      cheapest: true,
      costPer1MInput: 0.15,
      costPer1MOutput: 0.6,
    },
    {
      id: "gpt-4-turbo",
      name: "GPT-4 Turbo",
      description: "Contexto longo (128k)",
      contextWindow: 128000,
      costPer1MInput: 10.0,
      costPer1MOutput: 30.0,
    },
    {
      id: "gpt-3.5-turbo",
      name: "GPT-3.5 Turbo",
      description: "Legado, mais barato",
      contextWindow: 16385,
      costPer1MInput: 0.5,
      costPer1MOutput: 1.5,
    },
  ],
  anthropic: [
    {
      id: "claude-3-5-sonnet-20241022",
      name: "Claude 3.5 Sonnet",
      description: "Melhor custo-benefício",
      contextWindow: 200000,
      recommended: true,
      costPer1MInput: 3.0,
      costPer1MOutput: 15.0,
    },
    {
      id: "claude-3-5-haiku-20241022",
      name: "Claude 3.5 Haiku",
      description: "Mais rápido e barato",
      contextWindow: 200000,
      fastest: true,
      cheapest: true,
      costPer1MInput: 0.25,
      costPer1MOutput: 1.25,
    },
    {
      id: "claude-3-opus-20240229",
      name: "Claude 3 Opus",
      description: "Mais capaz, mais caro",
      contextWindow: 200000,
      costPer1MInput: 15.0,
      costPer1MOutput: 75.0,
    },
  ],
  google: [
    {
      id: "gemini-1.5-pro",
      name: "Gemini 1.5 Pro",
      description: "Contexto 1M tokens",
      contextWindow: 1000000,
      recommended: true,
      costPer1MInput: 1.25,
      costPer1MOutput: 5.0,
    },
    {
      id: "gemini-1.5-flash",
      name: "Gemini 1.5 Flash",
      description: "Rápido e econômico",
      contextWindow: 1000000,
      fastest: true,
      cheapest: true,
      costPer1MInput: 0.075,
      costPer1MOutput: 0.3,
    },
    {
      id: "gemini-2.0-flash-exp",
      name: "Gemini 2.0 Flash",
      description: "Experimental, multimodal",
      contextWindow: 1000000,
      costPer1MInput: 0.1,
      costPer1MOutput: 0.4,
    },
  ],
};

/**
 * Obtém o modelo padrão recomendado para um provider
 */
export function getDefaultModel(provider: AIProvider): string {
  const models = AI_MODELS[provider];
  const recommended = models.find((m) => m.recommended);
  return recommended?.id ?? models[0].id;
}

/**
 * Obtém informações de um modelo específico
 */
export function getModelInfo(
  provider: AIProvider,
  modelId: string
): AIModel | undefined {
  return AI_MODELS[provider].find((m) => m.id === modelId);
}

/**
 * Calcula o custo estimado de uma chamada
 */
export function calculateCost(
  provider: AIProvider,
  modelId: string,
  inputTokens: number,
  outputTokens: number
): number {
  const model = getModelInfo(provider, modelId);
  if (!model) return 0;

  return (
    (inputTokens * model.costPer1MInput + outputTokens * model.costPer1MOutput) /
    1_000_000
  );
}
