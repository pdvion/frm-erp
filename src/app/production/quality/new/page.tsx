"use client";

import { PlaceholderPage } from "@/components/PlaceholderPage";
import { ClipboardCheck } from "lucide-react";

export default function NewQualityInspectionPage() {
  return (
    <PlaceholderPage
      title="Nova Inspeção de Qualidade"
      module="PRODUCTION"
      icon={<ClipboardCheck className="w-6 h-6" />}
      breadcrumbs={[
        { label: "Produção", href: "/production" },
        { label: "Qualidade", href: "/production/quality" },
        { label: "Nova" },
      ]}
      backHref="/production/quality"
    />
  );
}
