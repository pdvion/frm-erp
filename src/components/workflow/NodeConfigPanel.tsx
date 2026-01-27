"use client";

import { X } from "lucide-react";
import type { WorkflowStep } from "./WorkflowEditor";

interface NodeConfigPanelProps {
  node: WorkflowStep;
  onClose: () => void;
  onUpdate: (node: WorkflowStep) => void;
}

export function NodeConfigPanel({ node, onClose, onUpdate }: NodeConfigPanelProps) {
  const handleNameChange = (name: string) => {
    onUpdate({ ...node, name });
  };

  const handleCodeChange = (code: string) => {
    onUpdate({ ...node, code });
  };

  return (
    <div className="bg-theme-card border border-theme rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-theme">Configurar Nó</h3>
        <button
          onClick={onClose}
          className="p-1 text-theme-muted hover:text-theme rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-theme-muted mb-1">
            Tipo
          </label>
          <p className="text-sm text-theme font-medium">{node.type}</p>
        </div>

        <div>
          <label className="block text-xs font-medium text-theme-muted mb-1">
            Código
          </label>
          <input
            type="text"
            value={node.code}
            onChange={(e) => handleCodeChange(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-theme-input border border-theme-input rounded-lg text-theme"
            placeholder="Ex: STEP_001"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-theme-muted mb-1">
            Nome
          </label>
          <input
            type="text"
            value={node.name}
            onChange={(e) => handleNameChange(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-theme-input border border-theme-input rounded-lg text-theme"
            placeholder="Nome do passo"
          />
        </div>

        {node.type === "APPROVAL" && (
          <div>
            <label className="block text-xs font-medium text-theme-muted mb-1">
              Aprovador
            </label>
            <select className="w-full px-3 py-2 text-sm bg-theme-input border border-theme-input rounded-lg text-theme">
              <option value="">Selecione...</option>
              <option value="manager">Gestor Direto</option>
              <option value="department_head">Chefe de Departamento</option>
              <option value="specific">Usuário Específico</option>
            </select>
          </div>
        )}

        {node.type === "CONDITION" && (
          <div>
            <label className="block text-xs font-medium text-theme-muted mb-1">
              Expressão
            </label>
            <textarea
              className="w-full px-3 py-2 text-sm bg-theme-input border border-theme-input rounded-lg text-theme font-mono"
              rows={3}
              placeholder="valor > 1000"
            />
          </div>
        )}

        {node.type === "NOTIFICATION" && (
          <>
            <div>
              <label className="block text-xs font-medium text-theme-muted mb-1">
                Canal
              </label>
              <select className="w-full px-3 py-2 text-sm bg-theme-input border border-theme-input rounded-lg text-theme">
                <option value="email">E-mail</option>
                <option value="push">Push Notification</option>
                <option value="sms">SMS</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-theme-muted mb-1">
                Mensagem
              </label>
              <textarea
                className="w-full px-3 py-2 text-sm bg-theme-input border border-theme-input rounded-lg text-theme"
                rows={3}
                placeholder="Mensagem a ser enviada..."
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
