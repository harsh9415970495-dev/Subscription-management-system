import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreatePlanRequestDto {
  @ApiProperty({ example: 'Startup Modular ERP Monthly' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 0, description: 'Base plan recurring fee in paise (default 0 for line-item only)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  price?: number;

  @ApiProperty({
    example: 'MONTHLY',
    enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'],
  })
  @IsIn(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'])
  billingPeriod: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  minQuantity?: number;

  @ApiPropertyOptional({ example: '2026-01-01T00:00:00Z' })
  @IsOptional()
  availableFrom?: string;

  @ApiPropertyOptional({ example: '2027-12-31T23:59:59Z' })
  @IsOptional()
  availableTo?: string;

  @ApiPropertyOptional({ example: true, default: true, description: 'Auto close subscription at expiry' })
  @IsOptional()
  @IsBoolean()
  autoCloseOnEnd?: boolean;

  @ApiPropertyOptional({ example: true, default: true, description: 'Allows manual closing' })
  @IsOptional()
  @IsBoolean()
  closable?: boolean;

  @ApiPropertyOptional({ example: false, default: false, description: 'Allows pausing subscriptions' })
  @IsOptional()
  @IsBoolean()
  pausable?: boolean;

  @ApiPropertyOptional({ example: true, default: true, description: 'Allows renewals' })
  @IsOptional()
  @IsBoolean()
  renewable?: boolean;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdatePlanRequestDto {
  @ApiPropertyOptional({ example: 'Startup Modular ERP Monthly v2' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 50000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'] })
  @IsOptional()
  @IsIn(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'])
  billingPeriod?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  minQuantity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  availableFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  availableTo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  autoCloseOnEnd?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  closable?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  pausable?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  renewable?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
