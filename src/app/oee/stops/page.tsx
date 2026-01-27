"use client";

import { PlaceholderPage } from "@/components/PlaceholderPage";
import { PauseCircle } from "lucide-react";

export default function OEEStopsPage() {
  return (
    <PlaceholderPage
      title="Paradas de Produção"
      module="PRODUCTION"
      icon={<PauseCircle className="w-6 h-6" />}
      breadcrumbs={[
        { label: "OEE", href: "/oee" },
        { label: "Paradas" },
      ]}
      backHref="/oee"
    />
  );
}
