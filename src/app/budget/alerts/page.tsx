"use client";

import { PlaceholderPage } from "@/components/PlaceholderPage";
import { Bell } from "lucide-react";

export default function BudgetAlertsPage() {
  return (
    <PlaceholderPage
      title="Alertas de Orçamento"
      module="BUDGET"
      icon={<Bell className="w-6 h-6" />}
      breadcrumbs={[
        { label: "Orçamento", href: "/budget" },
        { label: "Alertas" },
      ]}
      backHref="/budget"
    />
  );
}
