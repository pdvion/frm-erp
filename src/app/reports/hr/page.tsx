"use client";

import { PlaceholderPage } from "@/components/PlaceholderPage";
import { Users } from "lucide-react";

export default function HRReportsPage() {
  return (
    <PlaceholderPage
      title="Relatórios de RH"
      module="REPORTS"
      icon={<Users className="w-6 h-6" />}
      breadcrumbs={[
        { label: "Relatórios", href: "/reports" },
        { label: "RH" },
      ]}
      backHref="/reports"
    />
  );
}
