"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Package,
  Search,
  Loader2,
  RefreshCw,
  Link2,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/Button";

export default function CatalogSyncPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [page, setPage] = useState(1);

  const { data: materialsData, isLoading, refetch } =
    trpc.productCatalog.getMaterialsWithoutProduct.useQuery({
      search: search || undefined,
      page,
      limit: 20,
    });

  const { data: syncStats, refetch: refetchStats } =
    trpc.productCatalog.getSyncStats.useQuery();

  const { data: categories } = trpc.productCatalog.listCategories.useQuery();

  const utils = trpc.useUtils();

  const syncMultipleMutation = trpc.productCatalog.syncMultiple.useMutation({
    onSuccess: (result) => {
      alert(`${result.created} produtos criados, ${result.skipped} ignorados`);
      setSelectedMaterials([]);
      refetch();
      refetchStats();
      utils.productCatalog.listProducts.invalidate();
    },
  });

  const materials = materialsData?.materials ?? [];
  const totalPages = materialsData?.pagination?.totalPages ?? 1;

  const handleSelectAll = () => {
    if (selectedMaterials.length === materials.length) {
      setSelectedMaterials([]);
    } else {
      setSelectedMaterials(materials.map((m) => m.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedMaterials((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSync = () => {
    if (selectedMaterials.length === 0) return;

    if (
      confirm(
        `Criar ${selectedMaterials.length} produto(s) a partir dos materiais selecionados?`
      )
    ) {
      syncMultipleMutation.mutate({
        materialIds: selectedMaterials,
        categoryId: categoryId || undefined,
        isPublished,
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Sincronizar Materiais → Produtos"
        subtitle="Crie produtos do catálogo a partir de materiais do estoque"
        actions={
          <Button
            variant="outline"
            onClick={() => router.push("/catalog")}
            leftIcon={<ArrowLeft size={20} />}
          >
            Voltar
          </Button>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {syncStats?.totalMaterials ?? 0}
          </div>
          <div className="text-sm text-gray-500">Materiais Ativos</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-green-600">
            {syncStats?.materialsWithProduct ?? 0}
          </div>
          <div className="text-sm text-gray-500">Com Produto</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-yellow-600">
            {syncStats?.materialsWithoutProduct ?? 0}
          </div>
          <div className="text-sm text-gray-500">Sem Produto</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-2xl font-bold text-blue-600">
            {syncStats?.syncPercentage ?? 0}%
          </div>
          <div className="text-sm text-gray-500">Sincronizado</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-1 gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:max-w-md">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Buscar materiais..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
            />
          </div>
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCw size={20} />
          </Button>
        </div>

        {selectedMaterials.length > 0 && (
          <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-950 px-4 py-2 rounded-lg">
            <span className="text-sm text-blue-700 dark:text-blue-300">
              {selectedMaterials.length} selecionado(s)
            </span>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="px-2 py-1 text-sm border border-blue-300 dark:border-blue-700 rounded bg-white dark:bg-gray-800"
            >
              <option value="">Sem categoria</option>
              {categories?.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="rounded"
              />
              Publicar
            </label>
            <Button
              size="sm"
              onClick={handleSync}
              isLoading={syncMultipleMutation.isPending}
              rightIcon={<ArrowRight size={16} />}
            >
              Criar Produtos
            </Button>
          </div>
        )}
      </div>

      {/* Materials List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={32} className="animate-spin text-blue-600" />
        </div>
      ) : materials.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <Package size={48} className="mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            {search
              ? "Nenhum material encontrado"
              : "Todos os materiais já possuem produto"}
          </h3>
          <p className="text-gray-500">
            {search
              ? "Tente ajustar a busca"
              : "Não há materiais pendentes de sincronização"}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={
                      selectedMaterials.length === materials.length &&
                      materials.length > 0
                    }
                    onChange={handleSelectAll}
                    className="rounded"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Código
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Descrição
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Unidade
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  NCM
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Último Preço
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Categoria
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {materials.map((material) => (
                <tr
                  key={material.id}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer ${
                    selectedMaterials.includes(material.id)
                      ? "bg-blue-50 dark:bg-blue-950"
                      : ""
                  }`}
                  onClick={() => handleToggleSelect(material.id)}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedMaterials.includes(material.id)}
                      onChange={() => handleToggleSelect(material.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="rounded"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm font-mono">{material.code}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900 dark:text-gray-100">
                      {material.description}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {material.unit}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 font-mono">
                    {material.ncm || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {material.lastPurchasePrice ? (
                      <span className="font-medium">
                        R$ {material.lastPurchasePrice.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {material.category?.name || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Anterior
          </Button>
          <span className="text-sm text-gray-500">
            Página {page} de {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Próxima
          </Button>
        </div>
      )}

      {/* Info */}
      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="font-medium text-blue-700 dark:text-blue-300 mb-2 flex items-center gap-2">
          <Link2 size={18} />
          Como funciona a sincronização
        </h4>
        <ul className="text-sm text-blue-600 dark:text-blue-400 space-y-1">
          <li>• Selecione os materiais que deseja transformar em produtos</li>
          <li>• Opcionalmente, escolha uma categoria para os novos produtos</li>
          <li>• Marque &quot;Publicar&quot; para publicar imediatamente</li>
          <li>• Os dados do material (NCM, unidade, peso) serão copiados</li>
          <li>• Você pode editar os produtos depois para adicionar imagens e descrições</li>
        </ul>
      </div>
    </div>
  );
}
