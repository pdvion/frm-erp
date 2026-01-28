"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Loader2, Save, X } from "lucide-react";

interface SupplierQuickFormProps {
  onSuccess: (supplier: { id: string; companyName: string; code: number }) => void;
  onCancel: () => void;
}

const STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

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
        <div>
          <label htmlFor="code" className="block text-sm font-medium text-theme-secondary mb-1">
            Código *
          </label>
          <input
            type="number"
            id="code"
            name="code"
            value={formData.code}
            onChange={handleChange}
            placeholder="Ex: 101"
            className="w-full px-3 py-2 border border-theme rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            autoFocus
            required
          />
        </div>
        <div>
          <label htmlFor="cnpj" className="block text-sm font-medium text-theme-secondary mb-1">
            CNPJ
          </label>
          <input
            type="text"
            id="cnpj"
            name="cnpj"
            value={formData.cnpj}
            onChange={handleChange}
            placeholder="00.000.000/0000-00"
            className="w-full px-3 py-2 border border-theme rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>
      </div>

      <div>
        <label htmlFor="companyName" className="block text-sm font-medium text-theme-secondary mb-1">
          Razão Social *
        </label>
        <input
          type="text"
          id="companyName"
          name="companyName"
          value={formData.companyName}
          onChange={handleChange}
          placeholder="Nome completo da empresa"
          className="w-full px-3 py-2 border border-theme rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          required
        />
      </div>

      <div>
        <label htmlFor="tradeName" className="block text-sm font-medium text-theme-secondary mb-1">
          Nome Fantasia
        </label>
        <input
          type="text"
          id="tradeName"
          name="tradeName"
          value={formData.tradeName}
          onChange={handleChange}
          placeholder="Nome comercial"
          className="w-full px-3 py-2 border border-theme rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-theme-secondary mb-1">
            Telefone
          </label>
          <input
            type="text"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="(00) 0000-0000"
            className="w-full px-3 py-2 border border-theme rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-theme-secondary mb-1">
            E-mail
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="contato@empresa.com"
            className="w-full px-3 py-2 border border-theme rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-theme-secondary mb-1">
            Cidade
          </label>
          <input
            type="text"
            id="city"
            name="city"
            value={formData.city}
            onChange={handleChange}
            placeholder="São Paulo"
            className="w-full px-3 py-2 border border-theme rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>
        <div>
          <label htmlFor="state" className="block text-sm font-medium text-theme-secondary mb-1">
            UF
          </label>
          <select
            id="state"
            name="state"
            value={formData.state}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-theme rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="">Selecione</option>
            {STATES.map((uf) => (
              <option key={uf} value={uf}>{uf}</option>
            ))}
          </select>
        </div>
      </div>

      {createMutation.error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {createMutation.error.message}
        </div>
      )}

      <div className="flex gap-3 pt-4 border-t border-theme">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-theme text-theme-secondary rounded-lg hover:bg-theme-secondary transition-colors"
        >
          <X className="w-4 h-4" />
          Cancelar
        </button>
        <button
          type="submit"
          disabled={createMutation.isPending || !formData.companyName.trim() || !formData.code}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {createMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Salvar
        </button>
      </div>
    </form>
  );
}
