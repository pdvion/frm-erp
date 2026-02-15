"use client";

import { use } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { Banknote } from "lucide-react";

export default function PixDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`PIX #${id.substring(0, 8)}`}
        icon={<Banknote className="w-6 h-6" />}
        backHref="/payables"
      />
      <Alert variant="info" title="Em desenvolvimento">
        A visualização detalhada de pagamentos PIX será implementada em breve.
      </Alert>
    </div>
  );
}
