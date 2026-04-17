import { Injectable } from '@nestjs/common';
import { prisma } from '@coffeeshop/database';

@Injectable()
export class ProductsService {
  async getProducts(storeId?: string): Promise<any[]> {
    return prisma.product.findMany({
      where: {
        AND: [
          storeId ? { storeId } : {},
          { active: true }
        ]
      },
      include: {
        category: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
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
