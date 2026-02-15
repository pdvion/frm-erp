/**
 * EDI Service
 * VIO-1126 — Troca eletrônica com montadoras/varejo
 *
 * Parsers, generators, and message processing for EDI formats.
 */

import type { PrismaClient } from "@prisma/client";
import type { Prisma } from "@prisma/client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EdifactSegment {
  tag: string;
  elements: string[][];
}

export interface FlatFileFieldDef {
  name: string;
  start: number;
  length: number;
  type: "string" | "number" | "date";
  format?: string;
}

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  transform?: "uppercase" | "lowercase" | "trim" | "number" | "date" | "cnpj" | "none";
  defaultValue?: string;
}

export interface ParsedOrder {
  orderNumber: string;
  buyerCode: string;
  orderDate: string;
  deliveryDate?: string;
  items: {
    lineNumber: number;
    productCode: string;
    quantity: number;
    unitPrice: number;
    description?: string;
  }[];
}

export interface DesadvData {
  shipmentNumber: string;
  orderReference: string;
  shipDate: string;
  carrier?: string;
  trackingCode?: string;
  items: {
    productCode: string;
    quantity: number;
    lotNumber?: string;
  }[];
}

export interface InvoicData {
  invoiceNumber: string;
  invoiceDate: string;
  orderReference: string;
  totalValue: number;
  items: {
    productCode: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    description?: string;
  }[];
}

// ─── Pure Functions: EDIFACT Parser ───────────────────────────────────────────

export function parseEdifactSegments(raw: string): EdifactSegment[] {
  const segments: EdifactSegment[] = [];
  const lines = raw.split("'").map((s) => s.trim()).filter(Boolean);

  for (const line of lines) {
    const parts = line.split("+");
    const tag = parts[0] ?? "";
    const elements = parts.slice(1).map((el) => el.split(":"));
    segments.push({ tag, elements });
  }

  return segments;
}

export function parseEdifactOrders(segments: EdifactSegment[]): ParsedOrder | null {
  let orderNumber = "";
  let buyerCode = "";
  let orderDate = "";
  let deliveryDate: string | undefined;
  const items: ParsedOrder["items"] = [];

  let currentLineNumber = 0;

  for (const seg of segments) {
    switch (seg.tag) {
      case "BGM":
        orderNumber = seg.elements[1]?.[0] ?? "";
        break;
      case "DTM": {
        const qualifier = seg.elements[0]?.[0] ?? "";
        const date = seg.elements[0]?.[1] ?? "";
        if (qualifier === "137") orderDate = formatEdifactDate(date);
        if (qualifier === "2") deliveryDate = formatEdifactDate(date);
        break;
      }
      case "NAD": {
        const role = seg.elements[0]?.[0] ?? "";
        if (role === "BY") buyerCode = seg.elements[1]?.[0] ?? "";
        break;
      }
      case "LIN": {
        currentLineNumber++;
        const productCode = seg.elements[2]?.[0] ?? "";
        items.push({ lineNumber: currentLineNumber, productCode, quantity: 0, unitPrice: 0 });
        break;
      }
      case "QTY": {
        const qty = Number(seg.elements[0]?.[1] ?? 0);
        if (items.length > 0) items[items.length - 1].quantity = qty;
        break;
      }
      case "PRI": {
        const price = Number(seg.elements[0]?.[1] ?? 0);
        if (items.length > 0) items[items.length - 1].unitPrice = price;
        break;
      }
      case "IMD": {
        const descParts = seg.elements[2] ?? [];
        const desc = descParts.find((s) => s.length > 0) ?? "";
        if (items.length > 0 && desc) items[items.length - 1].description = desc;
        break;
      }
    }
  }

  if (!orderNumber) return null;
  return { orderNumber, buyerCode, orderDate, deliveryDate, items };
}

export function formatEdifactDate(raw: string): string {
  if (raw.length === 8) {
    return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
  }
  return raw;
}

// ─── Pure Functions: EDIFACT Generator ────────────────────────────────────────

export function generateDesadvEdifact(data: DesadvData): string {
  const segments: string[] = [];
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const timeStr = now.toISOString().slice(11, 15).replace(":", "");

  segments.push(`UNH+1+DESADV:D:96A:UN'`);
  segments.push(`BGM+351+${data.shipmentNumber}+9'`);
  segments.push(`DTM+137:${dateStr}:102'`);
  segments.push(`DTM+11:${data.shipDate.replace(/-/g, "")}:102'`);

  if (data.carrier) segments.push(`TDT+20++++${data.carrier}'`);
  if (data.trackingCode) segments.push(`RFF+AAS:${data.trackingCode}'`);

  segments.push(`RFF+ON:${data.orderReference}'`);

  for (let i = 0; i < data.items.length; i++) {
    const item = data.items[i];
    segments.push(`LIN+${i + 1}++${item.productCode}:SA'`);
    segments.push(`QTY+12:${item.quantity}'`);
    if (item.lotNumber) segments.push(`LOT+${item.lotNumber}'`);
  }

  segments.push(`UNT+${segments.length + 1}+1'`);
  return segments.join("\n");
}

export function generateInvoicEdifact(data: InvoicData): string {
  const segments: string[] = [];

  segments.push(`UNH+1+INVOIC:D:96A:UN'`);
  segments.push(`BGM+380+${data.invoiceNumber}+9'`);
  segments.push(`DTM+137:${data.invoiceDate.replace(/-/g, "")}:102'`);
  segments.push(`RFF+ON:${data.orderReference}'`);

  for (let i = 0; i < data.items.length; i++) {
    const item = data.items[i];
    segments.push(`LIN+${i + 1}++${item.productCode}:SA'`);
    segments.push(`QTY+47:${item.quantity}'`);
    segments.push(`PRI+AAA:${item.unitPrice.toFixed(2)}'`);
    segments.push(`MOA+203:${item.totalPrice.toFixed(2)}'`);
    if (item.description) segments.push(`IMD+F++:::${item.description}'`);
  }

  segments.push(`MOA+86:${data.totalValue.toFixed(2)}'`);
  segments.push(`UNT+${segments.length + 1}+1'`);
  return segments.join("\n");
}

// ─── Pure Functions: Flat File Parser ─────────────────────────────────────────

export function parseFlatFileLine(line: string, fields: FlatFileFieldDef[]): Record<string, string | number> {
  const result: Record<string, string | number> = {};

  for (const field of fields) {
    const raw = line.substring(field.start, field.start + field.length).trim();
    if (field.type === "number") {
      result[field.name] = Number(raw) || 0;
    } else {
      result[field.name] = raw;
    }
  }

  return result;
}

export function parseFlatFile(content: string, fields: FlatFileFieldDef[]): Record<string, string | number>[] {
  return content
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line) => parseFlatFileLine(line, fields));
}

export function generateFlatFileLine(data: Record<string, string | number>, fields: FlatFileFieldDef[]): string {
  let line = "";
  for (const field of fields) {
    const value = String(data[field.name] ?? "");
    if (field.type === "number") {
      line += value.padStart(field.length, "0");
    } else {
      line += value.padEnd(field.length, " ");
    }
  }
  return line;
}

// ─── Pure Functions: Field Mapping ────────────────────────────────────────────

export function applyFieldMappings(
  source: Record<string, unknown>,
  mappings: FieldMapping[]
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const mapping of mappings) {
    let value = source[mapping.sourceField] ?? mapping.defaultValue ?? null;

    if (value != null && mapping.transform) {
      switch (mapping.transform) {
        case "uppercase": value = String(value).toUpperCase(); break;
        case "lowercase": value = String(value).toLowerCase(); break;
        case "trim": value = String(value).trim(); break;
        case "number": value = Number(value) || 0; break;
        case "date": value = new Date(String(value)).toISOString().slice(0, 10); break;
        case "cnpj": value = String(value).replace(/\D/g, "").padStart(14, "0"); break;
        case "none": break;
      }
    }

    result[mapping.targetField] = value;
  }

  return result;
}

// ─── Service Class ────────────────────────────────────────────────────────────

export class EdiService {
  constructor(private prisma: PrismaClient) {}

  // ─── Partners ───────────────────────────────────────────────────────────

  async listPartners(companyId: string, options?: { status?: string; search?: string }) {
    const where: Prisma.EdiPartnerWhereInput = { companyId };
    if (options?.status) where.status = options.status as Prisma.EnumEdiPartnerStatusFilter;
    if (options?.search) {
      where.OR = [
        { name: { contains: options.search, mode: "insensitive" as const } },
        { code: { contains: options.search, mode: "insensitive" as const } },
      ];
    }

    return this.prisma.ediPartner.findMany({
      where,
      orderBy: { name: "asc" },
      include: { _count: { select: { messages: true } } },
    });
  }

  async getPartner(id: string, companyId: string) {
    return this.prisma.ediPartner.findFirst({
      where: { id, companyId },
      include: {
        _count: { select: { messages: true, mappings: true } },
      },
    });
  }

  async createPartner(companyId: string, data: {
    code: string; name: string; cnpj?: string; format?: string;
    sftpHost?: string; sftpPort?: number; sftpUser?: string; sftpPassword?: string;
    sftpInboundPath?: string; sftpOutboundPath?: string; webhookUrl?: string; notes?: string;
  }) {
    return this.prisma.ediPartner.create({
      data: {
        companyId,
        code: data.code,
        name: data.name,
        cnpj: data.cnpj,
        format: (data.format as "EDIFACT" | "FLAT_FILE" | "XML" | "JSON") ?? "EDIFACT",
        sftpHost: data.sftpHost,
        sftpPort: data.sftpPort,
        sftpUser: data.sftpUser,
        sftpPassword: data.sftpPassword,
        sftpInboundPath: data.sftpInboundPath,
        sftpOutboundPath: data.sftpOutboundPath,
        webhookUrl: data.webhookUrl,
        notes: data.notes,
      },
    });
  }

  async updatePartner(id: string, companyId: string, data: Partial<{
    name: string; cnpj: string; format: string; status: string;
    sftpHost: string; sftpPort: number; sftpUser: string; sftpPassword: string;
    sftpInboundPath: string; sftpOutboundPath: string; webhookUrl: string; notes: string;
  }>) {
    const existing = await this.prisma.ediPartner.findFirst({ where: { id, companyId } });
    if (!existing) throw new Error("Parceiro EDI não encontrado");

    return this.prisma.ediPartner.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.cnpj !== undefined && { cnpj: data.cnpj }),
        ...(data.format && { format: data.format as "EDIFACT" | "FLAT_FILE" | "XML" | "JSON" }),
        ...(data.status && { status: data.status as "ACTIVE" | "INACTIVE" | "TESTING" }),
        ...(data.sftpHost !== undefined && { sftpHost: data.sftpHost }),
        ...(data.sftpPort !== undefined && { sftpPort: data.sftpPort }),
        ...(data.sftpUser !== undefined && { sftpUser: data.sftpUser }),
        ...(data.sftpPassword !== undefined && { sftpPassword: data.sftpPassword }),
        ...(data.sftpInboundPath !== undefined && { sftpInboundPath: data.sftpInboundPath }),
        ...(data.sftpOutboundPath !== undefined && { sftpOutboundPath: data.sftpOutboundPath }),
        ...(data.webhookUrl !== undefined && { webhookUrl: data.webhookUrl }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
    });
  }

  // ─── Messages ───────────────────────────────────────────────────────────

  async listMessages(companyId: string, options?: {
    partnerId?: string; messageType?: string; direction?: string;
    status?: string; limit?: number; offset?: number;
  }) {
    const where: Prisma.EdiMessageWhereInput = { companyId };
    if (options?.partnerId) where.partnerId = options.partnerId;
    if (options?.messageType) where.messageType = options.messageType as Prisma.EnumEdiMessageTypeFilter;
    if (options?.direction) where.direction = options.direction as Prisma.EnumEdiDirectionFilter;
    if (options?.status) where.status = options.status as Prisma.EnumEdiMessageStatusFilter;

    const [items, total] = await Promise.all([
      this.prisma.ediMessage.findMany({
        where,
        include: { partner: { select: { id: true, name: true, code: true } } },
        orderBy: { createdAt: "desc" },
        take: options?.limit ?? 20,
        skip: options?.offset ?? 0,
      }),
      this.prisma.ediMessage.count({ where }),
    ]);

    return { items, total };
  }

  async getMessage(id: string, companyId: string) {
    return this.prisma.ediMessage.findFirst({
      where: { id, companyId },
      include: { partner: { select: { id: true, name: true, code: true, format: true } } },
    });
  }

  async createMessage(companyId: string, data: {
    partnerId: string; messageType: string; direction: string;
    referenceNumber?: string; fileName?: string; rawContent?: string;
    parsedData?: Record<string, unknown>; relatedOrderId?: string; relatedInvoiceId?: string;
  }) {
    return this.prisma.ediMessage.create({
      data: {
        companyId,
        partnerId: data.partnerId,
        messageType: data.messageType as "ORDERS" | "ORDRSP" | "DESADV" | "INVOIC" | "RECADV" | "PRICAT" | "INVRPT" | "OTHER",
        direction: data.direction as "INBOUND" | "OUTBOUND",
        referenceNumber: data.referenceNumber,
        fileName: data.fileName,
        rawContent: data.rawContent,
        parsedData: data.parsedData as Prisma.InputJsonValue,
        relatedOrderId: data.relatedOrderId,
        relatedInvoiceId: data.relatedInvoiceId,
      },
    });
  }

  async processMessage(id: string, companyId: string) {
    const message = await this.prisma.ediMessage.findFirst({
      where: { id, companyId, status: "PENDING" },
      include: { partner: true },
    });

    if (!message) throw new Error("Mensagem não encontrada ou já processada");

    try {
      await this.prisma.ediMessage.update({
        where: { id },
        data: { status: "PROCESSING" },
      });

      let parsedData: Record<string, unknown> | null = null;

      if (message.direction === "INBOUND" && message.rawContent) {
        if (message.partner.format === "EDIFACT") {
          const segments = parseEdifactSegments(message.rawContent);
          if (message.messageType === "ORDERS") {
            parsedData = parseEdifactOrders(segments) as unknown as Record<string, unknown>;
          }
        } else if (message.partner.format === "FLAT_FILE") {
          // Flat file parsing requires mapping config — store raw parsed lines
          const lines = message.rawContent.split("\n").filter(Boolean);
          parsedData = { lineCount: lines.length, lines: lines.slice(0, 5) };
        } else if (message.partner.format === "XML" || message.partner.format === "JSON") {
          try {
            parsedData = JSON.parse(message.rawContent);
          } catch {
            parsedData = { raw: message.rawContent.slice(0, 1000) };
          }
        }
      }

      await this.prisma.ediMessage.update({
        where: { id },
        data: {
          status: "PROCESSED",
          processedAt: new Date(),
          parsedData: parsedData as Prisma.InputJsonValue ?? undefined,
        },
      });

      return { success: true, parsedData };
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      await this.prisma.ediMessage.update({
        where: { id },
        data: { status: "ERROR", errorMessage },
      });
      throw e;
    }
  }

  async retryMessage(id: string, companyId: string) {
    const message = await this.prisma.ediMessage.findFirst({
      where: { id, companyId, status: "ERROR" },
    });
    if (!message) throw new Error("Mensagem não encontrada ou não está em erro");

    await this.prisma.ediMessage.update({
      where: { id },
      data: { status: "PENDING", errorMessage: null },
    });

    return this.processMessage(id, companyId);
  }

  // ─── Mappings ───────────────────────────────────────────────────────────

  async listMappings(companyId: string, partnerId?: string) {
    const where: Prisma.EdiMappingWhereInput = { companyId };
    if (partnerId) where.partnerId = partnerId;

    return this.prisma.ediMapping.findMany({
      where,
      include: { partner: { select: { id: true, name: true, code: true } } },
      orderBy: { name: "asc" },
    });
  }

  async createMapping(companyId: string, data: {
    partnerId: string; messageType: string; direction: string;
    name: string; description?: string; fieldMappings: FieldMapping[];
  }) {
    return this.prisma.ediMapping.create({
      data: {
        companyId,
        partnerId: data.partnerId,
        messageType: data.messageType as "ORDERS" | "ORDRSP" | "DESADV" | "INVOIC" | "RECADV" | "PRICAT" | "INVRPT" | "OTHER",
        direction: data.direction as "INBOUND" | "OUTBOUND",
        name: data.name,
        description: data.description,
        fieldMappings: data.fieldMappings as unknown as Prisma.InputJsonValue,
      },
    });
  }

  async updateMapping(id: string, companyId: string, data: Partial<{
    name: string; description: string; fieldMappings: FieldMapping[]; isActive: boolean;
  }>) {
    const existing = await this.prisma.ediMapping.findFirst({ where: { id, companyId } });
    if (!existing) throw new Error("Mapeamento não encontrado");

    return this.prisma.ediMapping.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.fieldMappings && { fieldMappings: data.fieldMappings as unknown as Prisma.InputJsonValue }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
  }

  // ─── Dashboard Stats ────────────────────────────────────────────────────

  async getStats(companyId: string) {
    const [totalPartners, activePartners, totalMessages, pendingMessages, errorMessages, processedToday] = await Promise.all([
      this.prisma.ediPartner.count({ where: { companyId } }),
      this.prisma.ediPartner.count({ where: { companyId, status: "ACTIVE" } }),
      this.prisma.ediMessage.count({ where: { companyId } }),
      this.prisma.ediMessage.count({ where: { companyId, status: "PENDING" } }),
      this.prisma.ediMessage.count({ where: { companyId, status: "ERROR" } }),
      this.prisma.ediMessage.count({
        where: {
          companyId,
          status: "PROCESSED",
          processedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
    ]);

    return { totalPartners, activePartners, totalMessages, pendingMessages, errorMessages, processedToday };
  }
}
