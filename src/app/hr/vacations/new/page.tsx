"use client";

import { PlaceholderPage } from "@/components/PlaceholderPage";
import { Palmtree } from "lucide-react";

export default function NewVacationPage() {
  return (
    <PlaceholderPage
      title="Nova Solicitação de Férias"
      module="HR"
      icon={<Palmtree className="w-6 h-6" />}
      breadcrumbs={[
        { label: "RH", href: "/hr" },
        { label: "Férias", href: "/hr/vacations" },
        { label: "Nova" },
      ]}
      backHref="/hr/vacations"
    />
  );
}
