"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/formatters";
import { PageHeader } from "@/components/PageHeader";
import {
  Users,
  Loader2,
  Edit,
  Trash2,
  Phone,
  Mail,
  Building,
  Calendar,
  DollarSign,
  Percent,
  MessageSquare,
  CheckCircle,
  UserPlus,
  Plus,
} from "lucide-react";

const statusConfig: Record<string, { label: string; color: string }> = {
  NEW: { label: "Novo", color: "bg-blue-100 text-blue-800" },
  CONTACTED: { label: "Contatado", color: "bg-yellow-100 text-yellow-800" },
  QUALIFIED: { label: "Qualificado", color: "bg-purple-100 text-purple-800" },
  PROPOSAL: { label: "Proposta", color: "bg-indigo-100 text-indigo-800" },
  NEGOTIATION: { label: "Negociação", color: "bg-orange-100 text-orange-800" },
  WON: { label: "Ganho", color: "bg-green-100 text-green-800" },
  LOST: { label: "Perdido", color: "bg-red-100 text-red-800" },
};

const sourceLabels: Record<string, string> = {
  WEBSITE: "Site",
  REFERRAL: "Indicação",
  COLD_CALL: "Prospecção",
  TRADE_SHOW: "Feira",
  SOCIAL_MEDIA: "Redes Sociais",
  EMAIL: "Email",
  OTHER: "Outros",
};

const activityTypeLabels: Record<string, string> = {
  CALL: "Ligação",
  EMAIL: "Email",
  MEETING: "Reunião",
  NOTE: "Nota",
  TASK: "Tarefa",
};

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [showActivityForm, setShowActivityForm] = useState(false);
  const [activityType, setActivityType] = useState<string>("NOTE");
  const [activitySubject, setActivitySubject] = useState("");
  const [activityDescription, setActivityDescription] = useState("");

  const { data: lead, isLoading, refetch } = trpc.leads.byId.useQuery({ id });
  const utils = trpc.useUtils();

  const deleteMutation = trpc.leads.delete.useMutation({
    onSuccess: () => {
      router.push("/sales/leads");
    },
  });

  const addActivityMutation = trpc.leads.addActivity.useMutation({
    onSuccess: () => {
      setShowActivityForm(false);
      setActivitySubject("");
      setActivityDescription("");
      refetch();
    },
  });

  const completeActivityMutation = trpc.leads.completeActivity.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const convertMutation = trpc.leads.convertToCustomer.useMutation({
    onSuccess: () => {
      utils.leads.byId.invalidate({ id });
      refetch();
    },
  });

  const handleDelete = () => {
    if (confirm("Tem certeza que deseja excluir este lead?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleAddActivity = () => {
    if (!activitySubject.trim()) return;
    addActivityMutation.mutate({
      leadId: id,
      type: activityType as "CALL" | "EMAIL" | "MEETING" | "NOTE" | "TASK",
      subject: activitySubject,
      description: activityDescription || undefined,
    });
  };

  const handleConvert = () => {
    if (confirm("Converter este lead em cliente?")) {
      convertMutation.mutate({ leadId: id });
    }
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

  const config = statusConfig[lead.status] || statusConfig.NEW;

  return (
    <div className="space-y-6">
      <PageHeader
        title={lead.companyName}
        icon={<Users className="w-6 h-6" />}
        backHref="/sales/leads"
        module="sales"
        badge={{ label: config.label, color: config.color.split(" ")[1], bgColor: config.color.split(" ")[0] }}
        actions={
          <div className="flex items-center gap-2">
            {!lead.customerId && lead.status !== "LOST" && (
              <button
                onClick={handleConvert}
                disabled={convertMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                <UserPlus className="w-4 h-4" />
                Converter em Cliente
              </button>
            )}
            <Link
              href={`/sales/leads/${id}/edit`}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Edit className="w-4 h-4" />
              Editar
            </Link>
            <button
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        }
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Info Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Dados do Lead */}
            <div className="bg-theme-card rounded-lg border border-theme p-6">
              <h2 className="text-lg font-semibold text-theme mb-4">Informações do Lead</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-theme-muted">Código</label>
                  <p className="text-theme font-medium">{lead.code}</p>
                </div>
                <div>
                  <label className="text-sm text-theme-muted">Origem</label>
                  <p className="text-theme">{sourceLabels[lead.source] || lead.source}</p>
                </div>
                {lead.contactName && (
                  <div>
                    <label className="text-sm text-theme-muted">Contato</label>
                    <p className="text-theme">{lead.contactName}</p>
                  </div>
                )}
                {lead.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-theme-muted" />
                    <a href={`mailto:${lead.email}`} className="text-orange-600 hover:underline">
                      {lead.email}
                    </a>
                  </div>
                )}
                {lead.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-theme-muted" />
                    <a href={`tel:${lead.phone}`} className="text-orange-600 hover:underline">
                      {lead.phone}
                    </a>
                  </div>
                )}
                {lead.assignedUser && (
                  <div>
                    <label className="text-sm text-theme-muted">Responsável</label>
                    <p className="text-theme">{lead.assignedUser.name}</p>
                  </div>
                )}
              </div>
              {lead.description && (
                <div className="mt-4">
                  <label className="text-sm text-theme-muted">Descrição</label>
                  <p className="text-theme whitespace-pre-wrap">{lead.description}</p>
                </div>
              )}
              {lead.notes && (
                <div className="mt-4">
                  <label className="text-sm text-theme-muted">Observações</label>
                  <p className="text-theme whitespace-pre-wrap">{lead.notes}</p>
                </div>
              )}
            </div>

            {/* Atividades */}
            <div className="bg-theme-card rounded-lg border border-theme p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-theme">Atividades</h2>
                <button
                  onClick={() => setShowActivityForm(!showActivityForm)}
                  className="flex items-center gap-2 px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200"
                >
                  <Plus className="w-4 h-4" />
                  Nova Atividade
                </button>
              </div>

              {showActivityForm && (
                <div className="mb-4 p-4 bg-theme-tertiary rounded-lg">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm text-theme-muted mb-1">Tipo</label>
                      <select
                        value={activityType}
                        onChange={(e) => setActivityType(e.target.value)}
                        className="w-full border border-theme-input rounded-lg px-3 py-2"
                      >
                        <option value="CALL">Ligação</option>
                        <option value="EMAIL">Email</option>
                        <option value="MEETING">Reunião</option>
                        <option value="NOTE">Nota</option>
                        <option value="TASK">Tarefa</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-theme-muted mb-1">Assunto</label>
                      <input
                        type="text"
                        value={activitySubject}
                        onChange={(e) => setActivitySubject(e.target.value)}
                        className="w-full border border-theme-input rounded-lg px-3 py-2"
                        placeholder="Assunto da atividade"
                      />
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm text-theme-muted mb-1">Descrição</label>
                    <textarea
                      value={activityDescription}
                      onChange={(e) => setActivityDescription(e.target.value)}
                      className="w-full border border-theme-input rounded-lg px-3 py-2"
                      rows={3}
                      placeholder="Detalhes da atividade..."
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setShowActivityForm(false)}
                      className="px-4 py-2 text-theme-muted hover:text-theme-secondary"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleAddActivity}
                      disabled={!activitySubject.trim() || addActivityMutation.isPending}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                    >
                      Adicionar
                    </button>
                  </div>
                </div>
              )}

              {lead.activities.length === 0 ? (
                <p className="text-theme-muted text-center py-4">Nenhuma atividade registrada</p>
              ) : (
                <div className="space-y-3">
                  {lead.activities.map((activity) => (
                    <div
                      key={activity.id}
                      className={`p-3 rounded-lg border ${
                        activity.completedAt ? "bg-green-50 border-green-200" : "bg-theme-tertiary border-theme"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-theme-muted" />
                            <span className="text-xs text-theme-muted">
                              {activityTypeLabels[activity.type] || activity.type}
                            </span>
                            <span className="text-xs text-theme-muted">•</span>
                            <span className="text-xs text-theme-muted">
                              {formatDateTime(activity.createdAt)}
                            </span>
                          </div>
                          <p className="font-medium text-theme mt-1">{activity.subject}</p>
                          {activity.description && (
                            <p className="text-sm text-theme-secondary mt-1">{activity.description}</p>
                          )}
                        </div>
                        {!activity.completedAt && (
                          <button
                            onClick={() => completeActivityMutation.mutate({ activityId: activity.id })}
                            disabled={completeActivityMutation.isPending}
                            className="p-1 text-green-600 hover:bg-green-100 rounded"
                            title="Marcar como concluída"
                          >
                            <CheckCircle className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Métricas */}
            <div className="bg-theme-card rounded-lg border border-theme p-6">
              <h2 className="text-lg font-semibold text-theme mb-4">Oportunidade</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-theme-muted">
                    <DollarSign className="w-4 h-4" />
                    Valor Estimado
                  </div>
                  <span className="font-semibold text-theme">
                    {formatCurrency(lead.estimatedValue)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-theme-muted">
                    <Percent className="w-4 h-4" />
                    Probabilidade
                  </div>
                  <span className="font-semibold text-theme">{lead.probability}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-theme-muted">
                    <Calendar className="w-4 h-4" />
                    Previsão
                  </div>
                  <span className="text-theme">
                    {lead.expectedCloseDate ? formatDate(lead.expectedCloseDate) : "-"}
                  </span>
                </div>
                {lead.lastContactAt && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-theme-muted">
                      <Phone className="w-4 h-4" />
                      Último Contato
                    </div>
                    <span className="text-theme">{formatDate(lead.lastContactAt)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Cliente Vinculado */}
            {lead.customer && (
              <div className="bg-theme-card rounded-lg border border-theme p-6">
                <h2 className="text-lg font-semibold text-theme mb-4">Cliente Vinculado</h2>
                <Link
                  href={`/customers/${lead.customer.id}`}
                  className="flex items-center gap-3 p-3 bg-green-50 rounded-lg hover:bg-green-100"
                >
                  <Building className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">{lead.customer.companyName}</p>
                    <p className="text-sm text-green-600">Código: {lead.customer.code}</p>
                  </div>
                </Link>
              </div>
            )}

            {/* Datas */}
            <div className="bg-theme-card rounded-lg border border-theme p-6">
              <h2 className="text-lg font-semibold text-theme mb-4">Histórico</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-theme-muted">Criado em</span>
                  <span className="text-theme">{formatDateTime(lead.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-theme-muted">Atualizado em</span>
                  <span className="text-theme">{formatDateTime(lead.updatedAt)}</span>
                </div>
                {lead.wonAt && (
                  <div className="flex justify-between text-green-600">
                    <span>Ganho em</span>
                    <span>{formatDateTime(lead.wonAt)}</span>
                  </div>
                )}
                {lead.lostAt && (
                  <div className="flex justify-between text-red-600">
                    <span>Perdido em</span>
                    <span>{formatDateTime(lead.lostAt)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
