"use client";

import { ReactNode } from "react";

interface InfoItem {
  label: string;
  value: ReactNode;
}

interface PageInfoListProps {
  items: InfoItem[];
  className?: string;
}

export function PageInfoList({ items, className = "" }: PageInfoListProps) {
  return (
    <div className={`space-y-3 text-sm ${className}`}>
      {items.map((item, index) => (
        <div key={index} className="flex justify-between items-start gap-4">
          <span className="text-zinc-400 flex-shrink-0">{item.label}</span>
          <span className="font-medium text-white text-right">{item.value}</span>
        </div>
      ))}
    </div>
  );
}
