import { describe, it, expect } from "vitest";
import { detectNFeVersion, getNFeVersionInfo } from "./nfe-parser";

describe("NFe Version Detection", () => {
  describe("detectNFeVersion", () => {
    it("should detect version 4.00 from versao attribute", () => {
      const xml = `<?xml version="1.0"?><nfeProc versao="4.00"><NFe><infNFe versao="4.00"></infNFe></NFe></nfeProc>`;
      expect(detectNFeVersion(xml)).toBe("4.00");
    });

    it("should detect version 3.10 from versao attribute", () => {
      const xml = `<?xml version="1.0"?><nfeProc versao="3.10"><NFe><infNFe versao="3.10"></infNFe></NFe></nfeProc>`;
      expect(detectNFeVersion(xml)).toBe("3.10");
    });

    it("should detect version 2.00 from versao attribute", () => {
      const xml = `<?xml version="1.0"?><nfeProc versao="2.00"><NFe><infNFe versao="2.00"></infNFe></NFe></nfeProc>`;
      expect(detectNFeVersion(xml)).toBe("2.00");
    });

    it("should detect version 1.10 from versao attribute", () => {
      const xml = `<?xml version="1.0"?><nfeProc versao="1.10"><NFe><infNFe versao="1.10"></infNFe></NFe></nfeProc>`;
      expect(detectNFeVersion(xml)).toBe("1.10");
    });

    it("should detect version 4.00 from infRespTec element", () => {
      const xml = `<?xml version="1.0"?><NFe><infNFe><infRespTec></infRespTec></infNFe></NFe>`;
      expect(detectNFeVersion(xml)).toBe("4.00");
    });

    it("should detect version 4.00 from rastro element", () => {
      const xml = `<?xml version="1.0"?><NFe><infNFe><det><prod><rastro></rastro></prod></det></infNFe></NFe>`;
      expect(detectNFeVersion(xml)).toBe("4.00");
    });

    it("should detect version 4.00 from cBenef element", () => {
      const xml = `<?xml version="1.0"?><NFe><infNFe><det><imposto><ICMS><cBenef></cBenef></ICMS></imposto></det></infNFe></NFe>`;
      expect(detectNFeVersion(xml)).toBe("4.00");
    });

    it("should detect version 3.10 from GTIN element", () => {
      const xml = `<?xml version="1.0"?><NFe><infNFe><det><prod><GTIN></GTIN></prod></det></infNFe></NFe>`;
      expect(detectNFeVersion(xml)).toBe("3.10");
    });

    it("should detect version 3.10 from cEANTrib element", () => {
      const xml = `<?xml version="1.0"?><NFe><infNFe><det><prod><cEANTrib></cEANTrib></prod></det></infNFe></NFe>`;
      expect(detectNFeVersion(xml)).toBe("3.10");
    });

    it("should detect version 2.00 from infEvento element", () => {
      const xml = `<?xml version="1.0"?><NFe><infNFe></infNFe><infEvento></infEvento></NFe>`;
      expect(detectNFeVersion(xml)).toBe("2.00");
    });

    it("should default to 4.00 for unknown structure", () => {
      const xml = `<?xml version="1.0"?><NFe><infNFe></infNFe></NFe>`;
      expect(detectNFeVersion(xml)).toBe("4.00");
    });
  });

  describe("getNFeVersionInfo", () => {
    it("should return info for version 4.00", () => {
      const info = getNFeVersionInfo("4.00");
      expect(info.version).toBe("4.00");
      expect(info.vigencia).toBe("2019-atual");
      expect(info.isLegacy).toBe(false);
      expect(info.caracteristicas).toContain("Responsável técnico");
    });

    it("should return info for version 3.10", () => {
      const info = getNFeVersionInfo("3.10");
      expect(info.version).toBe("3.10");
      expect(info.vigencia).toBe("2014-2019");
      expect(info.isLegacy).toBe(true);
      expect(info.caracteristicas).toContain("GTIN");
    });

    it("should return info for version 2.00", () => {
      const info = getNFeVersionInfo("2.00");
      expect(info.version).toBe("2.00");
      expect(info.vigencia).toBe("2010-2014");
      expect(info.isLegacy).toBe(true);
      expect(info.caracteristicas).toContain("Eventos");
    });

    it("should return info for version 1.10", () => {
      const info = getNFeVersionInfo("1.10");
      expect(info.version).toBe("1.10");
      expect(info.vigencia).toBe("2006-2010");
      expect(info.isLegacy).toBe(true);
      expect(info.caracteristicas).toContain("Estrutura inicial");
    });

    it("should default to 4.00 for unknown version", () => {
      const info = getNFeVersionInfo("9.99");
      expect(info.version).toBe("4.00");
      expect(info.isLegacy).toBe(false);
    });
  });
});
