"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function SetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      // Verificar se há tokens no hash da URL (vindo do link de convite)
      const hash = window.location.hash;
      if (hash) {
        // O Supabase automaticamente processa o hash e cria a sessão
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Erro ao verificar sessão:", error);
          setMessage({
            type: "error",
            text: "Erro ao processar o link. Por favor, solicite um novo convite.",
          });
        } else if (session) {
          setUserEmail(session.user.email || null);
          // Limpar o hash da URL
          window.history.replaceState(null, "", window.location.pathname);
        }
      } else {
        // Verificar se já tem sessão ativa
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setUserEmail(session.user.email || null);
        }
      }
      
      setIsCheckingSession(false);
    };

    checkSession();

    // Listener para mudanças de auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_IN" && session) {
          setUserEmail(session.user.email ?? null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const validatePassword = () => {
    if (password.length < 8) {
      return "A senha deve ter pelo menos 8 caracteres";
    }
    if (password !== confirmPassword) {
      return "As senhas não coincidem";
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    const validationError = validatePassword();
    if (validationError) {
      setMessage({ type: "error", text: validationError });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        setMessage({ type: "error", text: error.message });
      } else {
        setMessage({
          type: "success",
          text: "Senha definida com sucesso! Redirecionando...",
        });
        
        // Redirecionar para o dashboard após 2 segundos
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      }
    } catch {
      setMessage({
        type: "error",
        text: "Erro ao definir senha. Tente novamente.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-theme-tertiary">
        <div className="flex items-center gap-3 text-theme-secondary">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Verificando sessão...</span>
        </div>
      </div>
    );
  }

  if (!userEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-theme-tertiary px-4">
        <div className="max-w-md w-full bg-theme-card rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-xl font-bold text-theme mb-2">
            Link inválido ou expirado
          </h1>
          <p className="text-theme-secondary mb-6">
            O link de convite pode ter expirado ou já foi utilizado. 
            Por favor, solicite um novo convite ao administrador.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Ir para Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-theme-tertiary px-4">
      <div className="max-w-md w-full">
        <div className="bg-theme-card rounded-xl shadow-lg p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-theme mb-2">
              Bem-vindo ao FRM ERP
            </h1>
            <p className="text-theme-secondary">
              Defina sua senha para acessar o sistema
            </p>
            <p className="text-sm text-blue-600 mt-2 font-medium">
              {userEmail}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-theme-secondary mb-1"
              >
                Nova Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-theme-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-indigo-500 pr-12"
                  placeholder="Mínimo 8 caracteres"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-secondary"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-theme-secondary mb-1"
              >
                Confirmar Senha
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-theme-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-indigo-500 pr-12"
                  placeholder="Repita a senha"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-secondary"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            <div className="bg-theme-tertiary rounded-lg p-4">
              <p className="text-sm font-medium text-theme-secondary mb-2">
                Requisitos da senha:
              </p>
              <ul className="space-y-1 text-sm">
                <li className={`flex items-center gap-2 ${password.length >= 8 ? "text-green-600" : "text-theme-muted"}`}>
                  <CheckCircle className={`w-4 h-4 ${password.length >= 8 ? "opacity-100" : "opacity-30"}`} />
                  Mínimo 8 caracteres
                </li>
                <li className={`flex items-center gap-2 ${password && password === confirmPassword ? "text-green-600" : "text-theme-muted"}`}>
                  <CheckCircle className={`w-4 h-4 ${password && password === confirmPassword ? "opacity-100" : "opacity-30"}`} />
                  Senhas coincidem
                </li>
              </ul>
            </div>

            {/* Message */}
            {message && (
              <div
                className={`p-4 rounded-lg flex items-center gap-3 ${
                  message.type === "success"
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {message.type === "success" ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
                <span className="text-sm">{message.text}</span>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={password.length < 8 || password !== confirmPassword}
              isLoading={isLoading}
              className="w-full"
              size="lg"
            >
              Definir Senha e Entrar
            </Button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-theme-muted mt-6">
          Já tem uma conta?{" "}
          <Link href="/login" className="text-blue-600 hover:text-indigo-800 font-medium">
            Fazer login
          </Link>
        </p>
      </div>
    </div>
  );
}
