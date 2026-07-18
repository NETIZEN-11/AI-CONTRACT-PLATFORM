import { IsString, IsOptional, IsEnum, IsNumber, Min, Max, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ContractType, ContractStatus } from '@prisma/client';
import { Type } from 'class-transformer';

export class QueryContractDto {
  @ApiProperty({ required: false, example: 'Agreement' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiProperty({ enum: ContractType, required: false })
  @IsEnum(ContractType)
  @IsOptional()
  contractType?: ContractType;

  @ApiProperty({ enum: ContractStatus, required: false })
  @IsEnum(ContractStatus)
  @IsOptional()
  status?: ContractStatus;

  @ApiProperty({ required: false, example: 'team_123abc' })
  @IsString()
  @IsOptional()
  teamId?: string;

  @ApiProperty({ required: false, example: '2024-01-01T00:00:00Z' })
  @IsDateString()
  @IsOptional()
  effectiveDateFrom?: string;

  @ApiProperty({ required: false, example: '2024-12-31T23:59:59Z' })
  @IsDateString()
  @IsOptional()
  effectiveDateTo?: string;

  @ApiProperty({ required: false, example: '2025-01-01T00:00:00Z' })
  @IsDateString()
  @IsOptional()
  expirationDateFrom?: string;

  @ApiProperty({ required: false, example: '2025-12-31T23:59:59Z' })
  @IsDateString()
  @IsOptional()
  expirationDateTo?: string;

  @ApiProperty({ required: false, minimum: 0, default: 0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  skip?: number = 0;

  @ApiProperty({ required: false, minimum: 1, maximum: 100, default: 20 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  take?: number = 20;

  @ApiProperty({ required: false, example: 'createdAt' })
  @IsString()
  @IsOptional()
  sortBy?: string = 'createdAt';

  @ApiProperty({ required: false, example: 'desc', enum: ['asc', 'desc'] })
  @IsEnum(['asc', 'desc'])
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
