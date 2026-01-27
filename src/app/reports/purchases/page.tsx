"use client";

import { PlaceholderPage } from "@/components/PlaceholderPage";
import { ShoppingBag } from "lucide-react";

export default function PurchasesReportsPage() {
  return (
    <PlaceholderPage
      title="Relatórios de Compras"
      module="REPORTS"
      icon={<ShoppingBag className="w-6 h-6" />}
      breadcrumbs={[
        { label: "Relatórios", href: "/reports" },
        { label: "Compras" },
      ]}
      backHref="/reports"
    />
  );
}
