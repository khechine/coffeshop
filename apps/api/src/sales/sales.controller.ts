import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';

@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  async createSale(@Body() createSaleDto: CreateSaleDto): Promise<any> {
    return this.salesService.createSale(createSaleDto);
  }

  @Get(':storeId')
  async getSalesByStore(@Param('storeId') storeId: string): Promise<any> {
    return this.salesService.getSales(storeId);
  }
}
