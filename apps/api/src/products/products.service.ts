import { Injectable } from '@nestjs/common';
import { prisma } from '@coffeeshop/database';

@Injectable()
export class ProductsService {
  async getProducts(storeId?: string): Promise<any[]> {
    const products = await prisma.product.findMany({
      where: {
        AND: [
          storeId ? { storeId } : {},
          { active: true }
        ]
      },
      include: {
        category: true,
        recipe: {
          include: {
            stockItem: true
          }
        }
      },
      orderBy: {
        name: 'asc',
      },
    });

    return products.map(p => ({
      ...p,
      price: Number(p.price)
    }));
  }


  async getCategories(): Promise<any[]> {
    return prisma.category.findMany({
      where: { active: true },
      orderBy: {
        name: 'asc',
      },
    });
  }
}
