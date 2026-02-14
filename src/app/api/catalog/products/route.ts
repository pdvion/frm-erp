/**
 * API Pública - Catálogo de Produtos
 * VIO-891 - API para Portal/E-commerce
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

interface CatalogQuery {
  search?: string;
  category?: string;
  tags?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: "name" | "price" | "newest";
  order?: "asc" | "desc";
  page?: string;
  limit?: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const query: CatalogQuery = {
      search: searchParams.get("search") || undefined,
      category: searchParams.get("category") || undefined,
      tags: searchParams.get("tags") || undefined,
      minPrice: searchParams.get("minPrice") || undefined,
      maxPrice: searchParams.get("maxPrice") || undefined,
      sort: (searchParams.get("sort") as CatalogQuery["sort"]) || undefined,
      order: (searchParams.get("order") as CatalogQuery["order"]) || undefined,
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "20",
    };

    const page = Math.max(1, parseInt(query.page || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit || "20", 10)));
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {
      isPublished: true,
      status: "ACTIVE",
    };

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { shortDescription: { contains: query.search, mode: "insensitive" } },
        { code: { contains: query.search, mode: "insensitive" } },
      ];
    }

    if (query.category) {
      where.category = {
        OR: [
          { slug: query.category },
          { id: query.category },
        ],
      };
    }

    if (query.tags) {
      const tagList = query.tags.split(",").map((t) => t.trim());
      where.tags = { hasSome: tagList };
    }

    if (query.minPrice) {
      where.listPrice = { gte: parseFloat(query.minPrice) };
    }

    if (query.maxPrice) {
      where.listPrice = {
        ...(where.listPrice as Prisma.FloatFilter || {}),
        lte: parseFloat(query.maxPrice),
      };
    }

    let orderBy: Prisma.ProductOrderByWithRelationInput = { name: "asc" };
    if (query.sort === "price") {
      orderBy = { listPrice: query.order || "asc" };
    } else if (query.sort === "newest") {
      orderBy = { createdAt: "desc" };
    } else if (query.sort === "name") {
      orderBy = { name: query.order || "asc" };
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
          images: {
            select: {
              id: true,
              url: true,
              thumbnailUrl: true,
              alt: true,
              isPrimary: true,
            },
            orderBy: [{ isPrimary: "desc" }, { order: "asc" }],
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    const formattedProducts = products.map((product) => ({
      id: product.id,
      code: product.code,
      slug: product.slug,
      name: product.name,
      shortDescription: product.shortDescription,
      listPrice: product.listPrice,
      salePrice: product.salePrice,
      category: product.category,
      tags: product.tags,
      images: product.images,
      primaryImage: product.images.find((img) => img.isPrimary) || product.images[0] || null,
    }));

    return NextResponse.json({
      products: formattedProducts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    }, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    console.error("Catalog API error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar produtos" },
      { status: 500 }
    );
  }
}
