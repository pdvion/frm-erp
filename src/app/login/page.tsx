"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { LogIn, Mail, Lock, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const returnUrl = searchParams.get("returnUrl") || "/dashboard";

  // Verificar erros no hash da URL (vindo de links de convite/reset expirados)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.substring(1));
      const errorCode = params.get("error_code");
      const errorDescription = params.get("error_description");
      
      if (errorCode === "otp_expired") {
        setError("O link expirou ou já foi utilizado. Por favor, solicite um novo.");
      } else if (errorCode === "access_denied") {
        setError(errorDescription?.replace(/\+/g, " ") || "Acesso negado. Tente novamente.");
      } else if (errorCode) {
        setError(errorDescription?.replace(/\+/g, " ") || "Erro de autenticação.");
      }
      
      // Limpar o hash da URL
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, []);

  // Redirecionar se já autenticado
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push(returnUrl);
    }
  }, [isAuthenticated, authLoading, router, returnUrl]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const { error } = await signIn(email, password);

      if (error) {
        setError(error.message === "Invalid login credentials" 
          ? "E-mail ou senha inválidos" 
          : error.message);
        setIsLoading(false);
        return;
      }

      // Aguardar um momento para a sessão ser estabelecida
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Forçar navegação com window.location para garantir redirecionamento
      window.location.href = returnUrl;
    } catch {
      setError("Erro ao fazer login. Tente novamente.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--frm-50)] to-[var(--frm-100)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-[var(--frm-primary)] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg viewBox="0 0 100 60" className="w-16 h-10">
              {/* FRM Logo simplificado */}
              <text x="50" y="45" textAnchor="middle" fill="white" fontSize="32" fontWeight="bold" fontFamily="Arial, sans-serif">FRM</text>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[var(--frm-primary)]">FRM ERP</h1>
          <p className="text-theme-secondary mt-1">Sistema de Gestão Industrial</p>
        </div>

        {/* Login Form */}
        <div className="bg-theme-card rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-semibold text-theme mb-6">Entrar</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-800">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-theme-secondary mb-1">
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-theme-muted" />
                <Input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="seu@email.com"
                  className="w-full pl-10 pr-4 py-2.5 border border-theme-input rounded-lg focus:ring-2 focus:ring-[var(--frm-light)] focus:border-[var(--frm-light)]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-theme-secondary mb-1">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-theme-muted" />
                <Input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 border border-theme-input rounded-lg focus:ring-2 focus:ring-[var(--frm-light)] focus:border-[var(--frm-light)]"
                />
              </div>
            </div>

            <Button
              type="submit"
              isLoading={isLoading}
              leftIcon={<LogIn className="w-5 h-5" />}
              className="w-full"
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>

            <div className="text-center">
              <a 
                href="/forgot-password" 
                className="text-sm text-[var(--frm-light)] hover:text-[var(--frm-primary)] hover:underline"
              >
                Esqueci minha senha
              </a>
            </div>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-theme-muted mt-6">
          © 2026 FRM ERP - Grupo FRM
        </p>
      </div>
    </div>
  );
}

function LoginFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--frm-50)] to-[var(--frm-100)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-[var(--frm-primary)] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg viewBox="0 0 100 60" className="w-16 h-10">
              <text x="50" y="45" textAnchor="middle" fill="white" fontSize="32" fontWeight="bold" fontFamily="Arial, sans-serif">FRM</text>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[var(--frm-primary)]">FRM ERP</h1>
          <p className="text-theme-secondary mt-1">Sistema de Gestão Industrial</p>
        </div>
        <div className="bg-theme-card rounded-2xl shadow-xl p-8 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--frm-primary)]" />
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
