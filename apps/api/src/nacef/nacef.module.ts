import { Module } from '@nestjs/common';
import { NacefController } from './nacef.controller';
import { NacefService } from './nacef.service';
import { NacefClient } from './nacef-client';
import { NacefTicketBuilder } from './nacef-ticket.builder';

@Module({
  controllers: [NacefController],
  providers: [NacefService, NacefClient, NacefTicketBuilder],
  exports: [NacefService, NacefTicketBuilder],
})
export class NacefModule {}
