"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { CompanySwitcher } from "@/components/CompanySwitcher";
import {
  Shield,
  ChevronLeft,
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
} from "lucide-react";

export default function SefazConfigPage() {
  const [cnpj, setCnpj] = useState("");
  const [uf, setUf] = useState("SP");
  const [environment, setEnvironment] = useState<"homologacao" | "producao">("homologacao");
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [certificatePassword, setCertificatePassword] = useState("");
  const [chaveConsulta, setChaveConsulta] = useState("");

  const { data: status, isLoading, refetch } = trpc.sefaz.status.useQuery();

  const consultarMutation = trpc.sefaz.consultarNFeDestinadas.useMutation({
    onSuccess: (data) => {
      alert(`Consulta realizada! ${data.totalRegistros} NFe encontradas.`);
    },
    onError: (error) => {
      alert(`Erro: ${error.message}`);
    },
  });

  const consultarChaveMutation = trpc.sefaz.consultarPorChave.useMutation({
    onSuccess: (data) => {
      alert(`NFe encontrada: ${data.message}`);
    },
    onError: (error) => {
      alert(`Erro: ${error.message}`);
    },
  });

  const saveConfigMutation = trpc.sefaz.saveConfig.useMutation({
    onSuccess: () => {
      alert("Configuração salva com sucesso!");
      refetch();
    },
    onError: (error) => {
      alert(`Erro ao salvar: ${error.message}`);
    },
  });

  const { data: currentConfig } = trpc.sefaz.getConfig.useQuery();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith(".pfx") && !file.name.endsWith(".p12")) {
        alert("Selecione um arquivo de certificado .pfx ou .p12");
        return;
      }
      setCertificateFile(file);
    }
  };

  const handleSave = async () => {
    if (!cnpj || !uf) {
      alert("Preencha CNPJ e UF");
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
      cnpj,
      uf,
      environment,
      certificateBase64,
      certificatePassword: certificatePassword || undefined,
    });
  };

  const UF_OPTIONS = [
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
    "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
    "RS", "RO", "RR", "SC", "SP", "SE", "TO"
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/settings" className="text-gray-500 hover:text-gray-700">
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-600" />
                Configuração SEFAZ
              </h1>
            </div>
            <CompanySwitcher />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-gray-500" />
            Status da Integração
          </h2>

          {isLoading ? (
            <div className="flex items-center gap-2 text-gray-500">
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
                  <div className="text-sm font-medium text-gray-900">
                    {status?.configured ? "Configurado" : "Não Configurado"}
                  </div>
                  <div className="text-xs text-gray-500">Status</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {status?.hasCertificate ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                )}
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {status?.hasCertificate ? "Certificado OK" : "Sem Certificado"}
                  </div>
                  <div className="text-xs text-gray-500">Certificado Digital</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-blue-500" />
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {status?.environment === "producao" ? "Produção" : "Homologação"}
                  </div>
                  <div className="text-xs text-gray-500">Ambiente</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Configuration Form */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-gray-500" />
            Dados da Empresa
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CNPJ *
              </label>
              <input
                type="text"
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value.replace(/\D/g, ""))}
                placeholder="00000000000000"
                maxLength={14}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                UF *
              </label>
              <select
                value={uf}
                onChange={(e) => setUf(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                {UF_OPTIONS.map((estado) => (
                  <option key={estado} value={estado}>{estado}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
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
                <span className="text-sm text-gray-700">Homologação (Testes)</span>
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
                <span className="text-sm text-gray-700">Produção</span>
              </label>
            </div>
          </div>

          <h3 className="text-md font-medium text-gray-900 mb-3 flex items-center gap-2">
            <Key className="w-4 h-4 text-gray-500" />
            Certificado Digital A1
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50"
                >
                  <Upload className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700">
                    {certificateFile ? certificateFile.name : "Selecionar arquivo"}
                  </span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Senha do Certificado *
              </label>
              <input
                type="password"
                value={certificatePassword}
                onChange={(e) => setCertificatePassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saveConfigMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {saveConfigMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Salvar Configuração
                </>
              )}
            </button>
          </div>
        </div>

        {/* Consulta NFe */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-500" />
            Consultar NFe
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Consulta por período */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                NFe Destinadas (Últimas)
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                Busca todas as NFe destinadas ao CNPJ da empresa nos últimos dias.
              </p>
              <button
                onClick={() => consultarMutation.mutate({})}
                disabled={consultarMutation.isPending || !status?.configured}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 w-full justify-center"
              >
                {consultarMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Buscar NFe
              </button>
            </div>

            {/* Consulta por chave */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                Consultar por Chave
              </h3>
              <input
                type="text"
                value={chaveConsulta}
                onChange={(e) => setChaveConsulta(e.target.value.replace(/\D/g, ""))}
                placeholder="Chave de acesso (44 dígitos)"
                maxLength={44}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 mb-3"
              />
              <button
                onClick={() => consultarChaveMutation.mutate({ chaveAcesso: chaveConsulta })}
                disabled={consultarChaveMutation.isPending || chaveConsulta.length !== 44}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 w-full justify-center"
              >
                {consultarChaveMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                Consultar
              </button>
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
