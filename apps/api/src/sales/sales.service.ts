import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { prisma } from '@coffeeshop/database';
import { CreateSaleDto } from './dto/create-sale.dto';
import { InventoryService } from '../inventory/inventory.service';
import { SalesGateway } from '../websockets/sales.gateway';
import { NacefService } from '../nacef/nacef.service';
import {
  calculateTaxTotals,
  buildNextFiscalMetadata,
  buildVoidHash,
} from '../domains';
import * as crypto from 'crypto';

@Injectable()
export class SalesService {
  private readonly logger = new Logger(SalesService.name);

  constructor(
    private readonly inventoryService: InventoryService,
    private readonly salesGateway: SalesGateway,
    private readonly nacefService: NacefService,
  ) {}

  async createSale(dto: CreateSaleDto): Promise<any> {
    try {
      // Create Sale using a transaction
      const sale = await prisma.$transaction(async (tx) => {
        // 0. Check for restriction
        const storeInfo = await tx.store.findUnique({ where: { id: dto.storeId } });
        if (!storeInfo) throw new Error('Store not found');
        if ((storeInfo as any).isRestricted) {
          throw new Error('ACCES_RESTREINT : Votre accès au POS est restreint en raison d\'un solde négatif. Veuillez alimenter votre wallet.');
        }

        // 1. Fetch product tax rates for calculation
        const productIds = dto.items.map(i => i.productId);
        const dbProducts = await tx.product.findMany({
          where: { id: { in: productIds } },
          select: { id: true, taxRate: true }
        });
        const productTaxRates: Record<string, number> = {};
        for (const p of dbProducts) productTaxRates[p.id] = Number(p.taxRate);

        // 2. Pre-calculate Fiscal Totals (délégué au domaine fiscal)
        const tax = calculateTaxTotals(dto.items, productTaxRates);
        const itemsWithTax = tax.items;
        const totalTtcGlobal = tax.totalTtc;
        const taxBreakdown = tax.taxBreakdown;

        // --- NACEF / FISCAL CHAINING (délégué au domaine fiscal) ---
        let fiscalSecret = (storeInfo as any).fiscalSecret;
        if (!fiscalSecret) {
          fiscalSecret = crypto.randomBytes(32).toString('hex');
          await tx.store.update({ where: { id: dto.storeId }, data: { fiscalSecret } });
        }

        const previousSale = await tx.sale.findFirst({
          where: { storeId: dto.storeId, isFiscal: true },
          orderBy: { sequenceNumber: 'desc' }
        });
        const previousHash = previousSale?.hash || 'GENESIS_HASH';

        const fiscal = buildNextFiscalMetadata({
          storeId: dto.storeId,
          fiscalSecret,
          currentFiscalSequence: (storeInfo as any).currentFiscalSequence,
          previousHash,
          totalTtc: totalTtcGlobal,
        });

        await tx.store.update({
          where: { id: dto.storeId },
          data: { currentFiscalSequence: fiscal.sequenceNumber }
        });
        // -------------------------------

        const newSale = await tx.sale.create({
          data: {
            id: dto.id || undefined,
            storeId: dto.storeId,
            total: totalTtcGlobal,
            totalHt: tax.totalHt,
            totalTax: tax.totalTax,
            taxBreakdown: taxBreakdown as any,
            baristaId: dto.baristaId,
            takenById: dto.takenById || dto.baristaId,
            mode: dto.mode || 'NORMAL',
            sessionId: dto.sessionId,
            terminalId: (dto as any).terminalId || undefined,
            isFiscal: true,
            fiscalNumber: fiscal.fiscalNumber,
            sequenceNumber: fiscal.sequenceNumber,
            fiscalDay: fiscal.fiscalDay,
            previousHash: fiscal.previousHash,
            hashInput: fiscal.hashInput,
            hash: fiscal.hash,
            signature: fiscal.hash,
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
            hash: fiscal.hash
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
      
      // Broadcast to real-time owner dashboard
      this.salesGateway.broadcastSaleCompleted(dto.storeId, sale);

      // NACEF: Sign ticket if fiscal mode is enabled
      try {
        const isReady = await this.nacefService.isStoreReady(dto.storeId);
        if (isReady) {
          const nacefResult = await this.nacefService.signTicket(sale.id);
          if (nacefResult) {
            this.logger.log(`Sale ${sale.id} signed by NACEF. Ticket: ${nacefResult.ticketIdentifier}`);
            // Return sale with NACEF data
            return { ...sale, nacef: nacefResult };
          }
        }
      } catch (nacefError) {
        // Don't fail the sale if NACEF signing fails - log and continue
        this.logger.error(`NACEF signing failed for sale ${sale.id}: ${nacefError.message}`);
      }

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

        // Logic for fiscal void chaining (délégué au domaine fiscal)
        let newHash = null;
        if (sale.isFiscal) {
          const store = await tx.store.findUnique({ where: { id: sale.storeId } });
          const previousSale = await tx.sale.findFirst({
            where: { storeId: sale.storeId, isFiscal: true },
            orderBy: { sequenceNumber: 'desc' }
          });
          const previousHash = previousSale?.hash || 'GENESIS_HASH';
          const voidResult = buildVoidHash({
            fiscalNumber: sale.fiscalNumber,
            previousHash,
            fiscalSecret: store.fiscalSecret || '',
          });
          newHash = voidResult.hash;

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
