"use client";

import { FileSpreadsheet, FileText } from "lucide-react";
import { exportToExcel, exportToPdf } from "@/lib/export";

interface ExportColumn {
  header: string;
  key: string;
  width?: number;
}

interface ExportButtonsProps {
  filename: string;
  title?: string;
  columns: ExportColumn[];
  data: Record<string, unknown>[];
  disabled?: boolean;
}

export function ExportButtons({
  filename,
  title,
  columns,
  data,
  disabled = false,
}: ExportButtonsProps) {
  const handleExportExcel = () => {
    exportToExcel({ filename, title, columns, data });
  };

  const handleExportPdf = () => {
    exportToPdf({ filename, title, columns, data });
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleExportExcel}
        disabled={disabled || data.length === 0}
        className="flex items-center gap-2 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="Exportar para Excel"
      >
        <FileSpreadsheet className="w-4 h-4" />
        <span className="hidden sm:inline">Excel</span>
      </button>
      <button
        type="button"
        onClick={handleExportPdf}
        disabled={disabled || data.length === 0}
        className="flex items-center gap-2 px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="Exportar para PDF"
      >
        <FileText className="w-4 h-4" />
        <span className="hidden sm:inline">PDF</span>
      </button>
    </div>
  );
}
