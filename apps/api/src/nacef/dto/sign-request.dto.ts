import { IsString, IsNumber, IsNotEmpty } from 'class-validator';

export class SignRequestDto {
  @IsString()
  @IsNotEmpty()
  base64Ticket: string;

  @IsNumber()
  totalHT: number;

  @IsNumber()
  totalTax: number;

  @IsString()
  @IsNotEmpty()
  operationType: string;

  @IsString()
  @IsNotEmpty()
  transactionType: string;
}
