"use client";

import { PlaceholderPage } from "@/components/PlaceholderPage";
import { PlusCircle } from "lucide-react";

export default function NewGPDGoalPage() {
  return (
    <PlaceholderPage
      title="Nova Meta GPD"
      module="GPD"
      icon={<PlusCircle className="w-6 h-6" />}
      breadcrumbs={[
        { label: "GPD", href: "/gpd" },
        { label: "Metas", href: "/gpd/goals" },
        { label: "Nova" },
      ]}
      backHref="/gpd/goals"
    />
  );
}
