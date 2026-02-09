"use client";

import { FileSpreadsheet, FileText } from "lucide-react";
import { exportToExcel, exportToPdf } from "@/lib/export";
import { Button } from "@/components/ui/Button";

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
      <Button
        variant="success"
        size="sm"
        onClick={handleExportExcel}
        disabled={disabled || data.length === 0}
        leftIcon={<FileSpreadsheet className="w-4 h-4" />}
        title="Exportar para Excel"
      >
        <span className="hidden sm:inline">Excel</span>
      </Button>
      <Button
        variant="danger"
        size="sm"
        onClick={handleExportPdf}
        disabled={disabled || data.length === 0}
        leftIcon={<FileText className="w-4 h-4" />}
        title="Exportar para PDF"
      >
        <span className="hidden sm:inline">PDF</span>
      </Button>
    </div>
  );
}
