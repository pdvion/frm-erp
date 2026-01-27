"use client";

import { PlaceholderPage } from "@/components/PlaceholderPage";
import { ClipboardList } from "lucide-react";

export default function InventoryCountPage() {
  return (
    <PlaceholderPage
      title="Contagem de Estoque"
      module="INVENTORY"
      icon={<ClipboardList className="w-6 h-6" />}
      breadcrumbs={[
        { label: "Estoque", href: "/inventory" },
        { label: "Contagem" },
      ]}
      backHref="/inventory"
    />
  );
}
