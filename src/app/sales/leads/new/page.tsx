"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Input } from "@/components/ui/Input";
import { Users, Loader2, Save } from "lucide-react";

export default function NewLeadPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    source: "OTHER" as const,
    estimatedValue: "",
    probability: "50",
    expectedCloseDate: "",
    description: "",
    notes: "",
  });

  const createMutation = trpc.leads.create.useMutation({
    onSuccess: (lead) => {
      router.push(`/sales/leads/${lead.id}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      companyName: formData.companyName,
      contactName: formData.contactName || undefined,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      source: formData.source,
      estimatedValue: formData.estimatedValue ? parseFloat(formData.estimatedValue) : undefined,
      probability: formData.probability ? parseInt(formData.probability) : undefined,
      expectedCloseDate: formData.expectedCloseDate || undefined,
      description: formData.description || undefined,
      notes: formData.notes || undefined,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Novo Lead"
        icon={<Users className="w-6 h-6" />}
        backHref="/sales/leads"
        module="sales"
      />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados Básicos */}
          <div className="bg-theme-card rounded-lg border border-theme p-6">
            <h2 className="text-lg font-semibold text-theme mb-4">Dados do Lead</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Input
                  label="Nome da Empresa *"
                  required
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="Nome da empresa ou pessoa"
                />
              </div>
              <Input
                label="Nome do Contato"
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                placeholder="Nome do contato principal"
              />
              <div>
                <label className="block text-sm font-medium text-theme mb-1">
                  Origem
                </label>
                <select
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value as typeof formData.source })}
                  className="w-full border border-theme-input rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="WEBSITE">Site</option>
                  <option value="REFERRAL">Indicação</option>
                  <option value="COLD_CALL">Prospecção</option>
                  <option value="TRADE_SHOW">Feira</option>
                  <option value="SOCIAL_MEDIA">Redes Sociais</option>
                  <option value="EMAIL">Email</option>
                  <option value="OTHER">Outros</option>
                </select>
              </div>
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@empresa.com"
              />
              <Input
                label="Telefone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>

          {/* Oportunidade */}
          <div className="bg-theme-card rounded-lg border border-theme p-6">
            <h2 className="text-lg font-semibold text-theme mb-4">Oportunidade</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Valor Estimado (R$)"
                type="number"
                step="0.01"
                min="0"
                value={formData.estimatedValue}
                onChange={(e) => setFormData({ ...formData, estimatedValue: e.target.value })}
                placeholder="0,00"
              />
              <Input
                label="Probabilidade (%)"
                type="number"
                min="0"
                max="100"
                value={formData.probability}
                onChange={(e) => setFormData({ ...formData, probability: e.target.value })}
              />
              <Input
                label="Previsão de Fechamento"
                type="date"
                value={formData.expectedCloseDate}
                onChange={(e) => setFormData({ ...formData, expectedCloseDate: e.target.value })}
              />
            </div>
          </div>

          {/* Descrição */}
          <div className="bg-theme-card rounded-lg border border-theme p-6">
            <h2 className="text-lg font-semibold text-theme mb-4">Detalhes</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-theme mb-1">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full border border-theme-input rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Descreva a oportunidade..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-theme mb-1">
                  Observações
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full border border-theme-input rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Observações internas..."
                />
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="flex items-center justify-end gap-4">
            <Link
              href="/sales/leads"
              className="px-4 py-2 text-theme-muted hover:text-theme-secondary"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={createMutation.isPending || !formData.companyName.trim()}
              className="flex items-center gap-2 px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
            >
              {createMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Salvar Lead
            </button>
          </div>

          {createMutation.isError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              Erro ao criar lead: {createMutation.error.message}
            </div>
          )}
        </form>
      </main>
    </div>
  );
}
