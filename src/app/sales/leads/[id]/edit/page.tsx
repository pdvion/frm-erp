"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Users, Loader2, Save } from "lucide-react";

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
      <PageHeader
        title="Editar Lead"
        icon={<Users className="w-6 h-6" />}
        backHref={`/sales/leads/${id}`}
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
                />
              </div>
              <Input
                label="Nome do Contato"
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
              />
              <div>
                <label className="block text-sm font-medium text-theme mb-1">
                  Status
                </label>
                <Select
                  value={formData.status}
                  onChange={(value) => setFormData({ ...formData, status: value as typeof formData.status })}
                  options={[
                    { value: "NEW", label: "Novo" },
                    { value: "CONTACTED", label: "Contatado" },
                    { value: "QUALIFIED", label: "Qualificado" },
                    { value: "PROPOSAL", label: "Proposta" },
                    { value: "NEGOTIATION", label: "Negociação" },
                    { value: "WON", label: "Ganho" },
                    { value: "LOST", label: "Perdido" },
                  ]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-theme mb-1">
                  Origem
                </label>
                <Select
                  value={formData.source}
                  onChange={(value) => setFormData({ ...formData, source: value as typeof formData.source })}
                  options={[
                    { value: "WEBSITE", label: "Site" },
                    { value: "REFERRAL", label: "Indicação" },
                    { value: "COLD_CALL", label: "Prospecção" },
                    { value: "TRADE_SHOW", label: "Feira" },
                    { value: "SOCIAL_MEDIA", label: "Redes Sociais" },
                    { value: "EMAIL", label: "Email" },
                    { value: "OTHER", label: "Outros" },
                  ]}
                />
              </div>
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              <Input
                label="Telefone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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

          {/* Motivo da Perda */}
          {formData.status === "LOST" && (
            <div className="bg-theme-card rounded-lg border border-red-200 p-6">
              <h2 className="text-lg font-semibold text-red-700 mb-4">Motivo da Perda</h2>
              <Textarea
                value={formData.lostReason}
                onChange={(e) => setFormData({ ...formData, lostReason: e.target.value })}
                rows={3}
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
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-theme mb-1">
                  Observações
                </label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
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
            <Button
              type="submit"
              disabled={!formData.companyName.trim()}
              isLoading={updateMutation.isPending}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Salvar Alterações
            </Button>
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
