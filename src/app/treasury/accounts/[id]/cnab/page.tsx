"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

import { PageHeader } from "@/components/PageHeader";
import { Input } from "@/components/ui/Input";
import {
  Building2,
  Settings,
  Upload,
  Download,
  FileText,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Save,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { NativeSelect } from "@/components/ui/NativeSelect";

const BANKS = [
  { code: "001", name: "Banco do Brasil" },
  { code: "033", name: "Santander" },
  { code: "104", name: "Caixa Econômica Federal" },
  { code: "237", name: "Bradesco" },
  { code: "341", name: "Itaú" },
  { code: "756", name: "Sicoob" },
];

export default function CnabConfigPage() {
  const params = useParams();
  const accountId = params.id as string;

  const [config, setConfig] = useState({
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

  const [retornoFile, setRetornoFile] = useState<File | null>(null);
  const [retornoContent, setRetornoContent] = useState("");

  const { data: account, isLoading: loadingAccount } = trpc.bankAccounts.byId.useQuery(
    { id: accountId },
    { enabled: !!accountId }
  );

  const { data: savedConfig, isLoading: loadingConfig, refetch } = trpc.cnab.getConfig.useQuery(
    { bankAccountId: accountId },
    { enabled: !!accountId }
  );

  const saveConfigMutation = trpc.cnab.saveConfig.useMutation({
    onSuccess: () => {
      toast.success("Configuração salva com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro ao salvar: ${error.message}`);
    },
  });

  const processRetornoMutation = trpc.cnab.processRetorno.useMutation({
    onSuccess: (data) => {
      toast.success(
        `Retorno processado! ` +
        `Banco: ${data.banco} | ` +
        `Títulos pagos: ${data.totalPagos} | ` +
        `Títulos rejeitados: ${data.totalRejeitados}\n` +
        `Valor total: R$ ${data.valorTotal?.toFixed(2)}\n` +
        `Baixados no sistema: ${data.baixados}`
      );
    },
    onError: (error) => {
      toast.error(`Erro ao processar retorno: ${error.message}`);
    },
  });

  useEffect(() => {
    if (savedConfig) {
      setConfig({
        bankCode: savedConfig.bankCode as typeof config.bankCode,
        layout: savedConfig.layout as typeof config.layout,
        agencia: savedConfig.agencia,
        agenciaDigito: savedConfig.agenciaDigito || "",
        conta: savedConfig.conta,
        contaDigito: savedConfig.contaDigito,
        convenio: savedConfig.convenio || "",
        carteira: savedConfig.carteira || "",
        cedente: savedConfig.cedente,
        cedenteDocumento: savedConfig.cedenteDocumento,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedConfig]);

  const handleSave = () => {
    if (!config.agencia || !config.conta || !config.contaDigito || !config.cedente || !config.cedenteDocumento) {
      toast.warning("Preencha todos os campos obrigatórios");
      return;
    }

    saveConfigMutation.mutate({
      bankAccountId: accountId,
      config,
    });
  };

  const handleRetornoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setRetornoFile(file);
      const content = await file.text();
      setRetornoContent(content);
    }
  };

  const handleProcessRetorno = () => {
    if (!retornoContent) {
      toast.warning("Selecione um arquivo de retorno");
      return;
    }

    processRetornoMutation.mutate({
      bankAccountId: accountId,
      content: retornoContent,
    });
  };

  if (loadingAccount || loadingConfig) {
    return (
      <div className="space-y-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configuração CNAB"
        icon={<Settings className="w-6 h-6" />}
        backHref={`/treasury/accounts/${accountId}`}
        module="treasury"
      />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Conta Info */}
        <div className="bg-theme-card rounded-lg border border-theme p-4 mb-6">
          <div className="flex items-center gap-3">
            <Building2 className="w-8 h-8 text-blue-600" />
            <div>
              <h2 className="font-medium text-theme">{account?.name}</h2>
              <p className="text-sm text-theme-muted">
                {account?.bankName} • Ag: {account?.agency} • CC: {account?.accountNumber}
              </p>
            </div>
            {savedConfig && (
              <span className="ml-auto px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Configurado
              </span>
            )}
          </div>
        </div>

        {/* Configuração */}
        <div className="bg-theme-card rounded-lg border border-theme p-6 mb-6">
          <h2 className="text-lg font-medium text-theme mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-theme-muted" />
            Dados para Remessa/Retorno
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-1">Banco *</label>
              <NativeSelect
                value={config.bankCode}
                onChange={(e) => setConfig({ ...config, bankCode: e.target.value as typeof config.bankCode })}
                className="w-full px-3 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {BANKS.map((bank) => (
                  <option key={bank.code} value={bank.code}>
                    {bank.code} - {bank.name}
                  </option>
                ))}
              </NativeSelect>
            </div>

            <div>
              <label className="block text-sm font-medium text-theme-secondary mb-1">Layout *</label>
              <NativeSelect
                value={config.layout}
                onChange={(e) => setConfig({ ...config, layout: e.target.value as typeof config.layout })}
                className="w-full px-3 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="240">CNAB 240</option>
                <option value="400">CNAB 400</option>
              </NativeSelect>
            </div>

            <Input
              label="Carteira"
              value={config.carteira}
              onChange={(e) => setConfig({ ...config, carteira: e.target.value })}
              placeholder="Ex: 17"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Input
              label="Agência *"
              value={config.agencia}
              onChange={(e) => setConfig({ ...config, agencia: e.target.value.replace(/\D/g, "") })}
              placeholder="0000"
              maxLength={5}
            />
            <Input
              label="Dígito Ag."
              value={config.agenciaDigito}
              onChange={(e) => setConfig({ ...config, agenciaDigito: e.target.value })}
              placeholder="X"
              maxLength={1}
            />
            <Input
              label="Conta *"
              value={config.conta}
              onChange={(e) => setConfig({ ...config, conta: e.target.value.replace(/\D/g, "") })}
              placeholder="000000"
              maxLength={12}
            />
            <Input
              label="Dígito CC *"
              value={config.contaDigito}
              onChange={(e) => setConfig({ ...config, contaDigito: e.target.value })}
              placeholder="X"
              maxLength={1}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Input
              label="Convênio"
              value={config.convenio}
              onChange={(e) => setConfig({ ...config, convenio: e.target.value })}
              placeholder="Código do convênio"
            />
            <Input
              label="CNPJ/CPF Cedente *"
              value={config.cedenteDocumento}
              onChange={(e) => setConfig({ ...config, cedenteDocumento: e.target.value.replace(/\D/g, "") })}
              placeholder="00000000000000"
              maxLength={14}
            />
          </div>

          <div className="mb-6">
            <Input
              label="Nome do Cedente *"
              value={config.cedente}
              onChange={(e) => setConfig({ ...config, cedente: e.target.value })}
              placeholder="Razão Social da Empresa"
            />
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={saveConfigMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saveConfigMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Salvar Configuração
            </Button>
          </div>
        </div>

        {/* Importar Retorno */}
        <div className="bg-theme-card rounded-lg border border-theme p-6">
          <h2 className="text-lg font-medium text-theme mb-4 flex items-center gap-2">
            <Upload className="w-5 h-5 text-theme-muted" />
            Importar Arquivo de Retorno
          </h2>

          <div className="border-2 border-dashed border-theme rounded-lg p-6 text-center mb-4">
            <Input
              type="file"
              accept=".ret,.txt,.RET,.TXT"
              onChange={handleRetornoFileChange}
              className="hidden"
              id="retorno-file"
            />
            <label htmlFor="retorno-file" className="cursor-pointer">
              <Download className="w-10 h-10 text-theme-muted mx-auto mb-2" />
              <p className="text-sm text-theme-secondary">
                {retornoFile ? (
                  <span className="text-green-600 font-medium">{retornoFile.name}</span>
                ) : (
                  <>Clique para selecionar o arquivo de retorno</>
                )}
              </p>
              <p className="text-xs text-theme-muted mt-1">Formatos aceitos: .ret, .txt</p>
            </label>
          </div>

          {retornoFile && (
            <div className="flex items-center justify-between p-3 bg-theme-tertiary rounded-lg mb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-theme-muted" />
                <span className="text-sm text-theme-secondary">{retornoFile.name}</span>
                <span className="text-xs text-theme-muted">
                  ({(retornoFile.size / 1024).toFixed(1)} KB)
                </span>
              </div>
              <Button
                onClick={handleProcessRetorno}
                disabled={processRetornoMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {processRetornoMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Processar Retorno
              </Button>
            </div>
          )}

          {!savedConfig && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Configure os dados CNAB antes de processar arquivos de retorno.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
