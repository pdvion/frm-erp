"use client";

import { useState } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/Button";

const PROVIDERS = [
  {
    id: "openai" as const,
    name: "OpenAI",
    description: "GPT-4, GPT-3.5 Turbo",
    placeholder: "sk-...",
    color: "bg-green-600",
    icon: "🤖",
  },
  {
    id: "anthropic" as const,
    name: "Anthropic",
    description: "Claude 3, Claude 2",
    placeholder: "sk-ant-...",
    color: "bg-orange-600",
    icon: "🧠",
  },
  {
    id: "google" as const,
    name: "Google",
    description: "Gemini Pro, Gemini Ultra",
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
  const [savingProvider, setSavingProvider] = useState<string | null>(null);

  const { data: config, isLoading, refetch } = trpc.aiConfig.get.useQuery();

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
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            <h2 className="text-lg font-medium text-theme">Status da Integração</h2>
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

              <div className="flex gap-3">
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
                  <button
                    type="button"
                    onClick={() =>
                      setShowTokens((prev) => ({
                        ...prev,
                        [provider.id]: !prev[provider.id],
                      }))
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme"
                  >
                    {showTokens[provider.id] ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
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
            </div>
          ))}
        </div>

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
