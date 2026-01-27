"use client";

import { PlaceholderPage } from "@/components/PlaceholderPage";
import { Layers } from "lucide-react";

export default function BatchPaymentPage() {
  return (
    <PlaceholderPage
      title="Pagamento em Lote"
      module="FINANCE"
      icon={<Layers className="w-6 h-6" />}
      breadcrumbs={[
        { label: "Contas a Pagar", href: "/payables" },
        { label: "Pagamento em Lote" },
      ]}
      backHref="/payables"
    />
  );
}
