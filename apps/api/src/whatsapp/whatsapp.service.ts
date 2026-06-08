import { Injectable, Logger } from '@nestjs/common';
import { prisma } from '@coffeeshop/database';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  async getConfig() {
    try {
      const settings = await (prisma as any).systemSettings.findUnique({
        where: { id: 'global' }
      });
      if (settings?.waServerUrl) {
        return { serverUrl: settings.waServerUrl, apiKey: settings.waApiKey || '' };
      }
    } catch {}
    return { serverUrl: process.env.WA_SERVER_URL || '', apiKey: process.env.WA_API_KEY || '' };
  }

  async sendText(to: string, content: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const config = await this.getConfig();
    if (!config.serverUrl) {
      this.logger.warn(`WA_SERVER_URL not configured — simulation send to ${to}: ${content}`);
      return { success: true, messageId: `wa_mock_${Date.now()}` };
    }

    const chatId = `${to.replace(/\D/g, '')}@c.us`;
    try {
      const res = await fetch(`${config.serverUrl}/sendText`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.apiKey ? { 'Authorization': `Bearer ${config.apiKey}` } : {}),
        },
        body: JSON.stringify({ args: { to: chatId, content } }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data?.error || `HTTP ${res.status}` };
      }
      return { success: true, messageId: data?.messageId || `wa_${Date.now()}` };
    } catch (err: any) {
      this.logger.error(`sendText failed: ${err.message}`);
      return { success: false, error: err.message };
    }
  }

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
    return this.sendText(supplierPhone, message);
  }

  async handleIncomingMessage(payload: any) {
    const body = payload?.body || payload?.content || '';
    const from = payload?.from || payload?.chatId || '';
    const senderName = payload?.notifyName || payload?.sender?.name || payload?.sender?.pushname || 'Inconnu';

    this.logger.log(`📩 WhatsApp from ${from} (${senderName}): "${body}"`);

    const normalized = body.trim().toUpperCase();
    if (normalized === 'CONFIRMER' || normalized === 'CONFIRMER 👌' || normalized.startsWith('CONFIRMER')) {
      await this.handleConfirmReply(from, senderName);
    }
  }

  private async handleConfirmReply(from: string, senderName: string) {
    const phone = from.replace(/@c\.us$/, '').replace(/\D/g, '');
    this.logger.log(`✅ CONFIRMER reply from ${phone} (${senderName})`);

    const supplier = await (prisma as any).supplier.findFirst({
      where: { phone: { contains: phone } },
      include: { store: true },
    });

    if (!supplier) {
      this.logger.warn(`No supplier found for phone ${phone}`);
      await this.sendText(from, `Désolé ${senderName}, nous n'avons pas trouvé votre compte fournisseur.`);
      return;
    }

    const pendingOrder = await prisma.supplierOrder.findFirst({
      where: { supplierId: supplier.id, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });

    if (!pendingOrder) {
      this.logger.warn(`No pending order for supplier ${supplier.name}`);
      await this.sendText(from, `Merci ${senderName}, mais aucune commande en attente n'a été trouvée.`);
      return;
    }

    await prisma.supplierOrder.update({
      where: { id: pendingOrder.id },
      data: { status: 'CONFIRMED' },
    });

    this.logger.log(`✅ Order ${pendingOrder.id} confirmed by ${senderName}`);
    await this.sendText(from, `✅ Commande #${pendingOrder.id.slice(-6)} confirmée ! Merci ${senderName}.`);
  }

  async handleWebhook(body: any) {
    const event = body?.event || '';
    const payload = body?.data || body?.payload || body;

    this.logger.debug(`Webhook event: ${event}`);

    if (event === 'onMessage' || event === 'onAnyMessage' || (!event && payload?.body)) {
      await this.handleIncomingMessage(payload);
    }
  }
}
