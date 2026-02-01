"use client";

import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import {
  FileText,
  Download,
  Calendar,
  Filter,
  Clock,
  Star,
  StarOff,
  Play,
  BarChart3,
  PieChart,
  TrendingUp,
  Users,
  Package,
  DollarSign,
  FileSpreadsheet,
  Mail,
  Printer,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

// Categorias de relatórios
const reportCategories = [
  { id: "all", label: "Todos", icon: FileText },
  { id: "financial", label: "Financeiro", icon: DollarSign },
  { id: "sales", label: "Vendas", icon: TrendingUp },
  { id: "inventory", label: "Estoque", icon: Package },
  { id: "hr", label: "RH", icon: Users },
];

// Relatórios disponíveis
const reports = [
  {
    id: "1",
    name: "DRE - Demonstrativo de Resultados",
    category: "financial",
    description: "Demonstrativo de resultados do exercício com análise de receitas e despesas",
    icon: BarChart3,
    lastRun: "2026-01-29T14:30:00",
    favorite: true,
    format: ["PDF", "Excel"],
  },
  {
    id: "2",
    name: "Fluxo de Caixa Projetado",
    category: "financial",
    description: "Projeção de entradas e saídas para os próximos 90 dias",
    icon: TrendingUp,
    lastRun: "2026-01-28T09:15:00",
    favorite: true,
    format: ["PDF", "Excel"],
  },
  {
    id: "3",
    name: "Vendas por Período",
    category: "sales",
    description: "Análise detalhada de vendas com filtros por período, vendedor e região",
    icon: BarChart3,
    lastRun: "2026-01-29T16:00:00",
    favorite: false,
    format: ["PDF", "Excel", "CSV"],
  },
  {
    id: "4",
    name: "Ranking de Produtos",
    category: "sales",
    description: "Top produtos por quantidade vendida e faturamento",
    icon: PieChart,
    lastRun: "2026-01-27T11:20:00",
    favorite: true,
    format: ["PDF", "Excel"],
  },
  {
    id: "5",
    name: "Posição de Estoque",
    category: "inventory",
    description: "Posição atual do estoque com custo médio e giro",
    icon: Package,
    lastRun: "2026-01-29T08:00:00",
    favorite: false,
    format: ["PDF", "Excel", "CSV"],
  },
  {
    id: "6",
    name: "Curva ABC de Materiais",
    category: "inventory",
    description: "Classificação ABC dos materiais por valor de consumo",
    icon: PieChart,
    lastRun: "2026-01-25T14:45:00",
    favorite: false,
    format: ["PDF", "Excel"],
  },
  {
    id: "7",
    name: "Folha de Pagamento",
    category: "hr",
    description: "Resumo da folha de pagamento por departamento",
    icon: Users,
    lastRun: "2026-01-20T10:00:00",
    favorite: false,
    format: ["PDF", "Excel"],
  },
  {
    id: "8",
    name: "Análise de Turnover",
    category: "hr",
    description: "Indicadores de rotatividade e tempo médio de permanência",
    icon: BarChart3,
    lastRun: "2026-01-15T09:30:00",
    favorite: false,
    format: ["PDF"],
  },
  {
    id: "9",
    name: "Contas a Receber Aging",
    category: "financial",
    description: "Análise de aging de contas a receber por faixa de vencimento",
    icon: DollarSign,
    lastRun: "2026-01-29T07:00:00",
    favorite: true,
    format: ["PDF", "Excel"],
  },
  {
    id: "10",
    name: "Comissões de Vendedores",
    category: "sales",
    description: "Cálculo de comissões por vendedor e período",
    icon: Users,
    lastRun: "2026-01-28T17:00:00",
    favorite: false,
    format: ["PDF", "Excel"],
  },
];

// Relatórios agendados
const scheduledReports = [
  { name: "DRE Mensal", schedule: "Todo dia 1 às 08:00", nextRun: "2026-02-01T08:00:00" },
  { name: "Posição de Estoque", schedule: "Diário às 07:00", nextRun: "2026-01-30T07:00:00" },
  { name: "Vendas Semanais", schedule: "Segunda às 09:00", nextRun: "2026-02-03T09:00:00" },
];

export default function BIReportsPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [favorites, setFavorites] = useState<string[]>(
    reports.filter((r) => r.favorite).map((r) => r.id)
  );

  const filteredReports = reports.filter((report) => {
    const matchesCategory = selectedCategory === "all" || report.category === selectedCategory;
    const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleFavorite = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      financial: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      sales: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
      inventory: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
      hr: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
    };
    return colors[category] || "bg-theme-tertiary text-theme-secondary";
  };

  const getCategoryLabel = (category: string) => {
    return reportCategories.find((c) => c.id === category)?.label || category;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Relatórios BI"
        subtitle="Central de relatórios e análises"
        icon={<FileText className="w-6 h-6" />}
        module="BI"
        backHref="/bi"
        backLabel="Voltar"
      />

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar relatórios..."
              className="w-full pl-10 pr-4 py-2 bg-theme-input border border-theme-input rounded-lg text-theme placeholder-theme-muted focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
          {reportCategories.map((cat) => {
            const Icon = cat.icon;
            return (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? "primary" : "secondary"}
                size="sm"
                onClick={() => setSelectedCategory(cat.id)}
                leftIcon={<Icon className="w-4 h-4" />}
              >
                {cat.label}
              </Button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Relatórios */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-semibold text-theme">
            {filteredReports.length} relatório{filteredReports.length !== 1 ? "s" : ""} encontrado{filteredReports.length !== 1 ? "s" : ""}
          </h3>

          <div className="space-y-3">
            {filteredReports.map((report) => {
              const Icon = report.icon;
              const isFavorite = favorites.includes(report.id);
              return (
                <div
                  key={report.id}
                  className="bg-theme-card border border-theme rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-theme-secondary rounded-lg">
                      <Icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-theme">{report.name}</h4>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${getCategoryColor(report.category)}`}>
                          {getCategoryLabel(report.category)}
                        </span>
                      </div>
                      <p className="text-sm text-theme-muted mb-3">{report.description}</p>
                      <div className="flex items-center gap-4 text-xs text-theme-muted">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Última execução: {formatDate(report.lastRun)}
                        </span>
                        <span className="flex items-center gap-1">
                          <FileSpreadsheet className="w-3 h-3" />
                          {report.format.join(", ")}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleFavorite(report.id)}
                      >
                        {isFavorite ? (
                          <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                        ) : (
                          <StarOff className="w-5 h-5 text-theme-muted" />
                        )}
                      </Button>
                      <Button size="sm" className="p-2">
                        <Play className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex gap-2 mt-4 pt-3 border-t border-theme">
                    <Button variant="secondary" size="sm" leftIcon={<Download className="w-4 h-4" />}>
                      PDF
                    </Button>
                    <Button variant="secondary" size="sm" leftIcon={<FileSpreadsheet className="w-4 h-4" />}>
                      Excel
                    </Button>
                    <Button variant="secondary" size="sm" leftIcon={<Mail className="w-4 h-4" />}>
                      E-mail
                    </Button>
                    <Button variant="secondary" size="sm" leftIcon={<Printer className="w-4 h-4" />}>
                      Imprimir
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredReports.length === 0 && (
            <div className="text-center py-12 text-theme-muted">
              Nenhum relatório encontrado com os filtros selecionados.
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Favoritos */}
          <div className="bg-theme-card border border-theme rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 text-yellow-500" />
              <h3 className="font-semibold text-theme">Favoritos</h3>
            </div>
            <div className="space-y-2">
              {reports
                .filter((r) => favorites.includes(r.id))
                .slice(0, 5)
                .map((report) => (
                  <Button
                    key={report.id}
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    leftIcon={<Play className="w-4 h-4 text-blue-600" />}
                  >
                    <span className="truncate">{report.name}</span>
                  </Button>
                ))}
              {favorites.length === 0 && (
                <p className="text-sm text-theme-muted">Nenhum favorito ainda</p>
              )}
            </div>
          </div>

          {/* Agendamentos */}
          <div className="bg-theme-card border border-theme rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-theme">Agendamentos</h3>
            </div>
            <div className="space-y-3">
              {scheduledReports.map((scheduled, idx) => (
                <div key={idx} className="p-3 bg-theme-secondary rounded-lg">
                  <div className="font-medium text-theme text-sm">{scheduled.name}</div>
                  <div className="text-xs text-theme-muted mt-1">{scheduled.schedule}</div>
                  <div className="text-xs text-blue-600 mt-1">
                    Próxima: {formatDate(scheduled.nextRun)}
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="w-full mt-4">
              Gerenciar Agendamentos
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
