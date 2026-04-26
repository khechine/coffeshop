import { Module } from '@nestjs/common';
import { InteractionService } from './interaction.service';
import { ContractService } from './contract.service';
import { AlertService } from './alert.service';
import { VendorBillingService } from './vendor-billing.service';
import { MarketplaceController } from './marketplace.controller';

@Module({
  controllers: [MarketplaceController],
  providers: [InteractionService, ContractService, AlertService, VendorBillingService],
  exports: [InteractionService, ContractService, AlertService, VendorBillingService],
})
export class MarketplaceModule {}
