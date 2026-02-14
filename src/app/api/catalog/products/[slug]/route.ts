/**
 * API Pública - Detalhes do Produto
 * VIO-891 - API para Portal/E-commerce
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    const product = await prisma.product.findFirst({
      where: {
        OR: [
          { slug },
          { id: slug },
        ],
        isPublished: true,
        status: "ACTIVE",
      },
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
            order: true,
          },
          orderBy: [{ isPrimary: "desc" }, { order: "asc" }],
        },
        videos: {
          select: {
            id: true,
            url: true,
            title: true,
            type: true,
          },
        },
        attachments: {
          select: {
            id: true,
            url: true,
            fileName: true,
            type: true,
          },
        },
        material: {
          select: {
            id: true,
            code: true,
            ncm: true,
            unit: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Produto não encontrado" },
        { status: 404 }
      );
    }

    const response = {
      id: product.id,
      code: product.code,
      slug: product.slug,
      name: product.name,
      shortDescription: product.shortDescription,
      description: product.description,
      specifications: product.specifications,
      listPrice: product.listPrice,
      salePrice: product.salePrice,
      category: product.category,
      tags: product.tags,
      images: product.images,
      videos: product.videos,
      attachments: product.attachments,
      material: product.material ? {
        code: product.material.code,
        ncm: product.material.ncm,
        unit: product.material.unit,
      } : null,
      seo: {
        metaTitle: product.metaTitle,
        metaDescription: product.metaDescription,
      },
    };

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
      },
    });
  } catch (error) {
    console.error("Catalog API error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar produto" },
      { status: 500 }
    );
  }
}
