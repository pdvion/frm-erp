"use client";

import {
  ReactNode,
  useState,
  useRef,
  useEffect,
  useCallback,
  KeyboardEvent,
  createContext,
  useContext,
} from "react";
import { createPortal } from "react-dom";
import { ChevronRight } from "lucide-react";

interface DropdownContextType {
  closeDropdown: () => void;
}

const DropdownContext = createContext<DropdownContextType>({
  closeDropdown: () => {},
});

export interface DropdownProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: "left" | "right";
  className?: string;
}

export function Dropdown({
  trigger,
  children,
  align = "left",
  className = "",
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const focusedIndex = useRef(-1);

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
    focusedIndex.current = -1;
  }, []);

  const calculatePosition = useCallback(() => {
    if (!triggerRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    const left = align === "left" 
      ? triggerRect.left + scrollX 
      : triggerRect.right + scrollX;

    const top = triggerRect.bottom + scrollY + 4;

    setCoords({ top, left });
  }, [align]);

  const handleToggle = useCallback(() => {
    if (!isOpen) {
      calculatePosition();
    }
    setIsOpen((prev) => !prev);
  }, [isOpen, calculatePosition]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) {
        if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
          e.preventDefault();
          handleToggle();
        }
        return;
      }

      const items = menuRef.current?.querySelectorAll('[role="menuitem"]:not([disabled])');
      if (!items) return;

      switch (e.key) {
        case "Escape":
          e.preventDefault();
          closeDropdown();
          triggerRef.current?.focus();
          break;
        case "ArrowDown":
          e.preventDefault();
          focusedIndex.current = Math.min(focusedIndex.current + 1, items.length - 1);
          (items[focusedIndex.current] as HTMLElement)?.focus();
          break;
        case "ArrowUp":
          e.preventDefault();
          focusedIndex.current = Math.max(focusedIndex.current - 1, 0);
          (items[focusedIndex.current] as HTMLElement)?.focus();
          break;
        case "Home":
          e.preventDefault();
          focusedIndex.current = 0;
          (items[0] as HTMLElement)?.focus();
          break;
        case "End":
          e.preventDefault();
          focusedIndex.current = items.length - 1;
          (items[items.length - 1] as HTMLElement)?.focus();
          break;
        case "Tab":
          closeDropdown();
          break;
      }
    },
    [isOpen, handleToggle, closeDropdown]
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        isOpen &&
        triggerRef.current &&
        menuRef.current &&
        !triggerRef.current.contains(e.target as Node) &&
        !menuRef.current.contains(e.target as Node)
      ) {
        closeDropdown();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, closeDropdown]);

  return (
    <DropdownContext.Provider value={{ closeDropdown }}>
      <div className="relative inline-block">
        <div
          ref={triggerRef}
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="button"
          aria-haspopup="menu"
          aria-expanded={isOpen}
          className="cursor-pointer"
        >
          {trigger}
        </div>
        {isOpen &&
          typeof window !== "undefined" &&
          createPortal(
            <div
              ref={menuRef}
              role="menu"
              aria-orientation="vertical"
              onKeyDown={handleKeyDown}
              className={`fixed z-[9999] min-w-[180px] py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg ${className}`}
              style={{
                top: coords.top,
                left: align === "right" ? "auto" : coords.left,
                right: align === "right" ? window.innerWidth - coords.left : "auto",
              }}
            >
              {children}
            </div>,
            document.body
          )}
      </div>
    </DropdownContext.Provider>
  );
}

export interface DropdownItemProps {
  children: ReactNode;
  onClick?: () => void;
  icon?: ReactNode;
  variant?: "default" | "danger";
  disabled?: boolean;
  className?: string;
}

export function DropdownItem({
  children,
  onClick,
  icon,
  variant = "default",
  disabled = false,
  className = "",
}: DropdownItemProps) {
  const { closeDropdown } = useContext(DropdownContext);

  const handleClick = () => {
    if (disabled) return;
    onClick?.();
    closeDropdown();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  const variantClasses = {
    default: "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700",
    danger: "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20",
  };

  return (
    <div
      role="menuitem"
      tabIndex={disabled ? -1 : 0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={`flex items-center gap-2 px-4 py-2 text-sm cursor-pointer transition-colors ${
        disabled
          ? "opacity-50 cursor-not-allowed"
          : variantClasses[variant]
      } ${className}`}
      aria-disabled={disabled}
    >
      {icon && <span className="w-4 h-4 flex-shrink-0">{icon}</span>}
      <span className="flex-1">{children}</span>
    </div>
  );
}

export interface DropdownSubmenuProps {
  trigger: ReactNode;
  children: ReactNode;
  icon?: ReactNode;
}

export function DropdownSubmenu({ trigger, children, icon }: DropdownSubmenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
        {icon && <span className="w-4 h-4 flex-shrink-0">{icon}</span>}
        <span className="flex-1">{trigger}</span>
        <ChevronRight className="w-4 h-4" />
      </div>
      {isOpen && (
        <div className="absolute left-full top-0 ml-1 min-w-[160px] py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
          {children}
        </div>
      )}
    </div>
  );
}

export function DropdownDivider() {
  return <div className="my-1 border-t border-gray-200 dark:border-gray-700" />;
}

export function DropdownLabel({ children }: { children: ReactNode }) {
  return (
    <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
      {children}
    </div>
  );
}
