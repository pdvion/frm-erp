"use client";

import { PlaceholderPage } from "@/components/PlaceholderPage";
import { CalendarDays } from "lucide-react";

export default function TimeclockSchedulesPage() {
  return (
    <PlaceholderPage
      title="Escalas de Trabalho"
      module="HR"
      icon={<CalendarDays className="w-6 h-6" />}
      breadcrumbs={[
        { label: "RH", href: "/hr" },
        { label: "Ponto", href: "/hr/timeclock" },
        { label: "Escalas" },
      ]}
      backHref="/hr/timeclock"
    />
  );
}
