"use client";

import { use } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { FileText } from "lucide-react";

export default function BoletoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Boleto #${id.substring(0, 8)}`}
        icon={<FileText className="w-6 h-6" />}
        backHref="/payables"
      />
      <Alert variant="info" title="Em desenvolvimento">
        A visualização detalhada de boletos será implementada em breve.
      </Alert>
    </div>
  );
}
