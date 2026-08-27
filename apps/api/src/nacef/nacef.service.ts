import { Injectable, Logger } from '@nestjs/common';
import { prisma } from '@coffeeshop/database';
import { NacefClient } from './nacef-client';
import { NacefTicketBuilder, NacefTicket } from './nacef-ticket.builder';
import { dtToMillimes } from './nacef.helpers';

@Injectable()
export class NacefService {
  private readonly logger = new Logger(NacefService.name);

  constructor(
    private readonly nacefClient: NacefClient,
    private readonly ticketBuilder: NacefTicketBuilder,
  ) {}

  /**
   * Initialize NACEF for a store:
   * 1. Verify S-MDF URL is configured
   * 2. Request certificate
   * 3. Get manifest
   * 4. Sync S-MDF
   */
  async initialize(storeId: string, cashRegisterInfo: { model: string; serialNumber: string; version: string }) {
    this.logger.log(`Initializing NACEF for store ${storeId}`);

    // Step 0: Verify S-MDF URL is configured
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { smdfUrl: true },
    });
    if (!store?.smdfUrl) {
      throw new Error(`S-MDF URL not configured for store ${storeId}. Use POST /nacef/config/:storeId first.`);
    }

    // Step 1: Request certificate
    const certResult = await this.nacefClient.requestCertificate(
      { cashRegisterInfo },
      storeId,
    );

    // Step 2: Get manifest to check status
    const manifest = await this.nacefClient.getManifest(storeId);

    // Step 3: Sync if status allows
    if (manifest.status?.includes('4:') || manifest.status?.includes('5:')) {
      const syncResult = await this.nacefClient.syncRequest(
        { requestPINupdate: false },
        storeId,
      );

      await prisma.store.update({
        where: { id: storeId },
        data: {
          nacefSyncStatus: 'SYNCED',
          nacefLastSyncAt: new Date(),
        },
      });

      return { certResult, manifest, syncResult };
    }

    return { certResult, manifest };
  }

  /**
   * Sign a ticket before printing
   * This is the core NACEF operation
   */
  async signTicket(saleId: string): Promise<{
    ticketIdentifier: string;
    qrcodeImage: string;
    nacefTicket: NacefTicket;
  } | null> {
    // Fetch sale with all needed data
    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        items: {
          include: { product: true },
        },
        store: true,
        barista: { select: { name: true, id: true } },
        customer: true,
      },
    });

    if (!sale) {
      this.logger.error(`Sale ${saleId} not found`);
      return null;
    }

    if (!sale.store.isFiscalEnabled) {
      this.logger.warn(`Fiscal mode not enabled for store ${sale.storeId}`);
      return null;
    }

    // Check if already synced
    if (sale.nacefTicketId) {
      this.logger.warn(`Sale ${saleId} already signed with NACEF ticket ${sale.nacefTicketId}`);
      return null;
    }

    try {
      // Build NACEF ticket payload
      const nacefTicket = this.ticketBuilder.buildTicket(sale, sale.store, sale.items);
      const base64Ticket = this.ticketBuilder.toBase64(nacefTicket);

      // Send to S-MDF for signing
      const signedResult = await this.nacefClient.signTicket(
        {
          base64Ticket,
          totalHT: dtToMillimes(Number(sale.totalHt) || 0),
          totalTax: dtToMillimes(Number(sale.totalTax) || 0),
          operationType: nacefTicket.transaction.operation.op_type,
          transactionType: nacefTicket.transaction.operation.context,
        },
        sale.storeId,
      );

      // Update sale with NACEF data
      await prisma.sale.update({
        where: { id: saleId },
        data: {
          nacefTicketId: signedResult.ticketIdentifier,
          nacefQrCode: signedResult.qrcodeImage,
          nacefSyncedAt: new Date(),
          nacefOperationType: nacefTicket.transaction.operation.op_type,
          nacefContext: nacefTicket.transaction.operation.context,
        },
      });

      this.logger.log(`Sale ${saleId} signed by NACEF. Ticket ID: ${signedResult.ticketIdentifier}`);

      return {
        ticketIdentifier: signedResult.ticketIdentifier,
        qrcodeImage: signedResult.qrcodeImage,
        nacefTicket,
      };
    } catch (error) {
      this.logger.error(`Failed to sign sale ${saleId}: ${error.message}`);

      // Log the failure
      await this.nacefClient.registerLog(
        {
          module: 'SMDF',
          operation: 'SIGN_REQUEST',
          level: 'ERROR',
          message: `Failed to sign sale ${saleId}: ${error.message}`,
        },
        sale.storeId,
      );

      return null;
    }
  }

  /**
   * Get current S-MDF manifest for a store
   */
  async getManifest(storeId: string) {
    return this.nacefClient.getManifest(storeId);
  }

  /**
  /**
   * Sync S-MDF
   */
  async sync(storeId: string, options?: { requestPINupdate?: boolean; updateSMDFURL?: boolean }) {
    const dto = {
      requestPINupdate: options?.requestPINupdate || false,
      updateSMDFURL: options?.updateSMDFURL || false,
    };
    const result = await this.nacefClient.syncRequest(dto, storeId);

    await prisma.store.update({
      where: { id: storeId },
      data: {
        nacefSyncStatus: 'SYNCED',
        nacefLastSyncAt: new Date(),
      },
    });

    return result;
  }

  /**
   * Log an event to the S-MDF audit trail
   */
  async logEvent(storeId: string, module: string, operation: string, level: string, message: string) {
    return this.nacefClient.registerLog(
      { module, operation, level, message },
      storeId,
    );
  }

  /**
   * Check if a store is ready for NACEF signing
   * Validates all mandatory NACEF field length/format constraints.
   */
  async isStoreReady(storeId: string): Promise<boolean> {
    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store || !store.isFiscalEnabled) return false;
    if (!store.smdfUrl) return false;

    // [E0204-GAP-2] IMDF length must be 14-16 chars
    if (!store.imdf || store.imdf.length < 14 || store.imdf.length > 16) return false;

    // [E0205-GAP-1] Matricule Fiscal format: 7 digits + 1 uppercase letter
    if (!store.matriculeFiscal || !/^\d{7}[A-Z]$/.test(store.matriculeFiscal)) return false;

    // [E0204-GAP-3] Accreditation reference must be 8-32 chars
    if (!store.accreditationReference || store.accreditationReference.length < 8 || store.accreditationReference.length > 32) return false;

    if (store.nacefSyncStatus !== 'SYNCED') return false;
    return true;
  }

  /**
   * Configure NACEF settings for a store
   */
  async configureStore(storeId: string, config: {
    smdfUrl: string;
    imdf?: string;
    matriculeFiscal?: string;
    establishmentReference?: string;
    commercialName?: string;
    accreditationReference?: string;
  }) {
    const updateData: any = {
      smdfUrl: config.smdfUrl,
    };

    if (config.imdf) updateData.imdf = config.imdf;
    if (config.matriculeFiscal) updateData.matriculeFiscal = config.matriculeFiscal;
    if (config.establishmentReference) updateData.establishmentReference = config.establishmentReference;
    if (config.commercialName) updateData.commercialName = config.commercialName;
    if (config.accreditationReference) updateData.accreditationReference = config.accreditationReference;

    await prisma.store.update({
      where: { id: storeId },
      data: updateData,
    });

    this.logger.log(`NACEF configured for store ${storeId}`);

    return {
      success: true,
      message: 'Configuration NACEF mise à jour.',
      storeId,
    };
  }
}
