import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from './users.service';

const minimumIntervalMinutes = 15;

/**
 * Rebuilds derived trust profiles from durable TrustEvent rows. It is disabled
 * by default; closed-beta deployments can opt in with an interval setting.
 */
@Injectable()
export class TrustMaintenanceService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TrustMaintenanceService.name);
  private timer?: ReturnType<typeof setInterval>;

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {}

  onModuleInit() {
    const minutes = Number.parseInt(
      this.configService.get<string>('NIVA_TRUST_RECALCULATION_MINUTES') ?? '',
      10,
    );

    if (!Number.isFinite(minutes) || minutes < minimumIntervalMinutes) {
      return;
    }

    this.timer = setInterval(() => {
      void this.recalculate().catch((error: unknown) => {
        this.logger.error('Trust recalculation failed.', error);
      });
    }, minutes * 60_000);
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  recalculate() {
    return this.usersService.recalculateAllTrustScores();
  }
}
