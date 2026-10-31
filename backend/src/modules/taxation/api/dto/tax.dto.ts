import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateTaxRuleRequestDto {
  @ApiProperty({ example: 'Standard GST 18%' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 1800, description: 'Basis points: 1800 = 18.00%, 500 = 5.00%' })
  @IsInt()
  @Min(0)
  @Max(10000)
  rateBp: number;

  @ApiProperty({
    example: 'ALL',
    enum: ['ALL', 'PRODUCT_TYPE', 'SPECIFIC_PRODUCTS'],
  })
  @IsIn(['ALL', 'PRODUCT_TYPE', 'SPECIFIC_PRODUCTS'])
  appliesTo: 'ALL' | 'PRODUCT_TYPE' | 'SPECIFIC_PRODUCTS';

  @ApiPropertyOptional({ example: ['SERVICE', 'SOFTWARE'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  productTypes?: string[];

  @ApiPropertyOptional({ example: ['prod_01jk9erp000000000000001'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  productIds?: string[];

  @ApiPropertyOptional({ example: '2026-01-01T00:00:00Z' })
  @IsOptional()
  validFrom?: string;

  @ApiPropertyOptional({ example: '2028-12-31T23:59:59Z' })
  @IsOptional()
  validTo?: string;

  @ApiPropertyOptional({ example: 10, default: 10 })
  @IsOptional()
  @IsInt()
  priority?: number;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateTaxRuleRequestDto {
  @ApiPropertyOptional({ example: 'Standard GST 18% (Updated)' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 1800 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10000)
  rateBp?: number;

  @ApiPropertyOptional({ enum: ['ALL', 'PRODUCT_TYPE', 'SPECIFIC_PRODUCTS'] })
  @IsOptional()
  @IsIn(['ALL', 'PRODUCT_TYPE', 'SPECIFIC_PRODUCTS'])
  appliesTo?: 'ALL' | 'PRODUCT_TYPE' | 'SPECIFIC_PRODUCTS';

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  productTypes?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  productIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  validFrom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  validTo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  priority?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class TaxPreviewLineDto {
  @ApiPropertyOptional({ example: 'line_1' })
  @IsOptional()
  @IsString()
  lineId?: string;

  @ApiPropertyOptional({ example: 'prod_01jk9erp000000000000001' })
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiPropertyOptional({ example: 'SOFTWARE' })
  @IsOptional()
  @IsString()
  productType?: string;

  @ApiProperty({ example: 200000, description: 'Line amount in minor units (paise)' })
  @IsInt()
  @Min(0)
  amount: number;
}

export class CalculateTaxPreviewRequestDto {
  @ApiProperty({ type: [TaxPreviewLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TaxPreviewLineDto)
  lines: TaxPreviewLineDto[];
}
