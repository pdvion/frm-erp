"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Drawer } from "./Drawer";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectWithAddProps {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: SelectOption[];
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  drawerTitle: string;
  drawerDescription?: string;
  drawerSize?: "sm" | "md" | "lg" | "xl";
  FormComponent: React.ComponentType<{
    onSuccess: (item: { id: string; [key: string]: unknown }) => void;
    onCancel: () => void;
  }>;
  onItemCreated?: (item: { id: string; [key: string]: unknown }) => void;
}

export function SelectWithAdd({
  id,
  name,
  label,
  value,
  onChange,
  options,
  placeholder = "Selecione...",
  required = false,
  disabled = false,
  className = "",
  drawerTitle,
  drawerDescription,
  drawerSize = "md",
  FormComponent,
  onItemCreated,
}: SelectWithAddProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleSuccess = (item: { id: string; [key: string]: unknown }) => {
    setIsDrawerOpen(false);
    
    // Simula um evento de change para atualizar o valor do select
    const syntheticEvent = {
      target: {
        name,
        value: item.id,
      },
    } as React.ChangeEvent<HTMLSelectElement>;
    
    onChange(syntheticEvent);
    
    if (onItemCreated) {
      onItemCreated(item);
    }
  };

  return (
    <>
      <div className="space-y-1">
        <label htmlFor={id} className="block text-sm font-medium text-theme-secondary">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="flex gap-2">
          <select
            id={id}
            name={name}
            value={value}
            onChange={onChange}
            required={required}
            disabled={disabled}
            className={`flex-1 px-3 py-2 border border-theme rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${className}`}
          >
            <option value="">{placeholder}</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            disabled={disabled}
            className="px-3 py-2 bg-theme-tertiary border border-theme rounded-lg hover:bg-theme-tertiary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title={`Adicionar ${label.toLowerCase()}`}
          >
            <Plus className="w-5 h-5 text-theme-secondary" />
          </button>
        </div>
      </div>

      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={drawerTitle}
        description={drawerDescription}
        size={drawerSize}
      >
        <FormComponent
          onSuccess={handleSuccess}
          onCancel={() => setIsDrawerOpen(false)}
        />
      </Drawer>
    </>
  );
}
