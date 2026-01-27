"use client";

import { PlaceholderPage } from "@/components/PlaceholderPage";
import { DollarSign } from "lucide-react";

export default function BIFinancialPage() {
  return (
    <PlaceholderPage
      title="BI Financeiro"
      module="BI"
      icon={<DollarSign className="w-6 h-6" />}
      breadcrumbs={[
        { label: "BI", href: "/bi" },
        { label: "Financeiro" },
      ]}
      backHref="/bi"
    />
  );
}
