"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { createClient } from "@/lib/supabase/client";
import {
  Bell,
  X,
  Check,
  CheckCheck,
  Info,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Loader2,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

const typeIcons = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle,
};

const typeColors = {
  info: "text-blue-500 bg-blue-50",
  success: "text-green-500 bg-green-50",
  warning: "text-yellow-500 bg-yellow-50",
  error: "text-red-500 bg-red-50",
};

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const utils = trpc.useUtils();

  const { data: unreadCount = 0 } = trpc.notifications.countUnread.useQuery(undefined, {
    refetchInterval: 30000, // Atualizar a cada 30 segundos
    retry: false, // Não retentar em caso de erro 401
    refetchOnWindowFocus: false, // Evitar refetch desnecessário
  });

  const { data: notifications, isLoading } = trpc.notifications.unread.useQuery(
    { limit: 10 },
    { enabled: isOpen }
  );

  const markAsReadMutation = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => {
      utils.notifications.countUnread.invalidate();
      utils.notifications.unread.invalidate();
    },
  });

  const markAllAsReadMutation = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => {
      utils.notifications.countUnread.invalidate();
      utils.notifications.unread.invalidate();
    },
  });

  // Supabase Realtime para notificações em tempo real
  useEffect(() => {
    const supabase = createClient();
    
    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
        },
        () => {
          // Atualizar contagem quando nova notificação chegar
          utils.notifications.countUnread.invalidate();
          utils.notifications.unread.invalidate();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [utils]);

  const handleMarkAsRead = (id: string) => {
    markAsReadMutation.mutate({ id });
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Agora";
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-theme-muted hover:text-theme-secondary hover:bg-theme-tertiary rounded-full transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 bg-theme-card rounded-lg shadow-xl border border-theme z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-theme bg-theme-secondary">
              <h3 className="font-semibold text-theme">Notificações</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    disabled={markAllAsReadMutation.isPending}
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    {markAllAsReadMutation.isPending ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <CheckCheck className="w-3 h-3" />
                    )}
                    Marcar todas
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-theme-muted hover:text-theme-secondary"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                </div>
              ) : !notifications?.length ? (
                <div className="text-center py-8">
                  <Bell className="w-10 h-10 mx-auto text-theme-muted mb-2" />
                  <p className="text-theme-muted text-sm">Nenhuma notificação</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => {
                    const Icon = typeIcons[notification.type as keyof typeof typeIcons] || Info;
                    const colorClass = typeColors[notification.type as keyof typeof typeColors] || typeColors.info;

                    return (
                      <div
                        key={notification.id}
                        className={`p-4 hover:bg-theme-secondary transition-colors ${
                          !notification.isRead ? "bg-blue-50/50" : ""
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-full ${colorClass}`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-medium text-theme text-sm">
                                {notification.title}
                              </p>
                              <span className="text-xs text-theme-muted whitespace-nowrap">
                                {formatTime(notification.createdAt || new Date())}
                              </span>
                            </div>
                            {notification.message && (
                              <p className="text-sm text-theme-secondary mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              {notification.link && (
                                <Link
                                  href={notification.link}
                                  onClick={() => {
                                    handleMarkAsRead(notification.id);
                                    setIsOpen(false);
                                  }}
                                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  Ver detalhes
                                </Link>
                              )}
                              {!notification.isRead && (
                                <button
                                  onClick={() => handleMarkAsRead(notification.id)}
                                  className="text-xs text-theme-muted hover:text-theme-secondary flex items-center gap-1"
                                >
                                  <Check className="w-3 h-3" />
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
              )}
            </div>

            <div className="px-4 py-3 border-t border-theme bg-theme-secondary">
              <Link
                href="/notifications"
                onClick={() => setIsOpen(false)}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Ver todas as notificações
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
