"use client";

import { PlaceholderPage } from "@/components/PlaceholderPage";
import { UserMinus } from "lucide-react";

export default function NewTerminationPage() {
  return (
    <PlaceholderPage
      title="Nova Rescisão"
      module="HR"
      icon={<UserMinus className="w-6 h-6" />}
      breadcrumbs={[
        { label: "RH", href: "/hr" },
        { label: "Rescisões", href: "/hr/terminations" },
        { label: "Nova" },
      ]}
      backHref="/hr/terminations"
    />
  );
}
