"use client";

import { PageHeader } from "@/components/PageHeader";
import { ShoppingBag, Download, Users, FileText, TrendingUp, Clock, BarChart3 } from "lucide-react";
import Link from "next/link";

const reports = [
  {
    title: "Compras por Fornecedor",
    description: "Volume de compras por fornecedor",
    icon: <Users className="w-5 h-5" />,
    href: "/reports/purchases-by-supplier",
  },
  {
    title: "Pedidos de Compra",
    description: "Status e histórico de pedidos",
    icon: <FileText className="w-5 h-5" />,
    href: "/purchases/orders",
  },
  {
    title: "Cotações",
    description: "Análise de cotações recebidas",
    icon: <TrendingUp className="w-5 h-5" />,
    href: "/purchases/quotes",
  },
  {
    title: "Lead Time",
    description: "Tempo médio de entrega por fornecedor",
    icon: <Clock className="w-5 h-5" />,
    href: "/reports/purchases/lead-time",
  },
  {
    title: "Saving de Compras",
    description: "Economia obtida nas negociações",
    icon: <BarChart3 className="w-5 h-5" />,
    href: "/reports/purchases/savings",
  },
  {
    title: "NFes Recebidas",
    description: "Notas fiscais de entrada",
    icon: <FileText className="w-5 h-5" />,
    href: "/invoices/received",
  },
];

export default function PurchasesReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Relatórios de Compras"
        icon={<ShoppingBag className="w-6 h-6" />}
        module="REPORTS"
        breadcrumbs={[
          { label: "Relatórios", href: "/reports" },
          { label: "Compras" },
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
              <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                {report.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-theme group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
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
