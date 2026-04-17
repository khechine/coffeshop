import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { prisma } from '@coffeeshop/database';
import { CreateSaleDto } from './dto/create-sale.dto';
import { InventoryService } from '../inventory/inventory.service';

@Injectable()
export class SalesService {
  private readonly logger = new Logger(SalesService.name);

  constructor(private readonly inventoryService: InventoryService) {}

  async createSale(dto: CreateSaleDto): Promise<any> {
    try {
      // Create Sale using a transaction
      const sale = await prisma.$transaction(async (tx) => {
        const newSale = await tx.sale.create({
          data: {
            id: dto.id || undefined, // Allow client-generated ID
            storeId: dto.storeId,
            total: dto.total,
            baristaId: dto.baristaId,
            takenById: dto.takenById || dto.baristaId,
            mode: dto.mode || 'NORMAL',
            items: {
              create: dto.items.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                price: item.price,
              }))
            }
          },
          include: { items: true }
        });

        return newSale;
      });

      // Deduct stock for all items
      // (Done outside transaction since it loops through sub-queries and updates)
      // In a real-world high volume scenario, we could optimize this, but this works well.
      for (const item of sale.items) {
        await this.inventoryService.deductStockFromProduct(item.productId, item.quantity, dto.storeId);
      }

      this.logger.log(`Sale ${sale.id} completed. Total: ${sale.total}`);
      return sale;

    } catch (error) {
      this.logger.error(`Error processing sale: ${error.message}`);
      throw new BadRequestException('Could not process the sale');
    }
  }

  async updatePreparationStatus(
    saleId: string, 
    status: string, 
    preparedById: string, 
    preparationStation?: string
  ): Promise<any> {
    try {
      return await prisma.sale.update({
        where: { id: saleId },
        data: {
          preparationStatus: status,
          preparedById,
          preparedAt: status === 'READY' || status === 'SERVED' ? new Date() : undefined,
          preparationStation: preparationStation || undefined
        },
        include: { 
          items: { include: { product: true } },
          barista: { select: { name: true } }
        }
      });
    } catch (error) {
      this.logger.error(`Error updating preparation status: ${error.message}`);
      throw new BadRequestException('Could not update preparation status');
    }
  }

  async getSales(storeId: string): Promise<any> {
    return prisma.sale.findMany({
      where: { storeId },
      include: { 
        items: { include: { product: true } },
        barista: { select: { name: true } },
        takenBy: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
  }

  async getSalesHistory(storeId: string, filters: { 
    baristaId?: string, 
    startDate?: string, 
    endDate?: string, 
    mode?: string 
  }): Promise<any> {
    const where: any = { storeId };
    
    if (filters.baristaId) {
      where.baristaId = filters.baristaId;
    }
    
    if (filters.mode) {
      where.mode = filters.mode;
    }
    
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        // Make sure it includes the whole end day if needed, but client usually sends ISO
        where.createdAt.lte = new Date(filters.endDate);
      }
    }

    return prisma.sale.findMany({
      where,
      include: {
        items: { include: { product: true } },
        barista: { select: { name: true } },
        takenBy: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

}
