"use client";

import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import {
  Target,
  Users,
  GitBranch,
  TrendingUp,
  ArrowRight,
} from "lucide-react";

const crmModules = [
  {
    title: "Pipelines",
    description: "Gerencie seus funis de vendas e estágios",
    icon: GitBranch,
    href: "/sales/crm/pipelines",
    color: "text-blue-600",
  },
  {
    title: "Oportunidades",
    description: "Acompanhe negociações e previsão de fechamento",
    icon: TrendingUp,
    href: "/sales/crm/opportunities",
    color: "text-green-600",
  },
  {
    title: "Contatos",
    description: "Cadastro de contatos vinculados a clientes",
    icon: Users,
    href: "/sales/crm/contacts",
    color: "text-purple-600",
  },
];

export default function CrmPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="CRM"
        icon={<Target className="w-6 h-6" />}
        backHref="/sales"
        module="sales"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {crmModules.map((mod) => (
          <Link
            key={mod.href}
            href={mod.href}
            className="bg-theme-card rounded-lg border border-theme p-6 hover:border-blue-500 transition-colors group"
          >
            <div className="flex items-start justify-between mb-4">
              <mod.icon className={`w-8 h-8 ${mod.color}`} />
              <ArrowRight className="w-5 h-5 text-theme-muted group-hover:text-blue-600 transition-colors" />
            </div>
            <h3 className="text-lg font-semibold text-theme mb-1">{mod.title}</h3>
            <p className="text-sm text-theme-muted">{mod.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
