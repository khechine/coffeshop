import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  /**
   * Simulates sending a WhatsApp message to a B2B Supplier.
   * In production, this would call Twilio or Meta WhatsApp Business API.
   */
  async sendB2BDraftOrder(
    supplierPhone: string, 
    supplierName: string, 
    storeName: string, 
    orderId: string, 
    itemsDescription: string
  ) {
    const message = `
☕ *Nouvelle Commande B2B - ${storeName}* ☕
Bonjour ${supplierName},

Vous avez une nouvelle suggestion de commande (Réf: #${orderId.slice(-6)}).
Voici les articles critiques à livrer :

${itemsDescription}

👉 Répondez *CONFIRMER* à ce message pour valider la livraison.
    `;

    this.logger.log(`\n\n--- 🟢 SIMULATION WHATSAPP MSG TO ${supplierPhone} ---\n${message}\n-------------------------------------------\n`);
    
    // API Call to WhatsApp Provider goes here
    return { success: true, messageId: `wa_mock_${Date.now()}` };
  }
}
