"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Users, Download, Loader2, Search, ChevronDown, ChevronRight } from "lucide-react";

export default function HeadcountReportPage() {
  const [search, setSearch] = useState("");
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set());

  const { data, isLoading } = trpc.reports.headcount.useQuery();

  const filteredItems = data?.items.filter((item) =>
    item.department.toLowerCase().includes(search.toLowerCase())
  );

  const toggleDept = (dept: string) => {
    const newExpanded = new Set(expandedDepts);
    if (newExpanded.has(dept)) {
      newExpanded.delete(dept);
    } else {
      newExpanded.add(dept);
    }
    setExpandedDepts(newExpanded);
  };

  const handleExportCSV = () => {
    if (!filteredItems) return;

    const headers = ["Departamento", "Cargo", "Quantidade"];
    const rows: string[][] = [];
    
    filteredItems.forEach((item) => {
      Object.entries(item.positions).forEach(([position, count]) => {
        rows.push([item.department, position, count.toString()]);
      });
    });

    const csvContent = [headers.join(";"), ...rows.map((row) => row.join(";"))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `headcount-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const colors = [
    "bg-blue-500", "bg-green-500", "bg-purple-500", "bg-orange-500", 
    "bg-pink-500", "bg-teal-500", "bg-indigo-500", "bg-red-500"
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Headcount por Departamento"
        subtitle="Funcionários ativos por área"
        icon={<Users className="w-6 h-6" />}
        backHref="/reports"
        module="reports"
        actions={
          <button
            onClick={handleExportCSV}
            disabled={!filteredItems?.length}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
        }
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-theme-card rounded-lg shadow-sm border p-4">
              <p className="text-sm text-theme-muted">Total de Funcionários</p>
              <p className="text-3xl font-bold text-theme">{data.totals.totalEmployees.toLocaleString("pt-BR")}</p>
            </div>
            <div className="bg-indigo-50 rounded-lg shadow-sm border border-indigo-200 p-4">
              <p className="text-sm text-indigo-700">Total de Departamentos</p>
              <p className="text-3xl font-bold text-blue-600">{data.totals.totalDepartments}</p>
            </div>
          </div>
        )}

        <div className="bg-theme-card rounded-lg shadow-sm border p-4 mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
            <input
              type="text"
              placeholder="Buscar departamento..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-theme-input rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        )}

        {!isLoading && filteredItems && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart */}
            <div className="bg-theme-card rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-theme mb-4">Distribuição por Departamento</h3>
              <div className="space-y-3">
                {filteredItems.map((item, idx) => {
                  const percent = data?.totals.totalEmployees ? (item.count / data.totals.totalEmployees) * 100 : 0;
                  return (
                    <div key={item.department} className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${colors[idx % colors.length]}`} />
                      <span className="text-sm text-theme-secondary flex-1 truncate">{item.department}</span>
                      <div className="w-32 bg-theme-tertiary rounded-full h-2">
                        <div className={`h-2 rounded-full ${colors[idx % colors.length]}`} style={{ width: `${percent}%` }} />
                      </div>
                      <span className="text-sm font-medium text-theme w-12 text-right">{item.count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Table */}
            <div className="bg-theme-card rounded-lg shadow-sm border overflow-hidden">
              <div className="p-4 border-b">
                <h3 className="text-lg font-semibold text-theme">Detalhamento por Cargo</h3>
              </div>
              <div className="divide-y divide-theme-table">
                {filteredItems.map((item) => (
                  <div key={item.department}>
                    <button
                      onClick={() => toggleDept(item.department)}
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-theme-hover"
                    >
                      <div className="flex items-center gap-2">
                        {expandedDepts.has(item.department) ? (
                          <ChevronDown className="w-4 h-4 text-theme-muted" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-theme-muted" />
                        )}
                        <span className="font-medium text-theme">{item.department}</span>
                      </div>
                      <span className="text-sm font-bold text-blue-600">{item.count} funcionários</span>
                    </button>
                    {expandedDepts.has(item.department) && (
                      <div className="bg-theme-tertiary px-8 py-2">
                        {Object.entries(item.positions).map(([position, count]) => (
                          <div key={position} className="flex items-center justify-between py-1">
                            <span className="text-sm text-theme-secondary">{position}</span>
                            <span className="text-sm text-theme">{count}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {filteredItems.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-theme-muted mx-auto mb-4" />
                  <p className="text-theme-muted">Nenhum departamento encontrado</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
