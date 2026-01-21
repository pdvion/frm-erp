"use client";

import Link from "next/link";
import { 
  Package, Users, Warehouse, FileText, Settings, Shield, 
  ShoppingCart, FileInput, DollarSign, User, BookOpen, AlertTriangle,
  TrendingUp, TrendingDown, Clock, CheckCircle, ClipboardList, ArrowRight,
  Loader2, BarChart3
} from "lucide-react";
import { CompanySwitcher } from "@/components/CompanySwitcher";
import { NotificationBell } from "@/components/NotificationBell";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@/lib/formatters";
import { SimpleBarChart, SimpleAreaChart, DonutChart, ChartCard } from "@/components/charts";

const modules = [
  { title: "Materiais", description: "Cadastro e gestão", href: "/materials", icon: Package, color: "bg-blue-500" },
  { title: "Fornecedores", description: "Cadastro de fornecedores", href: "/suppliers", icon: Users, color: "bg-green-500" },
  { title: "Estoque", description: "Controle de estoque", href: "/inventory", icon: Warehouse, color: "bg-orange-500" },
  { title: "Cotações", description: "Orçamentos de compra", href: "/quotes", icon: FileText, color: "bg-purple-500" },
  { title: "Pedidos", description: "Pedidos de compra", href: "/purchase-orders", icon: ShoppingCart, color: "bg-teal-500" },
  { title: "NFe", description: "Notas fiscais", href: "/invoices", icon: FileInput, color: "bg-indigo-500" },
  { title: "Financeiro", description: "Contas a pagar", href: "/payables", icon: DollarSign, color: "bg-red-500" },
  { title: "Requisições", description: "Saída de materiais", href: "/requisitions", icon: Package, color: "bg-amber-500" },
  { title: "Tarefas", description: "Gestão de tarefas", href: "/tasks", icon: ClipboardList, color: "bg-cyan-500" },
  { title: "Produção", description: "Ordens de produção", href: "/production", icon: Settings, color: "bg-purple-500" },
  { title: "Configurações", description: "Sistema", href: "/settings", icon: Settings, color: "bg-gray-500" },
  { title: "Auditoria", description: "Logs e governança", href: "/audit", icon: Shield, color: "bg-indigo-500" },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: kpis, isLoading: kpisLoading } = trpc.dashboard.kpis.useQuery();
  const { data: alerts } = trpc.dashboard.alerts.useQuery();
  const { data: activity } = trpc.dashboard.recentActivity.useQuery();
  const { data: chartData } = trpc.dashboard.chartData.useQuery();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[var(--frm-primary)] rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">FRM ERP</h1>
                  <p className="text-sm text-gray-500">Sistema de Gestão Industrial</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <CompanySwitcher />
                <Link href="/docs" className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full" title="Documentação">
                  <BookOpen className="w-5 h-5" />
                </Link>
                <NotificationBell />
                <Link href="/profile" className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-[var(--frm-primary)] hover:bg-gray-50 rounded-lg" title="Meu Perfil">
                  <div className="w-8 h-8 bg-[var(--frm-primary)] rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="hidden sm:inline">{user?.email?.split("@")[0] || "Perfil"}</span>
                </Link>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Alerts */}
          {alerts && alerts.length > 0 && (
            <div className="mb-6 space-y-2">
              {alerts.map((alert, index) => (
                <Link
                  key={index}
                  href={alert.link || "#"}
                  className={`flex items-center gap-3 p-4 rounded-lg border ${
                    alert.type === "error" ? "bg-red-50 border-red-200 text-red-800" :
                    alert.type === "warning" ? "bg-yellow-50 border-yellow-200 text-yellow-800" :
                    "bg-blue-50 border-blue-200 text-blue-800"
                  }`}
                >
                  <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                  <div className="flex-1">
                    <span className="font-medium">{alert.title}:</span> {alert.message}
                  </div>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ))}
            </div>
          )}

          {/* KPIs Grid */}
          {kpisLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : kpis && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {/* Estoque */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center gap-2 text-orange-600 mb-2">
                  <Warehouse className="w-5 h-5" />
                  <span className="text-sm font-medium">Estoque</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{formatCurrency(kpis.inventory.totalValue)}</div>
                <div className="text-xs text-gray-500">{kpis.inventory.totalItems} itens</div>
                {kpis.inventory.lowStockCount > 0 && (
                  <div className="mt-2 text-xs text-red-600 flex items-center gap-1">
                    <TrendingDown className="w-3 h-3" />
                    {kpis.inventory.lowStockCount} abaixo do mínimo
                  </div>
                )}
              </div>

              {/* Contas Vencidas */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center gap-2 text-red-600 mb-2">
                  <DollarSign className="w-5 h-5" />
                  <span className="text-sm font-medium">Vencidos</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{formatCurrency(kpis.financial.overdue.value)}</div>
                <div className="text-xs text-gray-500">{kpis.financial.overdue.count} títulos</div>
              </div>

              {/* Vence Hoje */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center gap-2 text-yellow-600 mb-2">
                  <Clock className="w-5 h-5" />
                  <span className="text-sm font-medium">Vence Hoje</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{formatCurrency(kpis.financial.dueToday.value)}</div>
                <div className="text-xs text-gray-500">{kpis.financial.dueToday.count} títulos</div>
              </div>

              {/* Pago no Mês */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center gap-2 text-green-600 mb-2">
                  <TrendingUp className="w-5 h-5" />
                  <span className="text-sm font-medium">Pago no Mês</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{formatCurrency(kpis.financial.paidThisMonth.value)}</div>
                <div className="text-xs text-gray-500">{kpis.financial.paidThisMonth.count} pagamentos</div>
              </div>

              {/* Tarefas Pendentes */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center gap-2 text-purple-600 mb-2">
                  <ClipboardList className="w-5 h-5" />
                  <span className="text-sm font-medium">Tarefas</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{kpis.tasks.pending + kpis.tasks.inProgress}</div>
                <div className="text-xs text-gray-500">{kpis.tasks.pending} pendentes, {kpis.tasks.inProgress} em andamento</div>
                {kpis.tasks.overdue > 0 && (
                  <div className="mt-2 text-xs text-red-600 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {kpis.tasks.overdue} atrasadas
                  </div>
                )}
              </div>

              {/* Minhas Tarefas */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center gap-2 text-blue-600 mb-2">
                  <User className="w-5 h-5" />
                  <span className="text-sm font-medium">Minhas Tarefas</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{kpis.tasks.myTasks}</div>
                <div className="text-xs text-gray-500">atribuídas a mim</div>
              </div>

              {/* NFes Pendentes */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center gap-2 text-indigo-600 mb-2">
                  <FileInput className="w-5 h-5" />
                  <span className="text-sm font-medium">NFes Pendentes</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{kpis.purchases.pendingInvoices}</div>
                <div className="text-xs text-gray-500">aguardando aprovação</div>
              </div>

              {/* Requisições */}
              <div className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center gap-2 text-amber-600 mb-2">
                  <Package className="w-5 h-5" />
                  <span className="text-sm font-medium">Requisições</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{kpis.requisitions.pending}</div>
                <div className="text-xs text-gray-500">em andamento</div>
              </div>
            </div>
          )}

          {/* Charts Section */}
          {chartData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <ChartCard 
                title="Fluxo de Caixa Projetado" 
                subtitle="Próximos 30 dias"
                actions={
                  <Link href="/treasury" className="text-sm text-indigo-600 hover:underline flex items-center gap-1">
                    <BarChart3 className="w-4 h-4" />
                    Ver mais
                  </Link>
                }
              >
                <SimpleAreaChart
                  data={chartData.cashFlowProjection}
                  dataKeys={[
                    { key: "A Receber", color: "#10B981" },
                    { key: "A Pagar", color: "#EF4444" },
                  ]}
                  height={250}
                />
              </ChartCard>

              <ChartCard 
                title="Pagamentos por Mês" 
                subtitle="Últimos 6 meses"
                actions={
                  <Link href="/payables" className="text-sm text-indigo-600 hover:underline flex items-center gap-1">
                    <BarChart3 className="w-4 h-4" />
                    Ver mais
                  </Link>
                }
              >
                <SimpleBarChart
                  data={chartData.paymentsByMonth}
                  dataKeys={[
                    { key: "Pago", color: "#10B981" },
                    { key: "Pendente", color: "#F59E0B" },
                  ]}
                  height={250}
                />
              </ChartCard>

              <ChartCard 
                title="Estoque por Categoria" 
                subtitle="Valor em estoque"
                actions={
                  <Link href="/inventory" className="text-sm text-indigo-600 hover:underline flex items-center gap-1">
                    <BarChart3 className="w-4 h-4" />
                    Ver mais
                  </Link>
                }
              >
                <DonutChart
                  data={chartData.inventoryByCategory}
                  dataKey="value"
                  height={250}
                />
              </ChartCard>

              <ChartCard 
                title="Requisições por Mês" 
                subtitle="Últimos 6 meses"
                actions={
                  <Link href="/requisitions" className="text-sm text-indigo-600 hover:underline flex items-center gap-1">
                    <BarChart3 className="w-4 h-4" />
                    Ver mais
                  </Link>
                }
              >
                <SimpleBarChart
                  data={chartData.requisitionsByMonth}
                  dataKeys={[{ key: "Requisições", color: "#8B5CF6" }]}
                  height={250}
                />
              </ChartCard>
            </div>
          )}

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Recent Activity */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Atividade Recente</h3>
              
              {activity && (
                <div className="space-y-4">
                  {activity.tasks.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Tarefas</h4>
                      <div className="space-y-2">
                        {activity.tasks.slice(0, 3).map((task) => (
                          <Link key={task.id} href={`/tasks/${task.id}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                            <div className="flex items-center gap-3">
                              <ClipboardList className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-900">{task.title}</span>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded ${
                              task.status === "COMPLETED" ? "bg-green-100 text-green-700" :
                              task.status === "IN_PROGRESS" ? "bg-purple-100 text-purple-700" :
                              "bg-yellow-100 text-yellow-700"
                            }`}>{task.status}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {activity.invoices.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">NFes Recentes</h4>
                      <div className="space-y-2">
                        {activity.invoices.slice(0, 3).map((invoice) => (
                          <Link key={invoice.id} href={`/invoices/${invoice.id}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                            <div className="flex items-center gap-3">
                              <FileInput className="w-4 h-4 text-gray-400" />
                              <div>
                                <span className="text-sm text-gray-900">NFe {invoice.invoiceNumber}</span>
                                <span className="text-xs text-gray-500 ml-2">{invoice.supplier?.tradeName || invoice.supplier?.companyName}</span>
                              </div>
                            </div>
                            <span className="text-sm font-medium text-gray-900">{formatCurrency(invoice.totalValue)}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {activity.requisitions.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Requisições</h4>
                      <div className="space-y-2">
                        {activity.requisitions.slice(0, 3).map((req) => (
                          <Link key={req.id} href={`/requisitions/${req.id}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                            <div className="flex items-center gap-3">
                              <Package className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-900">#{req.code} - {req.type}</span>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded ${
                              req.status === "COMPLETED" ? "bg-green-100 text-green-700" :
                              req.status === "APPROVED" ? "bg-blue-100 text-blue-700" :
                              "bg-yellow-100 text-yellow-700"
                            }`}>{req.status}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {!activity.tasks.length && !activity.invoices.length && !activity.requisitions.length && (
                    <div className="text-center py-8 text-gray-500">
                      <CheckCircle className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                      <p>Nenhuma atividade recente</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick Access */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Acesso Rápido</h3>
              <div className="space-y-2">
                {modules.slice(0, 8).map((module) => (
                  <Link
                    key={module.href}
                    href={module.href}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className={`${module.color} p-2 rounded-lg`}>
                      <module.icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-900">{module.title}</span>
                      <p className="text-xs text-gray-500">{module.description}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* All Modules */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Todos os Módulos</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {modules.map((module) => (
                <Link
                  key={module.href}
                  href={module.href}
                  className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-gray-50 transition-colors text-center"
                >
                  <div className={`${module.color} p-3 rounded-lg`}>
                    <module.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-900">{module.title}</span>
                </Link>
              ))}
            </div>
          </div>
        </main>

        <footer className="mt-auto border-t bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <p className="text-sm text-gray-500 text-center">FRM ERP © 2026 - Sistema de Gestão Industrial</p>
          </div>
        </footer>
      </div>
    </ProtectedRoute>
  );
}
