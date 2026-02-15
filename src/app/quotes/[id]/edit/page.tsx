"use client";

import { use } from "react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { Alert } from "@/components/ui/Alert";
import { FileText } from "lucide-react";

export default function QuoteEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: quote, isLoading, isError, error } = trpc.quotes.byId.useQuery({ id });

  if (isLoading) return <Skeleton className="h-96" />;
  if (isError) return <Alert variant="error" title="Erro">{error.message}</Alert>;
  if (!quote) return <Alert variant="warning" title="Não encontrado">Cotação não encontrada.</Alert>;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Editar Cotação #${quote.code}`}
        icon={<FileText className="w-6 h-6" />}
        backHref={`/quotes/${id}`}
      />
      <Alert variant="info" title="Em desenvolvimento">
        A edição de cotações será implementada em breve.
      </Alert>
    </div>
  );
}
