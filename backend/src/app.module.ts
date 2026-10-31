import { Module } from '@nestjs/common';
import { DatabaseModule } from './shared/database/database.module';
import { QueueModule } from './shared/queue/queue.module';
import { HealthModule } from './health/health.module';

// 12 Domain Modules
import { IdentityModule } from './modules/identity';
import { CustomersModule } from './modules/customers';
import { CatalogModule } from './modules/catalog';
import { PlansModule } from './modules/plans';
import { TaxationModule } from './modules/taxation';
import { DiscountsModule } from './modules/discounts';
import { SubscriptionsModule } from './modules/subscriptions';
import { BillingModule } from './modules/billing';
import { PaymentsModule } from './modules/payments';
import { ReportingModule } from './modules/reporting';
import { NotificationsModule } from './modules/notifications';
import { AuditModule } from './modules/audit';

@Module({
  imports: [
    DatabaseModule,
    QueueModule,
    HealthModule,
    IdentityModule,
    CustomersModule,
    CatalogModule,
    PlansModule,
    TaxationModule,
    DiscountsModule,
    SubscriptionsModule,
    BillingModule,
    PaymentsModule,
    ReportingModule,
    NotificationsModule,
    AuditModule,
  ],
})
export class AppModule {}
