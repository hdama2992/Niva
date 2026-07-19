import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AdminModule } from './admin/admin.module';
import { AccountLifecycleModule } from './account-lifecycle/account-lifecycle.module';
import { AuthModule } from './auth/auth.module';
import { BetaModule } from './beta/beta.module';
import { CommunityModule } from './community/community.module';
import { FirebaseModule } from './firebase/firebase.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { HealthModule } from './health/health.module';
import { validateEnvironment } from './config/environment';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: Number(process.env.NIVA_RATE_LIMIT_TTL_MS ?? 60_000),
        limit: Number(process.env.NIVA_RATE_LIMIT_REQUESTS ?? 120),
      },
    ]),
    PrismaModule,
    FirebaseModule,
    AccountLifecycleModule,
    UsersModule,
    AuthModule,
    BetaModule,
    AdminModule,
    CommunityModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
