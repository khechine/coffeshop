import { IsBoolean, IsOptional } from 'class-validator';

export class SyncRequestDto {
  @IsBoolean()
  @IsOptional()
  requestPINupdate?: boolean = false;

  @IsBoolean()
  @IsOptional()
  updateSMDFURL?: boolean = false;
}
