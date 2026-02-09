import { describe, it, expect } from "vitest";
import { validateProductSpecs, type CategoryAttributeInfo } from "./spec-validator";

const bearingAttributes: CategoryAttributeInfo[] = [
  { key: "bore_diameter", name: "Diâmetro Interno", dataType: "FLOAT", unit: "mm", enumOptions: [], isRequired: true },
  { key: "outside_diameter", name: "Diâmetro Externo", dataType: "FLOAT", unit: "mm", enumOptions: [], isRequired: true },
  { key: "width", name: "Largura", dataType: "FLOAT", unit: "mm", enumOptions: [], isRequired: true },
  { key: "internal_clearance", name: "Folga Interna", dataType: "ENUM", unit: null, enumOptions: ["C2", "CN", "C3", "C4", "C5"], isRequired: false },
  { key: "sealing_type", name: "Tipo de Vedação", dataType: "ENUM", unit: null, enumOptions: ["Aberto", "2RS", "2Z"], isRequired: false },
  { key: "weight", name: "Peso", dataType: "FLOAT", unit: "kg", enumOptions: [], isRequired: false },
  { key: "groove_count", name: "Número de Canais", dataType: "INTEGER", unit: null, enumOptions: [], isRequired: false },
  { key: "is_sealed", name: "Vedado", dataType: "BOOLEAN", unit: null, enumOptions: [], isRequired: false },
];

describe("validateProductSpecs", () => {
  it("should return no warnings for complete valid specs", () => {
    const specs = {
      bore_diameter: 25,
      outside_diameter: 52,
      width: 15,
      internal_clearance: "CN",
      sealing_type: "2RS",
      weight: 0.12,
    };

    const result = validateProductSpecs(specs, bearingAttributes);
    expect(result.valid).toBe(true);
    expect(result.warnings).toHaveLength(0);
  });

  it("should warn about missing required fields", () => {
    const specs = { bore_diameter: 25 };

    const result = validateProductSpecs(specs, bearingAttributes);
    expect(result.valid).toBe(true);
    expect(result.warnings).toContain("Campo obrigatório ausente: Diâmetro Externo (outside_diameter)");
    expect(result.warnings).toContain("Campo obrigatório ausente: Largura (width)");
  });

  it("should warn about null/undefined specs when required fields exist", () => {
    const result = validateProductSpecs(null, bearingAttributes);
    expect(result.valid).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings[0]).toContain("Especificações ausentes");
  });

  it("should warn about invalid number types", () => {
    const specs = {
      bore_diameter: "abc",
      outside_diameter: 52,
      width: 15,
    };

    const result = validateProductSpecs(specs, bearingAttributes);
    expect(result.valid).toBe(true);
    expect(result.warnings).toContain('Diâmetro Interno: esperado número, recebido "abc"');
  });

  it("should warn about non-integer values for INTEGER type", () => {
    const specs = {
      bore_diameter: 25,
      outside_diameter: 52,
      width: 15,
      groove_count: 3.5,
    };

    const result = validateProductSpecs(specs, bearingAttributes);
    expect(result.valid).toBe(true);
    expect(result.warnings).toContain("Número de Canais: esperado inteiro, recebido 3.5");
  });

  it("should warn about invalid enum values", () => {
    const specs = {
      bore_diameter: 25,
      outside_diameter: 52,
      width: 15,
      internal_clearance: "C9",
    };

    const result = validateProductSpecs(specs, bearingAttributes);
    expect(result.valid).toBe(true);
    expect(result.warnings).toContain('Folga Interna: valor "C9" não está entre as opções válidas: C2, CN, C3, C4, C5');
  });

  it("should warn about invalid boolean values", () => {
    const specs = {
      bore_diameter: 25,
      outside_diameter: 52,
      width: 15,
      is_sealed: "maybe",
    };

    const result = validateProductSpecs(specs, bearingAttributes);
    expect(result.valid).toBe(true);
    expect(result.warnings).toContain('Vedado: esperado booleano, recebido "maybe"');
  });

  it("should accept valid boolean values", () => {
    const specs = {
      bore_diameter: 25,
      outside_diameter: 52,
      width: 15,
      is_sealed: true,
    };

    const result = validateProductSpecs(specs, bearingAttributes);
    expect(result.valid).toBe(true);
    expect(result.warnings).toHaveLength(0);
  });

  it("should warn about extra keys not in template", () => {
    const specs = {
      bore_diameter: 25,
      outside_diameter: 52,
      width: 15,
      unknown_field: "test",
    };

    const result = validateProductSpecs(specs, bearingAttributes);
    expect(result.valid).toBe(true);
    expect(result.warnings).toContain("Campo extra não definido no template: unknown_field");
  });

  it("should skip validation for empty optional fields", () => {
    const specs = {
      bore_diameter: 25,
      outside_diameter: 52,
      width: 15,
      weight: "",
      internal_clearance: null,
    };

    const result = validateProductSpecs(specs, bearingAttributes);
    expect(result.valid).toBe(true);
    expect(result.warnings).toHaveLength(0);
  });

  it("should return no warnings for empty attributes list", () => {
    const specs = { bore_diameter: 25 };
    const result = validateProductSpecs(specs, []);
    expect(result.valid).toBe(true);
    expect(result.warnings).toContain("Campo extra não definido no template: bore_diameter");
  });

  it("should handle undefined specs with no required attributes", () => {
    const optionalOnly: CategoryAttributeInfo[] = [
      { key: "weight", name: "Peso", dataType: "FLOAT", unit: "kg", enumOptions: [], isRequired: false },
    ];
    const result = validateProductSpecs(undefined, optionalOnly);
    expect(result.valid).toBe(true);
    expect(result.warnings).toHaveLength(0);
  });
});
