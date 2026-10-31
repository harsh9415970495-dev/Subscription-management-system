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
import { DiscountsService } from '../application/discounts.service';
import {
  CreateDiscountRequestDto,
  EvaluateDiscountsRequestDto,
  UpdateDiscountRequestDto,
} from './dto/discount.dto';

@ApiTags('Discounts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('discounts')
export class DiscountsController {
  constructor(private readonly discountsService: DiscountsService) {}

  @Get()
  @ApiOperation({ summary: 'List all discount and promotional rules' })
  async listDiscounts(@Query('activeOnly') activeOnly?: string) {
    return this.discountsService.listDiscounts(activeOnly === 'true');
  }

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create new discount rule (Admin only)' })
  async createDiscount(@Body() dto: CreateDiscountRequestDto) {
    return this.discountsService.createDiscount(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get discount rule detail by ID' })
  async getDiscount(@Param('id') id: string) {
    return this.discountsService.getDiscountById(id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update discount rule (Admin only)' })
  async updateDiscount(
    @Param('id') id: string,
    @Body() dto: UpdateDiscountRequestDto,
  ) {
    return this.discountsService.updateDiscount(id, dto);
  }

  @Post('evaluate')
  @ApiOperation({ summary: 'Live evaluation of discount rules and coupons on order lines' })
  async evaluateDiscounts(@Body() dto: EvaluateDiscountsRequestDto) {
    return this.discountsService.evaluateDiscountsForContext(
      {
        lines: dto.lines.map((l) => ({
          lineId: l.lineId,
          productId: l.productId,
          unitPrice: l.unitPrice,
          quantity: l.quantity,
          amount: Math.round(l.unitPrice * l.quantity),
        })),
        asOfDate: new Date(),
      },
      dto.couponCodes,
    );
  }
}
