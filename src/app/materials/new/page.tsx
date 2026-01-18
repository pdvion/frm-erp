"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Package, 
  ChevronLeft, 
  Save,
  X,
  Loader2
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { CompanySwitcher } from "@/components/CompanySwitcher";
import { SelectWithAdd } from "@/components/ui/SelectWithAdd";
import { CategoryQuickForm } from "@/components/forms/CategoryQuickForm";

interface MaterialFormData {
  code: number;
  description: string;
  internalCode: string;
  unit: string;
  categoryId: string;
  minQuantity: number;
  maxQuantity: number;
  ncm: string;
  location: string;
  requiresQualityCheck: boolean;
  isShared: boolean;
}

export default function NewMaterialPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<MaterialFormData>({
    code: 0,
    description: "",
    internalCode: "",
    unit: "UN",
    categoryId: "",
    minQuantity: 0,
    maxQuantity: 0,
    ncm: "",
    location: "",
    requiresQualityCheck: false,
    isShared: false,
  });

  const { data: categories } = trpc.materials.listCategories.useQuery();
  const createMutation = trpc.materials.create.useMutation({
    onSuccess: () => {
      router.push("/materials");
    },
    onError: (err) => {
      setError(err.message);
      setIsSubmitting(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    createMutation.mutate({
      code: formData.code,
      description: formData.description,
      internalCode: formData.internalCode || undefined,
      unit: formData.unit,
      categoryId: formData.categoryId || undefined,
      minQuantity: formData.minQuantity || undefined,
      maxQuantity: formData.maxQuantity || undefined,
      ncm: formData.ncm || undefined,
      location: formData.location || undefined,
      requiresQualityCheck: formData.requiresQualityCheck,
      isShared: formData.isShared,
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" 
        ? (e.target as HTMLInputElement).checked 
        : type === "number" 
          ? parseFloat(value) || 0 
          : value,
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/materials" className="text-gray-400 hover:text-gray-600">
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Novo Material</h1>
                <p className="text-sm text-gray-500">CP10 - Cadastro de Materiais</p>
              </div>
            </div>
            <CompanySwitcher />
          </div>
        </div>
      </header>

      {/* Form */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Código */}
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                Código *
              </label>
              <input
                type="number"
                id="code"
                name="code"
                required
                value={formData.code || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Código Interno */}
            <div>
              <label htmlFor="internalCode" className="block text-sm font-medium text-gray-700 mb-1">
                Código Interno
              </label>
              <input
                type="text"
                id="internalCode"
                name="internalCode"
                value={formData.internalCode}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Descrição */}
            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Descrição *
              </label>
              <input
                type="text"
                id="description"
                name="description"
                required
                value={formData.description}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Unidade */}
            <div>
              <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-1">
                Unidade *
              </label>
              <select
                id="unit"
                name="unit"
                required
                value={formData.unit}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="UN">UN - Unidade</option>
                <option value="KG">KG - Quilograma</option>
                <option value="M">M - Metro</option>
                <option value="M2">M² - Metro Quadrado</option>
                <option value="M3">M³ - Metro Cúbico</option>
                <option value="L">L - Litro</option>
                <option value="PC">PC - Peça</option>
                <option value="CX">CX - Caixa</option>
                <option value="PCT">PCT - Pacote</option>
                <option value="ROL">ROL - Rolo</option>
              </select>
            </div>

            {/* Categoria */}
            <SelectWithAdd
              id="categoryId"
              name="categoryId"
              label="Categoria"
              value={formData.categoryId}
              onChange={handleChange}
              options={categories?.map((cat) => ({
                value: cat.id,
                label: cat.name,
              })) || []}
              placeholder="Selecione uma categoria"
              drawerTitle="Nova Categoria"
              drawerDescription="Cadastre uma nova categoria para materiais"
              drawerSize="sm"
              FormComponent={CategoryQuickForm}
            />

            {/* NCM */}
            <div>
              <label htmlFor="ncm" className="block text-sm font-medium text-gray-700 mb-1">
                NCM
              </label>
              <input
                type="text"
                id="ncm"
                name="ncm"
                value={formData.ncm}
                onChange={handleChange}
                placeholder="00000000"
                maxLength={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Quantidade Mínima */}
            <div>
              <label htmlFor="minQuantity" className="block text-sm font-medium text-gray-700 mb-1">
                Qtd. Mínima
              </label>
              <input
                type="number"
                id="minQuantity"
                name="minQuantity"
                step="0.01"
                value={formData.minQuantity || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Quantidade Máxima */}
            <div>
              <label htmlFor="maxQuantity" className="block text-sm font-medium text-gray-700 mb-1">
                Qtd. Máxima
              </label>
              <input
                type="number"
                id="maxQuantity"
                name="maxQuantity"
                step="0.01"
                value={formData.maxQuantity || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Localização */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                Localização
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Ex: Prateleira A-01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Requer Inspeção */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="requiresQualityCheck"
                name="requiresQualityCheck"
                checked={formData.requiresQualityCheck}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="requiresQualityCheck" className="text-sm font-medium text-gray-700">
                Requer inspeção de qualidade
              </label>
            </div>

            {/* Compartilhado */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isShared"
                name="isShared"
                checked={formData.isShared}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label htmlFor="isShared" className="text-sm font-medium text-gray-700">
                Compartilhar com outras empresas
              </label>
            </div>

          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
            <Link
              href="/materials"
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <X className="w-4 h-4" />
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Salvar
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
