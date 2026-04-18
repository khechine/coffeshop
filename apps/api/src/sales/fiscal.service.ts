import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class FiscalService {
  private readonly logger = new Logger(FiscalService.name);

  /**
   * Prépare les métadonnées fiscales pour une nouvelle vente.
   * Calcule le hash chaîné et détermine le prochain numéro de séquence.
   */
  async getNextFiscalMetadata(tx: any, terminalId: string, saleData: any) {
    // 1. Récupérer la dernière vente du terminal pour obtenir le hash précédent
    const lastSale = await tx.sale.findFirst({
      where: { terminalId, isFiscal: true },
      orderBy: { createdAt: 'desc' },
      select: { hash: true, fiscalNumber: true }
    });

    const previousHash = lastSale?.hash || '0'.repeat(64); // "Genesis" hash si première vente
    
    // 2. Déterminer le prochain numéro de facture séquentiel
    const nextFiscalNumber = this.generateNextFiscalNumber(lastSale?.fiscalNumber);

    // 3. Calculer le hash de la vente actuelle (SHA-256)
    // On concatène les données critiques de la vente avec le hash précédent
    const serializedData = JSON.stringify({
      total: saleData.total,
      storeId: saleData.storeId,
      items: saleData.items,
      terminalId: terminalId,
      timestamp: new Date().toISOString().substring(0, 13) // Précision à l'heure pour éviter les micro-deltas lors du double computing
    });

    const currentHash = crypto
      .createHash('sha256')
      .update(serializedData + previousHash)
      .digest('hex');

    return {
      fiscalNumber: nextFiscalNumber,
      hash: currentHash,
      previousHash
    };
  }

  private generateNextFiscalNumber(lastNumber?: string | null): string {
    const year = new Date().getFullYear().toString();
    if (!lastNumber) {
      return `F-${year}-000001`;
    }

    const parts = lastNumber.split('-');
    // Si l'année a changé, on pourrait reset, mais la loi NACEF préfère souvent une continuité totale ou par année
    // Ici on incrémente simplement le dernier segment
    const lastSeq = parseInt(parts[parts.length - 1]);
    const nextSeq = (lastSeq + 1).toString().padStart(6, '0');
    
    return `F-${year}-${nextSeq}`;
  }

  /**
   * Crée un log d'audit fiscal immuable
   */
  async createFiscalLog(tx: any, saleId: string, action: string, data: any) {
    return tx.fiscalLog.create({
      data: {
        saleId,
        action,
        data,
        hash: crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex')
      }
    });
  }

  /**
   * Vérifie la signature numérique envoyée par le terminal
   */
  verifySignature(data: string, signature: string, publicKey: string): boolean {
    try {
      const verify = crypto.createVerify('sha256');
      verify.update(data);
      verify.end();
      
      return verify.verify(
        {
          key: publicKey,
          padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
          saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST,
        },
        Buffer.from(signature, 'base64')
      );
    } catch (error) {
      this.logger.error(`Erreur lors de la vérification de la signature: ${error.message}`);
      return false;
    }
  }

  /**
   * Génère un rapport Z (clôture journalière fiscale) pour un terminal.
   */
  async generateZReport(tx: any, storeId: string, terminalId: string, date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // 1. Récupérer toutes les ventes fiscales du terminal pour la journée
    const sales = await tx.sale.findMany({
      where: {
        storeId,
        terminalId,
        isFiscal: true,
        createdAt: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      select: { total: true, hash: true }
    });

    if (sales.length === 0) {
      throw new Error('Aucune vente enregistrée pour ce terminal aujourd\'hui.');
    }

    const totalAmount = sales.reduce((sum, s) => sum + Number(s.total), 0);
    const totalTax = totalAmount * 0.19; // TODO: Utiliser les taux réels par produit (par défaut 19%)

    // 2. Récupérer le hash du dernier rapport Z
    const lastZReport = await tx.zReport.findFirst({
      where: { terminalId },
      orderBy: { createdAt: 'desc' }
    });

    const previousZHash = lastZReport?.hash || '0'.repeat(64);

    // 3. Calculer le hash du rapport actuel
    const zData = JSON.stringify({
      storeId,
      terminalId,
      date: startOfDay.toISOString(),
      totalAmount,
      salesCount: sales.length,
      lastSaleHash: sales[sales.length - 1].hash
    });

    const hash = crypto.createHash('sha256').update(zData + previousZHash).digest('hex');

    // 4. Enregistrer le rapport
    return tx.zReport.create({
      data: {
        storeId,
        terminalId,
        date: startOfDay,
        totalAmount,
        totalTax,
        salesCount: sales.length,
        hash,
        previousZHash
      }
    });
  }
}
