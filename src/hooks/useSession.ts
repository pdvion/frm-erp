"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface SessionConfig {
  timeoutMinutes: number;
  warningMinutes: number;
}

const DEFAULT_CONFIG: SessionConfig = {
  timeoutMinutes: 30,
  warningMinutes: 5,
};

export function useSession(config: Partial<SessionConfig> = {}) {
  const { timeoutMinutes, warningMinutes } = { ...DEFAULT_CONFIG, ...config };
  const { isAuthenticated, signOut, refreshSession } = useAuth();
  
  const [lastActivity, setLastActivity] = useState<Date>(new Date());
  const [showWarning, setShowWarning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const timeoutMs = timeoutMinutes * 60 * 1000;
  const warningMs = warningMinutes * 60 * 1000;

  // Resetar atividade
  const resetActivity = useCallback(() => {
    setLastActivity(new Date());
    setShowWarning(false);
    
    // Limpar timers existentes
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
  }, []);

  // Estender sessão
  const extendSession = useCallback(async () => {
    resetActivity();
    await refreshSession();
  }, [resetActivity, refreshSession]);

  // Configurar timers
  useEffect(() => {
    if (!isAuthenticated) return;

    // Timer para mostrar aviso
    warningRef.current = setTimeout(() => {
      setShowWarning(true);
      setRemainingSeconds(warningMinutes * 60);
      
      // Countdown
      countdownRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, timeoutMs - warningMs);

    // Timer para logout
    timeoutRef.current = setTimeout(() => {
      signOut();
    }, timeoutMs);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [isAuthenticated, lastActivity, timeoutMs, warningMs, warningMinutes, signOut]);

  // Detectar atividade do usuário
  useEffect(() => {
    if (!isAuthenticated) return;

    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    
    const handleActivity = () => {
      if (!showWarning) {
        resetActivity();
      }
    };

    events.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [isAuthenticated, showWarning, resetActivity]);

  return {
    lastActivity,
    showWarning,
    remainingSeconds,
    extendSession,
    signOut,
  };
}
