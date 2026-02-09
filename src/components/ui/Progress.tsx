"use client";

export type ProgressSize = "sm" | "md" | "lg";
export type ProgressVariant = "linear" | "circular";
export type ProgressColor = "default" | "success" | "warning" | "danger";

export interface ProgressProps {
  value?: number;
  max?: number;
  variant?: ProgressVariant;
  size?: ProgressSize;
  color?: ProgressColor;
  indeterminate?: boolean;
  showValue?: boolean;
  label?: string;
  className?: string;
}

const sizeConfig = {
  linear: {
    sm: "h-1",
    md: "h-2",
    lg: "h-3",
  },
  circular: {
    sm: { size: 32, stroke: 3 },
    md: { size: 48, stroke: 4 },
    lg: { size: 64, stroke: 5 },
  },
};

const colorConfig = {
  default: "bg-blue-600 dark:bg-blue-500",
  success: "bg-green-600 dark:bg-green-500",
  warning: "bg-yellow-500 dark:bg-yellow-400",
  danger: "bg-red-600 dark:bg-red-500",
};

const strokeColorConfig = {
  default: "stroke-blue-600 dark:stroke-blue-500",
  success: "stroke-green-600 dark:stroke-green-500",
  warning: "stroke-yellow-500 dark:stroke-yellow-400",
  danger: "stroke-red-600 dark:stroke-red-500",
};

export function Progress({
  value = 0,
  max = 100,
  variant = "linear",
  size = "md",
  color = "default",
  indeterminate = false,
  showValue = false,
  label,
  className = "",
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  if (variant === "circular") {
    const config = sizeConfig.circular[size];
    const radius = (config.size - config.stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
      <div className={`inline-flex flex-col items-center gap-1 ${className}`}>
        {label && (
          <span className="text-sm font-medium text-theme-secondary">
            {label}
          </span>
        )}
        <div className="relative" style={{ width: config.size, height: config.size }}>
          <svg
            className="transform -rotate-90"
            width={config.size}
            height={config.size}
          >
            {/* Background circle */}
            <circle
              cx={config.size / 2}
              cy={config.size / 2}
              r={radius}
              fill="none"
              strokeWidth={config.stroke}
              className="stroke-current text-gray-200 dark:text-gray-700"
            />
            {/* Progress circle */}
            <circle
              cx={config.size / 2}
              cy={config.size / 2}
              r={radius}
              fill="none"
              strokeWidth={config.stroke}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={indeterminate ? circumference * 0.25 : offset}
              className={`transition-all duration-300 ${strokeColorConfig[color]} ${
                indeterminate ? "animate-spin origin-center" : ""
              }`}
              style={indeterminate ? { animationDuration: "1s" } : undefined}
            />
          </svg>
          {showValue && !indeterminate && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs font-semibold text-theme-secondary">
                {Math.round(percentage)}%
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Linear variant
  return (
    <div className={`w-full ${className}`}>
      {(label || showValue) && (
        <div className="flex justify-between items-center mb-1">
          {label && (
            <span className="text-sm font-medium text-theme-secondary">
              {label}
            </span>
          )}
          {showValue && !indeterminate && (
            <span className="text-sm font-medium text-theme-muted">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div
        className={`w-full bg-theme-secondary rounded-full overflow-hidden ${sizeConfig.linear[size]}`}
        role="progressbar"
        aria-valuenow={indeterminate ? undefined : value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ${colorConfig[color]} ${
            indeterminate ? "animate-progress-indeterminate" : ""
          }`}
          style={indeterminate ? { width: "30%" } : { width: `${percentage}%` }}
        />
      </div>
      <style jsx>{`
        @keyframes progress-indeterminate {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(400%);
          }
        }
        .animate-progress-indeterminate {
          animation: progress-indeterminate 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

export default Progress;
