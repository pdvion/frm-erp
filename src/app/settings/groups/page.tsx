"use client";

import { PlaceholderPage } from "@/components/PlaceholderPage";
import { Users } from "lucide-react";

export default function GroupsPage() {
  return (
    <PlaceholderPage
      title="Grupos de Usuários"
      module="SETTINGS"
      icon={<Users className="w-6 h-6" />}
      breadcrumbs={[
        { label: "Configurações", href: "/settings" },
        { label: "Grupos" },
      ]}
      backHref="/settings"
    />
  );
}
