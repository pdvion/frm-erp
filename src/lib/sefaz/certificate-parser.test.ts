import { describe, it, expect, vi } from "vitest";

// Mock node-forge
vi.mock("node-forge", () => ({
  default: {
    asn1: {
      fromDer: vi.fn().mockReturnValue({}),
      toDer: vi.fn().mockReturnValue({ getBytes: () => "mock-bytes" }),
    },
    pkcs12: {
      pkcs12FromAsn1: vi.fn().mockReturnValue({
        getBags: vi.fn().mockImplementation(({ bagType }) => {
          if (bagType === "1.2.840.113549.1.12.10.1.3") {
            return {
              "1.2.840.113549.1.12.10.1.3": [
                {
                  cert: {
                    subject: {
                      attributes: [
                        { shortName: "CN", value: "EMPRESA TESTE:12345678000199" },
                        { shortName: "OU", value: "Certificado Digital" },
                      ],
                    },
                    issuer: {
                      attributes: [
                        { shortName: "CN", value: "AC Teste" },
                      ],
                    },
                    validity: {
                      notBefore: new Date("2025-01-01"),
                      notAfter: new Date("2027-01-01"),
                    },
                    serialNumber: "123456789",
                  },
                },
              ],
            };
          }
          if (bagType === "1.2.840.113549.1.12.10.1.2") {
            return {
              "1.2.840.113549.1.12.10.1.2": [{ key: {} }],
            };
          }
          return {};
        }),
      }),
    },
    pki: {
      oids: {
        certBag: "1.2.840.113549.1.12.10.1.3",
        pkcs8ShroudedKeyBag: "1.2.840.113549.1.12.10.1.2",
      },
      certificateToPem: vi.fn().mockReturnValue("-----BEGIN CERTIFICATE-----\nMOCK\n-----END CERTIFICATE-----"),
      privateKeyToPem: vi.fn().mockReturnValue("-----BEGIN PRIVATE KEY-----\nMOCK\n-----END PRIVATE KEY-----"),
      certificateToAsn1: vi.fn().mockReturnValue({}),
      certificateFromPem: vi.fn().mockReturnValue({
        subject: {
          attributes: [
            { shortName: "CN", value: "EMPRESA TESTE:12345678000199" },
          ],
        },
        issuer: {
          attributes: [
            { shortName: "CN", value: "AC Teste" },
          ],
        },
        validity: {
          notBefore: new Date("2025-01-01"),
          notAfter: new Date("2027-01-01"),
        },
        serialNumber: "123456789",
      }),
    },
    md: {
      sha1: {
        create: vi.fn().mockReturnValue({
          update: vi.fn(),
          digest: vi.fn().mockReturnValue({ toHex: () => "abc123def456" }),
        }),
      },
    },
  },
}));

import {
  parsePfxCertificate,
  validateCertificate,
  getCertificateInfo,
} from "./certificate-parser";

describe("Certificate Parser", () => {
  describe("parsePfxCertificate", () => {
    it("should parse a valid PFX certificate", () => {
      const pfxBuffer = Buffer.from("mock-pfx-data");
      const result = parsePfxCertificate(pfxBuffer, "password123");

      expect(result.success).toBe(true);
      expect(result.certificate).toBeDefined();
      expect(result.certificate?.cnpj).toBe("12345678000199");
      expect(result.certificate?.commonName).toBe("EMPRESA TESTE:12345678000199");
    });

    it("should extract CNPJ from CN field", () => {
      const pfxBuffer = Buffer.from("mock-pfx-data");
      const result = parsePfxCertificate(pfxBuffer, "password123");

      expect(result.certificate?.cnpj).toBe("12345678000199");
    });

    it("should return certificate and private key in PEM format", () => {
      const pfxBuffer = Buffer.from("mock-pfx-data");
      const result = parsePfxCertificate(pfxBuffer, "password123");

      expect(result.certificate?.certificate).toContain("BEGIN CERTIFICATE");
      expect(result.certificate?.privateKey).toContain("BEGIN PRIVATE KEY");
    });

    it("should calculate validity information", () => {
      const pfxBuffer = Buffer.from("mock-pfx-data");
      const result = parsePfxCertificate(pfxBuffer, "password123");

      expect(result.certificate?.validFrom).toBeInstanceOf(Date);
      expect(result.certificate?.validTo).toBeInstanceOf(Date);
      expect(result.certificate?.isValid).toBe(true);
      expect(result.certificate?.daysToExpire).toBeGreaterThan(0);
    });

    it("should return issuer information", () => {
      const pfxBuffer = Buffer.from("mock-pfx-data");
      const result = parsePfxCertificate(pfxBuffer, "password123");

      expect(result.certificate?.issuer).toBe("AC Teste");
    });

    it("should calculate thumbprint", () => {
      const pfxBuffer = Buffer.from("mock-pfx-data");
      const result = parsePfxCertificate(pfxBuffer, "password123");

      expect(result.certificate?.thumbprint).toBeDefined();
      expect(result.certificate?.thumbprint.length).toBeGreaterThan(0);
    });
  });

  describe("validateCertificate", () => {
    it("should validate a valid certificate", () => {
      const certPem = "-----BEGIN CERTIFICATE-----\nMOCK\n-----END CERTIFICATE-----";
      const result = validateCertificate(certPem);

      expect(result.valid).toBe(true);
      expect(result.daysToExpire).toBeGreaterThan(0);
      expect(result.error).toBeUndefined();
    });

    it("should return days to expire", () => {
      const certPem = "-----BEGIN CERTIFICATE-----\nMOCK\n-----END CERTIFICATE-----";
      const result = validateCertificate(certPem);

      expect(typeof result.daysToExpire).toBe("number");
    });
  });

  describe("getCertificateInfo", () => {
    it("should extract certificate info from PEM", () => {
      const certPem = "-----BEGIN CERTIFICATE-----\nMOCK\n-----END CERTIFICATE-----";
      const result = getCertificateInfo(certPem);

      expect(result).not.toBeNull();
      expect(result?.commonName).toBe("EMPRESA TESTE:12345678000199");
      expect(result?.issuer).toBe("AC Teste");
      expect(result?.cnpj).toBe("12345678000199");
    });

    it("should return validity information", () => {
      const certPem = "-----BEGIN CERTIFICATE-----\nMOCK\n-----END CERTIFICATE-----";
      const result = getCertificateInfo(certPem);

      expect(result?.validFrom).toBeInstanceOf(Date);
      expect(result?.validTo).toBeInstanceOf(Date);
      expect(result?.isValid).toBe(true);
    });

    it("should return serial number", () => {
      const certPem = "-----BEGIN CERTIFICATE-----\nMOCK\n-----END CERTIFICATE-----";
      const result = getCertificateInfo(certPem);

      expect(result?.serialNumber).toBe("123456789");
    });
  });
});
