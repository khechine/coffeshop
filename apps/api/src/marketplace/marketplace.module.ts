import { Module } from '@nestjs/common';
import { InteractionService } from './interaction.service';
import { ContractService } from './contract.service';
import { MarketplaceController } from './marketplace.controller';

@Module({
  controllers: [MarketplaceController],
  providers: [InteractionService, ContractService],
  exports: [InteractionService, ContractService],
})
export class MarketplaceModule {}
