import { Controller, Get, Query } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async findAll(@Query('storeId') storeId: string) {
    const products = await this.productsService.getProducts(storeId);
    
    // Map to mobile store format
    return products.map(p => ({
      id: p.id,
      name: p.name,
      price: Number(p.price),
      categoryId: p.categoryId,
      categoryName: p.category?.name,
      // Assign deterministic color based on category
      color: this.getCategoryColor(p.category?.name || 'default')
    }));
  }

  @Get('categories')
  async getCategories() {
    return this.productsService.getCategories();
  }

  private getCategoryColor(name: string): string {
    const colors: Record<string, string> = {
      'Cafe': '#8B4513',
      'Cafés & Chaud': '#8B4513',
      'Drinks': '#3B82F6',
      'Boissons': '#3B82F6',
      'Rafraîchissements': '#3B82F6',
      'Tea': '#10B981',
      'Thé': '#10B981',
      'Food': '#F59E0B',
      'Nourriture': '#F59E0B',
      'Pâtisserie': '#E91E63',
      'Coffee': '#3E2723',
    };
    return colors[name] || '#607D8B';
  }
}

