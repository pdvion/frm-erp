"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Lock, AlertCircle, CheckCircle, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PasswordStrength } from "@/components/PasswordStrength";
import { validatePassword } from "@/lib/password";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Verificar se há um token de recuperação na URL
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get("access_token");
    
    if (!accessToken) {
      // Se não há token, redirecionar para login
      // router.push("/login");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    const validation = validatePassword(password);
    if (!validation.isValid) {
      setError(validation.errors[0] || "Senha não atende aos requisitos");
      return;
    }

    setIsLoading(true);

    const supabase = createClient();

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
      return;
    }

    setSuccess(true);
    setIsLoading(false);

    // Redirecionar para login após 3 segundos
    setTimeout(() => {
      router.push("/login");
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--frm-50)] to-[var(--frm-100)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-[var(--frm-primary)] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg viewBox="0 0 100 60" className="w-16 h-10">
              <text x="50" y="45" textAnchor="middle" fill="white" fontSize="32" fontWeight="bold" fontFamily="Arial, sans-serif">FRM</text>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[var(--frm-primary)]">FRM ERP</h1>
          <p className="text-theme-secondary mt-1">Redefinir senha</p>
        </div>

        {/* Form */}
        <div className="bg-theme-card rounded-2xl shadow-xl p-8">
          {success ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-theme mb-2">Senha alterada!</h2>
              <p className="text-theme-secondary mb-6">
                Sua senha foi redefinida com sucesso. Você será redirecionado para o login.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-[var(--frm-light)] hover:text-[var(--frm-primary)]"
              >
                <ArrowLeft className="w-4 h-4" />
                Ir para o login
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-theme mb-2">Nova senha</h2>
              <p className="text-theme-secondary mb-6">
                Digite sua nova senha abaixo.
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-theme-secondary mb-1">
                    Nova senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-theme-muted" />
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      placeholder="Mínimo 8 caracteres"
                      className="w-full pl-10 pr-12 py-2.5 border border-theme-input rounded-lg focus:ring-2 focus:ring-[var(--frm-light)] focus:border-[var(--frm-light)]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-secondary"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <PasswordStrength password={password} />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-theme-secondary mb-1">
                    Confirmar senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-theme-muted" />
                    <input
                      type={showPassword ? "text" : "password"}
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      placeholder="Repita a senha"
                      className="w-full pl-10 pr-4 py-2.5 border border-theme-input rounded-lg focus:ring-2 focus:ring-[var(--frm-light)] focus:border-[var(--frm-light)]"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  isLoading={isLoading}
                  className="w-full"
                >
                  {isLoading ? "Salvando..." : "Redefinir senha"}
                </Button>

                <div className="text-center">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 text-sm text-[var(--frm-light)] hover:text-[var(--frm-primary)]"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Voltar para o login
                  </Link>
                </div>
              </form>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-theme-muted mt-6">
          © 2026 FRM ERP - Grupo FRM
        </p>
      </div>
    </div>
  );
}
