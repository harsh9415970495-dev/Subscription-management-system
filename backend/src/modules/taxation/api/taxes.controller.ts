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
import { TaxationService } from '../application/taxation.service';
import {
  CalculateTaxPreviewRequestDto,
  CreateTaxRuleRequestDto,
  UpdateTaxRuleRequestDto,
} from './dto/tax.dto';

@ApiTags('Taxation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('taxation/tax-rules')
export class TaxesController {
  constructor(private readonly taxationService: TaxationService) {}

  @Get()
  @ApiOperation({ summary: 'List all tax rules' })
  async listTaxRules(@Query('activeOnly') activeOnly?: string) {
    return this.taxationService.listTaxRules(activeOnly === 'true');
  }

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create a new tax rule (Admin only)' })
  async createTaxRule(@Body() dto: CreateTaxRuleRequestDto) {
    return this.taxationService.createTaxRule(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tax rule by ID' })
  async getTaxRule(@Param('id') id: string) {
    return this.taxationService.getTaxRuleById(id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update an existing tax rule (Admin only)' })
  async updateTaxRule(
    @Param('id') id: string,
    @Body() dto: UpdateTaxRuleRequestDto,
  ) {
    return this.taxationService.updateTaxRule(id, dto);
  }

  @Post('preview')
  @ApiOperation({ summary: 'Calculate multi-line tax breakdown preview' })
  async calculateTaxPreview(@Body() dto: CalculateTaxPreviewRequestDto) {
    return this.taxationService.calculateTaxForMultipleLines(dto.lines);
  }
}
