import { describe, it, expect } from "vitest";
import {
  loadCertificate,
  signXml,
  validateSignature,
  getCertificateThumbprint,
} from "./xml-signer";

// Mock certificate and key for testing
const mockPrivateKey = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC7JHoJfg6yNzLM
MOCK_PRIVATE_KEY_DATA_HERE
-----END PRIVATE KEY-----`;

const mockCertificate = `-----BEGIN CERTIFICATE-----
MIIDXTCCAkWgAwIBAgIJAJC1HiIAZAiUMA0GCSqGSIb3Qa2xMjELMAkGA1UEBhMC
MOCK_CERTIFICATE_DATA_HERE
-----END CERTIFICATE-----`;

const mockXml = `<?xml version="1.0" encoding="UTF-8"?>
<NFe xmlns="http://www.portalfiscal.inf.br/nfe">
  <infNFe Id="NFe12345678901234567890123456789012345678901234" versao="4.00">
    <ide>
      <cUF>35</cUF>
      <cNF>12345678</cNF>
    </ide>
  </infNFe>
</NFe>`;

describe("XML Signer", () => {
  describe("loadCertificate", () => {
    it("should return error for invalid private key format", () => {
      const result = loadCertificate("invalid-key", mockCertificate);

      expect("error" in result).toBe(true);
      if ("error" in result) {
        expect(result.error).toContain("Chave privada");
      }
    });

    it("should return error for invalid certificate format", () => {
      const result = loadCertificate(mockPrivateKey, "invalid-cert");

      expect("error" in result).toBe(true);
      if ("error" in result) {
        expect(result.error).toContain("Certificado");
      }
    });

    it("should load valid certificate and key", () => {
      const result = loadCertificate(mockPrivateKey, mockCertificate);

      expect("error" in result).toBe(false);
      if (!("error" in result)) {
        expect(result.privateKey).toBe(mockPrivateKey);
        expect(result.certificate).toBe(mockCertificate);
        expect(result.info).toBeDefined();
        expect(result.info.thumbprint).toBeDefined();
      }
    });

    it("should extract certificate info", () => {
      const result = loadCertificate(mockPrivateKey, mockCertificate);

      if (!("error" in result)) {
        expect(result.info.subject).toBeDefined();
        expect(result.info.issuer).toBeDefined();
        expect(result.info.validFrom).toBeInstanceOf(Date);
        expect(result.info.validTo).toBeInstanceOf(Date);
        expect(result.info.serialNumber).toBeDefined();
      }
    });
  });

  describe("signXml", () => {
    it("should return error when tag is not found", () => {
      const xml = "<root><other>content</other></root>";
      const result = signXml(xml, mockPrivateKey, mockCertificate, "infNFe");

      expect(result.success).toBe(false);
      expect(result.error).toContain("não encontrada");
    });

    it("should return error when Id attribute is missing", () => {
      const xml = "<NFe><infNFe>content</infNFe></NFe>";
      const result = signXml(xml, mockPrivateKey, mockCertificate, "infNFe");

      expect(result.success).toBe(false);
      expect(result.error).toContain("Id não encontrado");
    });

    it("should return error with invalid private key", () => {
      const result = signXml(mockXml, "invalid-key", mockCertificate, "infNFe");

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("validateSignature", () => {
    it("should return error when Signature block is missing", () => {
      const xml = "<root><content>data</content></root>";
      const result = validateSignature(xml);

      expect(result.valid).toBe(false);
      expect(result.error).toContain("Signature não encontrado");
    });

    it("should return error when SignatureValue is missing", () => {
      const xml = `<root>
        <Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
          <SignedInfo></SignedInfo>
        </Signature>
      </root>`;
      const result = validateSignature(xml);

      expect(result.valid).toBe(false);
      expect(result.error).toContain("SignatureValue não encontrado");
    });

    it("should return error when X509Certificate is missing", () => {
      const xml = `<root>
        <Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
          <SignedInfo></SignedInfo>
          <SignatureValue>abc123</SignatureValue>
        </Signature>
      </root>`;
      const result = validateSignature(xml);

      expect(result.valid).toBe(false);
      expect(result.error).toContain("X509Certificate não encontrado");
    });

    it("should return error when DigestValue is missing", () => {
      const xml = `<root>
        <Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
          <SignedInfo></SignedInfo>
          <SignatureValue>abc123</SignatureValue>
          <KeyInfo>
            <X509Data>
              <X509Certificate>CERT_DATA</X509Certificate>
            </X509Data>
          </KeyInfo>
        </Signature>
      </root>`;
      const result = validateSignature(xml);

      expect(result.valid).toBe(false);
      expect(result.error).toContain("DigestValue não encontrado");
    });

    it("should return error when Reference URI is missing", () => {
      const xml = `<root>
        <Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
          <SignedInfo>
            <Reference>
              <DigestValue>abc123</DigestValue>
            </Reference>
          </SignedInfo>
          <SignatureValue>abc123</SignatureValue>
          <KeyInfo>
            <X509Data>
              <X509Certificate>CERT_DATA</X509Certificate>
            </X509Data>
          </KeyInfo>
        </Signature>
      </root>`;
      const result = validateSignature(xml);

      expect(result.valid).toBe(false);
      expect(result.error).toContain("Reference URI não encontrado");
    });

    it("should validate complete signature structure", () => {
      const xml = `<root>
        <Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
          <SignedInfo>
            <Reference URI="#NFe12345">
              <DigestValue>abc123</DigestValue>
            </Reference>
          </SignedInfo>
          <SignatureValue>signature_value_here</SignatureValue>
          <KeyInfo>
            <X509Data>
              <X509Certificate>CERT_DATA</X509Certificate>
            </X509Data>
          </KeyInfo>
        </Signature>
      </root>`;
      const result = validateSignature(xml);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });
  });

  describe("getCertificateThumbprint", () => {
    it("should generate thumbprint from certificate", () => {
      const thumbprint = getCertificateThumbprint(mockCertificate);

      expect(thumbprint).toBeDefined();
      expect(typeof thumbprint).toBe("string");
      expect(thumbprint.length).toBeGreaterThan(0);
    });

    it("should return uppercase hex string", () => {
      const thumbprint = getCertificateThumbprint(mockCertificate);

      expect(thumbprint).toMatch(/^[A-F0-9]+$/);
    });

    it("should return consistent thumbprint for same certificate", () => {
      const thumbprint1 = getCertificateThumbprint(mockCertificate);
      const thumbprint2 = getCertificateThumbprint(mockCertificate);

      expect(thumbprint1).toBe(thumbprint2);
    });
  });
});
