"use client";

import { PlaceholderPage } from "@/components/PlaceholderPage";
import { Calendar } from "lucide-react";

export default function HolidaysPage() {
  return (
    <PlaceholderPage
      title="Feriados"
      module="HR"
      icon={<Calendar className="w-6 h-6" />}
      breadcrumbs={[
        { label: "RH", href: "/hr" },
        { label: "Ponto", href: "/hr/timeclock" },
        { label: "Feriados" },
      ]}
      backHref="/hr/timeclock"
    />
  );
}
