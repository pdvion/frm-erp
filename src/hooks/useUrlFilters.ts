"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback, useMemo } from "react";

type FilterValue = string | number | boolean | undefined | null;

interface UseUrlFiltersOptions {
  defaults?: Record<string, FilterValue>;
}

/**
 * Hook para sincronizar filtros com a URL
 * Permite compartilhar links com filtros aplicados e usar botão voltar
 * 
 * @example
 * const { filters, setFilter, setFilters, resetFilters } = useUrlFilters({
 *   defaults: { page: 1, search: "", status: undefined },
 * });
 */
export function useUrlFilters(options: UseUrlFiltersOptions = {}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { defaults = {} } = options;

  // Parse filters from URL
  const filters = useMemo(() => {
    const result: Record<string, FilterValue> = { ...defaults };
    
    searchParams.forEach((value, key) => {
      // Try to parse as number
      const numValue = Number(value);
      if (!isNaN(numValue) && value !== "") {
        result[key] = numValue;
      }
      // Try to parse as boolean
      else if (value === "true") {
        result[key] = true;
      } else if (value === "false") {
        result[key] = false;
      }
      // Keep as string
      else {
        result[key] = value;
      }
    });

    return result;
  }, [searchParams, defaults]);

  // Update URL with new params
  const updateUrl = useCallback(
    (newParams: Record<string, FilterValue>) => {
      const params = new URLSearchParams();
      
      Object.entries(newParams).forEach(([key, value]) => {
        // Skip undefined, null, empty strings, and default values
        if (
          value === undefined ||
          value === null ||
          value === "" ||
          value === defaults[key]
        ) {
          return;
        }
        params.set(key, String(value));
      });

      const queryString = params.toString();
      const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
      
      router.push(newUrl, { scroll: false });
    },
    [pathname, router, defaults]
  );

  // Set a single filter
  const setFilter = useCallback(
    (key: string, value: FilterValue) => {
      updateUrl({ ...filters, [key]: value });
    },
    [filters, updateUrl]
  );

  // Set multiple filters at once
  const setFilters = useCallback(
    (newFilters: Record<string, FilterValue>) => {
      updateUrl({ ...filters, ...newFilters });
    },
    [filters, updateUrl]
  );

  // Reset all filters to defaults
  const resetFilters = useCallback(() => {
    router.push(pathname, { scroll: false });
  }, [pathname, router]);

  // Get a specific filter value
  const getFilter = useCallback(
    (key: string): FilterValue => {
      return filters[key];
    },
    [filters]
  );

  return {
    filters,
    setFilter,
    setFilters,
    resetFilters,
    getFilter,
  };
}
