"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
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
  const { data: processesData } = trpc.impex.listProcesses.useQuery({ limit: 100 });
  const processes = processesData?.items;

  const updateMutation = trpc.impex.updateExchangeContract.useMutation({
    onSuccess: () => {
      router.push(`/impex/exchange/${id}`);
    },
    onError: (error) => {
      toast.error(`Erro ao atualizar contrato: ${error.message}`);
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
            <Input
              label="Número do Contrato *"
              name="contractNumber"
              value={formData.contractNumber}
              onChange={handleChange}
              required
            />
            <div>
              <label className="block text-sm font-medium text-theme mb-1">Status</label>
              <Select
                value={formData.status}
                onChange={(value) => setFormData(prev => ({ ...prev, status: value as StatusValue }))}
                options={STATUS_OPTIONS}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-theme mb-1">Banco *</label>
              <Select
                value={formData.bankAccountId}
                onChange={(value) => setFormData(prev => ({ ...prev, bankAccountId: value }))}
                placeholder="Selecione..."
                options={[
                  { value: "", label: "Selecione..." },
                  ...(bankAccounts?.map((bank) => ({ value: bank.id, label: `${bank.bankName || bank.name} - ${bank.accountNumber}` })) || []),
                ]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-theme mb-1">
                Processo de Importação
              </label>
              <Select
                value={formData.processId}
                onChange={(value) => setFormData(prev => ({ ...prev, processId: value }))}
                placeholder="Nenhum"
                options={[
                  { value: "", label: "Nenhum" },
                  ...(processes?.map((process) => ({ value: process.id, label: process.processNumber })) || []),
                ]}
              />
            </div>
          </div>
        </div>

        <div className="bg-theme-card border border-theme rounded-lg p-6">
          <h3 className="font-semibold text-theme mb-4">Valores</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              label="Valor em Moeda Estrangeira *"
              type="number"
              name="foreignValue"
              value={formData.foreignValue}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
            />
            <div>
              <label className="block text-sm font-medium text-theme mb-1">Moeda</label>
              <Select
                value={formData.foreignCurrency}
                onChange={(value) => setFormData(prev => ({ ...prev, foreignCurrency: value }))}
                options={[
                  { value: "USD", label: "USD - Dólar" },
                  { value: "EUR", label: "EUR - Euro" },
                  { value: "GBP", label: "GBP - Libra" },
                  { value: "CNY", label: "CNY - Yuan" },
                ]}
              />
            </div>
            <Input
              label="Taxa Contratada *"
              type="number"
              name="contractRate"
              value={formData.contractRate}
              onChange={handleChange}
              required
              min="0"
              step="0.0001"
            />
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
            <Input
              label="Data do Contrato *"
              type="date"
              name="contractDate"
              value={formData.contractDate}
              onChange={handleChange}
              required
            />
            <Input
              label="Data de Vencimento *"
              type="date"
              name="maturityDate"
              value={formData.maturityDate}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="bg-theme-card border border-theme rounded-lg p-6">
          <h3 className="font-semibold text-theme mb-4">Observações</h3>
          <Textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            rows={3}
          />
        </div>

        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={() => router.push(`/impex/exchange/${id}`)}
            leftIcon={<X className="w-4 h-4" />}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            isLoading={updateMutation.isPending}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Salvar
          </Button>
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
