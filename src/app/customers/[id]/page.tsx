"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { 
  Building2, 
  Edit,
  Loader2,
  MapPin,
  Phone,
  Mail,
  Globe,
  AlertTriangle,
  CheckCircle,
  XCircle,
  CreditCard,
  Calendar,
  FileText
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { LinkButton } from "@/components/ui/LinkButton";
import { useRouteBreadcrumbs } from "@/hooks/useRouteBreadcrumbs";

const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  ACTIVE: { label: "Ativo", color: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400", icon: CheckCircle },
  INACTIVE: { label: "Inativo", color: "bg-theme-card text-theme-muted", icon: XCircle },
  BLOCKED: { label: "Bloqueado", color: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400", icon: AlertTriangle },
};

export default function CustomerDetailPage() {
  const params = useParams();
  const customerId = params.id as string;
  const breadcrumbs = useRouteBreadcrumbs();

  const { data: customer, isLoading, error } = trpc.customers.byId.useQuery({ id: customerId });

  const formatCNPJ = (value: string | null | undefined) => {
    if (!value) return "-";
    const digits = value.replace(/\D/g, "");
    if (digits.length !== 14) return value;
    return `${digits.slice(0,2)}.${digits.slice(2,5)}.${digits.slice(5,8)}/${digits.slice(8,12)}-${digits.slice(12)}`;
  };

  const formatCPF = (value: string | null | undefined) => {
    if (!value) return "-";
    const digits = value.replace(/\D/g, "");
    if (digits.length !== 11) return value;
    return `${digits.slice(0,3)}.${digits.slice(3,6)}.${digits.slice(6,9)}-${digits.slice(9)}`;
  };

  const formatPhone = (value: string | null | undefined) => {
    if (!value) return null;
    const digits = value.replace(/\D/g, "");
    if (digits.length === 10) return `(${digits.slice(0,2)}) ${digits.slice(2,6)}-${digits.slice(6)}`;
    if (digits.length === 11) return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`;
    return value;
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "-";
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          <span className="text-theme-secondary">Carregando cliente...</span>
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <h1 className="text-xl font-bold text-theme mb-2">Cliente não encontrado</h1>
          <Link href="/customers" className="text-blue-400 hover:underline">
            Voltar para listagem
          </Link>
        </div>
      </div>
    );
  }

  const status = statusConfig[customer.status] || statusConfig.ACTIVE;
  const StatusIcon = status.icon;

  const fullAddress = [
    customer.addressStreet,
    customer.addressNumber,
    customer.addressComplement,
    customer.addressNeighborhood,
    customer.addressCity,
    customer.addressState,
    customer.addressZipCode
  ].filter(Boolean).join(", ");

  return (
    <div className="space-y-6">
      <PageHeader
        title={customer.tradeName || customer.companyName}
        subtitle={`Código: ${customer.code}`}
        icon={<Building2 className="w-6 h-6" />}
        backHref="/customers"
        breadcrumbs={breadcrumbs}
        badge={customer.isShared ? { label: "Compartilhado", color: "text-purple-700 dark:text-purple-400", bgColor: "bg-purple-100 dark:bg-purple-900/50" } : undefined}
        actions={
          <LinkButton
            href={`/customers/${customerId}/edit`}
            leftIcon={<Edit className="w-4 h-4" />}
          >
            <span className="hidden sm:inline">Editar</span>
          </LinkButton>
        }
      />

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dados da Empresa */}
          <div className="bg-theme-card rounded-xl border border-theme p-6">
            <h2 className="text-lg font-semibold text-theme mb-4">Dados do Cliente</h2>
            <dl className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <dt className="text-sm text-theme-muted">Razão Social</dt>
                <dd className="text-sm font-medium text-theme">{customer.companyName}</dd>
              </div>
              {customer.tradeName && (
                <div className="col-span-2">
                  <dt className="text-sm text-theme-muted">Nome Fantasia</dt>
                  <dd className="text-sm font-medium text-theme">{customer.tradeName}</dd>
                </div>
              )}
              <div>
                <dt className="text-sm text-theme-muted">{customer.type === "PERSON" ? "CPF" : "CNPJ"}</dt>
                <dd className="text-sm font-medium text-theme">
                  {customer.type === "PERSON" ? formatCPF(customer.cpf) : formatCNPJ(customer.cnpj)}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-theme-muted">Inscrição Estadual</dt>
                <dd className="text-sm font-medium text-theme">{customer.stateRegistration || "-"}</dd>
              </div>
              <div>
                <dt className="text-sm text-theme-muted">Inscrição Municipal</dt>
                <dd className="text-sm font-medium text-theme">{customer.municipalRegistration || "-"}</dd>
              </div>
              <div>
                <dt className="text-sm text-theme-muted">Tipo</dt>
                <dd className="text-sm font-medium text-theme">
                  {customer.type === "PERSON" ? "Pessoa Física" : "Pessoa Jurídica"}
                </dd>
              </div>
            </dl>
          </div>

          {/* Endereço */}
          <div className="bg-theme-card rounded-xl border border-theme p-6">
            <h2 className="text-lg font-semibold text-theme mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-theme-muted" />
              Endereço
            </h2>
            {fullAddress ? (
              <p className="text-sm text-theme-secondary">{fullAddress}</p>
            ) : (
              <p className="text-sm text-theme-muted">Endereço não cadastrado.</p>
            )}
          </div>

          {/* Contato */}
          <div className="bg-theme-card rounded-xl border border-theme p-6">
            <h2 className="text-lg font-semibold text-theme mb-4">Contato</h2>
            <div className="grid grid-cols-2 gap-4">
              {customer.contactName && (
                <div className="col-span-2">
                  <dt className="text-sm text-theme-muted">Nome do Contato</dt>
                  <dd className="text-sm font-medium text-theme">{customer.contactName}</dd>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-theme-muted" />
                <span className="text-sm text-theme-secondary">
                  {formatPhone(customer.phone) || "-"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-theme-muted" />
                <span className="text-sm text-theme-secondary">
                  {formatPhone(customer.mobile) || "-"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-theme-muted" />
                {customer.email ? (
                  <a href={`mailto:${customer.email}`} className="text-sm text-blue-400 hover:underline">
                    {customer.email}
                  </a>
                ) : (
                  <span className="text-sm text-theme-muted">-</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-theme-muted" />
                {customer.website ? (
                  <a href={customer.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 hover:underline">
                    {customer.website}
                  </a>
                ) : (
                  <span className="text-sm text-theme-muted">-</span>
                )}
              </div>
            </div>
          </div>

          {/* Observações */}
          {customer.notes && (
            <div className="bg-theme-card rounded-xl border border-theme p-6">
              <h2 className="text-lg font-semibold text-theme mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-theme-muted" />
                Observações
              </h2>
              <p className="text-sm text-theme-secondary whitespace-pre-wrap">{customer.notes}</p>
            </div>
          )}
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

          {/* Dados Comerciais */}
          <div className="bg-theme-card rounded-xl border border-theme p-6">
            <h3 className="text-sm font-medium text-theme-muted mb-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Dados Comerciais
            </h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-xs text-theme-muted">Limite de Crédito</dt>
                <dd className="text-lg font-bold text-theme">{formatCurrency(customer.creditLimit)}</dd>
              </div>
              <div>
                <dt className="text-xs text-theme-muted">Prazo de Pagamento</dt>
                <dd className="text-sm font-medium text-theme">{customer.paymentTermDays || 30} dias</dd>
              </div>
              {customer.minInvoiceValue && (
                <div>
                  <dt className="text-xs text-theme-muted">Valor Mínimo Fatura</dt>
                  <dd className="text-sm font-medium text-theme">{formatCurrency(customer.minInvoiceValue)}</dd>
                </div>
              )}
              {customer.defaultPaymentCondition && (
                <div>
                  <dt className="text-xs text-theme-muted">Condição de Pagamento</dt>
                  <dd className="text-sm font-medium text-theme">{customer.defaultPaymentCondition}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Flags */}
          <div className="bg-theme-card rounded-xl border border-theme p-6">
            <h3 className="text-sm font-medium text-theme-muted mb-3">Configurações</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {customer.applySt ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-theme-muted" />
                )}
                <span className="text-sm text-theme-secondary">Substituição Tributária</span>
              </div>
              <div className="flex items-center gap-2">
                {customer.isShared ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-theme-muted" />
                )}
                <span className="text-sm text-theme-secondary">Compartilhado entre empresas</span>
              </div>
            </div>
          </div>

          {/* Datas */}
          <div className="bg-theme-card rounded-xl border border-theme p-6">
            <h3 className="text-sm font-medium text-theme-muted mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Informações
            </h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-theme-secondary">Criado em</dt>
                <dd className="text-theme">
                  {new Date(customer.createdAt).toLocaleDateString("pt-BR")}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-theme-secondary">Atualizado em</dt>
                <dd className="text-theme">
                  {new Date(customer.updatedAt).toLocaleDateString("pt-BR")}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
