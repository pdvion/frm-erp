"use client";

import { PageHeader } from "@/components/PageHeader";
import { Package, Download, MapPin, BarChart3, AlertTriangle, ArrowRightLeft, Boxes } from "lucide-react";
import Link from "next/link";

const reports = [
  {
    title: "Posição de Estoque",
    description: "Saldo atual por material e localização",
    icon: <Package className="w-5 h-5" />,
    href: "/reports/inventory-position",
  },
  {
    title: "Curva ABC",
    description: "Classificação ABC de materiais",
    icon: <BarChart3 className="w-5 h-5" />,
    href: "/reports/inventory-abc",
  },
  {
    title: "Estoque Crítico",
    description: "Itens abaixo do estoque mínimo",
    icon: <AlertTriangle className="w-5 h-5" />,
    href: "/inventory/low-stock",
  },
  {
    title: "Movimentações",
    description: "Histórico de entradas e saídas",
    icon: <ArrowRightLeft className="w-5 h-5" />,
    href: "/inventory/movements",
  },
  {
    title: "Por Localização",
    description: "Estoque agrupado por endereço",
    icon: <MapPin className="w-5 h-5" />,
    href: "/locations",
  },
  {
    title: "Inventário",
    description: "Contagem e ajustes de inventário",
    icon: <Boxes className="w-5 h-5" />,
    href: "/inventory/count",
  },
];

export default function InventoryReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Relatórios de Estoque"
        icon={<Package className="w-6 h-6" />}
        module="REPORTS"
        breadcrumbs={[
          { label: "Relatórios", href: "/reports" },
          { label: "Estoque" },
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
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                {report.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-theme group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
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
