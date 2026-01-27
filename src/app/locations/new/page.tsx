"use client";

import { PlaceholderPage } from "@/components/PlaceholderPage";
import { MapPin } from "lucide-react";

export default function NewLocationPage() {
  return (
    <PlaceholderPage
      title="Nova Localização"
      module="INVENTORY"
      icon={<MapPin className="w-6 h-6" />}
      breadcrumbs={[
        { label: "Estoque", href: "/inventory" },
        { label: "Localizações", href: "/locations" },
        { label: "Nova" },
      ]}
      backHref="/locations"
    />
  );
}
