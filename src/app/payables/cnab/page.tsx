"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@/lib/formatters";

import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  Building2,
  Loader2,
  Upload,
  Download,
  CheckCircle,
  AlertTriangle,
  Settings,
  CreditCard,
} from "lucide-react";

export default function CnabPage() {
  const [selectedBankAccountId, setSelectedBankAccountId] = useState<string | null>(null);
  const [showConfigForm, setShowConfigForm] = useState(false);
  const [retornoResult, setRetornoResult] = useState<{
    success: boolean;
    banco?: string;
    totalPagos?: number;
    baixados?: number;
    valorTotal?: number;
    erros?: string[];
  } | null>(null);
  const [remessaResult, setRemessaResult] = useState<{
    success: boolean;
    filename?: string;
    content?: string;
    totalRegistros?: number;
    valorTotal?: number;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [configForm, setConfigForm] = useState({
    bankCode: "001" as "001" | "033" | "104" | "237" | "341" | "756",
    layout: "240" as "240" | "400",
    agencia: "",
    agenciaDigito: "",
    conta: "",
    contaDigito: "",
    convenio: "",
    carteira: "",
    cedente: "",
    cedenteDocumento: "",
  });

  const { data: banks } = trpc.cnab.listBanks.useQuery();
  const { data: bankAccounts, isLoading: loadingAccounts } = trpc.bankAccounts.list.useQuery();
  const { data: cnabConfig, refetch: refetchConfig } = trpc.cnab.getConfig.useQuery(
    { bankAccountId: selectedBankAccountId || "" },
    { enabled: !!selectedBankAccountId }
  );
  const { data: receivables } = trpc.receivables.list.useQuery(
    { status: "PENDING" as const, limit: 100 },
    { enabled: !!selectedBankAccountId }
  );

  const saveConfigMutation = trpc.cnab.saveConfig.useMutation({
    onSuccess: () => {
      setShowConfigForm(false);
      refetchConfig();
    },
  });

  const generateRemessaMutation = trpc.cnab.generateRemessa.useMutation({
    onSuccess: (data) => {
      setRemessaResult(data);
    },
  });

  const processRetornoMutation = trpc.cnab.processRetorno.useMutation({
    onSuccess: (data) => {
      setRetornoResult(data);
    },
  });

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBankAccountId) return;
    saveConfigMutation.mutate({
      bankAccountId: selectedBankAccountId,
      config: configForm,
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedBankAccountId) return;

    const content = await file.text();
    processRetornoMutation.mutate({
      bankAccountId: selectedBankAccountId,
      content,
    });
  };

  const handleGenerateRemessa = () => {
    if (!selectedBankAccountId || !receivables?.receivables?.length) return;
    
    const pendingIds = receivables?.receivables
      .filter((r: { status: string }) => r.status === "PENDING")
      .map((r: { id: string }) => r.id);

    if (pendingIds.length === 0) {
      toast.warning("Nenhum título pendente para gerar remessa");
      return;
    }

    generateRemessaMutation.mutate({
      bankAccountId: selectedBankAccountId,
      receivableIds: pendingIds,
    });
  };

  const handleDownloadRemessa = () => {
    if (!remessaResult?.content || !remessaResult?.filename) return;
    
    const blob = new Blob([remessaResult.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = remessaResult.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // selectedAccount disponível para uso futuro
  // const selectedAccount = bankAccounts?.find((a: { id: string }) => a.id === selectedBankAccountId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Integração Bancária - CNAB"
        subtitle="Remessa e retorno de arquivos bancários"
        icon={<Building2 className="w-6 h-6" />}
        backHref="/payables"
        module="finance"
      />

      <div>
        {/* Seleção de Conta Bancária */}
        <div className="bg-theme-card rounded-lg border border-theme p-6 mb-6">
          <h2 className="text-lg font-medium text-theme mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-theme-muted" />
            Selecione a Conta Bancária
          </h2>

          {loadingAccounts ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-theme-muted" />
            </div>
          ) : !bankAccounts?.length ? (
            <div className="text-center py-4">
              <Building2 className="w-12 h-12 text-theme-muted mx-auto mb-2" />
              <p className="text-theme-muted">Nenhuma conta bancária cadastrada</p>
              <Link
                href="/settings/bank-accounts"
                className="inline-flex items-center gap-2 mt-2 text-blue-600 hover:text-blue-800"
              >
                <Settings className="w-4 h-4" />
                Cadastrar Conta
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {bankAccounts.map((account) => (
                <Button
                  key={account.id}
                  variant={selectedBankAccountId === account.id ? "primary" : "outline"}
                  onClick={() => {
                    setSelectedBankAccountId(account.id);
                    setRetornoResult(null);
                    setRemessaResult(null);
                  }}
                  className="p-4 h-auto flex-col items-start text-left"
                >
                  <div className="font-medium">{account.name}</div>
                  <div className="text-sm opacity-80">{account.bankName}</div>
                  <div className="text-xs opacity-60 mt-1">
                    Ag: {account.agency} | Conta: {account.accountNumber}
                  </div>
                </Button>
              ))}
            </div>
          )}
        </div>

        {selectedBankAccountId && (
          <>
            {/* Configuração CNAB */}
            <div className="bg-theme-card rounded-lg border border-theme p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-theme flex items-center gap-2">
                  <Settings className="w-5 h-5 text-theme-muted" />
                  Configuração CNAB
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (cnabConfig) {
                      setConfigForm({
                        bankCode: cnabConfig.bankCode as typeof configForm.bankCode,
                        layout: cnabConfig.layout as typeof configForm.layout,
                        agencia: cnabConfig.agencia,
                        agenciaDigito: cnabConfig.agenciaDigito || "",
                        conta: cnabConfig.conta,
                        contaDigito: cnabConfig.contaDigito,
                        convenio: cnabConfig.convenio || "",
                        carteira: cnabConfig.carteira || "",
                        cedente: cnabConfig.cedente,
                        cedenteDocumento: cnabConfig.cedenteDocumento,
                      });
                    }
                    setShowConfigForm(!showConfigForm);
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {showConfigForm ? "Cancelar" : cnabConfig ? "Editar" : "Configurar"}
                </Button>
              </div>

              {!cnabConfig && !showConfigForm ? (
                <div className="text-center py-4">
                  <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
                  <p className="text-theme-muted">Configuração CNAB não encontrada</p>
                  <Button
                    onClick={() => setShowConfigForm(true)}
                    leftIcon={<Settings className="w-4 h-4" />}
                    className="mt-2"
                  >
                    Configurar Agora
                  </Button>
                </div>
              ) : showConfigForm ? (
                <form onSubmit={handleSaveConfig} className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-theme-secondary mb-1">Banco</label>
                      <Select
                        value={configForm.bankCode}
                        onChange={(value) => setConfigForm({ ...configForm, bankCode: value as typeof configForm.bankCode })}
                        options={banks?.map((bank) => ({ value: bank.code, label: bank.name })) || []}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-theme-secondary mb-1">Layout</label>
                      <Select
                        value={configForm.layout}
                        onChange={(value) => setConfigForm({ ...configForm, layout: value as typeof configForm.layout })}
                        options={[
                          { value: "240", label: "CNAB 240" },
                          { value: "400", label: "CNAB 400" },
                        ]}
                      />
                    </div>
                    <Input
                      label="Agência"
                      value={configForm.agencia}
                      onChange={(e) => setConfigForm({ ...configForm, agencia: e.target.value })}
                      maxLength={5}
                      required
                    />
                    <Input
                      label="Dígito Ag."
                      value={configForm.agenciaDigito}
                      onChange={(e) => setConfigForm({ ...configForm, agenciaDigito: e.target.value })}
                      maxLength={1}
                    />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Input
                      label="Conta"
                      value={configForm.conta}
                      onChange={(e) => setConfigForm({ ...configForm, conta: e.target.value })}
                      maxLength={12}
                      required
                    />
                    <Input
                      label="Dígito Conta"
                      value={configForm.contaDigito}
                      onChange={(e) => setConfigForm({ ...configForm, contaDigito: e.target.value })}
                      maxLength={1}
                      required
                    />
                    <Input
                      label="Convênio"
                      value={configForm.convenio}
                      onChange={(e) => setConfigForm({ ...configForm, convenio: e.target.value })}
                    />
                    <Input
                      label="Carteira"
                      value={configForm.carteira}
                      onChange={(e) => setConfigForm({ ...configForm, carteira: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Nome do Cedente"
                      value={configForm.cedente}
                      onChange={(e) => setConfigForm({ ...configForm, cedente: e.target.value })}
                      required
                    />
                    <Input
                      label="CNPJ/CPF do Cedente"
                      value={configForm.cedenteDocumento}
                      onChange={(e) => setConfigForm({ ...configForm, cedenteDocumento: e.target.value })}
                      required
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      isLoading={saveConfigMutation.isPending}
                    >
                      Salvar Configuração
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-theme-muted">Banco:</span>
                    <span className="ml-2 font-medium">{banks?.find(b => b.code === cnabConfig?.bankCode)?.name}</span>
                  </div>
                  <div>
                    <span className="text-theme-muted">Layout:</span>
                    <span className="ml-2 font-medium">CNAB {cnabConfig?.layout}</span>
                  </div>
                  <div>
                    <span className="text-theme-muted">Agência:</span>
                    <span className="ml-2 font-medium">{cnabConfig?.agencia}-{cnabConfig?.agenciaDigito}</span>
                  </div>
                  <div>
                    <span className="text-theme-muted">Conta:</span>
                    <span className="ml-2 font-medium">{cnabConfig?.conta}-{cnabConfig?.contaDigito}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Ações CNAB */}
            {cnabConfig && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Gerar Remessa */}
                <div className="bg-theme-card rounded-lg border border-theme p-6">
                  <h2 className="text-lg font-medium text-theme mb-4 flex items-center gap-2">
                    <Download className="w-5 h-5 text-green-600" />
                    Gerar Remessa de Cobrança
                  </h2>

                  <p className="text-sm text-theme-muted mb-4">
                    Gera arquivo CNAB para envio ao banco com os títulos a receber pendentes.
                  </p>

                  <div className="mb-4 p-3 bg-theme-tertiary rounded-lg">
                    <div className="text-sm text-theme-secondary">
                      Títulos pendentes: <span className="font-medium">{receivables?.receivables?.filter((r: { status: string }) => r.status === "PENDING").length || 0}</span>
                    </div>
                  </div>

                  <Button
                    onClick={handleGenerateRemessa}
                    disabled={generateRemessaMutation.isPending || !receivables?.receivables?.length}
                    isLoading={generateRemessaMutation.isPending}
                    leftIcon={<Download className="w-5 h-5" />}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    Gerar Arquivo de Remessa
                  </Button>

                  {remessaResult?.success && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 text-green-800 mb-2">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-medium">Remessa gerada com sucesso!</span>
                      </div>
                      <div className="text-sm text-green-700 space-y-1">
                        <div>Arquivo: {remessaResult.filename}</div>
                        <div>Registros: {remessaResult.totalRegistros}</div>
                        <div>Valor Total: {formatCurrency(remessaResult.valorTotal || 0)}</div>
                      </div>
                      <Button
                        onClick={handleDownloadRemessa}
                        leftIcon={<Download className="w-4 h-4" />}
                        className="mt-3 bg-green-600 hover:bg-green-700"
                      >
                        Baixar Arquivo
                      </Button>
                    </div>
                  )}
                </div>

                {/* Processar Retorno */}
                <div className="bg-theme-card rounded-lg border border-theme p-6">
                  <h2 className="text-lg font-medium text-theme mb-4 flex items-center gap-2">
                    <Upload className="w-5 h-5 text-blue-600" />
                    Processar Retorno Bancário
                  </h2>

                  <p className="text-sm text-theme-muted mb-4">
                    Processa arquivo de retorno do banco para baixar títulos pagos automaticamente.
                  </p>

                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept=".ret,.txt,.RET,.TXT"
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={processRetornoMutation.isPending}
                    isLoading={processRetornoMutation.isPending}
                    leftIcon={<Upload className="w-5 h-5" />}
                    className="w-full"
                  >
                    Selecionar Arquivo de Retorno
                  </Button>

                  {retornoResult?.success && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2 text-blue-800 mb-2">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-medium">Retorno processado!</span>
                      </div>
                      <div className="text-sm text-blue-700 space-y-1">
                        <div>Banco: {retornoResult.banco}</div>
                        <div>Títulos pagos: {retornoResult.totalPagos}</div>
                        <div>Baixados no sistema: {retornoResult.baixados}</div>
                        <div>Valor Total: {formatCurrency(retornoResult.valorTotal || 0)}</div>
                      </div>
                      {retornoResult.erros && retornoResult.erros.length > 0 && (
                        <div className="mt-2 text-sm text-red-600">
                          <div className="font-medium">Erros:</div>
                          {retornoResult.erros.map((erro, i) => (
                            <div key={i}>• {erro}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
