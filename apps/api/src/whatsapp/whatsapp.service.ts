import { Injectable, Logger } from '@nestjs/common';
import { prisma } from '@coffeeshop/database';
import * as crypto from 'crypto';

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

  generateCode(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  async sendVerificationCode(phone: string): Promise<{ success: boolean; error?: string }> {
    const cleanPhone = phone.replace(/\D/g, '');
    const code = this.generateCode();
    const expires = new Date(Date.now() + 10 * 60 * 1000);

    const supplier = await (prisma as any).supplier.findFirst({
      where: { phone: { contains: cleanPhone } },
    });

    if (supplier) {
      await (prisma as any).supplier.update({
        where: { id: supplier.id },
        data: {
          whatsappVerificationToken: code,
          whatsappVerificationExpires: expires,
        },
      });
      const msg = [
        `☕ *ElKassa - Vérification WhatsApp* ☕`,
        ``,
        `Bonjour ${supplier.name},`,
        ``,
        `Votre code de vérification est : *${code}*`,
        ``,
        `Répondez avec ce code pour confirmer votre numéro WhatsApp.`,
        `Ce code expire dans 10 minutes.`,
      ].join('\n');
      return this.sendText(cleanPhone, msg);
    }

    const user = await (prisma as any).user.findFirst({
      where: { phone: { contains: cleanPhone } },
    });

    if (user) {
      await (prisma as any).user.update({
        where: { id: user.id },
        data: {
          whatsappVerificationToken: code,
          whatsappVerificationExpires: expires,
        },
      });
      const msg = [
        `☕ *ElKassa - Vérification WhatsApp* ☕`,
        ``,
        `Bonjour ${user.name},`,
        ``,
        `Votre code de vérification est : *${code}*`,
        ``,
        `Répondez avec ce code pour confirmer votre numéro WhatsApp.`,
        `Ce code expire dans 10 minutes.`,
      ].join('\n');
      return this.sendText(cleanPhone, msg);
    }

    return { success: false, error: 'Aucun fournisseur ou utilisateur trouvé avec ce numéro' };
  }

  async verifyCode(phone: string, code: string): Promise<boolean> {
    const cleanPhone = phone.replace(/\D/g, '');

    const supplier = await (prisma as any).supplier.findFirst({
      where: {
        phone: { contains: cleanPhone },
        whatsappVerificationToken: code,
        whatsappVerificationExpires: { gte: new Date() },
      },
    });

    if (supplier) {
      await (prisma as any).supplier.update({
        where: { id: supplier.id },
        data: {
          whatsappVerified: true,
          whatsappVerificationToken: null,
          whatsappVerificationExpires: null,
        },
      });
      this.logger.log(`✅ WhatsApp verified for supplier ${supplier.name} (${phone})`);
      await this.sendText(phone, `✅ Votre numéro WhatsApp a été vérifié avec succès ${supplier.name} !`);
      return true;
    }

    const user = await (prisma as any).user.findFirst({
      where: {
        phone: { contains: cleanPhone },
        whatsappVerificationToken: code,
        whatsappVerificationExpires: { gte: new Date() },
      },
    });

    if (user) {
      await (prisma as any).user.update({
        where: { id: user.id },
        data: {
          whatsappVerified: true,
          whatsappVerificationToken: null,
          whatsappVerificationExpires: null,
        },
      });
      this.logger.log(`✅ WhatsApp verified for user ${user.name} (${phone})`);
      await this.sendText(phone, `✅ Votre numéro WhatsApp a été vérifié avec succès ${user.name} !`);
      return true;
    }

    return false;
  }

  async sendB2BDraftOrder(
    supplierPhone: string,
    supplierName: string,
    storeName: string,
    orderId: string,
    itemsDescription: string
  ) {
    const message = [
      `☕ *Nouvelle Commande B2B - ${storeName}* ☕`,
      `Bonjour ${supplierName},`,
      ``,
      `Vous avez une nouvelle suggestion de commande (Réf: #${orderId.slice(-6)}).`,
      `Voici les articles critiques à livrer :`,
      ``,
      `${itemsDescription}`,
      ``,
      `👉 Répondez *CONFIRMER* à ce message pour valider la livraison.`,
    ].join('\n');
    return this.sendText(supplierPhone, message);
  }

  async handleIncomingMessage(payload: any) {
    const body = payload?.body || payload?.content || '';
    const from = payload?.from || payload?.chatId || '';
    const senderName = payload?.notifyName || payload?.sender?.name || payload?.sender?.pushname || 'Inconnu';

    const cleanPhone = from.replace(/@c\.us$/, '').replace(/\D/g, '');

    this.logger.log(`📩 WhatsApp from ${cleanPhone} (${senderName}): "${body}"`);

    const normalized = body.trim().toUpperCase();
    const isSixDigits = /^\d{6}$/.test(normalized);

    if (isSixDigits) {
      const verified = await this.verifyCode(cleanPhone, normalized);
      if (verified) {
        this.logger.log(`✅ Phone ${cleanPhone} verified via code ${normalized}`);
      } else {
        this.logger.warn(`❌ Invalid verification code ${normalized} from ${cleanPhone}`);
        await this.sendText(from, `❌ Code invalide ou expiré. Répondez *CODE* pour recevoir un nouveau code.`);
      }
      return;
    }

    if (normalized === 'CODE') {
      await this.handleCodeRequest(from, senderName, cleanPhone);
      return;
    }

    if (normalized === 'CONFIRMER' || normalized === 'CONFIRMER 👌' || normalized.startsWith('CONFIRMER')) {
      await this.handleConfirmReply(from, senderName, cleanPhone);
      return;
    }
  }

  private async handleCodeRequest(from: string, senderName: string, cleanPhone: string) {
    this.logger.log(`📩 CODE request from ${cleanPhone} (${senderName})`);

    const supplier = await (prisma as any).supplier.findFirst({
      where: { phone: { contains: cleanPhone } },
    });

    if (supplier) {
      const code = this.generateCode();
      const expires = new Date(Date.now() + 10 * 60 * 1000);
      await (prisma as any).supplier.update({
        where: { id: supplier.id },
        data: {
          whatsappVerificationToken: code,
          whatsappVerificationExpires: expires,
        },
      });
      await this.sendText(from, `🔐 Votre nouveau code de vérification : *${code}*\n\nRépondez avec ce code pour confirmer votre numéro. Il expire dans 10 minutes.`);
      return;
    }

    const user = await (prisma as any).user.findFirst({
      where: { phone: { contains: cleanPhone } },
    });

    if (user) {
      const code = this.generateCode();
      const expires = new Date(Date.now() + 10 * 60 * 1000);
      await (prisma as any).user.update({
        where: { id: user.id },
        data: {
          whatsappVerificationToken: code,
          whatsappVerificationExpires: expires,
        },
      });
      await this.sendText(from, `🔐 Votre nouveau code de vérification : *${code}*\n\nRépondez avec ce code pour confirmer votre numéro. Il expire dans 10 minutes.`);
      return;
    }

    await this.sendText(from, `Désolé ${senderName}, nous n'avons pas trouvé votre compte dans notre système.`);
  }

  private async handleConfirmReply(from: string, senderName: string, cleanPhone?: string) {
    const phone = cleanPhone || from.replace(/@c\.us$/, '').replace(/\D/g, '');
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

    if (!supplier.whatsappVerified) {
      this.logger.warn(`Supplier ${supplier.name} not WhatsApp verified, sending code`);
      const code = this.generateCode();
      const expires = new Date(Date.now() + 10 * 60 * 1000);
      await (prisma as any).supplier.update({
        where: { id: supplier.id },
        data: {
          whatsappVerificationToken: code,
          whatsappVerificationExpires: expires,
        },
      });
      await this.sendText(from, `🔐 Veuillez d'abord vérifier votre numéro WhatsApp.\n\nVotre code : *${code}*\n\nRépondez avec ce code pour confirmer. Il expire dans 10 minutes.`);
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
