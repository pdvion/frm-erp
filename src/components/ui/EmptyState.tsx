"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { Inbox } from "lucide-react";
import { Button } from "@/components/ui/Button";

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
  const renderAction = () => {
    if (!action) return null;

    if (action.href) {
      return (
        <Link href={action.href}>
          <Button variant="primary">{action.label}</Button>
        </Link>
      );
    }

    return (
      <Button variant="primary" onClick={action.onClick}>
        {action.label}
      </Button>
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
