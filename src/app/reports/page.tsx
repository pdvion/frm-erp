"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
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
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const iconMap: Record<string, React.ReactNode> = {
  Package: <Package className="w-6 h-6" />,
  ArrowLeftRight: <ArrowLeftRight className="w-6 h-6" />,
  TrendingDown: <TrendingDown className="w-6 h-6" />,
  TrendingUp: <TrendingUp className="w-6 h-6" />,
  Wallet: <Wallet className="w-6 h-6" />,
  Users: <Users className="w-6 h-6" />,
};

const categoryColors: Record<string, string> = {
  Estoque: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  Financeiro: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  Compras: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
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
      <PageHeader
        title="Relatórios Gerenciais"
        subtitle="Análises e indicadores do sistema"
        icon={<BarChart3 className="w-6 h-6" />}
        module="reports"
      />

      <div>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-theme-muted z-10" />
            <Input
              placeholder="Buscar relatórios..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={!selectedCategory ? "primary" : "outline"}
              onClick={() => setSelectedCategory(null)}
            >
              Todos
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "primary" : "outline"}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
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
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    {iconMap[report.icon] || <FileText className="w-6 h-6" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-theme group-hover:text-blue-600 transition-colors">
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
