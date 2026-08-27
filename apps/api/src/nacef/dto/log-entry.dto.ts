import { IsString, IsNotEmpty, IsIn, IsOptional } from 'class-validator';

export class LogEntryDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['SMDF', 'SIC', 'LC', 'LC_AGENT', 'LC_SECURITY'])
  module: string;

  @IsString()
  @IsNotEmpty()
  @IsIn([
    'UPGRADE', 'CASHING', 'PURGE', 'BACKUP', 'RESTORE',
    'OFFLINE', 'ONLINE', 'PARAMETERS', 'PRINTER',
    'CERT_REQUEST', 'SYNC_REQUEST', 'SIGN_REQUEST', 'USER_LOGIN'
  ])
  operation: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['INFO', 'WARN', 'ERROR', 'TRACE', 'DEBUG'])
  level: string;

  @IsString()
  @IsNotEmpty()
  message: string;
}
