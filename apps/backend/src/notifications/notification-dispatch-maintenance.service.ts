import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotificationService } from './notification.service';

const minimumIntervalMinutes = 1;

/**
 * Optional single-instance queue worker. It is inactive until deployment sets
 * NIVA_NOTIFICATION_DISPATCH_MINUTES, while the admin endpoint stays useful
 * for an operator-controlled closed beta.
 */
@Injectable()
export class NotificationDispatchMaintenanceService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(
    NotificationDispatchMaintenanceService.name,
  );
  private timer?: ReturnType<typeof setInterval>;

  constructor(
    private readonly configService: ConfigService,
    private readonly notifications: NotificationService,
  ) {}

  onModuleInit() {
    const minutes = Number.parseInt(
      this.configService.get<string>('NIVA_NOTIFICATION_DISPATCH_MINUTES') ??
        '',
      10,
    );

    if (!Number.isFinite(minutes) || minutes < minimumIntervalMinutes) {
      return;
    }

    this.timer = setInterval(() => {
      void this.dispatch().catch((error: unknown) => {
        this.logger.error('Notification delivery dispatch failed.', error);
      });
    }, minutes * 60_000);
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  dispatch() {
    return this.notifications.dispatchPending();
  }
}
