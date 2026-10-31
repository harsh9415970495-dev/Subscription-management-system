import { Module } from '@nestjs/common';
import { NotificationsFacade } from './application/notifications.facade';

@Module({
  providers: [NotificationsFacade],
  exports: [NotificationsFacade],
})
export class NotificationsModule {}
