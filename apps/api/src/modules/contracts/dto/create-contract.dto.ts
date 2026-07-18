import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsNumber,
  IsArray,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ContractType, ContractStatus } from '@prisma/client';

export class CreateContractDto {
  @ApiProperty({ example: 'Software Development Agreement' })
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  title: string;

  @ApiProperty({ example: 'Agreement for development of mobile application', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ enum: ContractType, example: ContractType.VENDOR })
  @IsEnum(ContractType)
  contractType: ContractType;

  @ApiProperty({ enum: ContractStatus, example: ContractStatus.DRAFT, required: false })
  @IsEnum(ContractStatus)
  @IsOptional()
  status?: ContractStatus;

  @ApiProperty({ example: 'team_123abc', required: false })
  @IsString()
  @IsOptional()
  teamId?: string;

  @ApiProperty({ example: ['Acme Corp', 'Tech Solutions Inc'], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  parties?: string[];

  @ApiProperty({ example: '2024-01-01T00:00:00Z', required: false })
  @IsDateString()
  @IsOptional()
  effectiveDate?: string;

  @ApiProperty({ example: '2025-01-01T00:00:00Z', required: false })
  @IsDateString()
  @IsOptional()
  expirationDate?: string;

  @ApiProperty({ example: 'California', required: false })
  @IsString()
  @IsOptional()
  jurisdiction?: string;

  @ApiProperty({ example: 'California State Law', required: false })
  @IsString()
  @IsOptional()
  governingLaw?: string;

  @ApiProperty({ example: 50000, required: false })
  @IsNumber()
  @IsOptional()
  value?: number;

  @ApiProperty({ example: 'USD', required: false })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({ example: 'Net 30 days', required: false })
  @IsString()
  @IsOptional()
  paymentTerms?: string;
}

export class UploadContractFileDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  file: any;
}
