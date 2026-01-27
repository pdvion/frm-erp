"use client";

import { PlaceholderPage } from "@/components/PlaceholderPage";
import { Clock } from "lucide-react";

export default function HoursBankPage() {
  return (
    <PlaceholderPage
      title="Banco de Horas"
      module="HR"
      icon={<Clock className="w-6 h-6" />}
      breadcrumbs={[
        { label: "RH", href: "/hr" },
        { label: "Ponto", href: "/hr/timeclock" },
        { label: "Banco de Horas" },
      ]}
      backHref="/hr/timeclock"
    />
  );
}
