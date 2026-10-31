import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  JwtAuthGuard,
  Roles,
  RolesGuard,
} from '../../../shared/auth';
import { CustomersService } from '../application/customers.service';
import { UpdateCustomerDto } from './dto/customer.dto';

@ApiTags('Customers')
@Controller('customers')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @Roles('ADMIN', 'STAFF')
  @ApiOperation({ summary: 'List all customers with optional search (Staff & Admin)' })
  @ApiResponse({ status: 200, description: 'Customer list' })
  @ApiResponse({ status: 403, description: 'Forbidden for customers' })
  async list(@Query('search') search?: string) {
    return await this.customersService.listCustomers(search);
  }

  @Get(':id')
  @Roles('ADMIN', 'STAFF', 'CUSTOMER')
  @ApiOperation({ summary: 'Get customer profile (Scoped: Customer A cannot access Customer B -> 404)' })
  @ApiResponse({ status: 200, description: 'Customer details' })
  @ApiResponse({ status: 404, description: 'Customer resource not found' })
  async getById(
    @Param('id') id: string,
    @CurrentUser('role') role: string,
    @CurrentUser('customerId') customerId?: string | null,
  ) {
    return await this.customersService.getCustomerById(id, role, customerId);
  }

  @Patch(':id')
  @Roles('ADMIN', 'STAFF', 'CUSTOMER')
  @ApiOperation({ summary: 'Update customer billing address, company, or tax ID' })
  @ApiResponse({ status: 200, description: 'Updated customer' })
  @ApiResponse({ status: 404, description: 'Customer resource not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
    @CurrentUser('role') role: string,
    @CurrentUser('customerId') customerId?: string | null,
  ) {
    return await this.customersService.updateCustomer(id, dto, role, customerId);
  }
}
