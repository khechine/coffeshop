import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SalesModule } from './sales/sales.module';
import { InventoryModule } from './inventory/inventory.module';
import { ProductsModule } from './products/products.module';
import { AuthController } from './auth.controller';
import { ManagementController } from './management.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
    }),
    SalesModule,
    InventoryModule,
    ProductsModule,
  ],

  controllers: [AuthController, ManagementController],
  providers: [],
})
export class AppModule {}

