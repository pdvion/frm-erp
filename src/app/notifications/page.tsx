"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { formatDateTime } from "@/lib/formatters";
import { PageHeader } from "@/components/PageHeader";
import {
  Bell,
  Check,
  CheckCheck,
  Info,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Loader2,
  ExternalLink,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const typeIcons = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle,
};

const typeColors = {
  info: "text-blue-500 bg-blue-50 border-blue-200",
  success: "text-green-500 bg-green-50 border-green-200",
  warning: "text-yellow-500 bg-yellow-50 border-yellow-200",
  error: "text-red-500 bg-red-50 border-red-200",
};

const categoryLabels = {
  system: "Sistema",
  business: "Negócio",
  error: "Erro",
};

export default function NotificationsPage() {
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [page, setPage] = useState(1);

  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.notifications.list.useQuery({
    page,
    limit: 20,
    category: category as "system" | "business" | "error" | undefined,
    unreadOnly,
  });

  const markAsReadMutation = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      utils.notifications.list.invalidate();
      utils.notifications.countUnread.invalidate();
    },
  });

  const markAllAsReadMutation = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => {
      utils.notifications.list.invalidate();
      utils.notifications.countUnread.invalidate();
    },
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Notificações"
        subtitle="Gerencie suas notificações e alertas"
        icon={<Bell className="w-6 h-6" />}
        module="settings"
        actions={
          <Button
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
          >
            {markAllAsReadMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCheck className="w-4 h-4" />
            )}
            Marcar todas como lidas
          </Button>
        }
      />

      <div className="space-y-6">
        {/* Filtros */}
        <div className="bg-theme-card rounded-lg border border-theme p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-theme-muted" />
              <span className="text-sm text-theme-secondary">Filtros:</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setCategory(undefined)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  !category ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "text-theme-secondary hover:bg-theme-hover"
                }`}
              >
                Todas
              </Button>
              {Object.entries(categoryLabels).map(([key, label]) => (
                <Button
                  key={key}
                  onClick={() => setCategory(key)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    category === key ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "text-theme-secondary hover:bg-theme-hover"
                  }`}
                >
                  {label}
                </Button>
              ))}
            </div>
            <label className="flex items-center gap-2 ml-auto">
              <Input
                type="checkbox"
                checked={unreadOnly}
                onChange={(e) => setUnreadOnly(e.target.checked)}
                className="rounded border-theme"
              />
              <span className="text-sm text-theme-secondary">Apenas não lidas</span>
            </label>
          </div>
        </div>

        {/* Lista */}
        <div className="bg-theme-card rounded-lg border border-theme overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : !data?.notifications?.length ? (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 mx-auto text-theme-muted mb-4" />
              <p className="text-theme-muted">Nenhuma notificação encontrada</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-100">
                {data.notifications.map((notification) => {
                  const Icon = typeIcons[notification.type as keyof typeof typeIcons] || Info;
                  const colorClass = typeColors[notification.type as keyof typeof typeColors] || typeColors.info;

                  return (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-theme-hover transition-colors ${
                        !notification.isRead ? "bg-blue-50/30" : ""
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-full border ${colorClass}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-medium text-theme">
                                {notification.title}
                              </p>
                              {notification.message && (
                                <p className="text-sm text-theme-secondary mt-1">
                                  {notification.message}
                                </p>
                              )}
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-xs text-theme-muted">
                                {formatDateTime(notification.createdAt)}
                              </p>
                              <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${
                                notification.category === "error"
                                  ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                  : notification.category === "business"
                                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                    : "bg-theme-tertiary text-theme-secondary"
                              }`}>
                                {categoryLabels[notification.category as keyof typeof categoryLabels] || notification.category}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 mt-3">
                            {notification.link && (
                              <Link
                                href={notification.link}
                                onClick={() => markAsReadMutation.mutate({ id: notification.id })}
                                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                              >
                                <ExternalLink className="w-4 h-4" />
                                Ver detalhes
                              </Link>
                            )}
                            {!notification.isRead && (
                              <Button
                                onClick={() => markAsReadMutation.mutate({ id: notification.id })}
                                className="text-sm text-theme-muted hover:text-theme-secondary flex items-center gap-1"
                              >
                                <Check className="w-4 h-4" />
                                Marcar como lida
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Paginação */}
              {data.pages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-theme bg-theme-tertiary">
                  <p className="text-sm text-theme-secondary">
                    Página {data.page} de {data.pages} ({data.total} notificações)
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1.5 text-sm border border-theme-input rounded-lg hover:bg-theme-hover disabled:opacity-50"
                    >
                      Anterior
                    </Button>
                    <Button
                      onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                      disabled={page === data.pages}
                      className="px-3 py-1.5 text-sm border border-theme-input rounded-lg hover:bg-theme-hover disabled:opacity-50"
                    >
                      Próxima
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
