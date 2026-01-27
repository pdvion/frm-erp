"use client";

import { PlaceholderPage } from "@/components/PlaceholderPage";
import { Receipt } from "lucide-react";

export default function NewPayablePage() {
  return (
    <PlaceholderPage
      title="Nova Conta a Pagar"
      module="FINANCE"
      icon={<Receipt className="w-6 h-6" />}
      breadcrumbs={[
        { label: "Contas a Pagar", href: "/payables" },
        { label: "Nova" },
      ]}
      backHref="/payables"
    />
  );
}
