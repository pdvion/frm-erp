"use client";

import { PlaceholderPage } from "@/components/PlaceholderPage";
import { PackagePlus } from "lucide-react";

export default function NewPickingPage() {
  return (
    <PlaceholderPage
      title="Nova Separação"
      module="INVENTORY"
      icon={<PackagePlus className="w-6 h-6" />}
      breadcrumbs={[
        { label: "Estoque", href: "/inventory" },
        { label: "Picking", href: "/picking" },
        { label: "Nova" },
      ]}
      backHref="/picking"
    />
  );
}
