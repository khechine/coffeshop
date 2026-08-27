import { Controller, Post, Get, Body, Param, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { NacefService } from './nacef.service';
import { SyncRequestDto } from './dto/sync-request.dto';
import { NacefAuthGuard } from '../auth/nacef-auth.guard';

@Controller('nacef')
@UseGuards(NacefAuthGuard)
export class NacefController {
  constructor(private readonly nacefService: NacefService) {}

  /**
   * POST /nacef/initialize/:storeId
   * Initialize NACEF for a store (certificate + sync)
   */
  @Post('initialize/:storeId')
  async initialize(
    @Param('storeId') storeId: string,
    @Body() body: { model: string; serialNumber: string; version: string },
  ) {
    return this.nacefService.initialize(storeId, body);
  }

  /**
   * POST /nacef/sign/:saleId
   * Sign a ticket with NACEF
   */
  @Post('sign/:saleId')
  @HttpCode(HttpStatus.OK)
  async signTicket(@Param('saleId') saleId: string) {
    const result = await this.nacefService.signTicket(saleId);
    if (!result) {
      return { success: false, message: 'Could not sign ticket. Check fiscal mode and store config.' };
    }
    return { success: true, ...result };
  }

  /**
   * GET /nacef/manifest/:storeId
   * Get S-MDF manifest for a store
   */
  @Get('manifest/:storeId')
  async getManifest(@Param('storeId') storeId: string) {
    return this.nacefService.getManifest(storeId);
  }

  /**
   * POST /nacef/sync/:storeId
   * Sync S-MDF with NACEF platform
   */
  @Post('sync/:storeId')
  @HttpCode(HttpStatus.OK)
  async sync(
    @Param('storeId') storeId: string,
    @Body() body?: SyncRequestDto,
  ) {
    return this.nacefService.sync(storeId, body);
  }

  /**
   * GET /nacef/ready/:storeId
   * Check if store is ready for NACEF signing
   */
  @Get('ready/:storeId')
  async isReady(@Param('storeId') storeId: string) {
    const ready = await this.nacefService.isStoreReady(storeId);
    return { storeId, ready };
  }

  /**
   * POST /nacef/config/:storeId
   * Configure S-MDF URL for a store
   */
  @Post('config/:storeId')
  @HttpCode(HttpStatus.OK)
  async configure(
    @Param('storeId') storeId: string,
    @Body() body: {
      smdfUrl: string;
      imdf?: string;
      matriculeFiscal?: string;
      establishmentReference?: string;
      commercialName?: string;
      accreditationReference?: string;
    },
  ) {
    return this.nacefService.configureStore(storeId, body);
  }
}
