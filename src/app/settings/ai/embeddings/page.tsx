"use client";

import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import {
  Sparkles, Loader2, RefreshCw, CheckCircle, AlertTriangle,
  Package, ShoppingCart, Users, Truck, UserCircle,
  ArrowLeft, Database, Zap, BarChart3,
} from "lucide-react";

const ENTITY_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string; bgColor: string }> = {
  material: { label: "Materiais", icon: <Package className="w-5 h-5" />, color: "text-blue-600", bgColor: "bg-blue-50 dark:bg-blue-950/50" },
  product: { label: "Produtos", icon: <ShoppingCart className="w-5 h-5" />, color: "text-emerald-600", bgColor: "bg-emerald-50 dark:bg-emerald-950/50" },
  customer: { label: "Clientes", icon: <Users className="w-5 h-5" />, color: "text-violet-600", bgColor: "bg-violet-50 dark:bg-violet-950/50" },
  supplier: { label: "Fornecedores", icon: <Truck className="w-5 h-5" />, color: "text-amber-600", bgColor: "bg-amber-50 dark:bg-amber-950/50" },
  employee: { label: "Colaboradores", icon: <UserCircle className="w-5 h-5" />, color: "text-rose-600", bgColor: "bg-rose-50 dark:bg-rose-950/50" },
};

type EntityType = "material" | "product" | "customer" | "supplier" | "employee";

export default function EmbeddingsPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingEntity, setGeneratingEntity] = useState<string | null>(null);
  const { data: status, refetch, isLoading } = trpc.embeddings.getStatus.useQuery();

  const generateAllMutation = trpc.embeddings.generateAll.useMutation({
    onSuccess: (data) => { toast.success(data.message); refetch(); setIsGenerating(false); },
    onError: (error) => { toast.error(error.message); setIsGenerating(false); },
  });

  const generateBatchMutation = trpc.embeddings.generateBatch.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.success} de ${data.total} embeddings gerados`);
      refetch(); setGeneratingEntity(null);
    },
    onError: (error) => { toast.error(error.message); setGeneratingEntity(null); },
  });

  const handleGenerateAll = (force: boolean) => {
    setIsGenerating(true);
    generateAllMutation.mutate({ limitPerEntity: 100, forceRegenerate: force });
  };

  const handleGenerateEntity = (entityType: EntityType) => {
    setGeneratingEntity(entityType);
    generateBatchMutation.mutate({ entityType, limit: 200, forceRegenerate: false });
  };

  const entities = status?.entities ?? [];
  const totalEntities = status?.totalEntities ?? 0;
  const totalEmbeddings = status?.totalEmbeddings ?? 0;
  const overallCoverage = status?.overallCoveragePercent ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Embeddings & Busca Semântica"
        icon={<Sparkles className="w-6 h-6" />}
        subtitle="Gerencie os embeddings vetoriais para busca semântica por IA"
        actions={<Link href="/settings/ai"><Button variant="ghost" leftIcon={<ArrowLeft className="w-4 h-4" />}>Voltar</Button></Link>}
      />

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Total de Entidades", value: totalEntities, icon: <Database className="w-5 h-5 text-blue-600" />, bg: "bg-blue-50 dark:bg-blue-950/50" },
          { label: "Embeddings Gerados", value: totalEmbeddings, icon: <Sparkles className="w-5 h-5 text-emerald-600" />, bg: "bg-emerald-50 dark:bg-emerald-950/50" },
          { label: "Cobertura", value: `${overallCoverage}%`, icon: <BarChart3 className="w-5 h-5 text-violet-600" />, bg: "bg-violet-50 dark:bg-violet-950/50", showBar: true },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border border-theme bg-theme-card p-5">
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-lg ${card.bg}`}>{card.icon}</div>
              <div>
                <p className="text-sm text-theme-muted">{card.label}</p>
                <p className="text-2xl font-bold text-theme">{isLoading ? "..." : card.value.toLocaleString()}</p>
              </div>
            </div>
            {card.showBar && !isLoading && (
              <div className="w-full bg-theme-tertiary rounded-full h-2">
                <div className={`h-2 rounded-full transition-all ${overallCoverage >= 80 ? "bg-emerald-500" : overallCoverage >= 50 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${overallCoverage}%` }} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => handleGenerateAll(false)} disabled={isGenerating} isLoading={isGenerating && !generatingEntity} leftIcon={<Zap className="w-4 h-4" />}>Gerar Pendentes</Button>
        <Button variant="secondary" onClick={() => handleGenerateAll(true)} disabled={isGenerating} leftIcon={<RefreshCw className="w-4 h-4" />}>Regenerar Todos</Button>
        <Button variant="ghost" onClick={() => refetch()} leftIcon={<RefreshCw className="w-4 h-4" />}>Atualizar Status</Button>
      </div>

      {/* Entity Status */}
      <div className="rounded-xl border border-theme bg-theme-card overflow-hidden">
        <div className="px-5 py-4 border-b border-theme">
          <h2 className="text-lg font-semibold text-theme">Status por Entidade</h2>
        </div>
        <div className="divide-y divide-theme">
          {isLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
          ) : entities.map((es) => {
            const config = ENTITY_CONFIG[es.entityType];
            if (!config) return null;
            const isEntityGen = generatingEntity === es.entityType;
            return (
              <div key={es.entityType} className="flex items-center gap-4 px-5 py-4">
                <div className={`flex-shrink-0 p-2 rounded-lg ${config.bgColor}`}><span className={config.color}>{config.icon}</span></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-theme">{config.label}</span>
                    {es.coveragePercent === 100 && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                    {es.coveragePercent < 100 && es.coveragePercent > 0 && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-theme-muted mt-1">
                    <span>{es.totalEmbeddings} / {es.totalEntities}</span>
                    <span>{es.coveragePercent}%</span>
                    {es.pendingCount > 0 && <span className="text-amber-600">{es.pendingCount} pendentes</span>}
                  </div>
                  <div className="w-full bg-theme-tertiary rounded-full h-1.5 mt-2">
                    <div className={`h-1.5 rounded-full transition-all ${es.coveragePercent >= 80 ? "bg-emerald-500" : es.coveragePercent >= 50 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${es.coveragePercent}%` }} />
                  </div>
                </div>
                <Button size="sm" variant={es.pendingCount > 0 ? "primary" : "ghost"} onClick={() => handleGenerateEntity(es.entityType as EntityType)} disabled={isGenerating || isEntityGen} isLoading={isEntityGen} leftIcon={es.pendingCount > 0 ? <Zap className="w-3.5 h-3.5" /> : <RefreshCw className="w-3.5 h-3.5" />}>
                  {es.pendingCount > 0 ? `Gerar ${es.pendingCount}` : "Regenerar"}
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Info */}
      <div className="rounded-xl border border-theme bg-theme-card p-5">
        <h3 className="font-medium text-theme mb-2">Como funciona?</h3>
        <ul className="text-sm text-theme-muted space-y-1">
          <li>• Embeddings são representações vetoriais geradas pela OpenAI (text-embedding-3-small)</li>
          <li>• Permitem busca semântica — encontrar itens por significado, não apenas palavras exatas</li>
          <li>• Novos registros geram embeddings automaticamente ao criar/editar</li>
          <li>• Use &quot;Gerar Pendentes&quot; para registros existentes sem embedding</li>
          <li>• A busca semântica está disponível via <kbd className="px-1.5 py-0.5 rounded border border-theme bg-theme-tertiary text-xs">⌘K</kbd></li>
        </ul>
      </div>
    </div>
  );
}
