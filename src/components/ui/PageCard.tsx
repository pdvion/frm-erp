"use client";

import { ReactNode } from "react";

interface PageCardProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
  noPadding?: boolean;
  className?: string;
}

export function PageCard({
  title,
  subtitle,
  children,
  actions,
  noPadding = false,
  className = "",
}: PageCardProps) {
  return (
    <div className={`bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden ${className}`}>
      {(title || actions) && (
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-zinc-800">
          <div>
            {title && (
              <h3 className="text-base sm:text-lg font-semibold text-white">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-zinc-400 mt-0.5">{subtitle}</p>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      )}
      <div className={noPadding ? "" : "p-4 sm:p-6"}>
        {children}
      </div>
    </div>
  );
}
