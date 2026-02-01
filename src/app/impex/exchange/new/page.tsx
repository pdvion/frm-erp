"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Banknote, Save, X } from "lucide-react";

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
  const { data: processesData } = trpc.impex.listProcesses.useQuery({ limit: 100 });
  const processes = processesData?.items;

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
            <Input
              label="Número do Contrato *"
              name="contractNumber"
              value={formData.contractNumber}
              onChange={handleChange}
              required
              placeholder="Ex: CC-2026-0001"
            />
            <div>
              <label className="block text-sm font-medium text-theme mb-1">
                Banco *
              </label>
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
                placeholder="Nenhum (contrato avulso)"
                options={[
                  { value: "", label: "Nenhum (contrato avulso)" },
                  ...(processes?.map((process) => ({ value: process.id, label: `${process.processNumber} - ${process.supplier?.companyName}` })) || []),
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
              <label className="block text-sm font-medium text-theme mb-1">
                Moeda
              </label>
              <Select
                value={formData.foreignCurrency}
                onChange={(value) => setFormData(prev => ({ ...prev, foreignCurrency: value }))}
                options={[
                  { value: "USD", label: "USD - Dólar Americano" },
                  { value: "EUR", label: "EUR - Euro" },
                  { value: "GBP", label: "GBP - Libra Esterlina" },
                  { value: "CNY", label: "CNY - Yuan Chinês" },
                  { value: "JPY", label: "JPY - Iene Japonês" },
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
              placeholder="5.1234"
            />
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
            placeholder="Observações adicionais..."
          />
        </div>

        <div className="flex justify-end gap-4">
          <Button
            variant="outline"
            onClick={() => router.push("/impex/exchange")}
            leftIcon={<X className="w-4 h-4" />}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            isLoading={createMutation.isPending}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Salvar
          </Button>
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
