import { Module } from '@nestjs/common';
import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';
import { InventoryModule } from '../inventory/inventory.module';
import { SalesGateway } from '../websockets/sales.gateway';
import { NacefModule } from '../nacef/nacef.module';

@Module({
  imports: [InventoryModule, NacefModule],
  controllers: [SalesController],
  providers: [SalesService, SalesGateway],
  exports: [SalesService, SalesGateway],
})
export class SalesModule {}
