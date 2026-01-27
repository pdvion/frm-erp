"use client";

import { PlaceholderPage } from "@/components/PlaceholderPage";
import { FileText } from "lucide-react";

export default function NewSalesQuotePage() {
  return (
    <PlaceholderPage
      title="Nova Cotação de Venda"
      module="SALES"
      icon={<FileText className="w-6 h-6" />}
      breadcrumbs={[
        { label: "Vendas", href: "/sales" },
        { label: "Cotações", href: "/sales/quotes" },
        { label: "Nova" },
      ]}
      backHref="/sales/quotes"
    />
  );
}
