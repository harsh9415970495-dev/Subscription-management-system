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
import { PaymentTermsService } from '../application/payment-terms.service';
import {
  CreatePaymentTermRequestDto,
  UpdatePaymentTermRequestDto,
} from './dto/payment-term.dto';

@ApiTags('Payment Terms')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('subscriptions/payment-terms')
export class PaymentTermsController {
  constructor(private readonly paymentTermsService: PaymentTermsService) {}

  @Get()
  @ApiOperation({ summary: 'List all payment terms' })
  async listPaymentTerms(@Query('activeOnly') activeOnly?: string) {
    return this.paymentTermsService.listPaymentTerms(activeOnly === 'true');
  }

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create a new payment term (Admin only)' })
  async createPaymentTerm(@Body() dto: CreatePaymentTermRequestDto) {
    return this.paymentTermsService.createPaymentTerm(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment term by ID' })
  async getPaymentTerm(@Param('id') id: string) {
    return this.paymentTermsService.getPaymentTermById(id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update payment term (Admin only)' })
  async updatePaymentTerm(
    @Param('id') id: string,
    @Body() dto: UpdatePaymentTermRequestDto,
  ) {
    return this.paymentTermsService.updatePaymentTerm(id, dto);
  }
}
