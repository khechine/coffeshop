import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { prisma } from '@coffeeshop/database';
import { CreateSaleDto } from './dto/create-sale.dto';
import { InventoryService } from '../inventory/inventory.service';
import * as crypto from 'crypto';

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

        // --- NACEF / FISCAL CHAINING ---
        const store = await tx.store.findUnique({ where: { id: dto.storeId } });
        if (!store) throw new Error('Store not found');

        let fiscalSecret = store.fiscalSecret;
        if (!fiscalSecret) {
          fiscalSecret = crypto.randomBytes(32).toString('hex');
          await tx.store.update({ where: { id: dto.storeId }, data: { fiscalSecret } });
        }

        const currentSeq = store.currentFiscalSequence + 1;
        const fiscalNumber = `FAC-${new Date().getFullYear()}-${String(currentSeq).padStart(6, '0')}`;
        const totalTtcGlobal = Math.round((totalHtGlobal + totalTaxGlobal) * 1000) / 1000;
        const timestampIso = new Date().toISOString();

        const previousSale = await tx.sale.findFirst({
          where: { storeId: dto.storeId, isFiscal: true },
          orderBy: { sequenceNumber: 'desc' }
        });
        const previousHash = previousSale?.hash || 'GENESIS_HASH';

        const hashInput = `${dto.storeId}|${fiscalNumber}|${totalTtcGlobal}|${timestampIso}|${previousHash}`;
        const signature = crypto.createHmac('sha256', fiscalSecret).update(hashInput).digest('hex');

        await tx.store.update({ 
          where: { id: dto.storeId }, 
          data: { currentFiscalSequence: currentSeq } 
        });
        // -------------------------------

        const newSale = await tx.sale.create({
          data: {
            id: dto.id || undefined,
            storeId: dto.storeId,
            total: totalTtcGlobal,
            totalHt: Math.round(totalHtGlobal * 1000) / 1000,
            totalTax: Math.round(totalTaxGlobal * 1000) / 1000,
            taxBreakdown: taxBreakdown as any,
            baristaId: dto.baristaId,
            takenById: dto.takenById || dto.baristaId,
            mode: dto.mode || 'NORMAL',
            sessionId: dto.sessionId,
            terminalId: (dto as any).terminalId || undefined,
            isFiscal: true,
            fiscalNumber: fiscalNumber,
            sequenceNumber: currentSeq,
            fiscalDay: timestampIso.split('T')[0],
            previousHash: previousHash,
            hashInput: hashInput,
            hash: signature,
            signature: signature,
            items: {
              create: itemsWithTax
            }
          },
          include: { items: true }
        });

        // Create Fiscal Audit Log
        await tx.fiscalLog.create({
          data: {
            saleId: newSale.id,
            action: 'CREATE_TICKET',
            hash: signature
          }
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

  async cancelSale(saleId: string, canceledById: string): Promise<any> {
    try {
      return await prisma.$transaction(async (tx) => {
        const sale = await tx.sale.findUnique({ where: { id: saleId } });
        if (!sale) throw new Error('Sale not found');
        if (sale.isVoid) throw new Error('Sale is already voided');

        // Logic for fiscal void chaining
        let newHash = null;
        if (sale.isFiscal) {
          const store = await tx.store.findUnique({ where: { id: sale.storeId } });
          const previousSale = await tx.sale.findFirst({
            where: { storeId: sale.storeId, isFiscal: true },
            orderBy: { sequenceNumber: 'desc' }
          });
          const previousHash = previousSale?.hash || 'GENESIS_HASH';
          const cancelInput = `VOID|${sale.fiscalNumber}|${new Date().toISOString()}|${previousHash}`;
          newHash = crypto.createHmac('sha256', store.fiscalSecret || '').update(cancelInput).digest('hex');

          await tx.fiscalLog.create({
            data: {
              saleId: sale.id,
              action: 'CANCEL_TICKET',
              hash: newHash,
              data: { canceledById }
            }
          });
        }

        const updated = await tx.sale.update({
          where: { id: saleId },
          data: {
            isVoid: true,
            // we could store the voidHash somewhere if needed, but FiscalLog is enough
          }
        });

        // Optionally, refund stock here depending on rules

        return updated;
      });
    } catch (error) {
      this.logger.error(`Error canceling sale: ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }

}
