"use client";

import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  Target,
  Award,
  MapPin,
  Calendar,
} from "lucide-react";

// Dados mockados para KPIs de vendas
const salesKPIs = {
  totalSales: 1250000,
  salesTarget: 1500000,
  ordersCount: 342,
  avgTicket: 3654.97,
  conversionRate: 23.5,
  newCustomers: 45,
  returningCustomers: 297,
  growthVsLastMonth: 12.3,
};

const topProducts = [
  { name: "Produto Premium A", qty: 156, revenue: 234000, growth: 15.2 },
  { name: "Produto Standard B", qty: 289, revenue: 189500, growth: 8.7 },
  { name: "Produto Basic C", qty: 412, revenue: 165800, growth: -2.3 },
  { name: "Produto Plus D", qty: 98, revenue: 147000, growth: 22.1 },
  { name: "Produto Economy E", qty: 523, revenue: 104600, growth: 5.4 },
];

const topSellers = [
  { name: "Maria Silva", sales: 285000, orders: 78, target: 300000 },
  { name: "João Santos", sales: 245000, orders: 65, target: 250000 },
  { name: "Ana Oliveira", sales: 198000, orders: 52, target: 200000 },
  { name: "Carlos Lima", sales: 175000, orders: 48, target: 200000 },
  { name: "Paula Costa", sales: 162000, orders: 45, target: 180000 },
];

const salesByRegion = [
  { region: "Sudeste", value: 625000, pct: 50 },
  { region: "Sul", value: 312500, pct: 25 },
  { region: "Nordeste", value: 187500, pct: 15 },
  { region: "Centro-Oeste", value: 87500, pct: 7 },
  { region: "Norte", value: 37500, pct: 3 },
];

const monthlyData = [
  { month: "Jan", value: 980000 },
  { month: "Fev", value: 1050000 },
  { month: "Mar", value: 1120000 },
  { month: "Abr", value: 1080000 },
  { month: "Mai", value: 1150000 },
  { month: "Jun", value: 1250000 },
];

export default function BISalesPage() {
  const [period, setPeriod] = useState("month");

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const getProgressPct = (current: number, target: number) => {
    return Math.min(100, (current / target) * 100);
  };

  const maxMonthlyValue = Math.max(...monthlyData.map((d) => d.value));

  return (
    <div className="space-y-6">
      <PageHeader
        title="BI Vendas"
        subtitle="Dashboard de indicadores comerciais"
        icon={<TrendingUp className="w-6 h-6" />}
        module="BI"
        backHref="/bi"
        backLabel="Voltar"
      />

      {/* Filtro de Período */}
      <div className="flex gap-2">
        {[
          { value: "today", label: "Hoje" },
          { value: "week", label: "Semana" },
          { value: "month", label: "Mês" },
          { value: "quarter", label: "Trimestre" },
          { value: "year", label: "Ano" },
        ].map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              period === p.value
                ? "bg-blue-600 text-white"
                : "bg-theme-secondary text-theme hover:bg-theme-tertiary"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-theme-card border border-theme rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <DollarSign className="w-8 h-8 text-green-500" />
            <div className="flex items-center gap-1 text-sm text-green-600">
              <TrendingUp className="w-4 h-4" />
              <span>+{salesKPIs.growthVsLastMonth}%</span>
            </div>
          </div>
          <div className="text-2xl font-bold text-theme">{formatCurrency(salesKPIs.totalSales)}</div>
          <div className="text-sm text-theme-muted">Vendas no Período</div>
          <div className="mt-3 h-1.5 bg-theme-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500"
              style={{ width: `${getProgressPct(salesKPIs.totalSales, salesKPIs.salesTarget)}%` }}
            />
          </div>
          <div className="text-xs text-theme-muted mt-1">
            Meta: {formatCurrency(salesKPIs.salesTarget)}
          </div>
        </div>

        <div className="bg-theme-card border border-theme rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <ShoppingCart className="w-8 h-8 text-blue-500" />
            <span className="text-sm text-theme-muted">pedidos</span>
          </div>
          <div className="text-2xl font-bold text-theme">{salesKPIs.ordersCount}</div>
          <div className="text-sm text-theme-muted">Total de Pedidos</div>
          <div className="mt-3 text-sm">
            <span className="text-theme-muted">Ticket Médio: </span>
            <span className="font-medium text-theme">{formatCurrency(salesKPIs.avgTicket)}</span>
          </div>
        </div>

        <div className="bg-theme-card border border-theme rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <Target className="w-8 h-8 text-purple-500" />
            <span className="text-sm text-theme-muted">conversão</span>
          </div>
          <div className="text-2xl font-bold text-theme">{salesKPIs.conversionRate}%</div>
          <div className="text-sm text-theme-muted">Taxa de Conversão</div>
          <div className="mt-3 h-1.5 bg-theme-secondary rounded-full overflow-hidden">
            <div className="h-full bg-purple-500" style={{ width: `${salesKPIs.conversionRate}%` }} />
          </div>
        </div>

        <div className="bg-theme-card border border-theme rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <Users className="w-8 h-8 text-orange-500" />
            <span className="text-sm text-theme-muted">clientes</span>
          </div>
          <div className="text-2xl font-bold text-theme">{salesKPIs.newCustomers + salesKPIs.returningCustomers}</div>
          <div className="text-sm text-theme-muted">Clientes Atendidos</div>
          <div className="mt-3 flex gap-2 text-xs">
            <span className="px-2 py-0.5 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded">
              {salesKPIs.newCustomers} novos
            </span>
            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded">
              {salesKPIs.returningCustomers} recorrentes
            </span>
          </div>
        </div>
      </div>

      {/* Gráfico de Vendas Mensais (simplificado) */}
      <div className="bg-theme-card border border-theme rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-theme">Evolução de Vendas</h3>
          <Calendar className="w-5 h-5 text-theme-muted" />
        </div>
        <div className="flex items-end gap-4 h-48">
          {monthlyData.map((d) => (
            <div key={d.month} className="flex-1 flex flex-col items-center gap-2">
              <div className="text-xs text-theme-muted">{formatCurrency(d.value)}</div>
              <div
                className="w-full bg-blue-500 rounded-t-lg transition-all hover:bg-blue-600"
                style={{ height: `${(d.value / maxMonthlyValue) * 100}%` }}
              />
              <div className="text-sm font-medium text-theme">{d.month}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Produtos, Vendedores e Regiões */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Produtos */}
        <div className="bg-theme-card border border-theme rounded-xl p-6">
          <h3 className="text-lg font-semibold text-theme mb-4">Top Produtos</h3>
          <div className="space-y-3">
            {topProducts.map((product, idx) => (
              <div key={product.name} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-xs font-bold text-blue-600">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-theme truncate">{product.name}</div>
                  <div className="text-xs text-theme-muted">{product.qty} unidades</div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-theme">{formatCurrency(product.revenue)}</div>
                  <div className={`text-xs ${product.growth >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {product.growth >= 0 ? "+" : ""}{product.growth}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Vendedores */}
        <div className="bg-theme-card border border-theme rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-yellow-500" />
            <h3 className="text-lg font-semibold text-theme">Top Vendedores</h3>
          </div>
          <div className="space-y-3">
            {topSellers.map((seller, idx) => (
              <div key={seller.name} className="p-3 bg-theme-secondary rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {idx === 0 && <span className="text-yellow-500">🥇</span>}
                    {idx === 1 && <span className="text-gray-400">🥈</span>}
                    {idx === 2 && <span className="text-orange-600">🥉</span>}
                    <span className="font-medium text-theme">{seller.name}</span>
                  </div>
                  <span className="text-sm text-theme-muted">{seller.orders} pedidos</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-theme-tertiary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500"
                      style={{ width: `${getProgressPct(seller.sales, seller.target)}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-theme">
                    {Math.round(getProgressPct(seller.sales, seller.target))}%
                  </span>
                </div>
                <div className="text-xs text-theme-muted mt-1">
                  {formatCurrency(seller.sales)} / {formatCurrency(seller.target)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Vendas por Região */}
        <div className="bg-theme-card border border-theme rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-red-500" />
            <h3 className="text-lg font-semibold text-theme">Vendas por Região</h3>
          </div>
          <div className="space-y-4">
            {salesByRegion.map((region) => (
              <div key={region.region}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-theme">{region.region}</span>
                  <span className="text-theme-muted">{formatCurrency(region.value)}</span>
                </div>
                <div className="h-2 bg-theme-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                    style={{ width: `${region.pct}%` }}
                  />
                </div>
                <div className="text-xs text-theme-muted mt-0.5">{region.pct}% do total</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
