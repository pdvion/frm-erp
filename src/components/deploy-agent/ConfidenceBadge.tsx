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
    if (confidence >= 80) return "bg-green-100 text-green-700 border-green-200";
    if (confidence >= 50) return "bg-yellow-100 text-yellow-700 border-yellow-200";
    return "bg-red-100 text-red-700 border-red-200";
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
