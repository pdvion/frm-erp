"use client";

import { ReactNode, ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";

type ButtonVariant = "primary" | "secondary" | "danger" | "success" | "warning" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface PageButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  isLoading?: boolean;
  children: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-blue-600 text-white hover:bg-blue-700 border-transparent",
  secondary: "bg-theme-secondary text-theme hover:bg-theme-hover border-theme",
  danger: "bg-red-600 text-white hover:bg-red-700 border-transparent",
  success: "bg-green-600 text-white hover:bg-green-700 border-transparent",
  warning: "bg-yellow-600 text-white hover:bg-yellow-700 border-transparent",
  ghost: "bg-transparent text-theme-muted hover:text-theme hover:bg-theme-hover border-theme",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm gap-1.5",
  md: "px-4 py-2 text-sm gap-2",
  lg: "px-6 py-3 text-base gap-2",
};

export function PageButton({
  variant = "primary",
  size = "md",
  icon,
  isLoading = false,
  children,
  disabled,
  className = "",
  ...props
}: PageButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center font-medium rounded-lg border
        transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        icon
      )}
      {children}
    </button>
  );
}
