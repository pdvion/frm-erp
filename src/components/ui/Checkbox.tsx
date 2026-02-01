"use client";

import * as React from "react";
import { Check } from "lucide-react";

export interface CheckboxProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
  className?: string;
  indeterminate?: boolean;
}

export function Checkbox({
  checked = false,
  onChange,
  label,
  disabled = false,
  id,
  name,
  className = "",
  indeterminate = false,
}: CheckboxProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.checked);
  };

  return (
    <label
      className={`
        inline-flex items-center gap-2 cursor-pointer
        ${disabled ? "cursor-not-allowed opacity-50" : ""}
        ${className}
      `}
    >
      <div className="relative">
        <input
          ref={inputRef}
          type="checkbox"
          id={id}
          name={name}
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
          className="sr-only peer"
        />
        <div
          className={`
            h-5 w-5 rounded border-2 transition-colors
            flex items-center justify-center
            ${checked || indeterminate
      ? "bg-blue-600 border-blue-600"
      : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
    }
            peer-focus:ring-2 peer-focus:ring-blue-500 peer-focus:ring-offset-2
            ${disabled ? "" : "peer-hover:border-blue-500"}
          `}
        >
          {checked && (
            <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
          )}
          {indeterminate && !checked && (
            <div className="h-0.5 w-2.5 bg-white rounded" />
          )}
        </div>
      </div>
      {label && (
        <span className="text-sm text-gray-900 dark:text-gray-100 select-none">
          {label}
        </span>
      )}
    </label>
  );
}
