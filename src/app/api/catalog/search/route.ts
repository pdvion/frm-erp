/**
 * API Pública - Busca Full-text no Catálogo
 * VIO-891 - API para Portal/E-commerce
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));

    if (!q || q.length < 2) {
      return NextResponse.json({
        products: [],
        categories: [],
        suggestions: [],
      });
    }

    const searchTerm = q.toLowerCase();

    const [products, categories] = await Promise.all([
      prisma.product.findMany({
        where: {
          isPublished: true,
          status: "ACTIVE",
          OR: [
            { name: { contains: searchTerm, mode: "insensitive" } },
            { shortDescription: { contains: searchTerm, mode: "insensitive" } },
            { code: { contains: searchTerm, mode: "insensitive" } },
            { tags: { hasSome: [searchTerm] } },
          ],
        },
        select: {
          id: true,
          code: true,
          slug: true,
          name: true,
          shortDescription: true,
          listPrice: true,
          images: {
            where: { isPrimary: true },
            select: { url: true, thumbnailUrl: true },
            take: 1,
          },
          category: {
            select: { name: true, slug: true },
          },
        },
        take: limit,
        orderBy: { name: "asc" },
      }),
      prisma.productCategory.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: searchTerm, mode: "insensitive" } },
            { description: { contains: searchTerm, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          name: true,
          slug: true,
          _count: {
            select: {
              products: {
                where: { isPublished: true, status: "ACTIVE" },
              },
            },
          },
        },
        take: 5,
      }),
    ]);

    const formattedProducts = products.map((p) => ({
      id: p.id,
      code: p.code,
      slug: p.slug,
      name: p.name,
      shortDescription: p.shortDescription,
      listPrice: p.listPrice,
      thumbnail: p.images[0]?.thumbnailUrl || p.images[0]?.url || null,
      category: p.category?.name || null,
    }));

    const formattedCategories = categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      productCount: c._count.products,
    }));

    // Gerar sugestões baseadas nos resultados
    const suggestions = [
      ...new Set([
        ...products.slice(0, 3).map((p) => p.name),
        ...categories.slice(0, 2).map((c) => c.name),
      ]),
    ].slice(0, 5);

    return NextResponse.json({
      products: formattedProducts,
      categories: formattedCategories,
      suggestions,
      query: q,
      totalProducts: products.length,
      totalCategories: categories.length,
    }, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
      },
    });
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { error: "Erro na busca" },
      { status: 500 }
    );
  }
}
