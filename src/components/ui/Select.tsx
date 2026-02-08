"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
  id?: string;
  name?: string;
  required?: boolean;
}

export function Select({
  options,
  value,
  onChange,
  placeholder = "Selecione...",
  disabled = false,
  error,
  className = "",
  id,
  name,
  required,
}: SelectProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange?.(e.target.value);
  };

  return (
    <div className="relative">
      <select
        id={id}
        name={name}
        value={value ?? ""}
        onChange={handleChange}
        disabled={disabled}
        required={required}
        className={`
          w-full appearance-none rounded-lg border px-3 py-2 pr-10
          text-sm transition-colors
          bg-theme-input
          text-theme
          ${error
      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
      : "border-theme-input focus:border-blue-500 focus:ring-blue-500"
    }
          ${disabled ? "cursor-not-allowed opacity-50 bg-theme-secondary" : ""}
          focus:outline-none focus:ring-2 focus:ring-offset-0
          ${className}
        `}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={error ? `${id}-error` : undefined}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-theme-muted"
        aria-hidden="true"
      />
      {error && (
        <p
          id={`${id}-error`}
          className="mt-1 text-sm text-red-500"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}
