"use client";

import { PlaceholderPage } from "@/components/PlaceholderPage";
import { TrendingUp } from "lucide-react";

export default function BudgetTrackingPage() {
  return (
    <PlaceholderPage
      title="Acompanhamento Orçamentário"
      module="BUDGET"
      icon={<TrendingUp className="w-6 h-6" />}
      breadcrumbs={[
        { label: "Orçamento", href: "/budget" },
        { label: "Acompanhamento" },
      ]}
      backHref="/budget"
    />
  );
}
