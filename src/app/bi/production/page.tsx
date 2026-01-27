"use client";

import { PlaceholderPage } from "@/components/PlaceholderPage";
import { Factory } from "lucide-react";

export default function BIProductionPage() {
  return (
    <PlaceholderPage
      title="BI Produção"
      module="BI"
      icon={<Factory className="w-6 h-6" />}
      breadcrumbs={[
        { label: "BI", href: "/bi" },
        { label: "Produção" },
      ]}
      backHref="/bi"
    />
  );
}
