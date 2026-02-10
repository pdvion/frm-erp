"use client";

import { cn } from "@/lib/utils";

interface ConfidenceBadgeProps {
  confidence: number;
  showPercentage?: boolean;
  size?: "sm" | "md" | "lg";
}

export function ConfidenceBadge({
  confidence,
  showPercentage = true,
  size = "md",
}: ConfidenceBadgeProps) {
  const getColor = () => {
    if (confidence >= 80) return "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800";
    if (confidence >= 50) return "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800";
    return "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";
  };

  const getLabel = () => {
    if (confidence >= 80) return "Alta";
    if (confidence >= 50) return "Média";
    return "Baixa";
  };

  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5",
    md: "text-sm px-2 py-1",
    lg: "text-base px-3 py-1.5",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-medium",
        getColor(),
        sizeClasses[size]
      )}
    >
      {showPercentage ? `${confidence}%` : getLabel()}
    </span>
  );
}
