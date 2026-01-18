"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { CompanySwitcher } from "@/components/CompanySwitcher";
import {
  MapPin,
  ChevronLeft,
  Loader2,
  Plus,
  Warehouse,
  Package,
  ArrowRightLeft,
  FolderTree,
} from "lucide-react";

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
  WAREHOUSE: "bg-blue-100 text-blue-800",
  SHELF: "bg-gray-100 text-gray-800",
  BIN: "bg-purple-100 text-purple-800",
  ZONE: "bg-green-100 text-green-800",
  PRODUCTION: "bg-orange-100 text-orange-800",
  QUARANTINE: "bg-red-100 text-red-800",
  SHIPPING: "bg-cyan-100 text-cyan-800",
  RECEIVING: "bg-yellow-100 text-yellow-800",
};

export default function LocationsPage() {
  const { data: locations, isLoading } = trpc.stockLocations.list.useQuery({});

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <MapPin className="w-6 h-6 text-blue-600" />
                <h1 className="text-xl font-semibold text-gray-900">Locais de Estoque</h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <CompanySwitcher />
              <Link
                href="/locations/new"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                Novo Local
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Links Rápidos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link
            href="/transfers"
            className="bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all flex items-center gap-4"
          >
            <div className="p-3 bg-green-100 rounded-lg">
              <ArrowRightLeft className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Transferências</h3>
              <p className="text-sm text-gray-500">Movimentar entre locais</p>
            </div>
          </Link>

          <Link
            href="/inventory"
            className="bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all flex items-center gap-4"
          >
            <div className="p-3 bg-purple-100 rounded-lg">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Estoque</h3>
              <p className="text-sm text-gray-500">Consultar saldos</p>
            </div>
          </Link>

          <Link
            href="/inventory-count"
            className="bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all flex items-center gap-4"
          >
            <div className="p-3 bg-orange-100 rounded-lg">
              <Warehouse className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Inventário Físico</h3>
              <p className="text-sm text-gray-500">Contagem de estoque</p>
            </div>
          </Link>
        </div>

        {/* Lista de Locais */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : !locations?.length ? (
            <div className="text-center py-12">
              <MapPin className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Nenhum local cadastrado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Tipo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Local Pai</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {locations.map((loc) => (
                    <tr key={loc.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{loc.code}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{loc.name}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${typeColors[loc.type] || "bg-gray-100"}`}>
                          {typeLabels[loc.type] || loc.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {loc.parent ? (
                          <div className="flex items-center gap-1">
                            <FolderTree className="w-3 h-3 text-gray-400" />
                            {loc.parent.name}
                          </div>
                        ) : "-"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${loc.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                          {loc.isActive ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
