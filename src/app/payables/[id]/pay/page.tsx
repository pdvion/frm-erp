"use client";

import { use } from "react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { Alert } from "@/components/ui/Alert";
import { DollarSign } from "lucide-react";

export default function PayablePayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: payable, isLoading, isError, error } = trpc.payables.byId.useQuery({ id });

  if (isLoading) return <Skeleton className="h-96" />;
  if (isError) return <Alert variant="error" title="Erro">{error.message}</Alert>;
  if (!payable) return <Alert variant="warning" title="Não encontrado">Conta a pagar não encontrada.</Alert>;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Pagar: ${payable.description || `#${payable.code}`}`}
        icon={<DollarSign className="w-6 h-6" />}
        backHref={`/payables/${id}`}
      />
      <Alert variant="info" title="Em desenvolvimento">
        A tela de pagamento integrado será implementada em breve.
      </Alert>
    </div>
  );
}
