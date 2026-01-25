import { describe, it, expect } from "vitest";
import type { 
  EmailConfig, 
  EmailAttachment, 
  EmailMessage, 
  FetchResult 
} from "./imap-client";

describe("IMAP Client Types", () => {
  describe("EmailConfig interface", () => {
    it("should accept valid config with all fields", () => {
      const config: EmailConfig = {
        host: "imap.gmail.com",
        port: 993,
        user: "user@gmail.com",
        password: "app-password",
        tls: true,
        folder: "INBOX",
      };

      expect(config.host).toBe("imap.gmail.com");
      expect(config.port).toBe(993);
      expect(config.tls).toBe(true);
      expect(config.folder).toBe("INBOX");
    });

    it("should accept config without optional folder", () => {
      const config: EmailConfig = {
        host: "imap.gmail.com",
        port: 993,
        user: "user@gmail.com",
        password: "app-password",
        tls: true,
      };

      expect(config.folder).toBeUndefined();
    });

    it("should accept config with TLS disabled", () => {
      const config: EmailConfig = {
        host: "imap.local",
        port: 143,
        user: "user@local",
        password: "password",
        tls: false,
      };

      expect(config.tls).toBe(false);
      expect(config.port).toBe(143);
    });
  });

  describe("EmailAttachment interface", () => {
    it("should represent XML attachment correctly", () => {
      const attachment: EmailAttachment = {
        filename: "nfe_12345.xml",
        content: "<nfeProc><NFe></NFe></nfeProc>",
        contentType: "application/xml",
        size: 1024,
      };

      expect(attachment.filename).toBe("nfe_12345.xml");
      expect(attachment.contentType).toBe("application/xml");
      expect(attachment.size).toBe(1024);
    });

    it("should handle text/xml content type", () => {
      const attachment: EmailAttachment = {
        filename: "nota.xml",
        content: "<xml>content</xml>",
        contentType: "text/xml",
        size: 500,
      };

      expect(attachment.contentType).toBe("text/xml");
    });
  });

  describe("EmailMessage interface", () => {
    it("should represent email message correctly", () => {
      const message: EmailMessage = {
        uid: 123,
        messageId: "<abc123@mail.example.com>",
        from: "fornecedor@empresa.com",
        subject: "NFe - Nota Fiscal Eletrônica",
        date: new Date("2026-01-25"),
        attachments: [],
      };

      expect(message.uid).toBe(123);
      expect(message.from).toBe("fornecedor@empresa.com");
      expect(message.attachments).toHaveLength(0);
    });

    it("should include attachments", () => {
      const message: EmailMessage = {
        uid: 456,
        messageId: "<def456@mail.example.com>",
        from: "nfe@fornecedor.com",
        subject: "Envio de NFe",
        date: new Date("2026-01-25"),
        attachments: [
          {
            filename: "nfe.xml",
            content: "<nfeProc></nfeProc>",
            contentType: "application/xml",
            size: 2048,
          },
        ],
      };

      expect(message.attachments).toHaveLength(1);
      expect(message.attachments[0].filename).toBe("nfe.xml");
    });
  });

  describe("FetchResult interface", () => {
    it("should represent successful result", () => {
      const result: FetchResult = {
        success: true,
        messages: [],
        xmlFiles: [],
        errors: [],
      };

      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should represent failed result with errors", () => {
      const result: FetchResult = {
        success: false,
        messages: [],
        xmlFiles: [],
        errors: ["Connection timeout", "Authentication failed"],
      };

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(2);
    });

    it("should include XML files", () => {
      const result: FetchResult = {
        success: true,
        messages: [],
        xmlFiles: [
          {
            filename: "nfe_001.xml",
            content: "<nfeProc></nfeProc>",
            fromEmail: "fornecedor@test.com",
            subject: "NFe 001",
            date: new Date("2026-01-25"),
          },
          {
            filename: "nfe_002.xml",
            content: "<nfeProc></nfeProc>",
            fromEmail: "outro@test.com",
            subject: "NFe 002",
            date: new Date("2026-01-25"),
          },
        ],
        errors: [],
      };

      expect(result.xmlFiles).toHaveLength(2);
      expect(result.xmlFiles[0].filename).toBe("nfe_001.xml");
      expect(result.xmlFiles[1].fromEmail).toBe("outro@test.com");
    });
  });
});
