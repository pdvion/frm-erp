"use client";

import { PlaceholderPage } from "@/components/PlaceholderPage";
import { FileText } from "lucide-react";

export default function FiscalReportsPage() {
  return (
    <PlaceholderPage
      title="Relatórios Fiscais"
      module="REPORTS"
      icon={<FileText className="w-6 h-6" />}
      breadcrumbs={[
        { label: "Relatórios", href: "/reports" },
        { label: "Fiscais" },
      ]}
      backHref="/reports"
    />
  );
}
