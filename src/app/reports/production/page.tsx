"use client";

import { PageHeader } from "@/components/PageHeader";
import { Factory, Download, Gauge, Clock, DollarSign, ClipboardList, BarChart3 } from "lucide-react";
import Link from "next/link";

const reports = [
  {
    title: "OEE - Eficiência",
    description: "Overall Equipment Effectiveness",
    icon: <Gauge className="w-5 h-5" />,
    href: "/production/oee",
  },
  {
    title: "Ordens de Produção",
    description: "Status e acompanhamento de OPs",
    icon: <ClipboardList className="w-5 h-5" />,
    href: "/production",
  },
  {
    title: "Custos de Produção",
    description: "Análise de custos por ordem",
    icon: <DollarSign className="w-5 h-5" />,
    href: "/production/costs",
  },
  {
    title: "Apontamentos",
    description: "Registro de produção por período",
    icon: <Clock className="w-5 h-5" />,
    href: "/production/appointments",
  },
  {
    title: "Centros de Trabalho",
    description: "Utilização por centro de trabalho",
    icon: <Factory className="w-5 h-5" />,
    href: "/production/work-centers",
  },
  {
    title: "MRP - Planejamento",
    description: "Necessidades de materiais",
    icon: <BarChart3 className="w-5 h-5" />,
    href: "/production/mrp",
  },
];

export default function ProductionReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Relatórios de Produção"
        icon={<Factory className="w-6 h-6" />}
        module="REPORTS"
        breadcrumbs={[
          { label: "Relatórios", href: "/reports" },
          { label: "Produção" },
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
              <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                {report.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-theme group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
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
