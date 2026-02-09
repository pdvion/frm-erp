"use client";

import { useState, useEffect } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Modal, ModalFooter } from "@/components/ui/Modal";
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
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Item">
      <form onSubmit={handleSubmit} className="space-y-4">
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

        <ModalFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            leftIcon={<Save className="w-4 h-4" />}
          >
            Salvar
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
