"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock,
  Building2,
  Calendar,
  Hash,
  DollarSign,
  Package,
  Link as LinkIcon,
  AlertTriangle,
  Loader2,
  Download,
  Printer
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate, formatNumber } from "@/lib/formatters";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";

type NFeStatus = "PENDING" | "APPROVED" | "REJECTED" | "PROCESSING";

const statusConfig: Record<NFeStatus, { label: string; color: string; bgColor: string; icon: typeof CheckCircle }> = {
  PENDING: { label: "Pendente", color: "text-yellow-800", bgColor: "bg-yellow-100", icon: Clock },
  APPROVED: { label: "Aprovada", color: "text-green-800", bgColor: "bg-green-100", icon: CheckCircle },
  REJECTED: { label: "Rejeitada", color: "text-red-800", bgColor: "bg-red-100", icon: XCircle },
  PROCESSING: { label: "Processando", color: "text-blue-800", bgColor: "bg-blue-100", icon: AlertTriangle },
};

export default function NFeDetailPage() {
  const params = useParams();
  useRouter();
  const id = params.id as string;

  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const { data: invoice, isLoading, error, refetch } = trpc.nfe.getById.useQuery({ id });

  const approveMutation = trpc.nfe.approve.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const rejectMutation = trpc.nfe.reject.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await approveMutation.mutateAsync({ id });
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    const reason = prompt("Motivo da rejeição:");
    if (!reason) return;

    setIsRejecting(true);
    try {
      await rejectMutation.mutateAsync({ id, reason });
    } finally {
      setIsRejecting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--frm-primary)]" />
          <span className="text-theme-secondary">Carregando nota fiscal...</span>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="space-y-6 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-theme mb-2">Nota fiscal não encontrada</h2>
          <p className="text-theme-muted mb-4">{error?.message || "A nota fiscal solicitada não existe."}</p>
          <Link
            href="/fiscal/nfe"
            className="text-[var(--frm-primary)] hover:underline"
          >
            Voltar para lista
          </Link>
        </div>
      </div>
    );
  }

  const statusInfo = statusConfig[invoice.status as NFeStatus] || statusConfig.PENDING;
  const StatusIcon = statusInfo.icon;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`NFe ${invoice.invoiceNumber}`}
        icon={<FileText className="w-6 h-6 text-blue-600" />}
        backHref="/fiscal/nfe"
        actions={
          <div className="flex items-center gap-2">
            {invoice.status === "PENDING" && (
              <>
                <Button
                  onClick={handleReject}
                  isLoading={isRejecting}
                  variant="ghost"
                  leftIcon={<XCircle className="w-5 h-5" />}
                  className="text-red-600 hover:bg-red-50"
                >
                  Rejeitar
                </Button>
                <Button
                  onClick={handleApprove}
                  isLoading={isApproving}
                  variant="success"
                  leftIcon={<CheckCircle className="w-5 h-5" />}
                >
                  Aprovar
                </Button>
              </>
            )}
            <Button variant="ghost" size="icon" title="Imprimir">
              <Printer className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" title="Download XML">
              <Download className="w-5 h-5" />
            </Button>
          </div>
        }
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Status Banner */}
        <div className={`${statusInfo.bgColor} rounded-xl p-4 mb-6 flex items-center gap-3`}>
          <StatusIcon className={`w-6 h-6 ${statusInfo.color}`} />
          <div>
            <span className={`font-medium ${statusInfo.color}`}>
              Status: {statusInfo.label}
            </span>
            {invoice.rejectionReason && (
              <p className="text-sm text-red-600 mt-1">
                Motivo: {invoice.rejectionReason}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header Info */}
            <div className="bg-theme-card rounded-xl border border-theme p-6">
              <h3 className="text-lg font-medium text-theme mb-4">Informações da Nota</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="flex items-center gap-2 text-theme-muted text-sm mb-1">
                    <Hash className="w-4 h-4" />
                    Número
                  </div>
                  <div className="font-medium text-theme">{invoice.invoiceNumber}</div>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-theme-muted text-sm mb-1">
                    <FileText className="w-4 h-4" />
                    Série
                  </div>
                  <div className="font-medium text-theme">{invoice.series}</div>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-theme-muted text-sm mb-1">
                    <Calendar className="w-4 h-4" />
                    Data Emissão
                  </div>
                  <div className="font-medium text-theme">{formatDate(invoice.issueDate)}</div>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-theme-muted text-sm mb-1">
                    <DollarSign className="w-4 h-4" />
                    Valor Total
                  </div>
                  <div className="font-medium text-theme">{formatCurrency(invoice.totalInvoice)}</div>
                </div>
              </div>

              {/* Access Key */}
              <div className="mt-4 pt-4 border-t border-theme">
                <div className="text-theme-muted text-sm mb-1">Chave de Acesso</div>
                <div className="font-mono text-sm text-theme break-all bg-theme-tertiary p-2 rounded">
                  {invoice.accessKey}
                </div>
              </div>
            </div>

            {/* Supplier Info */}
            <div className="bg-theme-card rounded-xl border border-theme p-6">
              <h3 className="text-lg font-medium text-theme mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Fornecedor
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-theme-muted text-sm mb-1">Razão Social</div>
                  <div className="font-medium text-theme">{invoice.supplierName}</div>
                </div>
                <div>
                  <div className="text-theme-muted text-sm mb-1">CNPJ</div>
                  <div className="font-mono text-theme">{invoice.supplierCnpj}</div>
                </div>
              </div>
              {invoice.supplier && (
                <div className="mt-4 pt-4 border-t border-theme">
                  <Link
                    href={`/suppliers/${invoice.supplier.id}`}
                    className="text-[var(--frm-primary)] hover:underline text-sm flex items-center gap-1"
                  >
                    <LinkIcon className="w-4 h-4" />
                    Ver cadastro do fornecedor
                  </Link>
                </div>
              )}
            </div>

            {/* Items */}
            <div className="bg-theme-card rounded-xl border border-theme overflow-hidden">
              <div className="p-6 border-b border-theme">
                <h3 className="text-lg font-medium text-theme flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Itens ({invoice.items?.length || 0})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-theme-tertiary">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">#</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Produto</th>
                      <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">NCM</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase">Qtd</th>
                      <th className="hidden sm:table-cell px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase">Unit.</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase">Total</th>
                      <th className="hidden lg:table-cell px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Vínculo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme-table">
                    {invoice.items?.map((item) => (
                      <tr key={item.id} className="hover:bg-theme-hover">
                        <td className="px-4 py-3 text-sm text-theme-muted">{item.itemNumber}</td>
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-theme">{item.productName}</div>
                          <div className="text-xs text-theme-muted">Cód: {item.productCode}</div>
                        </td>
                        <td className="hidden md:table-cell px-4 py-3 text-sm text-theme-secondary font-mono">
                          {item.ncm}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-theme">
                          {formatNumber(item.quantity)} {item.unit}
                        </td>
                        <td className="hidden sm:table-cell px-4 py-3 text-sm text-right text-theme-secondary">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-theme">
                          {formatCurrency(item.totalPrice)}
                        </td>
                        <td className="hidden lg:table-cell px-4 py-3 text-center">
                          {item.material ? (
                            <Link
                              href={`/materials/${item.material.id}`}
                              className="inline-flex items-center gap-1 text-xs text-green-600 hover:underline"
                            >
                              <CheckCircle className="w-3 h-3" />
                              Vinculado
                            </Link>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-yellow-600">
                              <AlertTriangle className="w-3 h-3" />
                              Pendente
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Sidebar - Totals */}
          <div className="space-y-6">
            {/* Totals */}
            <div className="bg-theme-card rounded-xl border border-theme p-6">
              <h3 className="text-lg font-medium text-theme mb-4">Totais</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-theme-secondary">Produtos</span>
                  <span className="font-medium">{formatCurrency(invoice.totalProducts)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-theme-secondary">Frete</span>
                  <span className="font-medium">{formatCurrency(invoice.freightValue || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-theme-secondary">Desconto</span>
                  <span className="font-medium text-red-600">-{formatCurrency(invoice.discountValue || 0)}</span>
                </div>
                <div className="border-t border-theme pt-3 flex justify-between">
                  <span className="font-medium text-theme">Total da Nota</span>
                  <span className="font-bold text-lg text-theme">{formatCurrency(invoice.totalInvoice)}</span>
                </div>
              </div>
            </div>

            {/* Taxes */}
            <div className="bg-theme-card rounded-xl border border-theme p-6">
              <h3 className="text-lg font-medium text-theme mb-4">Impostos</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-theme-secondary">Base ICMS</span>
                  <span className="font-medium">{formatCurrency(invoice.icmsBase || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-theme-secondary">ICMS</span>
                  <span className="font-medium">{formatCurrency(invoice.icmsValue || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-theme-secondary">IPI</span>
                  <span className="font-medium">{formatCurrency(invoice.ipiValue || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-theme-secondary">PIS</span>
                  <span className="font-medium">{formatCurrency(invoice.pisValue || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-theme-secondary">COFINS</span>
                  <span className="font-medium">{formatCurrency(invoice.cofinsValue || 0)}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            {invoice.status === "APPROVED" && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-800">NFe Aprovada</h4>
                    <p className="text-sm text-green-600 mt-1">
                      Estoque atualizado e título financeiro gerado.
                    </p>
                    <Link
                      href="/payables"
                      className="text-sm text-green-700 hover:underline mt-2 inline-block"
                    >
                      Ver contas a pagar →
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
