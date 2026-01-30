"use client";

import { ReactNode, useId, KeyboardEvent } from "react";

export interface Tab {
  id: string;
  label: string;
  disabled?: boolean;
  icon?: ReactNode;
}

export interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  children?: ReactNode;
  className?: string;
  variant?: "default" | "pills" | "underline";
}

export interface TabPanelProps {
  id: string;
  activeTab: string;
  children: ReactNode;
  className?: string;
}

const variantStyles = {
  default: {
    list: "border-b border-theme",
    tab: "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
    active: "border-blue-600 text-blue-600",
    inactive: "border-transparent text-theme-muted hover:text-theme-secondary hover:border-gray-300",
    disabled: "opacity-50 cursor-not-allowed",
  },
  pills: {
    list: "flex gap-2",
    tab: "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
    active: "bg-blue-600 text-white",
    inactive: "text-theme-secondary hover:bg-theme-hover",
    disabled: "opacity-50 cursor-not-allowed",
  },
  underline: {
    list: "flex gap-6",
    tab: "pb-2 text-sm font-medium border-b-2 transition-colors",
    active: "border-blue-600 text-blue-600",
    inactive: "border-transparent text-theme-muted hover:text-theme-secondary",
    disabled: "opacity-50 cursor-not-allowed",
  },
};

export function Tabs({
  tabs,
  activeTab,
  onChange,
  children,
  className = "",
  variant = "default",
}: TabsProps) {
  const baseId = useId();
  const styles = variantStyles[variant];

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const enabledTabs = tabs.filter((t) => !t.disabled);
    const currentEnabledIndex = enabledTabs.findIndex((t) => t.id === tabs[index].id);

    let newIndex: number | null = null;

    switch (e.key) {
      case "ArrowLeft":
        e.preventDefault();
        newIndex = currentEnabledIndex > 0 ? currentEnabledIndex - 1 : enabledTabs.length - 1;
        break;
      case "ArrowRight":
        e.preventDefault();
        newIndex = currentEnabledIndex < enabledTabs.length - 1 ? currentEnabledIndex + 1 : 0;
        break;
      case "Home":
        e.preventDefault();
        newIndex = 0;
        break;
      case "End":
        e.preventDefault();
        newIndex = enabledTabs.length - 1;
        break;
    }

    if (newIndex !== null) {
      const newTab = enabledTabs[newIndex];
      onChange(newTab.id);
      const button = document.getElementById(`${baseId}-tab-${newTab.id}`);
      button?.focus();
    }
  };

  return (
    <div className={className}>
      <div role="tablist" aria-orientation="horizontal" className={`flex ${styles.list}`}>
        {tabs.map((tab, index) => {
          const isActive = tab.id === activeTab;
          const isDisabled = tab.disabled;

          return (
            <button
              key={tab.id}
              id={`${baseId}-tab-${tab.id}`}
              role="tab"
              type="button"
              aria-selected={isActive}
              aria-controls={`${baseId}-panel-${tab.id}`}
              aria-disabled={isDisabled}
              tabIndex={isActive ? 0 : -1}
              disabled={isDisabled}
              onClick={() => !isDisabled && onChange(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={`
                ${styles.tab}
                ${isActive ? styles.active : styles.inactive}
                ${isDisabled ? styles.disabled : ""}
                flex items-center gap-2
              `}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>
      {children}
    </div>
  );
}

export function TabPanel({ id, activeTab, children, className = "" }: TabPanelProps) {
  const baseId = useId();
  const isActive = id === activeTab;

  if (!isActive) return null;

  return (
    <div
      id={`${baseId}-panel-${id}`}
      role="tabpanel"
      aria-labelledby={`${baseId}-tab-${id}`}
      tabIndex={0}
      className={`focus:outline-none ${className}`}
    >
      {children}
    </div>
  );
}

export default Tabs;
