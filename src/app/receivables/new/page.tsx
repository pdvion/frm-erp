"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import {
  DollarSign,
  Loader2,
  Save,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";

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
    <div className="space-y-6">
      <PageHeader
        title="Novo Título a Receber"
        subtitle="Cadastrar novo título"
        icon={<DollarSign className="w-6 h-6" />}
        backHref="/receivables"
        module="finance"
      />

      <div>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Cliente */}
          <div className="bg-theme-card rounded-lg border border-theme p-6">
            <h2 className="text-lg font-medium text-theme mb-4">Cliente</h2>
            
            {!customerId ? (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
                  <input
                    type="text"
                    placeholder="Buscar cliente por nome, código ou CNPJ..."
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                
                {loadingCustomers ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin text-theme-muted" />
                  </div>
                ) : customers?.customers.length ? (
                  <div className="border border-theme rounded-lg divide-y">
                    {customers.customers.map((customer) => (
                      <Button
                        key={customer.id}
                        variant="ghost"
                        type="button"
                        onClick={() => setCustomerId(customer.id)}
                        className="w-full px-4 py-3 justify-start text-left h-auto"
                      >
                        <div>
                          <div className="font-medium text-theme">{customer.companyName}</div>
                          <div className="text-sm text-theme-muted">
                            {customer.code} {customer.cnpj && `• ${customer.cnpj}`}
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                ) : customerSearch ? (
                  <p className="text-center text-theme-muted py-4">Nenhum cliente encontrado</p>
                ) : null}
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 bg-theme-tertiary rounded-lg">
                <div>
                  <div className="font-medium text-theme">{selectedCustomer?.companyName}</div>
                  <div className="text-sm text-theme-muted">
                    {selectedCustomer?.code} {selectedCustomer?.cnpj && `• ${selectedCustomer.cnpj}`}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => setCustomerId("")}
                  className="text-green-600 hover:text-green-800"
                >
                  Alterar
                </Button>
              </div>
            )}
          </div>

          {/* Dados do Título */}
          <div className="bg-theme-card rounded-lg border border-theme p-6">
            <h2 className="text-lg font-medium text-theme mb-4">Dados do Título</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-theme-secondary mb-1">
                  Tipo de Documento
                </label>
                <Select
                  value={documentType}
                  onChange={(value) => setDocumentType(value as typeof documentType)}
                  options={[
                    { value: "INVOICE", label: "Nota Fiscal" },
                    { value: "SERVICE", label: "Serviço" },
                    { value: "CONTRACT", label: "Contrato" },
                    { value: "OTHER", label: "Outros" },
                  ]}
                />
              </div>

              <Input
                label="Número do Documento"
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
                placeholder="Ex: NF-001234"
              />

              <div className="md:col-span-2">
                <Input
                  label="Descrição *"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  placeholder="Descrição do título"
                />
              </div>
            </div>
          </div>

          {/* Valores e Vencimento */}
          <div className="bg-theme-card rounded-lg border border-theme p-6">
            <h2 className="text-lg font-medium text-theme mb-4">Valores e Vencimento</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Valor Total *"
                type="number"
                step="0.01"
                value={originalValue}
                onChange={(e) => setOriginalValue(e.target.value)}
                required
                placeholder="0,00"
              />

              <Input
                label="Desconto"
                type="number"
                step="0.01"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder="0,00"
              />

              <Input
                label="Data de Vencimento *"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />

              <Input
                label="Número de Parcelas"
                type="number"
                min="1"
                max="60"
                value={installments}
                onChange={(e) => setInstallments(e.target.value)}
              />

              {parseInt(installments) > 1 && (
                <Input
                  label="Intervalo (dias)"
                  type="number"
                  min="1"
                  value={intervalDays}
                  onChange={(e) => setIntervalDays(e.target.value)}
                />
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
          <div className="bg-theme-card rounded-lg border border-theme p-6">
            <h2 className="text-lg font-medium text-theme mb-4">Observações</h2>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Observações adicionais..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => router.push("/receivables")}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!customerId || !description || !originalValue || !dueDate}
              isLoading={isLoading}
              leftIcon={<Save className="w-4 h-4" />}
              className="bg-green-600 hover:bg-green-700"
            >
              Salvar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
