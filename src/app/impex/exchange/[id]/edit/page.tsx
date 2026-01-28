"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Banknote, Save, X, Loader2 } from "lucide-react";
import Link from "next/link";

const STATUS_OPTIONS = [
  { value: "OPEN", label: "Aberto" },
  { value: "PARTIALLY_LIQUIDATED", label: "Parcialmente Liquidado" },
  { value: "LIQUIDATED", label: "Liquidado" },
  { value: "CANCELLED", label: "Cancelado" },
];

type StatusValue = "OPEN" | "PARTIALLY_LIQUIDATED" | "LIQUIDATED" | "CANCELLED";

export default function EditExchangeContractPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [formData, setFormData] = useState({
    contractNumber: "",
    bankAccountId: "",
    processId: "",
    foreignValue: 0,
    foreignCurrency: "USD",
    contractRate: 0,
    contractDate: "",
    maturityDate: "",
    status: "OPEN" as StatusValue,
    notes: "",
  });

  const [brlValue, setBrlValue] = useState(0);

  const { data: contract, isLoading: loadingContract } = trpc.impex.getExchangeContract.useQuery({ id });
  const { data: bankAccounts } = trpc.bankAccounts.list.useQuery();
  const { data: processes } = trpc.impex.listProcesses.useQuery({ status: undefined });

  const updateMutation = trpc.impex.updateExchangeContract.useMutation({
    onSuccess: () => {
      router.push(`/impex/exchange/${id}`);
    },
  });

  useEffect(() => {
    if (contract) {
      setFormData({
        contractNumber: contract.contractNumber,
        bankAccountId: contract.bankAccountId,
        processId: contract.processId || "",
        foreignValue: Number(contract.foreignValue),
        foreignCurrency: contract.foreignCurrency,
        contractRate: Number(contract.contractRate),
        contractDate: new Date(contract.contractDate).toISOString().split("T")[0],
        maturityDate: new Date(contract.maturityDate).toISOString().split("T")[0],
        status: contract.status as StatusValue,
        notes: contract.notes || "",
      });
    }
  }, [contract]);

  useEffect(() => {
    setBrlValue(formData.foreignValue * formData.contractRate);
  }, [formData.foreignValue, formData.contractRate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    updateMutation.mutate({
      id,
      contractNumber: formData.contractNumber,
      bankAccountId: formData.bankAccountId,
      processId: formData.processId || null,
      foreignValue: formData.foreignValue,
      foreignCurrency: formData.foreignCurrency,
      contractRate: formData.contractRate,
      contractDate: formData.contractDate,
      maturityDate: formData.maturityDate,
      status: formData.status,
      notes: formData.notes || null,
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

  if (loadingContract) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-theme">Contrato não encontrado</h2>
        <Link href="/impex/exchange" className="text-blue-600 hover:underline mt-2 inline-block">
          Voltar para lista
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Editar ${contract.contractNumber}`}
        icon={<Banknote className="w-6 h-6" />}
        module="PURCHASES"
        breadcrumbs={[
          { label: "ImpEx", href: "/impex" },
          { label: "Câmbio", href: "/impex/exchange" },
          { label: contract.contractNumber, href: `/impex/exchange/${id}` },
          { label: "Editar" },
        ]}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-theme-card border border-theme rounded-lg p-6">
          <h3 className="font-semibold text-theme mb-4">Informações do Contrato</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                className="w-full px-3 py-2 border border-theme rounded-lg bg-theme-secondary text-theme"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-theme mb-1">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-theme rounded-lg bg-theme-secondary text-theme"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-theme mb-1">Banco *</label>
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
                <option value="">Nenhum</option>
                {processes?.map((process) => (
                  <option key={process.id} value={process.id}>
                    {process.processNumber}
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
              <label className="block text-sm font-medium text-theme mb-1">Moeda</label>
              <select
                name="foreignCurrency"
                value={formData.foreignCurrency}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-theme rounded-lg bg-theme-secondary text-theme"
              >
                <option value="USD">USD - Dólar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - Libra</option>
                <option value="CNY">CNY - Yuan</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-theme mb-1">Taxa Contratada *</label>
              <input
                type="number"
                name="contractRate"
                value={formData.contractRate}
                onChange={handleChange}
                required
                min="0"
                step="0.0001"
                className="w-full px-3 py-2 border border-theme rounded-lg bg-theme-secondary text-theme"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-theme mb-1">Valor em BRL</label>
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
              <label className="block text-sm font-medium text-theme mb-1">Data do Contrato *</label>
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
              <label className="block text-sm font-medium text-theme mb-1">Data de Vencimento *</label>
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
          />
        </div>

        <div className="flex justify-end gap-4">
          <Link
            href={`/impex/exchange/${id}`}
            className="flex items-center gap-2 px-4 py-2 border border-theme rounded-lg hover:bg-theme-secondary"
          >
            <X className="w-4 h-4" />
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {updateMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Salvar
          </button>
        </div>

        {updateMutation.error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {updateMutation.error.message}
          </div>
        )}
      </form>
    </div>
  );
}
