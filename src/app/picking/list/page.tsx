"use client";

import { PlaceholderPage } from "@/components/PlaceholderPage";
import { List } from "lucide-react";

export default function PickingListPage() {
  return (
    <PlaceholderPage
      title="Lista de Separação"
      module="INVENTORY"
      icon={<List className="w-6 h-6" />}
      breadcrumbs={[
        { label: "Estoque", href: "/inventory" },
        { label: "Picking", href: "/picking" },
        { label: "Lista" },
      ]}
      backHref="/picking"
    />
  );
}
