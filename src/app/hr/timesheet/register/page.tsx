"use client";

import { PlaceholderPage } from "@/components/PlaceholderPage";
import { Clock } from "lucide-react";

export default function TimesheetRegisterPage() {
  return (
    <PlaceholderPage
      title="Registrar Ponto"
      module="HR"
      icon={<Clock className="w-6 h-6" />}
      breadcrumbs={[
        { label: "RH", href: "/hr" },
        { label: "Folha de Ponto", href: "/hr/timesheet" },
        { label: "Registrar" },
      ]}
      backHref="/hr/timesheet"
    />
  );
}
