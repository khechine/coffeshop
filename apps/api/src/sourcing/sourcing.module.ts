import { Module } from '@nestjs/common';
import { SourcingService } from './sourcing.service';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [WhatsappModule],
  providers: [SourcingService],
  exports: [SourcingService],
})
export class SourcingModule {}
