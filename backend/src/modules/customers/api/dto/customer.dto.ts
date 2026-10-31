import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsOptional, IsString } from 'class-validator';
import { BillingAddress } from '../../infrastructure/schema';

export class UpdateCustomerDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  billingAddress?: BillingAddress;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  taxId?: string;
}
