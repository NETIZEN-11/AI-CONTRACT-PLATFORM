import { IsOptional, IsDateString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum AnalyticsTimeframe {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
  CUSTOM = 'custom',
}

export class AnalyticsQueryDto {
  @ApiProperty({ description: 'Start date', required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ description: 'End date', required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ description: 'Timeframe', enum: AnalyticsTimeframe, required: false })
  @IsOptional()
  @IsEnum(AnalyticsTimeframe)
  timeframe?: AnalyticsTimeframe;

  @ApiProperty({ description: 'Group by field', required: false })
  @IsOptional()
  groupBy?: string;
}
