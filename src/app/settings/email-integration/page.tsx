"use client";

import { PlaceholderPage } from "@/components/PlaceholderPage";
import { Mail } from "lucide-react";

export default function EmailIntegrationPage() {
  return (
    <PlaceholderPage
      title="Integração de E-mail"
      module="SETTINGS"
      icon={<Mail className="w-6 h-6" />}
      breadcrumbs={[
        { label: "Configurações", href: "/settings" },
        { label: "Integração de E-mail" },
      ]}
      backHref="/settings"
    />
  );
}
