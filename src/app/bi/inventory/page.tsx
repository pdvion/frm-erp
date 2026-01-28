"use client";

import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import {
  Package,
  TrendingUp,
  AlertTriangle,
  MapPin,
  BarChart3,
  Boxes,
  ArrowRightLeft,
} from "lucide-react";
import Link from "next/link";
import { formatNumber, formatCurrency } from "@/lib/formatters";

export default function BIInventoryPage() {
  const { data: dashboard, isLoading } = trpc.dashboard.inventoryKpis.useQuery();

  const cards = [
    {
      title: "Total de Itens",
      value: formatNumber(dashboard?.summary?.totalItems || 0),
      subtitle: "SKUs cadastrados",
      icon: <Package className="w-5 h-5" />,
      color: "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30",
    },
    {
      title: "Valor em Estoque",
      value: formatCurrency(dashboard?.summary?.totalValue || 0),
      subtitle: "Custo médio",
      icon: <Boxes className="w-5 h-5" />,
      color: "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30",
    },
    {
      title: "Itens Críticos",
      value: formatNumber(dashboard?.summary?.lowStock || 0),
      subtitle: "Abaixo do mínimo",
      icon: <AlertTriangle className="w-5 h-5" />,
      color: "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30",
    },
    {
      title: "Sem Estoque",
      value: formatNumber(dashboard?.summary?.zeroStock || 0),
      subtitle: "Zerados",
      icon: <MapPin className="w-5 h-5" />,
      color: "text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="BI Estoque"
        icon={<Package className="w-6 h-6" />}
        module="BI"
        breadcrumbs={[
          { label: "BI", href: "/bi" },
          { label: "Estoque" },
        ]}
      />

      {isLoading ? (
        <div className="bg-theme-card border border-theme rounded-lg p-8 text-center text-theme-muted">
          Carregando...
        </div>
      ) : (
        <>
          {/* Cards de métricas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((card, idx) => (
              <div
                key={idx}
                className="bg-theme-card border border-theme rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-lg ${card.color}`}>
                    {card.icon}
                  </div>
                </div>
                <p className="text-2xl font-bold text-theme">{card.value}</p>
                <p className="text-sm text-theme-muted">{card.title}</p>
                <p className="text-xs text-theme-muted mt-1">{card.subtitle}</p>
              </div>
            ))}
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-theme-card border border-theme rounded-lg p-6">
              <h3 className="text-lg font-semibold text-theme mb-4">
                Movimentação Mensal
              </h3>
              <div className="h-64 flex items-center justify-center border border-dashed border-theme rounded-lg">
                <div className="text-center text-theme-muted">
                  <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Entradas vs Saídas</p>
                </div>
              </div>
            </div>

            <div className="bg-theme-card border border-theme rounded-lg p-6">
              <h3 className="text-lg font-semibold text-theme mb-4">
                Curva ABC
              </h3>
              <div className="h-64 flex items-center justify-center border border-dashed border-theme rounded-lg">
                <div className="text-center text-theme-muted">
                  <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Classificação de itens</p>
                </div>
              </div>
            </div>
          </div>

          {/* Links rápidos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/inventory"
              className="bg-theme-card border border-theme rounded-lg p-4 hover:shadow-lg transition-shadow"
            >
              <Package className="w-6 h-6 text-blue-600 mb-2" />
              <h4 className="font-semibold text-theme">Posição de Estoque</h4>
              <p className="text-sm text-theme-muted">Ver saldos atuais</p>
            </Link>
            <Link
              href="/inventory/movements"
              className="bg-theme-card border border-theme rounded-lg p-4 hover:shadow-lg transition-shadow"
            >
              <ArrowRightLeft className="w-6 h-6 text-green-600 mb-2" />
              <h4 className="font-semibold text-theme">Movimentações</h4>
              <p className="text-sm text-theme-muted">Histórico de entradas/saídas</p>
            </Link>
            <Link
              href="/locations"
              className="bg-theme-card border border-theme rounded-lg p-4 hover:shadow-lg transition-shadow"
            >
              <MapPin className="w-6 h-6 text-purple-600 mb-2" />
              <h4 className="font-semibold text-theme">Localizações</h4>
              <p className="text-sm text-theme-muted">Gerenciar endereços</p>
            </Link>
          </div>
        </>
      )}

      <div className="flex gap-4">
        <Link
          href="/bi"
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
        >
          ← Voltar para BI
        </Link>
      </div>
    </div>
  );
}
