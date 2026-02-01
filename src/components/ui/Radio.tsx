"use client";

import * as React from "react";

export interface RadioOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface RadioProps {
  options: RadioOption[];
  value?: string;
  onChange?: (value: string) => void;
  name: string;
  disabled?: boolean;
  className?: string;
  orientation?: "horizontal" | "vertical";
}

export function Radio({
  options,
  value,
  onChange,
  name,
  disabled = false,
  className = "",
  orientation = "vertical",
}: RadioProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.value);
  };

  return (
    <div
      className={`
        flex ${orientation === "horizontal" ? "flex-row gap-4" : "flex-col gap-2"}
        ${className}
      `}
      role="radiogroup"
    >
      {options.map((option) => (
        <label
          key={option.value}
          className={`
            inline-flex items-center gap-2 cursor-pointer
            ${disabled || option.disabled ? "cursor-not-allowed opacity-50" : ""}
          `}
        >
          <div className="relative">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={handleChange}
              disabled={disabled || option.disabled}
              className="sr-only peer"
            />
            <div
              className={`
                h-5 w-5 rounded-full border-2 transition-colors
                flex items-center justify-center
                ${value === option.value
          ? "border-blue-600"
          : "border-gray-300 dark:border-gray-600"
        }
                peer-focus:ring-2 peer-focus:ring-blue-500 peer-focus:ring-offset-2
                ${!disabled && !option.disabled ? "peer-hover:border-blue-500" : ""}
              `}
            >
              {value === option.value && (
                <div className="h-2.5 w-2.5 rounded-full bg-blue-600" />
              )}
            </div>
          </div>
          <span className="text-sm text-gray-900 dark:text-gray-100 select-none">
            {option.label}
          </span>
        </label>
      ))}
    </div>
  );
}
