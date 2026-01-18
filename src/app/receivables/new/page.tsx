"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { CompanySwitcher } from "@/components/CompanySwitcher";
import {
  DollarSign,
  ChevronLeft,
  Loader2,
  Save,
  Search,
} from "lucide-react";

export default function NewReceivablePage() {
  const router = useRouter();
  
  const [customerId, setCustomerId] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [documentType, setDocumentType] = useState<"INVOICE" | "SERVICE" | "CONTRACT" | "OTHER">("INVOICE");
  const [documentNumber, setDocumentNumber] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [originalValue, setOriginalValue] = useState("");
  const [discountValue, setDiscountValue] = useState("0");
  const [installments, setInstallments] = useState("1");
  const [intervalDays, setIntervalDays] = useState("30");
  const [notes, setNotes] = useState("");

  const { data: customers, isLoading: loadingCustomers } = trpc.customers.list.useQuery({
    search: customerSearch || undefined,
    limit: 10,
  });

  const createMutation = trpc.receivables.create.useMutation({
    onSuccess: (data) => {
      router.push(`/receivables/${data.id}`);
    },
  });

  const createInstallmentsMutation = trpc.receivables.createInstallments.useMutation({
    onSuccess: () => {
      router.push("/receivables");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const numInstallments = parseInt(installments);

    if (numInstallments > 1) {
      createInstallmentsMutation.mutate({
        customerId,
        documentType,
        documentNumber: documentNumber || undefined,
        description,
        firstDueDate: new Date(dueDate),
        totalValue: parseFloat(originalValue),
        installments: numInstallments,
        intervalDays: parseInt(intervalDays),
        notes: notes || undefined,
      });
    } else {
      createMutation.mutate({
        customerId,
        documentType,
        documentNumber: documentNumber || undefined,
        description,
        dueDate: new Date(dueDate),
        originalValue: parseFloat(originalValue),
        discountValue: parseFloat(discountValue) || 0,
        notes: notes || undefined,
      });
    }
  };

  const isLoading = createMutation.isPending || createInstallmentsMutation.isPending;
  const selectedCustomer = customers?.customers.find(c => c.id === customerId);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/receivables" className="text-gray-500 hover:text-gray-700">
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <DollarSign className="w-6 h-6 text-green-600" />
                <h1 className="text-xl font-semibold text-gray-900">Novo Título a Receber</h1>
              </div>
            </div>
            <CompanySwitcher />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Cliente */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Cliente</h2>
            
            {!customerId ? (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar cliente por nome, código ou CNPJ..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                
                {loadingCustomers ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  </div>
                ) : customers?.customers.length ? (
                  <div className="border border-gray-200 rounded-lg divide-y">
                    {customers.customers.map((customer) => (
                      <button
                        key={customer.id}
                        type="button"
                        onClick={() => setCustomerId(customer.id)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex justify-between items-center"
                      >
                        <div>
                          <div className="font-medium text-gray-900">{customer.companyName}</div>
                          <div className="text-sm text-gray-500">
                            {customer.code} {customer.cnpj && `• ${customer.cnpj}`}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : customerSearch ? (
                  <p className="text-center text-gray-500 py-4">Nenhum cliente encontrado</p>
                ) : null}
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">{selectedCustomer?.companyName}</div>
                  <div className="text-sm text-gray-500">
                    {selectedCustomer?.code} {selectedCustomer?.cnpj && `• ${selectedCustomer.cnpj}`}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCustomerId("")}
                  className="text-sm text-green-600 hover:text-green-800"
                >
                  Alterar
                </button>
              </div>
            )}
          </div>

          {/* Dados do Título */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Dados do Título</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Documento
                </label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value as typeof documentType)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="INVOICE">Nota Fiscal</option>
                  <option value="SERVICE">Serviço</option>
                  <option value="CONTRACT">Contrato</option>
                  <option value="OTHER">Outros</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número do Documento
                </label>
                <input
                  type="text"
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                  placeholder="Ex: NF-001234"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição *
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  placeholder="Descrição do título"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>
            </div>
          </div>

          {/* Valores e Vencimento */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Valores e Vencimento</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor Total *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={originalValue}
                  onChange={(e) => setOriginalValue(e.target.value)}
                  required
                  placeholder="0,00"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Desconto
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  placeholder="0,00"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data de Vencimento *
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Parcelas
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={installments}
                  onChange={(e) => setInstallments(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
              </div>

              {parseInt(installments) > 1 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Intervalo (dias)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={intervalDays}
                    onChange={(e) => setIntervalDays(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              )}
            </div>

            {parseInt(installments) > 1 && originalValue && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  Serão criadas <strong>{installments} parcelas</strong> de{" "}
                  <strong>
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                      parseFloat(originalValue) / parseInt(installments)
                    )}
                  </strong>{" "}
                  com intervalo de <strong>{intervalDays} dias</strong> entre elas.
                </p>
              </div>
            )}
          </div>

          {/* Observações */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Observações</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Observações adicionais..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Link
              href="/receivables"
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={!customerId || !description || !originalValue || !dueDate || isLoading}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isLoading ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
