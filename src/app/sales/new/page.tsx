"use client";

import { PlaceholderPage } from "@/components/PlaceholderPage";
import { ShoppingCart } from "lucide-react";

export default function NewSalePage() {
  return (
    <PlaceholderPage
      title="Nova Venda"
      module="SALES"
      icon={<ShoppingCart className="w-6 h-6" />}
      breadcrumbs={[
        { label: "Vendas", href: "/sales" },
        { label: "Nova" },
      ]}
      backHref="/sales"
    />
  );
}
