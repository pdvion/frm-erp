"use client";

import { PlaceholderPage } from "@/components/PlaceholderPage";
import { TrendingUp } from "lucide-react";

export default function SalesReportsPage() {
  return (
    <PlaceholderPage
      title="Relatórios de Vendas"
      module="REPORTS"
      icon={<TrendingUp className="w-6 h-6" />}
      breadcrumbs={[
        { label: "Relatórios", href: "/reports" },
        { label: "Vendas" },
      ]}
      backHref="/reports"
    />
  );
}
