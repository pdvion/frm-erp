"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Save, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";

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
      <Input
        label="Nome da Categoria *"
        type="text"
        id="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Ex: Matéria Prima"
        autoFocus
        required
      />

      <Checkbox
        id="isActive"
        label="Categoria ativa"
        checked={isActive}
        onChange={setIsActive}
      />

      {createMutation.error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {createMutation.error.message}
        </div>
      )}

      <div className="flex gap-3 pt-4 border-t border-theme">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          leftIcon={<X className="w-4 h-4" />}
          className="flex-1"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={createMutation.isPending || !name.trim()}
          isLoading={createMutation.isPending}
          leftIcon={!createMutation.isPending ? <Save className="w-4 h-4" /> : undefined}
          className="flex-1"
        >
          Salvar
        </Button>
      </div>
    </form>
  );
}
