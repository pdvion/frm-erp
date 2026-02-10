/**
 * Seed data for Product Catalog Taxonomy (VIO-1034)
 * All data is shared (isShared: true, companyId: null)
 */

import { type PrismaClient, CategoryLevel, AttributeDataType } from "@prisma/client";

// Helper to generate slug
function slug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ==========================================
// TAXONOMY: 4-level hierarchy
// ==========================================

interface CategorySeed {
  name: string;
  level: CategoryLevel;
  icon?: string;
  normReference?: string;
  technicalCode?: string;
  children?: CategorySeed[];
}

const TAXONOMY: CategorySeed[] = [
  {
    name: "Transmissão de Potência",
    level: "DOMAIN",
    icon: "⚙️",
    children: [
      {
        name: "Rolamentos",
        level: "TYPE",
        icon: "🔩",
        normReference: "ISO 15",
        technicalCode: "BRG",
        children: [
          { name: "Rolamentos de Esferas", level: "SUBFAMILY", technicalCode: "BRG-BALL" },
          { name: "Rolamentos de Rolos", level: "SUBFAMILY", technicalCode: "BRG-ROLL" },
          { name: "Rolamentos Autocompensadores", level: "SUBFAMILY", technicalCode: "BRG-SELF" },
          { name: "Rolamentos de Agulhas", level: "SUBFAMILY", technicalCode: "BRG-NEEDLE" },
          { name: "Rolamentos Axiais", level: "SUBFAMILY", technicalCode: "BRG-THRUST" },
        ],
      },
      {
        name: "Mancais",
        level: "TYPE",
        icon: "🏗️",
        technicalCode: "HSG",
        children: [
          { name: "Mancais Bipartidos", level: "SUBFAMILY", technicalCode: "HSG-SPLIT" },
          { name: "Mancais de Pedestal", level: "SUBFAMILY", technicalCode: "HSG-PED" },
          { name: "Mancais Flangeados", level: "SUBFAMILY", technicalCode: "HSG-FLG" },
        ],
      },
      {
        name: "Polias",
        level: "TYPE",
        icon: "🔄",
        technicalCode: "PLY",
        children: [
          { name: "Polias em V", level: "SUBFAMILY", technicalCode: "PLY-V" },
          { name: "Polias Sincronizadoras", level: "SUBFAMILY", technicalCode: "PLY-SYNC" },
          { name: "Polias Planas", level: "SUBFAMILY", technicalCode: "PLY-FLAT" },
        ],
      },
      {
        name: "Cardans e Cruzetas",
        level: "TYPE",
        icon: "🔗",
        technicalCode: "UJT",
        children: [
          { name: "Cruzetas Industriais", level: "SUBFAMILY", technicalCode: "UJT-IND" },
          { name: "Cruzetas Automotivas", level: "SUBFAMILY", technicalCode: "UJT-AUTO" },
        ],
      },
      {
        name: "Buchas",
        level: "TYPE",
        icon: "🔧",
        technicalCode: "BSH",
        children: [
          { name: "Buchas Cônicas", level: "SUBFAMILY", technicalCode: "BSH-TAPER" },
          { name: "Buchas Cilíndricas", level: "SUBFAMILY", technicalCode: "BSH-CYL" },
        ],
      },
    ],
  },
  {
    name: "Vedação",
    level: "DOMAIN",
    icon: "🛡️",
    children: [
      {
        name: "Retentores",
        level: "TYPE",
        icon: "⭕",
        normReference: "DIN 3760",
        technicalCode: "SEAL",
        children: [
          { name: "Retentores Radiais", level: "SUBFAMILY", technicalCode: "SEAL-RAD" },
          { name: "Retentores Axiais", level: "SUBFAMILY", technicalCode: "SEAL-AX" },
          { name: "Retentores V-Ring", level: "SUBFAMILY", technicalCode: "SEAL-VRING" },
        ],
      },
      {
        name: "O-Rings",
        level: "TYPE",
        technicalCode: "ORING",
        children: [
          { name: "O-Rings Métricos", level: "SUBFAMILY", technicalCode: "ORING-MET" },
          { name: "O-Rings Polegada", level: "SUBFAMILY", technicalCode: "ORING-INCH" },
        ],
      },
      {
        name: "Juntas",
        level: "TYPE",
        technicalCode: "GSKT",
        children: [
          { name: "Juntas Planas", level: "SUBFAMILY", technicalCode: "GSKT-FLAT" },
          { name: "Juntas Espirais", level: "SUBFAMILY", technicalCode: "GSKT-SPIRAL" },
        ],
      },
    ],
  },
  {
    name: "Lubrificação",
    level: "DOMAIN",
    icon: "🛢️",
    children: [
      {
        name: "Graxas",
        level: "TYPE",
        technicalCode: "GRS",
        children: [
          { name: "Graxas para Rolamentos", level: "SUBFAMILY", technicalCode: "GRS-BRG" },
          { name: "Graxas de Alta Temperatura", level: "SUBFAMILY", technicalCode: "GRS-HT" },
        ],
      },
      {
        name: "Óleos",
        level: "TYPE",
        technicalCode: "OIL",
        children: [
          { name: "Óleos Hidráulicos", level: "SUBFAMILY", technicalCode: "OIL-HYD" },
          { name: "Óleos de Engrenagem", level: "SUBFAMILY", technicalCode: "OIL-GEAR" },
        ],
      },
    ],
  },
  {
    name: "Ferramentas de Montagem",
    level: "DOMAIN",
    icon: "🔨",
    children: [
      {
        name: "Sacadores",
        level: "TYPE",
        technicalCode: "PULL",
      },
      {
        name: "Aquecedores de Indução",
        level: "TYPE",
        technicalCode: "HEAT",
      },
      {
        name: "Instrumentos de Medição",
        level: "TYPE",
        technicalCode: "MEAS",
      },
    ],
  },
];

// ==========================================
// ATTRIBUTE DEFINITIONS
// ==========================================

interface AttributeSeed {
  name: string;
  key: string;
  dataType: AttributeDataType;
  unit?: string;
  description?: string;
  enumOptions?: string[];
}

const ATTRIBUTES: AttributeSeed[] = [
  // Dimensional
  { name: "Diâmetro Interno (d)", key: "bore_diameter", dataType: "FLOAT", unit: "mm", description: "Diâmetro do furo do rolamento" },
  { name: "Diâmetro Externo (D)", key: "outside_diameter", dataType: "FLOAT", unit: "mm", description: "Diâmetro externo do rolamento" },
  { name: "Largura (B)", key: "width", dataType: "FLOAT", unit: "mm", description: "Largura do rolamento" },
  { name: "Comprimento", key: "length", dataType: "FLOAT", unit: "mm" },
  { name: "Peso", key: "weight", dataType: "FLOAT", unit: "kg" },

  // Performance
  { name: "Capacidade de Carga Dinâmica (C)", key: "dynamic_load_rating", dataType: "FLOAT", unit: "kN", description: "Carga dinâmica básica" },
  { name: "Capacidade de Carga Estática (C₀)", key: "static_load_rating", dataType: "FLOAT", unit: "kN", description: "Carga estática básica" },
  { name: "Velocidade Limite (graxa)", key: "speed_limit_grease", dataType: "FLOAT", unit: "rpm" },

  // Classification
  { name: "Folga Interna", key: "internal_clearance", dataType: "ENUM", enumOptions: ["C2", "CN", "C3", "C4", "C5"], description: "Grupo de folga interna radial" },
  { name: "Tipo de Vedação", key: "sealing_type", dataType: "ENUM", enumOptions: ["Aberto", "2RS", "2Z", "2RS1", "2RZ"], description: "Tipo de vedação/blindagem" },

  // Housing/Mancal
  { name: "Diâmetro do Eixo", key: "shaft_diameter", dataType: "FLOAT", unit: "mm" },
  { name: "Altura do Centro", key: "center_height", dataType: "FLOAT", unit: "mm" },
  { name: "Tipo de Fixação", key: "fixing_type", dataType: "ENUM", enumOptions: ["Parafuso de Fixação", "Bucha Cônica", "Excêntrico"], description: "Método de fixação ao eixo" },
  { name: "Tipo de Rolamento", key: "bearing_type", dataType: "STRING", description: "Designação do rolamento compatível" },
  { name: "Tipo de Vedação (Mancal)", key: "seal_type", dataType: "ENUM", enumOptions: ["Feltro", "Labirinto", "Borracha", "Duplo"], description: "Vedação do mancal" },

  // Pulley
  { name: "Número de Canais", key: "groove_count", dataType: "INTEGER", description: "Quantidade de canais da polia" },
  { name: "Perfil da Correia", key: "belt_profile", dataType: "ENUM", enumOptions: ["A", "B", "C", "D", "SPZ", "SPA", "SPB", "SPC", "3V", "5V", "8V"] },
  { name: "Diâmetro Primitivo", key: "pitch_diameter", dataType: "FLOAT", unit: "mm" },
  { name: "Tipo de Bucha", key: "bushing_type", dataType: "ENUM", enumOptions: ["QD", "Taper Lock", "Cônica"] },

  // Universal Joint
  { name: "Diâmetro da Cruzeta", key: "cup_diameter", dataType: "FLOAT", unit: "mm" },
  { name: "Distância entre Centros", key: "center_distance", dataType: "FLOAT", unit: "mm" },
  { name: "Capacidade de Torque", key: "torque_capacity", dataType: "FLOAT", unit: "Nm" },

  // Bushing
  { name: "Tipo de Retenção", key: "retention_type", dataType: "ENUM", enumOptions: ["Parafuso", "Pressão", "Hidráulica"] },
  { name: "Razão de Conicidade", key: "taper_ratio", dataType: "STRING", description: "Ex: 1:12" },
];

// ==========================================
// CATEGORY ↔ ATTRIBUTE BINDINGS
// ==========================================

interface BindingSeed {
  categoryTechnicalCode: string;
  attributeKey: string;
  isRequired: boolean;
  displayOrder: number;
}

const BINDINGS: BindingSeed[] = [
  // Rolamentos (9 atributos, 3 required)
  { categoryTechnicalCode: "BRG", attributeKey: "bore_diameter", isRequired: true, displayOrder: 1 },
  { categoryTechnicalCode: "BRG", attributeKey: "outside_diameter", isRequired: true, displayOrder: 2 },
  { categoryTechnicalCode: "BRG", attributeKey: "width", isRequired: true, displayOrder: 3 },
  { categoryTechnicalCode: "BRG", attributeKey: "dynamic_load_rating", isRequired: false, displayOrder: 4 },
  { categoryTechnicalCode: "BRG", attributeKey: "static_load_rating", isRequired: false, displayOrder: 5 },
  { categoryTechnicalCode: "BRG", attributeKey: "internal_clearance", isRequired: false, displayOrder: 6 },
  { categoryTechnicalCode: "BRG", attributeKey: "sealing_type", isRequired: false, displayOrder: 7 },
  { categoryTechnicalCode: "BRG", attributeKey: "speed_limit_grease", isRequired: false, displayOrder: 8 },
  { categoryTechnicalCode: "BRG", attributeKey: "weight", isRequired: false, displayOrder: 9 },

  // Mancais (5 atributos, 3 required)
  { categoryTechnicalCode: "HSG", attributeKey: "shaft_diameter", isRequired: true, displayOrder: 1 },
  { categoryTechnicalCode: "HSG", attributeKey: "center_height", isRequired: true, displayOrder: 2 },
  { categoryTechnicalCode: "HSG", attributeKey: "fixing_type", isRequired: true, displayOrder: 3 },
  { categoryTechnicalCode: "HSG", attributeKey: "bearing_type", isRequired: false, displayOrder: 4 },
  { categoryTechnicalCode: "HSG", attributeKey: "seal_type", isRequired: false, displayOrder: 5 },

  // Polias (5 atributos, 4 required)
  { categoryTechnicalCode: "PLY", attributeKey: "groove_count", isRequired: true, displayOrder: 1 },
  { categoryTechnicalCode: "PLY", attributeKey: "belt_profile", isRequired: true, displayOrder: 2 },
  { categoryTechnicalCode: "PLY", attributeKey: "pitch_diameter", isRequired: true, displayOrder: 3 },
  { categoryTechnicalCode: "PLY", attributeKey: "bushing_type", isRequired: true, displayOrder: 4 },
  { categoryTechnicalCode: "PLY", attributeKey: "bore_diameter", isRequired: false, displayOrder: 5 },

  // Cardans/Cruzetas (4 atributos, 2 required)
  { categoryTechnicalCode: "UJT", attributeKey: "cup_diameter", isRequired: true, displayOrder: 1 },
  { categoryTechnicalCode: "UJT", attributeKey: "center_distance", isRequired: true, displayOrder: 2 },
  { categoryTechnicalCode: "UJT", attributeKey: "torque_capacity", isRequired: false, displayOrder: 3 },
  { categoryTechnicalCode: "UJT", attributeKey: "weight", isRequired: false, displayOrder: 4 },

  // Buchas (4 atributos, 3 required)
  { categoryTechnicalCode: "BSH", attributeKey: "bore_diameter", isRequired: true, displayOrder: 1 },
  { categoryTechnicalCode: "BSH", attributeKey: "outside_diameter", isRequired: true, displayOrder: 2 },
  { categoryTechnicalCode: "BSH", attributeKey: "retention_type", isRequired: true, displayOrder: 3 },
  { categoryTechnicalCode: "BSH", attributeKey: "taper_ratio", isRequired: false, displayOrder: 4 },
];

// ==========================================
// SEED FUNCTION
// ==========================================

export async function seedCatalogTaxonomy(prisma: PrismaClient): Promise<{
  categories: number;
  attributes: number;
  bindings: number;
}> {
  let categoryCount = 0;
  let attributeCount = 0;
  let bindingCount = 0;

  // 1. Seed categories recursively
  async function createCategory(cat: CategorySeed, parentId: string | null, order: number): Promise<void> {
    const existing = await prisma.productCategory.findFirst({
      where: { technicalCode: cat.technicalCode ?? undefined, slug: slug(cat.name) },
    });

    let categoryId: string;
    if (existing) {
      await prisma.productCategory.update({
        where: { id: existing.id },
        data: { level: cat.level, normReference: cat.normReference, technicalCode: cat.technicalCode, icon: cat.icon },
      });
      categoryId = existing.id;
    } else {
      const created = await prisma.productCategory.create({
        data: {
          name: cat.name,
          slug: slug(cat.name),
          level: cat.level,
          normReference: cat.normReference,
          technicalCode: cat.technicalCode,
          icon: cat.icon,
          parentId,
          order,
          isActive: true,
          isShared: true,
          companyId: null,
        },
      });
      categoryId = created.id;
      categoryCount++;
    }

    if (cat.children) {
      for (let i = 0; i < cat.children.length; i++) {
        await createCategory(cat.children[i], categoryId, i);
      }
    }
  }

  for (let i = 0; i < TAXONOMY.length; i++) {
    await createCategory(TAXONOMY[i], null, i);
  }

  // 2. Seed attribute definitions
  for (const attr of ATTRIBUTES) {
    const existing = await prisma.attributeDefinition.findUnique({ where: { key: attr.key } });
    if (!existing) {
      await prisma.attributeDefinition.create({
        data: {
          name: attr.name,
          key: attr.key,
          dataType: attr.dataType,
          unit: attr.unit,
          enumOptions: attr.enumOptions ?? [],
          description: attr.description,
          isActive: true,
          isShared: true,
          companyId: null,
        },
      });
      attributeCount++;
    }
  }

  // 3. Seed category ↔ attribute bindings
  for (const binding of BINDINGS) {
    const category = await prisma.productCategory.findFirst({
      where: { technicalCode: binding.categoryTechnicalCode },
    });
    const attribute = await prisma.attributeDefinition.findUnique({
      where: { key: binding.attributeKey },
    });

    if (category && attribute) {
      const existing = await prisma.categoryAttribute.findFirst({
        where: { categoryId: category.id, attributeId: attribute.id, companyId: null },
      });

      if (!existing) {
        await prisma.categoryAttribute.create({
          data: {
            categoryId: category.id,
            attributeId: attribute.id,
            isRequired: binding.isRequired,
            displayOrder: binding.displayOrder,
            isShared: true,
            companyId: null,
          },
        });
        bindingCount++;
      }
    }
  }

  return { categories: categoryCount, attributes: attributeCount, bindings: bindingCount };
}
