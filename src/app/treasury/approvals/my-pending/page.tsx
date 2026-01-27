"use client";

import { PlaceholderPage } from "@/components/PlaceholderPage";
import { ClipboardCheck } from "lucide-react";

export default function MyPendingApprovalsPage() {
  return (
    <PlaceholderPage
      title="Minhas Aprovações Pendentes"
      module="TREASURY"
      icon={<ClipboardCheck className="w-6 h-6" />}
      breadcrumbs={[
        { label: "Tesouraria", href: "/treasury" },
        { label: "Aprovações", href: "/treasury/approvals" },
        { label: "Pendentes" },
      ]}
      backHref="/treasury/approvals"
    />
  );
}
