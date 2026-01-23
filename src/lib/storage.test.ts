import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock do cliente Supabase
const mockUpload = vi.fn();
const mockRemove = vi.fn();
const mockList = vi.fn();
const mockGetPublicUrl = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    storage: {
      from: () => ({
        upload: mockUpload,
        remove: mockRemove,
        list: mockList,
        getPublicUrl: mockGetPublicUrl,
      }),
    },
  }),
}));

import {
  STORAGE_BUCKET,
  STORAGE_PATHS,
  uploadImage,
  deleteImage,
  listFiles,
  getPublicUrl,
} from "./storage";

describe("Storage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPublicUrl.mockReturnValue({
      data: { publicUrl: "https://example.com/test.jpg" },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Constants", () => {
    it("deve exportar STORAGE_BUCKET", () => {
      expect(STORAGE_BUCKET).toBe("assets");
    });

    it("deve exportar STORAGE_PATHS", () => {
      expect(STORAGE_PATHS.landing.hero).toBe("landing/hero");
      expect(STORAGE_PATHS.landing.features).toBe("landing/features");
      expect(STORAGE_PATHS.logos).toBe("logos");
      expect(STORAGE_PATHS.general).toBe("general");
    });
  });

  describe("uploadImage", () => {
    it("deve rejeitar tipo de arquivo não permitido", async () => {
      const file = new File(["content"], "test.pdf", { type: "application/pdf" });
      
      const result = await uploadImage(file, "logos");
      
      expect(result.success).toBe(false);
      expect(result.error).toContain("Tipo de arquivo não permitido");
    });

    it("deve rejeitar arquivo muito grande", async () => {
      const largeContent = new Array(6 * 1024 * 1024).fill("a").join("");
      const file = new File([largeContent], "large.jpg", { type: "image/jpeg" });
      
      const result = await uploadImage(file, "logos");
      
      expect(result.success).toBe(false);
      expect(result.error).toContain("Arquivo muito grande");
    });

    it("deve fazer upload de imagem válida", async () => {
      mockUpload.mockResolvedValue({ error: null });
      const file = new File(["content"], "test.jpg", { type: "image/jpeg" });
      
      const result = await uploadImage(file, "logos");
      
      expect(result.success).toBe(true);
      expect(result.url).toBe("https://example.com/test.jpg");
      expect(mockUpload).toHaveBeenCalled();
    });

    it("deve aceitar PNG", async () => {
      mockUpload.mockResolvedValue({ error: null });
      const file = new File(["content"], "test.png", { type: "image/png" });
      
      const result = await uploadImage(file, "logos");
      
      expect(result.success).toBe(true);
    });

    it("deve aceitar WebP", async () => {
      mockUpload.mockResolvedValue({ error: null });
      const file = new File(["content"], "test.webp", { type: "image/webp" });
      
      const result = await uploadImage(file, "logos");
      
      expect(result.success).toBe(true);
    });

    it("deve aceitar GIF", async () => {
      mockUpload.mockResolvedValue({ error: null });
      const file = new File(["content"], "test.gif", { type: "image/gif" });
      
      const result = await uploadImage(file, "logos");
      
      expect(result.success).toBe(true);
    });

    it("deve aceitar SVG", async () => {
      mockUpload.mockResolvedValue({ error: null });
      const file = new File(["<svg></svg>"], "test.svg", { type: "image/svg+xml" });
      
      const result = await uploadImage(file, "logos");
      
      expect(result.success).toBe(true);
    });

    it("deve usar nome de arquivo customizado", async () => {
      mockUpload.mockResolvedValue({ error: null });
      const file = new File(["content"], "original.jpg", { type: "image/jpeg" });
      
      await uploadImage(file, "logos", "custom-name.jpg");
      
      expect(mockUpload).toHaveBeenCalledWith(
        "logos/custom-name.jpg",
        file,
        expect.any(Object)
      );
    });

    it("deve retornar erro quando upload falha", async () => {
      mockUpload.mockResolvedValue({ error: { message: "Upload failed" } });
      const file = new File(["content"], "test.jpg", { type: "image/jpeg" });
      
      const result = await uploadImage(file, "logos");
      
      expect(result.success).toBe(false);
      expect(result.error).toBe("Upload failed");
    });
  });

  describe("deleteImage", () => {
    it("deve deletar imagem com sucesso", async () => {
      mockRemove.mockResolvedValue({ error: null });
      
      const result = await deleteImage("logos/test.jpg");
      
      expect(result.success).toBe(true);
      expect(mockRemove).toHaveBeenCalledWith(["logos/test.jpg"]);
    });

    it("deve retornar erro quando delete falha", async () => {
      mockRemove.mockResolvedValue({ error: { message: "Delete failed" } });
      
      const result = await deleteImage("logos/test.jpg");
      
      expect(result.success).toBe(false);
      expect(result.error).toBe("Delete failed");
    });
  });

  describe("listFiles", () => {
    it("deve listar arquivos com sucesso", async () => {
      mockList.mockResolvedValue({
        data: [
          { name: "file1.jpg" },
          { name: "file2.png" },
        ],
        error: null,
      });
      
      const result = await listFiles("logos");
      
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("file1.jpg");
      expect(result[0].url).toBe("https://example.com/test.jpg");
    });

    it("deve filtrar placeholder de pasta vazia", async () => {
      mockList.mockResolvedValue({
        data: [
          { name: ".emptyFolderPlaceholder" },
          { name: "file1.jpg" },
        ],
        error: null,
      });
      
      const result = await listFiles("logos");
      
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("file1.jpg");
    });

    it("deve retornar array vazio quando erro", async () => {
      mockList.mockResolvedValue({
        data: null,
        error: { message: "List failed" },
      });
      
      const result = await listFiles("logos");
      
      expect(result).toEqual([]);
    });

    it("deve retornar array vazio quando data é null", async () => {
      mockList.mockResolvedValue({
        data: null,
        error: null,
      });
      
      const result = await listFiles("logos");
      
      expect(result).toEqual([]);
    });
  });

  describe("getPublicUrl", () => {
    it("deve retornar URL pública", () => {
      const url = getPublicUrl("logos/test.jpg");
      
      expect(url).toBe("https://example.com/test.jpg");
      expect(mockGetPublicUrl).toHaveBeenCalledWith("logos/test.jpg");
    });
  });
});
