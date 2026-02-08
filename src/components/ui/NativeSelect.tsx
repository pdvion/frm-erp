"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

export interface NativeSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
}

export const NativeSelect = React.forwardRef<HTMLSelectElement, NativeSelectProps>(
  ({ className = "", error, id, children, disabled, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          ref={ref}
          id={id}
          disabled={disabled}
          style={{ WebkitAppearance: "none", MozAppearance: "none" }}
          className={`
            w-full appearance-none rounded-lg border px-3 py-2 pr-10
            text-sm transition-colors
            bg-white dark:bg-gray-800
            text-gray-900 dark:text-gray-100
            ${error
        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
        : "border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500"
      }
            ${disabled ? "cursor-not-allowed opacity-50 bg-gray-100 dark:bg-gray-700" : ""}
            focus:outline-none focus:ring-2 focus:ring-offset-0
            ${className}
          `}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? `${id}-error` : undefined}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
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
);

NativeSelect.displayName = "NativeSelect";
