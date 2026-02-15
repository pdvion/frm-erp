"use client";

import { use } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { Receipt } from "lucide-react";

export default function PayslipDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Holerite #${id.substring(0, 8)}`}
        icon={<Receipt className="w-6 h-6" />}
        backHref="/portal/payslips"
      />
      <Alert variant="info" title="Em desenvolvimento">
        A visualização detalhada de holerites será implementada em breve.
      </Alert>
    </div>
  );
}
