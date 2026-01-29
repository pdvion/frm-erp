"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import {
  ArrowLeft,
  Monitor,
  Smartphone,
  Globe,
  Clock,
  Loader2,
  LogOut,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface SessionInfo {
  id: string;
  createdAt: Date;
  lastActiveAt: Date;
  userAgent: string;
  ip: string;
  isCurrent: boolean;
}

function parseUserAgent(ua: string): { device: string; browser: string; icon: React.ElementType } {
  const isMobile = /mobile|android|iphone|ipad/i.test(ua);
  const isTablet = /tablet|ipad/i.test(ua);
  
  let browser = "Navegador";
  if (/chrome/i.test(ua)) browser = "Chrome";
  else if (/firefox/i.test(ua)) browser = "Firefox";
  else if (/safari/i.test(ua)) browser = "Safari";
  else if (/edge/i.test(ua)) browser = "Edge";

  let device = "Desktop";
  if (isMobile) device = "Mobile";
  else if (isTablet) device = "Tablet";

  return {
    device,
    browser,
    icon: isMobile ? Smartphone : Monitor,
  };
}

function formatDate(date: Date | string) {
  return new Date(date).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SessionsPage() {
  useAuth();
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const supabase = createClient();

  const loadSessions = useCallback(async () => {
    setIsLoading(true);
    try {
      // Supabase não expõe lista de sessões diretamente
      // Vamos simular com a sessão atual
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setSessions([
          {
            id: session.access_token.slice(-8),
            createdAt: new Date(session.user.created_at || Date.now()),
            lastActiveAt: new Date(),
            userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "Unknown",
            ip: "Atual",
            isCurrent: true,
          },
        ]);
      }
    } catch (error) {
      console.error("Erro ao carregar sessões:", error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase.auth]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const revokeSession = async (sessionId: string) => {
    setRevoking(sessionId);
    setMessage(null);

    try {
      // Para revogar outras sessões, usamos signOut global
      // Nota: Supabase não permite revogar sessões específicas via client
      await supabase.auth.signOut({ scope: "others" });
      
      setMessage({ type: "success", text: "Outras sessões foram encerradas" });
      await loadSessions();
    } catch {
      setMessage({ type: "error", text: "Erro ao encerrar sessões" });
    } finally {
      setRevoking(null);
    }
  };

  const revokeAllSessions = async () => {
    setRevoking("all");
    setMessage(null);

    try {
      await supabase.auth.signOut({ scope: "global" });
      // Usuário será redirecionado para login
    } catch {
      setMessage({ type: "error", text: "Erro ao encerrar sessões" });
      setRevoking(null);
    }
  };

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        <div className="max-w-3xl mx-auto space-y-6">
          <PageHeader
            title="Sessões Ativas"
            subtitle="Gerencie os dispositivos conectados à sua conta"
            icon={<Monitor className="w-6 h-6" />}
            backHref="/profile"
            module="settings"
          />

          {message && (
            <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
              message.type === "success" 
                ? "bg-green-50 text-green-800 border border-green-200" 
                : "bg-red-50 text-red-800 border border-red-200"
            }`}>
              {message.type === "success" ? (
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          <div className="bg-theme-card rounded-xl border border-theme overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-[var(--frm-primary)]" />
              </div>
            ) : (
              <>
                <div className="divide-y divide-theme-table">
                  {sessions.map((session) => {
                    const { device, browser, icon: DeviceIcon } = parseUserAgent(session.userAgent);
                    
                    return (
                      <div key={session.id} className="p-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-xl ${
                            session.isCurrent 
                              ? "bg-green-100 text-green-600" 
                              : "bg-theme-tertiary text-theme-secondary"
                          }`}>
                            <DeviceIcon className="w-6 h-6" />
                          </div>
                          
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-theme">
                                {device} - {browser}
                              </span>
                              {session.isCurrent && (
                                <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                                  Sessão atual
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-4 mt-1 text-sm text-theme-muted">
                              <span className="flex items-center gap-1">
                                <Globe className="w-4 h-4" />
                                {session.ip}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {formatDate(session.lastActiveAt)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {!session.isCurrent && (
                          <button
                            onClick={() => revokeSession(session.id)}
                            disabled={revoking === session.id}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {revoking === session.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <LogOut className="w-4 h-4" />
                            )}
                            Encerrar
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {sessions.length > 0 && (
                  <div className="p-6 bg-theme-tertiary border-t border-theme">
                    <button
                      onClick={revokeAllSessions}
                      disabled={revoking === "all"}
                      className="w-full flex items-center justify-center gap-2 py-3 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 font-medium"
                    >
                      {revoking === "all" ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <LogOut className="w-5 h-5" />
                      )}
                      Encerrar todas as sessões (incluindo esta)
                    </button>
                    <p className="text-sm text-theme-muted text-center mt-2">
                      Você será desconectado de todos os dispositivos
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
