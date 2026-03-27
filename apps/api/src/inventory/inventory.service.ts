import { Injectable, Logger } from '@nestjs/common';
import { prisma } from '@coffeeshop/database';
import { SourcingService } from '../sourcing/sourcing.service';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(private readonly sourcingService: SourcingService) {}

  /**
   * Deducts stock for a specific product logically using its recipe items.
   * e.g., for an Express (Product), it will deduct 0.018kg of coffee beans and 1 cup (StockItems).
   */
  async deductStockFromProduct(productId: string, quantitySold: number, storeId: string) {
    // Find recipes linked to this product
    const productRecipes = await prisma.recipeItem.findMany({
      where: { productId },
      include: { stockItem: true },
    });

    if (productRecipes.length === 0) {
      this.logger.warn(`No recipe found for product ${productId}. Skipping stock deduction.`);
      return;
    }

    // Multiply the recipe component quantity by the amount sold and update the stock
    for (const recipeItem of productRecipes) {
      const quantityToDeduct = Number(recipeItem.quantity) * quantitySold;
      
      const updatedStockItem = await prisma.stockItem.update({
        where: { id: recipeItem.stockItemId },
        data: {
          quantity: { decrement: quantityToDeduct }
        }
      });

      // Simple low-stock alert trigger
      if (Number(updatedStockItem.quantity) <= Number(updatedStockItem.minThreshold)) {
        await this.triggerLowStockAlert(updatedStockItem);
      }
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
