"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useUser } from "@/hooks/useUser";
import { useMFA } from "@/hooks/useMFA";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/PageHeader";
import {
  User,
  Mail,
  Building2,
  Shield,
  Key,
  Smartphone,
  Monitor,
  ChevronRight,
  Loader2,
  CheckCircle,
  AlertCircle,
  Lock,
  Eye,
  EyeOff,
  LogOut,
} from "lucide-react";
import { PasswordStrength } from "@/components/PasswordStrength";
import { validatePassword } from "@/lib/password";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const { company, companies } = useUser();
  const { listFactors, unenroll, isLoading: mfaLoading } = useMFA();
  
  const [mfaFactors, setMfaFactors] = useState<{ id: string; friendlyName: string; status: string }[]>([]);
  const [loadingMFA, setLoadingMFA] = useState(true);
  
  // Password change
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const supabase = createClient();

  const loadMFAFactors = useCallback(async () => {
    setLoadingMFA(true);
    const factors = await listFactors();
    setMfaFactors(factors.filter((f) => f.status === "verified"));
    setLoadingMFA(false);
  }, [listFactors]);

  useEffect(() => {
    loadMFAFactors();
  }, [loadMFAFactors]);

  const handleRemoveMFA = async (factorId: string) => {
    const success = await unenroll(factorId);
    if (success) {
      await loadMFAFactors();
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "As senhas não coincidem" });
      return;
    }

    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      setPasswordMessage({ type: "error", text: validation.errors[0] });
      return;
    }

    setPasswordLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setPasswordMessage({ type: "error", text: error.message });
    } else {
      setPasswordMessage({ type: "success", text: "Senha alterada com sucesso!" });
      setShowPasswordForm(false);
      setNewPassword("");
      setConfirmPassword("");
    }

    setPasswordLoading(false);
  };

  return (
    <ProtectedRoute>
      <div className="max-w-4xl mx-auto space-y-6">
        <PageHeader
          title="Meu Perfil"
          subtitle="Gerencie suas informações e segurança"
          icon={<User className="w-6 h-6" />}
          module="settings"
          actions={
            <Button
              onClick={signOut}
              className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg font-medium transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </Button>
          }
        />

        <div className="space-y-6">
          {/* User Info Card */}
          <div className="bg-theme-card rounded-xl border border-theme p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-[var(--frm-primary)] rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-theme">
                  {user?.user_metadata?.name || user?.email?.split("@")[0] || "Usuário"}
                </h2>
                <div className="flex items-center gap-2 text-theme-muted mt-1">
                  <Mail className="w-4 h-4" />
                  <span>{user?.email}</span>
                </div>
                {company && (
                  <div className="flex items-center gap-2 text-theme-muted mt-1">
                    <Building2 className="w-4 h-4" />
                    <span>{company.name}</span>
                    {companies.length > 1 && (
                      <span className="text-xs bg-theme-tertiary px-2 py-0.5 rounded-full">
                        +{companies.length - 1} empresas
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Security Section */}
          <div className="bg-theme-card rounded-xl border border-theme overflow-hidden">
            <div className="px-6 py-4 border-b border-theme">
              <h3 className="text-lg font-semibold text-theme flex items-center gap-2">
                <Shield className="w-5 h-5 text-[var(--frm-primary)]" />
                Segurança
              </h3>
            </div>

            <div className="divide-y divide-theme-table">
              {/* Change Password */}
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-theme-tertiary rounded-lg">
                      <Key className="w-5 h-5 text-theme-secondary" />
                    </div>
                    <div>
                      <p className="font-medium text-theme">Senha</p>
                      <p className="text-sm text-theme-muted">Altere sua senha de acesso</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setShowPasswordForm(!showPasswordForm)}
                    className="text-sm text-[var(--frm-primary)] hover:underline font-medium"
                  >
                    {showPasswordForm ? "Cancelar" : "Alterar"}
                  </Button>
                </div>

                {showPasswordForm && (
                  <form onSubmit={handleChangePassword} className="mt-4 space-y-4 max-w-md">
                    {passwordMessage && (
                      <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${
                        passwordMessage.type === "success"
                          ? "bg-green-50 text-green-800 border border-green-200"
                          : "bg-red-50 text-red-800 border border-red-200"
                      }`}>
                        {passwordMessage.type === "success" ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <AlertCircle className="w-4 h-4" />
                        )}
                        {passwordMessage.text}
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-theme-secondary mb-1">
                        Nova senha
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
                        <Input
                          type={showPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          className="w-full pl-10 pr-10 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-[var(--frm-light)]"
                        />
                        <Button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-muted"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                      </div>
                      <PasswordStrength password={newPassword} />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-theme-secondary mb-1">
                        Confirmar nova senha
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
                        <Input
                          type={showPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          className="w-full pl-10 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-[var(--frm-light)]"
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={passwordLoading}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-[var(--frm-primary)] text-white rounded-lg hover:bg-[var(--frm-dark)] disabled:opacity-50 font-medium"
                    >
                      {passwordLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : null}
                      Salvar nova senha
                    </Button>
                  </form>
                )}
              </div>

              {/* MFA */}
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-theme-tertiary rounded-lg">
                      <Smartphone className="w-5 h-5 text-theme-secondary" />
                    </div>
                    <div>
                      <p className="font-medium text-theme">Autenticação em dois fatores</p>
                      <p className="text-sm text-theme-muted">
                        {loadingMFA ? (
                          "Carregando..."
                        ) : mfaFactors.length > 0 ? (
                          <span className="text-green-600">✓ Ativado</span>
                        ) : (
                          "Adicione uma camada extra de segurança"
                        )}
                      </p>
                    </div>
                  </div>
                  
                  {mfaFactors.length === 0 ? (
                    <Link
                      href="/mfa/setup"
                      className="text-sm text-[var(--frm-primary)] hover:underline font-medium"
                    >
                      Configurar
                    </Link>
                  ) : (
                    <Button
                      onClick={() => handleRemoveMFA(mfaFactors[0].id)}
                      disabled={mfaLoading}
                      className="text-sm text-red-600 hover:underline font-medium disabled:opacity-50"
                    >
                      {mfaLoading ? "Removendo..." : "Remover"}
                    </Button>
                  )}
                </div>

                {mfaFactors.length > 0 && (
                  <div className="mt-3 pl-12">
                    {mfaFactors.map((factor) => (
                      <div key={factor.id} className="flex items-center gap-2 text-sm text-theme-secondary">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        {factor.friendlyName}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sessions */}
              <Link href="/profile/sessions" className="block p-6 hover:bg-theme-hover transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-theme-tertiary rounded-lg">
                      <Monitor className="w-5 h-5 text-theme-secondary" />
                    </div>
                    <div>
                      <p className="font-medium text-theme">Sessões ativas</p>
                      <p className="text-sm text-theme-muted">Gerencie dispositivos conectados</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-theme-muted" />
                </div>
              </Link>
            </div>
          </div>

          {/* Account Info */}
          <div className="bg-theme-card rounded-xl border border-theme p-6">
            <h3 className="text-lg font-semibold text-theme mb-4">Informações da Conta</h3>
            
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-theme-muted">ID do usuário</dt>
                <dd className="text-theme font-mono text-xs">{user?.id}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-theme-muted">Criado em</dt>
                <dd className="text-theme">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString("pt-BR") : "-"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-theme-muted">Último login</dt>
                <dd className="text-theme">
                  {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString("pt-BR") : "-"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-theme-muted">Email verificado</dt>
                <dd className="text-theme">
                  {user?.email_confirmed_at ? (
                    <span className="text-green-600">✓ Sim</span>
                  ) : (
                    <span className="text-yellow-600">Pendente</span>
                  )}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
