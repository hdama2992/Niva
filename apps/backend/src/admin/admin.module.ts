import { Module } from '@nestjs/common';
import { FirebaseModule } from '../firebase/firebase.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersModule } from '../users/users.module';
import { AdminController } from './admin.controller';
import { AdminAccessGuard } from './admin-access.guard';
import { AdminKeyGuard } from './admin-key.guard';
import { AdminService } from './admin.service';

@Module({
  imports: [FirebaseModule, NotificationsModule, PrismaModule, UsersModule],
  controllers: [AdminController],
  providers: [AdminAccessGuard, AdminKeyGuard, AdminService],
})
export class AdminModule {}
