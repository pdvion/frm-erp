"use client";

import React, { memo, useState, useEffect, useRef } from "react";
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

// Hook para detectar se o container tem dimensões válidas
function useContainerReady(ref: React.RefObject<HTMLDivElement | null>) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const checkDimensions = () => {
      if (ref.current) {
        const { width, height } = ref.current.getBoundingClientRect();
        if (width > 0 && height > 0) {
          setIsReady(true);
        }
      }
    };

    // Verificar imediatamente
    checkDimensions();

    // Usar ResizeObserver para detectar mudanças
    const observer = new ResizeObserver(checkDimensions);
    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [ref]);

  return isReady;
}

// Cores padrão para gráficos
const COLORS = [
  "#3B82F6", // blue-500
  "#10B981", // emerald-500
  "#F59E0B", // amber-500
  "#EF4444", // red-500
  "#8B5CF6", // violet-500
  "#EC4899", // pink-500
  "#06B6D4", // cyan-500
  "#84CC16", // lime-500
];

interface ChartData {
  name: string;
  [key: string]: string | number;
}

interface BaseChartProps {
  data: ChartData[];
  height?: number;
  className?: string;
}

interface LineChartProps extends BaseChartProps {
  dataKeys: { key: string; color?: string; name?: string }[];
  showGrid?: boolean;
  showLegend?: boolean;
}

// VIO-557: Memoizar componentes de gráficos para evitar re-renders desnecessários
export const SimpleLineChart = memo(function SimpleLineChart({
  data,
  dataKeys,
  height = 300,
  showGrid = true,
  showLegend = true,
  className,
}: LineChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isReady = useContainerReady(containerRef);

  return (
    <div ref={containerRef} className={className} style={{ width: "100%", minWidth: 200, height, minHeight: 200 }}>
      {isReady && <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />}
          <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
          <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #E5E7EB",
              borderRadius: "8px",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            }}
          />
          {showLegend && <Legend />}
          {dataKeys.map((dk, index) => (
            <Line
              key={dk.key}
              type="monotone"
              dataKey={dk.key}
              name={dk.name || dk.key}
              stroke={dk.color || COLORS[index % COLORS.length]}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>}
    </div>
  );
});

interface BarChartProps extends BaseChartProps {
  dataKeys: { key: string; color?: string; name?: string; stackId?: string }[];
  showGrid?: boolean;
  showLegend?: boolean;
  layout?: "horizontal" | "vertical";
}

export const SimpleBarChart = memo(function SimpleBarChart({
  data,
  dataKeys,
  height = 300,
  showGrid = true,
  showLegend = true,
  layout = "horizontal",
  className,
}: BarChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isReady = useContainerReady(containerRef);

  return (
    <div ref={containerRef} className={className} style={{ width: "100%", minWidth: 200, height, minHeight: 200 }}>
      {isReady && <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout={layout}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />}
          {layout === "horizontal" ? (
            <>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
              <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" />
            </>
          ) : (
            <>
              <XAxis type="number" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} stroke="#9CA3AF" width={100} />
            </>
          )}
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #E5E7EB",
              borderRadius: "8px",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            }}
          />
          {showLegend && <Legend />}
          {dataKeys.map((dk, index) => (
            <Bar
              key={dk.key}
              dataKey={dk.key}
              name={dk.name || dk.key}
              fill={dk.color || COLORS[index % COLORS.length]}
              stackId={dk.stackId}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>}
    </div>
  );
});

interface PieChartProps extends BaseChartProps {
  dataKey: string;
  nameKey?: string;
  showLegend?: boolean;
  innerRadius?: number;
  outerRadius?: number;
}

export const SimplePieChart = memo(function SimplePieChart({
  data,
  dataKey,
  nameKey = "name",
  height = 300,
  showLegend = true,
  innerRadius = 0,
  outerRadius = 80,
  className,
}: PieChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isReady = useContainerReady(containerRef);

  return (
    <div ref={containerRef} className={className} style={{ width: "100%", minWidth: 200, height, minHeight: 200 }}>
      {isReady && <ResponsiveContainer width="100%" height="100%">
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
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #E5E7EB",
              borderRadius: "8px",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            }}
          />
          {showLegend && <Legend />}
        </PieChart>
      </ResponsiveContainer>}
    </div>
  );
});

export const DonutChart = memo(function DonutChart(props: PieChartProps) {
  return <SimplePieChart {...props} innerRadius={60} outerRadius={80} />;
});

interface AreaChartProps extends BaseChartProps {
  dataKeys: { key: string; color?: string; name?: string; stackId?: string }[];
  showGrid?: boolean;
  showLegend?: boolean;
}

export const SimpleAreaChart = memo(function SimpleAreaChart({
  data,
  dataKeys,
  height = 300,
  showGrid = true,
  showLegend = true,
  className,
}: AreaChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isReady = useContainerReady(containerRef);

  return (
    <div ref={containerRef} className={className} style={{ width: "100%", minWidth: 200, height, minHeight: 200 }}>
      {isReady && <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />}
          <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
          <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #E5E7EB",
              borderRadius: "8px",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            }}
          />
          {showLegend && <Legend />}
          {dataKeys.map((dk, index) => (
            <Area
              key={dk.key}
              type="monotone"
              dataKey={dk.key}
              name={dk.name || dk.key}
              stroke={dk.color || COLORS[index % COLORS.length]}
              fill={dk.color || COLORS[index % COLORS.length]}
              fillOpacity={0.3}
              stackId={dk.stackId}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>}
    </div>
  );
});

// Componente de Card com Gráfico
interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}

export const ChartCard = memo(function ChartCard({ title, subtitle, children, className, actions }: ChartCardProps) {
  return (
    <div className={`bg-theme-card rounded-lg shadow p-4 ${className || ""}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-theme">{title}</h3>
          {subtitle && <p className="text-sm text-theme-muted">{subtitle}</p>}
        </div>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>
      <div className="min-h-[200px] w-full">
        {children}
      </div>
    </div>
  );
});

// Componente de KPI com mini gráfico
interface KpiCardProps {
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
    <div className={`bg-theme-card rounded-lg shadow p-4 ${className || ""}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-theme-muted">{title}</p>
          <p className="text-2xl font-bold text-theme mt-1">{value}</p>
          {change !== undefined && (
            <p className={`text-sm mt-1 ${isPositive ? "text-green-600" : "text-red-600"}`}>
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

export { COLORS };
