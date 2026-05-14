import { NextResponse } from 'next/server';
import { prisma } from '@coffeeshop/database';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('categoryId');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');

    const whereClause: any = {
      isApproved: true,
      stockStatus: { not: 'OUT_OF_STOCK' }, // Optionnel, selon les règles métier
    };

    if (categoryId) {
      whereClause.categoryId = categoryId;
    }

    if (search) {
      whereClause.name = {
        contains: search,
        mode: 'insensitive',
      };
    }

    const [products, total] = await Promise.all([
      prisma.vendorProduct.findMany({
        where: whereClause,
        include: {
          vendor: {
            select: { id: true, companyName: true, image: true }
          },
          category: {
            select: { id: true, name: true }
          }
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.vendorProduct.count({ where: whereClause })
    ]);

    return NextResponse.json({
      success: true,
      data: products.map((p: any) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        unit: p.unit,
        image: p.image,
        description: p.description,
        isBundle: p.isBundle,
        vendor: p.vendor,
        category: p.category
      })),
      meta: {
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Marketplace API Error:', error);
    return NextResponse.json({ success: false, error: 'Erreur interne du serveur' }, { status: 500 });
  }
}
