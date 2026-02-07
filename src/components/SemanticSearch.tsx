"use client";

import { useState, useRef, useCallback, useEffect, useMemo, type KeyboardEvent } from "react";
import { Search, Sparkles, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useDebounce } from "@/hooks/useDebounce";
import { Badge } from "@/components/ui/Badge";

type EmbeddableEntity = "material" | "product" | "customer" | "supplier" | "employee";

interface SemanticResult {
  entityId: string;
  entityType: string;
  similarity: number;
  content: string;
  entity?: Record<string, unknown> | null;
}

export interface SemanticSearchProps {
  entityType: EmbeddableEntity;
  onSelect: (entity: { id: string; description: string; score: number }) => void;
  onQueryChange?: (query: string) => void;
  placeholder?: string;
  minChars?: number;
  debounceMs?: number;
  limit?: number;
  threshold?: number;
  className?: string;
}

function getScoreColor(score: number): string {
  if (score >= 0.85) return "bg-green-500";
  if (score >= 0.7) return "bg-blue-500";
  if (score >= 0.55) return "bg-yellow-500";
  return "bg-orange-500";
}

function getScoreLabel(score: number): string {
  if (score >= 0.85) return "Excelente";
  if (score >= 0.7) return "Bom";
  if (score >= 0.55) return "Razoável";
  return "Baixo";
}

function getEntityLabel(r: SemanticResult): { primary: string; secondary: string } {
  const e = r.entity;
  if (!e) return { primary: r.entityId, secondary: r.content.slice(0, 80) };
  const code = (e.code as string) ?? "";
  switch (r.entityType) {
    case "material":
      return { primary: `${code} — ${e.description ?? ""}`, secondary: [e.unit, e.manufacturer, e.ncm].filter(Boolean).join(" · ") };
    case "product":
      return { primary: `${code} — ${e.name ?? ""}`, secondary: (e.shortDescription as string) ?? "" };
    case "customer":
      return { primary: `${code} — ${e.companyName ?? ""}`, secondary: [e.tradeName, e.addressCity, e.addressState].filter(Boolean).join(" · ") };
    case "supplier":
      return { primary: `${code} — ${e.companyName ?? ""}`, secondary: [e.tradeName, e.city, e.state].filter(Boolean).join(" · ") };
    case "employee":
      return { primary: `${code} — ${e.name ?? ""}`, secondary: (e.email as string) ?? "" };
    default:
      return { primary: r.entityId, secondary: "" };
  }
}

export function SemanticSearch({
  entityType, onSelect, onQueryChange, placeholder = "Buscar com IA...",
  minChars = 3, debounceMs = 300, limit = 8, threshold = 0.45, className = "",
}: SemanticSearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debouncedQuery = useDebounce(query, debounceMs);
  const containerRef = useRef<HTMLDivElement>(null);

  const shouldSearch = debouncedQuery.length >= minChars;

  const { data: statusData } = trpc.embeddings.getStatus.useQuery(undefined, { staleTime: 60_000 });
  const hasEmbeddings = (statusData?.entities ?? []).some(
    (e: { entityType: string; totalEmbeddings: number }) => e.entityType === entityType && e.totalEmbeddings > 0
  );

  const { data: searchData, isFetching } = trpc.embeddings.search.useQuery(
    { query: debouncedQuery, entityType, limit, threshold, enrichResults: true },
    { enabled: shouldSearch && hasEmbeddings, staleTime: 10_000 }
  );

  // Cast via unknown: SemanticSearchResult lacks entityType (added by enrichment)
  const results = useMemo(
    () => (searchData?.results ?? []) as unknown as SemanticResult[],
    [searchData?.results]
  );

  useEffect(() => {
    onQueryChange?.(debouncedQuery);
  }, [debouncedQuery, onQueryChange]);

  useEffect(() => {
    if (results.length > 0 && shouldSearch) setIsOpen(true);
    else setIsOpen(false);
    setActiveIndex(-1);
  }, [results, shouldSearch]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = useCallback((r: SemanticResult) => {
    const label = getEntityLabel(r);
    onSelect({ id: r.entityId, description: label.primary, score: r.similarity });
    setIsOpen(false);
  }, [onSelect]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIndex((i) => Math.min(i + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIndex((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); handleSelect(results[activeIndex >= 0 ? activeIndex : 0]); }
    else if (e.key === "Escape") { setIsOpen(false); }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div className="relative">
        {isFetching ? (
          <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400 animate-spin z-10" />
        ) : hasEmbeddings ? (
          <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-blue-400 z-10" />
        ) : (
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-theme-muted z-10" />
        )}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (results.length > 0) setIsOpen(true); }}
          onKeyDown={handleKeyDown}
          placeholder={hasEmbeddings ? placeholder : "Buscar por descrição ou código..."}
          className="w-full pl-10 pr-4 py-2 bg-theme-card border border-theme rounded-lg text-sm text-theme placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-colors"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls="semantic-search-listbox"
          aria-autocomplete="list"
          aria-activedescendant={activeIndex >= 0 ? `semantic-result-${activeIndex}` : undefined}
        />
        {hasEmbeddings && query.length === 0 && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-blue-400/60">IA</span>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <ul
          id="semantic-search-listbox"
          className="absolute z-50 mt-1 w-full bg-theme-card border border-theme rounded-lg shadow-xl max-h-80 overflow-y-auto"
          role="listbox"
        >
          {results.map((r, i) => {
            const label = getEntityLabel(r);
            const pct = Math.round(r.similarity * 100);
            return (
              <li
                key={r.entityId}
                id={`semantic-result-${i}`}
                role="option"
                aria-selected={i === activeIndex}
                className={`px-3 py-2.5 cursor-pointer transition-colors border-b border-theme last:border-b-0 ${
                  i === activeIndex ? "bg-blue-600/20" : "hover:bg-theme-table-hover"
                }`}
                onClick={() => handleSelect(r)}
                onMouseEnter={() => setActiveIndex(i)}
              >
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-theme truncate">{label.primary}</div>
                    {label.secondary && (
                      <div className="text-xs text-theme-muted truncate mt-0.5">{label.secondary}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="flex items-center gap-1.5" title={`${pct}% — ${getScoreLabel(r.similarity)}`}>
                      <div className="w-12 h-1.5 bg-theme-tertiary rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${getScoreColor(r.similarity)}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-theme-muted w-8 text-right">{pct}%</span>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
          <li className="px-3 py-1.5 text-center">
            <Badge variant="info" className="text-[10px]">
              <Sparkles className="w-3 h-3 mr-1" />
              Busca semântica por IA
            </Badge>
          </li>
        </ul>
      )}

      {isOpen && shouldSearch && !isFetching && results.length === 0 && hasEmbeddings && (
        <div className="absolute z-50 mt-1 w-full bg-theme-card border border-theme rounded-lg shadow-xl p-4 text-center text-sm text-theme-muted">
          Nenhum resultado semântico para &ldquo;{debouncedQuery}&rdquo;
        </div>
      )}
    </div>
  );
}
