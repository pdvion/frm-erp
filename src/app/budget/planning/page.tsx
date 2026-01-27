"use client";

import { PlaceholderPage } from "@/components/PlaceholderPage";
import { Calendar } from "lucide-react";

export default function BudgetPlanningPage() {
  return (
    <PlaceholderPage
      title="Planejamento Orçamentário"
      module="BUDGET"
      icon={<Calendar className="w-6 h-6" />}
      breadcrumbs={[
        { label: "Orçamento", href: "/budget" },
        { label: "Planejamento" },
      ]}
      backHref="/budget"
    />
  );
}
