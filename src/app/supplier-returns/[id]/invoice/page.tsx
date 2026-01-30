"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { FileText, Loader2, AlertCircle, RotateCcw } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { trpc } from "@/lib/trpc";

export default function RegisterReturnInvoicePage({ params }: { params: Promise<{ id: string }> }) {
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
        <div className="flex min-h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      </ProtectedRoute>
    );
  }

  if (!supplierReturn || supplierReturn.status !== "APPROVED") {
    return (
      <ProtectedRoute>
        <div className="py-12 text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <p className="text-theme-muted">Devolução não encontrada ou não está aprovada</p>
          <Link
            href="/supplier-returns"
            className="mt-2 inline-block text-indigo-600 hover:underline"
          >
            Voltar para lista
          </Link>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-2xl space-y-6">
        <PageHeader
          title="Registrar NFe de Devolução"
          subtitle={`Devolução #${supplierReturn.returnNumber} - ${supplierReturn.supplier.companyName}`}
          icon={<RotateCcw className="h-6 w-6" />}
          backHref={`/supplier-returns/${id}`}
          module="inventory"
        />

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-theme-card border-theme rounded-xl border p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-lg bg-purple-100 p-3">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-theme text-lg font-semibold">Dados da NFe de Devolução</h2>
                <p className="text-theme-muted text-sm">
                  Informe os dados da nota fiscal de devolução emitida
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-theme mb-1 block text-sm font-medium">Número da NFe *</label>
                <input
                  type="number"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  required
                  min="1"
                  placeholder="Ex: 12345"
                  className="border-theme bg-theme-card text-theme w-full rounded-lg border px-3 py-2"
                />
              </div>

              <div>
                <label className="text-theme mb-1 block text-sm font-medium">
                  Chave de Acesso (44 dígitos)
                </label>
                <input
                  type="text"
                  value={invoiceKey}
                  onChange={(e) => setInvoiceKey(e.target.value.replace(/\D/g, "").slice(0, 44))}
                  maxLength={44}
                  placeholder="Opcional - Chave de acesso da NFe"
                  className="border-theme bg-theme-card text-theme w-full rounded-lg border px-3 py-2 font-mono text-sm"
                />
                {invoiceKey && invoiceKey.length !== 44 && (
                  <p className="mt-1 text-xs text-yellow-600">
                    A chave deve ter 44 dígitos ({invoiceKey.length}/44)
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-4">
            <Link
              href={`/supplier-returns/${id}`}
              className="text-theme-muted hover:text-theme px-4 py-2"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={markAsInvoicedMutation.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-6 py-2 text-white hover:bg-purple-700 disabled:opacity-50"
            >
              {markAsInvoicedMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Registrar NFe
            </button>
          </div>
        </form>
      </div>
    </ProtectedRoute>
  );
}
