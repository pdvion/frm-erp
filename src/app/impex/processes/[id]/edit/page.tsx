"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Ship, Save, X, Loader2 } from "lucide-react";
import Link from "next/link";

const STATUS_OPTIONS = [
  { value: "DRAFT", label: "Rascunho" },
  { value: "PENDING_SHIPMENT", label: "Aguardando Embarque" },
  { value: "IN_TRANSIT", label: "Em Trânsito" },
  { value: "ARRIVED", label: "Chegou" },
  { value: "IN_CLEARANCE", label: "Em Desembaraço" },
  { value: "CLEARED", label: "Desembaraçado" },
  { value: "DELIVERED", label: "Entregue" },
  { value: "CANCELLED", label: "Cancelado" },
];

type StatusValue = "DRAFT" | "PENDING_SHIPMENT" | "IN_TRANSIT" | "ARRIVED" | "IN_CLEARANCE" | "CLEARED" | "DELIVERED" | "CANCELLED";

export default function EditImportProcessPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
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
    status: "DRAFT" as StatusValue,
    invoiceValue: 0,
    currency: "USD",
    exchangeRate: "",
    freightValue: "",
    insuranceValue: "",
    invoiceDate: "",
    invoiceNumber: "",
    etd: "",
    eta: "",
    arrivalDate: "",
    clearanceDate: "",
    blNumber: "",
    diNumber: "",
    notes: "",
  });

  const { data: process, isLoading: loadingProcess } = trpc.impex.getProcess.useQuery({ id });
  const { data: suppliers } = trpc.suppliers.list.useQuery({});
  const { data: brokers } = trpc.impex.listBrokers.useQuery({ isActive: true });
  const { data: incoterms } = trpc.impex.listIncoterms.useQuery({ isActive: true });
  const { data: cargoTypes } = trpc.impex.listCargoTypes.useQuery({ isActive: true });
  const { data: ports } = trpc.impex.listPorts.useQuery({ isActive: true });

  const updateMutation = trpc.impex.updateProcess.useMutation({
    onSuccess: () => {
      router.push(`/impex/processes/${id}`);
    },
    onError: (error) => {
      alert(`Erro ao atualizar processo: ${error.message}`);
    },
  });

  useEffect(() => {
    if (process) {
      const formatDateForInput = (date: Date | string | null | undefined) => {
        if (!date) return "";
        return new Date(date).toISOString().split("T")[0];
      };

      setFormData({
        processNumber: process.processNumber,
        reference: process.reference || "",
        supplierId: process.supplierId,
        brokerId: process.brokerId || "",
        incotermId: process.incotermId,
        cargoTypeId: process.cargoTypeId,
        originPortId: process.originPortId,
        destPortId: process.destPortId,
        status: process.status as StatusValue,
        invoiceValue: Number(process.invoiceValue),
        currency: process.currency,
        exchangeRate: process.exchangeRate ? String(process.exchangeRate) : "",
        freightValue: process.freightValue ? String(process.freightValue) : "",
        insuranceValue: process.insuranceValue ? String(process.insuranceValue) : "",
        invoiceDate: formatDateForInput(process.invoiceDate),
        invoiceNumber: process.invoiceNumber || "",
        etd: formatDateForInput(process.etd),
        eta: formatDateForInput(process.eta),
        arrivalDate: formatDateForInput(process.arrivalDate),
        clearanceDate: formatDateForInput(process.clearanceDate),
        blNumber: process.blNumber || "",
        diNumber: process.diNumber || "",
        notes: process.notes || "",
      });
    }
  }, [process]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    updateMutation.mutate({
      id,
      processNumber: formData.processNumber,
      reference: formData.reference || null,
      supplierId: formData.supplierId,
      brokerId: formData.brokerId || null,
      incotermId: formData.incotermId,
      cargoTypeId: formData.cargoTypeId,
      originPortId: formData.originPortId,
      destPortId: formData.destPortId,
      status: formData.status,
      invoiceValue: formData.invoiceValue,
      currency: formData.currency,
      exchangeRate: formData.exchangeRate ? parseFloat(formData.exchangeRate) : null,
      freightValue: formData.freightValue ? parseFloat(formData.freightValue) : null,
      insuranceValue: formData.insuranceValue ? parseFloat(formData.insuranceValue) : null,
      invoiceDate: formData.invoiceDate || null,
      invoiceNumber: formData.invoiceNumber || null,
      etd: formData.etd || null,
      eta: formData.eta || null,
      arrivalDate: formData.arrivalDate || null,
      clearanceDate: formData.clearanceDate || null,
      blNumber: formData.blNumber || null,
      diNumber: formData.diNumber || null,
      notes: formData.notes || null,
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

  if (loadingProcess) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!process) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-theme">Processo não encontrado</h2>
        <Link href="/impex/processes" className="text-blue-600 hover:underline mt-2 inline-block">
          Voltar para lista
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Editar ${process.processNumber}`}
        icon={<Ship className="w-6 h-6" />}
        module="PURCHASES"
        breadcrumbs={[
          { label: "ImpEx", href: "/impex" },
          { label: "Processos", href: "/impex/processes" },
          { label: process.processNumber, href: `/impex/processes/${id}` },
          { label: "Editar" },
        ]}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-theme-card border border-theme rounded-lg p-6">
          <h3 className="font-semibold text-theme mb-4">Informações Básicas</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              label="Número do Processo *"
              name="processNumber"
              value={formData.processNumber}
              onChange={handleChange}
              required
            />
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
            <Input
              label="Referência"
              name="reference"
              value={formData.reference}
              onChange={handleChange}
            />
            <div>
              <label className="block text-sm font-medium text-theme mb-1">Fornecedor *</label>
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
              <label className="block text-sm font-medium text-theme mb-1">Despachante</label>
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
              <label className="block text-sm font-medium text-theme mb-1">Incoterm *</label>
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
              <label className="block text-sm font-medium text-theme mb-1">Tipo de Carga *</label>
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
              <label className="block text-sm font-medium text-theme mb-1">Porto de Origem *</label>
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
              <label className="block text-sm font-medium text-theme mb-1">Porto de Destino *</label>
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
            <Input
              label="Valor da Invoice *"
              type="number"
              name="invoiceValue"
              value={formData.invoiceValue}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
            />
            <div>
              <label className="block text-sm font-medium text-theme mb-1">Moeda</label>
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
            <Input
              label="Taxa de Câmbio"
              type="number"
              name="exchangeRate"
              value={formData.exchangeRate}
              onChange={handleChange}
              min="0"
              step="0.0001"
            />
            <Input
              label="Número da Invoice"
              name="invoiceNumber"
              value={formData.invoiceNumber}
              onChange={handleChange}
            />
            <Input
              label="Frete"
              type="number"
              name="freightValue"
              value={formData.freightValue}
              onChange={handleChange}
              min="0"
              step="0.01"
            />
            <Input
              label="Seguro"
              type="number"
              name="insuranceValue"
              value={formData.insuranceValue}
              onChange={handleChange}
              min="0"
              step="0.01"
            />
          </div>
        </div>

        <div className="bg-theme-card border border-theme rounded-lg p-6">
          <h3 className="font-semibold text-theme mb-4">Datas e Documentos</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              label="Data da Invoice"
              type="date"
              name="invoiceDate"
              value={formData.invoiceDate}
              onChange={handleChange}
            />
            <Input
              label="ETD"
              type="date"
              name="etd"
              value={formData.etd}
              onChange={handleChange}
            />
            <Input
              label="ETA"
              type="date"
              name="eta"
              value={formData.eta}
              onChange={handleChange}
            />
            <Input
              label="Chegada Real"
              type="date"
              name="arrivalDate"
              value={formData.arrivalDate}
              onChange={handleChange}
            />
            <Input
              label="Desembaraço"
              type="date"
              name="clearanceDate"
              value={formData.clearanceDate}
              onChange={handleChange}
            />
            <Input
              label="Número do BL"
              name="blNumber"
              value={formData.blNumber}
              onChange={handleChange}
            />
            <Input
              label="Número da DI"
              name="diNumber"
              value={formData.diNumber}
              onChange={handleChange}
            />
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
          />
        </div>

        <div className="flex justify-end gap-4">
          <Link
            href={`/impex/processes/${id}`}
            className="flex items-center gap-2 px-4 py-2 border border-theme rounded-lg hover:bg-theme-secondary"
          >
            <X className="w-4 h-4" />
            Cancelar
          </Link>
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
