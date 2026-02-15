"use client";

import { use } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { ArrowRightLeft } from "lucide-react";

export default function TransferDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Transferência #${id.substring(0, 8)}`}
        icon={<ArrowRightLeft className="w-6 h-6" />}
        backHref="/transfers"
      />
      <Alert variant="info" title="Em desenvolvimento">
        A visualização detalhada de transferências será implementada em breve.
      </Alert>
    </div>
  );
}
