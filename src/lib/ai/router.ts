/**
 * AI Router - Roteamento inteligente com fallback automático
 * VIO-894: Fallback Automático entre Providers
 */

import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { AI_PROVIDERS, getDefaultModel, type AIProvider } from "./models";

export interface AIRouterConfig {
  primaryProvider: AIProvider;
  primaryModel: string;
  fallbackProvider?: AIProvider;
  fallbackModel?: string;
  enableFallback?: boolean;
  maxRetries?: number;
  timeoutMs?: number;
}

export interface AITokens {
  openai?: string;
  anthropic?: string;
  google?: string;
}

export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIResponse {
  content: string;
  provider: AIProvider;
  model: string;
  wasFallback: boolean;
  fallbackReason?: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  latencyMs: number;
}

export interface AICallOptions {
  messages: AIMessage[];
  temperature?: number;
  maxTokens?: number;
  responseFormat?: "text" | "json";
}

const DEFAULT_FALLBACK_ORDER: AIProvider[] = ["anthropic", "openai", "google"];
const DEFAULT_TIMEOUT_MS = 30000;
const DEFAULT_MAX_RETRIES = 1;

/**
 * Chama um provider específico
 */
async function callProvider(
  provider: AIProvider,
  model: string,
  tokens: AITokens,
  options: AICallOptions,
  timeoutMs: number
): Promise<Omit<AIResponse, "wasFallback" | "fallbackReason" | "latencyMs">> {
  const token = tokens[provider];
  if (!token) {
    throw new Error(`Token não configurado para ${provider}`);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    switch (provider) {
      case "openai":
        return await callOpenAI(token, model, options, controller.signal);
      case "anthropic":
        return await callAnthropic(token, model, options, controller.signal);
      case "google":
        return await callGoogle(token, model, options);
      default:
        throw new Error(`Provider não suportado: ${provider}`);
    }
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Chama OpenAI
 */
async function callOpenAI(
  apiKey: string,
  model: string,
  options: AICallOptions,
  signal: AbortSignal
): Promise<Omit<AIResponse, "wasFallback" | "fallbackReason" | "latencyMs">> {
  const openai = new OpenAI({ apiKey });

  const response = await openai.chat.completions.create(
    {
      model,
      messages: options.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      temperature: options.temperature ?? 0.3,
      max_tokens: options.maxTokens ?? 2000,
      response_format:
        options.responseFormat === "json" ? { type: "json_object" } : undefined,
    },
    { signal }
  );

  return {
    content: response.choices[0]?.message?.content ?? "",
    provider: "openai",
    model,
    usage: {
      inputTokens: response.usage?.prompt_tokens ?? 0,
      outputTokens: response.usage?.completion_tokens ?? 0,
      totalTokens: response.usage?.total_tokens ?? 0,
    },
  };
}

/**
 * Chama Anthropic (Claude)
 */
async function callAnthropic(
  apiKey: string,
  model: string,
  options: AICallOptions,
  signal: AbortSignal
): Promise<Omit<AIResponse, "wasFallback" | "fallbackReason" | "latencyMs">> {
  const anthropic = new Anthropic({ apiKey });

  // Separar system message das outras
  const systemMessage = options.messages.find((m) => m.role === "system");
  const otherMessages = options.messages.filter((m) => m.role !== "system");

  const response = await anthropic.messages.create(
    {
      model,
      max_tokens: options.maxTokens ?? 2000,
      system: systemMessage?.content,
      messages: otherMessages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    },
    { signal }
  );

  const content =
    response.content[0]?.type === "text" ? response.content[0].text : "";

  return {
    content,
    provider: "anthropic",
    model,
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      totalTokens: response.usage.input_tokens + response.usage.output_tokens,
    },
  };
}

/**
 * Chama Google (Gemini)
 */
async function callGoogle(
  apiKey: string,
  model: string,
  options: AICallOptions
): Promise<Omit<AIResponse, "wasFallback" | "fallbackReason" | "latencyMs">> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const genModel = genAI.getGenerativeModel({ model });

  // Combinar mensagens em um prompt
  const systemMessage = options.messages.find((m) => m.role === "system");
  const userMessages = options.messages.filter((m) => m.role === "user");

  let prompt = "";
  if (systemMessage) {
    prompt += `System: ${systemMessage.content}\n\n`;
  }
  for (const msg of userMessages) {
    prompt += `${msg.content}\n`;
  }

  const result = await genModel.generateContent(prompt);
  const response = result.response;
  const content = response.text();

  // Gemini não retorna usage detalhado na API básica
  return {
    content,
    provider: "google",
    model,
    usage: {
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
    },
  };
}

/**
 * Obtém a lista de providers disponíveis (com token configurado)
 */
function getAvailableProviders(tokens: AITokens): AIProvider[] {
  return AI_PROVIDERS.filter((p) => !!tokens[p]);
}

/**
 * Chama AI com fallback automático
 */
export async function callWithFallback(
  config: AIRouterConfig,
  tokens: AITokens,
  options: AICallOptions
): Promise<AIResponse> {
  const startTime = Date.now();
  const availableProviders = getAvailableProviders(tokens);
  const timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxRetries = config.maxRetries ?? DEFAULT_MAX_RETRIES;
  const enableFallback = config.enableFallback ?? true;

  // Construir lista de providers para tentar
  const providersToTry: { provider: AIProvider; model: string }[] = [];

  // 1. Provider principal
  if (availableProviders.includes(config.primaryProvider)) {
    providersToTry.push({
      provider: config.primaryProvider,
      model: config.primaryModel,
    });
  }

  // 2. Fallback configurado
  if (
    enableFallback &&
    config.fallbackProvider &&
    availableProviders.includes(config.fallbackProvider)
  ) {
    providersToTry.push({
      provider: config.fallbackProvider,
      model: config.fallbackModel ?? getDefaultModel(config.fallbackProvider),
    });
  }

  // 3. Outros providers disponíveis (ordem padrão)
  if (enableFallback) {
    for (const provider of DEFAULT_FALLBACK_ORDER) {
      if (
        availableProviders.includes(provider) &&
        !providersToTry.some((p) => p.provider === provider)
      ) {
        providersToTry.push({
          provider,
          model: getDefaultModel(provider),
        });
      }
    }
  }

  if (providersToTry.length === 0) {
    throw new Error("Nenhum provider de IA disponível");
  }

  let lastError: Error | null = null;
  let fallbackReason: string | undefined;

  for (let i = 0; i < providersToTry.length; i++) {
    const { provider, model } = providersToTry[i];
    const isFallback = i > 0;

    for (let retry = 0; retry <= maxRetries; retry++) {
      try {
        const response = await callProvider(
          provider,
          model,
          tokens,
          options,
          timeoutMs
        );

        return {
          ...response,
          wasFallback: isFallback,
          fallbackReason: isFallback ? fallbackReason : undefined,
          latencyMs: Date.now() - startTime,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        fallbackReason = `${provider}: ${lastError.message}`;

        // Se é o último retry deste provider, continua para o próximo
        if (retry === maxRetries) {
          console.warn(
            `[AI Router] Provider ${provider} falhou após ${maxRetries + 1} tentativas:`,
            lastError.message
          );
          break;
        }

        // Aguarda antes de retry
        await new Promise((resolve) => setTimeout(resolve, 1000 * (retry + 1)));
      }
    }
  }

  throw new Error(
    `Todos os providers falharam. Último erro: ${lastError?.message}`
  );
}

/**
 * Helper para criar config a partir de settings do banco
 */
export function createRouterConfig(settings: {
  defaultProvider: AIProvider;
  openaiModel?: string;
  anthropicModel?: string;
  googleModel?: string;
  fallbackProvider?: AIProvider;
  enableFallback?: boolean;
}): AIRouterConfig {
  const modelMap: Record<AIProvider, string | undefined> = {
    openai: settings.openaiModel,
    anthropic: settings.anthropicModel,
    google: settings.googleModel,
  };

  return {
    primaryProvider: settings.defaultProvider,
    primaryModel:
      modelMap[settings.defaultProvider] ??
      getDefaultModel(settings.defaultProvider),
    fallbackProvider: settings.fallbackProvider,
    fallbackModel: settings.fallbackProvider
      ? modelMap[settings.fallbackProvider]
      : undefined,
    enableFallback: settings.enableFallback ?? true,
  };
}
