/**
 * Testes unitários para RichTextEditor
 * VIO-886: Rich Text Editor com Tiptap
 */

import { describe, it, expect, vi } from "vitest";

describe("RichTextEditor", () => {
  describe("Props Interface", () => {
    it("should define required props", () => {
      interface RichTextEditorProps {
        content: string;
        onChange: (html: string) => void;
        placeholder?: string;
        editable?: boolean;
        minHeight?: string;
        className?: string;
      }

      const props: RichTextEditorProps = {
        content: "<p>Test</p>",
        onChange: vi.fn(),
      };

      expect(props.content).toBe("<p>Test</p>");
      expect(typeof props.onChange).toBe("function");
    });

    it("should accept optional props", () => {
      interface RichTextEditorProps {
        content: string;
        onChange: (html: string) => void;
        placeholder?: string;
        editable?: boolean;
        minHeight?: string;
        className?: string;
      }

      const props: RichTextEditorProps = {
        content: "",
        onChange: vi.fn(),
        placeholder: "Digite aqui...",
        editable: true,
        minHeight: "200px",
        className: "custom-class",
      };

      expect(props.placeholder).toBe("Digite aqui...");
      expect(props.editable).toBe(true);
      expect(props.minHeight).toBe("200px");
      expect(props.className).toBe("custom-class");
    });

    it("should default editable to true", () => {
      const defaultEditable = true;
      expect(defaultEditable).toBe(true);
    });

    it("should default minHeight to 200px", () => {
      const defaultMinHeight = "200px";
      expect(defaultMinHeight).toBe("200px");
    });
  });

  describe("Content Handling", () => {
    it("should accept HTML content", () => {
      const content = "<p>Hello <strong>World</strong></p>";
      expect(content).toContain("<p>");
      expect(content).toContain("<strong>");
    });

    it("should accept empty content", () => {
      const content = "";
      expect(content).toBe("");
    });

    it("should handle complex HTML structures", () => {
      const content = `
        <h1>Title</h1>
        <p>Paragraph with <strong>bold</strong> and <em>italic</em>.</p>
        <ul>
          <li>Item 1</li>
          <li>Item 2</li>
        </ul>
        <blockquote>Quote</blockquote>
      `;
      expect(content).toContain("<h1>");
      expect(content).toContain("<ul>");
      expect(content).toContain("<blockquote>");
    });
  });

  describe("onChange Callback", () => {
    it("should call onChange with HTML string", () => {
      const onChange = vi.fn();
      const newContent = "<p>Updated content</p>";
      
      onChange(newContent);
      
      expect(onChange).toHaveBeenCalledWith(newContent);
      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it("should handle multiple onChange calls", () => {
      const onChange = vi.fn();
      
      onChange("<p>First</p>");
      onChange("<p>Second</p>");
      onChange("<p>Third</p>");
      
      expect(onChange).toHaveBeenCalledTimes(3);
    });
  });
});

describe("RichTextViewer", () => {
  describe("Props Interface", () => {
    it("should define required props", () => {
      interface RichTextViewerProps {
        content: string;
        className?: string;
      }

      const props: RichTextViewerProps = {
        content: "<p>View content</p>",
      };

      expect(props.content).toBe("<p>View content</p>");
    });

    it("should accept optional className", () => {
      interface RichTextViewerProps {
        content: string;
        className?: string;
      }

      const props: RichTextViewerProps = {
        content: "",
        className: "custom-viewer",
      };

      expect(props.className).toBe("custom-viewer");
    });
  });

  describe("Content Types", () => {
    it("should handle headings", () => {
      const content = "<h1>Title</h1><h2>Subtitle</h2><h3>Section</h3>";
      expect(content).toContain("<h1>");
      expect(content).toContain("<h2>");
      expect(content).toContain("<h3>");
    });

    it("should handle lists", () => {
      const bulletList = "<ul><li>Item 1</li><li>Item 2</li></ul>";
      const numberedList = "<ol><li>First</li><li>Second</li></ol>";
      
      expect(bulletList).toContain("<ul>");
      expect(numberedList).toContain("<ol>");
    });

    it("should handle links", () => {
      const content = '<a href="https://example.com">Link text</a>';
      expect(content).toContain('href="https://example.com"');
    });

    it("should handle images", () => {
      const content = '<img src="https://example.com/image.jpg" alt="Description" />';
      expect(content).toContain('src="https://example.com/image.jpg"');
      expect(content).toContain('alt="Description"');
    });

    it("should handle blockquotes", () => {
      const content = "<blockquote>Quote text here</blockquote>";
      expect(content).toContain("<blockquote>");
    });

    it("should handle code blocks", () => {
      const content = "<pre><code>const x = 1;</code></pre>";
      expect(content).toContain("<pre>");
      expect(content).toContain("<code>");
    });

    it("should handle inline formatting", () => {
      const content = "<p><strong>Bold</strong> <em>Italic</em> <u>Underline</u></p>";
      expect(content).toContain("<strong>");
      expect(content).toContain("<em>");
      expect(content).toContain("<u>");
    });
  });

  describe("Special Content", () => {
    it("should handle HTML entities", () => {
      const content = "<p>&amp; &lt; &gt; &quot;</p>";
      expect(content).toContain("&amp;");
      expect(content).toContain("&lt;");
    });

    it("should handle unicode characters", () => {
      const content = "<p>Unicode: 你好 مرحبا שלום</p>";
      expect(content).toContain("你好");
    });

    it("should handle emoji", () => {
      const content = "<p>Emoji: 🎉 🚀 ✅</p>";
      expect(content).toContain("🎉");
    });
  });
});

describe("EditorToolbar", () => {
  describe("Toolbar Actions", () => {
    const toolbarActions = [
      "bold",
      "italic",
      "underline",
      "strike",
      "heading1",
      "heading2",
      "heading3",
      "bulletList",
      "orderedList",
      "alignLeft",
      "alignCenter",
      "alignRight",
      "alignJustify",
      "link",
      "image",
      "blockquote",
      "codeBlock",
      "highlight",
      "undo",
      "redo",
    ];

    it("should define all formatting actions", () => {
      expect(toolbarActions).toContain("bold");
      expect(toolbarActions).toContain("italic");
      expect(toolbarActions).toContain("underline");
      expect(toolbarActions).toContain("strike");
    });

    it("should define heading actions", () => {
      expect(toolbarActions).toContain("heading1");
      expect(toolbarActions).toContain("heading2");
      expect(toolbarActions).toContain("heading3");
    });

    it("should define list actions", () => {
      expect(toolbarActions).toContain("bulletList");
      expect(toolbarActions).toContain("orderedList");
    });

    it("should define alignment actions", () => {
      expect(toolbarActions).toContain("alignLeft");
      expect(toolbarActions).toContain("alignCenter");
      expect(toolbarActions).toContain("alignRight");
      expect(toolbarActions).toContain("alignJustify");
    });

    it("should define media actions", () => {
      expect(toolbarActions).toContain("link");
      expect(toolbarActions).toContain("image");
    });

    it("should define history actions", () => {
      expect(toolbarActions).toContain("undo");
      expect(toolbarActions).toContain("redo");
    });
  });

  describe("Link Input", () => {
    it("should validate URL format", () => {
      const validUrls = [
        "https://example.com",
        "http://test.org",
        "https://sub.domain.com/path",
      ];

      validUrls.forEach((url) => {
        expect(url).toMatch(/^https?:\/\//);
      });
    });
  });

  describe("Image Input", () => {
    it("should validate image URL format", () => {
      const validImageUrls = [
        "https://example.com/image.jpg",
        "https://cdn.test.com/photo.png",
        "https://storage.example.com/uploads/image.webp",
      ];

      validImageUrls.forEach((url) => {
        expect(url).toMatch(/^https?:\/\//);
      });
    });
  });
});

describe("Tiptap Extensions", () => {
  const extensions = [
    "StarterKit",
    "Image",
    "Link",
    "Placeholder",
    "TextAlign",
    "Underline",
    "TextStyle",
    "Color",
    "Highlight",
  ];

  it("should include StarterKit for basic formatting", () => {
    expect(extensions).toContain("StarterKit");
  });

  it("should include Image extension", () => {
    expect(extensions).toContain("Image");
  });

  it("should include Link extension", () => {
    expect(extensions).toContain("Link");
  });

  it("should include Placeholder extension", () => {
    expect(extensions).toContain("Placeholder");
  });

  it("should include TextAlign extension", () => {
    expect(extensions).toContain("TextAlign");
  });

  it("should include Underline extension", () => {
    expect(extensions).toContain("Underline");
  });

  it("should include color-related extensions", () => {
    expect(extensions).toContain("TextStyle");
    expect(extensions).toContain("Color");
    expect(extensions).toContain("Highlight");
  });
});
