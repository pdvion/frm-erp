"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useMFA } from "@/hooks/useMFA";
import { Shield, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { NativeSelect } from "@/components/ui/NativeSelect";

export default function MFAVerifyPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, signOut } = useAuth();
  const { listFactors, challengeAndVerify, isLoading, error, clearError } = useMFA();

  const [factors, setFactors] = useState<{ id: string; friendlyName: string }[]>([]);
  const [selectedFactor, setSelectedFactor] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [loadingFactors, setLoadingFactors] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }

    const loadFactors = async () => {
      const factorList = await listFactors();
      const verifiedFactors = factorList.filter((f) => f.status === "verified");
      setFactors(verifiedFactors);
      
      if (verifiedFactors.length > 0) {
        setSelectedFactor(verifiedFactors[0].id);
      }
      setLoadingFactors(false);
    };

    if (isAuthenticated) {
      loadFactors();
    }
  }, [isAuthenticated, authLoading, router, listFactors]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFactor) return;

    clearError();
    const success = await challengeAndVerify(selectedFactor, code);
    
    if (success) {
      router.push("/");
      router.refresh();
    }
  };

  const handleLogout = async () => {
    await signOut();
  };

  if (authLoading || loadingFactors) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--frm-50)] to-[var(--frm-100)]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--frm-primary)]" />
      </div>
    );
  }

  if (factors.length === 0) {
    // Usuário não tem MFA configurado, redirecionar
    router.push("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--frm-50)] to-[var(--frm-100)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[var(--frm-primary)] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--frm-primary)]">
            Verificação em Dois Fatores
          </h1>
          <p className="text-theme-secondary mt-1">
            Digite o código do seu autenticador
          </p>
        </div>

        <div className="bg-theme-card rounded-2xl shadow-xl p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleVerify}>
            {factors.length > 1 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-theme-secondary mb-1">
                  Selecione o autenticador
                </label>
                <NativeSelect
                  value={selectedFactor || ""}
                  onChange={(e) => setSelectedFactor(e.target.value)}
                  className="w-full px-3 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-[var(--frm-light)]"
                >
                  {factors.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.friendlyName}
                    </option>
                  ))}
                </NativeSelect>
              </div>
            )}

            <div className="mb-6">
              <Input
                label="Código de verificação"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="text-center text-3xl font-mono tracking-[0.5em] py-4"
                autoFocus
              />
            </div>

            <Button
              type="submit"
              disabled={code.length !== 6}
              isLoading={isLoading}
              className="w-full"
            >
              {isLoading ? "Verificando..." : "Verificar"}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-theme text-center">
            <Button
              onClick={handleLogout}
              className="text-sm text-theme-muted hover:text-red-600 transition-colors"
            >
              Sair e usar outra conta
            </Button>
          </div>
        </div>

        <p className="text-center text-sm text-theme-muted mt-6">
          © 2026 FRM ERP - Grupo FRM
        </p>
      </div>
    </div>
  );
}
