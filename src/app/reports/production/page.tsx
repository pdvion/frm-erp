"use client";

import { PlaceholderPage } from "@/components/PlaceholderPage";
import { Factory } from "lucide-react";

export default function ProductionReportsPage() {
  return (
    <PlaceholderPage
      title="Relatórios de Produção"
      module="REPORTS"
      icon={<Factory className="w-6 h-6" />}
      breadcrumbs={[
        { label: "Relatórios", href: "/reports" },
        { label: "Produção" },
      ]}
      backHref="/reports"
    />
  );
}
