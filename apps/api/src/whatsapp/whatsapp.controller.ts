import { Controller, Post, Body, Logger } from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';

@Controller('whatsapp')
export class WhatsappController {
  private readonly logger = new Logger(WhatsappController.name);

  constructor(private readonly whatsapp: WhatsappService) {}

  @Post('webhook')
  async webhook(@Body() body: any) {
    this.logger.debug(`Webhook received: ${JSON.stringify(body).slice(0, 500)}`);
    await this.whatsapp.handleWebhook(body);
    return { status: 'ok' };
  }
}
