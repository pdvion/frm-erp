"use client";

import { PlaceholderPage } from "@/components/PlaceholderPage";
import { FileText } from "lucide-react";

export default function ApprovalsRequestsPage() {
  return (
    <PlaceholderPage
      title="Solicitações de Aprovação"
      module="TREASURY"
      icon={<FileText className="w-6 h-6" />}
      breadcrumbs={[
        { label: "Tesouraria", href: "/treasury" },
        { label: "Aprovações", href: "/treasury/approvals" },
        { label: "Solicitações" },
      ]}
      backHref="/treasury/approvals"
    />
  );
}
