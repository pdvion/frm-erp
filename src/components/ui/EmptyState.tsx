"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { Inbox } from "lucide-react";

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = "",
}: EmptyStateProps) {
  const buttonClasses =
    "inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium";

  const renderAction = () => {
    if (!action) return null;

    if (action.href) {
      return (
        <Link href={action.href} className={buttonClasses}>
          {action.label}
        </Link>
      );
    }

    return (
      <button type="button" onClick={action.onClick} className={buttonClasses}>
        {action.label}
      </button>
    );
  };

  return (
    <div
      className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}
    >
      <div className="w-16 h-16 rounded-full bg-theme-tertiary flex items-center justify-center mb-4">
        {icon || <Inbox className="w-8 h-8 text-theme-muted" />}
      </div>
      <h3 className="text-lg font-semibold text-theme mb-2">{title}</h3>
      {description && (
        <p className="text-theme-muted max-w-md mb-6">{description}</p>
      )}
      {renderAction()}
    </div>
  );
}

export default EmptyState;
