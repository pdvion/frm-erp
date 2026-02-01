"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Receipt,
  Save,
  ArrowLeft,
  Search,
  Calendar,
  DollarSign,
  FileText,
  Building2,
  Calculator,
} from "lucide-react";
import Link from "next/link";

type DocumentType = "INVOICE" | "SERVICE" | "TAX" | "OTHER";

interface FormData {
  supplierId: string;
  supplierName: string;
  description: string;
  dueDate: string;
  originalValue: string;
  documentType: DocumentType;
  documentNumber: string;
  installmentNumber: number;
  totalInstallments: number;
  notes: string;
  barcode: string;
  costCenterCode: string;
  hasWithholding: boolean;
  withholdingIr: string;
  withholdingIss: string;
  withholdingInss: string;
  withholdingPis: string;
  withholdingCofins: string;
  withholdingCsll: string;
}

const initialForm: FormData = {
  supplierId: "",
  supplierName: "",
  description: "",
  dueDate: "",
  originalValue: "",
  documentType: "OTHER",
  documentNumber: "",
  installmentNumber: 1,
  totalInstallments: 1,
  notes: "",
  barcode: "",
  costCenterCode: "",
  hasWithholding: false,
  withholdingIr: "",
  withholdingIss: "",
  withholdingInss: "",
  withholdingPis: "",
  withholdingCofins: "",
  withholdingCsll: "",
};

const documentTypes: { value: DocumentType; label: string }[] = [
  { value: "INVOICE", label: "Nota Fiscal" },
  { value: "SERVICE", label: "Serviço" },
  { value: "TAX", label: "Imposto" },
  { value: "OTHER", label: "Outros" },
];

export default function NewPayablePage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>(initialForm);
  const [error, setError] = useState("");
  const [supplierSearch, setSupplierSearch] = useState("");
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);

  const { data: suppliers } = trpc.suppliers.list.useQuery(
    { search: supplierSearch, limit: 10 },
    { enabled: supplierSearch.length >= 2 }
  );

  const { data: costCenters } = trpc.costCenters.list.useQuery();

  const createMutation = trpc.payables.create.useMutation({
    onSuccess: () => {
      router.push("/payables");
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!form.supplierId) {
      setError("Selecione um fornecedor");
      return;
    }

    if (!form.description.trim()) {
      setError("Descrição é obrigatória");
      return;
    }

    if (!form.dueDate) {
      setError("Data de vencimento é obrigatória");
      return;
    }

    const value = parseFloat(form.originalValue.replace(",", "."));
    if (isNaN(value) || value <= 0) {
      setError("Valor deve ser maior que zero");
      return;
    }

    createMutation.mutate({
      supplierId: form.supplierId,
      description: form.description.trim(),
      dueDate: new Date(form.dueDate),
      originalValue: value,
      documentType: form.documentType,
      documentNumber: form.documentNumber || undefined,
      installmentNumber: form.installmentNumber,
      totalInstallments: form.totalInstallments,
      notes: form.notes || undefined,
      barcode: form.barcode || undefined,
      costCenterCode: form.costCenterCode || undefined,
      hasWithholding: form.hasWithholding,
      withholdingIr: parseFloat(form.withholdingIr) || 0,
      withholdingIss: parseFloat(form.withholdingIss) || 0,
      withholdingInss: parseFloat(form.withholdingInss) || 0,
      withholdingPis: parseFloat(form.withholdingPis) || 0,
      withholdingCofins: parseFloat(form.withholdingCofins) || 0,
      withholdingCsll: parseFloat(form.withholdingCsll) || 0,
    });
  };

  const selectSupplier = (supplier: { id: string; companyName: string }) => {
    setForm({ ...form, supplierId: supplier.id, supplierName: supplier.companyName });
    setSupplierSearch("");
    setShowSupplierDropdown(false);
  };

  const calculateNetValue = () => {
    const original = parseFloat(form.originalValue.replace(",", ".")) || 0;
    const ir = parseFloat(form.withholdingIr) || 0;
    const iss = parseFloat(form.withholdingIss) || 0;
    const inss = parseFloat(form.withholdingInss) || 0;
    const pis = parseFloat(form.withholdingPis) || 0;
    const cofins = parseFloat(form.withholdingCofins) || 0;
    const csll = parseFloat(form.withholdingCsll) || 0;
    return original - ir - iss - inss - pis - cofins - csll;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nova Conta a Pagar"
        icon={<Receipt className="w-6 h-6" />}
        module="FINANCE"
        breadcrumbs={[
          { label: "Contas a Pagar", href: "/payables" },
          { label: "Nova" },
        ]}
      />

      <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Fornecedor */}
        <div className="bg-theme-card border border-theme rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-semibold text-theme">Fornecedor</h2>
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-theme mb-1">
              Fornecedor *
            </label>
            {form.supplierId ? (
              <div className="flex items-center gap-2">
                <div className="flex-1 px-4 py-2 bg-theme-secondary border border-theme rounded-lg text-theme">
                  {form.supplierName}
                </div>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, supplierId: "", supplierName: "" })}
                  className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                >
                  Alterar
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
                <input
                  type="text"
                  value={supplierSearch}
                  onChange={(e) => {
                    setSupplierSearch(e.target.value);
                    setShowSupplierDropdown(true);
                  }}
                  onFocus={() => setShowSupplierDropdown(true)}
                  placeholder="Buscar fornecedor..."
                  className="w-full pl-10 pr-4 py-2 bg-theme-input border border-theme-input rounded-lg text-theme"
                />
                {showSupplierDropdown && suppliers?.suppliers && suppliers.suppliers.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-theme-card border border-theme rounded-lg shadow-lg max-h-48 overflow-auto">
                    {suppliers.suppliers.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => selectSupplier(s)}
                        className="w-full px-4 py-2 text-left hover:bg-theme-secondary text-theme"
                      >
                        <span className="font-medium">{s.companyName}</span>
                        {s.tradeName && (
                          <span className="text-sm text-theme-muted ml-2">
                            ({s.tradeName})
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Dados do Documento */}
        <div className="bg-theme-card border border-theme rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h2 className="text-lg font-semibold text-theme">Dados do Documento</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-theme mb-1">
                Tipo de Documento
              </label>
              <select
                value={form.documentType}
                onChange={(e) =>
                  setForm({ ...form, documentType: e.target.value as DocumentType })
                }
                className="w-full px-4 py-2 bg-theme-input border border-theme-input rounded-lg text-theme"
              >
                {documentTypes.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Número do Documento"
              value={form.documentNumber}
              onChange={(e) => setForm({ ...form, documentNumber: e.target.value })}
              placeholder="Ex: 12345"
            />

            <div className="md:col-span-2">
              <Input
                label="Descrição *"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Descrição da conta a pagar"
                required
              />
            </div>

            <Input
              label="Código de Barras"
              value={form.barcode}
              onChange={(e) => setForm({ ...form, barcode: e.target.value })}
              placeholder="Linha digitável do boleto"
            />

            <div>
              <label className="block text-sm font-medium text-theme mb-1">
                Centro de Custo
              </label>
              <select
                value={form.costCenterCode}
                onChange={(e) => setForm({ ...form, costCenterCode: e.target.value })}
                className="w-full px-4 py-2 bg-theme-input border border-theme-input rounded-lg text-theme"
              >
                <option value="">Selecione...</option>
                {costCenters?.map((cc) => (
                  <option key={cc.id} value={cc.code}>
                    {cc.code} - {cc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Valores e Vencimento */}
        <div className="bg-theme-card border border-theme rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
            <h2 className="text-lg font-semibold text-theme">Valores e Vencimento</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-theme mb-1">
                Valor Original *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted">
                  R$
                </span>
                <input
                  type="text"
                  value={form.originalValue}
                  onChange={(e) => setForm({ ...form, originalValue: e.target.value })}
                  placeholder="0,00"
                  className="w-full pl-10 pr-4 py-2 bg-theme-input border border-theme-input rounded-lg text-theme"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-theme mb-1">
                Data de Vencimento *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 bg-theme-input border border-theme-input rounded-lg text-theme"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-theme mb-1">
                  Parcela
                </label>
                <input
                  type="number"
                  min={1}
                  value={form.installmentNumber}
                  onChange={(e) =>
                    setForm({ ...form, installmentNumber: parseInt(e.target.value) || 1 })
                  }
                  className="w-full px-4 py-2 bg-theme-input border border-theme-input rounded-lg text-theme"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-theme mb-1">
                  de
                </label>
                <input
                  type="number"
                  min={1}
                  value={form.totalInstallments}
                  onChange={(e) =>
                    setForm({ ...form, totalInstallments: parseInt(e.target.value) || 1 })
                  }
                  className="w-full px-4 py-2 bg-theme-input border border-theme-input rounded-lg text-theme"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Retenções */}
        <div className="bg-theme-card border border-theme rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              <h2 className="text-lg font-semibold text-theme">Retenções de Impostos</h2>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.hasWithholding}
                onChange={(e) => setForm({ ...form, hasWithholding: e.target.checked })}
                className="w-4 h-4 rounded border-theme-input"
              />
              <span className="text-sm text-theme">Possui retenções</span>
            </label>
          </div>

          {form.hasWithholding && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Input
                label="IR"
                value={form.withholdingIr}
                onChange={(e) => setForm({ ...form, withholdingIr: e.target.value })}
                placeholder="0,00"
              />
              <Input
                label="ISS"
                value={form.withholdingIss}
                onChange={(e) => setForm({ ...form, withholdingIss: e.target.value })}
                placeholder="0,00"
              />
              <Input
                label="INSS"
                value={form.withholdingInss}
                onChange={(e) => setForm({ ...form, withholdingInss: e.target.value })}
                placeholder="0,00"
              />
              <Input
                label="PIS"
                value={form.withholdingPis}
                onChange={(e) => setForm({ ...form, withholdingPis: e.target.value })}
                placeholder="0,00"
              />
              <Input
                label="COFINS"
                value={form.withholdingCofins}
                onChange={(e) => setForm({ ...form, withholdingCofins: e.target.value })}
                placeholder="0,00"
              />
              <Input
                label="CSLL"
                value={form.withholdingCsll}
                onChange={(e) => setForm({ ...form, withholdingCsll: e.target.value })}
                placeholder="0,00"
              />
            </div>
          )}

          {form.hasWithholding && form.originalValue && (
            <div className="pt-4 border-t border-theme">
              <div className="flex justify-between text-sm">
                <span className="text-theme-muted">Valor Líquido:</span>
                <span className="font-semibold text-theme">
                  R$ {calculateNetValue().toFixed(2).replace(".", ",")}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Observações */}
        <div className="bg-theme-card border border-theme rounded-lg p-6">
          <label className="block text-sm font-medium text-theme mb-1">
            Observações
          </label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={3}
            placeholder="Observações adicionais..."
            className="w-full px-4 py-2 bg-theme-input border border-theme-input rounded-lg text-theme resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <Link href="/payables">
            <Button
              type="button"
              variant="secondary"
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Cancelar
            </Button>
          </Link>
          <Button
            type="submit"
            isLoading={createMutation.isPending}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Salvar
          </Button>
        </div>
      </form>
    </div>
  );
}
