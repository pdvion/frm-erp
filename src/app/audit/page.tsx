"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { 
  Shield, 
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Eye,
  Plus,
  Pencil,
  Trash2,
  LogIn,
  LogOut,
  Download,
  Upload,
  User,
  Calendar,
  Clock
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { formatDate, formatDateTime } from "@/lib/formatters";
import { PageHeader } from "@/components/PageHeader";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge, colorToVariant } from "@/components/ui/Badge";

const actionConfig = {
  CREATE: { label: "Criação", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", icon: Plus },
  UPDATE: { label: "Atualização", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", icon: Pencil },
  DELETE: { label: "Exclusão", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", icon: Trash2 },
  VIEW: { label: "Visualização", color: "bg-theme-tertiary text-theme", icon: Eye },
  LOGIN: { label: "Login", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400", icon: LogIn },
  LOGOUT: { label: "Logout", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400", icon: LogOut },
  EXPORT: { label: "Exportação", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400", icon: Download },
  IMPORT: { label: "Importação", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400", icon: Upload },
};

const entityTypeLabels: Record<string, string> = {
  Material: "Material",
  Supplier: "Fornecedor",
  Inventory: "Estoque",
  InventoryMovement: "Movimentação",
  Category: "Categoria",
  Quote: "Orçamento",
  User: "Usuário",
  Company: "Empresa",
};

export default function AuditPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState<string | undefined>();
  const [entityTypeFilter, setEntityTypeFilter] = useState<string | undefined>();
  const [selectedLog, setSelectedLog] = useState<string | null>(null);

  const { data, isLoading, error } = trpc.audit.list.useQuery({
    search: search || undefined,
    action: actionFilter as keyof typeof actionConfig | undefined,
    entityType: entityTypeFilter || undefined,
    page,
    limit: 25,
  });

  const { data: logDetail } = trpc.audit.byId.useQuery(
    { id: selectedLog! },
    { enabled: !!selectedLog }
  );

  const logs = data?.logs ?? [];
  const pagination = data?.pagination;


  const formatTime = (date: Date | string) => {
    return new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Auditoria"
        subtitle="Histórico de ações do sistema"
        icon={<Shield className="w-6 h-6" />}
        module="admin"
      />

      <div>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-theme-muted z-10" />
            <Input
              placeholder="Buscar por descrição, código ou usuário..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-10"
            />
          </div>

          {/* Action Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-theme-muted" />
            <Select
              value={actionFilter ?? ""}
              onChange={(value) => {
                setActionFilter(value || undefined);
                setPage(1);
              }}
              placeholder="Todas as ações"
              options={[
                { value: "", label: "Todas as ações" },
                { value: "CREATE", label: "Criação" },
                { value: "UPDATE", label: "Atualização" },
                { value: "DELETE", label: "Exclusão" },
                { value: "VIEW", label: "Visualização" },
                { value: "LOGIN", label: "Login" },
                { value: "LOGOUT", label: "Logout" },
                { value: "EXPORT", label: "Exportação" },
                { value: "IMPORT", label: "Importação" },
              ]}
            />
          </div>

          {/* Entity Type Filter */}
          <Select
            value={entityTypeFilter ?? ""}
            onChange={(value) => {
              setEntityTypeFilter(value || undefined);
              setPage(1);
            }}
            placeholder="Todas as entidades"
            options={[
              { value: "", label: "Todas as entidades" },
              { value: "Material", label: "Material" },
              { value: "Supplier", label: "Fornecedor" },
              { value: "Inventory", label: "Estoque" },
              { value: "InventoryMovement", label: "Movimentação" },
              { value: "Category", label: "Categoria" },
              { value: "Quote", label: "Orçamento" },
              { value: "User", label: "Usuário" },
            ]}
          />
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">Erro ao carregar logs: {error.message}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="bg-theme-card rounded-xl border border-theme p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="ml-3 text-theme-secondary">Carregando logs...</span>
            </div>
          </div>
        )}

        {/* Logs Table */}
        {!isLoading && !error && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Lista de Logs */}
            <div className="lg:col-span-2">
              <div className="bg-theme-card rounded-xl border border-theme overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-theme-table-header border-b border-theme">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">
                          Data/Hora
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">
                          Ação
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">
                          Descrição
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase tracking-wider">
                          Usuário
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-theme-table">
                      {logs.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-theme-muted">
                            Nenhum log de auditoria encontrado.
                          </td>
                        </tr>
                      ) : (
                        logs.map((log) => {
                          const config = actionConfig[log.action as keyof typeof actionConfig];
                          const Icon = config?.icon ?? Eye;
                          const isSelected = selectedLog === log.id;
                          
                          return (
                            <tr 
                              key={log.id} 
                              className={`hover:bg-theme-hover cursor-pointer ${isSelected ? "bg-indigo-50" : ""}`}
                              onClick={() => setSelectedLog(log.id)}
                              role="row"
                              tabIndex={0}
                              aria-current={isSelected ? "true" : undefined}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  setSelectedLog(log.id);
                                }
                              }}
                            >
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex items-center gap-2 text-sm text-theme-secondary">
                                  <Calendar className="w-4 h-4 text-theme-muted" />
                                  {formatDate(log.createdAt)}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-theme-muted">
                                  <Clock className="w-3 h-3" />
                                  {formatTime(log.createdAt)}
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <Badge variant={colorToVariant(config?.color ?? "")}>
                                  <Icon className="w-3.5 h-3.5" />
                                  {config?.label ?? log.action}
                                </Badge>
                              </td>
                              <td className="px-4 py-3">
                                <div className="text-sm text-theme">
                                  {log.description || "-"}
                                </div>
                                <div className="text-xs text-theme-muted">
                                  {entityTypeLabels[log.entityType] || log.entityType}
                                  {log.entityCode && ` • ${log.entityCode}`}
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <User className="w-4 h-4 text-theme-muted" />
                                  <div>
                                    <div className="text-sm text-theme">
                                      {log.userName || log.user?.name || "-"}
                                    </div>
                                    <div className="text-xs text-theme-muted">
                                      {log.userEmail || log.user?.email || ""}
                                    </div>
                                  </div>
                                </div>
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
                      {pagination.total} registros
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                        aria-label="Página anterior"
                        type="button"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <span className="text-sm text-theme-secondary">
                        {pagination.page} / {pagination.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page + 1)}
                        disabled={page === pagination.totalPages}
                        aria-label="Próxima página"
                        type="button"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Detalhes do Log */}
            <div className="lg:col-span-1">
              <div className="bg-theme-card rounded-xl border border-theme p-6 sticky top-6">
                <h3 className="text-lg font-semibold text-theme mb-4">Detalhes</h3>
                
                {!selectedLog ? (
                  <p className="text-sm text-theme-muted">
                    Selecione um registro para ver os detalhes.
                  </p>
                ) : !logDetail ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <dt className="text-xs text-theme-muted uppercase">Data/Hora</dt>
                      <dd className="text-sm text-theme">{formatDateTime(logDetail.createdAt)}</dd>
                    </div>
                    
                    <div>
                      <dt className="text-xs text-theme-muted uppercase">Ação</dt>
                      <dd className="text-sm">
                        <Badge variant={colorToVariant(actionConfig[logDetail.action as keyof typeof actionConfig]?.color)}>
                          {actionConfig[logDetail.action as keyof typeof actionConfig]?.label || logDetail.action}
                        </Badge>
                      </dd>
                    </div>

                    <div>
                      <dt className="text-xs text-theme-muted uppercase">Entidade</dt>
                      <dd className="text-sm text-theme">
                        {entityTypeLabels[logDetail.entityType] || logDetail.entityType}
                        {logDetail.entityId && (
                          <span className="text-theme-muted ml-1">({logDetail.entityId.slice(0, 8)}...)</span>
                        )}
                      </dd>
                    </div>

                    {logDetail.entityCode && (
                      <div>
                        <dt className="text-xs text-theme-muted uppercase">Código</dt>
                        <dd className="text-sm text-theme">{logDetail.entityCode}</dd>
                      </div>
                    )}

                    <div>
                      <dt className="text-xs text-theme-muted uppercase">Usuário</dt>
                      <dd className="text-sm text-theme">
                        {logDetail.userName || logDetail.user?.name || "-"}
                        {(logDetail.userEmail || logDetail.user?.email) && (
                          <div className="text-xs text-theme-muted">
                            {logDetail.userEmail || logDetail.user?.email}
                          </div>
                        )}
                      </dd>
                    </div>

                    {logDetail.ipAddress && (
                      <div>
                        <dt className="text-xs text-theme-muted uppercase">IP</dt>
                        <dd className="text-sm text-theme font-mono">{logDetail.ipAddress}</dd>
                      </div>
                    )}

                    {logDetail.changedFields && logDetail.changedFields.length > 0 && (
                      <div>
                        <dt className="text-xs text-theme-muted uppercase mb-1">Campos Alterados</dt>
                        <dd className="flex flex-wrap gap-1">
                          {logDetail.changedFields.map((field) => (
                            <span key={field} className="px-2 py-0.5 bg-theme-tertiary text-theme-secondary rounded text-xs">
                              {field}
                            </span>
                          ))}
                        </dd>
                      </div>
                    )}

                    {(logDetail.oldValues || logDetail.newValues) && (
                      <div>
                        <dt className="text-xs text-theme-muted uppercase mb-1">Valores</dt>
                        <dd className="text-xs">
                          {logDetail.oldValues && (
                            <details className="mb-2">
                              <summary className="cursor-pointer text-red-600 hover:text-red-700">
                                Valores Anteriores
                              </summary>
                              <pre className="mt-1 p-2 bg-red-50 rounded text-xs overflow-auto max-h-40">
                                {JSON.stringify(logDetail.oldValues, null, 2)}
                              </pre>
                            </details>
                          )}
                          {logDetail.newValues && (
                            <details>
                              <summary className="cursor-pointer text-green-600 hover:text-green-700">
                                Valores Novos
                              </summary>
                              <pre className="mt-1 p-2 bg-green-50 rounded text-xs overflow-auto max-h-40">
                                {JSON.stringify(logDetail.newValues, null, 2)}
                              </pre>
                            </details>
                          )}
                        </dd>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
