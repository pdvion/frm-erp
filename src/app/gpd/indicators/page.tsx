"use client";

import { PlaceholderPage } from "@/components/PlaceholderPage";
import { BarChart2 } from "lucide-react";

export default function GPDIndicatorsPage() {
  return (
    <PlaceholderPage
      title="Indicadores GPD"
      module="GPD"
      icon={<BarChart2 className="w-6 h-6" />}
      breadcrumbs={[
        { label: "GPD", href: "/gpd" },
        { label: "Indicadores" },
      ]}
      backHref="/gpd"
    />
  );
}
