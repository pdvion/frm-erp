"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  Package,
  ShoppingCart,
  Users,
  Truck,
  UserCircle,
  Loader2,
  Sparkles,
  Command,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

// ============================================
// TYPES
// ============================================

interface SearchResult {
  entityId: string;
  entityType: string;
  content: string;
  similarity: number;
  metadata: Record<string, unknown>;
  entity?: Record<string, unknown> | null;
}

// ============================================
// ENTITY CONFIG
// ============================================

const ENTITY_CONFIG: Record<string, {
  label: string;
  labelPlural: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  getHref: (id: string) => string;
  getTitle: (entity: Record<string, unknown>) => string;
  getSubtitle: (entity: Record<string, unknown>) => string;
}> = {
  material: {
    label: "Material",
    labelPlural: "Materiais",
    icon: <Package className="w-4 h-4" />,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/50",
    getHref: (id) => `/materials/${id}`,
    getTitle: (e) => `${e.code} — ${e.description}`,
    getSubtitle: (e) => [e.unit, e.ncm, e.manufacturer].filter(Boolean).join(" · "),
  },
  product: {
    label: "Produto",
    labelPlural: "Produtos",
    icon: <ShoppingCart className="w-4 h-4" />,
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-50 dark:bg-emerald-950/50",
    getHref: (id) => `/catalog/products/${id}`,
    getTitle: (e) => `${e.code} — ${e.name}`,
    getSubtitle: (e) => [e.shortDescription, e.status].filter(Boolean).join(" · "),
  },
  customer: {
    label: "Cliente",
    labelPlural: "Clientes",
    icon: <Users className="w-4 h-4" />,
    color: "text-violet-600 dark:text-violet-400",
    bgColor: "bg-violet-50 dark:bg-violet-950/50",
    getHref: (id) => `/customers/${id}`,
    getTitle: (e) => String(e.tradeName || e.companyName),
    getSubtitle: (e) => [e.cnpj, e.addressCity && e.addressState ? `${e.addressCity}/${e.addressState}` : null].filter(Boolean).join(" · "),
  },
  supplier: {
    label: "Fornecedor",
    labelPlural: "Fornecedores",
    icon: <Truck className="w-4 h-4" />,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-50 dark:bg-amber-950/50",
    getHref: (id) => `/suppliers/${id}`,
    getTitle: (e) => String(e.tradeName || e.companyName),
    getSubtitle: (e) => [e.cnpj, e.city && e.state ? `${e.city}/${e.state}` : null].filter(Boolean).join(" · "),
  },
  employee: {
    label: "Colaborador",
    labelPlural: "Colaboradores",
    icon: <UserCircle className="w-4 h-4" />,
    color: "text-rose-600 dark:text-rose-400",
    bgColor: "bg-rose-50 dark:bg-rose-950/50",
    getHref: (id) => `/hr/employees/${id}`,
    getTitle: (e) => `${e.code} — ${e.name}`,
    getSubtitle: (e) => [e.email, e.contractType].filter(Boolean).join(" · "),
  },
};

// ============================================
// SIMILARITY BADGE
// ============================================

function SimilarityBadge({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color =
    pct >= 80 ? "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/50" :
    pct >= 60 ? "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/50" :
    "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/50";

  return (
    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${color}`}>
      {pct}%
    </span>
  );
}

// ============================================
// RESULT ITEM
// ============================================

function ResultItem({
  result,
  isSelected,
  onClick,
  onMouseEnter,
}: {
  result: SearchResult;
  isSelected: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
}) {
  const config = ENTITY_CONFIG[result.entityType];
  if (!config) return null;

  const entity = result.entity as Record<string, unknown> | undefined;
  const title = entity ? config.getTitle(entity) : result.content.slice(0, 80);
  const subtitle = entity ? config.getSubtitle(entity) : "";

  return (
    <button
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      className={`w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg transition-colors ${
        isSelected
          ? "bg-blue-600 text-white"
          : "text-theme hover:bg-theme-hover"
      }`}
    >
      <div className={`flex-shrink-0 p-1.5 rounded-md ${isSelected ? "bg-blue-500" : config.bgColor}`}>
        <span className={isSelected ? "text-white" : config.color}>{config.icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{title}</div>
        {subtitle && (
          <div className={`text-xs truncate ${isSelected ? "text-blue-100" : "text-theme-muted"}`}>
            {subtitle}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <SimilarityBadge value={result.similarity} />
        <span className={`text-xs px-1.5 py-0.5 rounded ${isSelected ? "bg-blue-500 text-blue-100" : "bg-theme-tertiary text-theme-muted"}`}>
          {config.label}
        </span>
      </div>
    </button>
  );
}

// ============================================
// COMMAND PALETTE
// ============================================

export function CommandPalette() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Debounce query (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // tRPC search query
  const { data, isFetching } = trpc.embeddings.search.useQuery(
    { query: debouncedQuery, limit: 15, threshold: 0.4, enrichResults: true },
    { enabled: debouncedQuery.length >= 2, staleTime: 30_000 }
  );

  const results: SearchResult[] = useMemo(
    () => (data?.results as SearchResult[]) ?? [],
    [data?.results]
  );

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results.length, debouncedQuery]);

  // Keyboard shortcut: ⌘K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setDebouncedQuery("");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Navigate to result
  const navigateTo = useCallback(
    (result: SearchResult) => {
      const config = ENTITY_CONFIG[result.entityType];
      if (!config) return;
      setIsOpen(false);
      router.push(config.getHref(result.entityId));
    },
    [router]
  );

  // Keyboard navigation inside dialog
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (results[selectedIndex]) {
            navigateTo(results[selectedIndex]);
          }
          break;
        case "Escape":
          e.preventDefault();
          setIsOpen(false);
          break;
      }
    },
    [results, selectedIndex, navigateTo]
  );

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const selected = listRef.current.children[selectedIndex] as HTMLElement | undefined;
    selected?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-theme bg-theme-card px-3 py-1.5 text-sm text-theme-muted hover:bg-theme-hover hover:text-theme transition-colors"
        aria-label="Busca semântica (⌘K)"
      >
        <Search className="w-4 h-4" />
        <span className="hidden md:inline">Buscar...</span>
        <kbd className="hidden md:inline-flex items-center gap-0.5 rounded border border-theme bg-theme-tertiary px-1.5 py-0.5 text-[10px] font-medium text-theme-muted">
          <Command className="w-3 h-3" />K
        </kbd>
      </button>

      {/* Modal overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Dialog */}
          <div
            className="relative w-full max-w-xl mx-4 rounded-xl border border-theme bg-theme-card shadow-2xl overflow-hidden"
            role="dialog"
            aria-label="Busca semântica"
            onKeyDown={handleKeyDown}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 border-b border-theme px-4 py-3">
              <Sparkles className="w-5 h-5 text-blue-500 flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Busca semântica — materiais, produtos, clientes..."
                className="flex-1 bg-transparent text-theme text-sm placeholder:text-theme-muted outline-none"
                autoComplete="off"
                spellCheck={false}
              />
              {isFetching && <Loader2 className="w-4 h-4 animate-spin text-blue-500 flex-shrink-0" />}
              <button
                onClick={() => setIsOpen(false)}
                className="flex-shrink-0 rounded-md p-1 text-theme-muted hover:text-theme hover:bg-theme-hover"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Results */}
            <div ref={listRef} className="max-h-[50vh] overflow-y-auto p-2">
              {/* Empty state — no query */}
              {debouncedQuery.length < 2 && (
                <div className="flex flex-col items-center justify-center py-12 text-theme-muted">
                  <Search className="w-8 h-8 mb-3 opacity-40" />
                  <p className="text-sm">Digite pelo menos 2 caracteres para buscar</p>
                  <p className="text-xs mt-1 opacity-60">Busca por similaridade semântica via IA</p>
                </div>
              )}

              {/* Empty state — no results */}
              {debouncedQuery.length >= 2 && !isFetching && results.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-theme-muted">
                  <Package className="w-8 h-8 mb-3 opacity-40" />
                  <p className="text-sm">Nenhum resultado encontrado</p>
                  <p className="text-xs mt-1 opacity-60">Tente termos diferentes ou mais genéricos</p>
                </div>
              )}

              {/* Results list */}
              {results.map((result, index) => (
                <ResultItem
                  key={`${result.entityType}-${result.entityId}`}
                  result={result}
                  isSelected={index === selectedIndex}
                  onClick={() => navigateTo(result)}
                  onMouseEnter={() => setSelectedIndex(index)}
                />
              ))}
            </div>

            {/* Footer */}
            {results.length > 0 && (
              <div className="flex items-center justify-between border-t border-theme px-4 py-2 text-[11px] text-theme-muted">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <kbd className="rounded border border-theme bg-theme-tertiary px-1 py-0.5 text-[10px]">↑↓</kbd>
                    navegar
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="rounded border border-theme bg-theme-tertiary px-1 py-0.5 text-[10px]">↵</kbd>
                    abrir
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="rounded border border-theme bg-theme-tertiary px-1 py-0.5 text-[10px]">esc</kbd>
                    fechar
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  {results.length} resultado{results.length !== 1 ? "s" : ""} · pgvector
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
