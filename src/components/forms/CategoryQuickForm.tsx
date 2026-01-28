"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Loader2, Save, X } from "lucide-react";

interface CategoryQuickFormProps {
  onSuccess: (category: { id: string; name: string }) => void;
  onCancel: () => void;
}

export function CategoryQuickForm({ onSuccess, onCancel }: CategoryQuickFormProps) {
  const [name, setName] = useState("");
  const [isActive, setIsActive] = useState(true);

  const utils = trpc.useUtils();

  const createMutation = trpc.materials.createCategory.useMutation({
    onSuccess: (data: { id: string; name: string }) => {
      utils.materials.listCategories.invalidate();
      onSuccess({ id: data.id, name: data.name });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    createMutation.mutate({
      name: name.trim(),
      isActive,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-theme-secondary mb-1">
          Nome da Categoria *
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Matéria Prima"
          className="w-full px-3 py-2 border border-theme rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          autoFocus
          required
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isActive"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-theme rounded"
        />
        <label htmlFor="isActive" className="text-sm text-theme-secondary">
          Categoria ativa
        </label>
      </div>

      {createMutation.error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {createMutation.error.message}
        </div>
      )}

      <div className="flex gap-3 pt-4 border-t border-theme">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-theme text-theme-secondary rounded-lg hover:bg-theme-secondary transition-colors"
        >
          <X className="w-4 h-4" />
          Cancelar
        </button>
        <button
          type="submit"
          disabled={createMutation.isPending || !name.trim()}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {createMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Salvar
        </button>
      </div>
    </form>
  );
}
