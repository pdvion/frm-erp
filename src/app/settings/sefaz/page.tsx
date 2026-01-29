"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/PageHeader";
import {
  Shield,
  Upload,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Key,
  Building2,
  Globe,
  RefreshCw,
  Search,
  FileText,
  Loader2,
  X,
  Clock,
  Bell,
  Send,
  Save,
} from "lucide-react";

interface Notification {
  id: number;
  type: "success" | "error" | "info";
  message: string;
}

export default function SefazConfigPage() {
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [environment, setEnvironment] = useState<"homologacao" | "producao">("homologacao");
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [certificatePassword, setCertificatePassword] = useState("");
  const [chaveConsulta, setChaveConsulta] = useState("");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [consultaResult, setConsultaResult] = useState<{ total: number; nfes: string[] } | null>(null);
  // Usar consultaResult para exibir resultado da consulta
  void consultaResult;

  // Sync config states
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [autoManifest, setAutoManifest] = useState(false);
  const [manifestType, setManifestType] = useState<"CIENCIA" | "CONFIRMACAO">("CIENCIA");
  const [notifyOnNewNfe, setNotifyOnNewNfe] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState("");

  const addNotification = (type: "success" | "error" | "info", message: string) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000);
  };

  const removeNotification = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const { data: status, isLoading, refetch } = trpc.sefaz.status.useQuery();
  const { data: currentConfig } = trpc.sefaz.getConfig.useQuery();
  const { data: syncConfig } = trpc.sefaz.getSyncConfig.useQuery();
  const { data: companies } = trpc.companies.list.useQuery();

  // Encontrar empresa selecionada para exibir dados
  const selectedCompany = companies?.find(c => c.id === selectedCompanyId);

  useEffect(() => {
    if (currentConfig) {
      setEnvironment(currentConfig.environment as "homologacao" | "producao" || "homologacao");
      // Se já existe config, tentar encontrar a empresa pelo CNPJ
      if (currentConfig.cnpj && companies) {
        const company = companies.find(c => c.cnpj?.replace(/\D/g, "") === currentConfig.cnpj);
        if (company) {
          setSelectedCompanyId(company.id);
        }
      }
    }
  }, [currentConfig, companies]);

  useEffect(() => {
    if (syncConfig) {
      setSyncEnabled(syncConfig.isEnabled);
      setAutoManifest(syncConfig.autoManifest);
      setManifestType(syncConfig.manifestType as "CIENCIA" | "CONFIRMACAO");
      setNotifyOnNewNfe(syncConfig.notifyOnNewNfe);
      setNotifyEmail(syncConfig.notifyEmail || "");
    }
  }, [syncConfig]);

  const consultarMutation = trpc.sefaz.consultarNFeDestinadas.useMutation({
    onSuccess: (data) => {
      addNotification("success", `Consulta realizada! ${data.totalRegistros} NFe encontradas.`);
      if (data.totalRegistros > 0) {
        setConsultaResult({ total: data.totalRegistros, nfes: [] });
      }
    },
    onError: (error) => {
      addNotification("error", error.message);
    },
  });

  const consultarChaveMutation = trpc.sefaz.consultarPorChave.useMutation({
    onSuccess: (data) => {
      addNotification("success", `NFe encontrada: ${data.message}`);
    },
    onError: (error) => {
      addNotification("error", error.message);
    },
  });

  const saveConfigMutation = trpc.sefaz.saveConfig.useMutation({
    onSuccess: () => {
      addNotification("success", "Configuração salva com sucesso!");
      refetch();
    },
    onError: (error) => {
      addNotification("error", `Erro ao salvar: ${error.message}`);
    },
  });

  const saveSyncConfigMutation = trpc.sefaz.saveSyncConfig.useMutation({
    onSuccess: () => {
      addNotification("success", "Configuração de sincronização salva!");
    },
    onError: (error) => {
      addNotification("error", `Erro ao salvar: ${error.message}`);
    },
  });

  const handleSaveSyncConfig = () => {
    saveSyncConfigMutation.mutate({
      isEnabled: syncEnabled,
      autoManifest,
      manifestType,
      notifyOnNewNfe,
      notifyEmail: notifyEmail || undefined,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith(".pfx") && !file.name.endsWith(".p12")) {
        addNotification("error", "Selecione um arquivo de certificado .pfx ou .p12");
        return;
      }
      setCertificateFile(file);
      addNotification("info", `Certificado "${file.name}" selecionado`);
    }
  };

  const handleSave = async () => {
    if (!selectedCompanyId || !selectedCompany) {
      addNotification("error", "Selecione uma empresa");
      return;
    }

    if (!selectedCompany.cnpj) {
      addNotification("error", "A empresa selecionada não possui CNPJ cadastrado");
      return;
    }

    if (!selectedCompany.state) {
      addNotification("error", "A empresa selecionada não possui UF cadastrada");
      return;
    }

    // Converter certificado para base64 se fornecido
    let certificateBase64: string | undefined;
    if (certificateFile) {
      const reader = new FileReader();
      certificateBase64 = await new Promise((resolve) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]); // Remove data:... prefix
        };
        reader.readAsDataURL(certificateFile);
      });
    }

    saveConfigMutation.mutate({
      cnpj: selectedCompany.cnpj.replace(/\D/g, ""),
      uf: selectedCompany.state,
      environment,
      certificateBase64,
      certificatePassword: certificatePassword || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuração SEFAZ"
        subtitle="Certificado digital e integração"
        icon={<Shield className="w-6 h-6" />}
        backHref="/settings"
        module="settings"
      />

      {/* Notifications */}
      <div className="fixed top-20 right-4 z-50 space-y-2 max-w-md">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`flex items-center gap-3 p-4 rounded-lg shadow-lg border ${
              notification.type === "success"
                ? "bg-green-50 border-green-200 text-green-800"
                : notification.type === "error"
                  ? "bg-red-50 border-red-200 text-red-800"
                  : "bg-blue-50 border-blue-200 text-blue-800"
            }`}
          >
            {notification.type === "success" && <CheckCircle className="w-5 h-5 flex-shrink-0" />}
            {notification.type === "error" && <XCircle className="w-5 h-5 flex-shrink-0" />}
            {notification.type === "info" && <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
            <span className="text-sm flex-1">{notification.message}</span>
            <button
              onClick={() => removeNotification(notification.id)}
              className="text-theme-muted hover:text-theme-secondary"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Card */}
        <div className="bg-theme-card rounded-lg border border-theme p-6 mb-6">
          <h2 className="text-lg font-medium text-theme mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-theme-muted" />
            Status da Integração
          </h2>

          {isLoading ? (
            <div className="flex items-center gap-2 text-theme-muted">
              <Loader2 className="w-4 h-4 animate-spin" />
              Verificando...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                {status?.configured ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
                <div>
                  <div className="text-sm font-medium text-theme">
                    {status?.configured ? "Configurado" : "Não Configurado"}
                  </div>
                  <div className="text-xs text-theme-muted">Status</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {status?.hasCertificate ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                )}
                <div>
                  <div className="text-sm font-medium text-theme">
                    {status?.hasCertificate ? "Certificado OK" : "Sem Certificado"}
                  </div>
                  <div className="text-xs text-theme-muted">Certificado Digital</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-blue-500" />
                <div>
                  <div className="text-sm font-medium text-theme">
                    {status?.environment === "producao" ? "Produção" : "Homologação"}
                  </div>
                  <div className="text-xs text-theme-muted">Ambiente</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Configuration Form */}
        <div className="bg-theme-card rounded-lg border border-theme p-6 mb-6">
          <h2 className="text-lg font-medium text-theme mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-theme-muted" />
            Empresa para Integração SEFAZ
          </h2>

          <div className="mb-6">
            <label className="block text-sm font-medium text-theme-secondary mb-1">
              Selecione a Empresa *
            </label>
            <select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className="w-full px-3 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-indigo-500 bg-theme-card text-theme"
            >
              <option value="">Selecione uma empresa...</option>
              {companies?.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.tradeName || company.name} {company.cnpj && `- ${company.cnpj}`}
                </option>
              ))}
            </select>
            <p className="text-xs text-theme-muted mt-1">
              Apenas empresas com CNPJ e UF cadastrados podem ser integradas ao SEFAZ.
            </p>
          </div>

          {selectedCompany && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-theme-tertiary rounded-lg">
              <div>
                <span className="text-xs text-theme-muted">CNPJ</span>
                <p className="text-sm font-medium text-theme">{selectedCompany.cnpj || "Não cadastrado"}</p>
              </div>
              <div>
                <span className="text-xs text-theme-muted">UF</span>
                <p className="text-sm font-medium text-theme">{selectedCompany.state || "Não cadastrada"}</p>
              </div>
              <div>
                <span className="text-xs text-theme-muted">IE</span>
                <p className="text-sm font-medium text-theme">{selectedCompany.ie || "Não cadastrada"}</p>
              </div>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-theme-secondary mb-1">
              Ambiente *
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="environment"
                  value="homologacao"
                  checked={environment === "homologacao"}
                  onChange={() => setEnvironment("homologacao")}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-theme-secondary">Homologação (Testes)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="environment"
                  value="producao"
                  checked={environment === "producao"}
                  onChange={() => setEnvironment("producao")}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-theme-secondary">Produção</span>
              </label>
            </div>
          </div>

          <h3 className="text-md font-medium text-theme mb-3 flex items-center gap-2">
            <Key className="w-4 h-4 text-theme-muted" />
            Certificado Digital A1
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-1">
                Arquivo .pfx / .p12 *
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept=".pfx,.p12"
                  onChange={handleFileChange}
                  className="hidden"
                  id="certificate-file"
                />
                <label
                  htmlFor="certificate-file"
                  className="flex items-center gap-2 px-4 py-2 border border-theme-input rounded-lg cursor-pointer hover:bg-theme-hover"
                >
                  <Upload className="w-4 h-4 text-theme-muted" />
                  <span className="text-sm text-theme-secondary">
                    {certificateFile ? certificateFile.name : "Selecionar arquivo"}
                  </span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-1">
                Senha do Certificado *
              </label>
              <input
                type="password"
                value={certificatePassword}
                onChange={(e) => setCertificatePassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
                className="w-full px-3 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-indigo-500 bg-theme-card text-theme"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              isLoading={saveConfigMutation.isPending}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Salvar Configuração
            </Button>
          </div>
        </div>

        {/* Sincronização Automática */}
        <div className="bg-theme-card rounded-lg border border-theme p-6 mb-6">
          <h2 className="text-lg font-medium text-theme mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-theme-muted" />
            Sincronização Automática
          </h2>

          <p className="text-sm text-theme-secondary mb-4">
            Configure a sincronização automática de NFe destinadas. O sistema consultará a SEFAZ periodicamente.
          </p>

          <div className="space-y-4">
            {/* Habilitar sincronização */}
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={syncEnabled}
                onChange={(e) => setSyncEnabled(e.target.checked)}
                className="w-5 h-5 rounded border-theme text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <span className="text-sm font-medium text-theme">Habilitar sincronização automática</span>
                <p className="text-xs text-theme-muted">Executa a cada 4 horas via Vercel Cron</p>
              </div>
            </label>

            {syncEnabled && (
              <>
                {/* Manifestação automática */}
                <div className="border-t pt-4">
                  <label className="flex items-center gap-3 cursor-pointer mb-3">
                    <input
                      type="checkbox"
                      checked={autoManifest}
                      onChange={(e) => setAutoManifest(e.target.checked)}
                      className="w-5 h-5 rounded border-theme text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-theme flex items-center gap-2">
                        <Send className="w-4 h-4" />
                        Manifestação automática
                      </span>
                      <p className="text-xs text-theme-muted">Registrar manifestação automaticamente para novas NFe</p>
                    </div>
                  </label>

                  {autoManifest && (
                    <div className="ml-8 mb-4">
                      <label className="block text-sm font-medium text-theme-secondary mb-2">
                        Tipo de manifestação
                      </label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="manifestType"
                            value="CIENCIA"
                            checked={manifestType === "CIENCIA"}
                            onChange={() => setManifestType("CIENCIA")}
                            className="text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-sm text-theme-secondary">Ciência da Operação</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="manifestType"
                            value="CONFIRMACAO"
                            checked={manifestType === "CONFIRMACAO"}
                            onChange={() => setManifestType("CONFIRMACAO")}
                            className="text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-sm text-theme-secondary">Confirmação da Operação</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                {/* Notificações */}
                <div className="border-t pt-4">
                  <label className="flex items-center gap-3 cursor-pointer mb-3">
                    <input
                      type="checkbox"
                      checked={notifyOnNewNfe}
                      onChange={(e) => setNotifyOnNewNfe(e.target.checked)}
                      className="w-5 h-5 rounded border-theme text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <span className="text-sm font-medium text-theme flex items-center gap-2">
                        <Bell className="w-4 h-4" />
                        Notificar novas NFe
                      </span>
                      <p className="text-xs text-theme-muted">Receber notificação quando novas NFe forem encontradas</p>
                    </div>
                  </label>

                  {notifyOnNewNfe && (
                    <div className="ml-8">
                      <label className="block text-sm font-medium text-theme-secondary mb-1">
                        E-mail para notificações (opcional)
                      </label>
                      <input
                        type="email"
                        value={notifyEmail}
                        onChange={(e) => setNotifyEmail(e.target.value)}
                        placeholder="email@empresa.com.br"
                        className="w-full max-w-md px-3 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end mt-6">
            <Button
              onClick={handleSaveSyncConfig}
              isLoading={saveSyncConfigMutation.isPending}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Salvar Configuração
            </Button>
          </div>

          {syncConfig?.lastSyncAt && (
            <div className="mt-4 p-3 bg-theme-tertiary border border-theme rounded-lg text-sm text-theme-secondary">
              <strong>Última sincronização:</strong>{" "}
              {new Date(syncConfig.lastSyncAt).toLocaleString("pt-BR")}
            </div>
          )}
        </div>

        {/* Consulta NFe */}
        <div className="bg-theme-card rounded-lg border border-theme p-6">
          <h2 className="text-lg font-medium text-theme mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-theme-muted" />
            Consultar NFe
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Consulta por período */}
            <div className="border border-theme rounded-lg p-4">
              <h3 className="text-sm font-medium text-theme mb-3">
                NFe Destinadas (Últimas)
              </h3>
              <p className="text-xs text-theme-muted mb-4">
                Busca todas as NFe destinadas ao CNPJ da empresa nos últimos dias.
              </p>
              <Button
                onClick={() => consultarMutation.mutate({})}
                disabled={!status?.configured}
                isLoading={consultarMutation.isPending}
                leftIcon={<RefreshCw className="w-4 h-4" />}
                className="w-full"
              >
                Buscar NFe
              </Button>
            </div>

            {/* Consulta por chave */}
            <div className="border border-theme rounded-lg p-4">
              <h3 className="text-sm font-medium text-theme mb-3">
                Consultar por Chave
              </h3>
              <input
                type="text"
                value={chaveConsulta}
                onChange={(e) => setChaveConsulta(e.target.value.replace(/\D/g, ""))}
                placeholder="Chave de acesso (44 dígitos)"
                maxLength={44}
                className="w-full px-3 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-indigo-500 mb-3"
              />
              <Button
                onClick={() => consultarChaveMutation.mutate({ chaveAcesso: chaveConsulta })}
                disabled={chaveConsulta.length !== 44}
                isLoading={consultarChaveMutation.isPending}
                leftIcon={<Search className="w-4 h-4" />}
                className="w-full"
              >
                Consultar
              </Button>
            </div>
          </div>

          {!status?.configured && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Configure o certificado digital para habilitar as consultas.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
