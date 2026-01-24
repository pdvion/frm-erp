"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Star, X, Filter } from "lucide-react";

interface FilterField {
  key: string;
  label: string;
  type: "text" | "select" | "date" | "dateRange" | "number" | "numberRange";
  options?: { value: string; label: string }[];
  placeholder?: string;
}

interface SavedFilter {
  id: string;
  name: string;
  values: Record<string, string | number | null>;
}

interface AdvancedFiltersProps {
  fields: FilterField[];
  values: Record<string, string | number | null>;
  onChange: (values: Record<string, string | number | null>) => void;
  storageKey?: string;
}

export function AdvancedFilters({
  fields,
  values,
  onChange,
  storageKey,
}: AdvancedFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [filterName, setFilterName] = useState("");
  const [showSaveDialog, setShowSaveDialog] = useState(false);

  // Carregar filtros salvos do localStorage
  useEffect(() => {
    if (storageKey && typeof window !== "undefined") {
      const saved = localStorage.getItem(`filters_${storageKey}`);
      if (saved) {
        try {
          setSavedFilters(JSON.parse(saved));
        } catch {
          setSavedFilters([]);
        }
      }
    }
  }, [storageKey]);

  const handleChange = (key: string, value: string | number | null) => {
    onChange({ ...values, [key]: value || null });
  };

  const handleClear = () => {
    const cleared: Record<string, string | number | null> = {};
    fields.forEach((f) => {
      cleared[f.key] = null;
      if (f.type === "dateRange") {
        cleared[`${f.key}Start`] = null;
        cleared[`${f.key}End`] = null;
      }
      if (f.type === "numberRange") {
        cleared[`${f.key}Min`] = null;
        cleared[`${f.key}Max`] = null;
      }
    });
    onChange(cleared);
  };

  const handleSaveFilter = () => {
    if (!filterName.trim() || !storageKey) return;

    const newFilter: SavedFilter = {
      id: Date.now().toString(),
      name: filterName.trim(),
      values: { ...values },
    };

    const updated = [...savedFilters, newFilter];
    setSavedFilters(updated);
    localStorage.setItem(`filters_${storageKey}`, JSON.stringify(updated));
    setFilterName("");
    setShowSaveDialog(false);
  };

  const handleApplySavedFilter = (filter: SavedFilter) => {
    onChange(filter.values);
  };

  const handleDeleteSavedFilter = (id: string) => {
    const updated = savedFilters.filter((f) => f.id !== id);
    setSavedFilters(updated);
    if (storageKey) {
      localStorage.setItem(`filters_${storageKey}`, JSON.stringify(updated));
    }
  };

  const hasActiveFilters = Object.values(values).some((v) => v !== null && v !== "");

  const inputClass =
    "w-full px-3 py-2 bg-theme-input border border-theme-input rounded-lg text-theme placeholder-theme-muted focus:ring-2 focus:ring-teal-500 text-sm";

  return (
    <div className="bg-theme-card rounded-lg border border-theme">
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-theme-muted" />
          <span className="font-medium text-theme">Filtros Avançados</span>
          {hasActiveFilters && (
            <span className="px-2 py-0.5 text-xs bg-teal-500/20 text-teal-400 rounded-full">
              Ativos
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-theme-muted" />
        ) : (
          <ChevronDown className="w-4 h-4 text-theme-muted" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-theme">
          {/* Saved Filters */}
          {savedFilters.length > 0 && (
            <div className="mt-4 mb-4">
              <p className="text-xs text-theme-muted mb-2">Filtros Salvos:</p>
              <div className="flex flex-wrap gap-2">
                {savedFilters.map((filter) => (
                  <div
                    key={filter.id}
                    className="flex items-center gap-1 px-2 py-1 bg-theme-tertiary rounded-lg text-sm"
                  >
                    <button
                      type="button"
                      onClick={() => handleApplySavedFilter(filter)}
                      className="text-theme hover:text-teal-400"
                    >
                      <Star className="w-3 h-3 fill-current" />
                    </button>
                    <span className="text-theme">{filter.name}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteSavedFilter(filter.id)}
                      className="text-theme-muted hover:text-red-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filter Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            {fields.map((field) => (
              <div key={field.key}>
                <label className="block text-xs text-theme-muted mb-1">
                  {field.label}
                </label>
                {field.type === "text" && (
                  <input
                    type="text"
                    value={(values[field.key] as string) || ""}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className={inputClass}
                  />
                )}
                {field.type === "select" && (
                  <select
                    value={(values[field.key] as string) || ""}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Todos</option>
                    {field.options?.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                )}
                {field.type === "date" && (
                  <input
                    type="date"
                    value={(values[field.key] as string) || ""}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    className={inputClass}
                  />
                )}
                {field.type === "dateRange" && (
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={(values[`${field.key}Start`] as string) || ""}
                      onChange={(e) =>
                        handleChange(`${field.key}Start`, e.target.value)
                      }
                      className={inputClass}
                      title="Data inicial"
                    />
                    <input
                      type="date"
                      value={(values[`${field.key}End`] as string) || ""}
                      onChange={(e) =>
                        handleChange(`${field.key}End`, e.target.value)
                      }
                      className={inputClass}
                      title="Data final"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-theme">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClear}
                className="px-3 py-1.5 text-sm text-theme-muted hover:text-theme transition-colors"
              >
                Limpar Filtros
              </button>
              {storageKey && (
                <>
                  {showSaveDialog ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={filterName}
                        onChange={(e) => setFilterName(e.target.value)}
                        placeholder="Nome do filtro"
                        className="px-2 py-1 text-sm bg-theme-input border border-theme-input rounded text-theme"
                        onKeyDown={(e) => e.key === "Enter" && handleSaveFilter()}
                      />
                      <button
                        type="button"
                        onClick={handleSaveFilter}
                        className="px-2 py-1 text-sm bg-teal-600 text-white rounded hover:bg-teal-700"
                      >
                        Salvar
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowSaveDialog(false)}
                        className="text-theme-muted hover:text-theme"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowSaveDialog(true)}
                      disabled={!hasActiveFilters}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm text-teal-400 hover:text-teal-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Star className="w-4 h-4" />
                      Salvar Filtro
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
