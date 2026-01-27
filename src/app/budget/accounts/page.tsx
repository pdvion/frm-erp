"use client";

import { PlaceholderPage } from "@/components/PlaceholderPage";
import { Wallet } from "lucide-react";

export default function BudgetAccountsPage() {
  return (
    <PlaceholderPage
      title="Contas Orçamentárias"
      module="BUDGET"
      icon={<Wallet className="w-6 h-6" />}
      breadcrumbs={[
        { label: "Orçamento", href: "/budget" },
        { label: "Contas" },
      ]}
      backHref="/budget"
    />
  );
}
