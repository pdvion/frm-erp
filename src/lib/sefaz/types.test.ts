import { describe, it, expect } from "vitest";
import { 
  UF_CODES, 
  SEFAZ_URLS,
  type SefazEnvironment,
  type UF,
  type CertificateConfig,
  type SefazConfig,
  type ManifestacaoTipo,
  type SituacaoNFe,
  type NFeResumo,
  type NFeCompleta,
  type ConsultaNFeResult,
  type DownloadNFeResult,
  type ManifestacaoResult,
} from "./types";

describe("SEFAZ Types", () => {
  describe("UF_CODES", () => {
    it("should have all 27 Brazilian states", () => {
      expect(Object.keys(UF_CODES)).toHaveLength(27);
    });

    it("should have correct code for SP", () => {
      expect(UF_CODES.SP).toBe(35);
    });

    it("should have correct code for RJ", () => {
      expect(UF_CODES.RJ).toBe(33);
    });

    it("should have correct code for MG", () => {
      expect(UF_CODES.MG).toBe(31);
    });

    it("should have correct code for RS", () => {
      expect(UF_CODES.RS).toBe(43);
    });

    it("should have correct code for PR", () => {
      expect(UF_CODES.PR).toBe(41);
    });

    it("should have correct code for BA", () => {
      expect(UF_CODES.BA).toBe(29);
    });

    it("should have correct code for DF", () => {
      expect(UF_CODES.DF).toBe(53);
    });
  });

  describe("SEFAZ_URLS", () => {
    it("should have homologacao environment", () => {
      expect(SEFAZ_URLS.homologacao).toBeDefined();
    });

    it("should have producao environment", () => {
      expect(SEFAZ_URLS.producao).toBeDefined();
    });

    it("should have consultaNFeDest URL for homologacao", () => {
      expect(SEFAZ_URLS.homologacao.consultaNFeDest).toContain("hom.nfe.fazenda.gov.br");
    });

    it("should have consultaNFeDest URL for producao", () => {
      expect(SEFAZ_URLS.producao.consultaNFeDest).toContain("www.nfe.fazenda.gov.br");
    });

    it("should have recepcaoEvento URL for homologacao", () => {
      expect(SEFAZ_URLS.homologacao.recepcaoEvento).toContain("NFeRecepcaoEvento4");
    });

    it("should have consultaChave URL for producao", () => {
      expect(SEFAZ_URLS.producao.consultaChave).toContain("NFeConsultaProtocolo4");
    });
  });

  describe("SefazEnvironment type", () => {
    it("should accept homologacao", () => {
      const env: SefazEnvironment = "homologacao";
      expect(env).toBe("homologacao");
    });

    it("should accept producao", () => {
      const env: SefazEnvironment = "producao";
      expect(env).toBe("producao");
    });
  });

  describe("UF type", () => {
    it("should accept valid UF codes", () => {
      const ufs: UF[] = ["SP", "RJ", "MG", "RS", "PR", "BA", "SC", "GO", "PE", "CE"];
      expect(ufs).toHaveLength(10);
    });
  });

  describe("CertificateConfig interface", () => {
    it("should accept config with pfxPath", () => {
      const config: CertificateConfig = {
        pfxPath: "/path/to/certificate.pfx",
        password: "senha123",
      };
      expect(config.pfxPath).toBe("/path/to/certificate.pfx");
    });

    it("should accept config with pfxBase64", () => {
      const config: CertificateConfig = {
        pfxBase64: "base64encodedcertificate",
        password: "senha123",
      };
      expect(config.pfxBase64).toBe("base64encodedcertificate");
    });

    it("should require password", () => {
      const config: CertificateConfig = {
        password: "senha123",
      };
      expect(config.password).toBe("senha123");
    });
  });

  describe("SefazConfig interface", () => {
    it("should accept valid config", () => {
      const config: SefazConfig = {
        environment: "homologacao",
        uf: "SP",
        cnpj: "12345678000199",
        certificate: {
          password: "senha123",
        },
      };
      expect(config.environment).toBe("homologacao");
      expect(config.uf).toBe("SP");
    });
  });

  describe("ManifestacaoTipo type", () => {
    it("should accept CIENCIA", () => {
      const tipo: ManifestacaoTipo = "CIENCIA";
      expect(tipo).toBe("CIENCIA");
    });

    it("should accept CONFIRMACAO", () => {
      const tipo: ManifestacaoTipo = "CONFIRMACAO";
      expect(tipo).toBe("CONFIRMACAO");
    });

    it("should accept DESCONHECIMENTO", () => {
      const tipo: ManifestacaoTipo = "DESCONHECIMENTO";
      expect(tipo).toBe("DESCONHECIMENTO");
    });

    it("should accept NAO_REALIZADA", () => {
      const tipo: ManifestacaoTipo = "NAO_REALIZADA";
      expect(tipo).toBe("NAO_REALIZADA");
    });
  });

  describe("SituacaoNFe type", () => {
    it("should accept AUTORIZADA", () => {
      const situacao: SituacaoNFe = "AUTORIZADA";
      expect(situacao).toBe("AUTORIZADA");
    });

    it("should accept CANCELADA", () => {
      const situacao: SituacaoNFe = "CANCELADA";
      expect(situacao).toBe("CANCELADA");
    });

    it("should accept DENEGADA", () => {
      const situacao: SituacaoNFe = "DENEGADA";
      expect(situacao).toBe("DENEGADA");
    });
  });

  describe("NFeResumo interface", () => {
    it("should represent NFe summary", () => {
      const resumo: NFeResumo = {
        chaveAcesso: "35260112345678000199550010000001231123456789",
        cnpjEmitente: "12345678000199",
        nomeEmitente: "Fornecedor Teste LTDA",
        cnpjDestinatario: "98765432000110",
        valorNota: 1500.50,
        dataEmissao: new Date("2026-01-25"),
        situacao: "AUTORIZADA",
      };

      expect(resumo.chaveAcesso).toHaveLength(44);
      expect(resumo.valorNota).toBe(1500.50);
    });

    it("should include optional manifestacao fields", () => {
      const resumo: NFeResumo = {
        chaveAcesso: "35260112345678000199550010000001231123456789",
        cnpjEmitente: "12345678000199",
        nomeEmitente: "Fornecedor Teste LTDA",
        cnpjDestinatario: "98765432000110",
        valorNota: 1500.50,
        dataEmissao: new Date("2026-01-25"),
        situacao: "AUTORIZADA",
        manifestacao: "CIENCIA",
        dataManifestacao: new Date("2026-01-26"),
      };

      expect(resumo.manifestacao).toBe("CIENCIA");
      expect(resumo.dataManifestacao).toBeInstanceOf(Date);
    });
  });

  describe("NFeCompleta interface", () => {
    it("should extend NFeResumo with xml, numero, serie", () => {
      const nfe: NFeCompleta = {
        chaveAcesso: "35260112345678000199550010000001231123456789",
        cnpjEmitente: "12345678000199",
        nomeEmitente: "Fornecedor Teste LTDA",
        cnpjDestinatario: "98765432000110",
        valorNota: 1500.50,
        dataEmissao: new Date("2026-01-25"),
        situacao: "AUTORIZADA",
        xml: "<nfeProc><NFe></NFe></nfeProc>",
        numero: 123,
        serie: 1,
      };

      expect(nfe.xml).toContain("<nfeProc>");
      expect(nfe.numero).toBe(123);
      expect(nfe.serie).toBe(1);
    });
  });

  describe("ConsultaNFeResult interface", () => {
    it("should represent successful result", () => {
      const result: ConsultaNFeResult = {
        success: true,
        nfes: [],
        totalRegistros: 0,
        ultimaNSU: "000000000000001",
      };

      expect(result.success).toBe(true);
      expect(result.totalRegistros).toBe(0);
    });

    it("should represent failed result with message", () => {
      const result: ConsultaNFeResult = {
        success: false,
        message: "Erro de conexão",
        nfes: [],
        totalRegistros: 0,
      };

      expect(result.success).toBe(false);
      expect(result.message).toBe("Erro de conexão");
    });
  });

  describe("DownloadNFeResult interface", () => {
    it("should represent successful download", () => {
      const result: DownloadNFeResult = {
        success: true,
        nfe: {
          chaveAcesso: "35260112345678000199550010000001231123456789",
          cnpjEmitente: "12345678000199",
          nomeEmitente: "Fornecedor",
          cnpjDestinatario: "98765432000110",
          valorNota: 1000,
          dataEmissao: new Date(),
          situacao: "AUTORIZADA",
          xml: "<xml>",
          numero: 1,
          serie: 1,
        },
      };

      expect(result.success).toBe(true);
      expect(result.nfe).toBeDefined();
    });

    it("should represent failed download", () => {
      const result: DownloadNFeResult = {
        success: false,
        message: "NFe não encontrada",
      };

      expect(result.success).toBe(false);
      expect(result.nfe).toBeUndefined();
    });
  });

  describe("ManifestacaoResult interface", () => {
    it("should represent successful manifestation", () => {
      const result: ManifestacaoResult = {
        success: true,
        protocolo: "135260000000001",
        dataRecebimento: new Date("2026-01-25T10:30:00"),
      };

      expect(result.success).toBe(true);
      expect(result.protocolo).toBeDefined();
    });

    it("should represent failed manifestation", () => {
      const result: ManifestacaoResult = {
        success: false,
        message: "Prazo para manifestação expirado",
      };

      expect(result.success).toBe(false);
      expect(result.protocolo).toBeUndefined();
    });
  });
});
