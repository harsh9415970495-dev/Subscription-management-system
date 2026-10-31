import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
// Namespace import for CJS/ESM interop on Node 24
import * as PgBossModule from 'pg-boss';
import { CONFIG } from '../config';

// Runtime constructor — works whether the package exposes .default (ESM) or is itself callable (CJS)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const PgBoss = ((PgBossModule as any).default ?? PgBossModule) as typeof import('pg-boss');
// Instance type alias (does NOT conflict with the value above)
type PgBossInstance = import('pg-boss');
// Sub-type aliases for option objects
type SendOptions = import('pg-boss').SendOptions;
type ScheduleOptions = import('pg-boss').ScheduleOptions;

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private boss: PgBossInstance;

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

  getBoss(): PgBossInstance {
    return this.boss;
  }

  async send(queueName: string, data: object, options?: SendOptions): Promise<string | null> {
    if (options) {
      return await this.boss.send(queueName, data, options);
    }
    return await this.boss.send(queueName, data);
  }

  async schedule(queueName: string, cron: string, data: object, options?: ScheduleOptions): Promise<void> {
    if (options) {
      await this.boss.schedule(queueName, cron, data, options);
    } else {
      await this.boss.schedule(queueName, cron, data);
    }
  }
}
