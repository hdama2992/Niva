import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { NotificationDispatchMaintenanceService } from './notification-dispatch-maintenance.service';
import { NotificationService } from './notification.service';

@Module({
  imports: [PrismaModule, RealtimeModule],
  providers: [NotificationDispatchMaintenanceService, NotificationService],
  exports: [NotificationDispatchMaintenanceService, NotificationService],
})
export class NotificationsModule {}
