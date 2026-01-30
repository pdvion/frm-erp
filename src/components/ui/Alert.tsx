"use client";

import { ReactNode } from "react";
import {
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle,
  X,
} from "lucide-react";

export interface AlertProps {
  variant: "info" | "success" | "warning" | "error";
  title?: string;
  children: ReactNode;
  onClose?: () => void;
  icon?: ReactNode;
  className?: string;
}

const variantStyles = {
  info: {
    container: "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-200",
    icon: <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
    closeButton: "text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900",
  },
  success: {
    container: "bg-green-50 border-green-200 text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-200",
    icon: <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />,
    closeButton: "text-green-600 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900",
  },
  warning: {
    container: "bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-200",
    icon: <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />,
    closeButton: "text-yellow-600 hover:bg-yellow-100 dark:text-yellow-400 dark:hover:bg-yellow-900",
  },
  error: {
    container: "bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-200",
    icon: <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />,
    closeButton: "text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900",
  },
};

export function Alert({
  variant,
  title,
  children,
  onClose,
  icon,
  className = "",
}: AlertProps) {
  const styles = variantStyles[variant];

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 p-4 rounded-lg border ${styles.container} ${className}`}
    >
      <div className="flex-shrink-0 mt-0.5">
        {icon || styles.icon}
      </div>
      <div className="flex-1 min-w-0">
        {title && (
          <h4 className="font-semibold mb-1">{title}</h4>
        )}
        <div className="text-sm">{children}</div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className={`flex-shrink-0 p-1 rounded-md transition-colors ${styles.closeButton}`}
          aria-label="Fechar alerta"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export default Alert;
