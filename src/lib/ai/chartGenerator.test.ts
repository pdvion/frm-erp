import { describe, it, expect } from "vitest";
import {
  suggestChartType,
  getChartSuggestions,
  AVAILABLE_DATA_SOURCES,
} from "./chartGenerator";

describe("suggestChartType", () => {
  it("should suggest pie chart for few categorical data points with single metric", () => {
    const result = suggestChartType("string", 1, 5);
    expect(result).toBe("pie");
  });

  it("should suggest bar chart for categorical data with multiple points", () => {
    const result = suggestChartType("string", 1, 10);
    expect(result).toBe("bar");
  });

  it("should suggest line chart for date-based data with single metric", () => {
    const result = suggestChartType("date", 1, 12);
    expect(result).toBe("line");
  });

  it("should suggest area chart for date-based data with multiple metrics", () => {
    const result = suggestChartType("date", 3, 12);
    expect(result).toBe("area");
  });

  it("should suggest line chart for many data points", () => {
    const result = suggestChartType("string", 1, 20);
    expect(result).toBe("line");
  });

  it("should suggest area chart for many data points with multiple metrics", () => {
    const result = suggestChartType("string", 2, 15);
    expect(result).toBe("area");
  });

  it("should suggest bar chart for numeric x-axis with few points", () => {
    const result = suggestChartType("number", 1, 8);
    expect(result).toBe("bar");
  });
});

describe("getChartSuggestions", () => {
  it("should return an array of suggestions", () => {
    const suggestions = getChartSuggestions();
    expect(Array.isArray(suggestions)).toBe(true);
    expect(suggestions.length).toBeGreaterThan(0);
  });

  it("should have title, description, and prompt for each suggestion", () => {
    const suggestions = getChartSuggestions();
    for (const suggestion of suggestions) {
      expect(suggestion).toHaveProperty("title");
      expect(suggestion).toHaveProperty("description");
      expect(suggestion).toHaveProperty("prompt");
      expect(typeof suggestion.title).toBe("string");
      expect(typeof suggestion.description).toBe("string");
      expect(typeof suggestion.prompt).toBe("string");
    }
  });

  it("should include common chart suggestions", () => {
    const suggestions = getChartSuggestions();
    const titles = suggestions.map((s) => s.title);
    
    expect(titles).toContain("Vendas Mensais");
    expect(titles).toContain("Comparativo Financeiro");
  });
});

describe("AVAILABLE_DATA_SOURCES", () => {
  it("should have vendas data source", () => {
    const vendas = AVAILABLE_DATA_SOURCES.find((ds) => ds.name === "vendas");
    expect(vendas).toBeDefined();
    expect(vendas?.description).toContain("vendas");
  });

  it("should have compras data source", () => {
    const compras = AVAILABLE_DATA_SOURCES.find((ds) => ds.name === "compras");
    expect(compras).toBeDefined();
  });

  it("should have estoque data source", () => {
    const estoque = AVAILABLE_DATA_SOURCES.find((ds) => ds.name === "estoque");
    expect(estoque).toBeDefined();
  });

  it("should have financeiro data source", () => {
    const financeiro = AVAILABLE_DATA_SOURCES.find((ds) => ds.name === "financeiro");
    expect(financeiro).toBeDefined();
  });

  it("should have producao data source", () => {
    const producao = AVAILABLE_DATA_SOURCES.find((ds) => ds.name === "producao");
    expect(producao).toBeDefined();
  });

  it("should have fields with name and type for each data source", () => {
    for (const ds of AVAILABLE_DATA_SOURCES) {
      expect(ds.fields.length).toBeGreaterThan(0);
      for (const field of ds.fields) {
        expect(field).toHaveProperty("name");
        expect(field).toHaveProperty("type");
        expect(["string", "number", "date"]).toContain(field.type);
      }
    }
  });
});
