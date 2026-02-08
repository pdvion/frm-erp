"use client";

import { useState, useEffect } from "react";
import { X, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { ValidationItem } from "./ValidationTable";

interface EditItemModalProps {
  item: ValidationItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: ValidationItem) => void;
}

const TYPE_OPTIONS = [
  { value: "material", label: "Material" },
  { value: "supplier", label: "Fornecedor" },
  { value: "customer", label: "Cliente" },
  { value: "fiscal_rule", label: "Regra Fiscal" },
];

const ACTION_OPTIONS = [
  { value: "create", label: "Criar" },
  { value: "update", label: "Atualizar" },
  { value: "skip", label: "Ignorar" },
  { value: "review", label: "Revisar" },
];

export function EditItemModal({ item, isOpen, onClose, onSave }: EditItemModalProps) {
  const [formData, setFormData] = useState<ValidationItem | null>(null);

  useEffect(() => {
    if (item) {
      setFormData({ ...item });
    }
  }, [item]);

  if (!isOpen || !formData) return null;

  const handleChange = (field: keyof ValidationItem, value: string | number) => {
    setFormData((prev) => prev ? { ...prev, [field]: value } : null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData) {
      onSave(formData);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-theme-card rounded-lg shadow-xl w-full max-w-lg mx-4 border border-theme">
        <div className="flex items-center justify-between p-4 border-b border-theme">
          <h3 className="text-lg font-semibold text-theme">Editar Item</h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X size={20} />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-1">
                Tipo
              </label>
              <Select
                value={formData.type}
                onChange={(value) => handleChange("type", value)}
                options={TYPE_OPTIONS}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-1">
                Ação
              </label>
              <Select
                value={formData.action}
                onChange={(value) => handleChange("action", value)}
                options={ACTION_OPTIONS}
              />
            </div>
          </div>

          <Input
            label="Nome"
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            required
          />

          <Input
            label="Descrição"
            value={formData.description || ""}
            onChange={(e) => handleChange("description", e.target.value)}
          />

          <div>
            <label className="block text-sm font-medium text-theme-secondary mb-1">
              Confiança (%)
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={formData.confidence}
              onChange={(e) => handleChange("confidence", parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-theme-muted mt-1">
              <span>0%</span>
              <span className="font-medium text-theme-secondary">{formData.confidence}%</span>
              <span>100%</span>
            </div>
          </div>

          <Input
            label="Motivo"
            value={formData.reason || ""}
            onChange={(e) => handleChange("reason", e.target.value)}
          />

          <div className="flex gap-3 pt-4 border-t border-theme">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              leftIcon={<Save className="w-4 h-4" />}
              className="flex-1"
            >
              Salvar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
