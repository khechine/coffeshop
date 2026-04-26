import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { SalesModule } from './sales/sales.module';
import { InventoryModule } from './inventory/inventory.module';
import { ProductsModule } from './products/products.module';
import { MarketplaceModule } from './marketplace/marketplace.module';
import { AuthController } from './auth.controller';
import { ManagementController } from './management.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),
    ScheduleModule.forRoot(),
    SalesModule,
    InventoryModule,
    ProductsModule,
    MarketplaceModule, // ✅ Anti-leakage tracking — Phase 2
  ],

  controllers: [AuthController, ManagementController],
  providers: [],
})
export class AppModule {}


