"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText, Loader2, AlertCircle } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { trpc } from "@/lib/trpc";

export default function RegisterReturnInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceKey, setInvoiceKey] = useState("");
  const [error, setError] = useState("");

  const { data: supplierReturn, isLoading } = trpc.supplierReturns.getById.useQuery({ id });

  const markAsInvoicedMutation = trpc.supplierReturns.markAsInvoiced.useMutation({
    onSuccess: () => {
      router.push(`/supplier-returns/${id}`);
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!invoiceNumber) {
      setError("Informe o número da NFe");
      return;
    }

    await markAsInvoicedMutation.mutateAsync({
      id,
      returnInvoiceNumber: parseInt(invoiceNumber),
      returnInvoiceKey: invoiceKey || undefined,
    });
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      </ProtectedRoute>
    );
  }

  if (!supplierReturn || supplierReturn.status !== "APPROVED") {
    return (
      <ProtectedRoute>
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-theme-muted">
            Devolução não encontrada ou não está aprovada
          </p>
          <Link
            href="/supplier-returns"
            className="text-indigo-600 hover:underline mt-2 inline-block"
          >
            Voltar para lista
          </Link>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6 max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            href={`/supplier-returns/${id}`}
            className="p-2 hover:bg-theme-hover rounded-lg"
          >
            <ArrowLeft className="w-5 h-5 text-theme-muted" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-theme">
              Registrar NFe de Devolução
            </h1>
            <p className="text-theme-muted">
              Devolução #{supplierReturn.returnNumber} - {supplierReturn.supplier.companyName}
            </p>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-theme-card rounded-xl border border-theme p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-purple-100 rounded-lg">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-theme">
                  Dados da NFe de Devolução
                </h2>
                <p className="text-sm text-theme-muted">
                  Informe os dados da nota fiscal de devolução emitida
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-theme mb-1">
                  Número da NFe *
                </label>
                <input
                  type="number"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  required
                  min="1"
                  placeholder="Ex: 12345"
                  className="w-full px-3 py-2 border border-theme rounded-lg bg-theme-card text-theme"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-theme mb-1">
                  Chave de Acesso (44 dígitos)
                </label>
                <input
                  type="text"
                  value={invoiceKey}
                  onChange={(e) => setInvoiceKey(e.target.value.replace(/\D/g, "").slice(0, 44))}
                  maxLength={44}
                  placeholder="Opcional - Chave de acesso da NFe"
                  className="w-full px-3 py-2 border border-theme rounded-lg bg-theme-card text-theme font-mono text-sm"
                />
                {invoiceKey && invoiceKey.length !== 44 && (
                  <p className="text-xs text-yellow-600 mt-1">
                    A chave deve ter 44 dígitos ({invoiceKey.length}/44)
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-4">
            <Link
              href={`/supplier-returns/${id}`}
              className="px-4 py-2 text-theme-muted hover:text-theme"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={markAsInvoicedMutation.isPending}
              className="inline-flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {markAsInvoicedMutation.isPending && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              Registrar NFe
            </button>
          </div>
        </form>
      </div>
    </ProtectedRoute>
  );
}
