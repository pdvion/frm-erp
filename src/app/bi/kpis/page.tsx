"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import {
  Target,
  Plus,
  TrendingUp,
  TrendingDown,
  Filter,
  Pencil,
  BarChart3,
  DollarSign,
  Package,
  Factory,
  ShoppingCart,
  Users,
} from "lucide-react";
import Link from "next/link";

type KpiCategory = "FINANCIAL" | "PURCHASING" | "INVENTORY" | "PRODUCTION" | "SALES" | "HR";

export default function BIKPIsPage() {
  const [categoryFilter, setCategoryFilter] = useState<KpiCategory | "ALL">("ALL");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKpi, setNewKpi] = useState({
    code: "",
    name: "",
    description: "",
    category: "FINANCIAL" as KpiCategory,
    unit: "%",
    targetExpected: 0,
    polarity: "HIGHER" as "HIGHER" | "LOWER",
    frequency: "MONTHLY" as "DAILY" | "WEEKLY" | "MONTHLY",
  });

  const { data: kpis, isLoading, refetch } = trpc.bi.listKpis.useQuery({
    category: categoryFilter !== "ALL" ? categoryFilter : undefined,
    isActive: true,
  });

  const createMutation = trpc.bi.createKpi.useMutation({
    onSuccess: () => {
      setShowCreateModal(false);
      setNewKpi({
        code: "",
        name: "",
        description: "",
        category: "FINANCIAL",
        unit: "%",
        targetExpected: 0,
        polarity: "HIGHER",
        frequency: "MONTHLY",
      });
      refetch();
    },
  });

  const handleCreate = () => {
    if (!newKpi.code.trim() || !newKpi.name.trim()) return;
    createMutation.mutate(newKpi);
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, React.ReactNode> = {
      FINANCIAL: <DollarSign className="w-5 h-5" />,
      PURCHASING: <ShoppingCart className="w-5 h-5" />,
      INVENTORY: <Package className="w-5 h-5" />,
      PRODUCTION: <Factory className="w-5 h-5" />,
      SALES: <BarChart3 className="w-5 h-5" />,
      HR: <Users className="w-5 h-5" />,
    };
    return icons[category] || <Target className="w-5 h-5" />;
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      FINANCIAL: "Financeiro",
      PURCHASING: "Compras",
      INVENTORY: "Estoque",
      PRODUCTION: "Produção",
      SALES: "Vendas",
      HR: "RH",
    };
    return labels[category] || category;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      FINANCIAL: "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30",
      PURCHASING: "text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30",
      INVENTORY: "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30",
      PRODUCTION: "text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30",
      SALES: "text-pink-600 dark:text-pink-400 bg-pink-100 dark:bg-pink-900/30",
      HR: "text-cyan-600 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-900/30",
    };
    return colors[category] || "text-theme-muted bg-theme-tertiary dark:bg-theme/30";
  };

  const categoryOptions: { value: KpiCategory | "ALL"; label: string }[] = [
    { value: "ALL", label: "Todas" },
    { value: "FINANCIAL", label: "Financeiro" },
    { value: "PURCHASING", label: "Compras" },
    { value: "INVENTORY", label: "Estoque" },
    { value: "PRODUCTION", label: "Produção" },
    { value: "SALES", label: "Vendas" },
    { value: "HR", label: "RH" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="KPIs"
        icon={<Target className="w-6 h-6" />}
        module="BI"
        breadcrumbs={[
          { label: "BI", href: "/bi" },
          { label: "KPIs" },
        ]}
        actions={
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Novo KPI
          </button>
        }
      />

      {/* Filtros */}
      <div className="bg-theme-card border border-theme rounded-lg p-4">
        <div className="flex items-center gap-4">
          <Filter className="w-4 h-4 text-theme-muted" />
          <span className="text-sm text-theme-muted">Categoria:</span>
          <div className="flex flex-wrap gap-2">
            {categoryOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setCategoryFilter(opt.value)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  categoryFilter === opt.value
                    ? "bg-blue-600 text-white"
                    : "border border-theme text-theme hover:bg-theme-secondary"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lista de KPIs */}
      {isLoading ? (
        <div className="bg-theme-card border border-theme rounded-lg p-8 text-center text-theme-muted">
          Carregando...
        </div>
      ) : !kpis || kpis.length === 0 ? (
        <div className="bg-theme-card border border-theme rounded-lg p-8 text-center">
          <Target className="w-12 h-12 mx-auto text-theme-muted mb-3" />
          <p className="text-theme-muted">Nenhum KPI cadastrado</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 text-blue-600 dark:text-blue-400 hover:underline"
          >
            Criar primeiro KPI
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {kpis.map((kpi) => (
            <div
              key={kpi.id}
              className="bg-theme-card border border-theme rounded-lg p-4 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`p-2 rounded-lg ${getCategoryColor(kpi.category)}`}>
                  {getCategoryIcon(kpi.category)}
                </div>
                <span className="text-xs text-theme-muted font-mono">{kpi.code}</span>
              </div>

              <h3 className="font-semibold text-theme mb-1">{kpi.name}</h3>
              {kpi.description && (
                <p className="text-sm text-theme-muted mb-3 line-clamp-2">{kpi.description}</p>
              )}

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  {kpi.polarity === "HIGHER" ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  )}
                  <span className="text-theme-muted">
                    Meta: {kpi.targetExpected ?? "—"}{kpi.unit}
                  </span>
                </div>
                <span className={`px-2 py-0.5 text-xs rounded ${getCategoryColor(kpi.category)}`}>
                  {getCategoryLabel(kpi.category)}
                </span>
              </div>

              <div className="flex gap-2 mt-4 pt-3 border-t border-theme">
                <Link
                  href={`/bi/kpis/${kpi.id}`}
                  className="flex-1 text-center px-3 py-1.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                >
                  Ver Detalhes
                </Link>
                <Link
                  href={`/bi/kpis/${kpi.id}/edit`}
                  className="px-3 py-1.5 text-theme-muted hover:bg-theme-secondary rounded-lg transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Links */}
      <div className="flex gap-4">
        <Link
          href="/bi"
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          ← Voltar para BI
        </Link>
      </div>

      {/* Modal de criação */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-theme-card border border-theme rounded-lg p-6 max-w-lg w-full mx-4">
            <h3 className="text-lg font-semibold text-theme mb-4">Novo KPI</h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-theme mb-1">Código *</label>
                  <input
                    type="text"
                    value={newKpi.code}
                    onChange={(e) => setNewKpi({ ...newKpi, code: e.target.value })}
                    placeholder="Ex: KPI-001"
                    className="w-full px-4 py-2 bg-theme-input border border-theme-input rounded-lg text-theme"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-theme mb-1">Categoria *</label>
                  <select
                    value={newKpi.category}
                    onChange={(e) => setNewKpi({ ...newKpi, category: e.target.value as KpiCategory })}
                    className="w-full px-4 py-2 bg-theme-input border border-theme-input rounded-lg text-theme"
                  >
                    {categoryOptions.filter((c) => c.value !== "ALL").map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-theme mb-1">Nome *</label>
                <input
                  type="text"
                  value={newKpi.name}
                  onChange={(e) => setNewKpi({ ...newKpi, name: e.target.value })}
                  placeholder="Ex: Taxa de Conversão de Vendas"
                  className="w-full px-4 py-2 bg-theme-input border border-theme-input rounded-lg text-theme"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-theme mb-1">Descrição</label>
                <textarea
                  value={newKpi.description}
                  onChange={(e) => setNewKpi({ ...newKpi, description: e.target.value })}
                  rows={2}
                  placeholder="Descrição do KPI..."
                  className="w-full px-4 py-2 bg-theme-input border border-theme-input rounded-lg text-theme resize-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-theme mb-1">Unidade</label>
                  <input
                    type="text"
                    value={newKpi.unit}
                    onChange={(e) => setNewKpi({ ...newKpi, unit: e.target.value })}
                    placeholder="%"
                    className="w-full px-4 py-2 bg-theme-input border border-theme-input rounded-lg text-theme"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-theme mb-1">Meta</label>
                  <input
                    type="number"
                    value={newKpi.targetExpected}
                    onChange={(e) => setNewKpi({ ...newKpi, targetExpected: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 bg-theme-input border border-theme-input rounded-lg text-theme"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-theme mb-1">Polaridade</label>
                  <select
                    value={newKpi.polarity}
                    onChange={(e) => setNewKpi({ ...newKpi, polarity: e.target.value as "HIGHER" | "LOWER" })}
                    className="w-full px-4 py-2 bg-theme-input border border-theme-input rounded-lg text-theme"
                  >
                    <option value="HIGHER">Maior é melhor</option>
                    <option value="LOWER">Menor é melhor</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 border border-theme rounded-lg text-theme hover:bg-theme-secondary transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={!newKpi.code.trim() || !newKpi.name.trim() || createMutation.isPending}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {createMutation.isPending ? "Criando..." : "Criar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
