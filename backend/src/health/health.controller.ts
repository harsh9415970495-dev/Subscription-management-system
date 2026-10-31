import { Controller, Get, Inject } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { sql } from 'drizzle-orm';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DB_CLIENT } from '../shared/database/database.provider';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(@Inject(DB_CLIENT) private readonly db: PostgresJsDatabase) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Application and database connectivity status' })
  async check() {
    let dbStatus = 'disconnected';
    try {
      await this.db.execute(sql`SELECT 1`);
      dbStatus = 'connected';
    } catch (err) {
      dbStatus = `unreachable: ${(err as Error).message}`;
    }

    return {
      status: 'ok',
      database: dbStatus,
      timestamp: new Date().toISOString(),
    };
  }
}
