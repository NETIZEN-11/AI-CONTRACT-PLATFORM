import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class AuthResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;

  @ApiProperty()
  expiresIn: number;

  @ApiProperty()
  tokenType: string;

  @ApiProperty()
  user: UserInfoDto;
}

export class UserInfoDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  avatar?: string;

  @ApiProperty({ enum: UserRole })
  role: UserRole;

  @ApiProperty()
  organizationId: string;

  @ApiProperty()
  teamId?: string;

  @ApiProperty()
  mfaEnabled: boolean;

  @ApiProperty()
  permissions: string[];
}

export class MfaSetupDto {
  @ApiProperty()
  secret: string;

  @ApiProperty()
  qrCode: string;

  @ApiProperty()
  backupCodes: string[];
}

export class ApiKeyResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  key: string;

  @ApiProperty()
  scopes: string[];

  @ApiProperty()
  expiresAt?: Date;

  @ApiProperty()
  createdAt: Date;
}
