/**
 * API Pública - Categorias do Catálogo
 * VIO-891 - API para Portal/E-commerce
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const categories = await prisma.productCategory.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        imageUrl: true,
        parentId: true,
        _count: {
          select: {
            products: {
              where: {
                isPublished: true,
                status: "ACTIVE",
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const formattedCategories = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      imageUrl: cat.imageUrl,
      parentId: cat.parentId,
      productCount: cat._count.products,
    }));

    // Organizar em árvore hierárquica
    const rootCategories = formattedCategories.filter((c) => !c.parentId);
    const childCategories = formattedCategories.filter((c) => c.parentId);

    const categoryTree = rootCategories.map((root) => ({
      ...root,
      children: childCategories.filter((c) => c.parentId === root.id),
    }));

    return NextResponse.json({
      categories: categoryTree,
      flat: formattedCategories,
    }, {
      headers: {
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    console.error("Categories API error:", error);
    return NextResponse.json(
      { error: "Erro ao buscar categorias" },
      { status: 500 }
    );
  }
}
