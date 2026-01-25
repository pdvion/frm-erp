"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { Users, ChevronLeft, Loader2, Save } from "lucide-react";

export default function EditLeadPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: lead, isLoading } = trpc.leads.byId.useQuery({ id });

  const [formData, setFormData] = useState({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    source: "OTHER" as "WEBSITE" | "REFERRAL" | "COLD_CALL" | "TRADE_SHOW" | "SOCIAL_MEDIA" | "EMAIL" | "OTHER",
    status: "NEW" as "NEW" | "CONTACTED" | "QUALIFIED" | "PROPOSAL" | "NEGOTIATION" | "WON" | "LOST",
    estimatedValue: "",
    probability: "50",
    expectedCloseDate: "",
    description: "",
    notes: "",
    lostReason: "",
  });

  useEffect(() => {
    if (lead) {
      setFormData({
        companyName: lead.companyName || "",
        contactName: lead.contactName || "",
        email: lead.email || "",
        phone: lead.phone || "",
        source: lead.source as "WEBSITE" | "REFERRAL" | "COLD_CALL" | "TRADE_SHOW" | "SOCIAL_MEDIA" | "EMAIL" | "OTHER",
        status: lead.status as "NEW" | "CONTACTED" | "QUALIFIED" | "PROPOSAL" | "NEGOTIATION" | "WON" | "LOST",
        estimatedValue: lead.estimatedValue?.toString() || "",
        probability: lead.probability?.toString() || "50",
        expectedCloseDate: lead.expectedCloseDate ? new Date(lead.expectedCloseDate).toISOString().split("T")[0] : "",
        description: lead.description || "",
        notes: lead.notes || "",
        lostReason: lead.lostReason || "",
      });
    }
  }, [lead]);

  const updateMutation = trpc.leads.update.useMutation({
    onSuccess: () => {
      router.push(`/sales/leads/${id}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      id,
      companyName: formData.companyName,
      contactName: formData.contactName || undefined,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      source: formData.source,
      status: formData.status,
      estimatedValue: formData.estimatedValue ? parseFloat(formData.estimatedValue) : undefined,
      probability: formData.probability ? parseInt(formData.probability) : undefined,
      expectedCloseDate: formData.expectedCloseDate || undefined,
      description: formData.description || undefined,
      notes: formData.notes || undefined,
      lostReason: formData.status === "LOST" ? formData.lostReason || undefined : undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-theme-muted mb-4">Lead não encontrado</p>
        <Link href="/sales/leads" className="text-orange-600 hover:underline">
          Voltar para lista
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="bg-theme-card border-b border-theme sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href={`/sales/leads/${id}`} className="text-theme-muted hover:text-theme-secondary">
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <Users className="w-6 h-6 text-orange-600" />
                <h1 className="text-xl font-semibold text-theme">Editar Lead</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados Básicos */}
          <div className="bg-theme-card rounded-lg border border-theme p-6">
            <h2 className="text-lg font-semibold text-theme mb-4">Dados do Lead</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-theme mb-1">
                  Nome da Empresa *
                </label>
                <input
                  type="text"
                  required
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full border border-theme-input rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-theme mb-1">
                  Nome do Contato
                </label>
                <input
                  type="text"
                  value={formData.contactName}
                  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                  className="w-full border border-theme-input rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-theme mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as typeof formData.status })}
                  className="w-full border border-theme-input rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="NEW">Novo</option>
                  <option value="CONTACTED">Contatado</option>
                  <option value="QUALIFIED">Qualificado</option>
                  <option value="PROPOSAL">Proposta</option>
                  <option value="NEGOTIATION">Negociação</option>
                  <option value="WON">Ganho</option>
                  <option value="LOST">Perdido</option>
                </select>
              </div>
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
              <div>
                <label className="block text-sm font-medium text-theme mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full border border-theme-input rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-theme mb-1">
                  Telefone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full border border-theme-input rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Oportunidade */}
          <div className="bg-theme-card rounded-lg border border-theme p-6">
            <h2 className="text-lg font-semibold text-theme mb-4">Oportunidade</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-theme mb-1">
                  Valor Estimado (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.estimatedValue}
                  onChange={(e) => setFormData({ ...formData, estimatedValue: e.target.value })}
                  className="w-full border border-theme-input rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-theme mb-1">
                  Probabilidade (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.probability}
                  onChange={(e) => setFormData({ ...formData, probability: e.target.value })}
                  className="w-full border border-theme-input rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-theme mb-1">
                  Previsão de Fechamento
                </label>
                <input
                  type="date"
                  value={formData.expectedCloseDate}
                  onChange={(e) => setFormData({ ...formData, expectedCloseDate: e.target.value })}
                  className="w-full border border-theme-input rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Motivo da Perda */}
          {formData.status === "LOST" && (
            <div className="bg-theme-card rounded-lg border border-red-200 p-6">
              <h2 className="text-lg font-semibold text-red-700 mb-4">Motivo da Perda</h2>
              <textarea
                value={formData.lostReason}
                onChange={(e) => setFormData({ ...formData, lostReason: e.target.value })}
                rows={3}
                className="w-full border border-red-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="Descreva o motivo da perda do lead..."
              />
            </div>
          )}

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
                />
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="flex items-center justify-end gap-4">
            <Link
              href={`/sales/leads/${id}`}
              className="px-4 py-2 text-theme-muted hover:text-theme-secondary"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={updateMutation.isPending || !formData.companyName.trim()}
              className="flex items-center gap-2 px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
            >
              {updateMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Salvar Alterações
            </button>
          </div>

          {updateMutation.isError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              Erro ao atualizar lead: {updateMutation.error.message}
            </div>
          )}
        </form>
      </main>
    </div>
  );
}
