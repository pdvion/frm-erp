"use client";

import { ReactNode, useRef, useState, useCallback } from "react";

export interface SwipeActionItem {
  label: string;
  icon?: ReactNode;
  color: "danger" | "warning" | "success" | "primary";
  onClick: () => void;
}

export interface SwipeActionProps {
  children: ReactNode;
  leftActions?: SwipeActionItem[];
  rightActions?: SwipeActionItem[];
  threshold?: number;
  className?: string;
}

const colorMap = {
  danger: "bg-red-500 text-white",
  warning: "bg-yellow-500 text-white",
  success: "bg-green-500 text-white",
  primary: "bg-blue-500 text-white",
};

export function SwipeAction({
  children,
  leftActions = [],
  rightActions = [],
  threshold = 80,
  className = "",
}: SwipeActionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const currentX = useRef(0);
  const [offset, setOffset] = useState(0);
  const [swiping, setSwiping] = useState(false);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    startX.current = e.touches[0].clientX;
    currentX.current = 0;
    setSwiping(true);
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (!swiping) return;
      const diff = e.touches[0].clientX - startX.current;
      currentX.current = diff;

      // Limit swipe distance
      const maxLeft = rightActions.length > 0 ? -threshold * rightActions.length : 0;
      const maxRight = leftActions.length > 0 ? threshold * leftActions.length : 0;

      const clamped = Math.max(maxLeft, Math.min(maxRight, diff));
      setOffset(clamped);
    },
    [swiping, leftActions.length, rightActions.length, threshold]
  );

  const handleTouchEnd = useCallback(() => {
    setSwiping(false);
    const absOffset = Math.abs(currentX.current);

    if (absOffset < threshold / 2 || absOffset === 0) {
      setOffset(0);
      return;
    }

    // Snap to action position or reset
    if (currentX.current < 0 && rightActions.length > 0) {
      setOffset(-threshold * rightActions.length);
    } else if (currentX.current > 0 && leftActions.length > 0) {
      setOffset(threshold * leftActions.length);
    } else {
      setOffset(0);
    }
  }, [threshold, leftActions.length, rightActions.length]);

  const resetSwipe = useCallback(() => {
    setOffset(0);
  }, []);

  const handleActionClick = useCallback(
    (action: SwipeActionItem) => {
      action.onClick();
      resetSwipe();
    },
    [resetSwipe]
  );

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${className}`}>
      {/* Left actions (revealed when swiping right) */}
      {leftActions.length > 0 && (
        <div className="absolute inset-y-0 left-0 flex">
          {leftActions.map((action, i) => (
            <button
              key={i}
              onClick={() => handleActionClick(action)}
              className={`flex items-center justify-center gap-1 px-4 min-w-[80px] ${colorMap[action.color]}`}
              style={{ width: threshold }}
            >
              {action.icon}
              <span className="text-xs font-medium">{action.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Right actions (revealed when swiping left) */}
      {rightActions.length > 0 && (
        <div className="absolute inset-y-0 right-0 flex">
          {rightActions.map((action, i) => (
            <button
              key={i}
              onClick={() => handleActionClick(action)}
              className={`flex items-center justify-center gap-1 px-4 min-w-[80px] ${colorMap[action.color]}`}
              style={{ width: threshold }}
            >
              {action.icon}
              <span className="text-xs font-medium">{action.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div
        className={`relative bg-theme-card ${swiping ? "" : "transition-transform duration-200"}`}
        style={{ transform: `translateX(${offset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}
