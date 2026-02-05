"use client";

import React, { memo, useRef, useState, useEffect } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { cn } from "@/lib/utils";

// Cores padrão para gráficos (compatíveis com light/dark mode)
export const CHART_COLORS = [
  "#3B82F6", // blue-500
  "#10B981", // emerald-500
  "#F59E0B", // amber-500
  "#EF4444", // red-500
  "#8B5CF6", // violet-500
  "#EC4899", // pink-500
  "#06B6D4", // cyan-500
  "#84CC16", // lime-500
];

// Hook para detectar se o container tem dimensões válidas
function useContainerReady(ref: React.RefObject<HTMLDivElement | null>) {
  const [isReady, setIsReady] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    const checkDimensions = () => {
      if (ref.current) {
        const { width, height } = ref.current.getBoundingClientRect();
        const minWidth = 150;
        const minHeight = 150;
        if (width >= minWidth && height >= minHeight) {
          setIsReady(true);
        } else if (width > 0 && height > 0) {
          setIsReady(true);
        } else {
          setIsReady(false);
        }
      }
    };

    const rafId = requestAnimationFrame(() => {
      checkDimensions();
    });

    const observer = new ResizeObserver(() => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        requestAnimationFrame(checkDimensions);
      }, 100);
    });
    observer.observe(ref.current);

    return () => {
      cancelAnimationFrame(rafId);
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      observer.disconnect();
    };
  }, [ref]);

  return isReady;
}

// Hook para detectar dark mode
function useDarkMode() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };

    checkDarkMode();

    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  return isDark;
}

// Estilos do tema
const getThemeStyles = (isDark: boolean) => ({
  grid: isDark ? "#374151" : "#E5E7EB",
  axis: isDark ? "#9CA3AF" : "#6B7280",
  tooltip: {
    backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
    border: isDark ? "#374151" : "#E5E7EB",
    color: isDark ? "#F9FAFB" : "#111827",
  },
});

export interface ChartData {
  name: string;
  [key: string]: string | number;
}

export interface DataKey {
  key: string;
  color?: string;
  name?: string;
  stackId?: string;
}

interface BaseChartProps {
  data: ChartData[];
  height?: number;
  className?: string;
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
}

// ============================================
// LINE CHART
// ============================================
export interface LineChartProps extends BaseChartProps {
  dataKeys: DataKey[];
}

export const ChartLine = memo(function ChartLine({
  data,
  dataKeys,
  height = 300,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  className,
}: LineChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isReady = useContainerReady(containerRef);
  const isDark = useDarkMode();
  const theme = getThemeStyles(isDark);

  return (
    <div
      ref={containerRef}
      className={cn("w-full", className)}
      style={{ height, minHeight: 200, minWidth: 200 }}
    >
      {isReady && (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} />}
            <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke={theme.axis} />
            <YAxis tick={{ fontSize: 12 }} stroke={theme.axis} />
            {showTooltip && (
              <Tooltip
                contentStyle={{
                  backgroundColor: theme.tooltip.backgroundColor,
                  border: `1px solid ${theme.tooltip.border}`,
                  borderRadius: "8px",
                  color: theme.tooltip.color,
                }}
              />
            )}
            {showLegend && <Legend />}
            {dataKeys.map((dk, index) => (
              <Line
                key={dk.key}
                type="monotone"
                dataKey={dk.key}
                name={dk.name || dk.key}
                stroke={dk.color || CHART_COLORS[index % CHART_COLORS.length]}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
});

// ============================================
// BAR CHART
// ============================================
export interface BarChartProps extends BaseChartProps {
  dataKeys: DataKey[];
  layout?: "horizontal" | "vertical";
  stacked?: boolean;
}

export const ChartBar = memo(function ChartBar({
  data,
  dataKeys,
  height = 300,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  layout = "horizontal",
  stacked = false,
  className,
}: BarChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isReady = useContainerReady(containerRef);
  const isDark = useDarkMode();
  const theme = getThemeStyles(isDark);

  const processedDataKeys = stacked
    ? dataKeys.map((dk) => ({ ...dk, stackId: dk.stackId || "stack" }))
    : dataKeys;

  return (
    <div
      ref={containerRef}
      className={cn("w-full", className)}
      style={{ height, minHeight: 200, minWidth: 200 }}
    >
      {isReady && (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout={layout} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} />}
            {layout === "horizontal" ? (
              <>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke={theme.axis} />
                <YAxis tick={{ fontSize: 12 }} stroke={theme.axis} />
              </>
            ) : (
              <>
                <XAxis type="number" tick={{ fontSize: 12 }} stroke={theme.axis} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} stroke={theme.axis} width={100} />
              </>
            )}
            {showTooltip && (
              <Tooltip
                contentStyle={{
                  backgroundColor: theme.tooltip.backgroundColor,
                  border: `1px solid ${theme.tooltip.border}`,
                  borderRadius: "8px",
                  color: theme.tooltip.color,
                }}
              />
            )}
            {showLegend && <Legend />}
            {processedDataKeys.map((dk, index) => (
              <Bar
                key={dk.key}
                dataKey={dk.key}
                name={dk.name || dk.key}
                fill={dk.color || CHART_COLORS[index % CHART_COLORS.length]}
                stackId={dk.stackId}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
});

// ============================================
// PIE CHART
// ============================================
export interface PieChartProps extends BaseChartProps {
  dataKey: string;
  nameKey?: string;
  innerRadius?: number;
  outerRadius?: number;
  colors?: string[];
}

export const ChartPie = memo(function ChartPie({
  data,
  dataKey,
  nameKey = "name",
  height = 300,
  showLegend = true,
  showTooltip = true,
  innerRadius = 0,
  outerRadius = 80,
  colors = CHART_COLORS,
  className,
}: PieChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isReady = useContainerReady(containerRef);
  const isDark = useDarkMode();
  const theme = getThemeStyles(isDark);

  return (
    <div
      ref={containerRef}
      className={cn("w-full", className)}
      style={{ height, minHeight: 200, minWidth: 200 }}
    >
      {isReady && (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              dataKey={dataKey}
              nameKey={nameKey}
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            {showTooltip && (
              <Tooltip
                contentStyle={{
                  backgroundColor: theme.tooltip.backgroundColor,
                  border: `1px solid ${theme.tooltip.border}`,
                  borderRadius: "8px",
                  color: theme.tooltip.color,
                }}
              />
            )}
            {showLegend && <Legend />}
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
});

// ============================================
// DONUT CHART (Pie with inner radius)
// ============================================
export const ChartDonut = memo(function ChartDonut(props: Omit<PieChartProps, "innerRadius">) {
  return <ChartPie {...props} innerRadius={60} outerRadius={80} />;
});

// ============================================
// AREA CHART
// ============================================
export interface AreaChartProps extends BaseChartProps {
  dataKeys: DataKey[];
  gradient?: boolean;
  stacked?: boolean;
}

export const ChartArea = memo(function ChartArea({
  data,
  dataKeys,
  height = 300,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  gradient = true,
  stacked = false,
  className,
}: AreaChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isReady = useContainerReady(containerRef);
  const isDark = useDarkMode();
  const theme = getThemeStyles(isDark);

  const processedDataKeys = stacked
    ? dataKeys.map((dk) => ({ ...dk, stackId: dk.stackId || "stack" }))
    : dataKeys;

  return (
    <div
      ref={containerRef}
      className={cn("w-full", className)}
      style={{ height, minHeight: 200, minWidth: 200 }}
    >
      {isReady && (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} />}
            <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke={theme.axis} />
            <YAxis tick={{ fontSize: 12 }} stroke={theme.axis} />
            {showTooltip && (
              <Tooltip
                contentStyle={{
                  backgroundColor: theme.tooltip.backgroundColor,
                  border: `1px solid ${theme.tooltip.border}`,
                  borderRadius: "8px",
                  color: theme.tooltip.color,
                }}
              />
            )}
            {showLegend && <Legend />}
            {processedDataKeys.map((dk, index) => {
              const color = dk.color || CHART_COLORS[index % CHART_COLORS.length];
              return (
                <Area
                  key={dk.key}
                  type="monotone"
                  dataKey={dk.key}
                  name={dk.name || dk.key}
                  stroke={color}
                  fill={color}
                  fillOpacity={gradient ? 0.3 : 0.6}
                  stackId={dk.stackId}
                />
              );
            })}
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
});

// ============================================
// CHART CARD (Container com título)
// ============================================
export interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}

export const ChartCard = memo(function ChartCard({
  title,
  subtitle,
  children,
  className,
  actions,
}: ChartCardProps) {
  return (
    <div className={cn("bg-theme-card rounded-lg shadow p-4", className)}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-theme">{title}</h3>
          {subtitle && <p className="text-sm text-theme-muted">{subtitle}</p>}
        </div>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>
      <div className="min-h-[200px] w-full">{children}</div>
    </div>
  );
});

// ============================================
// KPI CARD (com sparkline)
// ============================================
export interface KpiCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  sparklineData?: number[];
  icon?: React.ReactNode;
  className?: string;
}

export const KpiCard = memo(function KpiCard({
  title,
  value,
  change,
  changeLabel,
  sparklineData,
  icon,
  className,
}: KpiCardProps) {
  const isPositive = change !== undefined && change >= 0;
  const sparklineRef = useRef<HTMLDivElement>(null);
  const isSparklineReady = useContainerReady(sparklineRef);

  return (
    <div className={cn("bg-theme-card rounded-lg shadow p-4", className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-theme-muted">{title}</p>
          <p className="text-2xl font-bold text-theme mt-1">{value}</p>
          {change !== undefined && (
            <p className={cn("text-sm mt-1", isPositive ? "text-green-600" : "text-red-600")}>
              {isPositive ? "↑" : "↓"} {Math.abs(change).toFixed(1)}%
              {changeLabel && <span className="text-theme-muted ml-1">{changeLabel}</span>}
            </p>
          )}
        </div>
        {icon && <div className="text-theme-muted">{icon}</div>}
      </div>
      {sparklineData && sparklineData.length > 0 && (
        <div ref={sparklineRef} className="mt-3 h-10" style={{ minWidth: 100, minHeight: 40 }}>
          {isSparklineReady && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData.map((v, i) => ({ value: v, index: i }))}>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={isPositive ? "#10B981" : "#EF4444"}
                  fill={isPositive ? "#10B981" : "#EF4444"}
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      )}
    </div>
  );
});
