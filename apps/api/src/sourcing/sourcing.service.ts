import { Injectable, Logger } from '@nestjs/common';
import { prisma } from '@coffeeshop/database';
import { WhatsappService } from '../whatsapp/whatsapp.service';

@Injectable()
export class SourcingService {
  private readonly logger = new Logger(SourcingService.name);

  constructor(private readonly whatsappService: WhatsappService) {}

  /**
   * Generates a draft order perfectly fitted when a stock item drops below threshold.
   */
  async generateDraftOrder(stockItemId: string, currentQuantity: number, storeId: string) {
    // Check if there's already a pending order for this store
    const existingDraft = await prisma.supplierOrder.findFirst({
      where: {
        storeId,
        status: 'PENDING',
      },
    });

    const stockItem = await prisma.stockItem.findUnique({ where: { id: stockItemId }, include: { unit: true } });
    if (!stockItem) return;

    // Find a supplier (for MVP, we just pick the first one available)
    const supplier = await prisma.supplier.findFirst();

    if (!supplier) {
      this.logger.warn('No supplier found in the database. Please add a vendor.');
      return;
    }

    // Default target reorder quantity: let's reorder 10 * minThreshold to be safe
    const reorderAmount = Number(stockItem.minThreshold) * 10;
    // Dummy standard pricing for the supplier
    const pricePerUnit = 5.0; 

    if (existingDraft) {
      // Append to the draft
      await prisma.supplierOrderItem.create({
        data: {
          orderId: existingDraft.id,
          stockItemId: stockItem.id,
          quantity: reorderAmount,
          price: pricePerUnit
        }
      });
      // Update order total
      await prisma.supplierOrder.update({
        where: { id: existingDraft.id },
        data: { total: { increment: reorderAmount * pricePerUnit } }
      });
      this.logger.log(`Appended ${reorderAmount} ${(stockItem.unit as any)?.name || ''} of ${stockItem.name} to existing Draft Order #${existingDraft.id}`);

      await this.whatsappService.sendB2BDraftOrder(
        supplier.phone || '',
        supplier.name,
        'Central Perk Tunis',
        existingDraft.id,
        `- ${reorderAmount} ${(stockItem.unit as any)?.name || ''} de ${stockItem.name} (Ajouté au panier en attente)`
      );

    } else {
      // Create a new draft
      const newDraft = await prisma.supplierOrder.create({
        data: {
          storeId,
          supplierId: supplier.id,
          status: 'PENDING',
          total: reorderAmount * pricePerUnit,
          items: {
            create: [
              {
                stockItemId: stockItem.id,
                quantity: reorderAmount,
                price: pricePerUnit
              }
            ]
          }
        }
      });
      this.logger.log(`Created new Draft Supplier Order #${newDraft.id} for ${stockItem.name}. Whatsapp notification to supplier pending...`);

      await this.whatsappService.sendB2BDraftOrder(
        supplier.phone || '',
        supplier.name,
        'Central Perk Tunis',
        newDraft.id,
        `- ${reorderAmount} ${(stockItem.unit as any)?.name || ''} de ${stockItem.name}`
      );
    }
  }
}
