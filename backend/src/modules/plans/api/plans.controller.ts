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
import { PlansService } from '../application/plans.service';
import { CreatePlanRequestDto, UpdatePlanRequestDto } from './dto/plan.dto';

@ApiTags('Plans')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get()
  @ApiOperation({ summary: 'List all recurring subscription plans' })
  async listPlans(@Query('activeOnly') activeOnly?: string) {
    return this.plansService.listPlans(activeOnly === 'true');
  }

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create a new subscription plan (Admin only)' })
  async createPlan(@Body() dto: CreatePlanRequestDto) {
    return this.plansService.createPlan(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get subscription plan details by ID' })
  async getPlan(@Param('id') id: string) {
    return this.plansService.getPlanById(id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update subscription plan lifecycle parameters (Admin only)' })
  async updatePlan(
    @Param('id') id: string,
    @Body() dto: UpdatePlanRequestDto,
  ) {
    return this.plansService.updatePlan(id, dto);
  }

  @Get(':id/availability')
  @ApiOperation({ summary: 'Check if plan is currently available for ordering' })
  async checkAvailability(
    @Param('id') id: string,
    @Query('asOfDate') asOfDate?: string,
  ) {
    const targetDate = asOfDate ? new Date(asOfDate) : new Date();
    const available = await this.plansService.isPlanAvailable(id, targetDate);
    return { planId: id, asOfDate: targetDate.toISOString(), available };
  }
}
