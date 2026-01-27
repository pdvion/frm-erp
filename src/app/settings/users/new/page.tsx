"use client";

import { PlaceholderPage } from "@/components/PlaceholderPage";
import { UserPlus } from "lucide-react";

export default function NewUserPage() {
  return (
    <PlaceholderPage
      title="Novo Usuário"
      module="SETTINGS"
      icon={<UserPlus className="w-6 h-6" />}
      breadcrumbs={[
        { label: "Configurações", href: "/settings" },
        { label: "Usuários", href: "/settings/users" },
        { label: "Novo" },
      ]}
      backHref="/settings/users"
    />
  );
}
