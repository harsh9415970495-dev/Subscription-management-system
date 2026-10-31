import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsIn, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'customer@acme.com', description: 'Customer email address' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'SecurePass123!', description: 'Strong password meeting 9+ chars and rules' })
  @IsString()
  @IsNotEmpty()
  password!: string;

  @ApiProperty({ example: 'Jane Doe', description: 'Customer contact name' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'Acme Corp', required: false })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiProperty({ example: '+91 98765 43210', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: { street: '123 Tech Park', city: 'Bengaluru', state: 'Karnataka', postalCode: '560001', country: 'IN' }, required: false })
  @IsOptional()
  @IsObject()
  billingAddress?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };

  @ApiProperty({ example: '29AAAAA0000A1Z5', required: false })
  @IsOptional()
  @IsString()
  taxId?: string;
}

export class LoginDto {
  @ApiProperty({ example: 'admin@brightloop.local' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Admin123!@#' })
  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class RefreshTokenDto {
  @ApiProperty({ example: '40-byte-hex-refresh-token' })
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'user@brightloop.local' })
  @IsEmail()
  email!: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: '32-byte-hex-reset-token' })
  @IsString()
  @IsNotEmpty()
  token!: string;

  @ApiProperty({ example: 'NewSecret123!@#' })
  @IsString()
  @IsNotEmpty()
  newPassword!: string;
}

export class CreateStaffDto {
  @ApiProperty({ example: 'support@brightloop.local' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'StaffPass123!@#' })
  @IsString()
  @IsNotEmpty()
  password!: string;

  @ApiProperty({ example: 'STAFF', enum: ['STAFF', 'ADMIN'] })
  @IsIn(['STAFF', 'ADMIN'])
  role!: 'STAFF' | 'ADMIN';
}
