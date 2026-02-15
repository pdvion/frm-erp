"use client";

import { use } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { ClipboardCheck } from "lucide-react";

export default function InspectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Inspeção #${id.substring(0, 8)}`}
        icon={<ClipboardCheck className="w-6 h-6" />}
        backHref="/production/quality/inspections"
      />
      <Alert variant="info" title="Em desenvolvimento">
        A visualização detalhada de inspeções de qualidade será implementada em breve.
      </Alert>
    </div>
  );
}
