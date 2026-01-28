"use client";

import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Ship, Anchor, Users, Package, FileText, Loader2, ClipboardList, Banknote } from "lucide-react";
import Link from "next/link";

export default function ImpExPage() {
  const { data: dashboard, isLoading } = trpc.impex.dashboard.useQuery();

  const modules = [
    {
      title: "Processos de Importação",
      description: "Gestão completa de processos de importação",
      href: "/impex/processes",
      icon: ClipboardList,
      color: "bg-indigo-100 text-indigo-600",
      count: dashboard?.processesCount,
    },
    {
      title: "Contratos de Câmbio",
      description: "Controle cambial e liquidações",
      href: "/impex/exchange",
      icon: Banknote,
      color: "bg-emerald-100 text-emerald-600",
    },
    {
      title: "Portos",
      description: "Cadastro de portos marítimos, aeroportos e fronteiras",
      href: "/impex/ports",
      icon: Anchor,
      color: "bg-blue-100 text-blue-600",
      count: dashboard?.portsCount,
    },
    {
      title: "Despachantes",
      description: "Despachantes aduaneiros e agentes de carga",
      href: "/impex/brokers",
      icon: Users,
      color: "bg-green-100 text-green-600",
      count: dashboard?.brokersCount,
    },
    {
      title: "Tipos de Carga",
      description: "FCL, LCL, Aéreo, Rodoviário",
      href: "/impex/cargo-types",
      icon: Package,
      color: "bg-purple-100 text-purple-600",
      count: dashboard?.cargoTypesCount,
    },
    {
      title: "Incoterms",
      description: "Termos de comércio internacional",
      href: "/impex/incoterms",
      icon: FileText,
      color: "bg-orange-100 text-orange-600",
      count: dashboard?.incotermsCount,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Importação e Exportação"
        icon={<Ship className="w-6 h-6" />}
        module="PURCHASES"
        breadcrumbs={[{ label: "ImpEx" }]}
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {modules.map((module) => (
            <Link
              key={module.href}
              href={module.href}
              className="bg-theme-card border border-theme rounded-lg p-6 hover:border-blue-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg ${module.color}`}>
                  <module.icon className="w-6 h-6" />
                </div>
                {module.count !== undefined && (
                  <span className="text-2xl font-bold text-theme">{module.count}</span>
                )}
              </div>
              <h3 className="font-semibold text-theme mb-1">{module.title}</h3>
              <p className="text-sm text-theme-muted">{module.description}</p>
            </Link>
          ))}
        </div>
      )}

      {dashboard?.processesByStatus && Object.keys(dashboard.processesByStatus).length > 0 && (
        <div className="bg-theme-card border border-theme rounded-lg p-6">
          <h3 className="font-semibold text-theme mb-4">Processos por Status</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(dashboard.processesByStatus).map(([status, count]) => (
              <div key={status} className="p-3 bg-theme-secondary rounded-lg text-center">
                <span className="text-2xl font-bold text-theme">{count}</span>
                <p className="text-xs text-theme-muted mt-1">{status.replace(/_/g, " ")}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-theme-card border border-theme rounded-lg p-6">
        <h3 className="font-semibold text-theme mb-4">Próximas Funcionalidades</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-theme-secondary rounded-lg">
            <h4 className="font-medium text-theme mb-2">Controle Cambial</h4>
            <p className="text-sm text-theme-muted">
              Contratos de câmbio, variação cambial e integração com bancos.
            </p>
            <span className="inline-block mt-2 px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded">Em breve</span>
          </div>
          <div className="p-4 bg-theme-secondary rounded-lg">
            <h4 className="font-medium text-theme mb-2">Exportação</h4>
            <p className="text-sm text-theme-muted">
              Gestão de processos de exportação e documentação.
            </p>
            <span className="inline-block mt-2 px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded">Em breve</span>
          </div>
        </div>
      </div>
    </div>
  );
}
