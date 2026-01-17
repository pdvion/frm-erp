"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

interface MFAFactor {
  id: string;
  type: "totp" | "phone";
  friendlyName: string;
  status: "verified" | "unverified";
}

interface EnrollResult {
  id: string;
  type: "totp";
  totp: {
    qr_code: string;
    secret: string;
    uri: string;
  };
}

export function useMFA() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  // Listar fatores MFA do usuário
  const listFactors = useCallback(async (): Promise<MFAFactor[]> => {
    setError(null);
    const { data, error } = await supabase.auth.mfa.listFactors();
    
    if (error) {
      setError(error.message);
      return [];
    }

    return [...(data.totp || []), ...(data.phone || [])].map((f) => ({
      id: f.id,
      type: f.factor_type as "totp" | "phone",
      friendlyName: f.friendly_name || "Autenticador",
      status: f.status as "verified" | "unverified",
    }));
  }, [supabase.auth.mfa]);

  // Iniciar enrollment de TOTP
  const enrollTOTP = useCallback(async (friendlyName: string = "Meu Autenticador"): Promise<EnrollResult | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName,
      });

      if (error) {
        setError(error.message);
        return null;
      }

      return {
        id: data.id,
        type: "totp",
        totp: {
          qr_code: data.totp.qr_code,
          secret: data.totp.secret,
          uri: data.totp.uri,
        },
      };
    } finally {
      setIsLoading(false);
    }
  }, [supabase.auth.mfa]);

  // Verificar código TOTP (após enrollment)
  const verifyTOTP = useCallback(async (factorId: string, code: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      // Criar challenge
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });

      if (challengeError) {
        setError(challengeError.message);
        return false;
      }

      // Verificar código
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code,
      });

      if (verifyError) {
        setError(verifyError.message === "Invalid TOTP code entered"
          ? "Código inválido. Tente novamente."
          : verifyError.message);
        return false;
      }

      return true;
    } finally {
      setIsLoading(false);
    }
  }, [supabase.auth.mfa]);

  // Challenge e verify para login (após autenticação inicial)
  const challengeAndVerify = useCallback(async (factorId: string, code: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });

      if (challengeError) {
        setError(challengeError.message);
        return false;
      }

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code,
      });

      if (verifyError) {
        setError(verifyError.message === "Invalid TOTP code entered"
          ? "Código inválido. Tente novamente."
          : verifyError.message);
        return false;
      }

      return true;
    } finally {
      setIsLoading(false);
    }
  }, [supabase.auth.mfa]);

  // Remover fator MFA
  const unenroll = useCallback(async (factorId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.mfa.unenroll({
        factorId,
      });

      if (error) {
        setError(error.message);
        return false;
      }

      return true;
    } finally {
      setIsLoading(false);
    }
  }, [supabase.auth.mfa]);

  // Verificar se usuário tem MFA ativo
  const getAAL = useCallback(async (): Promise<{ currentLevel: string; nextLevel: string | null }> => {
    const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    
    if (error) {
      return { currentLevel: "aal1", nextLevel: null };
    }

    return {
      currentLevel: data.currentLevel || "aal1",
      nextLevel: data.nextLevel || null,
    };
  }, [supabase.auth.mfa]);

  return {
    isLoading,
    error,
    listFactors,
    enrollTOTP,
    verifyTOTP,
    challengeAndVerify,
    unenroll,
    getAAL,
    clearError: () => setError(null),
  };
}
