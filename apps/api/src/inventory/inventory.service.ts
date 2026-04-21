import { Injectable, Logger } from '@nestjs/common';
import { prisma } from '@coffeeshop/database';
import { SourcingService } from '../sourcing/sourcing.service';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(private readonly sourcingService: SourcingService) {}

  /**
   * Deduct stock for a specific product logically using its recipe items.
   */
  async deductStockFromProduct(productId: string, quantitySold: number, storeId: string) {
    const productRecipes = await prisma.recipeItem.findMany({
      where: { productId },
      include: { stockItem: true },
    });

    if (productRecipes.length === 0) {
      this.logger.warn(`No recipe found for product ${productId}. Skipping stock deduction.`);
      return;
    }

    for (const recipeItem of productRecipes) {
      await this.deductStockItem(recipeItem.stockItemId, Number(recipeItem.quantity) * quantitySold, storeId);
    }
  }

  /**
   * Directly deducts a specific stock item from inventory.
   */
  async deductStockItem(stockItemId: string, quantityToDeduct: number, storeId: string) {
    const updatedStockItem = await prisma.stockItem.update({
      where: { id: stockItemId },
      data: {
        quantity: { decrement: quantityToDeduct }
      },
      include: { unit: true }
    });

    // Simple low-stock alert trigger
    if (Number(updatedStockItem.quantity) <= Number(updatedStockItem.minThreshold)) {
      await this.triggerLowStockAlert(updatedStockItem);
    }
  }

  private async triggerLowStockAlert(stockItem: any) {
    this.logger.log(`🚨 LOW STOCK ALERT: ${stockItem.name} at Store ${stockItem.storeId} has reached ${stockItem.quantity} ${stockItem.unit?.name || ''}`);
    
    // Auto-generate B2B Draft Order to Supplier
    await this.sourcingService.generateDraftOrder(
      stockItem.id,
      Number(stockItem.quantity),
      stockItem.storeId
    );
  }
}
