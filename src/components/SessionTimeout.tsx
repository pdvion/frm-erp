"use client";

import { useSession } from "@/hooks/useSession";
import { Clock, RefreshCw, LogOut } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface SessionTimeoutProps {
  timeoutMinutes?: number;
  warningMinutes?: number;
}

export function SessionTimeout({ 
  timeoutMinutes = 30, 
  warningMinutes = 5 
}: SessionTimeoutProps) {
  const { showWarning, remainingSeconds, extendSession, signOut } = useSession({
    timeoutMinutes,
    warningMinutes,
  });

  if (!showWarning) return null;

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-theme-card rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
          
          <h2 className="text-xl font-semibold text-theme mb-2">
            Sessão expirando
          </h2>
          
          <p className="text-theme-secondary mb-4">
            Sua sessão irá expirar por inatividade em:
          </p>
          
          <div className="text-4xl font-bold text-[var(--frm-primary)] mb-6 font-mono">
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              size="lg"
              onClick={signOut}
              leftIcon={<LogOut className="w-5 h-5" />}
              className="flex-1"
            >
              Sair
            </Button>
            
            <Button
              variant="primary"
              size="lg"
              onClick={extendSession}
              leftIcon={<RefreshCw className="w-5 h-5" />}
              className="flex-1"
            >
              Continuar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
