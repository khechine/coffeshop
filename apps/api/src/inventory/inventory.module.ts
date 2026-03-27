import { Module } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { SourcingModule } from '../sourcing/sourcing.module';

@Module({
  imports: [SourcingModule],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
