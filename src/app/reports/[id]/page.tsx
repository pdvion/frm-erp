"use client";

import { use } from "react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { Alert } from "@/components/ui/Alert";
import { FileBarChart } from "lucide-react";

export default function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: report, isLoading, isError, error } = trpc.savedReports.getById.useQuery({ id });

  if (isLoading) return <Skeleton className="h-96" />;
  if (isError) return <Alert variant="error" title="Erro">{error.message}</Alert>;
  if (!report) return <Alert variant="warning" title="Não encontrado">Relatório não encontrado.</Alert>;

  return (
    <div className="space-y-6">
      <PageHeader
        title={report.name}
        icon={<FileBarChart className="w-6 h-6" />}
        backHref="/reports"
      />

      <div className="bg-theme-card rounded-lg border border-theme p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-theme-muted">Tipo</span>
            <p className="text-theme mt-1">{report.reportType || "—"}</p>
          </div>
          <div>
            <span className="text-theme-muted">Descrição</span>
            <p className="text-theme mt-1">{report.description || "—"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
