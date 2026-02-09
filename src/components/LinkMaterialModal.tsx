"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import {
  X,
  Search,
  Loader2,
  Package,
  Link2,
  Plus,
  CheckCircle,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface LinkMaterialModalProps {
  itemId: string;
  itemName: string;
  itemCode: string;
  onClose: () => void;
  onLinked: () => void;
}

export function LinkMaterialModal({
  itemId,
  itemName,
  itemCode,
  onClose,
  onLinked,
}: LinkMaterialModalProps) {
  const [search, setSearch] = useState("");
  const [saveForFuture, setSaveForFuture] = useState(true);

  // Buscar sugestões automáticas
  const { data: suggestions, isLoading: loadingSuggestions } =
    trpc.nfe.suggestMaterials.useQuery({ itemId });

  // Buscar materiais por pesquisa
  const { data: searchResults, isLoading: loadingSearch } =
    trpc.materials.list.useQuery(
      { search, limit: 10 },
      { enabled: search.length >= 2 }
    );

  // Mutation para vincular
  const linkMutation = trpc.nfe.linkItemAndSave.useMutation({
    onSuccess: () => {
      onLinked();
      onClose();
    },
  });

  // Mutation para criar material
  const createMutation = trpc.nfe.createMaterialFromItem.useMutation({
    onSuccess: () => {
      onLinked();
      onClose();
    },
  });

  const handleLink = (materialId: string) => {
    linkMutation.mutate({
      itemId,
      materialId,
      saveForFuture,
    });
  };

  const handleCreateMaterial = () => {
    createMutation.mutate({ itemId });
  };

  const isLoading = linkMutation.isPending || createMutation.isPending;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-theme-card rounded-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-theme">
              Vincular Material
            </h2>
            <p className="text-sm text-theme-muted mt-1">
              {itemName} <span className="text-theme-muted">({itemCode})</span>
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Search */}
        <div className="px-6 py-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-theme-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar material por código ou descrição..."
              className="w-full pl-10 pr-4 py-2 border border-theme rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Sugestões automáticas */}
          {!search && suggestions && suggestions.suggestions.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-theme-secondary mb-3 flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Sugestões Automáticas
                {suggestions.hasExactMatch && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    Match exato encontrado
                  </span>
                )}
              </h3>
              <div className="space-y-2">
                {suggestions.suggestions.map((material) => (
                  <button
                    key={material.id}
                    onClick={() => handleLink(material.id)}
                    disabled={isLoading}
                    className="w-full flex items-center justify-between p-3 border border-theme rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors disabled:opacity-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-theme-tertiary rounded-lg flex items-center justify-center">
                        <Package className="w-5 h-5 text-theme-muted" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-theme">
                          {material.description}
                        </p>
                        <p className="text-sm text-theme-muted">
                          Cód: {material.code} | {material.unit}
                          {material.matchType === "supplier_code" && (
                            <span className="ml-2 text-green-600">
                              • Código do fornecedor
                            </span>
                          )}
                          {material.matchType === "ncm" && (
                            <span className="ml-2 text-blue-600">• NCM</span>
                          )}
                          {material.matchType === "description" && (
                            <span className="ml-2 text-theme-muted">
                              • Descrição similar
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <Link2 className="w-5 h-5 text-blue-500" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Resultados da busca */}
          {search.length >= 2 && (
            <div>
              <h3 className="text-sm font-medium text-theme-secondary mb-3 flex items-center gap-2">
                <Search className="w-4 h-4" />
                Resultados da Busca
              </h3>
              {loadingSearch ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-theme-muted" />
                </div>
              ) : searchResults?.materials.length === 0 ? (
                <p className="text-center py-8 text-theme-muted">
                  Nenhum material encontrado
                </p>
              ) : (
                <div className="space-y-2">
                  {searchResults?.materials.map((material) => (
                    <button
                      key={material.id}
                      onClick={() => handleLink(material.id)}
                      disabled={isLoading}
                      className="w-full flex items-center justify-between p-3 border border-theme rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors disabled:opacity-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-theme-tertiary rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-theme-muted" />
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-theme">
                            {material.description}
                          </p>
                          <p className="text-sm text-theme-muted">
                            Cód: {material.code} | {material.unit}
                          </p>
                        </div>
                      </div>
                      <Link2 className="w-5 h-5 text-blue-500" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Loading sugestões */}
          {!search && loadingSuggestions && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-theme-muted" />
            </div>
          )}

          {/* Sem sugestões */}
          {!search &&
            !loadingSuggestions &&
            suggestions?.suggestions.length === 0 && (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-theme-muted mx-auto mb-3" />
              <p className="text-theme-muted mb-4">
                  Nenhuma sugestão encontrada
              </p>
              <p className="text-sm text-theme-muted">
                  Use a busca acima ou crie um novo material
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-theme-secondary">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-theme-secondary">
              <input
                type="checkbox"
                checked={saveForFuture}
                onChange={(e) => setSaveForFuture(e.target.checked)}
                className="rounded border-theme text-blue-600 focus:ring-blue-500"
              />
              Salvar vínculo para futuras importações
            </label>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={onClose}
              >
                Cancelar
              </Button>
              <Button
                variant="success"
                onClick={handleCreateMaterial}
                disabled={isLoading}
                isLoading={createMutation.isPending}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Criar Material
              </Button>
            </div>
          </div>

          {/* Success message */}
          {(linkMutation.isSuccess || createMutation.isSuccess) && (
            <div className="mt-3 flex items-center gap-2 text-green-600 text-sm">
              <CheckCircle className="w-4 h-4" />
              Material vinculado com sucesso!
            </div>
          )}

          {/* Error message */}
          {(linkMutation.error || createMutation.error) && (
            <div className="mt-3 text-red-600 text-sm">
              {linkMutation.error?.message || createMutation.error?.message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
