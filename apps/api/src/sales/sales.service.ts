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
        // 1. Fetch product tax rates for calculation
        const productIds = dto.items.map(i => i.productId);
        const dbProducts = await tx.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, taxRate: true }
        });
        const productMap = new Map(dbProducts.map(p => [p.id, Number(p.taxRate)]));

        // 2. Pre-calculate Fiscal Totals
        let totalHtGlobal = 0;
        let totalTaxGlobal = 0;
        const taxBreakdown: Record<string, number> = {};

        const itemsWithTax = dto.items.map(item => {
          const taxRate = productMap.get(item.productId) ?? 0.19;
          const unitPriceHt = item.price / (1 + taxRate);
          const itemTotalHt = unitPriceHt * item.quantity;
          const itemTaxAmount = itemTotalHt * taxRate;

          totalHtGlobal += itemTotalHt;
          totalTaxGlobal += itemTaxAmount;

          const rateLabel = `${Math.round(taxRate * 100)}%`;
          taxBreakdown[rateLabel] = (taxBreakdown[rateLabel] || 0) + itemTaxAmount;

          return {
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            unitPriceHt: Math.round(unitPriceHt * 1000) / 1000,
            taxRate: taxRate,
            taxAmount: Math.round(itemTaxAmount * 1000) / 1000,
            totalHt: Math.round(itemTotalHt * 1000) / 1000,
            totalTtc: Math.round((itemTotalHt + itemTaxAmount) * 1000) / 1000,
          };
        });

        const newSale = await tx.sale.create({
          data: {
            id: dto.id || undefined,
            storeId: dto.storeId,
            total: dto.total,
            totalHt: Math.round(totalHtGlobal * 1000) / 1000,
            totalTax: Math.round(totalTaxGlobal * 1000) / 1000,
            taxBreakdown: taxBreakdown as any,
            baristaId: dto.baristaId,
            takenById: dto.takenById || dto.baristaId,
            mode: dto.mode || 'NORMAL',
            sessionId: dto.sessionId,
            items: {
              create: itemsWithTax
            }
          },
          include: { items: true }
        });

        // 4. Create Session Log if in RACHMA mode (closing session)
        if (dto.mode === 'RACHMA' && dto.baristaId) {
          await tx.staffSessionLog.create({
            data: {
              userId: dto.baristaId,
              storeId: dto.storeId,
              action: `SYNC_CLOSE_SESSION:${dto.sessionId || 'UNKNOWN'}`
            }
          });
        }

        return newSale;
      });

      // Deduct stock for all items
      for (const item of sale.items) {
        await this.inventoryService.deductStockFromProduct(item.productId, item.quantity, dto.storeId);
      }

      // Deduct raw stock items (packagings etc)
      if (dto.rawStockItems && dto.rawStockItems.length > 0) {
        for (const raw of dto.rawStockItems) {
          await this.inventoryService.deductStockItem(raw.stockItemId, raw.quantity, dto.storeId);
        }
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
