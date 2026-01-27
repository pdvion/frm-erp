"use client";

import { PlaceholderPage } from "@/components/PlaceholderPage";
import { Receipt } from "lucide-react";

export default function NewBillingPage() {
  return (
    <PlaceholderPage
      title="Nova Fatura"
      module="BILLING"
      icon={<Receipt className="w-6 h-6" />}
      breadcrumbs={[
        { label: "Faturamento", href: "/billing" },
        { label: "Nova" },
      ]}
      backHref="/billing"
    />
  );
}
