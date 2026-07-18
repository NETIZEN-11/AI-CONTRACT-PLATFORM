import { IsString, IsOptional, IsNumber, IsEnum, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, PartialType } from '@nestjs/swagger';

export enum ReviewStatus {
  DRAFT = 'draft',
  IN_PROGRESS = 'in_progress',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ARCHIVED = 'archived',
}

export enum ReviewPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export class CreateReviewDto {
  @ApiProperty({ description: 'Contract ID' })
  @IsString()
  contractId: string;

  @ApiProperty({ description: 'Reviewer notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: 'Review priority', enum: ReviewPriority })
  @IsEnum(ReviewPriority)
  priority: ReviewPriority;

  @ApiProperty({ description: 'Assigned to user ID', required: false })
  @IsOptional()
  @IsString()
  assignedToUserId?: string;
}

export class UpdateReviewDto extends PartialType(CreateReviewDto) {
  @ApiProperty({ description: 'Review status', enum: ReviewStatus, required: false })
  @IsOptional()
  @IsEnum(ReviewStatus)
  status?: ReviewStatus;

  @ApiProperty({ description: 'Review findings', required: false })
  @IsOptional()
  @IsString()
  findings?: string;

  @ApiProperty({ description: 'Recommendations', required: false })
  @IsOptional()
  @IsString()
  recommendations?: string;
}

export class ListReviewsDto {
  @ApiProperty({ description: 'Skip', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  skip?: number;

  @ApiProperty({ description: 'Limit', required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiProperty({ description: 'Review status', enum: ReviewStatus, required: false })
  @IsOptional()
  @IsEnum(ReviewStatus)
  status?: ReviewStatus;

  @ApiProperty({ description: 'Review priority', enum: ReviewPriority, required: false })
  @IsOptional()
  @IsEnum(ReviewPriority)
  priority?: ReviewPriority;

  @ApiProperty({ description: 'Contract ID', required: false })
  @IsOptional()
  @IsString()
  contractId?: string;

  @ApiProperty({ description: 'Assigned to user ID', required: false })
  @IsOptional()
  @IsString()
  assignedToUserId?: string;
}
