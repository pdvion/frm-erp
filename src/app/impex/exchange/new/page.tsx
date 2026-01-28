"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Banknote, Save, X, Loader2 } from "lucide-react";
import Link from "next/link";

export default function NewExchangeContractPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    contractNumber: "",
    bankAccountId: "",
    processId: "",
    foreignValue: 0,
    foreignCurrency: "USD",
    contractRate: 0,
    contractDate: new Date().toISOString().split("T")[0],
    maturityDate: "",
    notes: "",
  });

  const [brlValue, setBrlValue] = useState(0);

  const { data: bankAccounts } = trpc.bankAccounts.list.useQuery();
  const { data: processes } = trpc.impex.listProcesses.useQuery({ status: undefined });

  const createMutation = trpc.impex.createExchangeContract.useMutation({
    onSuccess: (data) => {
      router.push(`/impex/exchange/${data.id}`);
    },
    onError: (error) => {
      alert(`Erro ao criar contrato: ${error.message}`);
    },
  });

  useEffect(() => {
    setBrlValue(formData.foreignValue * formData.contractRate);
  }, [formData.foreignValue, formData.contractRate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    createMutation.mutate({
      contractNumber: formData.contractNumber,
      bankAccountId: formData.bankAccountId,
      processId: formData.processId || undefined,
      foreignValue: formData.foreignValue,
      foreignCurrency: formData.foreignCurrency,
      contractRate: formData.contractRate,
      contractDate: formData.contractDate,
      maturityDate: formData.maturityDate,
      notes: formData.notes || undefined,
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "foreignValue" || name === "contractRate"
          ? parseFloat(value) || 0
          : value,
    }));
  };

  const formatCurrency = (value: number, currency = "BRL") => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency,
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Novo Contrato de Câmbio"
        icon={<Banknote className="w-6 h-6" />}
        module="PURCHASES"
        breadcrumbs={[
          { label: "ImpEx", href: "/impex" },
          { label: "Câmbio", href: "/impex/exchange" },
          { label: "Novo" },
        ]}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-theme-card border border-theme rounded-lg p-6">
          <h3 className="font-semibold text-theme mb-4">Informações do Contrato</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-theme mb-1">
                Número do Contrato *
              </label>
              <input
                type="text"
                name="contractNumber"
                value={formData.contractNumber}
                onChange={handleChange}
                required
                placeholder="Ex: CC-2026-0001"
                className="w-full px-3 py-2 border border-theme rounded-lg bg-theme-secondary text-theme"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-theme mb-1">
                Banco *
              </label>
              <select
                name="bankAccountId"
                value={formData.bankAccountId}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-theme rounded-lg bg-theme-secondary text-theme"
              >
                <option value="">Selecione...</option>
                {bankAccounts?.map((bank) => (
                  <option key={bank.id} value={bank.id}>
                    {bank.bankName || bank.name} - {bank.accountNumber}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-theme mb-1">
                Processo de Importação
              </label>
              <select
                name="processId"
                value={formData.processId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-theme rounded-lg bg-theme-secondary text-theme"
              >
                <option value="">Nenhum (contrato avulso)</option>
                {processes?.map((process) => (
                  <option key={process.id} value={process.id}>
                    {process.processNumber} - {process.supplier?.companyName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-theme-card border border-theme rounded-lg p-6">
          <h3 className="font-semibold text-theme mb-4">Valores</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-theme mb-1">
                Valor em Moeda Estrangeira *
              </label>
              <input
                type="number"
                name="foreignValue"
                value={formData.foreignValue}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-theme rounded-lg bg-theme-secondary text-theme"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-theme mb-1">
                Moeda
              </label>
              <select
                name="foreignCurrency"
                value={formData.foreignCurrency}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-theme rounded-lg bg-theme-secondary text-theme"
              >
                <option value="USD">USD - Dólar Americano</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - Libra Esterlina</option>
                <option value="CNY">CNY - Yuan Chinês</option>
                <option value="JPY">JPY - Iene Japonês</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-theme mb-1">
                Taxa Contratada *
              </label>
              <input
                type="number"
                name="contractRate"
                value={formData.contractRate}
                onChange={handleChange}
                required
                min="0"
                step="0.0001"
                placeholder="5.1234"
                className="w-full px-3 py-2 border border-theme rounded-lg bg-theme-secondary text-theme"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-theme mb-1">
                Valor em BRL
              </label>
              <div className="px-3 py-2 border border-theme rounded-lg bg-theme-secondary text-theme font-medium">
                {formatCurrency(brlValue)}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-theme-card border border-theme rounded-lg p-6">
          <h3 className="font-semibold text-theme mb-4">Datas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-theme mb-1">
                Data do Contrato *
              </label>
              <input
                type="date"
                name="contractDate"
                value={formData.contractDate}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-theme rounded-lg bg-theme-secondary text-theme"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-theme mb-1">
                Data de Vencimento *
              </label>
              <input
                type="date"
                name="maturityDate"
                value={formData.maturityDate}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-theme rounded-lg bg-theme-secondary text-theme"
              />
            </div>
          </div>
        </div>

        <div className="bg-theme-card border border-theme rounded-lg p-6">
          <h3 className="font-semibold text-theme mb-4">Observações</h3>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-theme rounded-lg bg-theme-secondary text-theme"
            placeholder="Observações adicionais..."
          />
        </div>

        <div className="flex justify-end gap-4">
          <Link
            href="/impex/exchange"
            className="flex items-center gap-2 px-4 py-2 border border-theme rounded-lg hover:bg-theme-secondary"
          >
            <X className="w-4 h-4" />
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {createMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Salvar
          </button>
        </div>

        {createMutation.error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {createMutation.error.message}
          </div>
        )}
      </form>
    </div>
  );
}
