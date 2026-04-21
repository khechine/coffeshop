import { Module } from '@nestjs/common';
import { InteractionService } from './interaction.service';
import { ContractService } from './contract.service';
import { AlertService } from './alert.service';
import { MarketplaceController } from './marketplace.controller';

@Module({
  controllers: [MarketplaceController],
  providers: [InteractionService, ContractService, AlertService],
  exports: [InteractionService, ContractService, AlertService],
})
export class MarketplaceModule {}
