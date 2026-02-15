"use client";

import * as React from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown, Plus, Search, Check, X } from "lucide-react";

export interface ComboboxOption {
  value: string;
  label: string;
}

export interface ComboboxWithCreateProps {
  options: ComboboxOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
  id?: string;
  createLabel?: string;
  onCreateClick?: () => void;
  isLoading?: boolean;
}

export function ComboboxWithCreate({
  options,
  value,
  onChange,
  placeholder = "Selecione...",
  searchPlaceholder = "Buscar...",
  disabled = false,
  error,
  className = "",
  id,
  createLabel = "Criar novo",
  onCreateClick,
  isLoading = false,
}: ComboboxWithCreateProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  const filtered = search
    ? options.filter((o) =>
      o.label.toLowerCase().includes(search.toLowerCase())
    )
    : options;

  const handleSelect = useCallback(
    (val: string) => {
      onChange?.(val);
      setIsOpen(false);
      setSearch("");
      setFocusedIndex(-1);
    },
    [onChange]
  );

  const handleClear = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onChange?.("");
      setSearch("");
      setFocusedIndex(-1);
    },
    [onChange]
  );

  // Keyboard navigation: Arrow Up/Down, Enter, Escape
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) {
        if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setIsOpen(true);
        }
        return;
      }

      const hasCreateButton = Boolean(onCreateClick);
      // Total navigable items: filtered options + create button (if present)
      const totalItems = filtered.length + (hasCreateButton ? 1 : 0);

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setFocusedIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusedIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
          break;
        case "Enter":
          e.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < filtered.length) {
            handleSelect(filtered[focusedIndex].value);
          } else if (hasCreateButton && focusedIndex === filtered.length) {
            setIsOpen(false);
            setSearch("");
            setFocusedIndex(-1);
            onCreateClick?.();
          }
          break;
        case "Escape":
          e.preventDefault();
          setIsOpen(false);
          setSearch("");
          setFocusedIndex(-1);
          break;
        case "Home":
          e.preventDefault();
          setFocusedIndex(0);
          break;
        case "End":
          e.preventDefault();
          setFocusedIndex(totalItems - 1);
          break;
      }
    },
    [isOpen, filtered, focusedIndex, handleSelect, onCreateClick]
  );

  // Auto-scroll focused item into view
  useEffect(() => {
    if (focusedIndex >= 0 && listRef.current) {
      const items = listRef.current.querySelectorAll("[role='option'], [data-create-button]");
      items[focusedIndex]?.scrollIntoView({ block: "nearest" });
    }
  }, [focusedIndex]);

  // Reset focused index when search changes
  useEffect(() => {
    setFocusedIndex(-1);
  }, [search]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearch("");
        setFocusedIndex(-1);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  return (
    <div ref={containerRef} className={`relative ${className}`} onKeyDown={handleKeyDown}>
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`
          w-full flex items-center justify-between rounded-lg border px-3 py-2
          text-sm transition-colors text-left
          bg-theme-input text-theme
          ${error
      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
      : "border-theme-input focus:border-blue-500 focus:ring-blue-500"
    }
          ${disabled ? "cursor-not-allowed opacity-50 bg-theme-secondary" : ""}
          focus:outline-none focus:ring-2 focus:ring-offset-0
        `}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className={selectedOption ? "text-theme" : "text-theme-muted"}>
          {selectedOption?.label ?? placeholder}
        </span>
        <div className="flex items-center gap-1">
          {value && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  handleClear(e as unknown as React.MouseEvent);
                }
              }}
              className="p-0.5 rounded hover:bg-theme-secondary transition-colors"
              aria-label="Limpar seleção"
            >
              <X className="h-3.5 w-3.5 text-theme-muted" />
            </span>
          )}
          <ChevronDown
            className={`h-4 w-4 text-theme-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-theme bg-theme-card shadow-lg">
          <div className="flex items-center gap-2 border-b border-theme px-3 py-2">
            <Search className="h-4 w-4 text-theme-muted flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="flex-1 bg-transparent text-sm text-theme placeholder:text-theme-muted outline-none"
              aria-label={searchPlaceholder}
            />
          </div>

          <ul ref={listRef} role="listbox" className="max-h-48 overflow-y-auto py-1" aria-activedescendant={focusedIndex >= 0 && focusedIndex < filtered.length ? `${id}-option-${focusedIndex}` : undefined}>
            {isLoading ? (
              <li className="px-3 py-2 text-sm text-theme-muted text-center">
                Carregando...
              </li>
            ) : filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-theme-muted text-center">
                Nenhum resultado encontrado
              </li>
            ) : (
              filtered.map((option, index) => (
                <li
                  key={option.value}
                  id={`${id}-option-${index}`}
                  role="option"
                  aria-selected={option.value === value}
                  onClick={() => handleSelect(option.value)}
                  onMouseEnter={() => setFocusedIndex(index)}
                  className={`
                    flex items-center justify-between px-3 py-2 text-sm cursor-pointer transition-colors
                    ${option.value === value
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                  : index === focusedIndex
                    ? "bg-theme-secondary text-theme"
                    : "text-theme hover:bg-theme-secondary"
                }
                  `}
                >
                  <span>{option.label}</span>
                  {option.value === value && (
                    <Check className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  )}
                </li>
              ))
            )}
          </ul>

          {onCreateClick && (
            <div className="border-t border-theme px-1 py-1">
              <button
                type="button"
                data-create-button
                onClick={() => {
                  setIsOpen(false);
                  setSearch("");
                  setFocusedIndex(-1);
                  onCreateClick();
                }}
                onMouseEnter={() => setFocusedIndex(filtered.length)}
                className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                  focusedIndex === filtered.length
                    ? "bg-theme-secondary text-blue-600 dark:text-blue-400"
                    : "text-blue-600 dark:text-blue-400 hover:bg-theme-secondary"
                }`}
              >
                <Plus className="h-4 w-4" />
                {createLabel}
              </button>
            </div>
          )}
        </div>
      )}

      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
