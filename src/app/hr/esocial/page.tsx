"use client";

import { useState } from "react";
import {
  FileText,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Package,
  Settings,
  ChevronDown,
  ChevronRight,
  Zap,
  BarChart3,
  Filter,
  Shield,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import type { ESocialEventType } from "@/server/services/esocial";

// ============================================================================
// STATUS CONFIG
// ============================================================================

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  DRAFT: { label: "Rascunho", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300", icon: FileText },
  VALIDATED: { label: "Validado", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: Shield },
  QUEUED: { label: "Na Fila", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400", icon: Clock },
  SENT: { label: "Enviado", color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400", icon: Send },
  ACCEPTED: { label: "Aceito", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle },
  REJECTED: { label: "Rejeitado", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", icon: XCircle },
  CANCELLED: { label: "Cancelado", color: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500", icon: XCircle },
  EXCLUDED: { label: "Excluído", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400", icon: AlertTriangle },
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  S_1000: "S-1000 Empregador",
  S_1005: "S-1005 Estabelecimentos",
  S_1010: "S-1010 Rubricas",
  S_1020: "S-1020 Lotações",
  S_1200: "S-1200 Remuneração",
  S_1210: "S-1210 Pagamentos",
  S_1299: "S-1299 Fechamento",
  S_2190: "S-2190 Registro Preliminar",
  S_2200: "S-2200 Admissão",
  S_2205: "S-2205 Alt. Cadastral",
  S_2206: "S-2206 Alt. Contratual",
  S_2230: "S-2230 Afastamento",
  S_2299: "S-2299 Desligamento",
  S_2300: "S-2300 TSV Início",
  S_3000: "S-3000 Exclusão",
};

const BATCH_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  OPEN: { label: "Aberto", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  CLOSED: { label: "Fechado", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
  SENDING: { label: "Enviando", color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400" },
  SENT: { label: "Enviado", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
  PROCESSED: { label: "Processado", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  ERROR: { label: "Erro", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
};

// ============================================================================
// COMPONENT
// ============================================================================

type TabId = "dashboard" | "events" | "batches" | "rubrics" | "config";

export default function ESocialPage() {
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().getMonth() + 1);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  const utils = trpc.useUtils();

  // Queries
  const { data: dashboard, isLoading: dashLoading } = trpc.esocial.getDashboard.useQuery();
  const { data: eventsData, isLoading: eventsLoading } = trpc.esocial.listEvents.useQuery(
    {
      year: selectedYear,
      month: selectedMonth,
      status: (statusFilter || undefined) as "DRAFT" | "VALIDATED" | "QUEUED" | "SENT" | "ACCEPTED" | "REJECTED" | "CANCELLED" | "EXCLUDED" | undefined,
      eventType: (typeFilter || undefined) as ESocialEventType | undefined,
      limit: 50,
    },
    { enabled: activeTab === "events" || activeTab === "dashboard" }
  );
  const { data: batches, isLoading: batchesLoading } = trpc.esocial.listBatches.useQuery(
    undefined,
    { enabled: activeTab === "batches" }
  );
  const { data: rubrics } = trpc.esocial.listRubrics.useQuery(
    undefined,
    { enabled: activeTab === "rubrics" }
  );
  const { data: config } = trpc.esocial.getConfig.useQuery(
    undefined,
    { enabled: activeTab === "config" }
  );

  // Mutations
  const generateMut = trpc.esocial.generateEvents.useMutation({
    onSuccess: () => {
      utils.esocial.listEvents.invalidate();
      utils.esocial.getDashboard.invalidate();
      setShowGenerateModal(false);
    },
  });
  const validateMut = trpc.esocial.validateEvent.useMutation({
    onSuccess: () => utils.esocial.listEvents.invalidate(),
  });
  const createBatchMut = trpc.esocial.createBatch.useMutation({
    onSuccess: () => utils.esocial.listBatches.invalidate(),
  });
  const addToBatchMut = trpc.esocial.addEventsToBatch.useMutation({
    onSuccess: () => {
      utils.esocial.listEvents.invalidate();
      utils.esocial.listBatches.invalidate();
      setSelectedEvents(new Set());
    },
  });
  const closeBatchMut = trpc.esocial.closeBatch.useMutation({
    onSuccess: () => utils.esocial.listBatches.invalidate(),
  });
  const sendBatchMut = trpc.esocial.sendBatch.useMutation({
    onSuccess: () => {
      utils.esocial.listBatches.invalidate();
      utils.esocial.listEvents.invalidate();
      utils.esocial.getDashboard.invalidate();
    },
  });
  const checkResultMut = trpc.esocial.checkBatchResult.useMutation({
    onSuccess: () => {
      utils.esocial.listBatches.invalidate();
      utils.esocial.listEvents.invalidate();
      utils.esocial.getDashboard.invalidate();
    },
  });
  const upsertConfigMut = trpc.esocial.upsertConfig.useMutation({
    onSuccess: () => utils.esocial.getConfig.invalidate(),
  });

  const tabs: { id: TabId; label: string; icon: typeof FileText }[] = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "events", label: "Eventos", icon: FileText },
    { id: "batches", label: "Lotes", icon: Package },
    { id: "rubrics", label: "Rubricas", icon: FileText },
    { id: "config", label: "Configuração", icon: Settings },
  ];

  const toggleEventSelection = (id: string) => {
    setSelectedEvents(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAllDraftEvents = () => {
    const draftIds = (eventsData?.events ?? [])
      .filter((e: Record<string, unknown>) => e.status === "DRAFT" || e.status === "VALIDATED")
      .map((e: Record<string, unknown>) => e.id as string);
    setSelectedEvents(new Set(draftIds));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="eSocial"
        icon={<Shield className="w-6 h-6 text-blue-600" />}
        backHref="/hr"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              leftIcon={<RefreshCw className="w-4 h-4" />}
              onClick={() => {
                utils.esocial.getDashboard.invalidate();
                utils.esocial.listEvents.invalidate();
              }}
            >
              Atualizar
            </Button>
            <Button
              onClick={() => setShowGenerateModal(true)}
              leftIcon={<Zap className="w-4 h-4" />}
            >
              Gerar Eventos
            </Button>
          </div>
        }
      />

      {/* Tabs */}
      <div role="tablist" aria-label="Seções do eSocial" className="flex gap-1 border-b border-theme overflow-x-auto">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`tabpanel-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400"
                  : "border-transparent text-theme-secondary hover:text-theme-primary hover:border-gray-300 dark:hover:border-gray-600"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "dashboard" && <DashboardTab dashboard={dashboard} isLoading={dashLoading} />}
      {activeTab === "events" && (
        <EventsTab
          events={eventsData?.events ?? []}
          total={eventsData?.total ?? 0}
          isLoading={eventsLoading}
          selectedYear={selectedYear}
          selectedMonth={selectedMonth}
          statusFilter={statusFilter}
          typeFilter={typeFilter}
          selectedEvents={selectedEvents}
          expandedEvent={expandedEvent}
          onYearChange={setSelectedYear}
          onMonthChange={setSelectedMonth}
          onStatusFilter={setStatusFilter}
          onTypeFilter={setTypeFilter}
          onToggleSelect={toggleEventSelection}
          onSelectAllDraft={selectAllDraftEvents}
          onExpandEvent={setExpandedEvent}
          onValidate={(id) => validateMut.mutate({ id })}
          onCreateBatchFromSelected={async () => {
            const batch = await createBatchMut.mutateAsync({ groupType: "PERIODIC" });
            await addToBatchMut.mutateAsync({ batchId: batch.id, eventIds: Array.from(selectedEvents) });
          }}
          isValidating={validateMut.isPending}
          isCreatingBatch={createBatchMut.isPending || addToBatchMut.isPending}
        />
      )}
      {activeTab === "batches" && (
        <BatchesTab
          batches={batches ?? []}
          isLoading={batchesLoading}
          onClose={(id) => closeBatchMut.mutate({ batchId: id })}
          onSend={(id) => sendBatchMut.mutate({ batchId: id })}
          onCheckResult={(id) => checkResultMut.mutate({ batchId: id })}
          isClosing={closeBatchMut.isPending}
          isSending={sendBatchMut.isPending}
          isChecking={checkResultMut.isPending}
        />
      )}
      {activeTab === "rubrics" && <RubricsTab rubrics={rubrics ?? []} />}
      {activeTab === "config" && (
        <ConfigTab
          config={config}
          onSave={(data) => upsertConfigMut.mutate(data)}
          isSaving={upsertConfigMut.isPending}
        />
      )}

      {/* Generate Modal */}
      {showGenerateModal && (
        <GenerateModal
          year={selectedYear}
          month={selectedMonth}
          onGenerate={(year, month, types) => {
            generateMut.mutate({ year, month, eventTypes: types.length > 0 ? types as ESocialEventType[] : undefined });
          }}
          onClose={() => setShowGenerateModal(false)}
          isLoading={generateMut.isPending}
          result={generateMut.data}
        />
      )}
    </div>
  );
}

// ============================================================================
// DASHBOARD TAB
// ============================================================================

function DashboardTab({ dashboard, isLoading }: { dashboard: unknown; isLoading: boolean }) {
  const d = dashboard as {
    totalEvents: number;
    pendingCount: number;
    sentCount: number;
    acceptedCount: number;
    rejectedCount: number;
    openBatches: number;
    lastSentAt: string | null;
    byType: Record<string, number>;
  } | undefined;

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-theme-card border border-theme rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-theme-tertiary rounded w-20 mb-2" />
            <div className="h-8 bg-theme-tertiary rounded w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (!d) {
    return (
      <div className="text-center py-12 text-theme-secondary">
        <Shield className="w-12 h-12 mx-auto mb-4 opacity-30" />
        <p className="text-lg font-medium">Nenhum dado eSocial ainda</p>
        <p className="text-sm mt-1">Gere eventos para começar a usar o módulo</p>
      </div>
    );
  }

  const kpis = [
    { label: "Total de Eventos", value: d.totalEvents, icon: FileText, color: "text-blue-600 dark:text-blue-400" },
    { label: "Pendentes", value: d.pendingCount, icon: Clock, color: "text-yellow-600 dark:text-yellow-400" },
    { label: "Enviados", value: d.sentCount, icon: Send, color: "text-indigo-600 dark:text-indigo-400" },
    { label: "Aceitos", value: d.acceptedCount, icon: CheckCircle, color: "text-green-600 dark:text-green-400" },
    { label: "Rejeitados", value: d.rejectedCount, icon: XCircle, color: "text-red-600 dark:text-red-400" },
    { label: "Lotes Abertos", value: d.openBatches, icon: Package, color: "text-purple-600 dark:text-purple-400" },
  ];

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="bg-theme-card border border-theme rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-4 h-4 ${kpi.color}`} />
                <span className="text-xs text-theme-secondary">{kpi.label}</span>
              </div>
              <p className="text-2xl font-bold text-theme-primary">{kpi.value}</p>
            </div>
          );
        })}
      </div>

      {/* Events by Type */}
      {Object.keys(d.byType).length > 0 && (
        <div className="bg-theme-card border border-theme rounded-lg p-4">
          <h3 className="text-sm font-semibold text-theme-primary mb-3">Eventos por Tipo</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {Object.entries(d.byType)
              .sort(([, a], [, b]) => b - a)
              .map(([type, count]) => (
                <div key={type} className="flex items-center justify-between p-2 bg-theme-secondary/5 rounded">
                  <span className="text-xs text-theme-secondary truncate">
                    {EVENT_TYPE_LABELS[type] ?? type}
                  </span>
                  <span className="text-sm font-semibold text-theme-primary ml-2">{count}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Last Sent */}
      {d.lastSentAt && (
        <p className="text-xs text-theme-secondary">
          Último envio: {new Date(d.lastSentAt).toLocaleString("pt-BR")}
        </p>
      )}
    </div>
  );
}

// ============================================================================
// EVENTS TAB
// ============================================================================

interface EventsTabProps {
  events: Array<Record<string, unknown>>;
  total: number;
  isLoading: boolean;
  selectedYear: number;
  selectedMonth: number;
  statusFilter: string;
  typeFilter: string;
  selectedEvents: Set<string>;
  expandedEvent: string | null;
  onYearChange: (y: number) => void;
  onMonthChange: (m: number) => void;
  onStatusFilter: (s: string) => void;
  onTypeFilter: (t: string) => void;
  onToggleSelect: (id: string) => void;
  onSelectAllDraft: () => void;
  onExpandEvent: (id: string | null) => void;
  onValidate: (id: string) => void;
  onCreateBatchFromSelected: () => void;
  isValidating: boolean;
  isCreatingBatch: boolean;
}

function EventsTab(props: EventsTabProps) {
  const {
    events, total, isLoading,
    selectedYear, selectedMonth, statusFilter, typeFilter,
    selectedEvents, expandedEvent,
    onYearChange, onMonthChange, onStatusFilter, onTypeFilter,
    onToggleSelect, onSelectAllDraft, onExpandEvent,
    onValidate, onCreateBatchFromSelected,
    isValidating, isCreatingBatch,
  } = props;

  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-theme-secondary" />
          <Select
            value={String(selectedMonth)}
            onChange={(value) => onMonthChange(Number(value))}
            options={months.map((m, i) => ({ value: String(i + 1), label: m }))}
          />
          <Select
            value={String(selectedYear)}
            onChange={(value) => onYearChange(Number(value))}
            options={[2024, 2025, 2026].map(y => ({ value: String(y), label: String(y) }))}
          />
        </div>

        <Select
          value={statusFilter}
          onChange={(value) => onStatusFilter(value)}
          placeholder="Todos os Status"
          options={[
            { value: "", label: "Todos os Status" },
            ...Object.entries(STATUS_CONFIG).map(([key, cfg]) => ({ value: key, label: cfg.label })),
          ]}
        />

        <Select
          value={typeFilter}
          onChange={(value) => onTypeFilter(value)}
          placeholder="Todos os Tipos"
          options={[
            { value: "", label: "Todos os Tipos" },
            ...Object.entries(EVENT_TYPE_LABELS).map(([key, label]) => ({ value: key, label })),
          ]}
        />

        <span className="text-xs text-theme-secondary ml-auto">{total} evento(s)</span>
      </div>

      {/* Bulk Actions */}
      {selectedEvents.size > 0 && (
        <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
            {selectedEvents.size} selecionado(s)
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={onCreateBatchFromSelected}
            disabled={isCreatingBatch}
            leftIcon={<Package className="w-4 h-4" />}
          >
            {isCreatingBatch ? "Criando..." : "Criar Lote"}
          </Button>
        </div>
      )}

      {/* Events List */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-theme-card border border-theme rounded-lg p-4 animate-pulse">
              <div className="h-4 bg-theme-tertiary rounded w-1/3 mb-2" />
              <div className="h-3 bg-theme-tertiary rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-12 text-theme-secondary">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">Nenhum evento encontrado</p>
          <p className="text-sm mt-1">Gere eventos para o período selecionado</p>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Select All */}
          <div className="flex items-center gap-2 px-4 py-2">
            <button onClick={onSelectAllDraft} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
              Selecionar todos pendentes
            </button>
          </div>

          {events.map((event) => {
            const id = event.id as string;
            const status = event.status as string;
            const eventType = event.eventType as string;
            const statusCfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.DRAFT;
            const StatusIcon = statusCfg.icon;
            const isExpanded = expandedEvent === id;
            const isSelected = selectedEvents.has(id);
            const employee = event.employee as { name: string; cpf: string; code: number } | null;

            return (
              <div key={id} className="bg-theme-card border border-theme rounded-lg overflow-hidden">
                <div className="flex items-center gap-3 p-4">
                  {/* Checkbox */}
                  {(status === "DRAFT" || status === "VALIDATED") && (
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(id)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  )}

                  {/* Event Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-theme-primary">
                        {EVENT_TYPE_LABELS[eventType] ?? eventType}
                      </span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusCfg.label}
                      </span>
                    </div>
                    {employee && (
                      <p className="text-xs text-theme-secondary mt-0.5 truncate">
                        {employee.name} {employee.cpf ? `(${employee.cpf})` : ""}
                      </p>
                    )}
                    <p className="text-xs text-theme-secondary mt-0.5">
                      Ref: {event.referenceMonth as number}/{event.referenceYear as number}
                      {event.receiptNumber ? ` | Recibo: ${event.receiptNumber}` : ""}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {status === "DRAFT" && (
                      <button
                        onClick={() => onValidate(id)}
                        disabled={isValidating}
                        className="p-1.5 rounded-md hover:bg-theme-secondary/10 text-blue-600 dark:text-blue-400"
                        title="Validar"
                      >
                        <Shield className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => onExpandEvent(isExpanded ? null : id)}
                      className="p-1.5 rounded-md hover:bg-theme-secondary/10 text-theme-secondary"
                      title="Ver XML"
                    >
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded XML */}
                {isExpanded && event.xmlContent && (
                  <div className="border-t border-theme bg-gray-50 dark:bg-gray-900/50 p-4">
                    <pre className="text-xs text-theme-secondary overflow-x-auto whitespace-pre-wrap max-h-64 overflow-y-auto font-mono">
                      {String(event.xmlContent)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// BATCHES TAB
// ============================================================================

interface BatchesTabProps {
  batches: Array<Record<string, unknown>>;
  isLoading: boolean;
  onClose: (id: string) => void;
  onSend: (id: string) => void;
  onCheckResult: (id: string) => void;
  isClosing: boolean;
  isSending: boolean;
  isChecking: boolean;
}

function BatchesTab({ batches, isLoading, onClose, onSend, onCheckResult, isClosing, isSending, isChecking }: BatchesTabProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-theme-card border border-theme rounded-lg p-4 animate-pulse">
            <div className="h-4 bg-theme-tertiary rounded w-1/4 mb-2" />
            <div className="h-3 bg-theme-tertiary rounded w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  if (batches.length === 0) {
    return (
      <div className="text-center py-12 text-theme-secondary">
        <Package className="w-12 h-12 mx-auto mb-4 opacity-30" />
        <p className="text-lg font-medium">Nenhum lote criado</p>
        <p className="text-sm mt-1">Selecione eventos na aba Eventos e crie um lote</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {batches.map((batch) => {
        const id = batch.id as string;
        const status = batch.status as string;
        const statusCfg = BATCH_STATUS_CONFIG[status] ?? BATCH_STATUS_CONFIG.OPEN;
        const count = (batch._count as { events: number })?.events ?? batch.eventsCount as number ?? 0;

        return (
          <div key={id} className="bg-theme-card border border-theme rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-theme-primary">
                    Lote #{batch.batchNumber as number}
                  </span>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusCfg.color}`}>
                    {statusCfg.label}
                  </span>
                  <span className="text-xs text-theme-secondary">
                    {batch.groupType as string} | {count} evento(s)
                  </span>
                </div>
                {batch.protocolNumber ? (
                  <p className="text-xs text-theme-secondary mt-1">
                    Protocolo: {String(batch.protocolNumber)}
                  </p>
                ) : null}
                <p className="text-xs text-theme-secondary mt-0.5">
                  {batch.acceptedCount as number > 0 && `Aceitos: ${batch.acceptedCount} `}
                  {batch.rejectedCount as number > 0 && `Rejeitados: ${batch.rejectedCount}`}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {status === "OPEN" && (
                  <Button size="sm" variant="outline" onClick={() => onClose(id)} disabled={isClosing}>
                    Fechar Lote
                  </Button>
                )}
                {status === "CLOSED" && (
                  <Button size="sm" onClick={() => onSend(id)} disabled={isSending} leftIcon={<Send className="w-4 h-4" />}>
                    {isSending ? "Enviando..." : "Enviar"}
                  </Button>
                )}
                {status === "SENT" && (
                  <Button size="sm" variant="outline" onClick={() => onCheckResult(id)} disabled={isChecking} leftIcon={<RefreshCw className="w-4 h-4" />}>
                    {isChecking ? "Consultando..." : "Consultar Retorno"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// RUBRICS TAB
// ============================================================================

function RubricsTab({ rubrics }: { rubrics: Array<Record<string, unknown>> }) {
  if (rubrics.length === 0) {
    return (
      <div className="text-center py-12 text-theme-secondary">
        <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
        <p className="text-lg font-medium">Nenhuma rubrica cadastrada</p>
        <p className="text-sm mt-1">Rubricas são necessárias para os eventos S-1010 e S-1200</p>
      </div>
    );
  }

  const typeLabels: Record<string, string> = {
    EARNING: "Provento",
    DEDUCTION: "Desconto",
    INFORMATIVE: "Informativa",
  };

  return (
    <div className="bg-theme-card border border-theme rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-theme bg-theme-secondary/5">
            <th className="text-left p-3 text-xs font-semibold text-theme-secondary">Código</th>
            <th className="text-left p-3 text-xs font-semibold text-theme-secondary">Nome</th>
            <th className="text-left p-3 text-xs font-semibold text-theme-secondary">Tipo</th>
            <th className="text-left p-3 text-xs font-semibold text-theme-secondary">INSS</th>
            <th className="text-left p-3 text-xs font-semibold text-theme-secondary">IRRF</th>
            <th className="text-left p-3 text-xs font-semibold text-theme-secondary">FGTS</th>
            <th className="text-center p-3 text-xs font-semibold text-theme-secondary">Ativa</th>
          </tr>
        </thead>
        <tbody>
          {rubrics.map((r) => (
            <tr key={r.id as string} className="border-b border-theme last:border-0 hover:bg-theme-secondary/5">
              <td className="p-3 font-mono text-xs">{r.code as string}</td>
              <td className="p-3">{r.name as string}</td>
              <td className="p-3">{typeLabels[r.type as string] ?? r.type as string}</td>
              <td className="p-3 text-xs">{r.incidenceINSS as string}</td>
              <td className="p-3 text-xs">{r.incidenceIRRF as string}</td>
              <td className="p-3 text-xs">{r.incidenceFGTS as string}</td>
              <td className="p-3 text-center">
                {r.isActive ? (
                  <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500 mx-auto" />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================================
// CONFIG TAB
// ============================================================================

function ConfigTab({
  config,
  onSave,
  isSaving,
}: {
  config: Record<string, unknown> | null | undefined;
  onSave: (data: Record<string, unknown>) => void;
  isSaving: boolean;
}) {
  const [env, setEnv] = useState<string>((config?.environment as string) ?? "RESTRICTED");
  const [autoGen, setAutoGen] = useState<boolean>((config?.autoGenerate as boolean) ?? false);
  const [autoSend, setAutoSend] = useState<boolean>((config?.autoSend as boolean) ?? false);

  return (
    <div className="bg-theme-card border border-theme rounded-lg p-6 max-w-2xl">
      <h3 className="text-lg font-semibold text-theme-primary mb-4">Configuração eSocial</h3>

      <div className="space-y-4">
        <div>
          <Select
            label="Ambiente"
            value={env}
            onChange={(value) => setEnv(value)}
            options={[
              { value: "RESTRICTED", label: "Produção Restrita (Testes)" },
              { value: "PRODUCTION", label: "Produção" },
            ]}
          />
          <p className="text-xs text-theme-secondary mt-1">
            Use &quot;Produção Restrita&quot; para testes antes de enviar ao governo
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="autoGen"
            checked={autoGen}
            onChange={(e) => setAutoGen(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="autoGen" className="text-sm text-theme-primary">
            Gerar eventos automaticamente ao processar folha
          </label>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="autoSend"
            checked={autoSend}
            onChange={(e) => setAutoSend(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="autoSend" className="text-sm text-theme-primary">
            Enviar lotes automaticamente após validação
          </label>
        </div>

        <div className="pt-4 border-t border-theme">
          <Button
            onClick={() => onSave({
              environment: env as "PRODUCTION" | "RESTRICTED",
              autoGenerate: autoGen,
              autoSend: autoSend,
            })}
            disabled={isSaving}
          >
            {isSaving ? "Salvando..." : "Salvar Configuração"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// GENERATE MODAL
// ============================================================================

function GenerateModal({
  year,
  month,
  onGenerate,
  onClose,
  isLoading,
  result,
}: {
  year: number;
  month: number;
  onGenerate: (year: number, month: number, types: string[]) => void;
  onClose: () => void;
  isLoading: boolean;
  result?: { generated: number; skipped: number; errors: Array<{ eventType: string; error: string }> } | null;
}) {
  const [genYear, setGenYear] = useState(year);
  const [genMonth, setGenMonth] = useState(month);
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(
    new Set(["S_2200", "S_2299", "S_2230", "S_1200", "S_1210"])
  );

  const eventOptions = [
    { value: "S_2200", label: "S-2200 Admissão" },
    { value: "S_2299", label: "S-2299 Desligamento" },
    { value: "S_2230", label: "S-2230 Afastamento" },
    { value: "S_1200", label: "S-1200 Remuneração" },
    { value: "S_1210", label: "S-1210 Pagamentos" },
  ];

  const toggleType = (type: string) => {
    setSelectedTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type); else next.add(type);
      return next;
    });
  };

  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-theme-card border border-theme rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6">
        <h2 className="text-lg font-semibold text-theme-primary mb-4">Gerar Eventos eSocial</h2>

        {result ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-green-700 dark:text-green-400">{result.generated}</p>
                <p className="text-xs text-green-600 dark:text-green-500">Gerados</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">{result.skipped}</p>
                <p className="text-xs text-gray-500">Já existentes</p>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-sm font-medium text-red-700 dark:text-red-400 mb-1">Erros:</p>
                {result.errors.map((err, i) => (
                  <p key={i} className="text-xs text-red-600 dark:text-red-500">
                    {EVENT_TYPE_LABELS[err.eventType] ?? err.eventType}: {err.error}
                  </p>
                ))}
              </div>
            )}

            <Button onClick={onClose} className="w-full">Fechar</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <Select
                  label="Mês"
                  value={String(genMonth)}
                  onChange={(value) => setGenMonth(Number(value))}
                  options={months.map((m, i) => ({ value: String(i + 1), label: m }))}
                />
              </div>
              <div className="w-24">
                <Select
                  label="Ano"
                  value={String(genYear)}
                  onChange={(value) => setGenYear(Number(value))}
                  options={[2024, 2025, 2026].map(y => ({ value: String(y), label: String(y) }))}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-theme-secondary mb-2">Tipos de Evento</label>
              <div className="space-y-2">
                {eventOptions.map(opt => (
                  <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedTypes.has(opt.value)}
                      onChange={() => toggleType(opt.value)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-theme-primary">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancelar
              </Button>
              <Button
                onClick={() => onGenerate(genYear, genMonth, Array.from(selectedTypes))}
                disabled={isLoading || selectedTypes.size === 0}
                leftIcon={<Zap className="w-4 h-4" />}
                className="flex-1"
              >
                {isLoading ? "Gerando..." : "Gerar"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
