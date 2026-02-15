"use client";

import { use } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { RotateCcw } from "lucide-react";

export default function SupplierReturnEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Editar Devolução #${id.substring(0, 8)}`}
        icon={<RotateCcw className="w-6 h-6" />}
        backHref={`/supplier-returns/${id}`}
      />
      <Alert variant="info" title="Em desenvolvimento">
        A edição de devoluções a fornecedor será implementada em breve.
      </Alert>
    </div>
  );
}
