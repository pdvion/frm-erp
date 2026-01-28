"use client";

import { useTheme } from "@/contexts/ThemeContext";
import { Sun, Moon, Monitor } from "lucide-react";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  const options = [
    { value: "light" as const, icon: Sun, label: "Claro" },
    { value: "dark" as const, icon: Moon, label: "Escuro" },
    { value: "system" as const, icon: Monitor, label: "Sistema" },
  ];

  return (
    <div className="flex items-center gap-1 p-1 rounded-lg bg-theme-card dark:bg-theme-card light:bg-theme-tertiary">
      {options.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={`p-2 rounded-md transition-colors ${
            theme === value
              ? "bg-blue-600 text-white"
              : "text-theme-muted hover:text-theme hover:bg-theme-hover"
          }`}
          title={label}
          aria-label={`Tema ${label}`}
        >
          <Icon className="w-4 h-4" />
        </button>
      ))}
    </div>
  );
}
