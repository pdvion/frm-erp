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
  Warehouse,
  HardHat,
  FileText,
  Barcode,
  Factory,
  Scale,
  Clock,
  DollarSign,
  Briefcase,
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
          <span className="text-theme-secondary">Carregando material...</span>
        </div>
      </div>
    );
  }

  if (error || !material) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <h1 className="text-xl font-bold text-theme mb-2">Material não encontrado</h1>
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
          <div className="bg-theme-card rounded-xl border border-theme p-6">
            <h2 className="text-lg font-semibold text-theme mb-4">Dados Básicos</h2>
            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <dt className="text-sm text-theme-muted">Código</dt>
                <dd className="text-sm font-medium text-theme">{material.code}</dd>
              </div>
              <div>
                <dt className="text-sm text-theme-muted">Código Interno</dt>
                <dd className="text-sm font-medium text-theme">{material.internalCode || "-"}</dd>
              </div>
              <div>
                <dt className="text-sm text-theme-muted flex items-center gap-1">
                  <Barcode className="w-3 h-3" /> Código de Barras
                </dt>
                <dd className="text-sm font-medium text-theme">{material.barcode || "-"}</dd>
              </div>
              <div className="col-span-2 sm:col-span-3">
                <dt className="text-sm text-theme-muted">Descrição</dt>
                <dd className="text-sm font-medium text-theme">{material.description}</dd>
              </div>
              <div>
                <dt className="text-sm text-theme-muted">Unidade Estoque</dt>
                <dd className="text-sm font-medium text-theme">{material.unit || "UN"}</dd>
              </div>
              <div>
                <dt className="text-sm text-theme-muted">Unidade Compra</dt>
                <dd className="text-sm font-medium text-theme">{material.purchaseUnit || material.unit || "UN"}</dd>
              </div>
              {material.purchaseUnit && material.purchaseUnit !== material.unit && (
                <div>
                  <dt className="text-sm text-theme-muted">Fator Conversão</dt>
                  <dd className="text-sm font-medium text-theme">{material.unitConversionFactor || 1}</dd>
                </div>
              )}
              <div>
                <dt className="text-sm text-theme-muted">Categoria</dt>
                <dd className="text-sm font-medium text-theme flex items-center gap-1">
                  <Tag className="w-4 h-4 text-theme-muted" />
                  {material.category?.name || "Sem categoria"}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-theme-muted">Localização</dt>
                <dd className="text-sm font-medium text-theme flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-theme-muted" />
                  {material.location || "-"}
                </dd>
              </div>
              {material.weight > 0 && (
                <div>
                  <dt className="text-sm text-theme-muted flex items-center gap-1">
                    <Scale className="w-3 h-3" /> Peso
                  </dt>
                  <dd className="text-sm font-medium text-theme">{material.weight} {material.weightUnit || "KG"}</dd>
                </div>
              )}
            </dl>
            {material.notes && (
              <div className="mt-4 pt-4 border-t border-theme">
                <dt className="text-sm text-theme-muted mb-1">Observações</dt>
                <dd className="text-sm text-theme">{material.notes}</dd>
              </div>
            )}
          </div>

          {/* Dados Fiscais */}
          <div className="bg-theme-card rounded-xl border border-theme p-6">
            <h2 className="text-lg font-semibold text-theme mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5" /> Dados Fiscais
            </h2>
            <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <dt className="text-sm text-theme-muted">NCM</dt>
                <dd className="text-sm font-medium text-theme">{material.ncm || "-"}</dd>
              </div>
              <div>
                <dt className="text-sm text-theme-muted">% IPI</dt>
                <dd className="text-sm font-medium text-theme">{material.ipiRate || 0}%</dd>
              </div>
              <div>
                <dt className="text-sm text-theme-muted">% ICMS</dt>
                <dd className="text-sm font-medium text-theme">{material.icmsRate || 0}%</dd>
              </div>
            </dl>
          </div>

          {/* Fabricante */}
          {(material.manufacturer || material.manufacturerCode) && (
            <div className="bg-theme-card rounded-xl border border-theme p-6">
              <h2 className="text-lg font-semibold text-theme mb-4 flex items-center gap-2">
                <Factory className="w-5 h-5" /> Fabricante
              </h2>
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm text-theme-muted">Nome</dt>
                  <dd className="text-sm font-medium text-theme">{material.manufacturer || "-"}</dd>
                </div>
                <div>
                  <dt className="text-sm text-theme-muted">Código</dt>
                  <dd className="text-sm font-medium text-theme">{material.manufacturerCode || "-"}</dd>
                </div>
              </dl>
            </div>
          )}

          {/* Estoque */}
          <div className="bg-theme-card rounded-xl border border-theme p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-theme">Estoque</h2>
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
                  <div key={inv.id} className="flex items-center justify-between p-3 bg-theme-secondary rounded-lg">
                    <div className="flex items-center gap-3">
                      <Warehouse className="w-5 h-5 text-theme-muted" />
                      <div>
                        <div className="text-sm font-medium text-theme">
                          {inv.inventoryType === "RAW_MATERIAL" ? "Matéria Prima" :
                           inv.inventoryType === "SEMI_FINISHED" ? "Semi-Acabado" :
                           inv.inventoryType === "FINISHED" ? "Acabado" : inv.inventoryType}
                        </div>
                        <div className="text-xs text-theme-muted">
                          Disponível: {inv.availableQty} {material.unit}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-theme">
                        {inv.quantity} {material.unit}
                      </div>
                      <div className="text-xs text-theme-muted">
                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(inv.totalCost)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-theme-muted">Nenhum registro de estoque encontrado.</p>
            )}
          </div>

          {/* Fornecedores */}
          <div className="bg-theme-card rounded-xl border border-theme p-6">
            <h2 className="text-lg font-semibold text-theme mb-4">Fornecedores</h2>
            
            {material.supplierMaterials && material.supplierMaterials.length > 0 ? (
              <div className="space-y-3">
                {material.supplierMaterials.map((sm) => (
                  <Link
                    key={sm.id}
                    href={`/suppliers/${sm.supplier.id}`}
                    className="flex items-center justify-between p-3 bg-theme-secondary rounded-lg hover:bg-theme-hover transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Building2 className="w-5 h-5 text-theme-muted" />
                      <div>
                        <div className="text-sm font-medium text-theme">
                          {sm.supplier.companyName}
                        </div>
                        <div className="text-xs text-theme-muted">
                          Código: {sm.supplier.code}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-theme">
                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(sm.lastPrice ?? 0)}
                      </div>
                      <div className="text-xs text-theme-muted">
                        Lead time: {sm.leadTimeDays ?? "-"} dias
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-theme-muted">Nenhum fornecedor vinculado.</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Card */}
          <div className="bg-theme-card rounded-xl border border-theme p-6">
            <h3 className="text-sm font-medium text-theme-muted mb-3">Status</h3>
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${status.color}`}>
              <StatusIcon className="w-4 h-4" />
              <span className="text-sm font-medium">{status.label}</span>
            </div>
          </div>

          {/* Quantidades */}
          <div className="bg-theme-card rounded-xl border border-theme p-6">
            <h3 className="text-sm font-medium text-theme-muted mb-3">Limites de Estoque</h3>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-sm text-theme-secondary">Mínimo</dt>
                <dd className="text-sm font-medium text-theme">
                  {material.minQuantity ?? 0} {material.unit}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-theme-secondary">Máximo</dt>
                <dd className="text-sm font-medium text-theme">
                  {material.maxQuantity ?? "-"} {material.unit}
                </dd>
              </div>
            </dl>
          </div>

          {/* Classificação */}
          <div className="bg-theme-card rounded-xl border border-theme p-6">
            <h3 className="text-sm font-medium text-theme-muted mb-3">Classificação</h3>
            <div className="space-y-2">
              {material.isEpi && (
                <div className="flex items-center gap-2">
                  <HardHat className="w-4 h-4 text-orange-500" />
                  <span className="text-sm text-theme-secondary">EPI - Equipamento de Proteção</span>
                </div>
              )}
              {material.isOfficeSupply && (
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-blue-500" />
                  <span className="text-sm text-theme-secondary">Material de Escritório</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                {material.isShared ? (
                  <CheckCircle className="w-4 h-4 text-purple-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-theme-muted" />
                )}
                <span className="text-sm text-theme-secondary">Compartilhado entre empresas</span>
              </div>
            </div>
          </div>

          {/* Requisitos de Qualidade */}
          <div className="bg-theme-card rounded-xl border border-theme p-6">
            <h3 className="text-sm font-medium text-theme-muted mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" /> Qualidade
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {material.requiresQualityCheck ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-theme-muted" />
                )}
                <span className="text-sm text-theme-secondary">Requer IQF</span>
              </div>
              <div className="flex items-center gap-2">
                {material.requiresQualityInspection ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-theme-muted" />
                )}
                <span className="text-sm text-theme-secondary">Inspeção de qualidade</span>
              </div>
              <div className="flex items-center gap-2">
                {material.requiresMaterialCertificate ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-theme-muted" />
                )}
                <span className="text-sm text-theme-secondary">Certificado de material</span>
              </div>
              <div className="flex items-center gap-2">
                {material.requiresControlSheets ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-theme-muted" />
                )}
                <span className="text-sm text-theme-secondary">Controle de fichas</span>
              </div>
              <div className="flex items-center gap-2">
                {material.requiresReturn ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-theme-muted" />
                )}
                <span className="text-sm text-theme-secondary">Requer devolução</span>
              </div>
              <div className="flex items-center gap-2">
                {material.requiresFiscalEntry ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-theme-muted" />
                )}
                <span className="text-sm text-theme-secondary">Entrada fiscal</span>
              </div>
            </div>
            {material.requiredBrand && (
              <div className="mt-3 pt-3 border-t border-theme">
                <dt className="text-xs text-theme-muted">Marca Obrigatória</dt>
                <dd className="text-sm font-medium text-theme">{material.requiredBrand}</dd>
                {material.requiredBrandReason && (
                  <dd className="text-xs text-theme-muted mt-1">{material.requiredBrandReason}</dd>
                )}
              </div>
            )}
          </div>

          {/* Estoque - Parâmetros */}
          <div className="bg-theme-card rounded-xl border border-theme p-6">
            <h3 className="text-sm font-medium text-theme-muted mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Parâmetros de Estoque
            </h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-theme-secondary">Cálculo Qtd. Mín.</dt>
                <dd className="text-theme font-medium">
                  {material.minQuantityCalcType === "CMM" ? "CMM" : 
                   material.minQuantityCalcType === "PEAK_12M" ? "Pico 12M" : "Manual"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-theme-secondary">Lead Time</dt>
                <dd className="text-theme font-medium">{material.avgDeliveryDays || 0} dias</dd>
              </div>
            </dl>
          </div>

          {/* Datas */}
          <div className="bg-theme-card rounded-xl border border-theme p-6">
            <h3 className="text-sm font-medium text-theme-muted mb-3">Informações</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-theme-secondary">Criado em</dt>
                <dd className="text-theme">
                  {new Date(material.createdAt).toLocaleDateString("pt-BR")}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-theme-secondary">Atualizado em</dt>
                <dd className="text-theme">
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
