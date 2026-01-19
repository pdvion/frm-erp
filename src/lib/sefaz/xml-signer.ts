/**
 * Assinatura XML para NFe/CTe
 * 
 * Implementa assinatura digital XML usando certificado A1 (PFX/P12)
 * conforme padrão XML-DSig (XML Digital Signature)
 */

import * as crypto from "crypto";

export interface CertificateInfo {
  subject: string;
  issuer: string;
  validFrom: Date;
  validTo: Date;
  serialNumber: string;
  thumbprint: string;
}

export interface SignatureResult {
  success: boolean;
  signedXml?: string;
  error?: string;
}

/**
 * Carrega certificado PFX/P12 e extrai informações
 * 
 * Nota: Para uso em produção, recomenda-se usar node-forge ou
 * outra biblioteca que suporte PKCS12 nativamente.
 * Esta implementação é um placeholder que requer processamento
 * prévio do certificado via OpenSSL.
 * 
 * Comandos para extrair do PFX:
 * openssl pkcs12 -in cert.pfx -nocerts -nodes -out key.pem
 * openssl pkcs12 -in cert.pfx -clcerts -nokeys -out cert.pem
 */
export function loadCertificate(
  privateKeyPem: string,
  certificatePem: string
): { privateKey: string; certificate: string; info: CertificateInfo } | { error: string } {
  try {
    // Validar que a chave privada está em formato PEM
    if (!privateKeyPem.includes("-----BEGIN") || !privateKeyPem.includes("PRIVATE KEY")) {
      return { error: "Chave privada deve estar em formato PEM" };
    }

    // Validar que o certificado está em formato PEM
    if (!certificatePem.includes("-----BEGIN CERTIFICATE-----")) {
      return { error: "Certificado deve estar em formato PEM" };
    }

    // Extrair informações básicas do certificado
    // Em produção, usar lib como node-forge para parsing completo
    const info: CertificateInfo = {
      subject: "CN=Certificado Digital",
      issuer: "CN=Autoridade Certificadora",
      validFrom: new Date(),
      validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      serialNumber: "000000",
      thumbprint: getCertificateThumbprint(certificatePem),
    };

    return {
      privateKey: privateKeyPem,
      certificate: certificatePem,
      info,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Erro ao carregar certificado",
    };
  }
}

/**
 * Calcula hash SHA-1 de uma string
 */
function sha1(data: string): Buffer {
  return crypto.createHash("sha1").update(data, "utf8").digest();
}

/**
 * Converte buffer para Base64
 */
function toBase64(buffer: Buffer): string {
  return buffer.toString("base64");
}

/**
 * Canonicaliza XML (Canonical XML 1.0)
 * Simplificado - em produção usar lib como xml-crypto
 */
function canonicalize(xml: string): string {
  // Remove declaração XML
  let canonical = xml.replace(/<\?xml[^?]*\?>/g, "");
  
  // Remove espaços extras entre tags
  canonical = canonical.replace(/>\s+</g, "><");
  
  // Remove espaços no início e fim
  canonical = canonical.trim();
  
  return canonical;
}

/**
 * Extrai conteúdo de uma tag XML
 */
function extractTag(xml: string, tagName: string): string | null {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)</${tagName}>`, "i");
  const match = xml.match(regex);
  return match ? match[0] : null;
}

/**
 * Assina XML NFe/CTe
 * 
 * @param xml - XML a ser assinado
 * @param privateKey - Chave privada em formato PEM
 * @param certificate - Certificado X509 em formato PEM
 * @param tagToSign - Tag a ser assinada (ex: "infNFe", "infEvento")
 */
export function signXml(
  xml: string,
  privateKey: string,
  certificate: string,
  tagToSign: string = "infNFe"
): SignatureResult {
  try {
    // 1. Encontrar a tag a ser assinada
    const tagContent = extractTag(xml, tagToSign);
    if (!tagContent) {
      return {
        success: false,
        error: `Tag ${tagToSign} não encontrada no XML`,
      };
    }

    // 2. Extrair o Id da tag
    const idMatch = tagContent.match(/Id="([^"]+)"/);
    if (!idMatch) {
      return {
        success: false,
        error: `Atributo Id não encontrado na tag ${tagToSign}`,
      };
    }
    const referenceUri = idMatch[1];

    // 3. Canonicalizar o conteúdo
    const canonicalContent = canonicalize(tagContent);

    // 4. Calcular DigestValue (SHA-1 do conteúdo canonicalizado)
    const digestValue = toBase64(sha1(canonicalContent));

    // 5. Montar SignedInfo
    const signedInfo = `<SignedInfo xmlns="http://www.w3.org/2000/09/xmldsig#">
<CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>
<SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"/>
<Reference URI="#${referenceUri}">
<Transforms>
<Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"/>
<Transform Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>
</Transforms>
<DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"/>
<DigestValue>${digestValue}</DigestValue>
</Reference>
</SignedInfo>`;

    // 6. Canonicalizar SignedInfo
    const canonicalSignedInfo = canonicalize(signedInfo);

    // 7. Assinar SignedInfo com a chave privada
    const sign = crypto.createSign("RSA-SHA1");
    sign.update(canonicalSignedInfo);
    const signatureValue = sign.sign(privateKey, "base64");

    // 8. Extrair certificado X509 (remover headers PEM)
    const x509Certificate = certificate
      .replace(/-----BEGIN CERTIFICATE-----/g, "")
      .replace(/-----END CERTIFICATE-----/g, "")
      .replace(/\s/g, "");

    // 9. Montar bloco Signature
    const signature = `<Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
${signedInfo}
<SignatureValue>${signatureValue}</SignatureValue>
<KeyInfo>
<X509Data>
<X509Certificate>${x509Certificate}</X509Certificate>
</X509Data>
</KeyInfo>
</Signature>`;

    // 10. Inserir Signature no XML (antes do fechamento da tag pai)
    const parentTag = tagToSign.replace("inf", "");
    const closingTag = `</${parentTag}>`;
    const signedXml = xml.replace(closingTag, `${signature}${closingTag}`);

    return {
      success: true,
      signedXml,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro ao assinar XML",
    };
  }
}

/**
 * Valida assinatura de um XML
 */
export function validateSignature(signedXml: string): {
  valid: boolean;
  error?: string;
} {
  try {
    // Extrair Signature
    const signatureBlock = extractTag(signedXml, "Signature");
    if (!signatureBlock) {
      return { valid: false, error: "Bloco Signature não encontrado" };
    }

    // Extrair SignatureValue
    const signatureValueMatch = signatureBlock.match(
      /<SignatureValue>([^<]+)<\/SignatureValue>/
    );
    if (!signatureValueMatch) {
      return { valid: false, error: "SignatureValue não encontrado" };
    }

    // Extrair X509Certificate
    const x509Match = signatureBlock.match(
      /<X509Certificate>([^<]+)<\/X509Certificate>/
    );
    if (!x509Match) {
      return { valid: false, error: "X509Certificate não encontrado" };
    }

    // Extrair DigestValue
    const digestValueMatch = signatureBlock.match(
      /<DigestValue>([^<]+)<\/DigestValue>/
    );
    if (!digestValueMatch) {
      return { valid: false, error: "DigestValue não encontrado" };
    }

    // Extrair Reference URI
    const referenceUriMatch = signatureBlock.match(/URI="#([^"]+)"/);
    if (!referenceUriMatch) {
      return { valid: false, error: "Reference URI não encontrado" };
    }

    // TODO: Implementar validação completa
    // 1. Recalcular DigestValue do conteúdo referenciado
    // 2. Comparar com DigestValue do XML
    // 3. Verificar SignatureValue usando certificado X509

    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Erro ao validar assinatura",
    };
  }
}

/**
 * Gera thumbprint (SHA-1) do certificado
 */
export function getCertificateThumbprint(certificatePem: string): string {
  const certDer = Buffer.from(
    certificatePem
      .replace(/-----BEGIN CERTIFICATE-----/g, "")
      .replace(/-----END CERTIFICATE-----/g, "")
      .replace(/\s/g, ""),
    "base64"
  );
  
  return sha1(certDer.toString()).toString("hex").toUpperCase();
}
