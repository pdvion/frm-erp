"use client";

import * as React from "react";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = "", error, id, ...props }, ref) => {
    return (
      <div>
        <textarea
          ref={ref}
          id={id}
          className={`
            w-full rounded-lg border px-3 py-2
            text-sm transition-colors resize-y min-h-[80px]
            bg-white dark:bg-gray-800
            text-gray-900 dark:text-gray-100
            placeholder:text-gray-400 dark:placeholder:text-gray-500
            ${error
        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
        : "border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500"
      }
            ${props.disabled ? "cursor-not-allowed opacity-50 bg-gray-100 dark:bg-gray-700" : ""}
            focus:outline-none focus:ring-2 focus:ring-offset-0
            ${className}
          `}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? `${id}-error` : undefined}
          {...props}
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

Textarea.displayName = "Textarea";
