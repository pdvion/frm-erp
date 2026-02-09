"use client";

import { ReactNode, useState, Children, isValidElement, cloneElement } from "react";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface AvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: AvatarSize;
  className?: string;
  onClick?: () => void;
}

const sizeConfig: Record<AvatarSize, { container: string; text: string }> = {
  xs: { container: "w-6 h-6", text: "text-xs" },
  sm: { container: "w-8 h-8", text: "text-xs" },
  md: { container: "w-10 h-10", text: "text-sm" },
  lg: { container: "w-12 h-12", text: "text-base" },
  xl: { container: "w-16 h-16", text: "text-lg" },
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function getColorFromString(str: string): string {
  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-yellow-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-red-500",
    "bg-orange-500",
    "bg-teal-500",
    "bg-cyan-500",
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function Avatar({
  src,
  alt = "",
  fallback,
  size = "md",
  className = "",
  onClick,
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);
  const config = sizeConfig[size];
  const showFallback = !src || imageError;
  const initials = fallback || (alt ? getInitials(alt) : "?");
  const bgColor = getColorFromString(alt || fallback || "default");

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full overflow-hidden flex-shrink-0 ${config.container} ${
        onClick ? "cursor-pointer" : ""
      } ${className}`}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {showFallback ? (
        <div
          className={`w-full h-full flex items-center justify-center ${bgColor} text-white font-medium ${config.text}`}
        >
          {initials}
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      )}
    </div>
  );
}

export interface AvatarGroupProps {
  children: ReactNode;
  max?: number;
  size?: AvatarSize;
  className?: string;
}

export function AvatarGroup({
  children,
  max = 4,
  size = "md",
  className = "",
}: AvatarGroupProps) {
  const childArray = Children.toArray(children).filter(isValidElement);
  const visibleChildren = childArray.slice(0, max);
  const remainingCount = childArray.length - max;
  const config = sizeConfig[size];

  return (
    <div className={`flex -space-x-2 ${className}`}>
      {visibleChildren.map((child, index) => {
        if (isValidElement<AvatarProps>(child)) {
          return (
            <div
              key={index}
              className="relative ring-2 ring-white dark:ring-gray-900 rounded-full"
              style={{ zIndex: visibleChildren.length - index }}
            >
              {cloneElement(child, { size })}
            </div>
          );
        }
        return child;
      })}
      {remainingCount > 0 && (
        <div
          className={`relative ring-2 ring-white dark:ring-gray-900 rounded-full flex items-center justify-center bg-theme-secondary text-theme-muted font-medium ${config.container} ${config.text}`}
          style={{ zIndex: 0 }}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}

export interface AvatarWithStatusProps extends AvatarProps {
  status?: "online" | "offline" | "busy" | "away";
}

export function AvatarWithStatus({
  status,
  size = "md",
  ...props
}: AvatarWithStatusProps) {
  const statusColors = {
    online: "bg-green-500",
    offline: "bg-gray-400",
    busy: "bg-red-500",
    away: "bg-yellow-500",
  };

  const statusSizes: Record<AvatarSize, string> = {
    xs: "w-1.5 h-1.5",
    sm: "w-2 h-2",
    md: "w-2.5 h-2.5",
    lg: "w-3 h-3",
    xl: "w-4 h-4",
  };

  return (
    <div className="relative inline-block">
      <Avatar size={size} {...props} />
      {status && (
        <span
          className={`absolute bottom-0 right-0 block rounded-full ring-2 ring-white dark:ring-gray-900 ${statusColors[status]} ${statusSizes[size]}`}
        />
      )}
    </div>
  );
}

export default Avatar;
