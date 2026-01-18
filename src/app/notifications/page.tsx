"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { CompanySwitcher } from "@/components/CompanySwitcher";
import {
  ChevronLeft,
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

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <Bell className="w-6 h-6 text-blue-600" />
                <h1 className="text-xl font-semibold text-gray-900">Notificações</h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
              >
                {markAllAsReadMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCheck className="w-4 h-4" />
                )}
                Marcar todas como lidas
              </button>
              <CompanySwitcher />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtros */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">Filtros:</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCategory(undefined)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  !category ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Todas
              </button>
              {Object.entries(categoryLabels).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setCategory(key)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    category === key ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <label className="flex items-center gap-2 ml-auto">
              <input
                type="checkbox"
                checked={unreadOnly}
                onChange={(e) => setUnreadOnly(e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-600">Apenas não lidas</span>
            </label>
          </div>
        </div>

        {/* Lista */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : !data?.notifications?.length ? (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Nenhuma notificação encontrada</p>
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
                      className={`p-4 hover:bg-gray-50 transition-colors ${
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
                              <p className="font-medium text-gray-900">
                                {notification.title}
                              </p>
                              {notification.message && (
                                <p className="text-sm text-gray-600 mt-1">
                                  {notification.message}
                                </p>
                              )}
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-xs text-gray-400">
                                {formatDate(notification.createdAt)}
                              </p>
                              <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${
                                notification.category === "error"
                                  ? "bg-red-100 text-red-700"
                                  : notification.category === "business"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-gray-100 text-gray-700"
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
                              <button
                                onClick={() => markAsReadMutation.mutate({ id: notification.id })}
                                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                              >
                                <Check className="w-4 h-4" />
                                Marcar como lida
                              </button>
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
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
                  <p className="text-sm text-gray-600">
                    Página {data.page} de {data.pages} ({data.total} notificações)
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                    >
                      Anterior
                    </button>
                    <button
                      onClick={() => setPage((p) => Math.min(data.pages, p + 1))}
                      disabled={page === data.pages}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50"
                    >
                      Próxima
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
