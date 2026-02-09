"use client";

import * as React from "react";

export interface SwitchProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Switch({
  checked = false,
  onChange,
  label,
  disabled = false,
  id,
  name,
  className = "",
  size = "md",
}: SwitchProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.checked);
  };

  const sizes = {
    sm: { track: "h-5 w-9", thumb: "h-4 w-4", translate: "translate-x-4" },
    md: { track: "h-6 w-11", thumb: "h-5 w-5", translate: "translate-x-5" },
    lg: { track: "h-7 w-14", thumb: "h-6 w-6", translate: "translate-x-7" },
  };

  const sizeClasses = sizes[size];

  return (
    <label
      className={`
        flex items-center gap-3 cursor-pointer
        ${disabled ? "cursor-not-allowed opacity-50" : ""}
        ${className}
      `}
    >
      <div className="relative">
        <input
          type="checkbox"
          id={id}
          name={name}
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
          className="sr-only peer"
          role="switch"
          aria-checked={checked}
        />
        <div
          className={`
            ${sizeClasses.track} rounded-full transition-colors
            ${checked
      ? "bg-blue-600"
      : "bg-theme-secondary"
    }
            peer-focus:ring-2 peer-focus:ring-blue-500 peer-focus:ring-offset-2
          `}
        />
        <div
          className={`
            absolute top-0.5 left-0.5
            ${sizeClasses.thumb} rounded-full bg-white shadow-sm
            transition-transform
            ${checked ? sizeClasses.translate : "translate-x-0"}
          `}
        />
      </div>
      {label && (
        <span className="text-sm text-theme select-none">
          {label}
        </span>
      )}
    </label>
  );
}
