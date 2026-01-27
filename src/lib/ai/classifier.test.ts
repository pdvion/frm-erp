import { describe, it, expect } from "vitest";
import {
  classifyByTextSimilarity,
  suggestCostCenter,
} from "./classifier";

const mockMaterials = [
  { id: "1", code: 100, description: "Parafuso Phillips 4x20mm", category: "Fixação", ncm: "73181500" },
  { id: "2", code: 101, description: "Parafuso Sextavado M8x30", category: "Fixação", ncm: "73181500" },
  { id: "3", code: 200, description: "Óleo Lubrificante 5W30", category: "Lubrificantes", ncm: "27101932" },
  { id: "4", code: 201, description: "Graxa Multiuso", category: "Lubrificantes", ncm: "27101932" },
  { id: "5", code: 300, description: "Rolamento 6205 2RS", category: "Rolamentos", ncm: "84821010" },
  { id: "6", code: 301, description: "Rolamento 6206 ZZ", category: "Rolamentos", ncm: "84821010" },
  { id: "7", code: 400, description: "Correia Dentada HTD 5M", category: "Transmissão", ncm: "40103100" },
  { id: "8", code: 401, description: "Correia V A68", category: "Transmissão", ncm: "40103100" },
];

describe("classifyByTextSimilarity", () => {
  it("should return suggestions sorted by score", () => {
    const result = classifyByTextSimilarity("Parafuso Phillips", mockMaterials);

    expect(result.suggestions.length).toBeGreaterThan(0);
    expect(result.suggestions[0].description).toContain("Parafuso");
    
    // Verificar que está ordenado por score decrescente
    for (let i = 1; i < result.suggestions.length; i++) {
      expect(result.suggestions[i - 1].score).toBeGreaterThanOrEqual(
        result.suggestions[i].score
      );
    }
  });

  it("should return exact match with high score", () => {
    const result = classifyByTextSimilarity(
      "Parafuso Phillips 4x20mm",
      mockMaterials
    );

    expect(result.suggestions[0].id).toBe("1");
    expect(result.suggestions[0].score).toBeGreaterThan(0.8);
    expect(result.confidence).toBe("high");
  });

  it("should return partial match with medium score", () => {
    const result = classifyByTextSimilarity("Parafuso", mockMaterials);

    expect(result.suggestions.length).toBeGreaterThanOrEqual(2);
    expect(result.suggestions[0].description).toContain("Parafuso");
  });

  it("should return low confidence for poor matches", () => {
    const result = classifyByTextSimilarity("Produto Inexistente XYZ", mockMaterials);

    expect(result.confidence).toBe("low");
  });

  it("should respect limit parameter", () => {
    const result = classifyByTextSimilarity("Parafuso", mockMaterials, 2);

    expect(result.suggestions.length).toBeLessThanOrEqual(2);
  });

  it("should include processing time", () => {
    const result = classifyByTextSimilarity("Rolamento", mockMaterials);

    expect(result.processingTime).toBeGreaterThanOrEqual(0);
    expect(typeof result.processingTime).toBe("number");
  });

  it("should match by code when included in description", () => {
    const result = classifyByTextSimilarity("Material código 100", mockMaterials);

    // Deve ter algum boost para o material com código 100
    const material100 = result.suggestions.find((s) => s.code === 100);
    expect(material100).toBeDefined();
  });

  it("should handle empty materials array", () => {
    const result = classifyByTextSimilarity("Parafuso", []);

    expect(result.suggestions).toHaveLength(0);
    expect(result.confidence).toBe("low");
  });

  it("should handle empty search term", () => {
    const result = classifyByTextSimilarity("", mockMaterials);

    expect(result.suggestions).toHaveLength(0);
  });
});

describe("suggestCostCenter", () => {
  const mockHistory = [
    { supplierId: "sup1", materialId: "mat1", costCenter: "CC001" },
    { supplierId: "sup1", materialId: "mat2", costCenter: "CC001" },
    { supplierId: "sup1", materialId: "mat3", costCenter: "CC002" },
    { supplierId: "sup2", materialId: "mat1", costCenter: "CC003" },
    { supplierId: "sup2", materialId: "mat4", costCenter: "CC003" },
    { supplierId: "sup3", materialId: "mat5", costCenter: "CC004" },
  ];

  it("should return exact match (supplier + material)", () => {
    const result = suggestCostCenter("sup1", "mat1", mockHistory);
    expect(result).toBe("CC001");
  });

  it("should return most frequent cost center for supplier", () => {
    // sup1 tem 2x CC001 e 1x CC002, deve retornar CC001
    const result = suggestCostCenter("sup1", "mat_unknown", mockHistory);
    expect(result).toBe("CC001");
  });

  it("should fallback to material match when supplier not found", () => {
    // mat1 aparece com CC001 (sup1) e CC003 (sup2)
    const result = suggestCostCenter("sup_unknown", "mat1", mockHistory);
    // Deve retornar o mais frequente para o material
    expect(result).not.toBeNull();
  });

  it("should return null when no match found", () => {
    const result = suggestCostCenter("sup_unknown", "mat_unknown", mockHistory);
    expect(result).toBeNull();
  });

  it("should handle empty history", () => {
    const result = suggestCostCenter("sup1", "mat1", []);
    expect(result).toBeNull();
  });
});
