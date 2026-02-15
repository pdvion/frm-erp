"use client";

import { use } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { ListChecks } from "lucide-react";

export default function WorkflowTaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Tarefa de Workflow #${id.substring(0, 8)}`}
        icon={<ListChecks className="w-6 h-6" />}
        backHref="/workflow/tasks"
      />
      <Alert variant="info" title="Em desenvolvimento">
        A visualização detalhada de tarefas de workflow será implementada em breve.
      </Alert>
    </div>
  );
}
