"use client";

import { use } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { AlertTriangle } from "lucide-react";

export default function NonConformityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Não-Conformidade #${id.substring(0, 8)}`}
        icon={<AlertTriangle className="w-6 h-6" />}
        backHref="/production/quality/nc"
      />
      <Alert variant="info" title="Em desenvolvimento">
        A visualização detalhada de não-conformidades será implementada em breve.
      </Alert>
    </div>
  );
}
