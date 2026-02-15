"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  Building2,
  ShoppingCart,
  FileText,
  DollarSign,
  Truck,
  AlertCircle,
  Loader2,
  ChevronRight,
  ExternalLink,
  Copy,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CustomerInfo {
  id: string;
  code: string;
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

interface FinancialSummary {
  totalPending: number;
  totalOverdue: number;
  totalPaid: number;
  countPending: number;
  countOverdue: number;
  countPaid: number;
}

interface PortalData {
  customer: CustomerInfo;
  company: CompanyInfo;
  expiresAt: string;
  financialSummary: FinancialSummary;
}

interface OrderItem {
  id: string;
  code: number;
  status: string;
  orderDate: string;
  deliveryDate: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  totalValue: number;
  trackingCode: string | null;
  invoiceNumber: string | null;
  paymentTerms: string | null;
}

interface OrderDetail {
  id: string;
  code: number;
  status: string;
  orderDate: string;
  deliveryDate: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  paymentTerms: string | null;
  shippingMethod: string | null;
  trackingCode: string | null;
  invoiceNumber: string | null;
  subtotal: number;
  discountValue: number;
  shippingValue: number;
  taxValue: number;
  totalValue: number;
  notes: string | null;
  items: {
    id: string;
    material: { id: string; description: string; code: number; unit: string };
    description: string | null;
    quantity: number;
    deliveredQty: number;
    unit: string;
    unitPrice: number;
    totalPrice: number;
  }[];
}

interface ReceivableItem {
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
  boletoUrl: string | null;
  pixCode: string | null;
}

type TabId = "orders" | "financials" | "tracking";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function formatDate(date: string | null): string {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("pt-BR");
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING: { label: "Pendente", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400", icon: <Clock className="w-3.5 h-3.5" /> },
  CONFIRMED: { label: "Confirmado", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  IN_PRODUCTION: { label: "Em Produção", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400", icon: <Loader2 className="w-3.5 h-3.5" /> },
  SHIPPED: { label: "Enviado", color: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400", icon: <Truck className="w-3.5 h-3.5" /> },
  DELIVERED: { label: "Entregue", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  CANCELLED: { label: "Cancelado", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", icon: <XCircle className="w-3.5 h-3.5" /> },
  INVOICED: { label: "Faturado", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400", icon: <FileText className="w-3.5 h-3.5" /> },
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

export default function CustomerPortalPage() {
  const params = useParams();
  const token = params.token as string;

  const [portalData, setPortalData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("orders");

  // Orders state
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [orderDetailLoading, setOrderDetailLoading] = useState(false);

  // Receivables state
  const [receivables, setReceivables] = useState<ReceivableItem[]>([]);
  const [receivablesTotal, setReceivablesTotal] = useState(0);
  const [receivablesLoading, setReceivablesLoading] = useState(false);

  const [copiedPix, setCopiedPix] = useState<string | null>(null);

  // Load portal data
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/portal/customer/${token}`);
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

  // Load orders
  const loadOrders = useCallback(async () => {
    setOrdersLoading(true);
    try {
      const res = await fetch(`/api/portal/customer/${token}/orders?limit=20`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.items);
        setOrdersTotal(data.total);
      }
    } catch { /* ignore */ } finally {
      setOrdersLoading(false);
    }
  }, [token]);

  // Load receivables
  const loadReceivables = useCallback(async () => {
    setReceivablesLoading(true);
    try {
      const res = await fetch(`/api/portal/customer/${token}/receivables?limit=20`);
      if (res.ok) {
        const data = await res.json();
        setReceivables(data.items);
        setReceivablesTotal(data.total);
      }
    } catch { /* ignore */ } finally {
      setReceivablesLoading(false);
    }
  }, [token]);

  // Load order detail
  const loadOrderDetail = useCallback(async (orderId: string) => {
    setOrderDetailLoading(true);
    try {
      const res = await fetch(`/api/portal/customer/${token}/orders/${orderId}`);
      if (res.ok) {
        setSelectedOrder(await res.json());
      }
    } catch { /* ignore */ } finally {
      setOrderDetailLoading(false);
    }
  }, [token]);

  // Load data when tab changes
  useEffect(() => {
    if (!portalData) return;
    if (activeTab === "orders" && orders.length === 0) loadOrders();
    if (activeTab === "financials" && receivables.length === 0) loadReceivables();
    if (activeTab === "tracking" && orders.length === 0) loadOrders();
  }, [activeTab, portalData, orders.length, receivables.length, loadOrders, loadReceivables]);

  const handleCopyPix = async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedPix(id);
      setTimeout(() => setCopiedPix(null), 2000);
    } catch { /* ignore */ }
  };

  // ─── Loading / Error states ─────────────────────────────────────────────────

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

  const { customer, company, financialSummary } = portalData;

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "orders", label: "Meus Pedidos", icon: <ShoppingCart className="w-4 h-4" /> },
    { id: "financials", label: "Financeiro", icon: <DollarSign className="w-4 h-4" /> },
    { id: "tracking", label: "Tracking", icon: <Truck className="w-4 h-4" /> },
  ];

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="w-6 h-6 text-blue-600" />
            <div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">{company.name}</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">Portal do Cliente</p>
            </div>
          </div>
          <div className="text-right text-sm">
            <p className="font-medium text-gray-900 dark:text-white">{customer.companyName}</p>
            {customer.cnpj && <p className="text-xs text-gray-500 dark:text-gray-400">{customer.cnpj}</p>}
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Financial Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
              <Clock className="w-4 h-4" />
              A Vencer ({financialSummary.countPending})
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(financialSummary.totalPending)}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-red-200 dark:border-red-900/50 p-4">
            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 mb-1">
              <AlertCircle className="w-4 h-4" />
              Vencido ({financialSummary.countOverdue})
            </div>
            <p className="text-xl font-bold text-red-600 dark:text-red-400">{formatCurrency(financialSummary.totalOverdue)}</p>
          </div>
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-green-200 dark:border-green-900/50 p-4">
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 mb-1">
              <CheckCircle2 className="w-4 h-4" />
              Pago ({financialSummary.countPaid})
            </div>
            <p className="text-xl font-bold text-green-600 dark:text-green-400">{formatCurrency(financialSummary.totalPaid)}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="border-b border-gray-200 dark:border-gray-800">
            <nav className="flex">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setSelectedOrder(null); }}
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
            {/* Orders Tab */}
            {activeTab === "orders" && !selectedOrder && (
              <OrdersList
                orders={orders}
                total={ordersTotal}
                loading={ordersLoading}
                onSelect={(id) => loadOrderDetail(id)}
              />
            )}

            {activeTab === "orders" && selectedOrder && (
              <OrderDetailView
                order={selectedOrder}
                loading={orderDetailLoading}
                onBack={() => setSelectedOrder(null)}
              />
            )}

            {/* Financials Tab */}
            {activeTab === "financials" && (
              <ReceivablesList
                receivables={receivables}
                total={receivablesTotal}
                loading={receivablesLoading}
                copiedPix={copiedPix}
                onCopyPix={handleCopyPix}
              />
            )}

            {/* Tracking Tab */}
            {activeTab === "tracking" && (
              <TrackingList orders={orders} loading={ordersLoading} />
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-6 text-xs text-gray-400 dark:text-gray-600">
        Portal do Cliente — {company.name}
      </footer>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function OrdersList({ orders, total, loading, onSelect }: {
  orders: OrderItem[];
  total: number;
  loading: boolean;
  onSelect: (id: string) => void;
}) {
  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>;
  if (orders.length === 0) return <p className="text-center text-gray-500 dark:text-gray-400 py-8">Nenhum pedido encontrado.</p>;

  return (
    <div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{total} pedido(s) encontrado(s)</p>
      <div className="space-y-3">
        {orders.map((order) => (
          <button
            key={order.id}
            onClick={() => onSelect(order.id)}
            className="w-full text-left bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShoppingCart className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Pedido #{order.code}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(order.orderDate)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(order.totalValue)}</p>
                  <StatusBadge status={order.status} />
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

function OrderDetailView({ order, loading, onBack }: {
  order: OrderDetail;
  loading: boolean;
  onBack: () => void;
}) {
  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>;

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
        ← Voltar para lista
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Pedido #{order.code}</h3>
        <StatusBadge status={order.status} />
      </div>

      {/* Order Info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <span className="text-gray-500 dark:text-gray-400">Data</span>
          <p className="font-medium text-gray-900 dark:text-white">{formatDate(order.orderDate)}</p>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">Entrega Prevista</span>
          <p className="font-medium text-gray-900 dark:text-white">{formatDate(order.deliveryDate)}</p>
        </div>
        <div>
          <span className="text-gray-500 dark:text-gray-400">Pagamento</span>
          <p className="font-medium text-gray-900 dark:text-white">{order.paymentTerms || "—"}</p>
        </div>
        {order.trackingCode && (
          <div>
            <span className="text-gray-500 dark:text-gray-400">Rastreio</span>
            <p className="font-medium text-blue-600 dark:text-blue-400">{order.trackingCode}</p>
          </div>
        )}
      </div>

      {/* Items Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-2 text-gray-500 dark:text-gray-400 font-medium">Item</th>
              <th className="text-right py-2 text-gray-500 dark:text-gray-400 font-medium">Qtd</th>
              <th className="text-right py-2 text-gray-500 dark:text-gray-400 font-medium">Entregue</th>
              <th className="text-right py-2 text-gray-500 dark:text-gray-400 font-medium">Preço Unit.</th>
              <th className="text-right py-2 text-gray-500 dark:text-gray-400 font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id} className="border-b border-gray-100 dark:border-gray-800">
                <td className="py-2 text-gray-900 dark:text-white">{item.material.description}</td>
                <td className="py-2 text-right text-gray-900 dark:text-white">{item.quantity} {item.unit}</td>
                <td className="py-2 text-right text-gray-900 dark:text-white">{item.deliveredQty}</td>
                <td className="py-2 text-right text-gray-900 dark:text-white">{formatCurrency(item.unitPrice)}</td>
                <td className="py-2 text-right font-medium text-gray-900 dark:text-white">{formatCurrency(item.totalPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-end">
        <div className="w-64 space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Subtotal</span><span className="text-gray-900 dark:text-white">{formatCurrency(order.subtotal)}</span></div>
          {order.discountValue > 0 && <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Desconto</span><span className="text-red-600">-{formatCurrency(order.discountValue)}</span></div>}
          {order.shippingValue > 0 && <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Frete</span><span className="text-gray-900 dark:text-white">{formatCurrency(order.shippingValue)}</span></div>}
          {order.taxValue > 0 && <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Impostos</span><span className="text-gray-900 dark:text-white">{formatCurrency(order.taxValue)}</span></div>}
          <div className="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-1 font-bold"><span className="text-gray-900 dark:text-white">Total</span><span className="text-gray-900 dark:text-white">{formatCurrency(order.totalValue)}</span></div>
        </div>
      </div>
    </div>
  );
}

function ReceivablesList({ receivables, total, loading, copiedPix, onCopyPix }: {
  receivables: ReceivableItem[];
  total: number;
  loading: boolean;
  copiedPix: string | null;
  onCopyPix: (code: string, id: string) => void;
}) {
  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>;
  if (receivables.length === 0) return <p className="text-center text-gray-500 dark:text-gray-400 py-8">Nenhum título encontrado.</p>;

  return (
    <div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{total} título(s) encontrado(s)</p>
      <div className="space-y-3">
        {receivables.map((r) => {
          const isOverdue = r.status === "PENDING" && new Date(r.dueDate) < new Date();
          return (
            <div
              key={r.id}
              className={`rounded-lg border p-4 ${
                isOverdue
                  ? "border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20"
                  : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-gray-400" />
                    <p className="font-medium text-gray-900 dark:text-white">
                      {r.description}
                      {r.totalInstallments > 1 && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                          ({r.installmentNumber}/{r.totalInstallments})
                        </span>
                      )}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Vencimento: {formatDate(r.dueDate)}
                    {r.documentNumber && ` • Doc: ${r.documentNumber}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-white">{formatCurrency(r.netValue)}</p>
                    <StatusBadge status={isOverdue ? "OVERDUE" : r.status} />
                  </div>
                </div>
              </div>

              {/* Actions: Boleto / PIX */}
              {(r.boletoUrl || r.pixCode) && r.status !== "PAID" && (
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  {r.boletoUrl && (
                    <a
                      href={r.boletoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      2ª Via Boleto
                    </a>
                  )}
                  {r.pixCode && (
                    <button
                      onClick={() => onCopyPix(r.pixCode!, r.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      {copiedPix === r.id ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedPix === r.id ? "Copiado!" : "Copiar PIX"}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TrackingList({ orders, loading }: { orders: OrderItem[]; loading: boolean }) {
  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>;

  const trackableOrders = orders.filter((o) =>
    ["CONFIRMED", "IN_PRODUCTION", "SHIPPED", "DELIVERED", "INVOICED"].includes(o.status)
  );

  if (trackableOrders.length === 0) {
    return <p className="text-center text-gray-500 dark:text-gray-400 py-8">Nenhum pedido em andamento.</p>;
  }

  return (
    <div className="space-y-4">
      {trackableOrders.map((order) => (
        <div key={order.id} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Pedido #{order.code}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(order.orderDate)}</p>
            </div>
            <StatusBadge status={order.status} />
          </div>

          {/* Timeline */}
          <div className="flex items-center gap-1">
            {["CONFIRMED", "IN_PRODUCTION", "SHIPPED", "DELIVERED"].map((step, i) => {
              const steps = ["CONFIRMED", "IN_PRODUCTION", "SHIPPED", "DELIVERED"];
              const currentIdx = steps.indexOf(order.status);
              const isActive = i <= currentIdx;
              const isCurrent = i === currentIdx;
              return (
                <div key={step} className="flex-1 flex items-center gap-1">
                  <div className={`w-full h-1.5 rounded-full ${isActive ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"}`} />
                  {i === steps.length - 1 && (
                    <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-green-600" : "text-gray-300 dark:text-gray-600"}`} />
                  )}
                  {isCurrent && i < steps.length - 1 && (
                    <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse flex-shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-[10px] text-gray-500 dark:text-gray-400 mt-1">
            <span>Confirmado</span>
            <span>Produção</span>
            <span>Enviado</span>
            <span>Entregue</span>
          </div>

          {order.trackingCode && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-gray-900 dark:text-white">Rastreio: <strong>{order.trackingCode}</strong></span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
