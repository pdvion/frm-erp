"use client";

import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
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

const mockRequests: ApprovalRequest[] = [
  { id: "1", code: "SOL-001", type: "PAYMENT", description: "Pagamento fornecedor ABC Ltda", amount: 15000, requester: "João Silva", requestDate: new Date("2025-01-27"), status: "PENDING", priority: "HIGH" },
  { id: "2", code: "SOL-002", type: "TRANSFER", description: "Transferência entre contas", amount: 50000, requester: "Maria Santos", requestDate: new Date("2025-01-26"), status: "PENDING", priority: "MEDIUM" },
  { id: "3", code: "SOL-003", type: "EXPENSE", description: "Despesa com viagem corporativa", amount: 3500, requester: "Pedro Costa", requestDate: new Date("2025-01-25"), status: "APPROVED", priority: "LOW" },
  { id: "4", code: "SOL-004", type: "PURCHASE", description: "Compra de equipamentos TI", amount: 25000, requester: "Ana Oliveira", requestDate: new Date("2025-01-24"), status: "REJECTED", priority: "URGENT" },
  { id: "5", code: "SOL-005", type: "PAYMENT", description: "Pagamento de aluguel", amount: 8000, requester: "Carlos Lima", requestDate: new Date("2025-01-23"), status: "PENDING", priority: "HIGH" },
];

export default function ApprovalsRequestsPage() {
  const [statusFilter, setStatusFilter] = useState<RequestStatus>("ALL");
  const [search, setSearch] = useState("");

  const filteredRequests = mockRequests.filter((req) => {
    const matchesStatus = statusFilter === "ALL" || req.status === statusFilter;
    const matchesSearch = req.description.toLowerCase().includes(search.toLowerCase()) ||
      req.code.toLowerCase().includes(search.toLowerCase()) ||
      req.requester.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const pendingCount = mockRequests.filter((r) => r.status === "PENDING").length;

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
      LOW: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
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
              <p className="text-2xl font-bold text-theme">{mockRequests.filter((r) => r.status === "APPROVED").length}</p>
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
              <p className="text-2xl font-bold text-theme">{mockRequests.filter((r) => r.status === "REJECTED").length}</p>
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
              <p className="text-2xl font-bold text-theme">{mockRequests.length}</p>
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
                          <button className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded" title="Aprovar">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded" title="Rejeitar">
                            <XCircle className="w-4 h-4" />
                          </button>
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
