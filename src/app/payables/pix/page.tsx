"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  QrCode, 
  Search, 
  CheckCircle,
  Clock,
  AlertTriangle,
  Eye,
  ChevronLeft,
  ChevronRight,
  Filter,
  Copy,
  Send,
  RefreshCw,
  Building2
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { LinkButton } from "@/components/ui/LinkButton";
import { Badge, colorToVariant } from "@/components/ui/Badge";

type PixStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED";

const statusConfig: Record<PixStatus, { label: string; color: string; icon: typeof CheckCircle }> = {
  PENDING: { label: "Pendente", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400", icon: Clock },
  PROCESSING: { label: "Processando", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", icon: RefreshCw },
  COMPLETED: { label: "Concluído", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle },
  FAILED: { label: "Falhou", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", icon: AlertTriangle },
  CANCELLED: { label: "Cancelado", color: "bg-theme-tertiary text-theme", icon: AlertTriangle },
};

export default function PixPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("");
  const [type, setType] = useState<string>("");
  const [page, setPage] = useState(1);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const { data, isLoading, error } = trpc.payables.listPixTransactions.useQuery({
    search: search || undefined,
    status: (status || undefined) as "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED" | "SCHEDULED" | undefined,
    type: (type || undefined) as "PAYMENT" | "TRANSFER" | "REFUND" | undefined,
    page,
    limit: 15,
  });

  const transactions = data?.transactions ?? [];
  const pagination = data?.pagination;
  const stats = data?.stats;

  const copyToClipboard = async (key: string) => {
    await navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const formatPixKey = (key: string, type: string) => {
    if (type === "CPF" || type === "CNPJ") {
      return key.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }
    if (type === "PHONE") {
      return key.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    }
    return key;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transações PIX"
        icon={<QrCode className="w-6 h-6 text-purple-600" />}
        actions={
          <div className="flex items-center gap-2">
            <LinkButton
              href="/payables/pix/schedules"
              variant="outline"
              leftIcon={<Clock className="w-5 h-5" />}
            >
              Agendamentos
            </LinkButton>
            <LinkButton
              href="/payables/pix/new"
              leftIcon={<Send className="w-5 h-5" />}
            >
              Novo PIX
            </LinkButton>
          </div>
        }
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* KPIs */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-theme-card rounded-xl border border-theme p-4">
              <div className="flex items-center gap-2 text-theme-secondary mb-1">
                <Clock className="w-4 h-4 text-yellow-500" />
                <span className="text-sm">Pendentes</span>
              </div>
              <div className="text-2xl font-bold text-theme">{stats.pending}</div>
              <div className="text-xs text-theme-muted">{formatCurrency(stats.pendingValue)}</div>
            </div>
            <div className="bg-theme-card rounded-xl border border-theme p-4">
              <div className="flex items-center gap-2 text-theme-secondary mb-1">
                <RefreshCw className="w-4 h-4 text-blue-500" />
                <span className="text-sm">Processando</span>
              </div>
              <div className="text-2xl font-bold text-theme">{stats.processing}</div>
              <div className="text-xs text-theme-muted">{formatCurrency(stats.processingValue)}</div>
            </div>
            <div className="bg-theme-card rounded-xl border border-theme p-4">
              <div className="flex items-center gap-2 text-theme-secondary mb-1">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm">Concluídos (Hoje)</span>
              </div>
              <div className="text-2xl font-bold text-theme">{stats.completedToday}</div>
              <div className="text-xs text-theme-muted">{formatCurrency(stats.completedValueToday)}</div>
            </div>
            <div className="bg-theme-card rounded-xl border border-theme p-4">
              <div className="flex items-center gap-2 text-theme-secondary mb-1">
                <Building2 className="w-4 h-4 text-purple-500" />
                <span className="text-sm">Total (Mês)</span>
              </div>
              <div className="text-2xl font-bold text-theme">{stats.totalMonth}</div>
              <div className="text-xs text-theme-muted">{formatCurrency(stats.totalValueMonth)}</div>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-theme-card rounded-xl border border-theme p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-theme-muted z-10" />
              <Input
                placeholder="Buscar por chave PIX, nome ou E2E ID..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-theme-muted" />
              <Select
                value={status}
                onChange={(value) => {
                  setStatus(value);
                  setPage(1);
                }}
                placeholder="Todos os status"
                options={[
                  { value: "", label: "Todos os status" },
                  { value: "PENDING", label: "Pendentes" },
                  { value: "PROCESSING", label: "Processando" },
                  { value: "COMPLETED", label: "Concluídos" },
                  { value: "FAILED", label: "Falhou" },
                  { value: "CANCELLED", label: "Cancelados" },
                ]}
              />
              <Select
                value={type}
                onChange={(value) => {
                  setType(value);
                  setPage(1);
                }}
                placeholder="Todos os tipos"
                options={[
                  { value: "", label: "Todos os tipos" },
                  { value: "PAYMENT", label: "Pagamento" },
                  { value: "TRANSFER", label: "Transferência" },
                ]}
              />
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">Erro ao carregar transações: {error.message}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="bg-theme-card rounded-xl border border-theme p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--frm-primary)]"></div>
              <span className="ml-3 text-theme-secondary">Carregando transações...</span>
            </div>
          </div>
        )}

        {/* Table */}
        {!isLoading && !error && (
          <div className="bg-theme-card rounded-xl border border-theme overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-theme-table-header border-b border-theme">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">
                      Data/Hora
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">
                      Destinatário
                    </th>
                    <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">
                      Chave PIX
                    </th>
                    <th className="hidden sm:table-cell px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-table">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-theme-muted">
                        <div className="flex flex-col items-center gap-2">
                          <QrCode className="w-12 h-12 text-theme-muted" />
                          <p>Nenhuma transação PIX encontrada</p>
                          <Link
                            href="/payables/pix/new"
                            className="text-[var(--frm-primary)] hover:underline"
                          >
                            Realizar primeiro PIX
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => {
                      const statusInfo = statusConfig[tx.status as PixStatus] || statusConfig.PENDING;
                      const StatusIcon = statusInfo.icon;
                      return (
                        <tr key={tx.id} className="hover:bg-theme-hover">
                          <td className="px-4 py-3">
                            <div className="text-sm text-theme">
                              {formatDateTime(tx.createdAt)}
                            </div>
                            <div className="text-xs text-theme-muted">
                              {tx.type === "PAYMENT" ? "Pagamento" : "Transferência"}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm text-theme max-w-xs truncate">
                              {tx.recipientName}
                            </div>
                            <div className="text-xs text-theme-muted font-mono">
                              {tx.recipientDocument}
                            </div>
                          </td>
                          <td className="hidden md:table-cell px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div>
                                <div className="text-xs text-theme-muted">{tx.pixKeyType}</div>
                                <div className="text-sm text-theme font-mono truncate max-w-[200px]">
                                  {formatPixKey(tx.pixKey, tx.pixKeyType)}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(tx.pixKey)}
                                title="Copiar chave"
                              >
                                {copiedKey === tx.pixKey ? (
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                          </td>
                          <td className="hidden sm:table-cell px-4 py-3 whitespace-nowrap text-right">
                            <div className="text-sm font-medium text-theme">
                              {formatCurrency(tx.value)}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            <Badge variant={colorToVariant(statusInfo.color)}>
                              <StatusIcon className="w-3 h-3" />
                              {statusInfo.label}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right">
                            <Link
                              href={`/payables/pix/${tx.id}`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-[var(--frm-primary)] hover:bg-[var(--frm-50)] rounded-lg transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                              <span>Ver</span>
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="px-4 py-3 border-t border-theme flex items-center justify-between">
                <div className="text-sm text-theme-secondary">
                  Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{" "}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} de{" "}
                  {pagination.total} registros
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <span className="text-sm text-theme-secondary">
                    Página {pagination.page} de {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page === pagination.totalPages}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Info Card */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <QrCode className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-800">Sobre o PIX</h4>
              <ul className="mt-2 text-sm text-blue-700 space-y-1">
                <li>• Transações são processadas em tempo real (24/7)</li>
                <li>• Limite diário configurável por conta bancária</li>
                <li>• Suporte a chaves CPF/CNPJ, Email, Telefone e Aleatória</li>
                <li>• Comprovantes disponíveis para download após conclusão</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
