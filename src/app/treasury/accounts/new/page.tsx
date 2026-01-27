"use client";

import { PlaceholderPage } from "@/components/PlaceholderPage";
import { Building2 } from "lucide-react";

export default function NewBankAccountPage() {
  return (
    <PlaceholderPage
      title="Nova Conta Bancária"
      module="TREASURY"
      icon={<Building2 className="w-6 h-6" />}
      breadcrumbs={[
        { label: "Tesouraria", href: "/treasury" },
        { label: "Contas", href: "/settings/bank-accounts" },
        { label: "Nova" },
      ]}
      backHref="/settings/bank-accounts"
    />
  );
}
