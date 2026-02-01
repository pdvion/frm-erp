"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { FileText, Clock, CheckCircle, XCircle, Eye, Filter } from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/formatters";

type RequestStatus = "ALL" | "PENDING" | "APPROVED" | "REJECTED";

interface ApprovalRequest {
  id: string;
  code: string;
  type: "PAYMENT" | "TRANSFER" | "EXPENSE" | "PURCHASE";
  description: string;
  amount: number;
  requester: string;
  requestDate: Date;
  status: "PENDING" | "APPROVED" | "REJECTED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
}


export default function ApprovalsRequestsPage() {
  const [statusFilter, setStatusFilter] = useState<RequestStatus>("ALL");
  const [search, setSearch] = useState("");

  const { data, isLoading } = trpc.approvals.listRequests.useQuery({
    status: statusFilter === "ALL" ? undefined : statusFilter as "PENDING" | "APPROVED" | "REJECTED",
    search: search || undefined,
  });

  // Mapear dados do backend para o formato esperado
  const requests: ApprovalRequest[] = data?.requests?.map((r) => ({
    id: r.id,
    code: r.code,
    type: "PAYMENT" as const,
    description: r.justification || r.payable?.supplier?.companyName || "Solicitação de pagamento",
    amount: r.payable?.netValue ? Number(r.payable.netValue) : 0,
    requester: r.requester?.name || "Desconhecido",
    requestDate: new Date(r.requestedAt),
    status: r.status as "PENDING" | "APPROVED" | "REJECTED",
    priority: (r.urgency === "URGENT" ? "URGENT" : r.urgency === "HIGH" ? "HIGH" : r.urgency === "NORMAL" ? "MEDIUM" : "LOW") as ApprovalRequest["priority"],
  })) || [];

  const filteredRequests = requests.filter((req) => {
    const matchesSearch = !search || 
      req.description.toLowerCase().includes(search.toLowerCase()) ||
      req.code.toLowerCase().includes(search.toLowerCase()) ||
      req.requester.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const pendingCount = requests.filter((r) => r.status === "PENDING").length;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Solicitações de Aprovação"
          subtitle="Gerenciar solicitações de pagamento pendentes"
          icon={<FileText className="w-6 h-6" />}
          module="FINANCIAL"
        />
        <TableSkeleton rows={5} />
      </div>
    );
  }

  const getStatusBadge = (status: ApprovalRequest["status"]) => {
    const styles = {
      PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
      APPROVED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
      REJECTED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    };
    const labels = { PENDING: "Pendente", APPROVED: "Aprovado", REJECTED: "Rejeitado" };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status]}`}>{labels[status]}</span>;
  };

  const getPriorityBadge = (priority: ApprovalRequest["priority"]) => {
    const styles = {
      LOW: "bg-theme-tertiary text-theme dark:bg-theme/30 dark:text-theme-muted",
      MEDIUM: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
      HIGH: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
      URGENT: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
    };
    const labels = { LOW: "Baixa", MEDIUM: "Média", HIGH: "Alta", URGENT: "Urgente" };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[priority]}`}>{labels[priority]}</span>;
  };

  const getTypeLabel = (type: ApprovalRequest["type"]) => {
    const labels = { PAYMENT: "Pagamento", TRANSFER: "Transferência", EXPENSE: "Despesa", PURCHASE: "Compra" };
    return labels[type];
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Solicitações de Aprovação"
        icon={<FileText className="w-6 h-6" />}
        module="TREASURY"
        breadcrumbs={[
          { label: "Tesouraria", href: "/treasury" },
          { label: "Aprovações", href: "/treasury/approvals" },
          { label: "Solicitações" },
        ]}
      />

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-theme-card border border-theme rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-theme">{pendingCount}</p>
              <p className="text-sm text-theme-muted">Pendentes</p>
            </div>
          </div>
        </div>
        <div className="bg-theme-card border border-theme rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-theme">{requests.filter((r) => r.status === "APPROVED").length}</p>
              <p className="text-sm text-theme-muted">Aprovadas</p>
            </div>
          </div>
        </div>
        <div className="bg-theme-card border border-theme rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-theme">{requests.filter((r) => r.status === "REJECTED").length}</p>
              <p className="text-sm text-theme-muted">Rejeitadas</p>
            </div>
          </div>
        </div>
        <div className="bg-theme-card border border-theme rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-theme">{requests.length}</p>
              <p className="text-sm text-theme-muted">Total</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-theme-card border border-theme rounded-lg p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por código, descrição ou solicitante..."
              className="w-full px-3 py-2 border border-theme rounded-lg bg-theme-card text-theme"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-theme-muted" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as RequestStatus)}
              className="px-3 py-2 border border-theme rounded-lg bg-theme-card text-theme"
            >
              <option value="ALL">Todos</option>
              <option value="PENDING">Pendentes</option>
              <option value="APPROVED">Aprovados</option>
              <option value="REJECTED">Rejeitados</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de solicitações */}
      <div className="bg-theme-card border border-theme rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-theme-hover">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Código</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Descrição</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase">Valor</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Solicitante</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Data</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Prioridade</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Status</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme">
              {filteredRequests.map((request) => (
                <tr key={request.id} className="hover:bg-theme-hover">
                  <td className="px-4 py-3 text-sm font-medium text-theme">{request.code}</td>
                  <td className="px-4 py-3 text-sm text-theme">{getTypeLabel(request.type)}</td>
                  <td className="px-4 py-3 text-sm text-theme max-w-xs truncate">{request.description}</td>
                  <td className="px-4 py-3 text-sm text-theme text-right font-medium">{formatCurrency(request.amount)}</td>
                  <td className="px-4 py-3 text-sm text-theme">{request.requester}</td>
                  <td className="px-4 py-3 text-sm text-theme-muted">{formatDate(request.requestDate)}</td>
                  <td className="px-4 py-3 text-center">{getPriorityBadge(request.priority)}</td>
                  <td className="px-4 py-3 text-center">{getStatusBadge(request.status)}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Link
                        href={`/treasury/approvals/requests/${request.id}`}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded"
                        title="Visualizar"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      {request.status === "PENDING" && (
                        <>
                          <Button variant="ghost" size="sm" className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30" title="Aprovar">
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30" title="Rejeitar">
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredRequests.length === 0 && (
          <div className="text-center py-8 text-theme-muted">Nenhuma solicitação encontrada</div>
        )}
      </div>
    </div>
  );
}
