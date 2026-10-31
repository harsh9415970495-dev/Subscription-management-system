import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, Roles, RolesGuard } from '../../../shared/auth';
import { CatalogService } from '../application/catalog.service';
import {
  CreateProductRequestDto,
  CreateVariantRequestDto,
  EffectivePriceQueryDto,
  UpdateProductRequestDto,
} from './dto/product.dto';

@ApiTags('Catalog')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('catalog/products')
export class ProductsController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get()
  @ApiOperation({ summary: 'List all products with active variants' })
  async listProducts(
    @Query('type') type?: string,
    @Query('activeOnly') activeOnly?: string,
  ) {
    return this.catalogService.listProducts(activeOnly === 'true', type);
  }

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create new product (Admin only)' })
  async createProduct(@Body() dto: CreateProductRequestDto) {
    return this.catalogService.createProduct(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product detail with all variants' })
  async getProduct(@Param('id') id: string) {
    return this.catalogService.getProductById(id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update product properties (Admin only)' })
  async updateProduct(
    @Param('id') id: string,
    @Body() dto: UpdateProductRequestDto,
  ) {
    return this.catalogService.updateProduct(id, dto);
  }

  @Get(':id/price')
  @ApiOperation({ summary: 'Preview effective product price with variant adjustments' })
  async getEffectivePrice(
    @Param('id') id: string,
    @Query() query: EffectivePriceQueryDto,
  ) {
    return this.catalogService.getEffectivePrice(
      id,
      query.variantId,
      query.quantity ?? 1,
    );
  }

  @Post(':id/variants')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Add a new variant to a product (Admin only)' })
  async createVariant(
    @Param('id') id: string,
    @Body() dto: CreateVariantRequestDto,
  ) {
    return this.catalogService.createVariant(id, dto);
  }
}
