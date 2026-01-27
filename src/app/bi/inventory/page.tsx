"use client";

import { PlaceholderPage } from "@/components/PlaceholderPage";
import { Package } from "lucide-react";

export default function BIInventoryPage() {
  return (
    <PlaceholderPage
      title="BI Estoque"
      module="BI"
      icon={<Package className="w-6 h-6" />}
      breadcrumbs={[
        { label: "BI", href: "/bi" },
        { label: "Estoque" },
      ]}
      backHref="/bi"
    />
  );
}
