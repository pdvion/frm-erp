/**
 * Deploy Agent - Entity Importer
 * Cria/atualiza entidades do ERP a partir de dados extraídos de XMLs de NFe
 */

import { prisma } from "@/lib/prisma";
import type { NFeParsed, NFeDestinatario, NFeEmitente, NFeItem } from "@/lib/nfe-parser";

export interface ImportResult {
  entity: "supplier" | "customer" | "material" | "carrier";
  action: "created" | "updated" | "skipped";
  id?: string;
  name: string;
  cnpjCpf?: string;
  reason?: string;
}

export interface ImportSummary {
  suppliers: ImportResult[];
  customers: ImportResult[];
  materials: ImportResult[];
  carriers: ImportResult[];
  totalCreated: number;
  totalUpdated: number;
  totalSkipped: number;
}

/**
 * Limpa CNPJ/CPF removendo caracteres não numéricos
 */
function cleanDocument(doc: string | undefined): string {
  return (doc || "").replace(/\D/g, "");
}

/**
 * Formata CNPJ para exibição
 */
function formatCnpj(cnpj: string): string {
  const cleaned = cleanDocument(cnpj);
  if (cleaned.length !== 14) return cnpj;
  return cleaned.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    "$1.$2.$3/$4-$5"
  );
}

/**
 * Formata CPF para exibição
 */
function formatCpf(cpf: string): string {
  const cleaned = cleanDocument(cpf);
  if (cleaned.length !== 11) return cpf;
  return cleaned.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
}

/**
 * Importa fornecedor a partir do emitente da NFe (NFe de entrada)
 */
export async function importSupplierFromNFe(
  emitente: NFeEmitente,
  companyId: string,
  options: { updateIfExists?: boolean; dryRun?: boolean } = {}
): Promise<ImportResult> {
  const cnpj = cleanDocument(emitente.cnpj);
  const cpf = cleanDocument(emitente.cpf);
  const document = cnpj || cpf;

  if (!document) {
    return {
      entity: "supplier",
      action: "skipped",
      name: emitente.razaoSocial,
      reason: "CNPJ/CPF não informado",
    };
  }

  // Verificar se já existe
  const existing = await prisma.supplier.findFirst({
    where: {
      OR: [
        cnpj ? { cnpj: { contains: cnpj } } : {},
        cpf ? { cpf: { contains: cpf } } : {},
      ].filter((o) => Object.keys(o).length > 0),
      companyId,
    },
  });

  if (existing) {
    if (!options.updateIfExists) {
      return {
        entity: "supplier",
        action: "skipped",
        id: existing.id,
        name: emitente.razaoSocial,
        cnpjCpf: cnpj ? formatCnpj(cnpj) : formatCpf(cpf),
        reason: "Fornecedor já cadastrado",
      };
    }

    if (options.dryRun) {
      return {
        entity: "supplier",
        action: "updated",
        id: existing.id,
        name: emitente.razaoSocial,
        cnpjCpf: cnpj ? formatCnpj(cnpj) : formatCpf(cpf),
        reason: "Simulação - seria atualizado",
      };
    }

    // Atualizar fornecedor existente
    const updated = await prisma.supplier.update({
      where: { id: existing.id },
      data: {
        tradeName: emitente.nomeFantasia || existing.tradeName,
        ie: emitente.ie || existing.ie,
        address: emitente.endereco?.logradouro || existing.address,
        number: emitente.endereco?.numero || existing.number,
        neighborhood: emitente.endereco?.bairro || existing.neighborhood,
        city: emitente.endereco?.cidade || existing.city,
        state: emitente.endereco?.uf || existing.state,
        zipCode: emitente.endereco?.cep || existing.zipCode,
      },
    });

    return {
      entity: "supplier",
      action: "updated",
      id: updated.id,
      name: emitente.razaoSocial,
      cnpjCpf: cnpj ? formatCnpj(cnpj) : formatCpf(cpf),
    };
  }

  if (options.dryRun) {
    return {
      entity: "supplier",
      action: "created",
      name: emitente.razaoSocial,
      cnpjCpf: cnpj ? formatCnpj(cnpj) : formatCpf(cpf),
      reason: "Simulação - seria criado",
    };
  }

  // Buscar próximo código disponível
  const lastSupplier = await prisma.supplier.findFirst({
    where: { companyId },
    orderBy: { code: "desc" },
    select: { code: true },
  });
  const nextCode = (lastSupplier?.code || 0) + 1;

  // Criar novo fornecedor
  const created = await prisma.supplier.create({
    data: {
      code: nextCode,
      companyName: emitente.razaoSocial,
      tradeName: emitente.nomeFantasia,
      cnpj: cnpj ? formatCnpj(cnpj) : undefined,
      cpf: cpf ? formatCpf(cpf) : undefined,
      ie: emitente.ie,
      address: emitente.endereco?.logradouro,
      number: emitente.endereco?.numero,
      neighborhood: emitente.endereco?.bairro,
      city: emitente.endereco?.cidade,
      state: emitente.endereco?.uf,
      zipCode: emitente.endereco?.cep,
      status: "ACTIVE",
      companyId,
    },
  });

  return {
    entity: "supplier",
    action: "created",
    id: created.id,
    name: emitente.razaoSocial,
    cnpjCpf: cnpj ? formatCnpj(cnpj) : formatCpf(cpf),
  };
}

/**
 * Importa cliente a partir do destinatário da NFe (NFe de saída)
 */
export async function importCustomerFromNFe(
  destinatario: NFeDestinatario,
  companyId: string,
  options: { updateIfExists?: boolean; dryRun?: boolean } = {}
): Promise<ImportResult> {
  const cnpj = cleanDocument(destinatario.cnpj);
  const cpf = cleanDocument(destinatario.cpf);
  const document = cnpj || cpf;

  if (!document) {
    return {
      entity: "customer",
      action: "skipped",
      name: destinatario.razaoSocial,
      reason: "CNPJ/CPF não informado",
    };
  }

  // Verificar se já existe
  const existing = await prisma.customer.findFirst({
    where: {
      OR: [
        cnpj ? { cnpj: { contains: cnpj } } : {},
        cpf ? { cpf: { contains: cpf } } : {},
      ].filter((o) => Object.keys(o).length > 0),
      companyId,
    },
  });

  if (existing) {
    if (!options.updateIfExists) {
      return {
        entity: "customer",
        action: "skipped",
        id: existing.id,
        name: destinatario.razaoSocial,
        cnpjCpf: cnpj ? formatCnpj(cnpj) : formatCpf(cpf),
        reason: "Cliente já cadastrado",
      };
    }

    if (options.dryRun) {
      return {
        entity: "customer",
        action: "updated",
        id: existing.id,
        name: destinatario.razaoSocial,
        cnpjCpf: cnpj ? formatCnpj(cnpj) : formatCpf(cpf),
        reason: "Simulação - seria atualizado",
      };
    }

    // Atualizar cliente existente
    const updated = await prisma.customer.update({
      where: { id: existing.id },
      data: {
        tradeName: destinatario.nomeFantasia || existing.tradeName,
        stateRegistration: destinatario.ie || existing.stateRegistration,
        email: destinatario.email || existing.email,
        phone: destinatario.telefone || existing.phone,
        addressStreet: destinatario.endereco?.logradouro || existing.addressStreet,
        addressNumber: destinatario.endereco?.numero || existing.addressNumber,
        addressComplement: destinatario.endereco?.complemento || existing.addressComplement,
        addressNeighborhood: destinatario.endereco?.bairro || existing.addressNeighborhood,
        addressCity: destinatario.endereco?.cidade || existing.addressCity,
        addressState: destinatario.endereco?.uf || existing.addressState,
        addressZipCode: destinatario.endereco?.cep || existing.addressZipCode,
      },
    });

    return {
      entity: "customer",
      action: "updated",
      id: updated.id,
      name: destinatario.razaoSocial,
      cnpjCpf: cnpj ? formatCnpj(cnpj) : formatCpf(cpf),
    };
  }

  if (options.dryRun) {
    return {
      entity: "customer",
      action: "created",
      name: destinatario.razaoSocial,
      cnpjCpf: cnpj ? formatCnpj(cnpj) : formatCpf(cpf),
      reason: "Simulação - seria criado",
    };
  }

  // Buscar próximo código disponível
  const lastCustomer = await prisma.customer.findFirst({
    where: { companyId },
    orderBy: { code: "desc" },
    select: { code: true },
  });
  const nextCode = parseInt(lastCustomer?.code || "0", 10) + 1;

  // Criar novo cliente
  const created = await prisma.customer.create({
    data: {
      code: String(nextCode),
      companyName: destinatario.razaoSocial,
      tradeName: destinatario.nomeFantasia,
      cnpj: cnpj ? formatCnpj(cnpj) : undefined,
      cpf: cpf ? formatCpf(cpf) : undefined,
      stateRegistration: destinatario.ie,
      municipalRegistration: destinatario.im,
      email: destinatario.email,
      phone: destinatario.telefone,
      addressStreet: destinatario.endereco?.logradouro,
      addressNumber: destinatario.endereco?.numero,
      addressComplement: destinatario.endereco?.complemento,
      addressNeighborhood: destinatario.endereco?.bairro,
      addressCity: destinatario.endereco?.cidade,
      addressState: destinatario.endereco?.uf,
      addressZipCode: destinatario.endereco?.cep,
      status: "ACTIVE",
      companyId,
    },
  });

  return {
    entity: "customer",
    action: "created",
    id: created.id,
    name: destinatario.razaoSocial,
    cnpjCpf: cnpj ? formatCnpj(cnpj) : formatCpf(cpf),
  };
}

/**
 * Importa material/produto a partir de item da NFe
 */
export async function importMaterialFromNFe(
  item: NFeItem,
  companyId: string,
  options: { updateIfExists?: boolean; dryRun?: boolean } = {}
): Promise<ImportResult> {
  if (!item.codigo || !item.descricao) {
    return {
      entity: "material",
      action: "skipped",
      name: item.descricao || "Sem descrição",
      reason: "Código ou descrição não informados",
    };
  }

  // Verificar se já existe pelo código do fornecedor ou EAN
  const existing = await prisma.material.findFirst({
    where: {
      OR: [
        { internalCode: item.codigo },
        item.codigoEan ? { barcode: item.codigoEan } : {},
      ].filter((o) => Object.keys(o).length > 0),
      companyId,
    },
  });

  if (existing) {
    if (!options.updateIfExists) {
      return {
        entity: "material",
        action: "skipped",
        id: existing.id,
        name: item.descricao,
        reason: "Material já cadastrado",
      };
    }

    if (options.dryRun) {
      return {
        entity: "material",
        action: "updated",
        id: existing.id,
        name: item.descricao,
        reason: "Simulação - seria atualizado",
      };
    }

    // Atualizar material existente
    const updated = await prisma.material.update({
      where: { id: existing.id },
      data: {
        ncm: item.ncm || existing.ncm,
        barcode: item.codigoEan || existing.barcode,
      },
    });

    return {
      entity: "material",
      action: "updated",
      id: updated.id,
      name: item.descricao,
    };
  }

  if (options.dryRun) {
    return {
      entity: "material",
      action: "created",
      name: item.descricao,
      reason: "Simulação - seria criado",
    };
  }

  // Buscar próximo código disponível
  const lastMaterial = await prisma.material.findFirst({
    where: { companyId },
    orderBy: { code: "desc" },
    select: { code: true },
  });
  const nextCode = (lastMaterial?.code || 0) + 1;

  // Criar novo material
  const created = await prisma.material.create({
    data: {
      code: nextCode,
      description: item.descricao,
      internalCode: item.codigo,
      unit: item.unidade || "UN",
      ncm: item.ncm,
      barcode: item.codigoEan,
      status: "ACTIVE",
      companyId,
    },
  });

  return {
    entity: "material",
    action: "created",
    id: created.id,
    name: item.descricao,
  };
}

/**
 * Processa uma NFe completa e importa todas as entidades
 */
export async function processNFeEntities(
  nfe: NFeParsed,
  companyId: string,
  options: {
    importSuppliers?: boolean;
    importCustomers?: boolean;
    importMaterials?: boolean;
    updateIfExists?: boolean;
    dryRun?: boolean;
  } = {}
): Promise<ImportSummary> {
  const {
    importSuppliers = true,
    importCustomers = true,
    importMaterials = true,
    updateIfExists = false,
    dryRun = false,
  } = options;

  const summary: ImportSummary = {
    suppliers: [],
    customers: [],
    materials: [],
    carriers: [],
    totalCreated: 0,
    totalUpdated: 0,
    totalSkipped: 0,
  };

  // NFe de entrada (tipoOperacao = 0) -> importar emitente como fornecedor
  // NFe de saída (tipoOperacao = 1) -> importar destinatário como cliente
  const isEntrada = nfe.tipoOperacao === 0;

  if (importSuppliers && isEntrada) {
    const result = await importSupplierFromNFe(nfe.emitente, companyId, {
      updateIfExists,
      dryRun,
    });
    summary.suppliers.push(result);
  }

  if (importCustomers && !isEntrada) {
    const result = await importCustomerFromNFe(nfe.destinatario, companyId, {
      updateIfExists,
      dryRun,
    });
    summary.customers.push(result);
  }

  if (importMaterials) {
    // Importar materiais únicos (por código)
    const uniqueItems = new Map<string, NFeItem>();
    for (const item of nfe.itens) {
      if (!uniqueItems.has(item.codigo)) {
        uniqueItems.set(item.codigo, item);
      }
    }

    for (const item of uniqueItems.values()) {
      const result = await importMaterialFromNFe(item, companyId, {
        updateIfExists,
        dryRun,
      });
      summary.materials.push(result);
    }
  }

  // Calcular totais
  const allResults = [
    ...summary.suppliers,
    ...summary.customers,
    ...summary.materials,
    ...summary.carriers,
  ];

  summary.totalCreated = allResults.filter((r) => r.action === "created").length;
  summary.totalUpdated = allResults.filter((r) => r.action === "updated").length;
  summary.totalSkipped = allResults.filter((r) => r.action === "skipped").length;

  return summary;
}

/**
 * Processa múltiplas NFes em lote
 */
export async function processNFeBatch(
  nfes: NFeParsed[],
  companyId: string,
  options: Parameters<typeof processNFeEntities>[2] = {}
): Promise<{
  processed: number;
  summaries: ImportSummary[];
  totals: {
    created: number;
    updated: number;
    skipped: number;
  };
}> {
  const summaries: ImportSummary[] = [];

  for (const nfe of nfes) {
    const summary = await processNFeEntities(nfe, companyId, options);
    summaries.push(summary);
  }

  return {
    processed: nfes.length,
    summaries,
    totals: {
      created: summaries.reduce((acc, s) => acc + s.totalCreated, 0),
      updated: summaries.reduce((acc, s) => acc + s.totalUpdated, 0),
      skipped: summaries.reduce((acc, s) => acc + s.totalSkipped, 0),
    },
  };
}
