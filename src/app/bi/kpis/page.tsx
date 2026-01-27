"use client";

import { PlaceholderPage } from "@/components/PlaceholderPage";
import { Target } from "lucide-react";

export default function BIKPIsPage() {
  return (
    <PlaceholderPage
      title="KPIs"
      module="BI"
      icon={<Target className="w-6 h-6" />}
      breadcrumbs={[
        { label: "BI", href: "/bi" },
        { label: "KPIs" },
      ]}
      backHref="/bi"
    />
  );
}
