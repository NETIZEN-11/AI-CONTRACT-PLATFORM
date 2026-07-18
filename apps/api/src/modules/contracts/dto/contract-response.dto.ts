import { ApiProperty } from '@nestjs/swagger';
import { ContractType, ContractStatus } from '@prisma/client';

export class ContractResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description?: string;

  @ApiProperty({ enum: ContractType })
  contractType: ContractType;

  @ApiProperty({ enum: ContractStatus })
  status: ContractStatus;

  @ApiProperty()
  fileUrl?: string;

  @ApiProperty()
  fileName?: string;

  @ApiProperty()
  fileSize?: number;

  @ApiProperty()
  parties: string[];

  @ApiProperty()
  effectiveDate?: Date;

  @ApiProperty()
  expirationDate?: Date;

  @ApiProperty()
  jurisdiction?: string;

  @ApiProperty()
  governingLaw?: string;

  @ApiProperty()
  value?: number;

  @ApiProperty()
  currency: string;

  @ApiProperty()
  paymentTerms?: string;

  @ApiProperty()
  organizationId: string;

  @ApiProperty()
  teamId?: string;

  @ApiProperty()
  createdBy: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  archivedAt?: Date;
}

export class ContractListResponseDto {
  @ApiProperty({ type: [ContractResponseDto] })
  data: ContractResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  skip: number;

  @ApiProperty()
  take: number;

  @ApiProperty()
  hasMore: boolean;
}

export class ContractStatsDto {
  @ApiProperty()
  totalContracts: number;

  @ApiProperty()
  draftContracts: number;

  @ApiProperty()
  underReview: number;

  @ApiProperty()
  approved: number;

  @ApiProperty()
  expired: number;

  @ApiProperty()
  expiringInNext30Days: number;

  @ApiProperty()
  totalValue: number;
}
