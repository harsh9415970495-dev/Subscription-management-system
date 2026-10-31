import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateProductRequestDto {
  @ApiProperty({ example: 'Cloud ERP Software Suite' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'SOFTWARE',
    enum: ['SERVICE', 'SOFTWARE', 'ADD_ON', 'PHYSICAL'],
  })
  @IsIn(['SERVICE', 'SOFTWARE', 'ADD_ON', 'PHYSICAL'])
  type: 'SERVICE' | 'SOFTWARE' | 'ADD_ON' | 'PHYSICAL';

  @ApiProperty({ example: 200000, description: 'Sales price in integer minor units (paise)' })
  @IsInt()
  @Min(0)
  salesPrice: number;

  @ApiPropertyOptional({ example: 80000, description: 'Cost price in integer minor units (paise)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  costPrice?: number;

  @ApiPropertyOptional({ example: 'Primary modular cloud ERP license' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateProductRequestDto {
  @ApiPropertyOptional({ example: 'Cloud ERP Software Suite v2' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: ['SERVICE', 'SOFTWARE', 'ADD_ON', 'PHYSICAL'] })
  @IsOptional()
  @IsIn(['SERVICE', 'SOFTWARE', 'ADD_ON', 'PHYSICAL'])
  type?: 'SERVICE' | 'SOFTWARE' | 'ADD_ON' | 'PHYSICAL';

  @ApiPropertyOptional({ example: 220000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  salesPrice?: number;

  @ApiPropertyOptional({ example: 85000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  costPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class CreateVariantRequestDto {
  @ApiProperty({ example: 'Brand' })
  @IsString()
  @IsNotEmpty()
  attribute: string;

  @ApiProperty({ example: 'Odoo' })
  @IsString()
  @IsNotEmpty()
  value: string;

  @ApiProperty({ example: 56000, description: 'Extra price in integer minor units (paise)' })
  @IsInt()
  extraPrice: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateVariantRequestDto {
  @ApiPropertyOptional({ example: 'Brand' })
  @IsOptional()
  @IsString()
  attribute?: string;

  @ApiPropertyOptional({ example: 'Odoo Enterprise' })
  @IsOptional()
  @IsString()
  value?: string;

  @ApiPropertyOptional({ example: 60000 })
  @IsOptional()
  @IsInt()
  extraPrice?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class EffectivePriceQueryDto {
  @ApiPropertyOptional({ example: 'var_01jk9odoo00000000000001' })
  @IsOptional()
  @IsString()
  variantId?: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity?: number;
}
