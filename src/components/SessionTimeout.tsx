"use client";

import { useSession } from "@/hooks/useSession";
import { Clock, RefreshCw, LogOut } from "lucide-react";

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
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
          
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Sessão expirando
          </h2>
          
          <p className="text-gray-600 mb-4">
            Sua sessão irá expirar por inatividade em:
          </p>
          
          <div className="text-4xl font-bold text-[var(--frm-primary)] mb-6 font-mono">
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </div>

          <div className="flex gap-3">
            <button
              onClick={signOut}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              <LogOut className="w-5 h-5" />
              Sair
            </button>
            
            <button
              onClick={extendSession}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-[var(--frm-primary)] text-white rounded-lg hover:bg-[var(--frm-dark)] transition-colors font-medium"
            >
              <RefreshCw className="w-5 h-5" />
              Continuar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
