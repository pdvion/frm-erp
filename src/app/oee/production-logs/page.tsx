"use client";

import { PlaceholderPage } from "@/components/PlaceholderPage";
import { FileText } from "lucide-react";

export default function ProductionLogsPage() {
  return (
    <PlaceholderPage
      title="Logs de Produção"
      module="PRODUCTION"
      icon={<FileText className="w-6 h-6" />}
      breadcrumbs={[
        { label: "OEE", href: "/oee" },
        { label: "Logs de Produção" },
      ]}
      backHref="/oee"
    />
  );
}
