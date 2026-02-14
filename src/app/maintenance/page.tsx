"use client";

import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import {
  Wrench,
  Cpu,
  ClipboardList,
  CalendarClock,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";

const modules = [
  {
    title: "Equipamentos",
    description: "Cadastro, hierarquia e criticidade de equipamentos",
    icon: Cpu,
    href: "/maintenance/equipment",
    color: "text-blue-600",
  },
  {
    title: "Planos Preventivos",
    description: "Planos de manutenção preventiva e preditiva",
    icon: CalendarClock,
    href: "/maintenance/plans",
    color: "text-green-600",
  },
  {
    title: "Ordens de Serviço",
    description: "Ordens de manutenção corretiva e preventiva",
    icon: ClipboardList,
    href: "/maintenance/orders",
    color: "text-orange-600",
  },
  {
    title: "Códigos de Falha",
    description: "Catálogo padronizado de falhas por categoria",
    icon: AlertTriangle,
    href: "/maintenance/failure-codes",
    color: "text-red-600",
  },
];

export default function MaintenancePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Manutenção Industrial"
        icon={<Wrench className="w-6 h-6" />}
        module="producao"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {modules.map((mod) => (
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
