import { IsString, IsNotEmpty, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CashRegisterInfoDto {
  @IsString()
  @IsNotEmpty()
  model: string;

  @IsString()
  @IsNotEmpty()
  serialNumber: string;

  @IsString()
  @IsNotEmpty()
  version: string;
}

export class CertificateRequestDto {
  @ValidateNested()
  @Type(() => CashRegisterInfoDto)
  cashRegisterInfo: CashRegisterInfoDto;
}
