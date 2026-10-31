import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDiscountRequestDto {
  @ApiProperty({ example: 'WELCOME10', description: 'Unique uppercase discount code' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 'PERCENTAGE', enum: ['PERCENTAGE', 'FIXED'] })
  @IsIn(['PERCENTAGE', 'FIXED'])
  type: 'PERCENTAGE' | 'FIXED';

  @ApiProperty({
    example: 1000,
    description: 'Basis points for PERCENTAGE (1000 = 10%) or paise for FIXED (50000 = ₹500)',
  })
  @IsInt()
  @Min(0)
  value: number;

  @ApiPropertyOptional({ example: 0, description: 'Minimum purchase amount in paise' })
  @IsOptional()
  @IsInt()
  @Min(0)
  minPurchaseAmount?: number;

  @ApiPropertyOptional({ example: 1, description: 'Minimum order quantity' })
  @IsOptional()
  @IsInt()
  @Min(1)
  minQuantity?: number;

  @ApiPropertyOptional({ example: '2026-01-01T00:00:00Z' })
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-12-31T23:59:59Z' })
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ example: 100, description: 'Maximum total redemptions allowed' })
  @IsOptional()
  @IsInt()
  @Min(1)
  usageLimit?: number;

  @ApiProperty({ example: 'SUBSCRIPTIONS', enum: ['PRODUCTS', 'SUBSCRIPTIONS'] })
  @IsIn(['PRODUCTS', 'SUBSCRIPTIONS'])
  scope: 'PRODUCTS' | 'SUBSCRIPTIONS';

  @ApiPropertyOptional({
    example: ['prod_01jk9erp000000000000001'],
    description: 'Target product IDs if scope is PRODUCTS',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetIds?: string[];

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateDiscountRequestDto {
  @ApiPropertyOptional({ example: 'WELCOME20' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ enum: ['PERCENTAGE', 'FIXED'] })
  @IsOptional()
  @IsIn(['PERCENTAGE', 'FIXED'])
  type?: 'PERCENTAGE' | 'FIXED';

  @ApiPropertyOptional({ example: 2000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  value?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(0)
  minPurchaseAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  minQuantity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  usageLimit?: number;

  @ApiPropertyOptional({ enum: ['PRODUCTS', 'SUBSCRIPTIONS'] })
  @IsOptional()
  @IsIn(['PRODUCTS', 'SUBSCRIPTIONS'])
  scope?: 'PRODUCTS' | 'SUBSCRIPTIONS';

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class EvaluationLineDto {
  @ApiProperty({ example: 'line_1' })
  @IsString()
  lineId: string;

  @ApiProperty({ example: 'prod_01jk9erp000000000000001' })
  @IsString()
  productId: string;

  @ApiProperty({ example: 100000, description: 'Unit price in paise' })
  @IsInt()
  @Min(0)
  unitPrice: number;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  quantity: number;
}

export class EvaluateDiscountsRequestDto {
  @ApiProperty({ type: [EvaluationLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EvaluationLineDto)
  lines: EvaluationLineDto[];

  @ApiPropertyOptional({ example: ['WELCOME10', 'ERP20'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  couponCodes?: string[];
}
