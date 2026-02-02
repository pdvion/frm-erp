/**
 * API Pública - Produtos em Destaque
 * VIO-891 - API para Portal/E-commerce
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(20, Math.max(1, parseInt(searchParams.get("limit") || "8", 10)));

    const products = await prisma.product.findMany({
      where: {
        isPublished: true,
        status: "active",
        featuredOrder: { not: null },
      },
      include: {
        images: {
          where: { isPrimary: true },
          take: 1,
        },
        category: true,
      },
      take: limit,
      orderBy: [{ featuredOrder: "asc" }, { updatedAt: "desc" }],
    });

    const formattedProducts = products.map((p) => ({
      id: p.id,
      code: p.code,
      slug: p.slug,
      name: p.name,
      shortDescription: p.shortDescription,
      listPrice: p.listPrice,
      salePrice: p.salePrice,
      hasDiscount: p.salePrice !== null && p.listPrice !== null && Number(p.salePrice) < Number(p.listPrice),
      discountPercent: p.salePrice && p.listPrice && Number(p.salePrice) < Number(p.listPrice)
        ? Math.round(((Number(p.listPrice) - Number(p.salePrice)) / Number(p.listPrice)) * 100)
        : null,
      image: p.images[0] || null,
      category: p.category,
    }));

    return NextResponse.json({
      products: formattedProducts,
      total: formattedProducts.length,
    }, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    console.error("Featured API error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar produtos em destaque" },
      { status: 500 }
    );
  }
}
