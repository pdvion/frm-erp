"use client";

import { PlaceholderPage } from "@/components/PlaceholderPage";
import { Users } from "lucide-react";

export default function UsersPage() {
  return (
    <PlaceholderPage
      title="Usuários"
      module="SETTINGS"
      icon={<Users className="w-6 h-6" />}
      breadcrumbs={[
        { label: "Configurações", href: "/settings" },
        { label: "Usuários" },
      ]}
      backHref="/settings"
      description="Gerencie os usuários do sistema, permissões e acessos."
    />
  );
}
