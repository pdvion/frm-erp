"use client";

import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import {
  GitBranch,
  Plus,
  Settings,
  Play,
  Edit,
  ArrowLeft,
  Workflow,
} from "lucide-react";

export default function WorkflowDefinitionsPage() {
  const { data, isLoading, error } = trpc.workflow.listDefinitions.useQuery({});

  const definitions = data ?? [];

  
  return (
    <div className="space-y-6">
      <PageHeader
        title="Definições de Workflow"
        icon={<Settings className="w-6 h-6" />}
        module="REPORTS"
        breadcrumbs={[
          { label: "Workflow", href: "/workflow" },
          { label: "Definições" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/workflow"
              className="flex items-center gap-2 px-4 py-2 border border-theme rounded-lg hover:bg-theme-secondary"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Link>
            <Link
              href="/workflow/definitions/new"
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
            >
              <Plus className="w-4 h-4" />
              Novo Workflow
            </Link>
          </div>
        }
      />

      <div className="bg-theme-card border border-theme rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-theme-muted">Carregando...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">Erro: {error.message}</div>
        ) : definitions.length === 0 ? (
          <div className="p-8 text-center text-theme-muted">
            <GitBranch className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum workflow configurado</p>
            <Link
              href="/workflow/definitions/new"
              className="mt-4 inline-flex items-center gap-2 text-violet-600 hover:text-violet-800"
            >
              <Plus className="w-4 h-4" />
              Criar primeiro workflow
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-theme">
            {definitions.map((def: typeof definitions[number]) => (
              <div key={def.id} className="p-4 flex items-center justify-between hover:bg-theme-secondary/50">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
                    <GitBranch className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-theme">{def.name}</h3>
                    <p className="text-sm text-theme-muted">{def.description || "Sem descrição"}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-theme-muted">
                        {def._count?.steps || 0} etapas
                      </span>
                      <span className="text-xs text-theme-muted">•</span>
                      <span className="text-xs text-theme-muted">
                        {def._count?.instances || 0} execuções
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        def.isActive 
                          ? "bg-green-100 text-green-700" 
                          : "bg-theme-tertiary text-theme-secondary"
                      }`}>
                        {def.isActive ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/workflow/start/${def.id}`}
                    className="p-2 text-green-600 hover:bg-green-100 rounded-lg"
                    title="Iniciar"
                  >
                    <Play className="w-4 h-4" />
                  </Link>
                  <Link
                    href={`/workflow/definitions/${def.id}/visual`}
                    className="p-2 text-violet-600 hover:bg-violet-100 rounded-lg"
                    title="Editor Visual"
                  >
                    <Workflow className="w-4 h-4" />
                  </Link>
                  <Link
                    href={`/workflow/definitions/${def.id}/edit`}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
