import { IsString, IsEmail, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  LAWYER = 'lawyer',
  ANALYST = 'analyst',
  VIEWER = 'viewer',
}

export class CreateUserDto {
  @ApiProperty({ description: 'User email' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'User full name' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'User password' })
  @IsString()
  password: string;

  @ApiProperty({ description: 'User role', enum: UserRole })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({ description: 'Department', required: false })
  @IsOptional()
  @IsString()
  department?: string;

  @ApiProperty({ description: 'Job title', required: false })
  @IsOptional()
  @IsString()
  jobTitle?: string;
}

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiProperty({ description: 'User status', required: false })
  @IsOptional()
  @IsString()
  status?: string;
}
