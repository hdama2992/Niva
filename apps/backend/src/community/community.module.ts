import { Module } from '@nestjs/common';
import { FirebaseModule } from '../firebase/firebase.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';
import { CommunityController } from './community.controller';
import { CommunityService } from './community.service';

@Module({
  imports: [FirebaseModule, NotificationsModule, UsersModule],
  controllers: [CommunityController],
  providers: [CommunityService],
})
export class CommunityModule {}
