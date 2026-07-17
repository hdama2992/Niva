import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    FirebaseModule,
    AccountLifecycleModule,
    UsersModule,
    AuthModule,
    BetaModule,
    AdminModule,
    CommunityModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
