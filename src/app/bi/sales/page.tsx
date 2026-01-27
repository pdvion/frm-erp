"use client";

import { PlaceholderPage } from "@/components/PlaceholderPage";
import { TrendingUp } from "lucide-react";

export default function BISalesPage() {
  return (
    <PlaceholderPage
      title="BI Vendas"
      module="BI"
      icon={<TrendingUp className="w-6 h-6" />}
      breadcrumbs={[
        { label: "BI", href: "/bi" },
        { label: "Vendas" },
      ]}
      backHref="/bi"
    />
  );
}
