"use client";

import { PlaceholderPage } from "@/components/PlaceholderPage";
import { Target } from "lucide-react";

export default function GPDActionsPage() {
  return (
    <PlaceholderPage
      title="Ações GPD"
      module="GPD"
      icon={<Target className="w-6 h-6" />}
      breadcrumbs={[
        { label: "GPD", href: "/gpd" },
        { label: "Ações" },
      ]}
      backHref="/gpd"
    />
  );
}
