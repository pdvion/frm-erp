"use client";

import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ label, error, hint, required, leftIcon, rightIcon, className = "", id: propId, ...props }, ref) => {
    const generatedId = useId();
    const id = propId || generatedId;
    const errorId = `${id}-error`;
    const hintId = `${id}-hint`;

    const describedBy = [error && errorId, hint && hintId].filter(Boolean).join(" ") || undefined;

    return (
      <div className="space-y-1">
        <label htmlFor={id} className="block text-sm font-medium text-theme-secondary">
          {label}
          {required && (
            <span className="text-red-500 ml-1" aria-hidden="true">
              *
            </span>
          )}
          {required && <span className="sr-only">(obrigatório)</span>}
        </label>

        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted pointer-events-none">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={id}
            aria-invalid={error ? "true" : undefined}
            aria-describedby={describedBy}
            aria-required={required}
            className={`
              w-full px-3 py-2 border rounded-lg text-theme bg-theme-card
              focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              disabled:bg-theme-tertiary disabled:cursor-not-allowed
              ${leftIcon ? "pl-10" : ""}
              ${rightIcon ? "pr-10" : ""}
              ${error ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-theme-input"}
              ${className}
            `}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-muted">
              {rightIcon}
            </div>
          )}
        </div>

        {hint && !error && (
          <p id={hintId} className="text-sm text-theme-muted">
            {hint}
          </p>
        )}

        {error && (
          <p id={errorId} className="text-sm text-red-500" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

FormField.displayName = "FormField";
