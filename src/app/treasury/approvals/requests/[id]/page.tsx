"use client";

import { use } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { ShieldCheck } from "lucide-react";

export default function ApprovalRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Solicitação de Aprovação #${id.substring(0, 8)}`}
        icon={<ShieldCheck className="w-6 h-6" />}
        backHref="/treasury/approvals"
      />
      <Alert variant="info" title="Em desenvolvimento">
        A visualização detalhada de solicitações de aprovação será implementada em breve.
      </Alert>
    </div>
  );
}
