"use client";

import { PlaceholderPage } from "@/components/PlaceholderPage";
import { Goal } from "lucide-react";

export default function GPDGoalsPage() {
  return (
    <PlaceholderPage
      title="Metas GPD"
      module="GPD"
      icon={<Goal className="w-6 h-6" />}
      breadcrumbs={[
        { label: "GPD", href: "/gpd" },
        { label: "Metas" },
      ]}
      backHref="/gpd"
    />
  );
}
