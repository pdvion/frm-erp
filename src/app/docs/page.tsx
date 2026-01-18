"use client";

import Link from "next/link";
import { trpc } from "@/lib/trpc";
import {
  BookOpen,
  ChevronLeft,
  Search,
  Loader2,
  Building2,
  Package,
  Truck,
  Warehouse,
  Boxes,
  Rocket,
  FileText,
  Settings,
} from "lucide-react";
import { useState } from "react";

const iconMap: Record<string, React.ReactNode> = {
  Building2: <Building2 className="w-5 h-5" />,
  Package: <Package className="w-5 h-5" />,
  Truck: <Truck className="w-5 h-5" />,
  Warehouse: <Warehouse className="w-5 h-5" />,
  Boxes: <Boxes className="w-5 h-5" />,
  Rocket: <Rocket className="w-5 h-5" />,
  FileText: <FileText className="w-5 h-5" />,
  Settings: <Settings className="w-5 h-5" />,
};

const categoryLabels: Record<string, string> = {
  "getting-started": "Primeiros Passos",
  "how-to": "Como Fazer",
  "reference": "Referência",
};

export default function DocsPage() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: tutorials, isLoading } = trpc.tutorials.list.useQuery({
    category: selectedCategory || undefined,
  });
  const { data: categories } = trpc.tutorials.categories.useQuery();

  const filteredTutorials = tutorials?.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.description?.toLowerCase().includes(search.toLowerCase())
  );

  const groupedTutorials = filteredTutorials?.reduce((acc, tutorial) => {
    const category = tutorial.category || "other";
    if (!acc[category]) acc[category] = [];
    acc[category].push(tutorial);
    return acc;
  }, {} as Record<string, typeof filteredTutorials>);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-blue-600" />
                <h1 className="text-xl font-semibold text-gray-900">Documentação</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar tutoriais..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  !selectedCategory
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                Todos
              </button>
              {categories?.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedCategory === cat
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {categoryLabels[cat] || cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tutorials */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : !filteredTutorials?.length ? (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Nenhum tutorial encontrado</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedTutorials || {}).map(([category, items]) => (
              <div key={category}>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  {categoryLabels[category] || category}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {items?.map((tutorial) => (
                    <Link
                      key={tutorial.id}
                      href={`/docs/${tutorial.slug}`}
                      className="bg-white rounded-lg border border-gray-200 p-5 hover:border-blue-300 hover:shadow-md transition-all group"
                    >
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100">
                          {tutorial.icon && iconMap[tutorial.icon] ? iconMap[tutorial.icon] : <FileText className="w-5 h-5" />}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 group-hover:text-blue-600">
                            {tutorial.title}
                          </h3>
                          {tutorial.description && (
                            <p className="text-sm text-gray-500 mt-1">
                              {tutorial.description}
                            </p>
                          )}
                          {tutorial.module && (
                            <span className="inline-block mt-2 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                              {tutorial.module}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
