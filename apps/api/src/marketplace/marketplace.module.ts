import { Module } from '@nestjs/common';
import { InteractionService } from './interaction.service';
import { MarketplaceController } from './marketplace.controller';

@Module({
  controllers: [MarketplaceController],
  providers: [InteractionService],
  exports: [InteractionService],
})
export class MarketplaceModule {}
