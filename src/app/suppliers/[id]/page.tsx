"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { 
  Users, 
  Edit,
  Loader2,
  MapPin,
  Phone,
  Mail,
  Globe,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Star,
  Package
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";

const statusConfig = {
  ACTIVE: { label: "Ativo", color: "bg-green-900/50 text-green-400", icon: CheckCircle },
  INACTIVE: { label: "Inativo", color: "bg-zinc-800 text-zinc-400", icon: XCircle },
  BLOCKED: { label: "Bloqueado", color: "bg-red-900/50 text-red-400", icon: AlertTriangle },
};

export default function SupplierDetailPage() {
  const params = useParams();
  const supplierId = params.id as string;

  const { data: supplier, isLoading, error } = trpc.suppliers.byId.useQuery({ id: supplierId });

  const formatCNPJ = (value: string | null) => {
    if (!value) return "-";
    const digits = value.replace(/\D/g, "");
    if (digits.length !== 14) return value;
    return `${digits.slice(0,2)}.${digits.slice(2,5)}.${digits.slice(5,8)}/${digits.slice(8,12)}-${digits.slice(12)}`;
  };

  const formatPhone = (value: string | null) => {
    if (!value) return null;
    const digits = value.replace(/\D/g, "");
    if (digits.length === 10) return `(${digits.slice(0,2)}) ${digits.slice(2,6)}-${digits.slice(6)}`;
    if (digits.length === 11) return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`;
    return value;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-green-500" />
          <span className="text-zinc-400">Carregando fornecedor...</span>
        </div>
      </div>
    );
  }

  if (error || !supplier) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <h1 className="text-xl font-bold text-white mb-2">Fornecedor não encontrado</h1>
          <Link href="/suppliers" className="text-green-400 hover:underline">
            Voltar para listagem
          </Link>
        </div>
      </div>
    );
  }

  const status = statusConfig[supplier.status];
  const StatusIcon = status.icon;

  const fullAddress = [
    supplier.address,
    supplier.number,
    supplier.complement,
    supplier.neighborhood,
    supplier.city,
    supplier.state,
    supplier.zipCode
  ].filter(Boolean).join(", ");

  return (
    <div className="space-y-6">
      <PageHeader
        title={supplier.tradeName || supplier.companyName}
        subtitle={`Código: ${supplier.code}`}
        icon={<Users className="w-6 h-6" />}
        backHref="/suppliers"
        badge={supplier.isShared ? { label: "Compartilhado", color: "text-purple-400", bgColor: "bg-purple-900/50" } : undefined}
        actions={
          <Link
            href={`/suppliers/${supplierId}/edit`}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
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
          {/* Dados da Empresa */}
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Dados da Empresa</h2>
            <dl className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <dt className="text-sm text-zinc-500">Razão Social</dt>
                <dd className="text-sm font-medium text-white">{supplier.companyName}</dd>
              </div>
              {supplier.tradeName && (
                <div className="col-span-2">
                  <dt className="text-sm text-zinc-500">Nome Fantasia</dt>
                  <dd className="text-sm font-medium text-white">{supplier.tradeName}</dd>
                </div>
              )}
              <div>
                <dt className="text-sm text-zinc-500">CNPJ</dt>
                <dd className="text-sm font-medium text-white">{formatCNPJ(supplier.cnpj)}</dd>
              </div>
              <div>
                <dt className="text-sm text-zinc-500">Inscrição Estadual</dt>
                <dd className="text-sm font-medium text-white">{supplier.ie || "-"}</dd>
              </div>
              <div>
                <dt className="text-sm text-zinc-500">Inscrição Municipal</dt>
                <dd className="text-sm font-medium text-white">{supplier.im || "-"}</dd>
              </div>
              <div>
                <dt className="text-sm text-zinc-500">Condições de Pagamento</dt>
                <dd className="text-sm font-medium text-white">{supplier.paymentTerms || "-"}</dd>
              </div>
            </dl>
          </div>

          {/* Endereço */}
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-zinc-500" />
              Endereço
            </h2>
            {fullAddress ? (
              <p className="text-sm text-zinc-300">{fullAddress}</p>
            ) : (
              <p className="text-sm text-zinc-500">Endereço não cadastrado.</p>
            )}
          </div>

          {/* Contato */}
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Contato</h2>
            <div className="grid grid-cols-2 gap-4">
              {supplier.contactName && (
                <div className="col-span-2">
                  <dt className="text-sm text-zinc-500">Nome do Contato</dt>
                  <dd className="text-sm font-medium text-white">{supplier.contactName}</dd>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-zinc-500" />
                <span className="text-sm text-zinc-300">
                  {formatPhone(supplier.phone) || "-"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-zinc-500" />
                <span className="text-sm text-zinc-300">
                  {formatPhone(supplier.mobile) || "-"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-zinc-500" />
                {supplier.email ? (
                  <a href={`mailto:${supplier.email}`} className="text-sm text-blue-400 hover:underline">
                    {supplier.email}
                  </a>
                ) : (
                  <span className="text-sm text-zinc-500">-</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-zinc-500" />
                {supplier.website ? (
                  <a href={supplier.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 hover:underline">
                    {supplier.website}
                  </a>
                ) : (
                  <span className="text-sm text-zinc-500">-</span>
                )}
              </div>
            </div>
          </div>

          {/* Materiais Fornecidos */}
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Materiais Fornecidos</h2>
            
            {supplier.supplierMaterials && supplier.supplierMaterials.length > 0 ? (
              <div className="space-y-3">
                {supplier.supplierMaterials.map((sm) => (
                  <Link
                    key={sm.id}
                    href={`/materials/${sm.material.id}`}
                    className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Package className="w-5 h-5 text-zinc-500" />
                      <div>
                        <div className="text-sm font-medium text-white">
                          {sm.material.description}
                        </div>
                        <div className="text-xs text-zinc-500">
                          Código: {sm.material.code}
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
              <p className="text-sm text-zinc-500">Nenhum material vinculado.</p>
            )}
          </div>

          {/* Observações */}
          {supplier.notes && (
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Observações</h2>
              <p className="text-sm text-zinc-300 whitespace-pre-wrap">{supplier.notes}</p>
            </div>
          )}
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

          {/* Índice de Qualidade */}
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
            <h3 className="text-sm font-medium text-zinc-500 mb-3">Índice de Qualidade (IQF)</h3>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <span className="text-2xl font-bold text-white">
                {supplier.qualityIndex?.toFixed(1) ?? "0.0"}
              </span>
              <span className="text-sm text-zinc-500">/ 100</span>
            </div>
            <div className="mt-2 h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-yellow-500 rounded-full"
                style={{ width: `${supplier.qualityIndex ?? 0}%` }}
              />
            </div>
          </div>

          {/* Flags */}
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6">
            <h3 className="text-sm font-medium text-zinc-500 mb-3">Configurações</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {supplier.isShared ? (
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
                  {new Date(supplier.createdAt).toLocaleDateString("pt-BR")}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-400">Atualizado em</dt>
                <dd className="text-white">
                  {new Date(supplier.updatedAt).toLocaleDateString("pt-BR")}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
