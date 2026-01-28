"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import {
  FileText,
  Package,
  ArrowLeftRight,
  TrendingDown,
  TrendingUp,
  Wallet,
  Users,
  Search,
  Loader2,
  BarChart3,
} from "lucide-react";

const iconMap: Record<string, React.ReactNode> = {
  Package: <Package className="w-6 h-6" />,
  ArrowLeftRight: <ArrowLeftRight className="w-6 h-6" />,
  TrendingDown: <TrendingDown className="w-6 h-6" />,
  TrendingUp: <TrendingUp className="w-6 h-6" />,
  Wallet: <Wallet className="w-6 h-6" />,
  Users: <Users className="w-6 h-6" />,
};

const categoryColors: Record<string, string> = {
  Estoque: "bg-blue-100 text-blue-800",
  Financeiro: "bg-green-100 text-green-800",
  Compras: "bg-purple-100 text-purple-800",
};

export default function ReportsPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: reports, isLoading } = trpc.reports.available.useQuery();

  const filteredReports = reports?.filter((report) => {
    const matchesSearch =
      report.name.toLowerCase().includes(search.toLowerCase()) ||
      report.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !selectedCategory || report.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = reports ? [...new Set(reports.map((r) => r.category))] : [];

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-500/10 rounded-lg">
          <BarChart3 className="w-6 h-6 text-indigo-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-theme">Relatórios Gerenciais</h1>
          <p className="text-sm text-theme-muted">Análises e indicadores do sistema</p>
        </div>
      </div>

      <div>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-theme-muted" />
            <input
              type="text"
              placeholder="Buscar relatórios..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-theme-input rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                !selectedCategory
                  ? "bg-indigo-600 text-white"
                  : "bg-theme-card text-theme-secondary border border-theme-input hover:bg-theme-hover"
              }`}
            >
              Todos
            </button>
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? "bg-indigo-600 text-white"
                    : "bg-theme-card text-theme-secondary border border-theme-input hover:bg-theme-hover"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        )}

        {/* Reports Grid */}
        {!isLoading && filteredReports && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredReports.map((report) => (
              <Link
                key={report.id}
                href={`/reports/${report.id}`}
                className="bg-theme-card rounded-xl border border-theme p-6 hover:shadow-md hover:border-indigo-300 transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    {iconMap[report.icon] || <FileText className="w-6 h-6" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-theme group-hover:text-indigo-600 transition-colors">
                        {report.name}
                      </h3>
                    </div>
                    <p className="text-sm text-theme-muted mb-3">{report.description}</p>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        categoryColors[report.category] || "bg-theme-tertiary text-theme"
                      }`}
                    >
                      {report.category}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredReports?.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-theme-muted mx-auto mb-4" />
            <h3 className="text-lg font-medium text-theme mb-2">Nenhum relatório encontrado</h3>
            <p className="text-theme-muted">Tente ajustar os filtros de busca</p>
          </div>
        )}
      </div>
    </div>
  );
}
