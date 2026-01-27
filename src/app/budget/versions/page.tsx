"use client";

import { PlaceholderPage } from "@/components/PlaceholderPage";
import { GitBranch } from "lucide-react";

export default function BudgetVersionsPage() {
  return (
    <PlaceholderPage
      title="Versões de Orçamento"
      module="BUDGET"
      icon={<GitBranch className="w-6 h-6" />}
      breadcrumbs={[
        { label: "Orçamento", href: "/budget" },
        { label: "Versões" },
      ]}
      backHref="/budget"
    />
  );
}
