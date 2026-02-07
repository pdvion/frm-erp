import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SemanticSearch } from "./SemanticSearch";

const mockGetStatusUseQuery = vi.fn();
const mockSearchUseQuery = vi.fn();

vi.mock("@/lib/trpc", () => ({
  trpc: {
    embeddings: {
      getStatus: { useQuery: (...args: unknown[]) => mockGetStatusUseQuery(...args) },
      search: { useQuery: (...args: unknown[]) => mockSearchUseQuery(...args) },
    },
  },
}));

vi.mock("@/hooks/useDebounce", () => ({
  useDebounce: (value: string) => value,
}));

function setupWithEmbeddings(searchResults: unknown[] | null = null) {
  mockGetStatusUseQuery.mockReturnValue({
    data: { entities: [{ entityType: "material", totalEntities: 100, totalEmbeddings: 80 }] },
  });
  mockSearchUseQuery.mockReturnValue({
    data: searchResults ? { results: searchResults, total: searchResults.length } : null,
    isFetching: false,
  });
}

function setupWithoutEmbeddings() {
  mockGetStatusUseQuery.mockReturnValue({
    data: { entities: [{ entityType: "material", totalEntities: 100, totalEmbeddings: 0 }] },
  });
  mockSearchUseQuery.mockReturnValue({ data: null, isFetching: false });
}

const RESULT_A = {
  entityId: "id-1", entityType: "material", similarity: 0.92, content: "Parafuso sextavado M10",
  entity: { code: "MAT-001", description: "Parafuso sextavado M10", unit: "UN" },
};
const RESULT_B = {
  entityId: "id-2", entityType: "material", similarity: 0.78, content: "Parafuso allen M8",
  entity: { code: "MAT-002", description: "Parafuso allen M8", unit: "UN" },
};

describe("SemanticSearch", () => {
  const mockOnSelect = vi.fn();
  const mockOnQueryChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders with IA placeholder when embeddings available", () => {
    setupWithEmbeddings();
    render(<SemanticSearch entityType="material" onSelect={mockOnSelect} placeholder="Buscar materiais..." />);
    expect(screen.getByRole("combobox")).toBeTruthy();
    expect(screen.getByPlaceholderText("Buscar materiais...")).toBeTruthy();
  });

  it("renders with text fallback placeholder when no embeddings", () => {
    setupWithoutEmbeddings();
    render(<SemanticSearch entityType="material" onSelect={mockOnSelect} />);
    expect(screen.getByPlaceholderText("Buscar por descrição ou código...")).toBeTruthy();
  });

  it("calls onQueryChange when typing", async () => {
    setupWithEmbeddings();
    render(<SemanticSearch entityType="material" onSelect={mockOnSelect} onQueryChange={mockOnQueryChange} />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "parafuso" } });
    await waitFor(() => { expect(mockOnQueryChange).toHaveBeenCalledWith("parafuso"); });
  });

  it("shows dropdown with results", async () => {
    setupWithEmbeddings([RESULT_A, RESULT_B]);
    render(<SemanticSearch entityType="material" onSelect={mockOnSelect} />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "parafuso" } });
    await waitFor(() => {
      expect(screen.getByText("MAT-001 — Parafuso sextavado M10")).toBeTruthy();
      expect(screen.getByText("MAT-002 — Parafuso allen M8")).toBeTruthy();
    });
  });

  it("calls onSelect when clicking a result", async () => {
    setupWithEmbeddings([RESULT_A]);
    render(<SemanticSearch entityType="material" onSelect={mockOnSelect} />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "parafuso" } });
    await waitFor(() => { expect(screen.getByText("MAT-001 — Parafuso sextavado M10")).toBeTruthy(); });
    fireEvent.click(screen.getByText("MAT-001 — Parafuso sextavado M10"));
    expect(mockOnSelect).toHaveBeenCalledWith({ id: "id-1", description: "MAT-001 — Parafuso sextavado M10", score: 0.92 });
  });

  it("shows score percentage", async () => {
    setupWithEmbeddings([RESULT_A]);
    render(<SemanticSearch entityType="material" onSelect={mockOnSelect} />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "parafuso" } });
    await waitFor(() => { expect(screen.getByText("92%")).toBeTruthy(); });
  });

  it("supports keyboard navigation (ArrowDown + Enter)", async () => {
    setupWithEmbeddings([
      { entityId: "id-1", entityType: "material", similarity: 0.9, content: "A", entity: { code: "A", description: "Item A" } },
      { entityId: "id-2", entityType: "material", similarity: 0.8, content: "B", entity: { code: "B", description: "Item B" } },
    ]);
    render(<SemanticSearch entityType="material" onSelect={mockOnSelect} />);
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "test" } });
    await waitFor(() => { expect(screen.getByText("A — Item A")).toBeTruthy(); });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(mockOnSelect).toHaveBeenCalledWith({ id: "id-1", description: "A — Item A", score: 0.9 });
  });

  it("closes dropdown on Escape", async () => {
    setupWithEmbeddings([
      { entityId: "id-1", entityType: "material", similarity: 0.9, content: "A", entity: { code: "A", description: "Item A" } },
    ]);
    render(<SemanticSearch entityType="material" onSelect={mockOnSelect} />);
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "test" } });
    await waitFor(() => { expect(screen.getByText("A — Item A")).toBeTruthy(); });
    fireEvent.keyDown(input, { key: "Escape" });
    await waitFor(() => { expect(screen.queryByText("A — Item A")).toBeNull(); });
  });

  it("shows IA badge in footer of results", async () => {
    setupWithEmbeddings([RESULT_A]);
    render(<SemanticSearch entityType="material" onSelect={mockOnSelect} />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "test" } });
    await waitFor(() => { expect(screen.getByText("Busca semântica por IA")).toBeTruthy(); });
  });
});
