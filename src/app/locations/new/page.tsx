"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  MapPin,
  Save,
  ArrowLeft,
  Warehouse,
  Factory,
  CheckCircle,
  Truck,
  Package,
  Building2,
} from "lucide-react";

const locationTypes = [
  { value: "WAREHOUSE", label: "Almoxarifado", icon: Warehouse, description: "Armazenamento geral" },
  { value: "PRODUCTION", label: "Produção", icon: Factory, description: "Área de produção" },
  { value: "QUALITY", label: "Qualidade", icon: CheckCircle, description: "Inspeção de qualidade" },
  { value: "SHIPPING", label: "Expedição", icon: Truck, description: "Área de expedição" },
  { value: "RECEIVING", label: "Recebimento", icon: Package, description: "Área de recebimento" },
  { value: "EXTERNAL", label: "Externo", icon: Building2, description: "Local externo/terceiros" },
] as const;

type LocationType = typeof locationTypes[number]["value"];

export default function NewLocationPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    code: "",
    name: "",
    description: "",
    type: "WAREHOUSE" as LocationType,
    parentId: "",
    address: "",
    isDefault: false,
  });

  const { data: locations } = trpc.stockLocations.list.useQuery({
    includeInactive: false,
  });

  const createMutation = trpc.stockLocations.create.useMutation({
    onSuccess: () => {
      router.push("/locations");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      code: form.code,
      name: form.name,
      description: form.description || undefined,
      type: form.type,
      parentId: form.parentId || undefined,
      address: form.address || undefined,
      isDefault: form.isDefault,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nova Localização"
        subtitle="Cadastrar nova localização de estoque"
        icon={<MapPin className="w-6 h-6" />}
        module="INVENTORY"
        backHref="/locations"
        backLabel="Voltar"
      />

      <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
        {/* Dados Básicos */}
        <div className="bg-theme-card border border-theme rounded-lg p-6">
          <h3 className="text-lg font-semibold text-theme mb-4">Dados Básicos</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Código *"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
              placeholder="Ex: ALM-01"
              required
            />

            <Input
              label="Nome *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Ex: Almoxarifado Principal"
              required
            />

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-theme mb-1">
                Descrição
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Descrição detalhada da localização..."
                rows={2}
                className="w-full px-4 py-2 bg-theme-input border border-theme-input rounded-lg text-theme placeholder-theme-muted focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Tipo de Localização */}
        <div className="bg-theme-card border border-theme rounded-lg p-6">
          <h3 className="text-lg font-semibold text-theme mb-4">Tipo de Localização</h3>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {locationTypes.map((type) => {
              const Icon = type.icon;
              const isSelected = form.type === type.value;
              return (
                <Button
                  key={type.value}
                  type="button"
                  variant="ghost"
                  onClick={() => setForm({ ...form, type: type.value })}
                  className={`p-4 rounded-lg border-2 text-left transition-all h-auto flex-col items-start justify-start ${
                    isSelected
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                      : "border-theme hover:border-blue-300 hover:bg-theme-secondary"
                  }`}
                >
                  <Icon className={`w-5 h-5 mb-2 ${isSelected ? "text-blue-600" : "text-theme-muted"}`} />
                  <div className={`font-medium ${isSelected ? "text-blue-600" : "text-theme"}`}>
                    {type.label}
                  </div>
                  <div className="text-xs text-theme-muted">{type.description}</div>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Hierarquia */}
        <div className="bg-theme-card border border-theme rounded-lg p-6">
          <h3 className="text-lg font-semibold text-theme mb-4">Hierarquia</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-theme mb-1">
                Localização Pai
              </label>
              <select
                value={form.parentId}
                onChange={(e) => setForm({ ...form, parentId: e.target.value })}
                className="w-full px-4 py-2 bg-theme-input border border-theme-input rounded-lg text-theme focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Nenhuma (raiz)</option>
                {locations?.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.code} - {loc.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-theme-muted mt-1">
                Selecione uma localização pai para criar hierarquia
              </p>
            </div>

            <Input
              label="Endereço/Posição"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Ex: Corredor A, Prateleira 3"
            />

            <div className="md:col-span-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                  className="w-4 h-4 rounded border-theme-input text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-theme">
                  Definir como localização padrão para novos recebimentos
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Erro */}
        {createMutation.error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200">
            {createMutation.error.message}
          </div>
        )}

        {/* Ações */}
        <div className="flex gap-4">
          <Link href="/locations">
            <Button
              type="button"
              variant="secondary"
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Cancelar
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={!form.code || !form.name}
            isLoading={createMutation.isPending}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Salvar Localização
          </Button>
        </div>
      </form>
    </div>
  );
}
