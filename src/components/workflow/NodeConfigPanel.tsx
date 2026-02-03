"use client";

import { useState } from "react";
import { X, Plus, Trash2, Settings2 } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import type { WorkflowStep } from "./WorkflowEditor";

interface FormField {
  id: string;
  name: string;
  label: string;
  type: "text" | "textarea" | "number" | "select" | "date" | "checkbox";
  required: boolean;
  options?: string[];
}

interface NodeConfigPanelProps {
  node: WorkflowStep;
  onClose: () => void;
  onUpdate: (node: WorkflowStep) => void;
}

export function NodeConfigPanel({ node, onClose, onUpdate }: NodeConfigPanelProps) {
  const [isFormDrawerOpen, setIsFormDrawerOpen] = useState(false);
  
  const handleNameChange = (name: string) => {
    onUpdate({ ...node, name });
  };

  const handleCodeChange = (code: string) => {
    onUpdate({ ...node, code });
  };

  const handleConfigChange = (key: string, value: unknown) => {
    onUpdate({
      ...node,
      config: { ...node.config, [key]: value },
    });
  };

  const formFields = (node.config?.formFields as FormField[]) || [];

  const addFormField = () => {
    const newField: FormField = {
      id: `field-${Date.now()}`,
      name: `campo_${formFields.length + 1}`,
      label: `Campo ${formFields.length + 1}`,
      type: "text",
      required: false,
    };
    handleConfigChange("formFields", [...formFields, newField]);
  };

  const updateFormField = (index: number, updates: Partial<FormField>) => {
    const updated = formFields.map((f, i) => (i === index ? { ...f, ...updates } : f));
    handleConfigChange("formFields", updated);
  };

  const removeFormField = (index: number) => {
    handleConfigChange("formFields", formFields.filter((_, i) => i !== index));
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

        {/* Form Builder for ACTION and APPROVAL nodes */}
        {(node.type === "ACTION" || node.type === "APPROVAL") && (
          <div className="border-t border-theme pt-4">
            <button
              onClick={() => setIsFormDrawerOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-violet-600 border border-violet-300 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-900/20"
            >
              <Settings2 className="w-4 h-4" />
              Configurar Formulário
              {formFields.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-violet-100 dark:bg-violet-900 rounded">
                  {formFields.length}
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Form Builder Drawer */}
      <Drawer
        isOpen={isFormDrawerOpen}
        onClose={() => setIsFormDrawerOpen(false)}
        title="Configurar Formulário"
        description={`Campos que serão exibidos na etapa "${node.name}"`}
        size="lg"
      >
        <div className="space-y-4">
          {formFields.length === 0 ? (
            <div className="text-center py-8 text-theme-muted">
              <Settings2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum campo configurado</p>
              <p className="text-sm mt-1">Adicione campos para criar o formulário desta etapa</p>
            </div>
          ) : (
            formFields.map((field, index) => (
              <div key={field.id} className="p-4 bg-theme-secondary rounded-lg border border-theme">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-theme">{field.label || "Campo sem nome"}</span>
                  <button
                    onClick={() => removeFormField(index)}
                    className="p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-theme-muted mb-1">
                      Nome do Campo
                    </label>
                    <input
                      type="text"
                      value={field.name}
                      onChange={(e) => updateFormField(index, { name: e.target.value.replace(/\s+/g, "_").toLowerCase() })}
                      placeholder="nome_campo"
                      className="w-full px-3 py-2 text-sm bg-theme-input border border-theme-input rounded-lg text-theme font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-theme-muted mb-1">
                      Label (Exibição)
                    </label>
                    <input
                      type="text"
                      value={field.label}
                      onChange={(e) => updateFormField(index, { label: e.target.value })}
                      placeholder="Nome exibido"
                      className="w-full px-3 py-2 text-sm bg-theme-input border border-theme-input rounded-lg text-theme"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-xs font-medium text-theme-muted mb-1">
                      Tipo
                    </label>
                    <select
                      value={field.type}
                      onChange={(e) => updateFormField(index, { type: e.target.value as FormField["type"] })}
                      className="w-full px-3 py-2 text-sm bg-theme-input border border-theme-input rounded-lg text-theme"
                    >
                      <option value="text">Texto curto</option>
                      <option value="textarea">Texto longo</option>
                      <option value="number">Número</option>
                      <option value="date">Data</option>
                      <option value="select">Lista de opções</option>
                      <option value="checkbox">Checkbox</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2 px-3 py-2 text-sm text-theme">
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => updateFormField(index, { required: e.target.checked })}
                        className="rounded border-theme"
                      />
                      Campo obrigatório
                    </label>
                  </div>
                </div>

                {field.type === "select" && (
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-theme-muted mb-1">
                      Opções (uma por linha)
                    </label>
                    <textarea
                      value={(field.options || []).join("\n")}
                      onChange={(e) => updateFormField(index, { options: e.target.value.split("\n").filter(Boolean) })}
                      placeholder="Opção 1&#10;Opção 2&#10;Opção 3"
                      rows={3}
                      className="w-full px-3 py-2 text-sm bg-theme-input border border-theme-input rounded-lg text-theme"
                    />
                  </div>
                )}
              </div>
            ))
          )}

          <button
            onClick={addFormField}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm text-violet-600 border-2 border-dashed border-violet-300 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Adicionar Campo
          </button>
        </div>
      </Drawer>
    </div>
  );
}
