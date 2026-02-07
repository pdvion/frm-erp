/**
 * PDF Generator utility using browser print
 */

import { toast } from "sonner";

export interface PdfOptions {
  title: string;
  filename: string;
}

export function generatePdfFromHtml(content: string, options: PdfOptions): void {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    toast.warning("Por favor, permita pop-ups para gerar o PDF");
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${options.title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f5f5f5; font-weight: bold; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .header h1 { margin: 0 0 10px 0; font-size: 24px; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        ${content}
        <div class="footer">
          <p>Documento gerado em ${new Date().toLocaleString("pt-BR")}</p>
        </div>
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => printWindow.print(), 250);
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}
