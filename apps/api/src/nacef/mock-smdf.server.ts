import express from 'express';
import { Logger } from '@nestjs/common';
import crypto from 'crypto';

export class MockSmdfServer {
  private static instance: MockSmdfServer;
  private app = express();
  private logger = new Logger('MockSmdfServer');
  private isRunning = false;

  private imdf = '1234567890123456';
  private ticketCounter = 1;

  public static start(port: number = 10006) {
    if (!MockSmdfServer.instance) {
      MockSmdfServer.instance = new MockSmdfServer();
      MockSmdfServer.instance.init(port);
    }
    return MockSmdfServer.instance;
  }

  private init(port: number) {
    if (this.isRunning) return;

    this.app.use(express.json({ limit: '10mb' }));

    // CORS for local testing
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      if (req.method === 'OPTIONS') return res.sendStatus(200);
      next();
    });

    // 1. GET /sic/external/manifest
    this.app.get('/sic/external/manifest', (req, res) => {
      this.logger.log('S-MDF Mock: GET /sic/external/manifest');
      res.json({
        imdf: this.imdf,
        status: '5: Can be used to sign tickets.',
        version: '1.2.0-mock',
        type: '0: This SMDF runs a single equipment.',
        maintenanceEnabled: false,
        state: 'ONLINE',
        synchronizationRate: 100,
        availableOfflineTickets: 500,
        certificateInfo: {
          certRequestStatus: 'CERTIFICATE_GENERATED',
          issuanceDate: new Date('2026-01-01').toISOString(),
          expirationDate: new Date('2028-01-01').toISOString(),
          expired: false,
          revoked: false,
        },
      });
    });

    // 2. POST /sic/external/sync/request
    this.app.post('/sic/external/sync/request', (req, res) => {
      this.logger.log('S-MDF Mock: POST /sic/external/sync/request');
      res.json({
        imdf: this.imdf,
        status: '5: Can be used to sign tickets.',
        version: '1.2.0-mock',
        type: '0: This SMDF runs a single equipment.',
        maintenanceEnabled: false,
        state: 'ONLINE',
        synchronizationRate: 100,
        availableOfflineTickets: 500,
        certificateInfo: {
          certRequestStatus: 'CERTIFICATE_GENERATED',
          issuanceDate: new Date('2026-01-01').toISOString(),
          expirationDate: new Date('2028-01-01').toISOString(),
          expired: false,
          revoked: false,
        },
      });
    });

    // 3. POST /sic/external/certificate/request
    this.app.post('/sic/external/certificate/request', (req, res) => {
      this.logger.log('S-MDF Mock: POST /sic/external/certificate/request');
      res.json({
        imdf: this.imdf,
        status: '5: Can be used to sign tickets.',
        version: '1.2.0-mock',
        certificateInfo: {
          certRequestStatus: 'CERTIFICATE_GENERATED',
          issuanceDate: new Date().toISOString(),
          expirationDate: new Date(Date.now() + 365 * 24 * 3600 * 1000 * 2).toISOString(),
          expired: false,
          revoked: false,
        },
      });
    });

    // 4. POST /sic/external/sign/request
    this.app.post('/sic/external/sign/request', (req, res) => {
      const { base64Ticket, totalHT, totalTax, operationType, transactionType } = req.body || {};
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const paddedCounter = String(this.ticketCounter++).padStart(6, '0');
      const ticketId = `NCF-${dateStr}-${paddedCounter}`;

      const mockHash = crypto.createHash('sha256').update(`${ticketId}-${base64Ticket || ''}`).digest('hex');
      const qrData = `NACEF*${ticketId}*${totalHT || 0}*${totalTax || 0}*${mockHash.slice(0, 16)}`;

      this.logger.log(`S-MDF Mock: Signed ticket ${ticketId}`);

      res.json({
        ticketIdentifier: ticketId,
        qrcodeImage: qrData,
        signature: mockHash,
        status: 'SUCCESS',
      });
    });

    // 5. POST /sic/external/log/
    this.app.post('/sic/external/log/', (req, res) => {
      this.logger.log(`S-MDF Mock Log: ${JSON.stringify(req.body)}`);
      res.json({
        message: 'Log entry registered successfully in S-MDF mock',
        errorCode: 0,
      });
    });

    try {
      this.app.listen(port, '0.0.0.0', () => {
        this.isRunning = true;
        this.logger.log(`✅ S-MDF Mock Server is running on http://0.0.0.0:${port}`);
      });
    } catch (err: any) {
      this.logger.warn(`Could not start S-MDF Mock Server on port ${port}: ${err.message}`);
    }
  }
}
