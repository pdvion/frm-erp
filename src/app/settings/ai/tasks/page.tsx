"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bot,
  Loader2,
  RotateCcw,
  Sparkles,
  Info,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { AI_MODELS } from "@/lib/ai/models";

type AIProvider = "openai" | "anthropic" | "google";

const PROVIDER_LABELS: Record<AIProvider, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  google: "Google",
};

const PROVIDER_ICONS: Record<AIProvider, string> = {
  openai: "🤖",
  anthropic: "🧠",
  google: "✨",
};

export default function AITasksConfigPage() {
  const router = useRouter();
  const [savingTask, setSavingTask] = useState<string | null>(null);

  const { data: taskTypes, isLoading: loadingTypes } =
    trpc.aiConfig.listTaskTypes.useQuery();
  const { data: customConfigs, refetch: refetchConfigs } =
    trpc.aiConfig.getTaskConfigs.useQuery();
  const { data: aiConfig } = trpc.aiConfig.get.useQuery();

  const utils = trpc.useUtils();

  const setTaskConfigMutation = trpc.aiConfig.setTaskConfig.useMutation({
    onSuccess: () => {
      refetchConfigs();
      setSavingTask(null);
    },
    onError: () => {
      setSavingTask(null);
    },
  });

  const resetAllMutation = trpc.aiConfig.resetTaskConfigs.useMutation({
    onSuccess: () => {
      refetchConfigs();
      utils.aiConfig.getTaskConfigs.invalidate();
    },
  });

  const handleProviderChange = (taskId: string, provider: string) => {
    setSavingTask(taskId);
    if (provider === "auto") {
      setTaskConfigMutation.mutate({ task: taskId, provider: "auto" });
    } else {
      const models = AI_MODELS[provider as AIProvider] || [];
      const defaultModel = models[0]?.id || "";
      setTaskConfigMutation.mutate({
        task: taskId,
        provider: provider as AIProvider,
        model: defaultModel,
      });
    }
  };

  const handleModelChange = (taskId: string, provider: string, model: string) => {
    setSavingTask(taskId);
    setTaskConfigMutation.mutate({
      task: taskId,
      provider: provider as AIProvider,
      model,
    });
  };

  const configuredProviders = (
    ["openai", "anthropic", "google"] as AIProvider[]
  ).filter((p) => {
    if (p === "openai") return aiConfig?.openaiToken;
    if (p === "anthropic") return aiConfig?.anthropicToken;
    if (p === "google") return aiConfig?.googleToken;
    return false;
  });

  const getTaskConfig = (taskId: string) => {
    return customConfigs?.[taskId] || null;
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Configuração por Tipo de Tarefa"
        subtitle="Configure qual modelo de IA usar para cada tipo de tarefa"
        actions={
          <div className="flex gap-2">
            <button
              onClick={() => router.push("/settings/ai")}
              className="flex items-center gap-2 px-4 py-2 border border-theme rounded-lg hover:bg-theme-hover"
            >
              <ArrowLeft size={20} />
              Voltar
            </button>
            <button
              onClick={() => {
                if (confirm("Resetar todas as configurações para o padrão?")) {
                  resetAllMutation.mutate();
                }
              }}
              disabled={resetAllMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 border border-theme rounded-lg hover:bg-theme-hover"
            >
              {resetAllMutation.isPending ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <RotateCcw size={18} />
              )}
              Resetar Tudo
            </button>
          </div>
        }
      />

      {/* Info Banner */}
      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex gap-3">
        <Info size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-700 dark:text-blue-300">
          <p className="font-medium mb-1">Como funciona o roteamento inteligente</p>
          <p>
            Cada tipo de tarefa tem uma configuração recomendada baseada nas
            características do modelo. Deixe em &quot;Automático&quot; para usar a
            sugestão do sistema, ou escolha um modelo específico para customizar.
          </p>
        </div>
      </div>

      {/* Configured Providers */}
      {configuredProviders.length === 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p className="text-yellow-700 dark:text-yellow-300 text-sm">
            <strong>Atenção:</strong> Nenhum provedor de IA está configurado.{" "}
            <button
              onClick={() => router.push("/settings/ai")}
              className="underline hover:no-underline"
            >
              Configure seus tokens de API
            </button>{" "}
            para usar esta funcionalidade.
          </p>
        </div>
      )}

      {/* Task List */}
      {loadingTypes ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={32} className="animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="space-y-4">
          {taskTypes?.map((task) => {
            const customConfig = getTaskConfig(task.taskId);
            const isCustom = !!customConfig;
            const currentProvider = customConfig?.provider || "auto";
            const currentModel = customConfig?.model || "";
            const isSaving = savingTask === task.taskId;

            return (
              <div
                key={task.taskId}
                className="bg-theme-card rounded-lg border border-theme p-4"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Bot size={18} className="text-blue-600" />
                      <h3 className="font-medium text-theme">
                        {task.label}
                      </h3>
                      {isCustom && (
                        <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                          Customizado
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-theme-muted mt-1">{task.description}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {isSaving && (
                      <Loader2 size={16} className="animate-spin text-blue-600" />
                    )}

                    <select
                      value={currentProvider}
                      onChange={(e) => handleProviderChange(task.taskId, e.target.value)}
                      disabled={isSaving}
                      className="px-3 py-2 border border-theme rounded-lg text-sm bg-theme-card text-theme min-w-[180px]"
                    >
                      <option value="auto">
                        🤖 Automático ({PROVIDER_LABELS[task.defaultConfig.preferredProvider]})
                      </option>
                      {configuredProviders.map((p) => (
                        <option key={p} value={p}>
                          {PROVIDER_ICONS[p]} {PROVIDER_LABELS[p]}
                        </option>
                      ))}
                    </select>

                    {currentProvider !== "auto" && (
                      <select
                        value={currentModel}
                        onChange={(e) =>
                          handleModelChange(task.taskId, currentProvider, e.target.value)
                        }
                        disabled={isSaving}
                        className="px-3 py-2 border border-theme rounded-lg text-sm bg-theme-card text-theme min-w-[200px]"
                      >
                        {AI_MODELS[currentProvider as AIProvider]?.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {/* Suggestion */}
                <div className="mt-3 pt-3 border-t border-theme flex items-start gap-2">
                  <Sparkles size={14} className="text-blue-500 mt-0.5" />
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    <strong>Sugestão:</strong> {task.defaultConfig.reason}
                    <span className="text-theme-muted ml-2">
                      ({PROVIDER_LABELS[task.defaultConfig.preferredProvider]} /{" "}
                      {task.defaultConfig.preferredModel})
                    </span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
