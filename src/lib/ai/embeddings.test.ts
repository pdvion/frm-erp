import { describe, it, expect } from "vitest";
import {
  composeMaterialEmbeddingText,
  type MaterialEmbeddingData,
} from "./embeddings";

describe("composeMaterialEmbeddingText", () => {
  it("should compose text with all fields", () => {
    const material: MaterialEmbeddingData = {
      id: "uuid-1",
      code: 1001,
      description: "Parafuso Sextavado M10x50",
      internalCode: "PAR-001",
      ncm: "7318.15.00",
      unit: "UN",
      categoryName: "Fixadores",
      subCategoryName: "Parafusos",
      manufacturer: "Ciser",
      notes: "Aço carbono zincado",
      barcode: "7891234567890",
    };

    const text = composeMaterialEmbeddingText(material);

    expect(text).toContain("Parafuso Sextavado M10x50");
    expect(text).toContain("Código interno: PAR-001");
    expect(text).toContain("Código: 1001");
    expect(text).toContain("NCM: 7318.15.00");
    expect(text).toContain("Categoria: Fixadores");
    expect(text).toContain("Subcategoria: Parafusos");
    expect(text).toContain("Unidade: UN");
    expect(text).toContain("Fabricante: Ciser");
    expect(text).toContain("Código de barras: 7891234567890");
    expect(text).toContain("Observações: Aço carbono zincado");
  });

  it("should compose text with minimal fields", () => {
    const material: MaterialEmbeddingData = {
      id: "uuid-2",
      code: 2001,
      description: "Chapa de Aço 3mm",
      unit: "KG",
    };

    const text = composeMaterialEmbeddingText(material);

    expect(text).toBe("Chapa de Aço 3mm | Código: 2001 | Unidade: KG");
  });

  it("should skip null/undefined optional fields", () => {
    const material: MaterialEmbeddingData = {
      id: "uuid-3",
      code: 3001,
      description: "Rolamento 6205",
      internalCode: null,
      ncm: null,
      unit: "UN",
      categoryName: null,
      subCategoryName: null,
      manufacturer: null,
      notes: null,
      barcode: null,
    };

    const text = composeMaterialEmbeddingText(material);

    expect(text).toBe("Rolamento 6205 | Código: 3001 | Unidade: UN");
    expect(text).not.toContain("Código interno");
    expect(text).not.toContain("NCM");
    expect(text).not.toContain("Categoria");
    expect(text).not.toContain("Fabricante");
  });

  it("should use pipe separator between parts", () => {
    const material: MaterialEmbeddingData = {
      id: "uuid-4",
      code: 4001,
      description: "Óleo Hidráulico 68",
      unit: "LT",
      ncm: "2710.19.91",
      categoryName: "Lubrificantes",
    };

    const text = composeMaterialEmbeddingText(material);
    const parts = text.split(" | ");

    expect(parts).toHaveLength(5);
    expect(parts[0]).toBe("Óleo Hidráulico 68");
    expect(parts[1]).toBe("Código: 4001");
    expect(parts[2]).toBe("NCM: 2710.19.91");
    expect(parts[3]).toBe("Categoria: Lubrificantes");
    expect(parts[4]).toBe("Unidade: LT");
  });

  it("should handle empty description gracefully", () => {
    const material: MaterialEmbeddingData = {
      id: "uuid-5",
      code: 5001,
      description: "",
      unit: "UN",
    };

    const text = composeMaterialEmbeddingText(material);
    expect(text).toContain("Código: 5001");
    expect(text).toContain("Unidade: UN");
  });
});
