"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { 
  Package, 
  Edit,
  Loader2,
  Building2,
  MapPin,
  Tag,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Warehouse
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";

const statusConfig = {
  ACTIVE: { label: "Ativo", color: "bg-green-900/50 text-green-400", icon: CheckCircle },
  INACTIVE: { label: "Inativo", color: "bg-zinc-800 text-zinc-400", icon: XCircle },
  BLOCKED: { label: "Bloqueado", color: "bg-red-900/50 text-red-400", icon: AlertTriangle },
};

export default function MaterialDetailPage() {
  const params = useParams();
  const materialId = params.id as string;

  const { data: material, isLoading, error } = trpc.materials.byId.useQuery({ id: materialId });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          <span className="text-zinc-400">Carregando material...</span>
        </div>
      </div>
    );
  }

  if (error || !material) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <h1 className="text-xl font-bold text-white mb-2">Material não encontrado</h1>
          <Link href="/materials" className="text-blue-400 hover:underline">
            Voltar para listagem
          </Link>
        </div>
      </div>
    );
  }

  const status = statusConfig[material.status];
  const StatusIcon = status.icon;

  return (
    <div className="space-y-6">
      <PageHeader
        title={material.description}
        subtitle={`Código: ${material.code}${material.internalCode ? ` • ${material.internalCode}` : ""}`}
        icon={<Package className="w-6 h-6" />}
        backHref="/materials"
        badge={material.isShared ? { label: "Compartilhado", color: "text-purple-400", bgColor: "bg-purple-900/50" } : undefined}
        actions={
          <Link
            href={`/materials/${materialId}/edit`}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Edit className="w-4 h-4" />
            <span className="hidden sm:inline">Editar</span>
          </Link>
        }
      />

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dados Básicos */}
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Dados Básicos</h2>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm text-zinc-500">Código</dt>
                <dd className="text-sm font-medium text-white">{material.code}</dd>
              </div>
              <div>
                <dt className="text-sm text-zinc-500">Código Interno</dt>
                <dd className="text-sm font-medium text-white">{material.internalCode || "-"}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-sm text-zinc-500">Descrição</dt>
                <dd className="text-sm font-medium text-white">{material.description}</dd>
              </div>
              <div>
                <dt className="text-sm text-zinc-500">Unidade</dt>
                <dd className="text-sm font-medium text-white">{material.unit || "UN"}</dd>
              </div>
              <div>
                <dt className="text-sm text-zinc-500">NCM</dt>
                <dd className="text-sm font-medium text-white">{material.ncm || "-"}</dd>
              </div>
              <div>
                <dt className="text-sm text-zinc-500">Categoria</dt>
                <dd className="text-sm font-medium text-white flex items-center gap-1">
                  <Tag className="w-4 h-4 text-zinc-500" />
                  {material.category?.name || "Sem categoria"}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-zinc-500">Localização</dt>
                <dd className="text-sm font-medium text-white flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-zinc-500" />
                  {material.location || "-"}
                </dd>
              </div>
            </dl>
          </div>

          {/* Estoque */}
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Estoque</h2>
              <Link
                href={`/inventory?materialId=${materialId}`}
                className="text-sm text-blue-400 hover:underline"
              >
                Ver movimentações
              </Link>
            </div>
            
            {material.inventory && material.inventory.length > 0 ? (
              <div className="space-y-3">
                {material.inventory.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Warehouse className="w-5 h-5 text-zinc-500" />
                      <div>
                        <div className="text-sm font-medium text-white">
                          {inv.inventoryType === "RAW_MATERIAL" ? "Matéria Prima" :
                           inv.inventoryType === "SEMI_FINISHED" ? "Semi-Acabado" :
                           inv.inventoryType === "FINISHED" ? "Acabado" : inv.inventoryType}
                        </div>
                        <div className="text-xs text-zinc-500">
                          Disponível: {inv.availableQty} {material.unit}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-white">
                        {inv.quantity} {material.unit}
                      </div>
                      <div className="text-xs text-zinc-500">
                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(inv.totalCost)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-500">Nenhum registro de estoque encontrado.</p>
            )}
          </div>

          {/* Fornecedores */}
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Fornecedores</h2>
            
            {material.supplierMaterials && material.supplierMaterials.length > 0 ? (
              <div className="space-y-3">
                {material.supplierMaterials.map((sm) => (
                  <Link
                    key={sm.id}
                    href={`/suppliers/${sm.supplier.id}`}
                    className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Building2 className="w-5 h-5 text-zinc-500" />
                      <div>
                        <div className="text-sm font-medium text-white">
                          {sm.supplier.companyName}
                        </div>
                        <div className="text-xs text-zinc-500">
                          Código: {sm.supplier.code}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-white">
                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(sm.lastPrice ?? 0)}
                      </div>
                      <div className="text-xs text-zinc-500">
                        Lead time: {sm.leadTimeDays ?? "-"} dias
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-zinc-500">Nenhum fornecedor vinculado.</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
            <h3 className="text-sm font-medium text-zinc-500 mb-3">Status</h3>
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${status.color}`}>
              <StatusIcon className="w-4 h-4" />
              <span className="text-sm font-medium">{status.label}</span>
            </div>
          </div>

          {/* Quantidades */}
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
            <h3 className="text-sm font-medium text-zinc-500 mb-3">Limites de Estoque</h3>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-sm text-zinc-400">Mínimo</dt>
                <dd className="text-sm font-medium text-white">
                  {material.minQuantity ?? 0} {material.unit}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-zinc-400">Máximo</dt>
                <dd className="text-sm font-medium text-white">
                  {material.maxQuantity ?? "-"} {material.unit}
                </dd>
              </div>
            </dl>
          </div>

          {/* Flags */}
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
            <h3 className="text-sm font-medium text-zinc-500 mb-3">Configurações</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {material.requiresQualityCheck ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-zinc-600" />
                )}
                <span className="text-sm text-zinc-300">Requer inspeção de qualidade</span>
              </div>
              <div className="flex items-center gap-2">
                {material.isShared ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-zinc-600" />
                )}
                <span className="text-sm text-zinc-300">Compartilhado entre empresas</span>
              </div>
            </div>
          </div>

          {/* Datas */}
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
            <h3 className="text-sm font-medium text-zinc-500 mb-3">Informações</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-zinc-400">Criado em</dt>
                <dd className="text-white">
                  {new Date(material.createdAt).toLocaleDateString("pt-BR")}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-400">Atualizado em</dt>
                <dd className="text-white">
                  {new Date(material.updatedAt).toLocaleDateString("pt-BR")}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
