"use client";

import { PlaceholderPage } from "@/components/PlaceholderPage";
import { FileText } from "lucide-react";

export default function BIReportsPage() {
  return (
    <PlaceholderPage
      title="Relatórios BI"
      module="BI"
      icon={<FileText className="w-6 h-6" />}
      breadcrumbs={[
        { label: "BI", href: "/bi" },
        { label: "Relatórios" },
      ]}
      backHref="/bi"
    />
  );
}
