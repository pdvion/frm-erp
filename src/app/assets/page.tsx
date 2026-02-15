"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@/lib/formatters";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Alert } from "@/components/ui/Alert";
import {
  Building,
  Search,
  Loader2,
  Eye,
  MapPin,
  User,
} from "lucide-react";

const categoryLabels: Record<string, string> = {
  MACHINERY: "Máquinas",
  VEHICLES: "Veículos",
  FURNITURE: "Móveis",
  IT_EQUIPMENT: "Equipamentos TI",
  BUILDINGS: "Imóveis",
  LAND: "Terrenos",
  OTHER: "Outros",
};

const statusConfig: Record<string, { label: string; variant: "success" | "error" | "warning" | "default" }> = {
  ACTIVE: { label: "Ativo", variant: "success" },
  DISPOSED: { label: "Baixado", variant: "error" },
  TRANSFERRED: { label: "Transferido", variant: "warning" },
  FULLY_DEPRECIATED: { label: "Depreciado", variant: "default" },
};

const categoryOptions = [
  { value: "ALL", label: "Todas as categorias" },
  { value: "MACHINERY", label: "Máquinas" },
  { value: "VEHICLES", label: "Veículos" },
  { value: "FURNITURE", label: "Móveis" },
  { value: "IT_EQUIPMENT", label: "Equipamentos TI" },
  { value: "BUILDINGS", label: "Imóveis" },
  { value: "LAND", label: "Terrenos" },
  { value: "OTHER", label: "Outros" },
];

const statusOptions = [
  { value: "ALL", label: "Todos os status" },
  { value: "ACTIVE", label: "Ativo" },
  { value: "DISPOSED", label: "Baixado" },
  { value: "TRANSFERRED", label: "Transferido" },
  { value: "FULLY_DEPRECIATED", label: "Depreciado" },
];

export default function AssetsPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const { data: assets, isLoading, isError, error } = trpc.assets.listAssets.useQuery({
    search: search || undefined,
    category: categoryFilter !== "ALL" ? (categoryFilter as "MACHINERY" | "VEHICLES" | "FURNITURE" | "IT_EQUIPMENT" | "BUILDINGS" | "LAND" | "OTHER") : undefined,
    status: statusFilter !== "ALL" ? (statusFilter as "ACTIVE" | "DISPOSED" | "TRANSFERRED" | "FULLY_DEPRECIATED") : undefined,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Patrimônio"
        icon={<Building className="w-6 h-6" />}
        module="financeiro"
        actions={
          <div className="flex items-center gap-2">
            <Link href="/assets/depreciation">
              <Button variant="outline">Depreciação</Button>
            </Link>
            <Link href="/assets/movements">
              <Button variant="outline">Movimentações</Button>
            </Link>
          </div>
        }
      />

      {/* Filters */}
      <div className="bg-theme-card rounded-lg border border-theme p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
            <Input
              placeholder="Buscar por nome ou número de série..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="w-full md:w-48">
            <Select
              value={categoryFilter}
              onChange={(v) => setCategoryFilter(v)}
              options={categoryOptions}
            />
          </div>
          <div className="w-full md:w-44">
            <Select
              value={statusFilter}
              onChange={(v) => setStatusFilter(v)}
              options={statusOptions}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-theme-card rounded-lg border border-theme overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : isError ? (
          <div className="p-6">
            <Alert variant="error" title="Erro ao carregar ativos">{error.message}</Alert>
          </div>
        ) : !assets?.length ? (
          <div className="text-center py-12">
            <Building className="w-12 h-12 mx-auto text-theme-muted mb-4" />
            <p className="text-theme-muted">Nenhum ativo encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-theme-table-header border-b border-theme">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Código</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Ativo</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Categoria</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase">Valor Aquisição</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-theme-muted uppercase">Valor Atual</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Localização</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Responsável</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-table">
                {assets.map((asset) => {
                  const st = statusConfig[asset.status] ?? statusConfig.ACTIVE;
                  return (
                    <tr key={asset.id} className="hover:bg-theme-table-hover transition-colors">
                      <td className="px-4 py-3">
                        <span className="text-sm font-mono text-theme">{asset.code}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-theme">{asset.name}</div>
                        {asset.serialNumber && (
                          <div className="text-xs text-theme-muted">S/N: {asset.serialNumber}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant="outline">{categoryLabels[asset.category] ?? asset.category}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right text-sm text-theme">
                        {formatCurrency(Number(asset.acquisitionValue))}
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-theme">
                        {formatCurrency(Number(asset.netBookValue))}
                      </td>
                      <td className="px-4 py-3">
                        {asset.location ? (
                          <div className="flex items-center gap-1 text-sm text-theme-secondary">
                            <MapPin className="w-3 h-3 text-theme-muted" />
                            {asset.location}
                          </div>
                        ) : (
                          <span className="text-sm text-theme-muted">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {asset.responsible ? (
                          <div className="flex items-center gap-1 text-sm text-theme-secondary">
                            <User className="w-3 h-3 text-theme-muted" />
                            {asset.responsible.name}
                          </div>
                        ) : (
                          <span className="text-sm text-theme-muted">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={st.variant}>{st.label}</Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Link href={`/assets/${asset.id}`}>
                          <Button variant="ghost" size="icon">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
