import { Controller, Post, Body, Get, Param, Query, UnauthorizedException } from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { prisma } from '@coffeeshop/database';

@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get('verify/pin')
  async verifyStaffPin(@Query('pin') pin: string, @Query('storeId') storeId: string) {
    if (!pin || !storeId) throw new UnauthorizedException('Champs requis');
    const user = await prisma.user.findFirst({
      where: { storeId: storeId.trim(), pinCode: pin.trim() },
      select: { 
        id: true, 
        name: true, 
        role: true, 
        assignedTables: true,
        permissions: true,
        defaultPosMode: true,
        store: { select: { name: true } }
      }
    });
    if (!user) throw new UnauthorizedException('Invalide');
    return user;
  }

  @Post()

  async createSale(@Body() createSaleDto: CreateSaleDto): Promise<any> {
    return this.salesService.createSale(createSaleDto);
  }

  @Get(':storeId')
  async getSalesByStore(@Param('storeId') storeId: string): Promise<any> {
    return this.salesService.getSales(storeId);
  }

  @Post(':id/preparation')
  async updatePreparation(
    @Param('id') id: string,
    @Body() body: { status: string, preparedById: string, preparationStation?: string }
  ) {
    return this.salesService.updatePreparationStatus(
      id, 
      body.status, 
      body.preparedById, 
      body.preparationStation
    );
  }

  // ─── MOBILE MANAGEMENT ENDPOINTS ─────────────────────────

  @Get('management/stock/:storeId')
  async getStock(@Param('storeId') storeId: string): Promise<any> {
    return prisma.stockItem.findMany({
      where: { storeId },
      include: { 
        unit: true,
        preferredSupplier: { select: { name: true } },
        preferredVendor: { select: { companyName: true } }
      },
      orderBy: { name: 'asc' }
    });
  }

  @Get('management/staff/:storeId')
  async getStaff(@Param('storeId') storeId: string) {
    return prisma.user.findMany({
      where: { storeId },
      select: {
        id: true,
        name: true,
        role: true,
        pinCode: true,
        phone: true,
        permissions: true,
        defaultPosMode: true,
        createdAt: true,
        _count: { select: { paidSales: true, takenSales: true } }
      },
      orderBy: { name: 'asc' }
    });
  }

  @Get('management/sessions/:storeId')
  async getSessions(@Param('storeId') storeId: string) {
    return prisma.staffSessionLog.findMany({
      where: { storeId },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
  }
}
