"use client";

import { PageHeader } from "@/components/PageHeader";
import { FileText, Download, FileSpreadsheet, Calculator, BarChart3 } from "lucide-react";
import Link from "next/link";

const reports = [
  {
    title: "Livro de Entradas",
    description: "Registro de todas as notas fiscais de entrada",
    icon: <FileText className="w-5 h-5" />,
    href: "/reports/fiscal/entries",
  },
  {
    title: "Livro de Saídas",
    description: "Registro de todas as notas fiscais de saída",
    icon: <FileText className="w-5 h-5" />,
    href: "/reports/fiscal/exits",
  },
  {
    title: "Apuração ICMS",
    description: "Cálculo e apuração do ICMS mensal",
    icon: <Calculator className="w-5 h-5" />,
    href: "/reports/fiscal/icms",
  },
  {
    title: "Apuração PIS/COFINS",
    description: "Cálculo e apuração de PIS e COFINS",
    icon: <Calculator className="w-5 h-5" />,
    href: "/reports/fiscal/pis-cofins",
  },
  {
    title: "SPED Fiscal",
    description: "Geração do arquivo SPED Fiscal",
    icon: <FileSpreadsheet className="w-5 h-5" />,
    href: "/reports/fiscal/sped",
  },
  {
    title: "Resumo por CFOP",
    description: "Totais agrupados por CFOP",
    icon: <BarChart3 className="w-5 h-5" />,
    href: "/reports/fiscal/cfop",
  },
];

export default function FiscalReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Relatórios Fiscais"
        icon={<FileText className="w-6 h-6" />}
        module="REPORTS"
        breadcrumbs={[
          { label: "Relatórios", href: "/reports" },
          { label: "Fiscais" },
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
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                {report.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-theme group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
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
