import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import PgBoss from 'pg-boss';
import { CONFIG } from '../config';

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private boss: PgBoss;

  constructor() {
    this.boss = new PgBoss({
      connectionString: CONFIG.databaseUrlDirect,
      schema: 'pgboss',
    });
  }

  async onModuleInit() {
    try {
      await this.boss.start();
      console.log('[QueueService] pg-boss started successfully on direct connection.');
    } catch (err) {
      console.warn('[QueueService] pg-boss start deferred (database may not be ready):', (err as Error).message);
    }
  }

  async onModuleDestroy() {
    try {
      await this.boss.stop();
    } catch (err) {
      console.error('[QueueService] Error stopping pg-boss:', err);
    }
  }

  getBoss(): PgBoss {
    return this.boss;
  }

  async send(queueName: string, data: object, options?: PgBoss.SendOptions): Promise<string | null> {
    if (options) {
      return await this.boss.send(queueName, data, options);
    }
    return await this.boss.send(queueName, data);
  }

  async schedule(queueName: string, cron: string, data: object, options?: PgBoss.ScheduleOptions): Promise<void> {
    if (options) {
      await this.boss.schedule(queueName, cron, data, options);
    } else {
      await this.boss.schedule(queueName, cron, data);
    }
  }
}
