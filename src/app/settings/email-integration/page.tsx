"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Mail,
  Save,
  TestTube,
  Loader2,
  CheckCircle,
  XCircle,
  RefreshCw,
  Server,
  Lock,
  Folder,
  Clock,
  AlertTriangle,
} from "lucide-react";

interface FormData {
  host: string;
  port: number;
  user: string;
  password: string;
  tls: boolean;
  folder: string;
  autoFetch: boolean;
  fetchInterval: number;
}

export default function EmailIntegrationPage() {
  const [form, setForm] = useState<FormData>({
    host: "",
    port: 993,
    user: "",
    password: "",
    tls: true,
    folder: "INBOX",
    autoFetch: false,
    fetchInterval: 30,
  });
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const { data: config, isLoading } = trpc.emailIntegration.getConfig.useQuery();

  const saveMutation = trpc.emailIntegration.saveConfig.useMutation({
    onSuccess: () => {
      setTestResult({ success: true, message: "Configurações salvas com sucesso!" });
    },
    onError: (error) => {
      setTestResult({ success: false, message: error.message });
    },
  });

  const testMutation = trpc.emailIntegration.testConnection.useMutation({
    onSuccess: (result) => {
      setTestResult({
        success: result.success,
        message: result.success
          ? "Conexão bem-sucedida!"
          : result.error || "Falha na conexão",
      });
      setIsTesting(false);
    },
    onError: (error) => {
      setTestResult({ success: false, message: error.message });
      setIsTesting(false);
    },
  });

  useEffect(() => {
    if (config) {
      setForm((prev) => ({
        ...prev,
        host: config.host || "",
        port: config.port || 993,
        user: config.user || "",
        tls: config.tls ?? true,
        folder: config.folder || "INBOX",
        autoFetch: config.autoFetch ?? false,
        fetchInterval: config.fetchInterval || 30,
      }));
    }
  }, [config]);

  const handleTestConnection = () => {
    setIsTesting(true);
    setTestResult(null);
    testMutation.mutate({
      host: form.host,
      port: form.port,
      user: form.user,
      password: form.password,
      tls: form.tls,
      folder: form.folder,
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setTestResult(null);
    saveMutation.mutate(form);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Integração de E-mail"
        subtitle="Configure a importação automática de NFes via e-mail"
        icon={<Mail className="w-6 h-6" />}
        module="SETTINGS"
        backHref="/settings"
        backLabel="Voltar"
      />

      <form onSubmit={handleSave} className="space-y-6">
        {/* Configurações do Servidor */}
        <div className="bg-theme-card border border-theme rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Server className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-theme">Servidor de E-mail (IMAP)</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Servidor IMAP *"
              value={form.host}
              onChange={(e) => setForm({ ...form, host: e.target.value })}
              placeholder="imap.gmail.com"
              required
            />

            <Input
              label="Porta *"
              type="number"
              value={form.port}
              onChange={(e) => setForm({ ...form, port: parseInt(e.target.value) || 993 })}
              placeholder="993"
              required
            />

            <div className="md:col-span-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.tls}
                  onChange={(e) => setForm({ ...form, tls: e.target.checked })}
                  className="w-4 h-4 rounded border-theme-input text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-theme">Usar conexão segura (TLS/SSL)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Credenciais */}
        <div className="bg-theme-card border border-theme rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-theme">Credenciais de Acesso</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="E-mail / Usuário *"
              value={form.user}
              onChange={(e) => setForm({ ...form, user: e.target.value })}
              placeholder="nfe@empresa.com.br"
              required
            />

            <Input
              label="Senha *"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              required={!config}
              hint={config ? "Deixe em branco para manter a senha atual" : undefined}
            />
          </div>

          <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Gmail:</strong> Use uma &quot;Senha de App&quot; em vez da senha normal.
                Acesse Conta Google → Segurança → Senhas de App.
              </div>
            </div>
          </div>
        </div>

        {/* Configurações de Pasta */}
        <div className="bg-theme-card border border-theme rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Folder className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-theme">Pasta de Monitoramento</h3>
          </div>

          <div className="max-w-md">
            <Input
              label="Pasta IMAP"
              value={form.folder}
              onChange={(e) => setForm({ ...form, folder: e.target.value })}
              placeholder="INBOX"
              hint="Pasta onde os e-mails com NFes serão buscados (padrão: INBOX)"
            />
          </div>
        </div>

        {/* Automação */}
        <div className="bg-theme-card border border-theme rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-theme">Automação</h3>
          </div>

          <div className="space-y-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.autoFetch}
                onChange={(e) => setForm({ ...form, autoFetch: e.target.checked })}
                className="w-4 h-4 rounded border-theme-input text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-theme">
                Buscar NFes automaticamente
              </span>
            </label>

            {form.autoFetch && (
              <div className="w-32">
                <Input
                  label="Intervalo de busca (minutos)"
                  type="number"
                  value={form.fetchInterval}
                  onChange={(e) =>
                    setForm({ ...form, fetchInterval: parseInt(e.target.value) || 30 })
                  }
                  min={5}
                  max={1440}
                />
              </div>
            )}
          </div>
        </div>

        {/* Resultado do Teste */}
        {testResult && (
          <div
            className={`p-4 rounded-lg border ${
              testResult.success
                ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
            }`}
          >
            <div className="flex items-center gap-2">
              {testResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              <span
                className={
                  testResult.success
                    ? "text-green-800 dark:text-green-200"
                    : "text-red-800 dark:text-red-200"
                }
              >
                {testResult.message}
              </span>
            </div>
          </div>
        )}

        {/* Ações */}
        <div className="flex flex-wrap gap-4">
          <Button
            type="button"
            variant="secondary"
            onClick={handleTestConnection}
            disabled={!form.host || !form.user || !form.password}
            isLoading={isTesting}
            leftIcon={<TestTube className="w-4 h-4" />}
          >
            Testar Conexão
          </Button>

          <Button
            type="button"
            variant="secondary"
            disabled={!config}
            leftIcon={<RefreshCw className="w-4 h-4" />}
          >
            Buscar NFes Agora
          </Button>

          <Button
            type="submit"
            disabled={!form.host || !form.user}
            isLoading={saveMutation.isPending}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Salvar Configurações
          </Button>
        </div>
      </form>
    </div>
  );
}
