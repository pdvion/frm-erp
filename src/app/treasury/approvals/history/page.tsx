"use client";

import { PlaceholderPage } from "@/components/PlaceholderPage";
import { History } from "lucide-react";

export default function ApprovalsHistoryPage() {
  return (
    <PlaceholderPage
      title="Histórico de Aprovações"
      module="TREASURY"
      icon={<History className="w-6 h-6" />}
      breadcrumbs={[
        { label: "Tesouraria", href: "/treasury" },
        { label: "Aprovações", href: "/treasury/approvals" },
        { label: "Histórico" },
      ]}
      backHref="/treasury/approvals"
    />
  );
}
