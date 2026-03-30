import { IsString, IsNumber, IsArray, ValidateNested, IsOptional } from 'class-validator';

import { Type } from 'class-transformer';

export class SaleItemDto {
  @IsString()
  productId: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  price: number;
}

export class CreateSaleDto {
  @IsString()
  @IsOptional()
  id?: string;

  @IsString()
  storeId: string;

  @IsString()
  @IsOptional()
  baristaId?: string;

  @IsString()
  @IsOptional()
  takenById?: string;

  @IsNumber()

  total: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaleItemDto)
  items: SaleItemDto[];
}
