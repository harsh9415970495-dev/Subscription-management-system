import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from '../application/auth.service';
import { CreateStaffDto } from './dto/auth.dto';
import {
  CurrentUser,
  JwtAuthGuard,
  Roles,
  RolesGuard,
} from '../../../shared/auth';

@ApiTags('Staff')
@Controller('staff')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class StaffController {
  constructor(private readonly authService: AuthService) {}

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create a new staff or admin user (Admin only)' })
  @ApiResponse({ status: 201, description: 'Staff created' })
  @ApiResponse({ status: 403, description: 'Forbidden for non-admin' })
  async createStaff(
    @Body() dto: CreateStaffDto,
    @CurrentUser('email') creatorEmail: string,
  ) {
    return await this.authService.createStaff(dto, creatorEmail);
  }

  @Get()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'List all staff members (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of staff members' })
  @ApiResponse({ status: 403, description: 'Forbidden for non-admin' })
  async listStaff() {
    return await this.authService.listStaff();
  }
}
