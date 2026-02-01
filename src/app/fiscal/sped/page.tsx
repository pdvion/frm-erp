"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/ui/PageHeader";
import { PageCard } from "@/components/ui/PageCard";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import {
  FileText,
  Download,
  Calendar,
  CheckCircle,
  AlertCircle,
  Loader2,
  FileCheck,
  Package,
} from "lucide-react";

export default function SpedPage() {
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [ano, setAno] = useState(new Date().getFullYear());
  const [incluirInventario, setIncluirInventario] = useState(false);
  const [resultado, setResultado] = useState<{
    conteudo?: string;
    nomeArquivo?: string;
    validacao?: { valido: boolean; erros: string[] };
  } | null>(null);

  const { data: periodos, isLoading: loadingPeriodos } = trpc.sped.listPeriodos.useQuery();

  const gerarMutation = trpc.sped.gerar.useMutation({
    onSuccess: (data) => {
      setResultado(data);
    },
  });

  const handleGerar = () => {
    setResultado(null);
    gerarMutation.mutate({ mes, ano, incluirInventario });
  };

  const handleDownload = () => {
    if (!resultado?.conteudo || !resultado?.nomeArquivo) return;

    const blob = new Blob([resultado.conteudo], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = resultado.nomeArquivo;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const meses = [
    { value: 1, label: "Janeiro" },
    { value: 2, label: "Fevereiro" },
    { value: 3, label: "Março" },
    { value: 4, label: "Abril" },
    { value: 5, label: "Maio" },
    { value: 6, label: "Junho" },
    { value: 7, label: "Julho" },
    { value: 8, label: "Agosto" },
    { value: 9, label: "Setembro" },
    { value: 10, label: "Outubro" },
    { value: 11, label: "Novembro" },
    { value: 12, label: "Dezembro" },
  ];

  const anos = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="space-y-6">
      <PageHeader
        title="SPED Fiscal"
        subtitle="Geração de arquivo EFD ICMS/IPI"
        icon={<FileText className="h-6 w-6" />}
        backHref="/fiscal"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário de Geração */}
        <div className="lg:col-span-2">
          <PageCard title="Gerar Arquivo SPED">
            <div className="space-y-6">
              {/* Seleção de Período */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-theme-secondary mb-2">
                    <Calendar className="inline h-4 w-4 mr-1" />
                    Mês de Referência
                  </label>
                  <Select
                    value={String(mes)}
                    onChange={(value) => setMes(Number(value))}
                    options={meses.map((m) => ({ value: String(m.value), label: m.label }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-theme-secondary mb-2">
                    Ano
                  </label>
                  <Select
                    value={String(ano)}
                    onChange={(value) => setAno(Number(value))}
                    options={anos.map((a) => ({ value: String(a), label: String(a) }))}
                  />
                </div>
              </div>

              {/* Opções */}
              <div className="border-t border-theme pt-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={incluirInventario}
                    onChange={(e) => setIncluirInventario(e.target.checked)}
                    className="w-5 h-5 rounded border-theme text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="font-medium text-theme dark:text-theme-muted flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Incluir Inventário (Bloco H)
                    </span>
                    <span className="text-sm text-theme-muted">
                      Obrigatório em dezembro ou quando houver mudança de regime
                    </span>
                  </div>
                </label>
              </div>

              {/* Botão Gerar */}
              <div className="flex gap-3">
                <Button
                  onClick={handleGerar}
                  isLoading={gerarMutation.isPending}
                  leftIcon={<FileCheck className="h-5 w-5" />}
                  className="flex-1"
                >
                  {gerarMutation.isPending ? "Gerando..." : "Gerar SPED Fiscal"}
                </Button>

                {resultado?.conteudo && (
                  <Button
                    onClick={handleDownload}
                    variant="success"
                    leftIcon={<Download className="h-5 w-5" />}
                  >
                    Download
                  </Button>
                )}
              </div>

              {/* Erro */}
              {gerarMutation.isError && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-medium">Erro na geração</span>
                  </div>
                  <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                    {gerarMutation.error?.message || "Erro desconhecido"}
                  </p>
                </div>
              )}

              {/* Resultado */}
              {resultado && (
                <div className="space-y-4">
                  {/* Validação */}
                  <div
                    className={`p-4 rounded-lg border ${
                      resultado.validacao?.valido
                        ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                        : "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {resultado.validacao?.valido ? (
                        <>
                          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                          <span className="font-medium text-green-800 dark:text-green-200">
                            Arquivo gerado com sucesso!
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                          <span className="font-medium text-yellow-800 dark:text-yellow-200">
                            Arquivo gerado com avisos
                          </span>
                        </>
                      )}
                    </div>
                    {resultado.nomeArquivo && (
                      <p className="mt-1 text-sm text-theme-muted">
                        Arquivo: <code className="bg-theme-tertiary px-1 rounded">{resultado.nomeArquivo}</code>
                      </p>
                    )}
                    {resultado.validacao?.erros && resultado.validacao.erros.length > 0 && (
                      <ul className="mt-2 text-sm text-yellow-700 dark:text-yellow-300 list-disc list-inside">
                        {resultado.validacao.erros.map((erro, i) => (
                          <li key={i}>{erro}</li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Preview */}
                  <div>
                    <h4 className="text-sm font-medium text-theme-secondary mb-2">
                      Preview (primeiras 20 linhas)
                    </h4>
                    <pre className="p-4 bg-theme text-theme-muted rounded-lg overflow-x-auto text-xs font-mono max-h-64 overflow-y-auto">
                      {resultado.conteudo?.split("\r\n").slice(0, 20).join("\n")}
                      {(resultado.conteudo?.split("\r\n").length || 0) > 20 && "\n..."}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </PageCard>
        </div>

        {/* Períodos Disponíveis */}
        <div>
          <PageCard title="Períodos com Dados">
            {loadingPeriodos ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-theme-muted" />
              </div>
            ) : periodos && periodos.length > 0 ? (
              <div className="space-y-2">
                {periodos.slice(0, 12).map((p) => (
                  <button
                    key={`${p.ano}-${p.mes}`}
                    onClick={() => {
                      setMes(p.mes);
                      setAno(p.ano);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      mes === p.mes && ano === p.ano
                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200"
                        : "hover:bg-theme-tertiary dark:hover:bg-theme-card text-theme-secondary"
                    }`}
                  >
                    <span className="font-medium">
                      {meses.find((m) => m.value === p.mes)?.label} {p.ano}
                    </span>
                    {p.temDados && (
                      <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                        ● Dados disponíveis
                      </span>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-theme-muted text-center py-4">
                Nenhum período com dados fiscais encontrado.
              </p>
            )}
          </PageCard>

          {/* Informações */}
          <PageCard title="Informações" className="mt-6">
            <div className="text-sm text-theme-muted space-y-3">
              <p>
                O <strong>SPED Fiscal (EFD ICMS/IPI)</strong> é a escrituração digital dos livros fiscais.
              </p>
              <p>
                <strong>Blocos gerados:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Bloco 0 - Abertura e Identificação</li>
                <li>Bloco C - Documentos Fiscais (NFe)</li>
                <li>Bloco E - Apuração ICMS/IPI</li>
                <li>Bloco H - Inventário (opcional)</li>
                <li>Bloco 9 - Encerramento</li>
              </ul>
              <p className="text-xs text-theme-muted dark:text-theme-muted mt-4">
                Versão do layout: 018 (2024)
              </p>
            </div>
          </PageCard>
        </div>
      </div>
    </div>
  );
}
