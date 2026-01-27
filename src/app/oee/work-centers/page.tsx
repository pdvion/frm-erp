"use client";

import { PlaceholderPage } from "@/components/PlaceholderPage";
import { Settings } from "lucide-react";

export default function OEEWorkCentersPage() {
  return (
    <PlaceholderPage
      title="Centros de Trabalho OEE"
      module="PRODUCTION"
      icon={<Settings className="w-6 h-6" />}
      breadcrumbs={[
        { label: "OEE", href: "/oee" },
        { label: "Centros de Trabalho" },
      ]}
      backHref="/oee"
    />
  );
}
