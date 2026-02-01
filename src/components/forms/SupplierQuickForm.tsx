"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Save, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

interface SupplierQuickFormProps {
  onSuccess: (supplier: { id: string; companyName: string; code: number }) => void;
  onCancel: () => void;
}

const STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

const STATE_OPTIONS = STATES.map((uf) => ({ value: uf, label: uf }));

export function SupplierQuickForm({ onSuccess, onCancel }: SupplierQuickFormProps) {
  const [formData, setFormData] = useState({
    code: "",
    cnpj: "",
    companyName: "",
    tradeName: "",
    phone: "",
    email: "",
    city: "",
    state: "",
  });

  const utils = trpc.useUtils();

  const createMutation = trpc.suppliers.create.useMutation({
    onSuccess: (data: { id: string; companyName: string; code: number }) => {
      utils.suppliers.list.invalidate();
      onSuccess({ id: data.id, companyName: data.companyName, code: data.code });
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyName.trim() || !formData.code) return;

    createMutation.mutate({
      code: parseInt(formData.code),
      cnpj: formData.cnpj || undefined,
      companyName: formData.companyName.trim(),
      tradeName: formData.tradeName || undefined,
      phone: formData.phone || undefined,
      email: formData.email || undefined,
      city: formData.city || undefined,
      state: formData.state || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Código *"
          type="number"
          id="code"
          name="code"
          value={formData.code}
          onChange={handleChange}
          placeholder="Ex: 101"
          autoFocus
          required
          data-testid="input-code"
        />
        <Input
          label="CNPJ"
          type="text"
          id="cnpj"
          name="cnpj"
          value={formData.cnpj}
          onChange={handleChange}
          placeholder="00.000.000/0000-00"
        />
      </div>

      <Input
        label="Razão Social *"
        type="text"
        id="companyName"
        name="companyName"
        value={formData.companyName}
        onChange={handleChange}
        placeholder="Nome completo da empresa"
        required
        data-testid="input-name"
      />

      <Input
        label="Nome Fantasia"
        type="text"
        id="tradeName"
        name="tradeName"
        value={formData.tradeName}
        onChange={handleChange}
        placeholder="Nome comercial"
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Telefone"
          type="text"
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="(00) 0000-0000"
        />
        <Input
          label="E-mail"
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="contato@empresa.com"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Cidade"
          type="text"
          id="city"
          name="city"
          value={formData.city}
          onChange={handleChange}
          placeholder="São Paulo"
        />
        <div>
          <label htmlFor="state" className="block text-sm font-medium text-theme-secondary mb-1">
            UF
          </label>
          <Select
            id="state"
            name="state"
            value={formData.state}
            onChange={(value) => setFormData((prev) => ({ ...prev, state: value }))}
            options={STATE_OPTIONS}
            placeholder="Selecione"
          />
        </div>
      </div>

      {createMutation.error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {createMutation.error.message}
        </div>
      )}

      <div className="flex gap-3 pt-4 border-t border-theme">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          leftIcon={<X className="w-4 h-4" />}
          className="flex-1"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={createMutation.isPending || !formData.companyName.trim() || !formData.code}
          isLoading={createMutation.isPending}
          leftIcon={!createMutation.isPending ? <Save className="w-4 h-4" /> : undefined}
          className="flex-1"
          data-testid="submit-btn"
        >
          Salvar
        </Button>
      </div>
    </form>
  );
}
