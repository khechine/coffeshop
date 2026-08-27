import { Injectable, Logger } from '@nestjs/common';
import { prisma } from '@coffeeshop/database';
import { SyncRequestDto } from './dto/sync-request.dto';
import { CertificateRequestDto } from './dto/certificate-request.dto';
import { LogEntryDto } from './dto/log-entry.dto';

@Injectable()
export class NacefClient {
  private readonly logger = new Logger(NacefClient.name);

  constructor() {}

  /**
   * Get the S-MDF base URL for a specific store.
   * Each store has its own S-MDF agent with its own certificate.
   */
  private async getSmdfUrl(storeId: string): Promise<string> {
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { smdfUrl: true },
    });

    if (!store?.smdfUrl) {
      throw new Error(`S-MDF URL not configured for store ${storeId}. Set store.smdfUrl first.`);
    }

    return store.smdfUrl;
  }

  private async logToStore(storeId: string, action: string, status: string, request: any, response: any, errorMessage?: string) {
    try {
      await prisma.nacefSyncLog.create({
        data: {
          storeId,
          action,
          status,
          request: request || undefined,
          response: response || undefined,
          errorMessage: errorMessage || undefined,
        },
      });
    } catch (e) {
      this.logger.error(`Failed to log NACEF action: ${(e as Error).message}`);
    }
  }

  private async httpPost(basePath: string, body: any, storeId: string): Promise<any> {
    const baseUrl = await this.getSmdfUrl(storeId);
    const url = `${baseUrl}${basePath}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw {
        response: { data: errorBody },
        message: errorBody.message || `HTTP ${response.status}`,
      };
    }

    return response.json();
  }

  private async httpGet(basePath: string, storeId: string): Promise<any> {
    const baseUrl = await this.getSmdfUrl(storeId);
    const url = `${baseUrl}${basePath}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw {
        response: { data: errorBody },
        message: errorBody.message || `HTTP ${response.status}`,
      };
    }

    return response.json();
  }

  /**
   * POST /sic/external/certificate/request
   * Demande de certificat électronique pour un S-MDF
   */
  async requestCertificate(dto: CertificateRequestDto, storeId: string) {
    try {
      const data = await this.httpPost('/sic/external/certificate/request', dto, storeId);
      await this.logToStore(storeId, 'CERT_REQUEST', 'SUCCESS', dto, data);
      return data;
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message;
      await this.logToStore(storeId, 'CERT_REQUEST', 'ERROR', dto, null, msg);
      this.logger.error(`Certificate request failed: ${msg}`);
      throw error;
    }
  }

  /**
   * POST /sic/external/sync/request
   * Synchronisation du S-MDF avec la plateforme NACEF
   */
  async syncRequest(dto: SyncRequestDto, storeId: string) {
    try {
      const data = await this.httpPost('/sic/external/sync/request', dto, storeId);
      await this.logToStore(storeId, 'SYNC', 'SUCCESS', dto, data);
      return data;
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message;
      await this.logToStore(storeId, 'SYNC', 'ERROR', dto, null, msg);
      this.logger.error(`Sync request failed: ${msg}`);
      throw error;
    }
  }

  /**
   * GET /sic/external/manifest
   * Récupère l'état courant (Manifest) du S-MDF
   */
  async getManifest(storeId: string) {
    try {
      const data = await this.httpGet('/sic/external/manifest', storeId);
      await this.logToStore(storeId, 'MANIFEST', 'SUCCESS', null, data);
      return data;
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message;
      await this.logToStore(storeId, 'MANIFEST', 'ERROR', null, null, msg);
      this.logger.error(`Get manifest failed: ${msg}`);
      throw error;
    }
  }

  /**
   * POST /sic/external/sign/request
   * Demande la signature électronique d'un ticket avant impression
   */
  async signTicket(ticketInfo: {
    base64Ticket: string;
    totalHT: number;
    totalTax: number;
    operationType: string;
    transactionType: string;
  }, storeId: string) {
    try {
      const data = await this.httpPost('/sic/external/sign/request', ticketInfo, storeId);
      await this.logToStore(storeId, 'SIGN', 'SUCCESS', { operationType: ticketInfo.operationType }, data);
      return data;
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message;
      await this.logToStore(storeId, 'SIGN', 'ERROR', { operationType: ticketInfo.operationType }, null, msg);
      this.logger.error(`Sign request failed: ${msg}`);
      throw error;
    }
  }

  /**
   * POST /sic/external/log/
   * Déclare un nouvel événement émis par la caisse enregistreuse
   */
  async registerLog(logEntry: LogEntryDto, storeId: string) {
    try {
      const data = await this.httpPost('/sic/external/log/', logEntry, storeId);
      return data;
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message;
      this.logger.error(`Log registration failed: ${msg}`);
      // Don't throw - logging should not block the main flow
    }
  }
}
