/**
 * Utilitários para manipulação de cores e contraste
 */

/**
 * Determina se uma cor de fundo é clara ou escura
 * Retorna a classe de texto apropriada para contraste
 */
export function getContrastTextClass(bgColor: string): string {
  // Remove # se presente
  const hex = bgColor.replace("#", "");

  // Valida formato hex
  if (!/^[0-9A-Fa-f]{6}$/.test(hex) && !/^[0-9A-Fa-f]{3}$/.test(hex)) {
    return "text-white"; // fallback para cores inválidas
  }

  // Expande hex curto (3 chars) para longo (6 chars)
  const fullHex =
    hex.length === 3
      ? hex
        .split("")
        .map((c) => c + c)
        .join("")
      : hex;

  // Converte hex para RGB
  const r = parseInt(fullHex.substring(0, 2), 16);
  const g = parseInt(fullHex.substring(2, 4), 16);
  const b = parseInt(fullHex.substring(4, 6), 16);

  // Calcula luminância relativa (fórmula W3C WCAG)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Retorna classe apropriada (threshold 0.5)
  return luminance > 0.5 ? "text-gray-900" : "text-white";
}

/**
 * Verifica se uma cor é clara
 */
export function isLightColor(bgColor: string): boolean {
  const hex = bgColor.replace("#", "");
  if (!/^[0-9A-Fa-f]{6}$/.test(hex) && !/^[0-9A-Fa-f]{3}$/.test(hex)) {
    return false;
  }

  const fullHex =
    hex.length === 3
      ? hex
        .split("")
        .map((c) => c + c)
        .join("")
      : hex;

  const r = parseInt(fullHex.substring(0, 2), 16);
  const g = parseInt(fullHex.substring(2, 4), 16);
  const b = parseInt(fullHex.substring(4, 6), 16);

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}
