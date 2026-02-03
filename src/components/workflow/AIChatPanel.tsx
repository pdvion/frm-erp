"use client";

import { useState } from "react";
import { Send, Sparkles, Loader2, X, Lightbulb, Wand2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import type { GeneratedWorkflow } from "@/lib/ai/workflowGenerator";

interface Message {
  id: string;
  role: "user" | "assistant" | "error";
  content: string;
  workflow?: GeneratedWorkflow;
}

interface AIChatPanelProps {
  onWorkflowGenerated: (workflow: GeneratedWorkflow) => void;
  currentWorkflow?: {
    name: string;
    description: string;
    category: "PURCHASE" | "PAYMENT" | "HR" | "PRODUCTION" | "SALES" | "GENERAL";
    steps: unknown[];
    transitions: unknown[];
  };
  onClose: () => void;
}

export function AIChatPanel({
  onWorkflowGenerated,
  currentWorkflow,
  onClose,
}: AIChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(true);

  const { data: suggestions } = trpc.workflow.getAIPromptSuggestions.useQuery();

  const generateMutation = trpc.workflow.generateFromAI.useMutation({
    onSuccess: (workflow) => {
      const assistantMessage: Message = {
        id: `msg-${crypto.randomUUID()}`,
        role: "assistant",
        content: `Workflow "${workflow.name}" gerado com ${workflow.steps.length} etapas. Clique em "Aplicar" para usar este fluxo.`,
        workflow: workflow as GeneratedWorkflow,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    },
    onError: (error) => {
      const errorMessage: Message = {
        id: `msg-${crypto.randomUUID()}`,
        role: "error",
        content: error.message,
      };
      setMessages((prev) => [...prev, errorMessage]);
    },
  });

  const handleSubmit = (prompt: string) => {
    if (!prompt.trim()) return;

    const msgId = crypto.randomUUID();
    const userMessage: Message = {
      id: `msg-${msgId}`,
      role: "user",
      content: prompt,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setShowSuggestions(false);

    generateMutation.mutate({
      prompt,
      currentWorkflow: currentWorkflow && messages.length > 0 ? currentWorkflow : undefined,
    });
  };

  const handleApplyWorkflow = (workflow: GeneratedWorkflow) => {
    onWorkflowGenerated(workflow);
  };

  return (
    <div className="flex flex-col h-full bg-theme-card border-l border-theme">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-theme">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-violet-500" />
          <h3 className="font-semibold text-theme">Criar com IA</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-theme-muted hover:text-theme rounded"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && showSuggestions && (
          <div className="space-y-4">
            <div className="text-center py-4">
              <Wand2 className="w-12 h-12 mx-auto text-violet-500 mb-3" />
              <h4 className="font-medium text-theme mb-1">
                Descreva o processo desejado
              </h4>
              <p className="text-sm text-theme-muted">
                A IA vai gerar um workflow completo com etapas, aprovações e formulários.
              </p>
            </div>

            {suggestions && suggestions.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-medium text-theme-muted">
                    Sugestões
                  </span>
                </div>
                <div className="space-y-2">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSubmit(suggestion.prompt)}
                      className="w-full text-left p-3 rounded-lg border border-theme hover:bg-theme-secondary transition-colors"
                    >
                      <p className="text-sm font-medium text-theme">
                        {suggestion.title}
                      </p>
                      <p className="text-xs text-theme-muted line-clamp-2 mt-1">
                        {suggestion.prompt}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-lg p-3 ${
                message.role === "user"
                  ? "bg-violet-600 text-white"
                  : message.role === "error"
                    ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                    : "bg-theme-secondary text-theme"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>

              {message.workflow && (
                <div className="mt-3 pt-3 border-t border-theme/20">
                  <div className="text-xs space-y-1 mb-3">
                    <p>
                      <strong>Nome:</strong> {message.workflow.name}
                    </p>
                    <p>
                      <strong>Categoria:</strong> {message.workflow.category}
                    </p>
                    <p>
                      <strong>Etapas:</strong> {message.workflow.steps.length}
                    </p>
                    <p>
                      <strong>Transições:</strong>{" "}
                      {message.workflow.transitions.length}
                    </p>
                  </div>
                  <button
                    onClick={() => handleApplyWorkflow(message.workflow!)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    <Wand2 className="w-4 h-4" />
                    Aplicar ao Canvas
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {generateMutation.isPending && (
          <div className="flex justify-start">
            <div className="bg-theme-secondary rounded-lg p-3">
              <div className="flex items-center gap-2 text-theme-muted">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Gerando workflow...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-theme">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(input);
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              messages.length > 0
                ? "Refine o workflow..."
                : "Descreva o processo desejado..."
            }
            className="flex-1 px-3 py-2 text-sm bg-theme-input border border-theme-input rounded-lg text-theme placeholder:text-theme-muted"
            disabled={generateMutation.isPending}
          />
          <button
            type="submit"
            disabled={!input.trim() || generateMutation.isPending}
            className="px-3 py-2 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-400 text-white rounded-lg transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        {messages.length > 0 && (
          <p className="text-xs text-theme-muted mt-2">
            💡 Você pode refinar: Adicione notificação por email ou Inclua aprovação da diretoria
          </p>
        )}
      </div>
    </div>
  );
}
