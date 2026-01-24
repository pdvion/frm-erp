import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

interface ExportColumn {
  header: string;
  key: string;
  width?: number;
}

interface ExportOptions {
  filename: string;
  title?: string;
  columns: ExportColumn[];
  data: Record<string, unknown>[];
}

export function exportToExcel({ filename, title, columns, data }: ExportOptions): void {
  const worksheetData = data.map((row) =>
    columns.reduce((acc, col) => {
      acc[col.header] = row[col.key] ?? "";
      return acc;
    }, {} as Record<string, unknown>)
  );

  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, title || "Dados");

  // Ajustar largura das colunas
  const colWidths = columns.map((col) => ({
    wch: col.width || Math.max(col.header.length, 15),
  }));
  worksheet["!cols"] = colWidths;

  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export function exportToPdf({ filename, title, columns, data }: ExportOptions): void {
  const doc = new jsPDF({
    orientation: columns.length > 5 ? "landscape" : "portrait",
    unit: "mm",
    format: "a4",
  });

  // Título
  if (title) {
    doc.setFontSize(16);
    doc.text(title, 14, 15);
  }

  // Tabela
  const tableData = data.map((row) =>
    columns.map((col) => {
      const value = row[col.key];
      if (value === null || value === undefined) return "";
      if (typeof value === "number") return value.toLocaleString("pt-BR");
      if (value instanceof Date) return value.toLocaleDateString("pt-BR");
      return String(value);
    })
  );

  autoTable(doc, {
    head: [columns.map((col) => col.header)],
    body: tableData,
    startY: title ? 25 : 15,
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [20, 184, 166], // teal-500
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
  });

  doc.save(`${filename}.pdf`);
}

export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("pt-BR");
}
