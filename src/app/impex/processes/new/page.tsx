"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Ship, Save, X, Loader2 } from "lucide-react";
import Link from "next/link";

export default function NewImportProcessPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    processNumber: "",
    reference: "",
    supplierId: "",
    brokerId: "",
    incotermId: "",
    cargoTypeId: "",
    originPortId: "",
    destPortId: "",
    invoiceValue: 0,
    currency: "USD",
    exchangeRate: "",
    freightValue: "",
    insuranceValue: "",
    invoiceDate: "",
    invoiceNumber: "",
    etd: "",
    eta: "",
    blNumber: "",
    notes: "",
  });

  const { data: suppliers } = trpc.suppliers.list.useQuery({});
  const { data: brokers } = trpc.impex.listBrokers.useQuery({ isActive: true });
  const { data: incoterms } = trpc.impex.listIncoterms.useQuery({ isActive: true });
  const { data: cargoTypes } = trpc.impex.listCargoTypes.useQuery({ isActive: true });
  const { data: ports } = trpc.impex.listPorts.useQuery({ isActive: true });

  const createMutation = trpc.impex.createProcess.useMutation({
    onSuccess: (data) => {
      router.push(`/impex/processes/${data.id}`);
    },
    onError: (error) => {
      alert(`Erro ao criar processo: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    createMutation.mutate({
      processNumber: formData.processNumber,
      reference: formData.reference || undefined,
      supplierId: formData.supplierId,
      brokerId: formData.brokerId || undefined,
      incotermId: formData.incotermId,
      cargoTypeId: formData.cargoTypeId,
      originPortId: formData.originPortId,
      destPortId: formData.destPortId,
      invoiceValue: formData.invoiceValue,
      currency: formData.currency,
      exchangeRate: formData.exchangeRate ? parseFloat(formData.exchangeRate) : undefined,
      freightValue: formData.freightValue ? parseFloat(formData.freightValue) : undefined,
      insuranceValue: formData.insuranceValue ? parseFloat(formData.insuranceValue) : undefined,
      invoiceDate: formData.invoiceDate || undefined,
      invoiceNumber: formData.invoiceNumber || undefined,
      etd: formData.etd || undefined,
      eta: formData.eta || undefined,
      blNumber: formData.blNumber || undefined,
      notes: formData.notes || undefined,
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "invoiceValue" ? parseFloat(value) || 0 : value,
    }));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Novo Processo de Importação"
        icon={<Ship className="w-6 h-6" />}
        module="PURCHASES"
        breadcrumbs={[
          { label: "ImpEx", href: "/impex" },
          { label: "Processos", href: "/impex/processes" },
          { label: "Novo" },
        ]}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-theme-card border border-theme rounded-lg p-6">
          <h3 className="font-semibold text-theme mb-4">Informações Básicas</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-theme mb-1">
                Número do Processo *
              </label>
              <input
                type="text"
                name="processNumber"
                value={formData.processNumber}
                onChange={handleChange}
                required
                placeholder="PI-2026-0001"
                className="w-full px-3 py-2 border border-theme rounded-lg bg-theme-secondary text-theme"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-theme mb-1">
                Referência
              </label>
              <input
                type="text"
                name="reference"
                value={formData.reference}
                onChange={handleChange}
                placeholder="Referência do fornecedor"
                className="w-full px-3 py-2 border border-theme rounded-lg bg-theme-secondary text-theme"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-theme mb-1">
                Fornecedor *
              </label>
              <select
                name="supplierId"
                value={formData.supplierId}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-theme rounded-lg bg-theme-secondary text-theme"
              >
                <option value="">Selecione...</option>
                {suppliers?.suppliers?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.companyName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-theme mb-1">
                Despachante
              </label>
              <select
                name="brokerId"
                value={formData.brokerId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-theme rounded-lg bg-theme-secondary text-theme"
              >
                <option value="">Selecione...</option>
                {brokers?.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-theme mb-1">
                Incoterm *
              </label>
              <select
                name="incotermId"
                value={formData.incotermId}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-theme rounded-lg bg-theme-secondary text-theme"
              >
                <option value="">Selecione...</option>
                {incoterms?.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.code} - {i.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-theme mb-1">
                Tipo de Carga *
              </label>
              <select
                name="cargoTypeId"
                value={formData.cargoTypeId}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-theme rounded-lg bg-theme-secondary text-theme"
              >
                <option value="">Selecione...</option>
                {cargoTypes?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} - {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-theme-card border border-theme rounded-lg p-6">
          <h3 className="font-semibold text-theme mb-4">Rota</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-theme mb-1">
                Porto de Origem *
              </label>
              <select
                name="originPortId"
                value={formData.originPortId}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-theme rounded-lg bg-theme-secondary text-theme"
              >
                <option value="">Selecione...</option>
                {ports?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} - {p.name} ({p.country})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-theme mb-1">
                Porto de Destino *
              </label>
              <select
                name="destPortId"
                value={formData.destPortId}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-theme rounded-lg bg-theme-secondary text-theme"
              >
                <option value="">Selecione...</option>
                {ports?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} - {p.name} ({p.country})
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
                Valor da Invoice *
              </label>
              <input
                type="number"
                name="invoiceValue"
                value={formData.invoiceValue}
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
                name="currency"
                value={formData.currency}
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
              <label className="block text-sm font-medium text-theme mb-1">
                Taxa de Câmbio
              </label>
              <input
                type="number"
                name="exchangeRate"
                value={formData.exchangeRate}
                onChange={handleChange}
                min="0"
                step="0.0001"
                placeholder="5.1234"
                className="w-full px-3 py-2 border border-theme rounded-lg bg-theme-secondary text-theme"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-theme mb-1">
                Número da Invoice
              </label>
              <input
                type="text"
                name="invoiceNumber"
                value={formData.invoiceNumber}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-theme rounded-lg bg-theme-secondary text-theme"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-theme mb-1">
                Frete
              </label>
              <input
                type="number"
                name="freightValue"
                value={formData.freightValue}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-theme rounded-lg bg-theme-secondary text-theme"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-theme mb-1">
                Seguro
              </label>
              <input
                type="number"
                name="insuranceValue"
                value={formData.insuranceValue}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-theme rounded-lg bg-theme-secondary text-theme"
              />
            </div>
          </div>
        </div>

        <div className="bg-theme-card border border-theme rounded-lg p-6">
          <h3 className="font-semibold text-theme mb-4">Datas e Documentos</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-theme mb-1">
                Data da Invoice
              </label>
              <input
                type="date"
                name="invoiceDate"
                value={formData.invoiceDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-theme rounded-lg bg-theme-secondary text-theme"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-theme mb-1">
                ETD (Previsão Embarque)
              </label>
              <input
                type="date"
                name="etd"
                value={formData.etd}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-theme rounded-lg bg-theme-secondary text-theme"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-theme mb-1">
                ETA (Previsão Chegada)
              </label>
              <input
                type="date"
                name="eta"
                value={formData.eta}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-theme rounded-lg bg-theme-secondary text-theme"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-theme mb-1">
                Número do BL
              </label>
              <input
                type="text"
                name="blNumber"
                value={formData.blNumber}
                onChange={handleChange}
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
            rows={4}
            className="w-full px-3 py-2 border border-theme rounded-lg bg-theme-secondary text-theme"
            placeholder="Observações adicionais..."
          />
        </div>

        <div className="flex justify-end gap-4">
          <Link
            href="/impex/processes"
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
