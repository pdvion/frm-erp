/**
 * Parser de Certificados Digitais A1 (PFX/P12)
 * 
 * Extrai certificado e chave privada de arquivos PFX para uso
 * na assinatura de XMLs para SEFAZ (NFe, CTe, etc.)
 */

import forge from "node-forge";

export interface CertificateInfo {
  /** Certificado em formato PEM */
  certificate: string;
  /** Chave privada em formato PEM */
  privateKey: string;
  /** CNPJ extraído do certificado */
  cnpj: string | null;
  /** Nome do titular (Common Name) */
  commonName: string;
  /** Data de validade inicial */
  validFrom: Date;
  /** Data de validade final */
  validTo: Date;
  /** Emissor do certificado */
  issuer: string;
  /** Serial number */
  serialNumber: string;
  /** Thumbprint (SHA-1 do certificado DER) */
  thumbprint: string;
  /** Se o certificado está válido (não expirado) */
  isValid: boolean;
  /** Dias até expirar */
  daysToExpire: number;
}

export interface ParseResult {
  success: boolean;
  certificate?: CertificateInfo;
  error?: string;
}

/**
 * Extrai CNPJ do campo Subject do certificado
 * O CNPJ pode estar em diferentes formatos:
 * - CN=EMPRESA:12345678000199
 * - OU=12345678000199
 * - serialNumber=12345678000199
 */
function extractCnpjFromSubject(subject: forge.pki.CertificateField[]): string | null {
  // Buscar no Common Name (CN)
  const cn = subject.find(attr => attr.shortName === "CN");
  if (cn && typeof cn.value === "string") {
    // Formato: "NOME DA EMPRESA:12345678000199"
    const match = cn.value.match(/:(\d{14})$/);
    if (match) return match[1];
    
    // Formato: apenas CNPJ no CN
    const cnpjMatch = cn.value.match(/^(\d{14})$/);
    if (cnpjMatch) return cnpjMatch[1];
  }

  // Buscar no serialNumber
  const serialNumber = subject.find(attr => attr.shortName === "serialNumber");
  if (serialNumber && typeof serialNumber.value === "string") {
    const match = serialNumber.value.match(/(\d{14})/);
    if (match) return match[1];
  }

  // Buscar na OU (Organizational Unit)
  const ou = subject.find(attr => attr.shortName === "OU");
  if (ou && typeof ou.value === "string") {
    const match = ou.value.match(/(\d{14})/);
    if (match) return match[1];
  }

  return null;
}

/**
 * Calcula o thumbprint (SHA-1) do certificado
 */
function calculateThumbprint(cert: forge.pki.Certificate): string {
  const der = forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes();
  const md = forge.md.sha1.create();
  md.update(der);
  return md.digest().toHex().toUpperCase();
}

/**
 * Parseia um arquivo PFX/P12 e extrai certificado e chave privada
 * 
 * @param pfxBuffer - Buffer do arquivo PFX
 * @param password - Senha do certificado
 * @returns Resultado do parsing com certificado e chave
 */
export function parsePfxCertificate(
  pfxBuffer: Buffer | ArrayBuffer,
  password: string
): ParseResult {
  try {
    // Converter para formato que o forge aceita
    const pfxBytes = Buffer.isBuffer(pfxBuffer) 
      ? pfxBuffer.toString("binary")
      : Buffer.from(pfxBuffer).toString("binary");

    // Decodificar o PFX
    const p12Asn1 = forge.asn1.fromDer(pfxBytes);
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password);

    // Extrair certificados
    const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
    const certBag = certBags[forge.pki.oids.certBag];
    
    if (!certBag || certBag.length === 0) {
      return { success: false, error: "Nenhum certificado encontrado no arquivo PFX" };
    }

    // Pegar o primeiro certificado (geralmente o do usuário)
    const cert = certBag[0].cert;
    if (!cert) {
      return { success: false, error: "Certificado inválido no arquivo PFX" };
    }

    // Extrair chave privada
    const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
    const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag];
    
    if (!keyBag || keyBag.length === 0) {
      return { success: false, error: "Nenhuma chave privada encontrada no arquivo PFX" };
    }

    const privateKey = keyBag[0].key;
    if (!privateKey) {
      return { success: false, error: "Chave privada inválida no arquivo PFX" };
    }

    // Converter para PEM
    const certificatePem = forge.pki.certificateToPem(cert);
    const privateKeyPem = forge.pki.privateKeyToPem(privateKey);

    // Extrair informações do certificado
    const subject = cert.subject.attributes;
    const issuer = cert.issuer.attributes;
    
    const commonName = subject.find(attr => attr.shortName === "CN")?.value as string || "Desconhecido";
    const issuerName = issuer.find(attr => attr.shortName === "CN")?.value as string || "Desconhecido";
    
    const validFrom = cert.validity.notBefore;
    const validTo = cert.validity.notAfter;
    const now = new Date();
    
    const isValid = now >= validFrom && now <= validTo;
    const daysToExpire = Math.ceil((validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    const cnpj = extractCnpjFromSubject(subject);
    const thumbprint = calculateThumbprint(cert);
    const serialNumber = cert.serialNumber;

    return {
      success: true,
      certificate: {
        certificate: certificatePem,
        privateKey: privateKeyPem,
        cnpj,
        commonName,
        validFrom,
        validTo,
        issuer: issuerName,
        serialNumber,
        thumbprint,
        isValid,
        daysToExpire,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    
    // Tratar erros comuns
    if (message.includes("Invalid password") || message.includes("PKCS#12 MAC")) {
      return { success: false, error: "Senha incorreta do certificado" };
    }
    if (message.includes("Too few bytes")) {
      return { success: false, error: "Arquivo PFX inválido ou corrompido" };
    }
    
    return { success: false, error: `Erro ao processar certificado: ${message}` };
  }
}

/**
 * Valida se um certificado ainda está válido
 */
export function validateCertificate(certPem: string): {
  valid: boolean;
  daysToExpire: number;
  error?: string;
} {
  try {
    const cert = forge.pki.certificateFromPem(certPem);
    const now = new Date();
    const validTo = cert.validity.notAfter;
    
    const isValid = now >= cert.validity.notBefore && now <= validTo;
    const daysToExpire = Math.ceil((validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (!isValid) {
      if (now < cert.validity.notBefore) {
        return { valid: false, daysToExpire, error: "Certificado ainda não é válido" };
      }
      return { valid: false, daysToExpire, error: "Certificado expirado" };
    }

    return { valid: true, daysToExpire };
  } catch (error) {
    return { 
      valid: false, 
      daysToExpire: 0, 
      error: `Erro ao validar certificado: ${error instanceof Error ? error.message : "Erro desconhecido"}` 
    };
  }
}

/**
 * Extrai informações básicas de um certificado PEM
 */
export function getCertificateInfo(certPem: string): CertificateInfo | null {
  try {
    const cert = forge.pki.certificateFromPem(certPem);
    const subject = cert.subject.attributes;
    const issuer = cert.issuer.attributes;
    
    const commonName = subject.find(attr => attr.shortName === "CN")?.value as string || "Desconhecido";
    const issuerName = issuer.find(attr => attr.shortName === "CN")?.value as string || "Desconhecido";
    
    const validFrom = cert.validity.notBefore;
    const validTo = cert.validity.notAfter;
    const now = new Date();
    
    const isValid = now >= validFrom && now <= validTo;
    const daysToExpire = Math.ceil((validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return {
      certificate: certPem,
      privateKey: "", // Não disponível apenas com o certificado
      cnpj: extractCnpjFromSubject(subject),
      commonName,
      validFrom,
      validTo,
      issuer: issuerName,
      serialNumber: cert.serialNumber,
      thumbprint: calculateThumbprint(cert),
      isValid,
      daysToExpire,
    };
  } catch {
    return null;
  }
}
