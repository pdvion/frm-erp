"use client";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-md bg-theme-secondary ${className || ""}`}
    />
  );
}

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export function TableSkeleton({ rows = 5, columns = 5 }: TableSkeletonProps) {
  return (
    <div className="bg-theme-card border border-theme rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-theme-secondary">
            <tr>
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i} className="py-3 px-4">
                  <Skeleton className="h-4 w-20" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={rowIndex} className="border-t border-theme">
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <td key={colIndex} className="py-3 px-4">
                    <Skeleton className="h-4 w-full" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface CardSkeletonProps {
  rows?: number;
}

export function CardSkeleton({ rows = 3 }: CardSkeletonProps) {
  return (
    <div className="bg-theme-card border border-theme rounded-lg p-4 space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  );
}

interface KPISkeletonProps {
  count?: number;
}

export function KPISkeleton({ count = 4 }: KPISkeletonProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-theme-card border border-theme rounded-lg p-4">
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-8 w-32 mb-1" />
          <Skeleton className="h-3 w-16" />
        </div>
      ))}
    </div>
  );
}

interface ProcessCardSkeletonProps {
  count?: number;
}

export function ProcessCardSkeleton({ count = 3 }: ProcessCardSkeletonProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-theme-card border border-theme rounded-lg p-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-24 rounded-full" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j}>
                    <Skeleton className="h-3 w-16 mb-1" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-5 w-28" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <Skeleton className="h-8 w-8 rounded-lg" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

interface DashboardSkeletonProps {
  showKPIs?: boolean;
  showCards?: boolean;
}

export function DashboardSkeleton({ showKPIs = true, showCards = true }: DashboardSkeletonProps) {
  return (
    <div className="space-y-6">
      {showKPIs && <KPISkeleton count={4} />}
      {showCards && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CardSkeleton rows={3} />
          <CardSkeleton rows={3} />
        </div>
      )}
    </div>
  );
}

interface ChartSkeletonProps {
  height?: number;
  showTitle?: boolean;
}

export function ChartSkeleton({ height = 200, showTitle = true }: ChartSkeletonProps) {
  return (
    <div className="bg-theme-card border border-theme rounded-lg p-4">
      {showTitle && (
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-20" />
        </div>
      )}
      <div 
        className="relative overflow-hidden rounded-lg bg-theme-secondary"
        style={{ height }}
      >
        <div className="absolute inset-0 flex items-end justify-around p-4 gap-2">
          {[65, 45, 80, 35, 70, 55, 40].map((h, i) => (
            <div
              key={i}
              className="flex-1 bg-theme-tertiary rounded-t animate-pulse"
              style={{ 
                height: `${h}%`,
                animationDelay: `${i * 100}ms`
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface FormSkeletonProps {
  fields?: number;
  columns?: number;
}

export function FormSkeleton({ fields = 6, columns = 2 }: FormSkeletonProps) {
  return (
    <div className="bg-theme-card border border-theme rounded-lg p-6 space-y-6">
      <Skeleton className="h-6 w-48 mb-4" />
      <div className={`grid grid-cols-1 md:grid-cols-${columns} gap-4`}>
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t border-theme">
        <Skeleton className="h-10 w-24 rounded-lg" />
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
    </div>
  );
}

interface ListSkeletonProps {
  items?: number;
  showAvatar?: boolean;
}

export function ListSkeleton({ items = 5, showAvatar = false }: ListSkeletonProps) {
  return (
    <div className="bg-theme-card border border-theme rounded-lg divide-y divide-theme">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="p-4 flex items-center gap-4">
          {showAvatar && <Skeleton className="h-10 w-10 rounded-full" />}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
      ))}
    </div>
  );
}
