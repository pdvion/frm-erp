"use client";

import { PageHeader } from "@/components/PageHeader";
import { TrendingUp, Download, Users, FileText, DollarSign, Target, BarChart3 } from "lucide-react";
import Link from "next/link";

const reports = [
  {
    title: "Vendas por Período",
    description: "Faturamento por dia, semana ou mês",
    icon: <BarChart3 className="w-5 h-5" />,
    href: "/reports/sales/period",
  },
  {
    title: "Vendas por Cliente",
    description: "Ranking de clientes por volume",
    icon: <Users className="w-5 h-5" />,
    href: "/reports/sales/by-customer",
  },
  {
    title: "Vendas por Produto",
    description: "Produtos mais vendidos",
    icon: <TrendingUp className="w-5 h-5" />,
    href: "/reports/sales/by-product",
  },
  {
    title: "Comissões",
    description: "Comissões por vendedor",
    icon: <DollarSign className="w-5 h-5" />,
    href: "/reports/sales/commissions",
  },
  {
    title: "Metas de Vendas",
    description: "Acompanhamento de metas",
    icon: <Target className="w-5 h-5" />,
    href: "/reports/sales/targets",
  },
  {
    title: "Pedidos de Venda",
    description: "Status e histórico de pedidos",
    icon: <FileText className="w-5 h-5" />,
    href: "/sales/orders",
  },
];

export default function SalesReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Relatórios de Vendas"
        icon={<TrendingUp className="w-6 h-6" />}
        module="REPORTS"
        breadcrumbs={[
          { label: "Relatórios", href: "/reports" },
          { label: "Vendas" },
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((report, idx) => (
          <Link
            key={idx}
            href={report.href}
            className="bg-theme-card border border-theme rounded-lg p-4 hover:shadow-lg transition-shadow group"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                {report.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-theme group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                  {report.title}
                </h3>
                <p className="text-sm text-theme-muted mt-1">{report.description}</p>
              </div>
              <Download className="w-4 h-4 text-theme-muted opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </Link>
        ))}
      </div>

      <div className="flex gap-4">
        <Link href="/reports" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
          ← Voltar para Relatórios
        </Link>
      </div>
    </div>
  );
}
