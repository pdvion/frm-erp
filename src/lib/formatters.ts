/**
 * Utilitários de formatação centralizados
 * Evita criação repetida de Intl.NumberFormat/DateTimeFormat em cada componente
 */

// Formatadores singleton para melhor performance
const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const numberFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const integerFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat("pt-BR", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const shortDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
});

const monthYearFormatter = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
});

/**
 * Formata valor como moeda brasileira (R$)
 * @param value - Valor numérico
 * @returns String formatada (ex: "R$ 1.234,56")
 */
export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return "R$ 0,00";
  return currencyFormatter.format(value);
}

/**
 * Formata número com 2 casas decimais
 * @param value - Valor numérico
 * @returns String formatada (ex: "1.234,56")
 */
export function formatNumber(value: number | null | undefined): string {
  if (value == null) return "0,00";
  return numberFormatter.format(value);
}

/**
 * Formata número inteiro com separador de milhar
 * @param value - Valor numérico
 * @returns String formatada (ex: "1.234")
 */
export function formatInteger(value: number | null | undefined): string {
  if (value == null) return "0";
  return integerFormatter.format(value);
}

/**
 * Formata valor como percentual
 * @param value - Valor decimal (0.15 = 15%)
 * @returns String formatada (ex: "15,0%")
 */
export function formatPercent(value: number | null | undefined): string {
  if (value == null) return "0,0%";
  return percentFormatter.format(value);
}

/**
 * Formata data no padrão brasileiro
 * @param date - Data (string ISO, Date ou timestamp)
 * @returns String formatada (ex: "19/01/2026")
 */
export function formatDate(date: string | Date | number | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";
  return dateFormatter.format(d);
}

/**
 * Formata data e hora no padrão brasileiro
 * @param date - Data (string ISO, Date ou timestamp)
 * @returns String formatada (ex: "19/01/2026 14:30")
 */
export function formatDateTime(date: string | Date | number | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";
  return dateTimeFormatter.format(d);
}

/**
 * Formata data curta (dia e mês abreviado)
 * @param date - Data (string ISO, Date ou timestamp)
 * @returns String formatada (ex: "19 jan.")
 */
export function formatShortDate(date: string | Date | number | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";
  return shortDateFormatter.format(d);
}

/**
 * Formata mês e ano
 * @param date - Data (string ISO, Date ou timestamp)
 * @returns String formatada (ex: "janeiro de 2026")
 */
export function formatMonthYear(date: string | Date | number | null | undefined): string {
  if (!date) return "-";
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";
  return monthYearFormatter.format(d);
}

/**
 * Formata CNPJ
 * @param cnpj - CNPJ (apenas números)
 * @returns String formatada (ex: "12.345.678/0001-90")
 */
export function formatCNPJ(cnpj: string | null | undefined): string {
  if (!cnpj) return "-";
  const cleaned = cnpj.replace(/\D/g, "");
  if (cleaned.length !== 14) return cnpj;
  return cleaned.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}

/**
 * Formata CPF
 * @param cpf - CPF (apenas números)
 * @returns String formatada (ex: "123.456.789-00")
 */
export function formatCPF(cpf: string | null | undefined): string {
  if (!cpf) return "-";
  const cleaned = cpf.replace(/\D/g, "");
  if (cleaned.length !== 11) return cpf;
  return cleaned.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
}

/**
 * Formata telefone
 * @param phone - Telefone (apenas números)
 * @returns String formatada (ex: "(11) 99999-9999" ou "(11) 3333-3333")
 */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return "-";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 11) {
    return cleaned.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
  }
  if (cleaned.length === 10) {
    return cleaned.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");
  }
  return phone;
}

/**
 * Formata CEP
 * @param cep - CEP (apenas números)
 * @returns String formatada (ex: "01234-567")
 */
export function formatCEP(cep: string | null | undefined): string {
  if (!cep) return "-";
  const cleaned = cep.replace(/\D/g, "");
  if (cleaned.length !== 8) return cep;
  return cleaned.replace(/^(\d{5})(\d{3})$/, "$1-$2");
}

/**
 * Formata chave de acesso NFe
 * @param key - Chave de acesso (44 dígitos)
 * @returns String formatada com espaços a cada 4 dígitos
 */
export function formatNFeKey(key: string | null | undefined): string {
  if (!key) return "-";
  const cleaned = key.replace(/\D/g, "");
  if (cleaned.length !== 44) return key;
  return cleaned.match(/.{1,4}/g)?.join(" ") || key;
}

/**
 * Formata horas (ex: 8.5 -> "08:30")
 * @param hours - Horas em decimal
 * @returns String formatada (ex: "08:30")
 */
export function formatHours(hours: number | null | undefined): string {
  if (hours == null) return "00:00";
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

/**
 * Formata bytes para tamanho legível
 * @param bytes - Tamanho em bytes
 * @returns String formatada (ex: "1,5 MB")
 */
export function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}
