"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  Building2,
  FileText,
  DollarSign,
  ShoppingCart,
  AlertCircle,
  Loader2,
  ChevronRight,
  CheckCircle2,
  Clock,
  XCircle,
  Send,
  Package,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SupplierInfo {
  id: string;
  code: number;
  companyName: string;
  tradeName: string | null;
  cnpj: string | null;
  email: string | null;
  phone: string | null;
  contactName: string | null;
}

interface CompanyInfo {
  id: string;
  name: string;
  tradeName: string | null;
  cnpj: string | null;
}

interface PaymentSummary {
  totalPending: number;
  totalOverdue: number;
  totalPaid: number;
  countPending: number;
  countOverdue: number;
  countPaid: number;
}

interface PortalData {
  supplier: SupplierInfo;
  company: CompanyInfo;
  expiresAt: string;
  paymentSummary: PaymentSummary;
}

interface QuoteItem {
  id: string;
  code: number;
  status: string;
  requestDate: string;
  responseDate: string | null;
  validUntil: string | null;
  totalValue: number;
  paymentTerms: string | null;
  deliveryTerms: string | null;
  notes: string | null;
}

interface QuoteDetail {
  id: string;
  code: number;
  status: string;
  requestDate: string;
  responseDate: string | null;
  validUntil: string | null;
  paymentTerms: string | null;
  deliveryTerms: string | null;
  freightValue: number;
  discountPercent: number;
  totalValue: number;
  notes: string | null;
  items: {
    id: string;
    material: { id: string; description: string; code: number; unit: string };
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    deliveryDays: number | null;
    notes: string | null;
  }[];
}

interface PurchaseOrderItem {
  id: string;
  code: number;
  status: string;
  orderDate: string;
  expectedDeliveryDate: string | null;
  actualDeliveryDate: string | null;
  totalValue: number;
  paymentTerms: string | null;
  notes: string | null;
}

interface PayableItem {
  id: string;
  code: number;
  documentType: string;
  documentNumber: string | null;
  description: string;
  dueDate: string;
  issueDate: string;
  originalValue: number;
  paidValue: number;
  netValue: number;
  status: string;
  paidAt: string | null;
  installmentNumber: number;
  totalInstallments: number;
  scheduledPaymentDate: string | null;
}

type TabId = "quotes" | "orders" | "payments";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatDate(date: string | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("pt-BR");
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  DRAFT: { label: "Rascunho", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300", icon: <FileText className="w-3.5 h-3.5" /> },
  PENDING: { label: "Pendente", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400", icon: <Clock className="w-3.5 h-3.5" /> },
  SENT: { label: "Enviada", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", icon: <Send className="w-3.5 h-3.5" /> },
  RECEIVED: { label: "Respondida", color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  APPROVED: { label: "Aprovada", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  REJECTED: { label: "Rejeitada", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", icon: <XCircle className="w-3.5 h-3.5" /> },
  CANCELLED: { label: "Cancelada", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", icon: <XCircle className="w-3.5 h-3.5" /> },
  CONFIRMED: { label: "Confirmado", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  PARTIAL_DELIVERY: { label: "Entrega Parcial", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400", icon: <Package className="w-3.5 h-3.5" /> },
  DELIVERED: { label: "Entregue", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  PAID: { label: "Pago", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  PARTIAL: { label: "Parcial", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400", icon: <Clock className="w-3.5 h-3.5" /> },
  OVERDUE: { label: "Vencido", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", icon: <AlertCircle className="w-3.5 h-3.5" /> },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_MAP[status] || { label: status, color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300", icon: null };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SupplierPortalPage() {
  const params = useParams();
  const rawToken = params.token;
  const token = typeof rawToken === "string" ? rawToken : Array.isArray(rawToken) ? rawToken[0] : "";

  const [portalData, setPortalData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("quotes");

  const [quotes, setQuotes] = useState<QuoteItem[]>([]);
  const [quotesTotal, setQuotesTotal] = useState(0);
  const [quotesLoading, setQuotesLoading] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState<QuoteDetail | null>(null);
  const [quoteDetailLoading, setQuoteDetailLoading] = useState(false);

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderItem[]>([]);
  const [posTotal, setPosTotal] = useState(0);
  const [posLoading, setPosLoading] = useState(false);

  const [payables, setPayables] = useState<PayableItem[]>([]);
  const [payablesTotal, setPayablesTotal] = useState(0);
  const [payablesLoading, setPayablesLoading] = useState(false);

  // Quote response form
  const [responding, setResponding] = useState(false);
  const [responseItems, setResponseItems] = useState<Record<string, { unitPrice: string; deliveryDays: string }>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/portal/supplier/${token}`);
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Erro ao carregar portal");
          return;
        }
        setPortalData(await res.json());
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Erro de conexão");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  const loadQuotes = useCallback(async () => {
    setQuotesLoading(true);
    try {
      const res = await fetch(`/api/portal/supplier/${token}/quotes?limit=20`);
      if (res.ok) { const d = await res.json(); setQuotes(d.items); setQuotesTotal(d.total); }
    } catch (e: unknown) { console.warn("Erro ao carregar cotações:", e instanceof Error ? e.message : String(e)); } finally { setQuotesLoading(false); }
  }, [token]);

  const loadQuoteDetail = useCallback(async (quoteId: string) => {
    setQuoteDetailLoading(true);
    setResponding(false);
    try {
      const res = await fetch(`/api/portal/supplier/${token}/quotes/${quoteId}`);
      if (res.ok) {
        const q: QuoteDetail = await res.json();
        setSelectedQuote(q);
        const items: Record<string, { unitPrice: string; deliveryDays: string }> = {};
        q.items.forEach((i) => { items[i.id] = { unitPrice: String(i.unitPrice || ""), deliveryDays: String(i.deliveryDays || "") }; });
        setResponseItems(items);
      }
    } catch (e: unknown) { console.warn("Erro ao carregar detalhe da cotação:", e instanceof Error ? e.message : String(e)); } finally { setQuoteDetailLoading(false); }
  }, [token]);

  const loadPurchaseOrders = useCallback(async () => {
    setPosLoading(true);
    try {
      const res = await fetch(`/api/portal/supplier/${token}/purchase-orders?limit=20`);
      if (res.ok) { const d = await res.json(); setPurchaseOrders(d.items); setPosTotal(d.total); }
    } catch (e: unknown) { console.warn("Erro ao carregar pedidos de compra:", e instanceof Error ? e.message : String(e)); } finally { setPosLoading(false); }
  }, [token]);

  const loadPayables = useCallback(async () => {
    setPayablesLoading(true);
    try {
      const res = await fetch(`/api/portal/supplier/${token}/payables?limit=20`);
      if (res.ok) { const d = await res.json(); setPayables(d.items); setPayablesTotal(d.total); }
    } catch (e: unknown) { console.warn("Erro ao carregar pagamentos:", e instanceof Error ? e.message : String(e)); } finally { setPayablesLoading(false); }
  }, [token]);

  useEffect(() => {
    if (!portalData) return;
    if (activeTab === "quotes" && quotes.length === 0) loadQuotes();
    if (activeTab === "orders" && purchaseOrders.length === 0) loadPurchaseOrders();
    if (activeTab === "payments" && payables.length === 0) loadPayables();
  }, [activeTab, portalData, quotes.length, purchaseOrders.length, payables.length, loadQuotes, loadPurchaseOrders, loadPayables]);

  const handleSubmitResponse = async () => {
    if (!selectedQuote) return;
    setSubmitting(true);
    try {
      const items = selectedQuote.items.map((i) => ({
        id: i.id,
        unitPrice: Number(responseItems[i.id]?.unitPrice || 0),
        deliveryDays: Number(responseItems[i.id]?.deliveryDays || 0) || undefined,
      }));
      const res = await fetch(`/api/portal/supplier/${token}/quotes/${selectedQuote.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      if (res.ok) {
        setSelectedQuote(null);
        setResponding(false);
        loadQuotes();
      }
    } catch (e: unknown) { console.warn("Erro ao enviar resposta:", e instanceof Error ? e.message : String(e)); } finally { setSubmitting(false); }
  };

  // ─── Loading / Error ────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Acesso Indisponível</h1>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  if (!portalData) return null;

  const { supplier, company, paymentSummary } = portalData;

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "quotes", label: "Cotações", icon: <FileText className="w-4 h-4" /> },
    { id: "orders", label: "Pedidos de Compra", icon: <ShoppingCart className="w-4 h-4" /> },
    { id: "payments", label: "Pagamentos", icon: <DollarSign className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="w-6 h-6 text-blue-600" />
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">{company.name}</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Portal do Fornecedor</p>
            </div>
          </div>
          <div className="text-right text-sm">
            <p className="font-medium text-gray-900 dark:text-white">{supplier.companyName}</p>
            {supplier.cnpj && <p className="text-xs text-gray-500 dark:text-gray-400">{supplier.cnpj}</p>}
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Payment Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
              <Clock className="w-4 h-4" />
              A Receber ({paymentSummary.countPending})
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(paymentSummary.totalPending)}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-red-200 dark:border-red-900/50 p-4">
            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 mb-1">
              <AlertCircle className="w-4 h-4" />
              Atrasado ({paymentSummary.countOverdue})
            </div>
            <p className="text-xl font-bold text-red-600 dark:text-red-400">{formatCurrency(paymentSummary.totalOverdue)}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-green-200 dark:border-green-900/50 p-4">
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 mb-1">
              <CheckCircle2 className="w-4 h-4" />
              Recebido ({paymentSummary.countPaid})
            </div>
            <p className="text-xl font-bold text-green-600 dark:text-green-400">{formatCurrency(paymentSummary.totalPaid)}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="border-b border-gray-200 dark:border-gray-800">
            <nav className="flex">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setSelectedQuote(null); setResponding(false); }}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                      : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-4 md:p-6">
            {activeTab === "quotes" && !selectedQuote && (
              <QuotesList quotes={quotes} total={quotesTotal} loading={quotesLoading} onSelect={loadQuoteDetail} />
            )}
            {activeTab === "quotes" && selectedQuote && (
              <QuoteDetailView
                quote={selectedQuote}
                loading={quoteDetailLoading}
                responding={responding}
                responseItems={responseItems}
                submitting={submitting}
                onBack={() => { setSelectedQuote(null); setResponding(false); }}
                onStartRespond={() => setResponding(true)}
                onChangeItem={(id, field, value) => setResponseItems((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }))}
                onSubmit={handleSubmitResponse}
              />
            )}
            {activeTab === "orders" && (
              <PurchaseOrdersList orders={purchaseOrders} total={posTotal} loading={posLoading} />
            )}
            {activeTab === "payments" && (
              <PayablesList payables={payables} total={payablesTotal} loading={payablesLoading} />
            )}
          </div>
        </div>
      </div>

      <footer className="text-center py-6 text-xs text-gray-400 dark:text-gray-600">
        Portal do Fornecedor — {company.name}
      </footer>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function QuotesList({ quotes, total, loading, onSelect }: {
  quotes: QuoteItem[]; total: number; loading: boolean; onSelect: (id: string) => void;
}) {
  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>;
  if (quotes.length === 0) return <p className="text-center text-gray-500 dark:text-gray-400 py-8">Nenhuma cotação encontrada.</p>;

  return (
    <div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{total} cotação(ões) encontrada(s)</p>
      <div className="space-y-3">
        {quotes.map((q) => (
          <button key={q.id} onClick={() => onSelect(q.id)}
            className="w-full text-left bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Cotação #{q.code}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Solicitada em {formatDate(q.requestDate)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(q.totalValue)}</p>
                  <StatusBadge status={q.status} />
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function QuoteDetailView({ quote, loading, responding, responseItems, submitting, onBack, onStartRespond, onChangeItem, onSubmit }: {
  quote: QuoteDetail; loading: boolean; responding: boolean;
  responseItems: Record<string, { unitPrice: string; deliveryDays: string }>;
  submitting: boolean;
  onBack: () => void; onStartRespond: () => void;
  onChangeItem: (id: string, field: string, value: string) => void;
  onSubmit: () => void;
}) {
  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>;

  const canRespond = ["DRAFT", "SENT"].includes(quote.status);

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">← Voltar para lista</button>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Cotação #{quote.code}</h3>
        <div className="flex items-center gap-2">
          <StatusBadge status={quote.status} />
          {canRespond && !responding && (
            <button onClick={onStartRespond}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <Send className="w-3.5 h-3.5" /> Responder Cotação
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div><span className="text-gray-500 dark:text-gray-400">Solicitada</span><p className="font-medium text-gray-900 dark:text-white">{formatDate(quote.requestDate)}</p></div>
        <div><span className="text-gray-500 dark:text-gray-400">Válida até</span><p className="font-medium text-gray-900 dark:text-white">{formatDate(quote.validUntil)}</p></div>
        <div><span className="text-gray-500 dark:text-gray-400">Pagamento</span><p className="font-medium text-gray-900 dark:text-white">{quote.paymentTerms || "—"}</p></div>
        <div><span className="text-gray-500 dark:text-gray-400">Entrega</span><p className="font-medium text-gray-900 dark:text-white">{quote.deliveryTerms || "—"}</p></div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-2 text-gray-500 dark:text-gray-400 font-medium">Material</th>
              <th className="text-right py-2 text-gray-500 dark:text-gray-400 font-medium">Qtd</th>
              <th className="text-right py-2 text-gray-500 dark:text-gray-400 font-medium">Preço Unit.</th>
              <th className="text-right py-2 text-gray-500 dark:text-gray-400 font-medium">Prazo (dias)</th>
              <th className="text-right py-2 text-gray-500 dark:text-gray-400 font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {quote.items.map((item) => (
              <tr key={item.id} className="border-b border-gray-100 dark:border-gray-800">
                <td className="py-2 text-gray-900 dark:text-white">{item.material.description}</td>
                <td className="py-2 text-right text-gray-900 dark:text-white">{item.quantity} {item.material.unit}</td>
                {responding ? (
                  <>
                    <td className="py-2 text-right">
                      <input type="number" step="0.01" min="0"
                        value={responseItems[item.id]?.unitPrice ?? ""}
                        onChange={(e) => onChangeItem(item.id, "unitPrice", e.target.value)}
                        className="w-24 text-right px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                        placeholder="0,00" />
                    </td>
                    <td className="py-2 text-right">
                      <input type="number" min="0"
                        value={responseItems[item.id]?.deliveryDays ?? ""}
                        onChange={(e) => onChangeItem(item.id, "deliveryDays", e.target.value)}
                        className="w-20 text-right px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                        placeholder="0" />
                    </td>
                  </>
                ) : (
                  <>
                    <td className="py-2 text-right text-gray-900 dark:text-white">{formatCurrency(item.unitPrice)}</td>
                    <td className="py-2 text-right text-gray-900 dark:text-white">{item.deliveryDays ?? "—"}</td>
                  </>
                )}
                <td className="py-2 text-right font-medium text-gray-900 dark:text-white">{formatCurrency(item.totalPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {responding && (
        <div className="flex justify-end gap-2">
          <button onClick={onBack} className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800">
            Cancelar
          </button>
          <button onClick={onSubmit} disabled={submitting}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Enviar Resposta
          </button>
        </div>
      )}

      <div className="flex justify-end">
        <div className="w-64 space-y-1 text-sm">
          <div className="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-1 font-bold">
            <span className="text-gray-900 dark:text-white">Total</span>
            <span className="text-gray-900 dark:text-white">{formatCurrency(quote.totalValue)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PurchaseOrdersList({ orders, total, loading }: {
  orders: PurchaseOrderItem[]; total: number; loading: boolean;
}) {
  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>;
  if (orders.length === 0) return <p className="text-center text-gray-500 dark:text-gray-400 py-8">Nenhum pedido de compra encontrado.</p>;

  return (
    <div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{total} pedido(s) de compra</p>
      <div className="space-y-3">
        {orders.map((po) => (
          <div key={po.id} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShoppingCart className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">OC #{po.code}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(po.orderDate)}
                    {po.expectedDeliveryDate && ` • Entrega: ${formatDate(po.expectedDeliveryDate)}`}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(po.totalValue)}</p>
                <StatusBadge status={po.status} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PayablesList({ payables, total, loading }: {
  payables: PayableItem[]; total: number; loading: boolean;
}) {
  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>;
  if (payables.length === 0) return <p className="text-center text-gray-500 dark:text-gray-400 py-8">Nenhum pagamento encontrado.</p>;

  return (
    <div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{total} pagamento(s)</p>
      <div className="space-y-3">
        {payables.map((p) => {
          const isOverdue = p.status === "PENDING" && new Date(p.dueDate) < new Date();
          return (
            <div key={p.id}
              className={`rounded-lg border p-4 ${
                isOverdue
                  ? "border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20"
                  : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
              }`}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    <p className="font-medium text-gray-900 dark:text-white">
                      {p.description}
                      {p.totalInstallments > 1 && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">({p.installmentNumber}/{p.totalInstallments})</span>
                      )}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Vencimento: {formatDate(p.dueDate)}
                    {p.scheduledPaymentDate && ` • Previsão: ${formatDate(p.scheduledPaymentDate)}`}
                    {p.documentNumber && ` • Doc: ${p.documentNumber}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(p.netValue)}</p>
                  <StatusBadge status={isOverdue ? "OVERDUE" : p.status} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
