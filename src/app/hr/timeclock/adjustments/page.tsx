"use client";

import { PlaceholderPage } from "@/components/PlaceholderPage";
import { Edit } from "lucide-react";

export default function TimeclockAdjustmentsPage() {
  return (
    <PlaceholderPage
      title="Ajustes de Ponto"
      module="HR"
      icon={<Edit className="w-6 h-6" />}
      breadcrumbs={[
        { label: "RH", href: "/hr" },
        { label: "Ponto", href: "/hr/timeclock" },
        { label: "Ajustes" },
      ]}
      backHref="/hr/timeclock"
    />
  );
}
