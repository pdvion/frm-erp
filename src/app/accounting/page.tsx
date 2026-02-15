"use client";

import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import {
  BookOpen,
  List,
  FileSpreadsheet,
  BarChart3,
} from "lucide-react";

const cards = [
  { title: "Plano de Contas", description: "Cadastro hierárquico de contas contábeis", icon: List, href: "/accounting/chart-of-accounts" },
  { title: "Lançamentos", description: "Lançamentos contábeis com partidas dobradas", icon: FileSpreadsheet, href: "/accounting/entries" },
  { title: "Relatórios Contábeis", description: "Balancete, Razão e DRE", icon: BarChart3, href: "/accounting/reports" },
];

export default function AccountingPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Contabilidade"
        icon={<BookOpen className="w-6 h-6" />}
        module="financeiro"
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((card) => (
          <Link key={card.href} href={card.href}>
            <div className="bg-theme-card rounded-lg border border-theme p-6 hover:border-blue-500 transition-colors cursor-pointer h-full">
              <card.icon className="w-8 h-8 text-blue-600 mb-3" />
              <h3 className="font-semibold text-theme mb-1">{card.title}</h3>
              <p className="text-sm text-theme-muted">{card.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
