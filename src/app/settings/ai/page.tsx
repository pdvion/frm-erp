"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { PageHeader } from "@/components/PageHeader";
import {
  Bot,
  Key,
  Eye,
  EyeOff,
  Loader2,
  Save,
  Trash2,
  CheckCircle,
  AlertCircle,
  Sparkles,
  ChevronDown,
  Star,
  Zap,
  DollarSign,
  Info,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { AI_MODELS, type AIModel } from "@/lib/ai/models";

type AIProvider = "openai" | "anthropic" | "google";

const PROVIDERS: {
  id: AIProvider;
  name: string;
  description: string;
  placeholder: string;
  color: string;
  icon: string;
}[] = [
  {
    id: "openai",
    name: "OpenAI",
    description: "GPT-4o, GPT-4o Mini",
    placeholder: "sk-...",
    color: "bg-green-600",
    icon: "🤖",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    description: "Claude 3.5 Sonnet, Haiku",
    placeholder: "sk-ant-...",
    color: "bg-orange-600",
    icon: "🧠",
  },
  {
    id: "google",
    name: "Google",
    description: "Gemini 1.5 Pro, Flash",
    placeholder: "AIza...",
    color: "bg-blue-600",
    icon: "✨",
  },
];

export default function AIConfigPage() {
  const [tokens, setTokens] = useState<Record<string, string>>({
    openai: "",
    anthropic: "",
    google: "",
  });
  const [showTokens, setShowTokens] = useState<Record<string, boolean>>({
    openai: false,
    anthropic: false,
    google: false,
  });
  const [selectedModels, setSelectedModels] = useState<Record<AIProvider, string>>({
    openai: "",
    anthropic: "",
    google: "",
  });
  const [savingProvider, setSavingProvider] = useState<string | null>(null);
  const [savingModel, setSavingModel] = useState<string | null>(null);
  const [showCompareModal, setShowCompareModal] = useState(false);

  const { data: config, isLoading, refetch } = trpc.aiConfig.get.useQuery();

  // Sincronizar modelos selecionados com config
  useEffect(() => {
    if (config) {
      setSelectedModels({
        openai: config.openaiModel,
        anthropic: config.anthropicModel,
        google: config.googleModel,
      });
    }
  }, [config]);

  const saveTokenMutation = trpc.aiConfig.saveToken.useMutation({
    onSuccess: () => {
      toast.success("Token salvo com sucesso!");
      refetch();
      setSavingProvider(null);
    },
    onError: (error: { message: string }) => {
      toast.error("Erro ao salvar token", { description: error.message });
      setSavingProvider(null);
    },
  });

  const removeTokenMutation = trpc.aiConfig.removeToken.useMutation({
    onSuccess: () => {
      toast.success("Token removido!");
      refetch();
    },
    onError: (error: { message: string }) => {
      toast.error("Erro ao remover token", { description: error.message });
    },
  });

  const setDefaultMutation = trpc.aiConfig.setDefaultProvider.useMutation({
    onSuccess: () => {
      toast.success("Provedor padrão atualizado!");
      refetch();
    },
    onError: (error: { message: string }) => {
      toast.error("Erro ao definir provedor padrão", { description: error.message });
    },
  });

  const setModelMutation = trpc.aiConfig.setDefaultModel.useMutation({
    onSuccess: () => {
      toast.success("Modelo atualizado!");
      refetch();
      setSavingModel(null);
    },
    onError: (error: { message: string }) => {
      toast.error("Erro ao salvar modelo", { description: error.message });
      setSavingModel(null);
    },
  });

  const handleModelChange = (provider: AIProvider, model: string) => {
    setSelectedModels((prev) => ({ ...prev, [provider]: model }));
    setSavingModel(provider);
    setModelMutation.mutate({ provider, model });
  };

  const handleSaveToken = (provider: "openai" | "anthropic" | "google") => {
    const token = tokens[provider];
    if (!token) {
      toast.error("Digite um token válido");
      return;
    }
    setSavingProvider(provider);
    saveTokenMutation.mutate({ provider, token });
  };

  const handleRemoveToken = (provider: "openai" | "anthropic" | "google") => {
    if (confirm("Tem certeza que deseja remover este token?")) {
      removeTokenMutation.mutate({ provider });
      setTokens((prev) => ({ ...prev, [provider]: "" }));
    }
  };

  const isConfigured = (provider: string) => {
    if (!config) return false;
    if (provider === "openai") return !!config.openaiToken;
    if (provider === "anthropic") return !!config.anthropicToken;
    if (provider === "google") return !!config.googleToken;
    return false;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuração de IA"
        subtitle="Configure os tokens de API para integração com provedores de IA"
        icon={<Bot className="w-6 h-6" />}
        backHref="/settings"
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Geral */}
        <div className="bg-theme-card rounded-lg border border-theme p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              <h2 className="text-lg font-medium text-theme">Status da Integração</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCompareModal(true)}
              leftIcon={<BarChart3 className="w-4 h-4" />}
              className="text-blue-600 hover:text-blue-700"
            >
              Comparar modelos
            </Button>
          </div>
          
          {config?.isConfigured ? (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span>IA configurada - Provedor padrão: <strong>{config.defaultProvider}</strong></span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-yellow-600">
              <AlertCircle className="w-5 h-5" />
              <span>Nenhum provedor de IA configurado</span>
            </div>
          )}
        </div>

        {/* Modal de Comparativo de Modelos */}
        <ModelCompareModal
          isOpen={showCompareModal}
          onClose={() => setShowCompareModal(false)}
        />

        {/* Provedores */}
        <div className="space-y-4">
          {PROVIDERS.map((provider) => (
            <div
              key={provider.id}
              className="bg-theme-card rounded-lg border border-theme p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{provider.icon}</span>
                  <div>
                    <h3 className="font-medium text-theme">{provider.name}</h3>
                    <p className="text-sm text-theme-muted">{provider.description}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {isConfigured(provider.id) && (
                    <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                      <CheckCircle className="w-3 h-3" />
                      Configurado
                    </span>
                  )}
                  
                  {config?.defaultProvider === provider.id && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      Padrão
                    </span>
                  )}
                </div>
              </div>

              {/* Token Input */}
              <div className="flex gap-3 mb-4">
                <div className="flex-1 relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
                  <input
                    type={showTokens[provider.id] ? "text" : "password"}
                    value={tokens[provider.id]}
                    onChange={(e) =>
                      setTokens((prev) => ({ ...prev, [provider.id]: e.target.value }))
                    }
                    placeholder={
                      isConfigured(provider.id)
                        ? "Token configurado (digite novo para substituir)"
                        : provider.placeholder
                    }
                    className="w-full pl-10 pr-10 py-2 bg-theme-input border border-theme-input rounded-lg text-theme placeholder-theme-muted focus:ring-2 focus:ring-blue-500"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={() =>
                      setShowTokens((prev) => ({
                        ...prev,
                        [provider.id]: !prev[provider.id],
                      }))
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme p-1"
                  >
                    {showTokens[provider.id] ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                <Button
                  onClick={() => handleSaveToken(provider.id)}
                  disabled={!tokens[provider.id]}
                  isLoading={savingProvider === provider.id}
                  leftIcon={<Save className="w-4 h-4" />}
                >
                  Salvar
                </Button>

                {isConfigured(provider.id) && (
                  <>
                    <Button
                      onClick={() => handleRemoveToken(provider.id)}
                      variant="outline"
                      className="border-red-300 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>

                    {config?.defaultProvider !== provider.id && (
                      <Button
                        onClick={() => setDefaultMutation.mutate({ provider: provider.id })}
                        variant="outline"
                        size="sm"
                      >
                        Definir como padrão
                      </Button>
                    )}
                  </>
                )}
              </div>

              {/* Seleção de Modelo */}
              {isConfigured(provider.id) && config?.availableModels && (
                <div className="mt-4 pt-4 border-t border-theme">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-medium text-theme-secondary mb-1">
                        Modelo
                      </label>
                      <p className="text-xs text-theme-muted">
                        Selecione o modelo de IA para este provedor
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {savingModel === provider.id && (
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      )}
                      <div className="relative">
                        <select
                          value={selectedModels[provider.id]}
                          onChange={(e) => handleModelChange(provider.id, e.target.value)}
                          disabled={savingModel === provider.id}
                          className="appearance-none pl-3 pr-10 py-2 bg-theme-input border border-theme-input rounded-lg text-theme text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[240px] cursor-pointer disabled:opacity-50"
                        >
                          {config.availableModels[provider.id]?.map((model) => (
                            <option key={model.id} value={model.id}>
                              {model.name}
                              {model.recommended ? " ⭐ Recomendado" : ""}
                              {model.fastest ? " ⚡" : ""}
                              {model.cheapest ? " 💰" : ""}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted pointer-events-none" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Info do modelo selecionado */}
                  {config.availableModels[provider.id]?.find(
                    (m) => m.id === selectedModels[provider.id]
                  ) && (
                    <div className="mt-3 flex items-center gap-4 text-xs text-theme-muted">
                      {(() => {
                        const model = config.availableModels[provider.id].find(
                          (m) => m.id === selectedModels[provider.id]
                        );
                        if (!model) return null;
                        return (
                          <>
                            <span className="flex items-center gap-1">
                              <span className="font-medium">{model.description}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              ${model.costPer1MInput}/1M input
                            </span>
                            {model.recommended && (
                              <span className="flex items-center gap-1 text-yellow-600">
                                <Star className="w-3 h-3 fill-current" />
                                Recomendado
                              </span>
                            )}
                            {model.fastest && (
                              <span className="flex items-center gap-1 text-blue-600">
                                <Zap className="w-3 h-3" />
                                Mais rápido
                              </span>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Configuração de Fallback */}
        {config?.isConfigured && (
          <FallbackConfig
            enableFallback={config.enableFallback}
            fallbackProvider={config.fallbackProvider}
            configuredProviders={PROVIDERS.filter((p) => isConfigured(p.id)).map((p) => p.id)}
            onSave={refetch}
          />
        )}

        {/* Informações de Segurança */}
        <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800 p-4">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800 dark:text-yellow-200">
              <p className="font-medium mb-1">Segurança dos Tokens</p>
              <ul className="list-disc list-inside space-y-1 text-yellow-700 dark:text-yellow-300">
                <li>Os tokens são armazenados de forma segura no banco de dados</li>
                <li>Nunca compartilhe seus tokens de API</li>
                <li>Você pode revogar tokens a qualquer momento no painel do provedor</li>
                <li>Recomendamos usar tokens com permissões limitadas</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Componente de configuração de fallback
 */
function FallbackConfig({
  enableFallback,
  fallbackProvider,
  configuredProviders,
  onSave,
}: {
  enableFallback: boolean;
  fallbackProvider?: string;
  configuredProviders: AIProvider[];
  onSave: () => void;
}) {
  const [enabled, setEnabled] = useState(enableFallback);
  const [provider, setProvider] = useState<AIProvider | "">(
    (fallbackProvider as AIProvider) || ""
  );
  const [saving, setSaving] = useState(false);

  const setFallbackMutation = trpc.aiConfig.setFallbackConfig.useMutation({
    onSuccess: () => {
      toast.success("Configuração de fallback salva!");
      onSave();
      setSaving(false);
    },
    onError: (error: { message: string }) => {
      toast.error("Erro ao salvar configuração", { description: error.message });
      setSaving(false);
    },
  });

  const handleSave = () => {
    setSaving(true);
    setFallbackMutation.mutate({
      enableFallback: enabled,
      fallbackProvider: provider || undefined,
    });
  };

  // Sincronizar com props
  useEffect(() => {
    setEnabled(enableFallback);
    setProvider((fallbackProvider as AIProvider) || "");
  }, [enableFallback, fallbackProvider]);

  return (
    <div className="mt-6 bg-theme-card rounded-lg border border-theme p-6">
      <div className="flex items-center gap-3 mb-4">
        <Zap className="w-5 h-5 text-blue-500" />
        <h2 className="text-lg font-medium text-theme">Fallback Automático</h2>
      </div>

      <p className="text-sm text-theme-muted mb-4">
        Se o provedor principal falhar (rate limit, timeout, erro), o sistema tentará
        automaticamente outros provedores configurados.
      </p>

      <div className="space-y-4">
        {/* Toggle de fallback */}
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="w-5 h-5 rounded border-theme-input text-blue-600 focus:ring-blue-500"
          />
          <span className="text-theme">Habilitar fallback automático</span>
        </label>

        {/* Seleção de provider de fallback */}
        {enabled && configuredProviders.length > 1 && (
          <div className="ml-8">
            <label className="block text-sm font-medium text-theme-secondary mb-1">
              Provider de fallback preferido
            </label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value as AIProvider | "")}
              className="px-3 py-2 bg-theme-input border border-theme-input rounded-lg text-theme text-sm focus:ring-2 focus:ring-blue-500 min-w-[200px]"
            >
              <option value="">Automático (próximo disponível)</option>
              {configuredProviders.map((p) => (
                <option key={p} value={p}>
                  {PROVIDERS.find((pr) => pr.id === p)?.name || p}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-theme-muted">
              Ordem padrão: Anthropic → OpenAI → Google
            </p>
          </div>
        )}

        {/* Botão salvar */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            isLoading={saving}
            disabled={enabled === enableFallback && provider === (fallbackProvider || "")}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Salvar Configuração
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Modal de comparativo de modelos
 */
function ModelCompareModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  // Flatten all models for comparison
  const allModels: (AIModel & { provider: AIProvider })[] = [];
  for (const provider of ["openai", "anthropic", "google"] as AIProvider[]) {
    for (const model of AI_MODELS[provider]) {
      allModels.push({ ...model, provider });
    }
  }

  // Sort by recommended first, then by cost
  const sortedModels = [...allModels].sort((a, b) => {
    if (a.recommended && !b.recommended) return -1;
    if (!a.recommended && b.recommended) return 1;
    return a.costPer1MInput - b.costPer1MInput;
  });

  const getQualityStars = (model: AIModel): number => {
    if (model.recommended) return 5;
    if (model.id.includes("opus") || model.id === "gpt-4o") return 5;
    if (model.id.includes("sonnet") || model.id.includes("pro")) return 4;
    if (model.id.includes("haiku") || model.id.includes("mini") || model.id.includes("flash")) return 3;
    return 3;
  };

  const getSpeedStars = (model: AIModel): number => {
    if (model.fastest) return 5;
    if (model.id.includes("haiku") || model.id.includes("mini") || model.id.includes("flash")) return 5;
    if (model.id.includes("sonnet") || model.id.includes("pro")) return 4;
    return 3;
  };

  const getCostTier = (cost: number): string => {
    if (cost < 0.5) return "$";
    if (cost < 3) return "$$";
    if (cost < 10) return "$$$";
    return "$$$$";
  };

  const formatContext = (tokens: number): string => {
    if (tokens >= 1000000) return `${tokens / 1000000}M`;
    return `${tokens / 1000}k`;
  };

  const renderStars = (count: number) => {
    return (
      <span className="text-yellow-500">
        {"★".repeat(count)}
        <span className="text-theme-muted">{"★".repeat(5 - count)}</span>
      </span>
    );
  };

  const getProviderIcon = (provider: AIProvider): string => {
    const icons: Record<AIProvider, string> = {
      openai: "🤖",
      anthropic: "🧠",
      google: "✨",
    };
    return icons[provider];
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Comparativo de Modelos de IA"
      description="Compare qualidade, velocidade e custo dos modelos disponíveis"
      size="xl"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-theme-table-header border-b border-theme">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-theme-muted">Modelo</th>
              <th className="px-4 py-3 text-center font-medium text-theme-muted">Qualidade</th>
              <th className="px-4 py-3 text-center font-medium text-theme-muted">Velocidade</th>
              <th className="px-4 py-3 text-center font-medium text-theme-muted">Custo</th>
              <th className="px-4 py-3 text-center font-medium text-theme-muted">Contexto</th>
              <th className="px-4 py-3 text-left font-medium text-theme-muted">Melhor para</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-theme-table">
            {sortedModels.map((model) => (
              <tr
                key={`${model.provider}-${model.id}`}
                className={`hover:bg-theme-table-hover transition-colors ${
                  model.recommended ? "bg-yellow-50 dark:bg-yellow-900/10" : ""
                }`}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span>{getProviderIcon(model.provider)}</span>
                    <div>
                      <div className="font-medium text-theme flex items-center gap-2">
                        {model.name}
                        {model.recommended && (
                          <span className="text-xs px-1.5 py-0.5 bg-yellow-100 text-yellow-800 rounded">
                            ⭐ Recomendado
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-theme-muted">{model.description}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  {renderStars(getQualityStars(model))}
                </td>
                <td className="px-4 py-3 text-center">
                  {renderStars(getSpeedStars(model))}
                </td>
                <td className="px-4 py-3 text-center">
                  {(() => {
                    const tier = getCostTier(model.costPer1MInput);
                    const colorClass =
                      tier === "$" ? "text-green-600" :
                        tier === "$$" ? "text-blue-600" :
                          tier === "$$$" ? "text-yellow-600" : "text-red-600";
                    return <span className={`font-mono ${colorClass}`}>{tier}</span>;
                  })()}
                  <div className="text-xs text-theme-muted">
                    ${model.costPer1MInput}/1M
                  </div>
                </td>
                <td className="px-4 py-3 text-center font-mono text-theme">
                  {formatContext(model.contextWindow)}
                </td>
                <td className="px-4 py-3 text-xs text-theme-muted">
                  {model.recommended && "Uso geral, melhor custo-benefício"}
                  {model.fastest && !model.recommended && "Tarefas rápidas, alto volume"}
                  {model.id.includes("opus") && "Tarefas complexas, máxima qualidade"}
                  {model.id === "gpt-4o" && !model.recommended && "Multimodal, criativo"}
                  {model.id.includes("turbo") && "Contexto longo, compatibilidade"}
                  {model.id === "gemini-1.5-pro" && "Documentos longos, análise"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-medium mb-1">Dica de Escolha</p>
            <ul className="space-y-1 text-blue-700 dark:text-blue-300">
              <li>• <strong>Uso geral:</strong> Claude 3.5 Sonnet (melhor custo-benefício)</li>
              <li>• <strong>Velocidade:</strong> Claude 3.5 Haiku ou GPT-4o Mini</li>
              <li>• <strong>Documentos longos:</strong> Gemini 1.5 Pro (1M tokens)</li>
              <li>• <strong>Máxima qualidade:</strong> GPT-4o ou Claude 3 Opus</li>
            </ul>
          </div>
        </div>
      </div>
    </Modal>
  );
}
