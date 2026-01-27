"use client";

import { PlaceholderPage } from "@/components/PlaceholderPage";
import { Package } from "lucide-react";

export default function InventoryReportsPage() {
  return (
    <PlaceholderPage
      title="Relatórios de Estoque"
      module="REPORTS"
      icon={<Package className="w-6 h-6" />}
      breadcrumbs={[
        { label: "Relatórios", href: "/reports" },
        { label: "Estoque" },
      ]}
      backHref="/reports"
    />
  );
}
