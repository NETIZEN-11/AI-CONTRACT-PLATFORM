import { IsEmail, IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'john.doe@company.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'SecurePass123!' })
  @IsString()
  password: string;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  rememberMe?: boolean;

  @ApiProperty({ example: '123456', required: false, description: 'MFA code if enabled' })
  @IsString()
  @IsOptional()
  mfaCode?: string;
}

export class RefreshTokenDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  @IsString()
  refreshToken: string;
}

export class ChangePasswordDto {
  @ApiProperty({ example: 'OldPass123!' })
  @IsString()
  currentPassword: string;

  @ApiProperty({ example: 'NewSecurePass456!' })
  @IsString()
  newPassword: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'john.doe@company.com' })
  @IsEmail()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'reset_token_abc123' })
  @IsString()
  token: string;

  @ApiProperty({ example: 'NewSecurePass456!' })
  @IsString()
  newPassword: string;
}

export class EnableMfaDto {
  @ApiProperty({ example: '123456' })
  @IsString()
  verificationCode: string;
}

export class VerifyMfaDto {
  @ApiProperty({ example: '123456' })
  @IsString()
  code: string;
}

export class OAuthCallbackDto {
  @ApiProperty({ example: 'authorization_code_from_provider' })
  @IsString()
  code: string;

  @ApiProperty({ example: 'state_token' })
  @IsString()
  state: string;
}
