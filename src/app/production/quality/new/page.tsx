"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { ClipboardCheck, Plus, Trash2, Save, ArrowLeft } from "lucide-react";
import Link from "next/link";

type InspectionType = "RECEIVING" | "IN_PROCESS" | "FINAL" | "AUDIT";

interface InspectionItem {
  id: string;
  characteristic: string;
  specification: string;
  toleranceMin?: number;
  toleranceMax?: number;
}

export default function NewQualityInspectionPage() {
  const router = useRouter();
  const [type, setType] = useState<InspectionType>("RECEIVING");
  const [lotNumber, setLotNumber] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [sampleSize, setSampleSize] = useState<number | undefined>();
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<InspectionItem[]>([]);

  const createMutation = trpc.quality.createInspection.useMutation({
    onSuccess: () => {
      router.push(`/production/quality`);
    },
  });

  const addItem = () => {
    setItems([
      ...items,
      {
        id: `item-${Date.now()}`,
        characteristic: "",
        specification: "",
      },
    ]);
  };

  const updateItem = (index: number, field: keyof InspectionItem, value: string | number) => {
    const newItems = [...items];
    if (field === "toleranceMin" || field === "toleranceMax") {
      newItems[index][field] = value as number;
    } else if (field === "characteristic" || field === "specification") {
      newItems[index][field] = value as string;
    }
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      type,
      lotNumber: lotNumber || undefined,
      quantity,
      sampleSize,
      notes: notes || undefined,
      items: items.length > 0 ? items.map((item) => ({
        characteristic: item.characteristic,
        specification: item.specification || undefined,
        toleranceMin: item.toleranceMin,
        toleranceMax: item.toleranceMax,
      })) : undefined,
    });
  };

  const inspectionTypes = [
    { value: "RECEIVING", label: "Recebimento" },
    { value: "IN_PROCESS", label: "Em Processo" },
    { value: "FINAL", label: "Final" },
    { value: "AUDIT", label: "Auditoria" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nova Inspeção de Qualidade"
        module="PRODUCTION"
        icon={<ClipboardCheck className="w-6 h-6" />}
        breadcrumbs={[
          { label: "Produção", href: "/production" },
          { label: "Qualidade", href: "/production/quality" },
          { label: "Nova" },
        ]}
      />

      <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
        {/* Dados Básicos */}
        <div className="bg-theme-card border border-theme rounded-lg p-6">
          <h3 className="font-semibold text-theme mb-4">Dados da Inspeção</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-theme mb-1">Tipo de Inspeção</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as InspectionType)}
                className="w-full px-4 py-2 bg-theme-input border border-theme-input rounded-lg text-theme"
              >
                {inspectionTypes.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-theme mb-1">Número do Lote</label>
              <input
                type="text"
                value={lotNumber}
                onChange={(e) => setLotNumber(e.target.value)}
                className="w-full px-4 py-2 bg-theme-input border border-theme-input rounded-lg text-theme"
                placeholder="Ex: LOTE-2026-001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-theme mb-1">Quantidade</label>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full px-4 py-2 bg-theme-input border border-theme-input rounded-lg text-theme"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-theme mb-1">Tamanho da Amostra</label>
              <input
                type="number"
                min={1}
                value={sampleSize || ""}
                onChange={(e) => setSampleSize(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-4 py-2 bg-theme-input border border-theme-input rounded-lg text-theme"
                placeholder="Opcional"
              />
            </div>
          </div>
        </div>

        {/* Itens de Inspeção */}
        <div className="bg-theme-card border border-theme rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-theme">Itens a Inspecionar</h3>
            <button
              type="button"
              onClick={addItem}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" /> Adicionar Item
            </button>
          </div>
          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={item.id} className="flex items-start gap-3 p-3 bg-theme-hover rounded-lg">
                <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                  <input
                    type="text"
                    value={item.characteristic}
                    onChange={(e) => updateItem(index, "characteristic", e.target.value)}
                    placeholder="Característica"
                    className="px-3 py-2 bg-theme-input border border-theme-input rounded-lg text-theme"
                    required
                  />
                  <input
                    type="text"
                    value={item.specification}
                    onChange={(e) => updateItem(index, "specification", e.target.value)}
                    placeholder="Especificação"
                    className="px-3 py-2 bg-theme-input border border-theme-input rounded-lg text-theme"
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={item.toleranceMin || ""}
                    onChange={(e) => updateItem(index, "toleranceMin", Number(e.target.value))}
                    placeholder="Tolerância Mín"
                    className="px-3 py-2 bg-theme-input border border-theme-input rounded-lg text-theme"
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={item.toleranceMax || ""}
                    onChange={(e) => updateItem(index, "toleranceMax", Number(e.target.value))}
                    placeholder="Tolerância Máx"
                    className="px-3 py-2 bg-theme-input border border-theme-input rounded-lg text-theme"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="p-2 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {items.length === 0 && (
              <p className="text-center text-theme-muted py-4">
                Adicione itens para criar um checklist de inspeção
              </p>
            )}
          </div>
        </div>

        {/* Observações */}
        <div className="bg-theme-card border border-theme rounded-lg p-6">
          <h3 className="font-semibold text-theme mb-4">Observações</h3>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-4 py-2 bg-theme-input border border-theme-input rounded-lg text-theme"
            rows={3}
            placeholder="Observações adicionais..."
          />
        </div>

        {/* Ações */}
        <div className="flex gap-4">
          <Link
            href="/production/quality"
            className="flex items-center gap-2 px-4 py-2 border border-theme rounded-lg hover:bg-theme-secondary text-theme"
          >
            <ArrowLeft className="w-4 h-4" />
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={createMutation.isPending || quantity <= 0}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {createMutation.isPending ? "Criando..." : "Criar Inspeção"}
          </button>
        </div>
      </form>
    </div>
  );
}
