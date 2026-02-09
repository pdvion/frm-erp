"use client";

import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import {
  MapPin,
  Loader2,
  Plus,
  Warehouse,
  Package,
  ArrowRightLeft,
  FolderTree,
} from "lucide-react";
import { Badge, colorToVariant } from "@/components/ui/Badge";

const typeLabels: Record<string, string> = {
  WAREHOUSE: "Almoxarifado",
  SHELF: "Prateleira",
  BIN: "Gaveta",
  ZONE: "Zona",
  PRODUCTION: "Produção",
  QUARANTINE: "Quarentena",
  SHIPPING: "Expedição",
  RECEIVING: "Recebimento",
};

const typeColors: Record<string, string> = {
  WAREHOUSE: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  SHELF: "bg-theme-tertiary text-theme",
  BIN: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  ZONE: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  PRODUCTION: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  QUARANTINE: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  SHIPPING: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
  RECEIVING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
};

export default function LocationsPage() {
  const { data: locations, isLoading } = trpc.stockLocations.list.useQuery({});

  return (
    <div className="space-y-6">
      <PageHeader
        title="Locais de Estoque"
        subtitle="Gerencie locais de armazenamento"
        icon={<MapPin className="w-6 h-6" />}
        module="inventory"
        actions={
          <Link
            href="/locations/new"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Novo Local
          </Link>
        }
      />

      <div>
        {/* Links Rápidos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link
            href="/transfers"
            className="bg-theme-card rounded-lg border border-theme p-4 hover:border-blue-300 hover:shadow-sm transition-all flex items-center gap-4"
          >
            <div className="p-3 bg-green-100 rounded-lg">
              <ArrowRightLeft className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium text-theme">Transferências</h3>
              <p className="text-sm text-theme-muted">Movimentar entre locais</p>
            </div>
          </Link>

          <Link
            href="/inventory"
            className="bg-theme-card rounded-lg border border-theme p-4 hover:border-blue-300 hover:shadow-sm transition-all flex items-center gap-4"
          >
            <div className="p-3 bg-purple-100 rounded-lg">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-medium text-theme">Estoque</h3>
              <p className="text-sm text-theme-muted">Consultar saldos</p>
            </div>
          </Link>

          <Link
            href="/inventory-count"
            className="bg-theme-card rounded-lg border border-theme p-4 hover:border-blue-300 hover:shadow-sm transition-all flex items-center gap-4"
          >
            <div className="p-3 bg-orange-100 rounded-lg">
              <Warehouse className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="font-medium text-theme">Inventário Físico</h3>
              <p className="text-sm text-theme-muted">Contagem de estoque</p>
            </div>
          </Link>
        </div>

        {/* Lista de Locais */}
        <div className="bg-theme-card rounded-lg border border-theme overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : !locations?.length ? (
            <div className="text-center py-12">
              <MapPin className="w-12 h-12 mx-auto text-theme-muted mb-4" />
              <p className="text-theme-muted">Nenhum local cadastrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-theme-table">
                <thead className="bg-theme-tertiary">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Código</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Nome</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Tipo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-theme-muted uppercase">Local Pai</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-theme-muted uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-table">
                  {locations.map((loc) => (
                    <tr key={loc.id} className="hover:bg-theme-hover">
                      <td className="px-4 py-3 font-medium text-theme">{loc.code}</td>
                      <td className="px-4 py-3 text-sm text-theme-secondary">{loc.name}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={colorToVariant(typeColors[loc.type] || "")}>
                          {typeLabels[loc.type] || loc.type}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-theme-secondary">
                        {loc.parent ? (
                          <div className="flex items-center gap-1">
                            <FolderTree className="w-3 h-3 text-theme-muted" />
                            {loc.parent.name}
                          </div>
                        ) : "-"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={loc.isActive ? "success" : "default"}>
                          {loc.isActive ? "Ativo" : "Inativo"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
